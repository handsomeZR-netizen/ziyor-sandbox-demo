(function () {
  // 本地规则引擎：不依赖大模型，把文字描述拆成工况要素，再从资产库和处置片段库里拼出场景图与分支剧本。
  const ZY = window.ZY;
  const has = (t, ks) => ks.some((k) => t.indexOf(k) >= 0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const C = (text, verdict, score, dims, result, why, extra) => Object.assign({ text, verdict, score, dims, result, why }, extra || {});

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const HINTS = {
    ladle: [['穿包', '漏包', '包底', '钢包漏', '钢包穿', '吊运钢包', '钢包吊运', '钢包倾翻'], 3],
    breakout: [['结晶器', '连铸', '中间包', '铸坯', '二冷', '浇注', '浇钢', '拉坯', '漏钢'], 1],
    confined: [['有限空间', '受限空间', '阀门井', '井下', '下井', '井内', '井口', '储罐', '罐内', '地坑', '窒息', '缺氧', '失去应答', '没有回应', '检查井', '人孔'], 1.5],
    gas: [['煤气', '一氧化碳', 'CO', '报警仪', '中毒', '泄漏', '毒气', '氮气'], 1],
    crane: [['天车', '行车', '吊运', '起重', '钢丝绳', '吊物', '吊钩', '吊具', '钢卷', '脱钩', '溜钩', '吊装'], 1],
    electric: [['配电', '电缆', '开关柜', '低压柜', '变压器', '触电', '漏电', '电弧', '电火花', '短路', '电气', '电柜', '母线', '高压'], 1],
    splash: [['喷溅', '爆溅', '钢水', '铁水', '出钢', '转炉', '钢包', '炉前', '钢渣', '兑铁', '吹炼', '炉口', '溢出', '漫出', '熔融', '出铁', '主沟'], 1],
    fire: [['着火', '起火', '火灾', '冒烟', '燃烧', '火情', '失火', '明火'], 1]
  };

  const SURNAMES = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤';
  const NAME_POOL = ['老王', '老李', '小张', '小刘', '老赵', '小陈', '老周', '小孙', '老马', '小吴'];
  const CN_NUM = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

  // 资产库外的常见设备：有相近资产就替代，没有就放带标签的占位体
  const EXTRA = [
    ['鱼雷罐', null], ['铁水罐', 'ladle'], ['渣罐', 'ladle'], ['渣包', 'ladle'], ['氧枪', null], ['液压站', null], ['热风炉', null],
    ['烧结机', null], ['皮带机', null], ['皮带', null], ['输送带', null], ['除尘器', null], ['水泵', null], ['空压机', null], ['油库', null],
    ['变压器', 'switchgear'], ['叉车', 'truck'], ['货车', 'truck'], ['轧机', null], ['加热炉', null], ['电焊机', null], ['氧气瓶', null],
    ['乙炔瓶', null], ['气瓶', null], ['风机', 'blower'], ['脚手架', null], ['电机', null], ['减速机', null], ['蓄电池', null], ['油箱', null]
  ];

  function extractNames(t) {
    const out = [];
    const re = new RegExp(`(老|小)([${SURNAMES}])`, 'g');
    let m;
    while ((m = re.exec(t))) if (out.indexOf(m[0]) < 0) out.push(m[0]);
    const re2 = new RegExp(`([${SURNAMES}])师傅`, 'g');
    while ((m = re2.exec(t))) if (out.indexOf(m[0]) < 0) out.push(m[0]);
    return out.slice(0, 3);
  }

  function extractEquipment(t) {
    const found = [];
    for (const [k, asset] of EXTRA) {
      if (t.indexOf(k) < 0) continue;
      if (found.some((f) => f.text.indexOf(k) >= 0)) continue;
      found.push({ text: k, asset });
    }
    return found;
  }

  function analyze(desc, opts) {
    opts = opts || {};
    const t = String(desc || '') + ' ' + (opts.role || '');
    const scores = {};
    for (const k in HINTS) scores[k] = HINTS[k][0].reduce((n, w) => n + (t.indexOf(w) >= 0 ? w.length : 0), 0) * HINTS[k][1];
    if (scores.electric > 0) scores.fire = 0;
    if (scores.confined > 0) scores.gas *= 0.5;
    if (scores.ladle > 0) scores.breakout *= 0.5;
    let family = 'generic', best = 0;
    for (const k in scores) if (scores[k] > best) {
      best = scores[k];
      family = k;
    }
    const names = extractNames(t);
    const mods = {
      water: has(t, ['积水', '潮湿', '漏水', '水坑', '下雨', '雨水', '有水', '进水', '渗水', '冷却水泄漏']),
      victim: has(t, ['倒地', '倒在', '晕倒', '昏迷', '受伤', '烫伤', '烧伤', '被困', '受困', '困在', '失去应答', '没有回应', '没反应', '压住', '砸伤', '摔倒', '晕厥', '不省人事']),
      people: names.length > 0 || has(t, ['同事', '工友', '有人', '人员', '工人', '一名', '两名', '二名', '三名', '几名', '旁边还有', '师傅', '巡检工', '清理工', '检修工', '贴标工', '作业人员']),
      below: has(t, ['下方有人', '下面有人', '前方有人', '路线上有人', '下方还有', '吊物下', '下方作业', '通道上有人', '前方作业']),
      night: has(t, ['夜班', '夜间', '晚上', '凌晨', '深夜']),
      oil: has(t, ['油', '液压']),
      shock: has(t, ['触电', '电击', '漏电', '被电'])
    };
    if (mods.victim || mods.below) mods.people = true;
    const cm = t.match(/([一二两三四五六七八九十\d]+)\s*(?:名|个|位)/);
    const count = cm ? Number(cm[1]) || CN_NUM[cm[1]] || null : null;
    const mm = t.match(/(\d+(?:\.\d+)?)\s*(?:米|m)/);
    const um = t.match(/(\d+)\s*号\s*(转炉|连铸机|高炉|天车|行车|配电室|阀门井|开关柜|低压柜|钢包|储罐)/);
    const rm = t.match(/(?:你是|学员岗位[:：]?|岗位[:：])\s*([一-龥]{2,7}?)(?:[，,。；;）)\s]|$)/);
    return {
      family, scores, mods, names, count,
      meters: mm ? Math.round(Number(mm[1])) : null,
      unit: um ? `${um[1]} 号${um[2]}` : null,
      role: opts.role || (rm ? rm[1] : null),
      equipment: extractEquipment(t)
    };
  }

  // ---------- 共用片段 ----------

  function reportNode(ctx, o) {
    const ask = o.asker || ctx.leader;
    return {
      title: o.title || '报告险情',
      text: (o.intro || '') + `${ask}在对讲机里急促地问："现场什么情况？"你需要在最短时间内讲清楚。`,
      view: o.view, time: 15, set: o.set,
      choices: [
        C(o.best, 'best', 20, { report: 3, rule: 1, risk: 1 }, o.bestResult || `${ask}立即按预案组织处置，并通知相关人员按程序进场。`, '报告讲清了地点、险情、次生风险和人员情况，指挥人员可以马上作出决策。'),
        C('"出大事了！快来人！"', 'wrong', 4, { report: -2 }, `${ask}追问了好几遍才弄清楚发生了什么，处置指令晚了将近一分钟。`, '信息不完整的报告会延误决策。应急报告至少要包括地点、险情、人员情况和已采取的措施。'),
        o.wrong || C('"等我弄清楚情况再报告。"', 'poor', 6, { report: -1, respond: -1 }, '你又在现场观察了几分钟，错过了最佳的报告时机。', '险情报告要"先报后查"：先把已掌握的情况报上去，细节可以随后补充。')
      ]
    };
  }

  function cordonNode(ctx, o) {
    const stop = { npc: {}, prop: { tape: 'show' } };
    stop.npc[o.passer] = { anim: 'idle' };
    return {
      title: o.title || '现场警戒',
      text: o.text, view: o.view, time: 12, set: o.set,
      choices: [
        C(o.bestText || `立即拦住他，说明情况，并在${o.entry || '通道口'}拉起警戒线`, 'best', 20, { risk: 2, respond: 2, rule: 1 }, o.bestResult, '事故现场必须尽快设立警戒，防止不知情的人员进入造成二次伤害。', { act: o.stopAct || stop }),
        C('提醒他一句"里面出事了，你自己小心点"', 'poor', 6, { risk: -1, respond: -1 }, o.poorResult || '他"哦"了一声，继续往里走，直到被赶来的班组长喝止。', '口头提醒不能代替警戒。应当明确制止并设置警戒区。'),
        o.wrong
      ]
    };
  }

  function reviewNode(ctx, o) {
    return {
      title: o.title || '事后复盘',
      text: o.text || `险情已经得到控制。安全员组织班组复盘，请你说出这次${ctx.hazard}最可能的直接原因和整改方向。`,
      view: o.view, time: 20, set: o.set,
      choices: [
        C(o.cause, 'best', 20, { risk: 2, rule: 2 }, o.causeResult || '安全员把这一条写进了班前检查表和隐患排查清单。', '找准直接原因并落实到检查制度上，事故复盘才算闭环。'),
        C(o.blame || '主要是当班人员操作不小心', 'poor', 6, { risk: -1, rule: -1 }, '安全员提醒你：个人操作是其中一个因素，但更要找出设备、环境和管理上的直接原因。', '复盘时应先找直接原因和管理漏洞，而不是只关注个人行为。'),
        C('这种事是运气不好，谁也没办法', 'wrong', 0, { risk: -2, rule: -2 }, '安全员摇了摇头。', o.luckWhy || `${ctx.hazard}有明确的诱因和前兆，大多数是可以通过点检和规范操作预防的。`)
      ]
    };
  }

  // ---------- 危险源片段库 ----------

  const F = {};

  F.splash = {
    template: 'bof', category: '高温熔融金属', roleDefault: '炉前工', roles: ['炉前工', '天车工', '班组长'], leader: '班组长',
    keywords: ['钢水', '喷溅', '出钢', '转炉', '钢包', '炉前', '积水', '钢渣', '铁水'],
    setup(ctx) {
      const t = ctx.text;
      ctx.metal = has(t, ['铁水']) ? '铁水' : '钢水';
      ctx.bf = has(t, ['高炉', '出铁', '主沟', '铁口', '渣沟', '出铁场']);
      ctx.overflow = has(t, ['溢出', '漫出', '漫流', '外溢', '溢流', '漫到', '流向']);
      ctx.tapping = !ctx.bf && (has(t, ['出钢']) || !has(t, ['兑铁', '吹炼', '加料']));
      ctx.hazard = ctx.metal + (ctx.overflow ? '漫溢' : '喷溅');
      ctx.src = ctx.bf ? '主沟' : '钢包';
      ctx.place = ctx.bf ? '出铁场' : '出钢跨';
      ctx.location = ctx.bf ? '炼铁厂 · 高炉出铁场' : '炼钢厂 · 转炉出钢跨';
      ctx.unitName = ctx.unit || (ctx.bf ? '1 号高炉' : '2 号转炉');
      ctx.basis = ['《炼钢安全规程》（AQ 2001）关于熔融金属作业区防水、防潮的要求', `企业${ctx.hazard}事故现场处置方案（通用示例）`];
      if (ctx.bf) ctx.basis.unshift('《炼铁安全规程》（AQ 2002）关于出铁场和铁水沟的要求');
    },
    scene(ctx) {
      const m = ctx.mods, props = [], npcs = [], fx = [];
      if (ctx.bf) {
        props.push({ id: 'bf', asset: 'placeholder', slot: 'converter', label: '高炉出铁口', size: 3.2 });
        ctx.unmatch('高炉出铁口', 'placeholder');
        props.push({ id: 'ladle', asset: 'ladle', slot: 'tapping', label: '铁水罐' });
        ctx.unmatch('铁水罐', 'similar', 'ladle');
      } else {
        props.push({ id: 'converter', asset: 'converter', slot: 'converter', tilt: ctx.tapping ? 80 : 35 });
        props.push({ id: 'ladle', asset: 'ladle', slot: 'tapping' });
      }
      props.push(
        { id: 'crane', asset: 'crane', slot: 'crane_bay', hookY: 13 },
        { id: 'breaker', asset: 'breaker_box', slot: 'breaker_near', label: '总电闸', pillar: true },
        { id: 'control', asset: 'control_room', slot: 'control_room' },
        { id: 'exit', asset: 'exit_door', slot: 'exit' },
        { id: 'assembly', asset: 'assembly_point', slot: 'assembly' },
        { id: 'ext', asset: 'fire_extinguisher', slot: 'extinguisher' },
        { id: 'tape', asset: 'barrier', slot: 'cordon', w: 4, hidden: true }
      );
      if (m.water) props.push({ id: 'water', asset: 'puddle', slot: 'under_ladle', r: 2.2, label: ctx.bf ? '积水坑' : '地面积水' });
      if (m.people) npcs.push({ id: 'mate', slot: 'coworker', label: ctx.mateLabel, wear: 'blue', anim: 'work', face: 'tapping' });
      npcs.push({ id: 'fixer', slot: 'exit_in', label: '检修工', wear: 'orange', helmet: 'white', anim: 'idle', hidden: true });
      if (ctx.tapping) fx.push({ id: 'stream', type: 'molten_stream', at: 'converter.tap', to: 'ladle.top', intensity: 1 });
      fx.push({ id: 'splash', type: 'molten_splash', at: 'ladle.top', intensity: 0.12 });
      if (ctx.overflow || ctx.bf) fx.push({ id: 'pool', type: 'molten_pool', at: 'under_ladle', intensity: 0, r: 2.6 });
      if (ctx.bf) fx.push({ id: 'pool2', type: 'molten_pool', at: [0, 0, -9], intensity: 0.6, r: 1.8, seed: 5 });
      if (m.water) fx.push({ id: 'steam', type: 'steam', at: 'water', intensity: 0, r: 1.6 });
      fx.push({ id: 'smoke', type: 'smoke', at: 'ladle.top', intensity: 0.35, r: 1.8 });
      if (!ctx.bf) fx.push({ id: 'mouth', type: 'glow', at: 'converter.mouth', intensity: 0.8 });
      fx.push({ id: 'alarm1', type: 'alarm', at: 'alarm1', intensity: 0 }, { id: 'alarm2', type: 'alarm', at: 'alarm2', intensity: 0 });
      return { template: 'bof', view: 'overview', props, npcs, effects: fx, init: { audio: { rumble: 0.35 } } };
    },
    plan(ctx) {
      const m = ctx.mods, mate = ctx.mate, L = ctx.leader, P = m.people, W = m.water, src = ctx.src, metal = ctx.metal;
      const lead = ctx.bf ? `${ctx.unitName}正在出铁。` : ctx.tapping ? `${ctx.unitName}正在出钢。` : `${ctx.unitName}正在兑铁。`;
      const what = ctx.overflow
        ? `${src}里的${metal}突然漫了出来，火红的${metal}正沿着地面向四周流淌`
        : `${src}附近突然爆发剧烈喷溅，火花和钢渣四处飞溅`;
      const wtr = W ? (ctx.overflow ? `，流淌的方向正是旁边的积水${ctx.bf ? '坑' : '区'}，积水已经开始冒出白汽` : `，${src}下方的积水开始冒出白汽`) : '';
      const ppl = P ? (m.victim ? `${mate}被飞溅的钢渣击中，摔倒在${src}附近。` : `${mate}正踉跄着往后退。`) : '';
      const stopWord = ctx.bf ? '出铁' : '出钢';
      const nodes = [];
      nodes.push({
        title: '发现险情',
        text: `${lead}${what}${wtr}。险情点距离你约 ${ctx.meters || 8} 米。${ppl}`,
        view: 'operator', time: 12,
        set: {
          fx: { splash: ctx.overflow ? 0.5 : 1, pool: 0.85, steam: 0.9, smoke: 0.8, alarm1: 1, alarm2: 1 },
          npc: { mate: m.victim ? { anim: 'fallen' } : { anim: 'retreat', to: 'wang_trip', speed: 0.8 } },
          audio: { alarm: true, rumble: 0.9, hiss: W ? 0.35 : 0 }, shake: 0.5
        },
        choices: [
          C('上前查看情况', 'fatal', 0, { risk: -3, protect: -3, rule: -2 },
            W ? `你朝${src}走近了几步。积水遇高温${metal}瞬间汽化，引发更猛烈的二次喷溅，钢渣迎面泼来。在真实现场，这一步极易造成严重烧伤甚至死亡。` : `你朝${src}走近了几步，一股${metal}夹着钢渣迎面泼来。在真实现场，这一步极易造成严重烧伤甚至死亡。`,
            `${ctx.hazard}的范围和二次喷溅都无法预判。任何人不得靠近险情区查看，第一动作必须是迅速撤离到安全区域。`,
            { act: { view: 'close_ladle', fx: { splash: 1 }, flash: 'ladle.top', flashPower: 1.2, shake: 1.4, vignette: 'fatal' } }),
          C(`直接撤离现场，边撤边用对讲机报告${L}`, 'best', 20, { risk: 2, protect: 3, report: 2, rule: 1 },
            `你转身沿黄色安全通道快速撤离，边跑边用对讲机报告："${ctx.place}${src}${ctx.hazard}${W ? '，地面有积水' : ''}${P ? `，${mate}在${src}附近` : ''}！"`,
            `先让自己脱离危险区，同时第一时间报告险情位置和人员情况，这是${ctx.hazard}时的标准处置顺序。`,
            { act: { view: 'walkway' } }),
          C('撤离前先切断总电闸，再撤离上报', 'poor', 6, { risk: -1, protect: -2, respond: 1, rule: -1 },
            `总电闸装在${src}旁的立柱上。你冒着飞溅的钢渣冲过去拉闸，手臂被烫伤，好在伤得不重，随后撤离并上报。`,
            `在这个场景里，总电闸位于险情区内，拉闸也不是${ctx.role}此刻的首要职责，紧急停机应由主控室执行。如果企业规程规定由本岗位就近断电，且电闸位于安全区，可由专家把这一项改判为合理处置。`,
            { hotspot: 'breaker', act: { view: 'breaker', fx: { splash: 1 }, shake: 0.6 } }),
          P && !m.victim
            ? C(`站在原地大声呼喊${mate}，让他快跑`, 'poor', 8, { risk: 1, protect: -2, rescue: 1, report: -1 },
              `${mate}听到喊声加快了脚步，但你自己仍站在喷溅范围边缘，一块钢渣落在你脚边。`, '提醒同事是对的，但应当边撤离边呼喊，而不是停在危险区里。',
              { act: { npc: { mate: { anim: 'run', to: 'wang_trip' } } } })
            : C('原地蹲下护住头脸，等喷溅停了再走', 'poor', 6, { protect: -1, respond: -2, risk: -1 },
              '你蹲在原地，滚烫的钢渣不断落在身边，过了好一阵险情才减弱，你才敢起身撤离。', '蹲下并不能脱离喷溅范围，喷溅可能持续甚至加剧。正确做法是立即沿安全通道撤离到安全区域。',
              { act: { fx: { splash: 1 }, shake: 0.5 } })
        ],
        timeout: { act: { fx: { splash: 1 }, shake: 0.6 } }
      });
      if (P) nodes.push({
        title: '同事受困',
        text: m.victim
          ? `你撤到安全出口附近。${mate}还倒在${src}附近的通道边，离险情点约 10 米，正挣扎着想爬起来。${ctx.hazard}还没有停。`
          : `你撤到安全出口附近。回头一看，${mate}在通道边摔倒了，离险情点约 10 米，正挣扎着想站起来。${ctx.hazard}还没有停。`,
        view: 'safe', time: 15,
        set: { npc: { mate: { anim: 'fallen', at: 'wang_trip' } }, fx: { splash: 0.85 } },
        choices: [
          C(`立刻冲回去，把${mate}拖出来`, 'wrong', 4, { rescue: 1, protect: -3, risk: -2 },
            '你冲回通道，热浪扑面而来，飞溅的钢渣逼得你几次后退，两个人都被困在危险区边缘，直到喷溅减弱才脱身。',
            '没有评估就盲目施救，是事故扩大的常见原因。施救的前提是确认自身安全，例如险情已经减弱、或有防护和专业人员配合。',
            { act: { view: 'walkway', shake: 0.5 } }),
          C(`在安全区边缘喊话，引导${mate}往远离险情点的方向爬，同时呼叫救援`, 'best', 20, { rescue: 3, report: 2, protect: 1, risk: 1 },
            `你在安全区边缘大喊："往东边爬，别回头！"同时用对讲机呼叫："${ctx.place}有人摔倒，需要救援！"${mate}顺着通道爬出了险情范围。`,
            '不进入危险区，通过喊话引导和呼叫专业救援来帮助受困人员，兼顾了施救和自身安全。',
            { act: { npc: { mate: { anim: 'crawl', to: 'walkway_mid', speed: 0.7 } } } }),
          C('先撤到集合点报到，等待清点人数', 'poor', 8, { protect: 2, rescue: -2, report: -1 },
            `你在集合点报了到，但没有说${mate}摔倒的事，救援人员过了几分钟才发现他。`, '撤离后必须立即把已知的受困人员位置报告出去，不能只等集合点清点。',
            { act: { view: 'assembly' } })
        ]
      });
      nodes.push(reportNode(ctx, {
        intro: P ? `${mate}已经被转移到安全区，${m.victim ? '身上多处烫伤，需要医护处理' : '手臂有轻度烫伤'}。` : '你已经撤到集合点，清点人数无误。',
        view: 'assembly',
        set: { npc: { mate: { anim: 'idle', at: 'assembly_wang', face: 'tapping' } }, fx: { splash: 0.6 } },
        best: `"${ctx.place}${src}${ctx.hazard}${W ? `，${src}下有积水` : ''}。${P ? `${mate}${m.victim ? '受伤' : '摔倒'}后已撤出，${m.victim ? '需要医护人员处理烫伤' : '手臂轻度烫伤'}` : '现场人员已全部撤离，无人受伤'}，现场暂时没有其他人。"`,
        bestResult: `${L}立即通知主控室停止${stopWord}${P ? `，并安排医护人员到集合点处理${mate}的烫伤` : ''}。`,
        wrong: C(`"${src}喷了，我先去拿灭火器！"`, 'wrong', 2, { report: -1, respond: -2, rule: -2 },
          `你拎着灭火器往回走，被赶来的${L}拦住了。`,
          `${ctx.hazard}不是灭火器能处置的险情，水基灭火器接触高温${metal}还可能引发爆炸。这时应先完成报告，并远离危险区。`, { hotspot: 'ext' })
      }));
      nodes.push(cordonNode(ctx, {
        text: `主控室已停止${stopWord}。这时一名不知情的检修工推着工具车从东门进来，正朝${ctx.place}方向走。${W ? '地面的积水还在冒着白汽。' : `地面上的${metal}和钢渣还在发红。`}`,
        view: 'safe', passer: 'fixer',
        set: { fx: { stream: 0, splash: 0.25, steam: 0.5, smoke: 0.5, pool: 0.5 }, npc: { fixer: { show: true, at: 'exit_in', anim: 'walk', to: 'walkway_mid', speed: 1.0 } }, audio: { rumble: 0.4 } },
        bestResult: `检修工停下脚步。你和他一起在通道口拉起警戒线，禁止无关人员进入${ctx.place}。`,
        wrong: W
          ? C('去现场用水冲掉积水，防止再次喷溅', 'fatal', 0, { risk: -3, rule: -3 }, `你拎起水管走向${src}。水接触到地面上的高温钢渣，瞬间汽化爆炸。`,
            `高温${metal}和钢渣遇水会发生剧烈的汽化爆炸，严禁用水处理熔融金属现场。`,
            { act: { view: 'close_ladle', fx: { steam: 1 }, flash: 'water', flashPower: 1.2, shake: 1.4, vignette: 'fatal' } })
          : C(`用水管给地面上的${metal}降温，方便尽快清理`, 'fatal', 0, { risk: -3, rule: -3 }, '水柱打到还在发红的钢渣上，瞬间汽化爆炸。',
            `高温${metal}和钢渣遇水会发生剧烈的汽化爆炸，严禁用水冷却熔融金属。应设立警戒，等其自然冷却后按程序清理。`,
            { act: { view: 'close_ladle', flash: 'ladle.top', flashPower: 1.2, shake: 1.4, vignette: 'fatal' } })
      }));
      nodes.push(reviewNode(ctx, {
        view: 'overview',
        set: { fx: { splash: 0, steam: 0.15, smoke: 0.2, pool: 0.2, alarm1: 0, alarm2: 0 }, audio: { alarm: false, rumble: 0.1, hiss: 0 } },
        cause: W
          ? `${src}下方积水是重要诱因。建议作业前确认作业区地面、${ctx.bf ? '主沟、渣沟和铁水罐' : '钢包和渣罐'}干燥无积水，并排查漏水点`
          : ctx.bf ? '主沟和渣沟潮湿、铁口状况异常都可能引发喷溅和漫溢。建议出铁前检查确认沟槽烘烤干燥、铁口状况正常'
            : '钢包或炉衬潮湿、加入了潮湿的废钢或渣料，都会引发喷溅。建议严格执行原料干燥和钢包烘烤检查',
        causeResult: W ? '安全员把"作业前确认地面无积水"写进了班前检查表。' : '安全员把这一条写进了班前检查表。',
        blame: P ? `主要是${mate}站的位置不对` : '主要是操作工动作太慢',
        luckWhy: `${ctx.hazard}有明确的诱因（积水、潮湿料、操作不当），大多数是可以预防的。`
      }));
      return nodes;
    }
  };

  F.ladle = {
    template: 'bof', category: '高温熔融金属', roleDefault: '地面指挥（司索指挥工）', roles: ['地面指挥（司索指挥工）', '天车司机', '班组长'], leader: '调度',
    keywords: ['穿包', '漏钢', '钢包', '吊运', '天车', '事故坑'],
    setup(ctx) {
      ctx.hazard = '钢包穿包漏钢';
      ctx.place = '吊运通道';
      ctx.location = '炼钢厂 · 转炉出钢跨吊运通道';
      ctx.basis = ['《炼钢安全规程》（AQ 2001）关于钢包吊运、事故钢包坑的要求', '《起重机械安全规程》（GB 6067）关于吊物下方禁止站人的要求'];
      ctx.workers = [ctx.names[0] || '小张', ctx.names[1] || '小李'].slice(0, ctx.count === 1 ? 1 : 2);
      ctx.workersText = ctx.workers.length > 1 ? `清理工${ctx.workers.join('和')}` : `清理工${ctx.workers[0]}`;
    },
    scene(ctx) {
      const P = ctx.mods.people;
      const npcs = [];
      if (P) ctx.workers.forEach((w, i) => npcs.push({ id: 'w' + (i + 1), slot: i ? 'path_ahead2' : 'path_ahead', label: '清理工 ' + w, wear: 'orange', anim: 'work', rot: i ? 160 : 200 }));
      const props = [
        { id: 'converter', asset: 'converter', slot: 'converter', tilt: 0 },
        { id: 'crane', asset: 'crane', slot: 'crane_bay', load: 'ladle', hookY: 11, tonnage: '150t' },
        { id: 'pit', asset: 'emergency_pit', slot: 'pit' },
        { id: 'control', asset: 'control_room', slot: 'control_room' },
        { id: 'exit', asset: 'exit_door', slot: 'exit' },
        { id: 'assembly', asset: 'assembly_point', slot: 'assembly' },
        { id: 'tape', asset: 'barrier', pos: [10, 0, 5.2], w: 7, hidden: true }
      ];
      if (ctx.mods.water) props.push({ id: 'water', asset: 'puddle', pos: [12.5, 0, 0.4], r: 1.8, label: '地面积水' });
      const effects = [
        { id: 'drip', type: 'drip', at: 'crane.load_bottom', intensity: 0 },
        { id: 'pool', type: 'molten_pool', at: 'crane_floor', intensity: 0, r: 2.6 },
        { id: 'pool2', type: 'molten_pool', at: [10, 0, 1.6], intensity: 0, r: 2.2, seed: 7 },
        { id: 'smoke', type: 'smoke', at: 'crane_floor', intensity: 0, r: 1.5 },
        { id: 'alarm1', type: 'alarm', at: 'alarm1', intensity: 0 },
        { id: 'alarm2', type: 'alarm', at: 'alarm2', intensity: 0 }
      ];
      if (ctx.mods.water) effects.push({ id: 'steam', type: 'steam', at: 'water', intensity: 0, r: 1.4 });
      return { template: 'bof', view: 'overview', props, npcs, effects, init: { audio: { rumble: 0.2 } } };
    },
    plan(ctx) {
      const P = ctx.mods.people, W = ctx.mods.water, wk = ctx.workersText;
      const run = {};
      ctx.workers.forEach((w, i) => (run['w' + (i + 1)] = { anim: 'run', to: i ? 'side_safe2' : 'side_safe' }));
      const nodes = [{
        title: '发现漏钢',
        text: `天车吊着满包钢水沿吊运通道缓缓东移。你突然看到包底有亮红色的钢水滴落，地面已经出现一小摊火红的钢液。${P ? `吊运路线前方十多米处，${wk}正背对着天车干活。` : ''}`,
        view: 'crane_ground', time: 12,
        set: { fx: { drip: 0.8, pool: 0.4, smoke: 0.5, alarm1: 1, alarm2: 1 }, audio: { alarm: true, rumble: 0.5 }, prop: { crane: 'stop' } },
        choices: [
          C('立即用对讲机通知天车司机：按预案把钢包吊往最近的事故坑，同时鸣笛示警', 'best', 20, { respond: 3, report: 2, risk: 1, rule: 2 },
            '天车司机回复"收到"，鸣响警铃，调转方向把钢包吊往事故坑。', '钢包穿漏时，要尽快把钢包移到事故坑等指定的安全位置，减少钢水洒落在通道上，同时发出警示。具体路线和位置以企业预案为准。',
            { act: { prop: { crane: [{ type: 'move', pos: [15, 0, 2], speed: 1.4 }, { type: 'move', to: 'pit', speed: 1.2 }] } } }),
          C('让天车司机原地停车，等领导来处理', 'poor', 6, { respond: -2, risk: -1 },
            '钢包悬停在通道上方继续漏钢，地面的钢液越积越多，向四周漫开。调度随后下令按预案移往事故坑。', '原地停车会让钢水持续洒落在通道上，扩大危险区域。应按预案移往事故坑。',
            { act: { fx: { pool: 0.9, drip: 1 } } }),
          C('跑到钢包下方，确认漏点在哪里', 'fatal', 0, { risk: -3, protect: -3, rule: -3 },
            '你冲到钢包正下方抬头张望，一股钢水从包底喷出——', '吊运的钢包下方是绝对禁区，更不用说正在漏钢的钢包。任何时候都不能进入吊物下方。',
            { act: { view: { near: 'crane.load_bottom', off: [0.8, -3.6, 1.6] }, fx: { drip: 1 }, flash: 'crane.load_bottom', shake: 1.4, vignette: 'fatal' } }),
          P
            ? C(`大声呼喊，示意${wk}撤离吊运路线`, 'ok', 12, { rescue: 2, risk: 1, respond: -1 },
              `${wk}听到喊声回头张望，但天车还没有接到任何指令，钢包仍悬在原地漏钢。`, '疏散人员是对的，但作为地面指挥，你的首要职责是立即指挥天车按预案处置。两件事应同时进行。')
            : C('先撤到安全区，等钢水漏完再处理', 'poor', 6, { protect: 1, respond: -2 },
              '你撤到了安全区，但天车没有接到任何指令，钢包悬在通道上方持续漏钢。', '作为地面指挥，撤离的同时必须立即指挥天车按预案处置，否则险情会持续扩大。')
        ]
      }];
      if (P) nodes.push({
        title: '吊运路线下有人',
        text: `天车已按预案把钢包吊往事故坑。吊运路线正下方，${wk}还没完全反应过来，站在原地不知道往哪走。`,
        view: 'workers', time: 10,
        set: { prop: { crane: ['stop', { type: 'move', pos: [15, 0, 2], speed: 1.4 }, { type: 'move', to: 'pit', speed: 1.2 }] } },
        choices: [
          C('在吊运路线外侧挥手喊话，让他们横向撤离，严禁从钢包下方穿过', 'best', 20, { rescue: 3, risk: 2, rule: 1 },
            '他们按你的手势横向跑出吊运路线，钢包从他们刚才站的位置上方经过。', '指挥人员横向避让吊运路线，而不是让他们从吊物下方穿过，是起重作业的基本要求。', { act: { npc: run } }),
          C('跑到他们身边，把人拉出来', 'wrong', 4, { protect: -2, rescue: 1, risk: -1 },
            '你冲进吊运路线，几个人一起跑开，钢包几乎从你们头顶经过。', '这样做让你自己也进入了吊运路线。应在路线外喊话指挥。', { act: { npc: run, shake: 0.4 } }),
          C('继续专心指挥天车，他们会自己看到', 'poor', 4, { rescue: -2, risk: -1 },
            '直到钢包靠近，他们才发现头顶的险情，慌忙跑开。', '不能假设他人会自己发现危险。发现人员在危险区内必须主动预警。', { act: { npc: run } })
        ]
      });
      nodes.push({
        title: '钢液漫流',
        text: `钢包已到达事故坑上方，漏出的钢水流进坑内。但刚才滴在吊运路线上的钢液正在地面漫开，${W ? '流向通道旁的一片积水' : '流向一处盖板破损的电缆沟'}。`,
        view: 'workers', time: 15,
        set: { fx: { drip: 0.5, pool: 0.9, pool2: 0.9, steam: 0.6 } },
        choices: [
          W
            ? C('立即疏散周边人员，设立大范围警戒，远离积水区，并报告调度', 'best', 20, { risk: 3, protect: 2, report: 2, rule: 1 },
              '周边人员迅速撤到警戒线外。钢液在积水边缘冒起大团白汽，所幸没有人在附近。', '熔融金属接触积水可能发生汽化爆炸，波及范围大。第一时间疏散、警戒、远离，是最重要的。', { act: { prop: { tape: 'show' } } })
            : C('设立警戒区禁止靠近，报告调度通知电工断开电缆沟内相关线路的电源，等钢液冷却后再清理', 'best', 20, { risk: 2, respond: 2, report: 2, rule: 1 },
              '电工远程断开了该段电缆的电源，警戒区拉起，钢液在地面上逐渐冷却变暗。', '钢液流入电缆沟可能烧毁电缆、引发火灾或触电。先警戒、再断电，等冷却后清理，是稳妥的做法。', { act: { prop: { tape: 'show' } } }),
          C(`穿好防护用品，用干燥的砂土在钢液前方筑挡，阻止它流向${W ? '积水' : '电缆沟'}`, 'ok', 14, { respond: 2, risk: 1, protect: -1 },
            '你和同事用干砂筑起一道矮坝，钢液在坝前停住了。', '用干燥材料围堵钢液是常见的现场处置手段，但必须使用干燥材料、穿戴防护，并按预案由指定人员操作。'),
          C('用消防水管冲水，给钢液快速降温', 'fatal', 0, { risk: -3, rule: -3 },
            '水柱打到钢液上，瞬间发生剧烈的汽化爆炸。', '严禁用水冷却钢水和钢渣。熔融金属遇水会发生爆炸。',
            { act: { flash: [10, 0.2, 1.6], flashPower: 1.3, shake: 1.5, vignette: 'fatal' } })
        ]
      });
      nodes.push(reportNode(ctx, {
        title: '汇报', view: 'pit',
        set: { fx: { drip: 0, alarm1: 0, alarm2: 0 }, audio: { alarm: false, rumble: 0.15 } },
        intro: '现场暂时稳定。',
        best: `"吊运途中钢包包底漏钢，钢包已放入事故坑。通道上有少量钢液，${W ? '已疏散人员并警戒，远离积水区' : '已警戒并断开电缆沟电源'}，${P ? `${wk}已撤离，` : ''}无人受伤。"`,
        bestResult: '调度确认情况后，安排检修和清理人员按程序进场。',
        wrong: C('先不报告，等班后会再说', 'wrong', 0, { report: -3, rule: -2 }, '半小时后，一名不知情的工人差点踩进还没冷却的钢液区。', '事故和险情必须及时上报，瞒报、迟报会让风险继续扩大。')
      }));
      nodes.push(reviewNode(ctx, {
        view: 'overview', set: { fx: { pool: 0.4, pool2: 0.4, smoke: 0.1 } },
        cause: '钢包包衬侵蚀变薄、出现渗钢迹象仍继续使用，是穿包的直接原因。建议严格执行钢包包况检查和使用次数管理，吊运前确认包况',
        blame: '主要是天车司机吊得太慢',
        luckWhy: '钢包穿漏通常有包衬侵蚀、渗钢、包壳发红等前兆，严格执行包况检查是可以预防的。'
      }));
      return nodes;
    }
  };

  F.breakout = {
    template: 'caster', category: '高温熔融金属', roleDefault: '连铸浇钢工', roles: ['连铸浇钢工', '主控工', '班组长'], leader: '主控室',
    keywords: ['连铸', '漏钢', '结晶器', '中间包', '二冷', '浇注'],
    setup(ctx) {
      ctx.hazard = '结晶器漏钢';
      ctx.place = '浇注平台';
      ctx.location = '炼钢厂 · 连铸浇注平台';
      ctx.below = ctx.names[0] || '小刘';
      ctx.mate = ctx.names[1] || '老周';
      ctx.basis = ['《炼钢安全规程》（AQ 2001）关于连铸漏钢事故处置的要求', '企业连铸漏钢事故现场处置方案（通用示例）'];
    },
    scene(ctx) {
      const npcs = [{ id: 'zhou', slot: 'platform_mate', label: '浇钢工 ' + ctx.mate, wear: 'blue', anim: 'work', face: 'tundish' }];
      if (ctx.mods.people) npcs.push({ id: 'liu', slot: 'below_worker', label: '巡检工 ' + ctx.below, wear: 'orange', anim: 'work', face: 'strand.zone2' });
      return {
        template: 'caster', view: 'overview',
        props: [
          { id: 'turret', asset: 'ladle_turret', slot: 'turret' },
          { id: 'tundish', asset: 'tundish', slot: 'tundish' },
          { id: 'strand', asset: 'caster_strand', slot: 'mold' },
          { id: 'estop', asset: 'estop', slot: 'estop', label: '浇注急停（联锁关水口）' },
          { id: 'pulpit', asset: 'control_room', slot: 'pulpit', label: '主控室' },
          { id: 'ext', asset: 'fire_extinguisher', slot: 'ext' },
          { id: 'assembly', asset: 'assembly_point', slot: 'assembly' }
        ],
        npcs,
        effects: [
          { id: 'breakout', type: 'molten_splash', at: 'strand.mold_low', intensity: 0, r: 0.6 },
          { id: 'steam', type: 'steam', at: 'strand.zone2', intensity: 0.35, r: 1.4 },
          { id: 'pool', type: 'molten_pool', at: 'below_pool', intensity: 0, r: 2.4 },
          { id: 'smoke', type: 'smoke', at: 'strand.mold_low', intensity: 0.15, r: 1 },
          { id: 'moldglow', type: 'glow', at: 'strand.mold', intensity: 0.7 },
          { id: 'alarm1', type: 'alarm', at: 'alarm1', intensity: 0 },
          { id: 'alarm2', type: 'alarm', at: 'alarm2', intensity: 0 }
        ],
        init: { audio: { rumble: 0.3, hiss: 0.2 } }
      };
    },
    plan(ctx) {
      const P = ctx.mods.people, b = ctx.below;
      const nodes = [{
        title: '漏钢发生',
        text: `浇注进行中，结晶器下口突然窜出一团火光，二冷区喷出大量蒸汽，报警灯闪烁：发生漏钢了。你站在浇注平台上，距结晶器约 ${ctx.meters || 4} 米。${P ? `平台下方的二冷区附近，${b}正在检查设备。` : ''}`,
        view: 'platform', time: 12,
        set: { fx: { breakout: 1, steam: 1, pool: 0.5, smoke: 0.8, alarm1: 1, alarm2: 1 }, npc: { zhou: { anim: 'retreat', to: 'free1', speed: 0.9 } }, audio: { alarm: true, rumble: 0.8, hiss: 0.6 }, shake: 0.5 },
        choices: [
          C('立即按下浇注急停（联锁关闭中间包水口），停止供钢，同时报告主控室', 'best', 20, { respond: 3, report: 2, risk: 1, rule: 2 },
            '你拍下急停按钮，中间包水口关闭，结晶器不再供钢。主控室回复："收到，铸机已停。"', '漏钢时第一时间停止供钢，可以从源头上减少漏出的钢水量。急停的具体位置和联锁方式以企业设备为准。',
            { hotspot: 'estop', act: { fx: { breakout: 0.4 } } }),
          C('探身到平台边缘，往下看漏钢的位置', 'fatal', 0, { risk: -3, protect: -3 },
            '你刚探出身子，一股夹着钢水飞溅的高温蒸汽从平台下方冲上来——', '漏钢时结晶器下方会喷出高温蒸汽和钢水，绝不能靠近或探身查看。',
            { act: { view: 'close_mold', flash: 'strand.mold_low', flashPower: 1.2, shake: 1.4, vignette: 'fatal' } }),
          C('沿最近的楼梯往下跑，赶紧离开平台', 'wrong', 4, { protect: -2, risk: -2 },
            '你跑下楼梯才发现，这段楼梯正通向二冷区，蒸汽和飞溅物迎面扑来，只好又退了回去。', '撤离要走远离事故点的安全通道。这段楼梯紧挨着二冷区，漏钢时恰恰最危险。平时就应熟悉平台上的安全通道位置。',
            { act: { view: 'stairs', fx: { steam: 1 }, shake: 0.5 } }),
          C('原地等主控室下指令', 'poor', 6, { respond: -2, risk: -1 },
            '十几秒后主控室才远程停机，这段时间里又有不少钢水漏出。', '浇钢工就在现场、离急停最近，应按处置卡立即停止供钢，而不是等待。', { act: { fx: { pool: 0.9 } } })
        ]
      }];
      if (P) nodes.push({
        title: '平台下有人',
        text: `供钢已经切断，但平台下方的二冷区里，${b}被蒸汽和飞溅物困在铸机旁。你从平台栏杆处能看到他。`,
        view: 'rail_look_down', time: 12,
        set: { npc: { liu: { anim: 'shield' } }, fx: { breakout: 0.3, steam: 0.9 } },
        choices: [
          C(`不下平台。用对讲机报告${b}的位置，同时喊话引导他往远离漏钢点的方向撤`, 'best', 20, { rescue: 3, report: 2, protect: 2 },
            `${b}听到你的喊声，捂着脸朝出坯辊道外侧跑了出去。`, '在不进入危险区的前提下喊话引导、报告位置，是最安全有效的协助方式。', { act: { npc: { liu: { anim: 'run', to: 'runout_side' } } } }),
          C('顺着楼梯下去把他拉出来', 'wrong', 4, { rescue: 1, protect: -3, risk: -1 },
            `你冲下楼梯，被蒸汽逼得睁不开眼，最后是${b}自己摸索着跑了出来。`, '施救者没有防护进入二冷区，很可能成为第二个受困者。',
            { act: { view: 'stairs', npc: { liu: { anim: 'run', to: 'runout_side' } }, shake: 0.4 } }),
          C('拿平台上的水管往下冲，给他降温', 'wrong', 0, { risk: -3, rule: -2 },
            `水流冲到地面的钢液上，炸起一片火星和蒸汽，${b}被吓得往后一退。`, '向漏出的钢水浇水可能引发汽化爆炸，只会让险情更严重。',
            { act: { flash: 'below_pool', flashPower: 0.6, shake: 0.6, npc: { liu: { anim: 'run', to: 'runout_side' } } } })
        ]
      });
      nodes.push(reportNode(ctx, {
        title: '报告', view: 'platform_exit', intro: '漏钢已经停止。',
        set: { fx: { breakout: 0, steam: 0.6, pool: 0.4, smoke: 0.3 }, audio: { rumble: 0.3 } },
        best: `"结晶器下口漏钢，已急停关水口。${P ? `${b}已从二冷区撤出，需要检查有无烫伤。` : '二冷区没有人员。'}平台人员已撤到安全通道。"`,
        bestResult: '主控室安排医护人员和设备检查人员按程序进场。',
        wrong: C('"都没事了。"', 'wrong', 2, { report: -2 }, '主控室不了解现场情况，准备安排人员下去清理。', '笼统的报告会掩盖风险，后续人员可能在高温钢液未冷却时进入。')
      }));
      nodes.push({
        title: '恢复生产',
        text: '车间主任打来电话，希望尽快恢复浇注减少损失，问你现场能不能马上开机。',
        view: 'overview', time: 20,
        set: { fx: { alarm1: 0, alarm2: 0, steam: 0.4 }, audio: { alarm: false, hiss: 0.2 } },
        choices: [
          C('不能马上开机：要先确认人员撤出、漏钢冷却清理、设备检查完成，按规程交接后再恢复', 'best', 20, { rule: 3, risk: 1 }, '车间主任同意按程序处理。', '事故后恢复生产必须经过检查确认和交接，避免带隐患开机。'),
          C('看着没什么事了，可以开', 'wrong', 0, { rule: -3, risk: -2 }, '开机后不久，受损的扇形段再次出现异常。', '漏钢可能损坏结晶器、足辊和扇形段，必须检查后才能恢复。'),
          C('先开起来，边生产边清理', 'wrong', 0, { rule: -3, protect: -1 }, '清理人员在铸机运行状态下作业，险象环生。', '设备运行中进行清理作业违反安全规程，极易造成二次伤害。')
        ]
      });
      nodes.push(reviewNode(ctx, {
        view: 'overview', set: { fx: { steam: 0.25 } },
        cause: '结晶器液面波动大、拉速控制不当或保护渣性能异常，都可能导致坯壳破裂漏钢。建议严格执行拉速和液面控制规程，加强漏钢预报系统的点检',
        blame: `主要是${ctx.mate}没盯住液面`,
        luckWhy: '漏钢大多有液面波动、拉速异常、漏钢预报报警等前兆，严格执行操作规程是可以预防的。'
      }));
      return nodes;
    }
  };

  F.gas = {
    template: 'gas', category: '煤气中毒', roleDefault: '能源中心巡检工', roles: ['能源中心巡检工', '煤气防护员', '班组长'], leader: '调度',
    keywords: ['煤气', '泄漏', '中毒', '一氧化碳', 'CO', '阀门', '管道'],
    setup(ctx) {
      ctx.gasName = has(ctx.text, ['氮气']) ? '氮气' : '煤气';
      ctx.hazard = ctx.gasName + '泄漏';
      ctx.place = '煤气管道区';
      ctx.location = '炼铁厂 · 高炉煤气管道区';
      ctx.victimOn = ctx.mods.people;
      ctx.vname = ctx.names[0] || '老赵';
      ctx.helper = ctx.names[1] || '小孙';
      ctx.basis = ['《工业企业煤气安全规程》（GB 6222）关于煤气泄漏、中毒救护的要求', '企业煤气中毒事故现场处置方案（通用示例）'];
    },
    scene(ctx) {
      const npcs = [];
      if (ctx.victimOn) npcs.push({ id: 'zhao', slot: 'victim', label: '工友 ' + ctx.vname, wear: 'blue', anim: ctx.mods.victim ? 'fallen' : 'work', rot: 60 });
      npcs.push({ id: 'sun', slot: 'upwind_far', label: '同事 ' + ctx.helper, wear: 'blue', anim: 'idle', hidden: true });
      return {
        template: 'gas', view: 'overview',
        props: [
          { id: 'valve', asset: 'gas_valve', slot: 'valve' },
          { id: 'detector', asset: 'gas_detector', slot: 'detector_post' },
          { id: 'windsock', asset: 'windsock', slot: 'windsock' },
          { id: 'scba', asset: 'scba_cabinet', slot: 'scba', rot: -90 },
          { id: 'assembly', asset: 'assembly_point', slot: 'assembly' },
          { id: 'truck', asset: 'truck', slot: 'road_east' },
          { id: 'tape', asset: 'barrier', slot: 'road_block', w: 6, hidden: true },
          { id: 'aid', asset: 'first_aid', pos: [18.2, 0, 14] }
        ],
        npcs,
        effects: [
          { id: 'gas', type: 'gas', at: 'valve.leak', intensity: 0.5 },
          { id: 'det', type: 'alarm', at: 'detector.light', intensity: 0, range: 8 }
        ],
        init: { audio: { hiss: 0.25 } }
      };
    },
    plan(ctx) {
      const V = ctx.victimOn, v = ctx.vname, h = ctx.helper, gn = ctx.gasName;
      const reading = gn === '氮气' ? '你随身的四合一报警仪突然尖叫，氧含量读数快速下降到 17% 以下' : '你随身的一氧化碳报警仪突然尖叫，读数迅速升到 300 ppm 以上';
      const nodes = [{
        title: '报警仪尖叫',
        text: `${reading}${V ? `。前方十几米的阀门组旁，工友${v}${ctx.mods.victim ? '倒在地上一动不动' : '刚才还在作业，这时突然晃了几下，扶着管道慢慢瘫倒在地'}` : '，阀门组方向传来"嘶嘶"的泄漏声'}。风向标显示风正从阀门组吹向你。（画面中的黄绿色气团只是示意，真实${gn}无色无味。）`,
        view: 'patrol', time: 12,
        set: { fx: { gas: 1, det: 1 }, npc: { zhao: 'fallen' }, audio: { detector: true, hiss: 0.5 } },
        choices: [
          V
            ? C(`立即冲过去把${v}拖出来`, 'fatal', 0, { risk: -3, protect: -3, rescue: -1, rule: -2 },
              `你跑到${v}身边，刚弯腰去拖他，就感到一阵头晕目眩，双腿发软倒在了他旁边。`,
              `高浓度${gn}区域内没有空气呼吸器就去施救，施救者往往几次呼吸后就会倒地。这是${gn}事故伤亡扩大最常见的原因。`,
              { act: { view: 'victim_close', vignette: 'fatal', audio: { detector: true } } })
            : C('上前查看泄漏情况', 'fatal', 0, { risk: -3, protect: -3, rule: -2 },
              '你刚走近阀门组，报警仪读数直线上升，一阵头晕目眩，双腿发软倒在了阀门旁——',
              `泄漏点附近${gn}浓度极高，几次呼吸就可能使人昏迷。查找泄漏点必须由佩戴空气呼吸器的专业人员按程序进行。`,
              { act: { view: 'victim_close', vignette: 'fatal', audio: { detector: true } } }),
          C(`朝侧风方向撤出气团，再绕到上风向，立即向调度报告：阀门组${gn}泄漏${V ? '，一人中毒倒地' : ''}`, 'best', 20, { risk: 3, protect: 3, report: 2, rule: 1 },
            `你横穿出气团、绕到上风向，报警仪读数慢慢回落。你用对讲机向调度报告了泄漏位置${V ? `和${v}倒地的情况` : '和风向'}。`,
            `发现${gn}泄漏，应向上风向或侧风向撤离，并立即报告。不要顺着风跑，也不要在没有防护的情况下靠近泄漏点。`,
            { act: { view: 'crosswind', audio: { detector: false } } }),
          C('屏住呼吸跑到阀门旁，关闭阀门切断气源', 'wrong', 0, { risk: -2, protect: -3, respond: 1, rule: -2 },
            `你冲到阀门旁拧了几圈，头晕目眩，跌跌撞撞退了出来${V ? `，差一点倒在${v}旁边` : ''}。阀门也没能关严。`,
            '屏住呼吸撑不了多久，进入泄漏点必须佩戴正压式空气呼吸器，并由专业人员按程序切断气源。',
            { hotspot: 'valve', act: { view: 'victim_close', shake: 0.5, vignette: 'warn' } }),
          C('顺着风向往西跑，离阀门越远越好', 'poor', 6, { risk: -2, protect: 1 },
            `你往西跑了很远，报警仪却一直响个不停。${gn}正顺着风向往你这边扩散。`, '下风向是气体扩散的方向，应向上风向或侧风向撤离。', { act: { view: 'downwind' } })
        ],
        timeout: { act: { vignette: 'warn' } }
      }];
      if (V) {
        nodes.push({
          title: '是否施救',
          text: `你已经撤到上风向安全处，并报告了调度。救援队大约 5 分钟后到，但${v}情况危急。旁边的应急柜里有正压式空气呼吸器，同事${h}也赶到了。`,
          view: 'upwind', time: 18,
          set: { vignette: '', npc: { sun: { show: true, at: 'upwind_far', anim: 'run', to: 'scba_side' } }, audio: { detector: false } },
          choices: [
            C(`和${h}按预案施救：检查呼吸器气压和面罩气密后佩戴，一人进去救人、一人在外监护，保持通讯`, 'best', 20, { rescue: 3, protect: 2, rule: 2 },
              `你们检查完装备，${h}在气团外监护，你佩戴空气呼吸器进入，把${v}拖到了上风向。`, '佩戴正压式空气呼吸器、双人配合、一人监护，是煤气区域施救的基本要求。前提是施救人员接受过训练。', { hotspot: 'scba' }),
            C(`自己背上呼吸器马上冲进去，不等${h}`, 'poor', 8, { rescue: 1, protect: -1, rule: -2 },
              `你成功把${v}拖了出来，但面罩一度漏气，你出来时也有些头晕。`, '单人进入没有监护，一旦施救者自己出问题就没人知道。应双人配合、一人监护。'),
            C('戴上普通防尘口罩进去救人', 'fatal', 0, { protect: -3, rule: -3 },
              '你戴着防尘口罩走进气团，没几步就倒下了。', '防尘口罩和普通过滤式面具都不能防一氧化碳，更防不了缺氧。必须使用隔绝式的正压空气呼吸器。',
              { act: { view: 'victim_close', vignette: 'fatal' } }),
            C('在上风向设置警戒，阻止他人进入，等救援队并给他们指引位置', 'ok', 14, { protect: 2, rescue: 1, report: 1 },
              `救援队到达后，在你的指引下迅速找到了${v}。`, `没有把握时，守住警戒、等待专业救援是稳妥的选择，但${v}的救治时间会被拉长。`)
          ]
        });
        nodes.push({
          title: '现场急救',
          text: `${v}被转移到上风向的空旷处。他面色潮红、叫不醒，但还有微弱的呼吸。`,
          view: 'upwind', time: 18,
          set: { npc: { zhao: { anim: 'fallen', at: 'safe_patient' }, sun: { show: true, anim: 'kneel', at: 'safe_helper', face: 'zhao' } } },
          choices: [
            C('解开衣领腰带，保持呼吸道通畅，有条件时给氧并持续观察；一旦呼吸心跳停止立即心肺复苏，等待医护人员', 'best', 20, { rescue: 3, rule: 1 },
              `${v}的呼吸逐渐平稳，医护人员到达后给他上了氧气，送往医院。`, '中毒者应尽快脱离中毒环境，保持呼吸道通畅、给氧，必要时心肺复苏。', { hotspot: 'aid' }),
            C('给他喂水，让他清醒过来', 'wrong', 2, { rescue: -2 }, `水呛进了${v}的气管，他剧烈咳嗽起来。`, '意识不清的人不能喂水，容易造成误吸和窒息。'),
            C('使劲掐人中、摇晃他', 'poor', 4, { rescue: -1 }, `${v}没有反应，你耽误了一些时间。`, '掐人中和摇晃对中毒昏迷没有救治作用，应保持呼吸道通畅、给氧并观察生命体征。')
          ]
        });
      } else {
        nodes.push({
          title: '切断气源',
          text: '你已经撤到上风向，报警仪读数回落。调度在对讲机里问：泄漏点附近的阀门能不能关？',
          view: 'upwind', time: 15, set: { audio: { detector: false } },
          choices: [
            C('说明泄漏位置和风向，由煤防站人员佩戴空气呼吸器、在监护下按程序关阀或堵漏，自己在上风向警戒等候', 'best', 20, { report: 2, rule: 2, protect: 2, respond: 1 },
              '煤防站人员 10 分钟后到场，佩戴空气呼吸器关闭了上游阀门，泄漏停止。', '切断气源、堵漏属于带煤气作业，必须由专业人员佩戴空气呼吸器、在监护下按程序进行。'),
            C('用湿毛巾捂住口鼻，跑过去把阀门关上', 'fatal', 0, { protect: -3, rule: -3 },
              '你捂着湿毛巾冲进气团，刚拧了两圈手轮就眼前一黑——', '湿毛巾根本不能过滤一氧化碳。进入泄漏区必须使用隔绝式的正压空气呼吸器。',
              { act: { view: 'victim_close', vignette: 'fatal' } }),
            C('自己背上空气呼吸器，一个人进去关阀', 'poor', 8, { respond: 1, protect: -1, rule: -2 },
              '你关上了阀门，但面罩一度松动，出来时有些头晕，也没有人知道你进去了。', '即便佩戴了呼吸器，进入泄漏区也必须有人监护、保持通讯。'),
            C('在上风向设置警戒，等煤防站人员到场', 'ok', 14, { protect: 2, risk: 1 },
              '煤防站人员到场后关闭了阀门。你守住了警戒，但没有主动提供泄漏位置，他们多花了几分钟查找。', '守住警戒是对的，同时应主动提供泄漏位置、风向等信息，帮助专业人员快速处置。')
          ]
        });
        nodes.push(reportNode(ctx, {
          view: 'upwind', intro: '泄漏已经控制住。',
          best: `"${ctx.place}阀门组${gn}泄漏，泄漏点在主管阀门组，现场风向东风。我已撤到上风向，附近暂无人员，上游阀门已由煤防站关闭，周边需要继续检测。"`,
          bestResult: '调度安排煤防站对周边区域进行检测，确认浓度合格后再解除警戒。',
          wrong: C('"漏得不多，我自己能处理。"', 'wrong', 2, { report: -2, rule: -1 }, '调度没有及时组织检测，周边区域的作业人员还不知道泄漏的事。', `${gn}泄漏必须如实报告，由调度统一组织检测、警戒和处置。`)
        }));
      }
      nodes.push({
        title: '外部车辆驶入',
        text: '泄漏区域还没有检测合格。厂区道路上一辆运输车正朝泄漏区方向开过来，司机好像没有注意到警示。',
        view: 'road', time: 10,
        set: { prop: { truck: { type: 'move', to: 'road_mid', speed: 2.2 } } },
        choices: [
          C('立即示意车辆停车、熄火或掉头远离，在路口设置警戒，严禁一切火源进入', 'best', 20, { risk: 3, respond: 2, rule: 2 },
            '司机看到你的手势后停车熄火，倒车离开。你在路口拉起了警戒线。', `${gn}泄漏区域严禁车辆和明火进入，车辆发动机和排气都可能成为点火源。`, { act: { prop: { truck: 'stop', tape: 'show' } } }),
          C('挥手让车加速通过，尽快离开', 'wrong', 0, { risk: -3, rule: -2 }, '车辆从泄漏区边缘驶过，所幸当时浓度没有达到爆炸范围。', '煤气与空气混合达到一定浓度遇火会爆炸。不能让车辆穿过泄漏区。'),
          C(V ? `不管它，继续守着${v}` : '不管它，继续盯着泄漏点', 'poor', 6, { risk: -2 }, '车辆被远处的调度人员拦下，但你错过了第一时间的警戒。', '在处置险情的同时，也要注意控制周边的点火源和无关人员。')
        ]
      });
      nodes.push(reviewNode(ctx, {
        view: 'overview', set: { fx: { gas: 0.1, det: 0 }, audio: { hiss: 0.05, detector: false } },
        cause: '阀门组法兰和盘根密封老化泄漏，日常点检没有及时发现。建议加强煤气设施点检和泄漏检测，巡检必须携带报警仪并双人进行',
        blame: V ? `主要是${v}自己没注意` : '主要是巡检的人来得太晚',
        luckWhy: '煤气泄漏多由密封老化、腐蚀等隐患引起，定期点检和泄漏检测是可以发现的。'
      }));
      return nodes;
    }
  };

  F.confined = {
    template: 'gas', category: '有限空间', roleDefault: '作业监护人', roles: ['作业监护人', '作业负责人', '班组长'], leader: '调度',
    keywords: ['有限空间', '阀门井', '下井', '中毒', '窒息', '缺氧', '监护'],
    setup(ctx) {
      const t = ctx.text;
      ctx.space = has(t, ['储罐', '罐内']) ? '储罐' : has(t, ['地坑']) ? '地坑' : has(t, ['隧道']) ? '电缆隧道' : '阀门井';
      ctx.inside = ctx.space === '储罐' ? '罐内' : ctx.space === '地坑' ? '坑内' : ctx.space === '电缆隧道' ? '隧道内' : '井下';
      ctx.enter = ctx.space === '储罐' ? '进罐' : '下井';
      ctx.hazard = `${ctx.space}内中毒窒息`;
      ctx.place = ctx.unit || `3 号${ctx.space}`;
      ctx.location = `炼铁厂 · 煤气管网 ${ctx.place}`;
      ctx.worker = ctx.names[0] || '老钱';
      ctx.mateN = ctx.names[1] || '小李';
      ctx.basis = ['《工贸企业有限空间作业安全规定》关于"先通风、再检测、后作业"和严禁盲目施救的要求', '《工业企业煤气安全规程》（GB 6222）'];
    },
    scene(ctx) {
      return {
        template: 'gas', view: 'manhole_far',
        props: [
          { id: 'manhole', asset: 'manhole', slot: 'manhole', label: ctx.space + '（有限空间）' },
          { id: 'blower', asset: 'blower', slot: 'blower', to: [-1.4, 0.3, 1.8] },
          { id: 'scba', asset: 'scba_cabinet', slot: 'scba_north' },
          { id: 'aid', asset: 'first_aid', slot: 'first_aid' },
          { id: 'windsock', asset: 'windsock', slot: 'windsock' }
        ],
        npcs: [
          { id: 'li', slot: 'mate_far', label: '同事 ' + ctx.mateN, wear: 'blue', anim: 'idle', hidden: true },
          { id: 'qian', slot: 'patient', label: '作业人员 ' + ctx.worker, wear: 'orange', anim: 'fallen', hidden: true },
          { id: 'rescuer', slot: 'patient_helper', label: '救援队员', wear: 'navy', helmet: 'red', anim: 'kneel', hidden: true }
        ],
        effects: [{ id: 'gas', type: 'gas', at: 'manhole.hole', intensity: 0.15, wind: 0.4 }],
        init: { audio: { hiss: 0.05 } }
      };
    },
    plan(ctx) {
      const w = ctx.worker, mt = ctx.mateN, ins = ctx.inside, en = ctx.enter;
      return [
        {
          title: `${ins}失去应答`,
          text: `${w}${en}作业几分钟后，${ins}传来一声闷响。你喊他的名字，没有回应。安全绳还垂在${ctx.space}里，一动不动。`,
          view: 'manhole', time: 12, set: { fx: { gas: 0.35 } },
          choices: [
            C(`立刻顺着爬梯${en}救人`, 'fatal', 0, { risk: -3, protect: -3, rule: -3 },
              `你刚下到一半，就感到胸口发闷、眼前发黑，手一松滑了下去——`, '有限空间里可能缺氧或积聚了有毒气体，监护人和其他人员盲目进入施救，是有限空间事故伤亡扩大的主要原因之一。',
              { act: { view: 'hole', vignette: 'fatal', shake: 0.6 } }),
            C(`不${en}：立即大声呼救、报告调度和救援队，同时开启通风机向${ins}强制送风`, 'best', 20, { rescue: 2, report: 3, protect: 2, rule: 2 },
              '通风机轰鸣着向内送风，调度通知救援队携带空气呼吸器赶来。', '监护人严禁擅自进入有限空间。应立即报告、呼救，并通过强制通风改善内部环境，为救援争取时间。',
              { hotspot: 'blower', act: { audio: { rumble: 0.25 } } }),
            C(`用井口三脚架的绞盘和${w}身上的安全绳，尝试把他拉上来`, 'ok', 16, { rescue: 3, protect: 2, report: -1 },
              `绞盘转动了几圈，安全绳绷紧了，但${w}卡在了管道旁，拉不上来。你还没有报告调度。`,
              '利用三脚架和安全绳进行非进入式救援是正确方向，前提是作业人员按要求系好了安全绳。但救援的同时必须立即报告和呼救。', { hotspot: 'manhole' }),
            C('上前趴在井口，探头往里看看情况', 'wrong', 2, { risk: -2, protect: -2 },
              '你刚探头到井口，一股难闻的气味冲上来，一阵头晕，赶紧缩了回来。', '有毒气体和缺氧环境在井口附近同样存在，不能探头查看。应在上风向通过喊话、安全绳和检测仪判断情况。',
              { act: { view: 'hole', vignette: 'warn', shake: 0.3 } })
          ],
          timeout: { act: { fx: { gas: 0.5 } } }
        },
        {
          title: `同事要${en}`,
          text: `同事${mt}闻讯赶来，二话不说抓起一只防尘口罩就要往里下："救人要紧！"`,
          view: 'manhole', time: 12,
          set: { vignette: '', npc: { li: { show: true, at: 'mate_far', anim: 'run', to: 'mate_north' } } },
          choices: [
            C(`拦住他：没有空气呼吸器、没有检测和监护，谁都不能${en}。一起保持通风，等救援队`, 'best', 20, { rescue: 2, protect: 3, rule: 2 },
              `${mt}被你拦了下来，转身帮你看住通风机。救援队几分钟后赶到。`, '盲目施救是有限空间事故"一死变多死"的主要原因。没有隔绝式呼吸防护和监护，任何人不得进入。',
              { act: { npc: { li: { anim: 'work', face: 'blower' } } } }),
            C('让他戴着口罩下去，你在上面拉着安全绳', 'fatal', 0, { protect: -3, rule: -3, rescue: -2 },
              `${mt}下到一半就没了声音，安全绳那头一下子沉了下去。`, '防尘口罩不能防有毒气体和缺氧。让第二个人盲目进入，只会造成更多伤亡。',
              { act: { npc: { li: { anim: 'walk', to: 'manhole' } }, vignette: 'fatal' } }),
            C('让他去应急柜取空气呼吸器，检查好后由你在井口监护，他佩戴后下去救人', 'ok', 12, { rescue: 2, protect: 1, rule: -1 },
              `${mt}佩戴呼吸器后下去，费了好大劲才把安全绳重新挂好，配合救援队把人救了上来。`, '佩戴隔绝式呼吸器、有人监护是进入施救的基本条件，但施救人员必须经过专门训练，优先等待专业救援队。',
              { hotspot: 'scba' }),
            C('让他去叫更多的人来帮忙', 'poor', 8, { rescue: -1, report: -1 },
              '赶来围观的人越来越多，现场一度很混乱。', '施救需要的是专业救援和装备，而不是更多没有防护的人。应报告调度、维持现场秩序。')
          ]
        },
        {
          title: '伤员救出',
          text: `救援队佩戴空气呼吸器进入，把${w}救了上来，放在上风向的空地上。他面色发紫，呼吸很微弱。`,
          view: 'manhole_far', time: 18,
          set: { npc: { qian: { show: true }, rescuer: { show: true, face: 'qian' }, li: { anim: 'idle' } } },
          choices: [
            C('把他移到上风向空气新鲜处，保持呼吸道通畅，有条件时给氧；呼吸心跳停止立即心肺复苏，等待医护', 'best', 20, { rescue: 3, rule: 1 },
              `${w}的呼吸慢慢恢复，医护人员赶到后把他送往医院。`, '中毒窒息者首先要脱离危险环境、保持呼吸道通畅并给氧，必要时立即心肺复苏。', { hotspot: 'aid' }),
            C('给他喝点水，让他清醒过来', 'wrong', 2, { rescue: -2 }, '水呛进了他的气管，情况更糟了。', '意识不清的人不能喂水，容易造成误吸和窒息。'),
            C('扶他坐起来，靠着休息一会儿', 'poor', 6, { rescue: -1 }, '他软软地往一边倒，呼吸也没有改善。', '昏迷伤员应平卧并保持呼吸道通畅，观察生命体征，而不是扶坐起来。')
          ]
        },
        reportNode(ctx, {
          view: 'manhole_far', intro: '伤员已经得到初步救治。',
          best: `"${ctx.place}作业人员${w}在${ins}中毒窒息，已由救援队救出，正在上风向急救，呼吸微弱，需要救护车。现场已强制通风，没有其他人员进入。"`,
          bestResult: '调度确认救护车已在路上，并通知安全部门保护现场。',
          wrong: C('"人已经救上来了，没什么大事。"', 'wrong', 2, { report: -2, rule: -1 }, '调度没有及时安排救护车，伤员的救治被耽误了。', '有限空间中毒窒息后可能出现迟发性损害，必须如实报告伤员状况，尽快送医。')
        }),
        reviewNode(ctx, {
          title: '事故调查', view: 'manhole_far', set: { fx: { gas: 0.1 }, audio: { rumble: 0.05 } },
          cause: '作业前没有严格执行"先通风、再检测、后作业"，作业中也没有持续检测。建议落实作业审批、持续气体检测和监护制度',
          blame: `主要是${w}自己不小心`,
          luckWhy: '有限空间中毒窒息事故几乎都与未通风、未检测、未监护有关，严格执行作业制度是完全可以预防的。'
        })
      ];
    }
  };

  F.crane = {
    template: 'coil', category: '起重伤害', roleDefault: '司索指挥工', roles: ['司索指挥工', '天车司机', '班组长'], leader: '调度',
    keywords: ['天车', '起重', '吊运', '钢卷', '钢丝绳', '吊物', '行车'],
    setup(ctx) {
      const t = ctx.text;
      ctx.issue = has(t, ['吊钩', '脱钩']) ? 'hook' : has(t, ['刹车', '制动', '溜钩']) ? 'brake' : 'rope';
      ctx.hazard = { rope: '钢丝绳断股', hook: '吊钩防脱装置失效', brake: '天车制动失灵' }[ctx.issue];
      ctx.place = '成品库 2 跨';
      ctx.location = '冷轧厂 · 成品钢卷库';
      ctx.workers = [ctx.names[0] || '小陈', ctx.names[1] || '小吴'].slice(0, ctx.count === 1 ? 1 : 2);
      ctx.workersText = ctx.workers.length > 1 ? `贴标工${ctx.workers.join('和')}` : `贴标工${ctx.workers[0]}`;
      ctx.fixer = ctx.names[2] || '老孟';
      ctx.basis = ['《起重机械安全规程》（GB 6067）关于吊物下方禁止站人、钢丝绳报废的要求', '《起重吊运指挥信号》（GB/T 5082）紧急停止信号'];
    },
    scene(ctx) {
      const npcs = [];
      if (ctx.mods.people) ctx.workers.forEach((w, i) => npcs.push({ id: 'w' + (i + 1), slot: i ? 'label_w2' : 'label_w1', label: '贴标工 ' + w, wear: 'blue', anim: 'work', rot: i ? 100 : 90 }));
      npcs.push({ id: 'meng', slot: 'maint_in', label: '维修工 ' + ctx.fixer, wear: 'orange', helmet: 'white', anim: 'idle', hidden: true });
      return {
        template: 'coil', view: 'overview',
        props: [
          { id: 'crane', asset: 'crane', slot: 'crane_a', load: 'coil', hookY: 9, tonnage: '32t' },
          { id: 'saddle', asset: 'saddle', slot: 'saddle_near' },
          { id: 'isolator', asset: 'isolator', slot: 'isolator' },
          { id: 'ladder', asset: 'ladder', slot: 'ladder', h: 14 }
        ],
        npcs,
        effects: [{ id: 'alarm1', type: 'alarm', at: 'alarm1', intensity: 0 }],
        init: { prop: { crane: { type: 'move', to: 'crane_path_end', speed: 0.5 } }, audio: { rumble: 0.12 } }
      };
    },
    plan(ctx) {
      const P = ctx.mods.people, wk = ctx.workersText;
      const run = {};
      ctx.workers.forEach((w, i) => (run['w' + (i + 1)] = { anim: 'run', to: i ? 'flee_2' : 'flee_1' }));
      const issueText = {
        rope: '你发现吊具一侧的钢丝绳有明显断股，钢卷开始轻微倾斜。',
        hook: '你发现吊钩的防脱钩装置已经松脱，吊具在钩口里晃动，钢卷开始轻微倾斜。',
        brake: '司机试着停车，钢卷却继续往下溜了一段，制动明显失灵，钢卷还在缓慢下滑。'
      }[ctx.issue];
      const nodes = [{
        title: ctx.hazard,
        text: `天车吊着一卷约 20 吨的钢卷，正沿通道向东移动。${issueText}${P ? `吊运路线前方，${wk}背对着天车在干活。` : ''}`,
        view: 'signal', time: 10,
        set: { fx: { alarm1: 1 }, prop: { crane: [{ type: 'tilt', part: 'load', deg: 6, axis: 'x' }] }, audio: { alarm: true } },
        choices: [
          C('立即发出紧急停止信号并用对讲机喊停，要求司机停止运行', 'best', 20, { respond: 3, risk: 2, rule: 2 },
            '你双臂伸直快速左右摆动，同时在对讲机里大喊"紧急停车"。天车应声停住。', '发现吊具异常，指挥人员应立即发出紧急停止信号。任何人发出的紧急停止信号，司机都必须立即执行。',
            { act: { prop: { crane: 'stop' } } }),
          C('跑到钢卷下方扶住，防止它继续倾斜', 'fatal', 0, { risk: -3, protect: -3, rule: -3 },
            '你刚跑到钢卷下方，吊具彻底失效，钢卷砸了下来——', '吊物下方是绝对禁区。20 吨的钢卷靠人力不可能扶住，进入吊物下方只会造成伤亡。',
            { act: { view: { near: 'crane.load_bottom', off: [1.2, -3.3, 1.8] }, prop: { crane: ['stop', { type: 'drop', part: 'load' }] }, shake: 1.5, vignette: 'fatal' } }),
          C('让司机加速，赶紧把钢卷送到目的地卸下', 'wrong', 0, { respond: -2, risk: -2, rule: -2 },
            `天车加速后钢卷剧烈晃动，吊具受力更大${P ? `，前方的${wk}惊慌地跑开` : ''}。`, '吊具异常时继续运行、加速运行，会进一步加大受力，增加坠落风险。',
            { act: { prop: { crane: ['stop', { type: 'move', to: 'crane_path_end', speed: 1.4 }] }, npc: run, shake: 0.3 } }),
          P
            ? C(`先冲着${wk}大喊，让他们赶紧躲开`, 'ok', 12, { rescue: 2, risk: 1, respond: -1 },
              `${wk}听到喊声跑开了，但天车还在带着隐患继续运行。`, '疏散人员是对的，但应当同时发出紧急停止信号，从源头上控制风险。', { act: { npc: run } })
            : C('先拍照留证，再通知司机', 'poor', 4, { respond: -2, rule: -1 },
              '你掏出手机拍了几张照片，天车又往前开了十几米。', '发现吊具异常，第一时间必须发出停止信号，取证可以在险情控制后进行。')
        ]
      }];
      if (P) nodes.push({
        title: '吊物前方有人',
        text: `天车已经停住，但钢卷还在微微晃动。${wk}还站在钢卷前方的通道上，正回头张望。`,
        view: 'workers', time: 10,
        set: { prop: { crane: ['stop', { type: 'swing', amp: 0.05 }] } },
        choices: [
          C('在吊物外侧喊话，指挥他们横向撤离到安全区，严禁从钢卷下方穿过', 'best', 20, { rescue: 3, risk: 2, rule: 1 },
            '他们按你的手势横向跑开，离开了吊物可能坠落的范围。', '指挥人员横向撤离吊物危险区，而不是从吊物下方穿过，是起重作业的基本要求。', { act: { npc: run } }),
          C('跑过去把他们拉出来', 'wrong', 4, { protect: -2, rescue: 1, risk: -1 }, '你冲到钢卷下方附近，三个人一起跑开，钢卷就在你们头顶晃动。', '这样做让你自己也进入了吊物危险区。应在吊物外侧喊话指挥。', { act: { npc: run, shake: 0.3 } }),
          C('他们离得不算太近，先不管', 'poor', 4, { rescue: -2, risk: -1 }, '直到班组长赶来，他们才离开吊物下方。', '吊物坠落时会弹跳、滚动，危险范围比想象的大。发现人员在危险区内必须主动预警。')
        ]
      });
      nodes.push({
        title: '是否落钩',
        text: '天车停住了，钢卷悬在离地约 5 米的位置，轻轻晃动。司机在对讲机里问你下一步怎么办。',
        view: 'signal', time: 15,
        set: { prop: { crane: ['stop', { type: 'swing', amp: 0.05 }] }, npc: run },
        choices: [
          C('确认落点周围无人后，指挥司机慢速、平稳落钩，把钢卷放到最近的空鞍座上', 'best', 20, { respond: 3, risk: 2, rule: 1 },
            '司机按你的手势慢慢落钩，钢卷平稳地落在鞍座上。', '吊具异常时，应在确认安全的前提下尽快把吊物平稳放到安全位置，减少悬吊时间。',
            { hotspot: 'saddle', act: { prop: { crane: [{ type: 'move', to: 'saddle_near', speed: 0.8 }, { type: 'lower', part: 'hook', by: 4.8, speed: 0.6 }] } } }),
          C('让钢卷悬在空中，等维修工来换钢丝绳', 'poor', 6, { respond: -2, risk: -1 },
            '钢卷悬在空中十多分钟，下方通道一直无法通行，最后还是按程序落了钩。', '带隐患的吊物长时间悬空，坠落风险持续存在。应尽快平稳落到安全位置。',
            { act: { prop: { crane: [{ type: 'wait', dur: 2 }, { type: 'move', to: 'saddle_near', speed: 0.8 }, { type: 'lower', part: 'hook', by: 4.8, speed: 0.6 }] } } }),
          C('让司机快速落钩，越快放下越安全', 'wrong', 2, { risk: -2, rule: -2 },
            '钢卷猛地落下，砸在鞍座上弹了一下，地面一阵震动。', '快速落钩会产生冲击载荷，可能直接拉断受损的钢丝绳。应慢速、平稳落钩。',
            { act: { shake: 0.5, prop: { crane: [{ type: 'move', to: 'saddle_near', speed: 1.2 }, { type: 'lower', part: 'hook', by: 4.8, speed: 1.6 }] } } })
        ]
      });
      nodes.push({
        title: '检修前断电',
        text: `钢卷已经平稳落地。维修工${ctx.fixer}赶来，准备爬上天车检查吊具。`,
        view: 'isolator', time: 15,
        set: { fx: { alarm1: 0 }, audio: { alarm: false }, npc: { meng: { show: true, at: 'maint_in', anim: 'walk', to: 'ladder_foot', speed: 1.1 } } },
        choices: [
          C('要求先断开天车电源隔离开关，挂"禁止合闸，有人工作"牌并上锁，确认后再上车作业', 'best', 20, { rule: 3, risk: 2 },
            '你断开隔离开关、挂牌上锁，维修工确认无电后才爬上天车。', '检修起重设备前必须停电、挂牌、上锁，防止有人误操作送电。', { hotspot: 'isolator', act: { prop: { isolator: 'lock' } } }),
          C('让司机在驾驶室别碰操纵杆就行', 'poor', 6, { rule: -2, risk: -1 }, '维修工上车检查时，司机差点下意识地推了一下操纵杆。', '口头约定不能代替停电挂牌上锁。'),
          C('天车已经停了，直接上去检查', 'wrong', 2, { rule: -3, risk: -2 }, '维修工在带电的天车上作业，一旦有人误送电，后果不堪设想。', '设备停止运行不等于断电。检修前必须断电、挂牌、上锁并确认。')
        ]
      });
      if (!P) nodes.push(reportNode(ctx, {
        view: 'overview', intro: '天车已经断电挂牌。',
        best: `"${ctx.place}天车吊运钢卷时${ctx.hazard}，已紧急停车并平稳落钩，钢卷放在鞍座上，天车已断电挂牌，现场无人受伤，请安排检修。"`,
        bestResult: '调度安排设备部门检修，并通知其他班组暂停使用这台天车。'
      }));
      nodes.push(reviewNode(ctx, {
        view: 'overview', set: { prop: { crane: 'stop' } },
        cause: {
          rope: '钢丝绳断股已达到报废标准，班前点检没有发现或发现后仍继续使用。建议严格执行钢丝绳日常点检和报废标准',
          hook: '吊钩防脱钩装置损坏没有及时更换。建议把吊钩、防脱装置纳入班前点检，损坏立即停用',
          brake: '制动器磨损、间隙调整不当，日常点检没有发现。建议严格执行制动器点检和试车确认制度'
        }[ctx.issue],
        blame: '主要是司机开得太快',
        luckWhy: '吊具失效几乎都有断丝、磨损、变形等前兆，班前点检是能够发现的。'
      }));
      return nodes;
    }
  };

  F.electric = {
    template: 'electric', category: '电气火灾', roleDefault: '值班电工', roles: ['值班电工', '检修电工', '班组长'], leader: '调度',
    keywords: ['配电室', '电缆', '着火', '电气', '开关柜', '触电'],
    setup(ctx) {
      ctx.shock = ctx.mods.shock && !has(ctx.text, ['着火', '起火', '冒烟', '火灾']);
      ctx.category = ctx.shock ? '触电' : '电气火灾';
      ctx.hazard = ctx.shock ? '人员触电' : '电缆沟着火';
      ctx.place = '1 号低压配电室';
      ctx.location = '轧钢厂 · 1 号低压配电室';
      ctx.victimN = ctx.names[0] || '小马';
      ctx.basis = ctx.shock
        ? ['《电力安全工作规程》关于停电、验电、挂接地线和触电急救的要求', '《用电安全导则》（GB/T 13869）']
        : ['《电力安全工作规程》关于电气设备着火"先断电、后灭火"的要求', '《建筑灭火器配置设计规范》（GB 50140）关于带电火灾适用灭火器的规定'];
    },
    scene(ctx) {
      const props = [
        { id: 'ext', asset: 'fire_extinguisher', slot: 'ext', type: 'co2', rot: -90 },
        { id: 'ext2', asset: 'fire_extinguisher', slot: 'ext2', type: 'powder', rot: -90 },
        { id: 'alarmbtn', asset: 'alarm_button', slot: 'alarm_btn' },
        { id: 'hydrant', asset: 'hydrant', slot: 'hydrant' }
      ];
      if (ctx.shock) {
        return {
          template: 'electric', view: 'door_in', props,
          npcs: [
            { id: 'victim', pos: [-3.3, 0, -1.4], label: '检修工 ' + ctx.victimN, wear: 'orange', anim: 'fallen', rot: 200 },
            { id: 'elec2', slot: 'outside_ff2', label: '电工', wear: 'navy', anim: 'idle', hidden: true }
          ],
          effects: [{ id: 'arc', type: 'arc', at: 'cab3_arc', intensity: 0 }, { id: 'smoke', type: 'smoke', at: 'cab3', intensity: 0, r: 0.4 }],
          init: { audio: { rumble: 0.05 } }
        };
      }
      return {
        template: 'electric', view: 'door_in', props,
        npcs: [{ id: 'ff', slot: 'outside_ff2', label: '消防员', wear: 'navy', helmet: 'red', anim: 'idle', hidden: true }],
        effects: [
          { id: 'fire', type: 'fire', at: 'cab3', intensity: 0.15, r: 0.35 },
          { id: 'smoke', type: 'smoke', at: 'cab3', intensity: 0.3, r: 0.6 },
          { id: 'arc', type: 'arc', at: 'cab3_arc', intensity: 0 },
          { id: 'haze', type: 'smoke', at: 'smoke_room', intensity: 0, r: 5 }
        ],
        init: { audio: { rumble: 0.05 } }
      };
    },
    plan(ctx) {
      const night = ctx.mods.night ? '夜班' : '';
      if (ctx.shock) {
        const v = ctx.victimN;
        return [
          {
            title: '发现触电',
            text: `你${night}巡检走进配电室，看到检修工${v}倒在 3 号低压柜前，一只手还搭在柜门边裸露的线头上，身体不停抽搐，柜内不时闪出电火花。`,
            view: 'door_in', time: 10, set: { fx: { arc: 0.7, smoke: 0.3 }, audio: { hiss: 0.15 } },
            choices: [
              C(`冲上去用手把${v}拉开`, 'fatal', 0, { risk: -3, protect: -3, rule: -3 },
                `你抓住${v}的衣服往外一拽，一股电流瞬间传到你身上——`, '触电者身体带电，直接用手接触会使施救者同样触电。必须先切断电源，或用绝缘物使触电者脱离电源。',
                { act: { view: 'fire_close', flash: 'cab3_arc', flashPower: 0.6, shake: 1.0, vignette: 'fatal' } }),
              C('立即断开 3 号柜的上级电源，确认断电后再施救，同时呼叫调度和急救', 'best', 20, { respond: 3, rescue: 2, rule: 3 },
                `你跑到进线柜断开了上级开关，电火花随即消失。确认断电后，你把${v}平放在绝缘垫上，同时呼叫了调度和急救。`, '触电急救的第一步是迅速切断电源，施救者自身不能成为第二个触电者。',
                { act: { fx: { arc: 0, smoke: 0.1 }, npc: { victim: { anim: 'fallen' } } } }),
              C('找不到电源开关时，站在绝缘垫上用干燥的木棍把电线挑开', 'ok', 14, { rescue: 2, protect: 1, respond: 1 },
                `你踩在绝缘垫上，用干燥的木棍挑开了线头，${v}脱离了电源。`, '无法迅速断电时，可以用干燥的绝缘物使触电者脱离电源，但施救者必须做好自身绝缘。能断电时应优先断电。',
                { act: { fx: { arc: 0.2 } } }),
              C('跑出配电室去找人帮忙', 'poor', 4, { rescue: -2, respond: -2 },
                `你跑出去叫人，等大家赶回来，${v}已经触电很长时间了。`, '触电后每一秒都很关键。应先就近断电、使触电者脱离电源，同时呼救。', { act: { view: 'outside' } })
            ]
          },
          {
            title: '心肺复苏',
            text: `${v}已经脱离电源，躺在地上叫不醒。你看不到他的胸口起伏，也摸不到颈动脉搏动。`,
            view: 'fire_close', time: 15, set: { fx: { arc: 0 } },
            choices: [
              C('立即呼叫 120，同时开始心肺复苏：胸外按压 30 次、人工呼吸 2 次，有 AED 时尽快使用，直到医护人员到达', 'best', 20, { rescue: 3, rule: 1 },
                `你跪在${v}身边持续按压。几分钟后，他咳了一声，恢复了微弱的呼吸。`, '触电导致心跳呼吸停止时，越早开始心肺复苏，抢救成功的可能性越大。'),
              C('先给他喝点水', 'wrong', 2, { rescue: -2 }, '他根本无法吞咽，水呛进了气管。', '昏迷的人不能喂水，应立即判断呼吸心跳并进行心肺复苏。'),
              C('不敢乱动，等医生来了再说', 'poor', 4, { rescue: -2 }, '医生十几分钟后才到，错过了最佳抢救时间。', '心跳骤停后 4 分钟内是抢救的黄金时间，现场人员应立即开始心肺复苏。')
            ]
          },
          reportNode(ctx, {
            view: 'door_in', intro: '急救人员正在赶来。',
            best: `"${ctx.place} 3 号低压柜检修工${v}触电，已断开上级电源，人员一度呼吸心跳停止，正在做心肺复苏，已呼叫 120。"`,
            bestResult: '调度通知厂医务室和安全部门赶到现场，并通知其他班组暂停该回路作业。'
          }),
          cordonNode(ctx, {
            title: '防止误送电',
            text: '这时另一名电工走进配电室，看到上级开关断开了，伸手就要合闸："谁把电拉了？生产线还等着呢。"',
            view: 'door_in', passer: 'elec2',
            set: { npc: { elec2: { show: true, at: 'outside_ff2', anim: 'walk', to: 'free3', speed: 1.2 } } },
            bestText: '立即制止他，说明有人触电正在抢救，在断开的开关上挂"禁止合闸，有人工作"牌并上锁',
            bestResult: '电工愣了一下，赶紧缩回手，帮你挂好了警示牌。',
            stopAct: { npc: { elec2: { anim: 'idle' } } },
            wrong: C('让他先合上，生产要紧', 'wrong', 0, { rule: -3, risk: -3 }, '开关合上的一瞬间，3 号柜里又闪出一串电火花。', '事故回路在查明原因、确认安全前严禁送电。必须挂牌上锁，防止误送电。', { act: { fx: { arc: 1 }, shake: 0.4 } })
          }),
          reviewNode(ctx, {
            view: 'overview', set: { fx: { arc: 0, smoke: 0 } },
            cause: '检修时没有执行停电、验电、挂接地线和挂牌上锁，直接在带电柜内作业。建议严格执行电气作业工作票和挂牌上锁制度',
            blame: `主要是${v}自己太大意`,
            luckWhy: '电气检修触电几乎都与没有停电验电、没有挂牌上锁有关，严格执行工作票制度是可以预防的。'
          })
        ];
      }
      return [
        {
          title: '发现起火',
          text: `你${night}巡检推开配电室的门，一股刺鼻的焦糊味扑面而来。3 号低压柜下方的电缆沟里冒出浓烟，能看到火苗，还不时闪出电火花。`,
          view: 'door_in', time: 12,
          set: { fx: { fire: 0.55, smoke: 0.8, arc: 0.7, haze: 0.2 }, audio: { rumble: 0.25, hiss: 0.15 } },
          choices: [
            C('立即报告调度，按规程断开着火回路的上级电源，再用二氧化碳或干粉灭火器在安全距离外扑救', 'best', 20, { respond: 3, report: 2, rule: 3 },
              '调度确认后，你断开了上级开关，电火花随即消失。你拿起二氧化碳灭火器，在安全距离外对准火根喷射。', '电气火灾要"先断电、后灭火"。来不及断电时，只能使用二氧化碳、干粉等不导电的灭火剂，并保持安全距离。',
              { hotspot: 'ext', act: { fx: { arc: 0, fire: 0.4 } } }),
            C('拉出墙边的消火栓水带，直接喷水灭火', 'fatal', 0, { rule: -3, risk: -3, protect: -2 },
              '水柱打到还带电的开关柜上，电流顺着水流和潮湿的地面传到你身上——', '带电设备着火严禁用水扑救。水会导电，扑救人员可能触电身亡。',
              { hotspot: 'hydrant', act: { flash: 'cab3_arc', flashPower: 0.8, shake: 1.2, vignette: 'fatal', fx: { arc: 1 } } }),
            C('上前查看是哪根电缆着火', 'wrong', 2, { protect: -3, risk: -2 },
              '你凑近电缆沟，被浓烟呛得直咳，一道电弧在你眼前炸开，你本能地后退摔倒在地。', '电缆燃烧产生的烟气有毒，带电状态下还可能产生电弧。不要在没有断电和防护的情况下靠近。',
              { act: { view: 'fire_close', shake: 0.7, fx: { arc: 1 }, vignette: 'warn' } }),
            C('按下火灾报警按钮，关上配电室门，到门外向调度报告', 'ok', 12, { report: 2, protect: 2, respond: -1 },
              '报警铃声响起，你在门外向调度报告了起火位置。但火还在烧，没有人断电。', '报警和报告是对的，但值班电工熟悉配电系统，在确保安全时应先断开着火回路电源，为灭火创造条件。',
              { hotspot: 'alarmbtn', act: { view: 'outside', fx: { fire: 0.9, arc: 0 }, audio: { alarm: true } } })
          ]
        },
        {
          title: '火势蔓延',
          text: '火没有被完全扑灭，电缆沟里的火顺着电缆蔓延，配电室里浓烟越来越大，照明突然熄灭，只剩应急灯亮着。',
          view: 'door_in', time: 12,
          set: { power: false, fx: { fire: 0.85, smoke: 1, haze: 0.9, arc: 0 }, vignette: 'warn', audio: { rumble: 0.35 } },
          choices: [
            C('停止扑救，立即撤出配电室，关闭防火门，在门外报告调度并拨打 119', 'best', 20, { protect: 3, report: 2, respond: 1 },
              '你退出配电室，关上防火门，向调度和 119 报告了火势和位置。', '火势超出初期扑救能力时，必须立即撤离并关门控制火势和烟气蔓延，等待专业消防。', { act: { view: 'outside' } }),
            C('继续在烟里扑救，一定要把火扑灭', 'wrong', 2, { protect: -3, risk: -2 },
              '浓烟让你看不清方向，呛得喘不过气，最后摸着墙才退了出来。', '电缆燃烧的烟气含有大量有毒气体，在浓烟中坚持扑救极易中毒窒息。', { act: { view: 'fire_close', shake: 0.6 } }),
            C('打开门窗通风排烟', 'poor', 6, { risk: -2, respond: -1 },
              '新鲜空气涌进来，火势反而猛地蹿高了。', '火灾中贸然通风会给火势供氧。应关闭门窗控制火势，由消防人员决定排烟时机。', { act: { fx: { fire: 1 } } })
          ]
        },
        {
          title: '配合消防',
          text: '消防队到达。消防员问你："里面什么情况？还有电吗？有没有人？"',
          view: 'outside', time: 15,
          set: { vignette: '', npc: { ff: { show: true, at: 'outside_ff2', anim: 'walk', to: 'outside_ff' } } },
          choices: [
            C('"3 号低压柜下方电缆沟着火，上级电源已经断开，但相邻进线柜可能仍带电。室内没有人员，门口有二氧化碳和干粉灭火器。"', 'best', 20, { report: 3, rule: 1, rescue: 1 },
              '消防员确认了带电情况，选用合适的灭火剂进入扑救。', '向消防人员说明着火位置、带电情况和人员情况，是配合灭火的关键信息。'),
            C('"应该没电了，你们直接进去用水灭吧。"', 'wrong', 0, { rule: -3, report: -2 }, '消防员没有轻信，坚持确认后才进入，耽误了几分钟。', '没有确认断电就说"没电"，可能导致消防人员触电。报告必须准确。'),
            C('"我也不太清楚，你们自己看吧。"', 'poor', 4, { report: -2 }, '消防员只好自己摸排情况，灭火进度被拖慢。', '值班电工最熟悉现场设备和供电情况，应主动向消防人员提供准确信息。')
          ]
        },
        {
          title: '恢复送电',
          text: '火已扑灭。车间打来电话催问：生产线停着，能不能马上恢复送电？',
          view: 'overview', time: 20,
          set: { fx: { fire: 0, smoke: 0.25, haze: 0.3 }, audio: { rumble: 0.05, hiss: 0, alarm: false } },
          choices: [
            C('不能马上送电：先查明起火原因，检查电缆和开关柜绝缘，确认合格、办理手续后再按程序送电', 'best', 20, { rule: 3, risk: 2 },
              '经过检查和绝缘测试，受损电缆被隔离更换后，配电室按程序恢复了送电。', '火灾后设备绝缘可能受损，未经检查直接送电可能再次引发短路和火灾。', { act: { power: true } }),
            C('直接合闸送电，生产要紧', 'wrong', 0, { rule: -3, risk: -3 }, '合闸瞬间，受损的电缆再次短路，冒出一串火花。', '事故回路未查明原因、未经检查严禁送电。', { act: { power: true, fx: { arc: 1, smoke: 0.8 }, shake: 0.6 } }),
            C('把着火的这一路隔离开，确认其他回路绝缘正常后先恢复送电', 'ok', 12, { rule: 1, respond: 1 },
              '其他回路检查合格后恢复了送电，着火回路等待更换电缆。', '在隔离故障回路、确认其他回路安全的前提下分步恢复，是可行的做法，但必须按程序办理手续。', { act: { power: true } })
          ]
        },
        reviewNode(ctx, {
          view: 'overview', set: { fx: { smoke: 0.1, haze: 0.1 } },
          cause: '电缆沟内电缆老化、接头过热，防火封堵不严，日常巡检没有发现。建议加强电缆测温和防火封堵检查',
          blame: '主要是上一班巡检的人不认真',
          luckWhy: '电缆火灾多有过热、异味等前兆，定期测温和巡检是可以提前发现的。'
        })
      ];
    }
  };

  // 通用设备着火 / 未识别险情：用占位体拼出险情点，剧本按通用应急原则编排
  const SITES = {
    bof: { src: [2, 0, 6], cam: [9, 1.7, 12], safe: [20, 1.7, 15], exit: [26, 0, 9] },
    caster: { src: [-8, 0, 8], cam: [-1, 1.7, 12], safe: [14, 1.7, 13], exit: [20, 0, 12] },
    gas: { src: [10, 0, -6], cam: [16, 1.7, 2], safe: [24, 1.7, 14], exit: [30, 0, 20] },
    coil: { src: [14, 0, 2], cam: [20, 1.7, 7], safe: [-6, 1.7, 7], exit: [28, 0, 6] },
    electric: { src: [0, 0, 0.3], cam: [7.8, 1.7, 0.5], safe: [11.4, 1.7, 0.3], exit: [11.5, 0, 0.8] }
  };
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

  function siteFor(ctx) {
    const tid = ctx.opts.template && ZY.templates[ctx.opts.template] ? ctx.opts.template : (ZY.logic && ZY.logic.detectTemplate(ctx.text)) || 'bof';
    ctx.tpl = tid;
    const s = SITES[tid] || SITES.bof;
    ctx.site = s;
    ctx.views = {
      look: { p: s.cam, t: add3(s.src, [0, 1.2, 0]) },
      close: { p: add3(s.src, [2.2, 1.7, 2.2]), t: add3(s.src, [0, 1.0, 0]) },
      safe: { p: s.safe, t: add3(s.src, [0, 1.5, 0]) },
      overview: ZY.templates[tid].defaultView
    };
  }

  function genericScene(ctx, burning) {
    const s = ctx.site, eq = ctx.equip;
    const props = [
      eq.asset ? { id: 'src', asset: eq.asset, pos: s.src, label: eq.text, n: 1 } : { id: 'src', asset: 'placeholder', pos: s.src, label: eq.text, size: 2.2 },
      { id: 'ext', asset: 'fire_extinguisher', pos: add3(s.src, [3.2, 0, 3]), type: ctx.mods.oil ? 'powder' : 'co2' },
      { id: 'assembly', asset: 'assembly_point', pos: [s.safe[0] + 1.5, 0, s.safe[2] + 1.5] },
      { id: 'tape', asset: 'barrier', pos: add3(s.src, [6, 0, 4]), w: 5, hidden: true }
    ];
    if (eq.text !== '险情点' && eq.text !== '起火点') ctx.unmatch(eq.text, eq.asset ? 'similar' : 'placeholder', eq.asset);
    const npcs = [{ id: 'passer', pos: s.exit, label: '外来人员', wear: 'gray', anim: 'idle', hidden: true }];
    if (ctx.mods.people) npcs.push({ id: 'mate', pos: add3(s.src, [-2.2, 0, 1.6]), label: ctx.mateLabel, wear: 'blue', anim: 'work', face: 'src' });
    const effects = burning
      ? [{ id: 'fire', type: 'fire', at: 'src.top', intensity: 0.2, r: 0.6 }, { id: 'smoke', type: 'smoke', at: 'src.top', intensity: 0.3, r: 1.2 }]
      : [{ id: 'smoke', type: 'smoke', at: 'src.top', intensity: 0.3, r: 1.0 }, { id: 'steam', type: 'steam', at: 'src.top', intensity: 0, r: 0.8 }, { id: 'alarm1', type: 'alarm', at: add3(s.src, [0, 3.2, 0]), intensity: 0 }];
    return { template: ctx.tpl, view: ctx.views.overview, props, npcs, effects, init: { audio: { rumble: 0.15 } } };
  }

  F.fire = {
    template: null, category: '火灾', roleDefault: '岗位操作工', roles: ['岗位操作工', '巡检工', '班组长'], leader: '调度',
    keywords: ['着火', '火灾', '冒烟', '灭火'],
    setup(ctx) {
      siteFor(ctx);
      ctx.equip = ctx.equipment.shift();
      if (!ctx.equip) {
        const m = ctx.text.match(/([一-龥]{2,5}?)(?:突然)?(?:着火|起火|冒烟|失火|燃烧)/);
        const word = m && m[1].replace(/^(的|里|上|下|旁)/, '');
        ctx.equip = { text: word && !has(word, ['车间', '现场', '厂房', '这里', '那里', '附近', '突然', '发现']) ? word : '起火点', asset: null };
      }
      ctx.hazard = ctx.equip.text + '着火';
      ctx.place = ZY.templates[ctx.tpl].name.replace(/（.*）/, '');
      ctx.location = ZY.templates[ctx.tpl].name;
      ctx.basis = ['《中华人民共和国消防法》关于报警和初期火灾扑救的要求', '《建筑灭火器配置设计规范》（GB 50140）关于灭火器适用火灾类型的规定'];
    },
    scene(ctx) {
      return genericScene(ctx, true);
    },
    plan(ctx) {
      const m = ctx.mods, P = m.people, eq = ctx.equip.text, mate = ctx.mate, V = ctx.views;
      const runMate = P ? { npc: { mate: { anim: 'run', to: [ctx.site.safe[0], 0, ctx.site.safe[2] + 1] } } } : {};
      return [
        {
          title: '发现起火',
          text: `你在${ctx.place}巡检时，突然闻到一股焦糊味，${eq}${m.oil ? '下方渗出的油液' : ''}冒出浓烟，很快窜起了明火。${P ? `${mate}正在旁边作业，还没有察觉。` : ''}`,
          view: V.look, time: 12,
          set: { fx: { fire: 0.6, smoke: 0.8 }, audio: { rumble: 0.3, hiss: 0.2 } },
          choices: [
            C('上前查看是哪里着火', 'wrong', 2, { protect: -2, risk: -2 },
              '你凑近查看，浓烟呛得你直咳，火苗突然窜高，你被燎了一下急忙后退。', '起火初期也可能突然扩大，不应在没有防护、没有灭火器材的情况下靠近查看。',
              { act: { view: V.close, fx: { fire: 0.9 }, shake: 0.4, vignette: 'warn' } }),
            C(`立即呼喊报警并报告${ctx.leader}，确认安全后用灭火器在上风向对准火根扑救`, 'best', 20, { respond: 3, report: 2, rule: 2, rescue: P ? 1 : 0 },
              `你大喊"着火了！"，用对讲机报告了起火位置，${P ? `${mate}应声撤开，` : ''}随后提起灭火器，在上风向对准火根喷射，火势明显减弱。`,
              '发现初起火灾，应先报警、呼喊周边人员，在确保自身安全的前提下用合适的灭火器扑救初起火灾。',
              { hotspot: 'ext', act: Object.assign({ fx: { fire: 0.35 } }, runMate) }),
            m.oil
              ? C('提起水桶往火上泼水', 'wrong', 0, { rule: -3, risk: -2 }, '水泼到燃烧的油液上，燃油四处飞溅，火势一下子蔓延开来。',
                '油类火灾不能用水扑救，水会让燃油飞溅流散、扩大火势。应使用干粉或泡沫灭火器。', { act: { fx: { fire: 1 }, shake: 0.4 } })
              : C('不报告，自己先扑救，扑不灭再说', 'poor', 6, { report: -2, respond: 1 },
                '你用灭火器扑了一会儿，火没灭，这才想起报告，消防到场的时间被耽误了。', '扑救初起火灾的同时必须报警，不能等扑不灭了再报告。', { act: { fx: { fire: 0.7 } } }),
            C('赶紧离开现场，等别人发现', 'wrong', 2, { report: -3, respond: -2, rule: -1 },
              '你离开了现场，火势在无人处置的情况下越烧越大。', '发现火情必须立即报警。隐瞒或回避火情会让小火酿成大灾。', { act: { view: V.safe, fx: { fire: 1 } } })
          ]
        },
        {
          title: '火势扩大',
          text: `灭火器喷完了，${eq}的火势仍没有被控制，浓烟开始向四周扩散，热浪逼得人睁不开眼。`,
          view: V.look, time: 12,
          set: { fx: { fire: 1, smoke: 1 }, vignette: 'warn', audio: { rumble: 0.45, alarm: true } },
          choices: [
            C('停止扑救，立即撤离到上风向安全区域，引导周边人员疏散，并报告火势变化', 'best', 20, { protect: 3, rescue: 1, report: 2 },
              '你撤到安全区域，一边引导其他人员撤离，一边向调度报告火势已扩大。', '火势超出初期扑救能力时，必须果断撤离，把灭火交给专业消防人员。', { act: Object.assign({ view: V.safe, vignette: '' }, runMate) }),
            C('再去拿一具灭火器，接着扑', 'wrong', 4, { protect: -2, risk: -2 },
              '你又冲回去扑救，热浪和浓烟让你几乎喘不过气，最后被同事拉了回来。', '初期扑救失败后继续靠近，极易被烟气和高温伤害。应撤离并等待专业消防。', { act: { view: V.close, shake: 0.4 } }),
            C('先回去抢出工具和记录本', 'poor', 4, { protect: -2, risk: -1 }, '你冒险跑回去拿东西，被浓烟呛得直咳。', '火灾中不能为了财物返回危险区，人身安全永远第一。')
          ]
        },
        reportNode(ctx, {
          view: V.safe, intro: '你已经撤到安全区域。',
          set: { vignette: '' },
          best: `"${ctx.place}${eq}着火${m.oil ? '，火源是液压油' : ''}，初期扑救没有控制住，火势在扩大。${P ? `${mate}和我已撤到上风向，` : '我已撤到上风向，'}现场暂无人员受伤，请求消防支援。"`,
          bestResult: `${ctx.leader}立即通知消防队，并安排切断相关区域的电源和油源。`
        }),
        cordonNode(ctx, {
          text: '消防队还在路上。一名不知情的外来人员正从通道走过来，想抄近路穿过着火区域。',
          view: V.safe, passer: 'passer',
          set: { fx: { fire: 0.8 }, npc: { passer: { show: true, anim: 'walk', to: add3(ctx.site.src, [7, 0, 5]), speed: 1.1 } } },
          bestResult: '他停下脚步，跟着你退到了警戒线外。',
          wrong: C('让他从着火区旁边快速绕过去', 'wrong', 0, { risk: -3, rule: -2 }, '他贴着着火区走过，一阵浓烟扑来，他捂着嘴狼狈地跑开。', '火灾现场烟气有毒、可能突然扩大，必须禁止无关人员靠近或穿行。')
        }),
        reviewNode(ctx, {
          view: V.overview, set: { fx: { fire: 0, smoke: 0.15 }, audio: { alarm: false, rumble: 0.05 } },
          cause: m.oil
            ? '液压管路接头渗漏，油液喷到高温部位被引燃。建议加强液压系统点检、及时消除渗漏，在高温部位做好隔热防护'
            : `${eq}长期运行缺少点检和清扫，过热或积尘引发起火。建议落实设备点检和清扫制度，配齐适用的灭火器材`,
          blame: P ? `主要是${mate}操作不当` : '主要是巡检的人来得太晚'
        })
      ];
    }
  };

  F.generic = {
    template: null, category: '综合应急', roleDefault: '岗位操作工', roles: ['岗位操作工', '巡检工', '班组长'], leader: '班组长',
    keywords: [],
    setup(ctx) {
      siteFor(ctx);
      const eq = ctx.equipment.shift();
      ctx.equip = eq || { text: '险情点', asset: null };
      const short = ctx.text.replace(/[，。,；;！!]/g, ' ').trim().split(/\s+/)[0].slice(0, 14) || '现场异常';
      ctx.hazard = short;
      ctx.place = ZY.templates[ctx.tpl].name.replace(/（.*）/, '');
      ctx.location = ZY.templates[ctx.tpl].name;
      ctx.basis = ['《生产安全事故应急条例》', '企业综合应急预案（通用原则）'];
      ctx.warn.push('没有识别到已知的危险源类型，已按通用应急处置原则生成，建议专家重点审核，或补充描述（设备、危险源、人员情况）后重新生成');
    },
    scene(ctx) {
      return genericScene(ctx, false);
    },
    plan(ctx) {
      const P = ctx.mods.people, mate = ctx.mate, V = ctx.views, h = ctx.hazard;
      return [
        {
          title: '发现异常',
          text: `你在${ctx.place}作业时发现异常：${ctx.text.slice(0, 60)}。${P ? `${mate}就在附近。` : ''}`,
          view: V.look, time: 12, set: { fx: { smoke: 0.7, steam: 0.6, alarm1: 1 }, audio: { alarm: true, rumble: 0.4 } },
          choices: [
            C('上前查看情况', 'wrong', 2, { risk: -2, protect: -2 }, '你走近险情点，情况比你想的更复杂，你只好又退了回来，耽误了宝贵的时间。',
              '在不清楚险情性质时，不能贸然靠近。应先撤到安全位置，报告并等待专业判断。', { act: { view: V.close, vignette: 'warn' } }),
            C(`立即撤到安全位置，报告${ctx.leader}，说明位置和现场情况`, 'best', 20, { protect: 3, report: 3, risk: 1 },
              `你撤到安全位置，用对讲机向${ctx.leader}报告了险情位置和现场情况。`, '"先撤离、再报告、后处置"是应对不明险情的通用原则。', { act: { view: V.safe } }),
            C('自己先动手处理，处理不了再报告', 'poor', 6, { report: -2, protect: -1 }, '你忙了半天，险情没有缓解，报告也晚了。', '超出岗位职责和能力的险情，不应擅自处置，应先报告。'),
            C('觉得问题不大，继续干活', 'wrong', 0, { risk: -3, report: -2 }, '十几分钟后，险情明显扩大了。', '对异常情况视而不见是事故的常见起因。发现异常必须报告。')
          ]
        },
        reportNode(ctx, {
          view: V.safe, intro: '你已经撤到安全位置。',
          best: `"${ctx.place}出现险情：${h}。我已撤到安全位置，${P ? `${mate}也已撤离，` : ''}现场暂无人员受伤，请安排专业人员到场确认处置。"`
        }),
        cordonNode(ctx, {
          text: '一名不知情的人员正朝险情点走过来。',
          view: V.safe, passer: 'passer',
          set: { npc: { passer: { show: true, anim: 'walk', to: add3(ctx.site.src, [7, 0, 5]), speed: 1.1 } } },
          bestResult: '他停下脚步，退到了警戒线外。',
          wrong: C('不管他，他应该知道', 'wrong', 2, { risk: -2 }, '他走进了险情区域，被赶来的班组长喝止。', '发现有人进入险情区域，必须主动制止并设置警戒。')
        }),
        reviewNode(ctx, {
          view: V.overview, set: { fx: { smoke: 0.1, steam: 0, alarm1: 0 }, audio: { alarm: false } },
          cause: '这次险情暴露出设备点检和隐患排查不到位。建议把相关设备纳入日常点检，并补充针对性的现场处置方案'
        })
      ];
    }
  };

  // ---------- 拼装 ----------

  const FOCUS = { 风险识别: 'risk', 自我防护: 'protect', 应急处置: 'respond', 信息报告: 'report', 协同救援: 'rescue', 规程掌握: 'rule' };

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function applyRulings(nodes, category) {
    const rulings = (ZY.store.rulings && ZY.store.rulings()) || [];
    let n = 0;
    for (const node of nodes) for (const c of node.choices) {
      const r = rulings.find((x) => x.text === c.text && (!x.category || x.category === category));
      if (!r) continue;
      if (r.verdict && r.verdict !== c.verdict) c.why = ZY.catalog.expertWhy(r.verdict, c.why);
      if (r.verdict) c.verdict = r.verdict;
      if (r.score != null) c.score = r.score;
      if (c.verdict === 'fatal') {
        c.next = null;
        c.act = Object.assign({}, c.act, { vignette: 'fatal' });
      } else if (c.next === null) delete c.next;
      if (c.verdict !== 'fatal' && c.act && c.act.vignette === 'fatal') c.act = Object.assign({}, c.act, { vignette: 'warn' });
      c.reviewed = true;
      c.ruled = true;
      n++;
    }
    return n;
  }

  function compose(desc, opts) {
    opts = opts || {};
    const a = analyze(desc, opts);
    const fam = F[a.family];
    const rng = ZY.tex.rng(hashStr(desc + '|' + (opts.seed || '')));
    const warn = [];
    const unmatched = [];
    const ctx = {
      text: String(desc), opts, mods: Object.assign({}, a.mods), names: a.names.slice(), count: a.count, meters: a.meters, unit: a.unit,
      equipment: a.equipment.slice(), leader: fam.leader, warn, rng,
      unmatch(text, kind, asset) {
        if (!unmatched.some((u) => u.text === text)) unmatched.push({ text, fallback: kind, asset: asset || null });
      }
    };
    const focusKey = FOCUS[opts.focus] || null;
    if (focusKey === 'rescue') ctx.mods.people = ctx.mods.victim = true;
    if (focusKey === 'risk' || focusKey === 'protect') ctx.mods.water = true;
    const pool = NAME_POOL.filter((n) => ctx.names.indexOf(n) < 0);
    shuffle(pool, rng);
    ctx.mate = ctx.names[0] || pool[0];
    if (!ctx.names.length) ctx.names = pool.slice(0, 3);
    ctx.mateLabel = '同事 ' + ctx.mate;
    ctx.role = a.role || fam.roleDefault;
    fam.setup(ctx);
    const scene = fam.scene(ctx);
    const tpl = ZY.templates[scene.template];
    // 描述里出现、但不属于本危险源核心资产的设备：相近资产替代或占位体
    for (const e of ctx.equipment) {
      if (scene.props.some((p) => p.label === e.text)) continue;
      const id = 'extra' + scene.props.length;
      scene.props.push(e.asset ? { id, asset: e.asset, label: e.text, n: 1 } : { id, asset: 'placeholder', label: e.text });
      ctx.unmatch(e.text, e.asset ? 'similar' : 'placeholder', e.asset);
    }
    for (const u of unmatched) {
      warn.push(u.fallback === 'similar'
        ? `资产库中没有「${u.text}」，已用相近资产「${ZY.assets.defs[u.asset].label}」代替`
        : `资产库中没有「${u.text}」，已用带标签的占位体代替，并加入待补充资产清单`);
    }
    const list = fam.plan(ctx).filter(Boolean);
    const category = ctx.category || fam.category;
    const ruled = applyRulings(list, category);
    if (ruled) warn.push(`沿用了 ${ruled} 条企业专家的审核判定`);
    list.forEach((n, i) => (n.id = 'N' + (i + 1)));
    const nodes = {};
    list.forEach((n, i) => {
      const nxt = i < list.length - 1 ? list[i + 1].id : null;
      n.choices = n.choices.filter(Boolean);
      n.choices.forEach((c) => {
        if (c.verdict === 'fatal') c.next = null;
        else if (c.next === undefined) c.next = nxt;
      });
      shuffle(n.choices, rng).forEach((c, k) => (c.id = 'abcd'[k]));
      const id = n.id;
      delete n.id;
      nodes[id] = n;
    });
    const m = ctx.mods;
    const tags = [];
    if (m.water && (a.family === 'splash' || a.family === 'ladle')) tags.push('地面积水');
    if (m.victim) tags.push('人员受伤');
    else if (m.people) tags.push('有人在场');
    if (focusKey) tags.push('复训：' + opts.focus);
    const title = ctx.hazard + (tags.length ? ' · ' + tags.join(' · ') : '');
    const understanding = [
      { k: '危险源', v: ctx.hazard },
      { k: '车间模板', v: tpl.name },
      { k: '学员岗位', v: ctx.role + (a.role ? '' : '（默认）') },
      { k: '人员情况', v: m.victim ? '有人受伤 / 受困' : m.people ? '现场有其他人员' : '无其他人员' },
      { k: '次生风险', v: [m.water && '积水', m.oil && '油品', m.night && '夜班'].filter(Boolean).join('、') || '未提及' }
    ];
    if (unmatched.length) understanding.push({ k: '库外设备', v: unmatched.map((u) => u.text).join('、') });
    const scenario = {
      title,
      category,
      location: ctx.location,
      role: ctx.role,
      difficulty: m.victim || m.water ? '高' : '中',
      duration: `约 ${list.length} 分钟`,
      keywords: fam.keywords.concat(a.names),
      summary: `${ctx.location.split(' · ').pop()}发生${ctx.hazard}${m.water && tags.indexOf('地面积水') >= 0 ? '，现场地面有积水' : ''}${m.victim ? '，有人员受伤' : m.people ? '，附近还有其他人员' : ''}。`,
      briefing: `你是${ctx.location.split(' · ').pop()}的${ctx.role}。${opts.focus ? `本次是针对「${opts.focus}」的复训演练。` : ''}请根据现场情况作出处置，每个环节限时作答。`,
      basis: ctx.basis || [],
      scene,
      start: 'N1',
      nodes,
      engine: 'local',
      family: a.family,
      understanding,
      unmatched
    };
    return { scenario, warnings: warn, analysis: a, ruled };
  }

  ZY.composer = { analyze, compose, families: F, focusKeys: FOCUS };
})();
