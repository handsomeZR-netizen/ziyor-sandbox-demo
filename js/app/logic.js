(function () {
  const ZY = window.ZY;
  const VERDICTS = ['best', 'ok', 'poor', 'wrong', 'fatal'];
  const ANIMS = ['idle', 'walk', 'run', 'retreat', 'shield', 'fallen', 'crawl', 'wave', 'call', 'work', 'kneel'];
  const DEFAULT_SCORE = { best: 20, ok: 14, poor: 6, wrong: 2, fatal: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const TEMPLATE_HINTS = {
    bof: ['转炉', '钢包', '出钢', '钢水', '炼钢', '喷溅', '铁水', '钢渣', '炉前', '吹氧', '兑铁'],
    caster: ['连铸', '结晶器', '中间包', '铸坯', '二冷', '浇注', '浇钢', '拉坯'],
    gas: ['煤气', '一氧化碳', 'CO', '管道', '阀门', '有限空间', '井', '窒息', '缺氧', '室外', '氮气', '氧气'],
    coil: ['天车', '行车', '吊运', '钢卷', '起重', '吊具', '钢丝绳', '仓库', '吊物', '叉车', '成品库'],
    electric: ['配电', '电缆', '开关柜', '触电', '电气', '变压器', '短路', '电房', '电柜']
  };

  const BASIS_HINTS = [
    [['钢水', '铁水', '钢包', '转炉', '连铸', '漏钢', '喷溅', '钢渣'], '《炼钢安全规程》（AQ 2001）'],
    [['煤气', '一氧化碳', 'CO'], '《工业企业煤气安全规程》（GB 6222）'],
    [['有限空间', '井', '窒息', '缺氧', '储罐', '罐内'], '《工贸企业有限空间作业安全规定》'],
    [['天车', '行车', '起重', '吊运', '钢丝绳', '吊物'], '《起重机械安全规程》（GB 6067）'],
    [['配电', '电缆', '触电', '电气', '开关柜', '变压器'], '《电力安全工作规程》'],
    [['火', '燃烧', '灭火'], '《建筑灭火器配置设计规范》（GB 50140）']
  ];

  function detectTemplate(text) {
    let best = null, bestScore = 0;
    for (const id in TEMPLATE_HINTS) {
      const s = TEMPLATE_HINTS[id].reduce((n, k) => n + (text.indexOf(k) >= 0 ? k.length : 0), 0);
      if (s > bestScore) {
        best = id;
        bestScore = s;
      }
    }
    return best;
  }

  function detectBasis(text) {
    const out = BASIS_HINTS.filter((b) => b[0].some((k) => text.indexOf(k) >= 0)).map((b) => b[1]);
    return out.length ? out : ['企业安全生产事故应急预案（通用原则）'];
  }

  function validate(raw) {
    const warn = [];
    const s = JSON.parse(JSON.stringify(raw || {}));
    s.id = String(s.id || 'gen-' + Date.now()).replace(/[^\w-]/g, '') || 'gen-' + Date.now();
    s.title = s.title || '自定义演练场景';
    s.category = s.category || '自定义场景';
    s.role = s.role || '现场作业人员';
    s.location = s.location || '';
    s.keywords = Array.isArray(s.keywords) ? s.keywords : [];
    s.basis = Array.isArray(s.basis) ? s.basis : [];
    s.scene = s.scene || {};
    if (!ZY.templates[s.scene.template]) {
      const guess = detectTemplate((s.title || '') + (s.summary || '')) || 'bof';
      warn.push(`未识别的车间模板「${s.scene.template || '空'}」，已改用「${ZY.templates[guess].name}」`);
      s.scene.template = guess;
    }
    const tpl = ZY.templates[s.scene.template];
    const defs = ZY.assets.defs;
    const ids = new Set();
    s.unmatched = Array.isArray(s.unmatched) ? s.unmatched : [];
    s.scene.props = (s.scene.props || []).filter((p) => p && p.id && !ids.has(p.id) && ids.add(p.id)).map((p) => {
      if (!defs[p.asset]) {
        warn.push(`资产库中没有「${p.label || p.asset}」，已用带标签的占位体代替`);
        p.label = p.label || p.asset;
        p.asset = 'placeholder';
        s.unmatched.push({ text: p.label, fallback: 'placeholder', asset: null });
      }
      if (p.slot && !tpl.slots[p.slot] && !Array.isArray(p.pos)) {
        warn.push(`「${p.label || p.id}」的摆放位置「${p.slot}」不存在，已自动分配`);
        delete p.slot;
      }
      return p;
    });
    s.scene.npcs = (s.scene.npcs || []).filter((n) => n && n.id && !ids.has(n.id) && ids.add(n.id)).map((n) => {
      if (n.anim && ANIMS.indexOf(n.anim) < 0) n.anim = 'idle';
      if (n.slot && !tpl.slots[n.slot] && !Array.isArray(n.pos)) delete n.slot;
      return n;
    });
    const refOk = (r) => {
      if (!r || Array.isArray(r)) return true;
      if (typeof r === 'object') return true;
      const pid = r.split('.')[0];
      return !!tpl.slots[r] || ids.has(pid);
    };
    s.scene.effects = (s.scene.effects || []).filter((e) => {
      if (!e || !e.id || !ZY.fx.types[e.type]) {
        if (e) warn.push(`不支持的特效「${e.type}」，已忽略`);
        return false;
      }
      if (!refOk(e.at)) {
        warn.push(`特效「${e.id}」的位置「${e.at}」无法解析，已放到场景中央`);
        e.at = Object.keys(tpl.slots).find((k) => k.indexOf('free') === 0) || [0, 1, 0];
      }
      if (e.type === 'molten_stream' && !refOk(e.to)) return false;
      return true;
    });
    if (Array.isArray(s.nodes)) {
      const o = {};
      s.nodes.forEach((n, i) => (o[n.id || 'N' + (i + 1)] = n));
      s.nodes = o;
    }
    s.nodes = s.nodes || {};
    const nids = Object.keys(s.nodes);
    if (!nids.length) return { ok: false, scenario: s, warnings: ['剧本没有任何决策节点'] };
    if (!s.nodes[s.start]) s.start = nids[0];
    const validView = (v) => !v || typeof v === 'object' || !!tpl.views[v];
    for (const nid of nids) {
      const n = s.nodes[nid];
      n.title = n.title || nid;
      n.text = n.text || '';
      n.time = clamp(Number(n.time) || 15, 6, 40);
      if (!validView(n.view)) n.view = tpl.defaultView;
      n.choices = (n.choices || []).filter((c) => c && c.text);
      if (n.choices.length < 2) warn.push(`节点「${n.title}」的选项少于 2 个`);
      n.choices.forEach((c, i) => {
        c.id = c.id || 'abcdef'[i];
        if (VERDICTS.indexOf(c.verdict) < 0) c.verdict = 'ok';
        c.score = clamp(Number(c.score == null ? DEFAULT_SCORE[c.verdict] : c.score) || 0, 0, 20);
        const d = {};
        for (const k in c.dims || {}) if (ZY.catalog.dims.some((x) => x.key === k)) d[k] = clamp(Math.round(Number(c.dims[k]) || 0), -3, 3);
        c.dims = d;
        c.result = c.result || '';
        c.why = c.why || '';
        if (c.verdict === 'fatal') c.next = null;
        if (c.next && !s.nodes[c.next]) {
          warn.push(`选项「${c.text.slice(0, 12)}…」指向不存在的节点，已改为结束`);
          c.next = null;
        }
        if (c.act && c.act.view && !validView(c.act.view)) delete c.act.view;
        if (c.verdict === 'fatal') {
          c.act = c.act || {};
          if (!c.act.vignette) c.act.vignette = 'fatal';
        }
        if (c.hotspot && !ids.has(c.hotspot)) delete c.hotspot;
      });
      if (n.timeout && n.timeout.next && !s.nodes[n.timeout.next]) delete n.timeout.next;
    }
    const seen = new Set([s.start]), q = [s.start];
    while (q.length) {
      const n = s.nodes[q.shift()];
      for (const c of n.choices) if (c.next && !seen.has(c.next)) {
        seen.add(c.next);
        q.push(c.next);
      }
    }
    nids.filter((id) => !seen.has(id)).forEach((id) => warn.push(`节点「${s.nodes[id].title}」不可达`));
    const hasEnd = nids.some((id) => s.nodes[id].choices.some((c) => !c.next));
    if (!hasEnd) {
      const last = s.nodes[nids[nids.length - 1]];
      last.choices.forEach((c) => (c.next = null));
      warn.push('剧本没有结束节点，已把最后一个节点设为结束');
    }
    return { ok: true, scenario: s, warnings: warn };
  }

  function timeoutChoice(node) {
    const d = ZY.catalog.defaultTimeout;
    const t = Object.assign({}, d, node.timeout || {});
    t.id = '__timeout';
    if (t.next === undefined) {
      const c = node.choices.find((x) => x.verdict !== 'fatal' && x.next) || node.choices.find((x) => x.verdict !== 'fatal');
      t.next = c ? c.next : null;
    }
    return t;
  }

  function standardPath(s) {
    const path = [];
    let nid = s.start, guard = 0;
    while (nid && s.nodes[nid] && guard++ < 20) {
      const n = s.nodes[nid];
      const best = n.choices.slice().sort((a, b) => b.score - a.score)[0];
      if (!best) break;
      path.push({ node: nid, choice: best });
      nid = best.next;
    }
    return path;
  }

  // 顺序要求：只有标准处置路径本身满足时才启用，避免误伤正确路径
  const ORDER_RULES = [
    {
      name: '先自保、后施救', penalty: 6,
      tip: '在自己脱离危险之前就去救人或喊人，容易让施救者成为第二个受害者。',
      ok: (seq) => {
        const r = seq.findIndex((c) => ((c.dims || {}).rescue || 0) > 0);
        const p = seq.findIndex((c) => ((c.dims || {}).protect || 0) > 0);
        return r < 0 || (p >= 0 && p <= r);
      }
    },
    {
      name: '尽早报告', penalty: 4,
      tip: '险情发生后的前两个处置环节内没有任何报告动作，指挥人员掌握情况的时间被推迟。',
      ok: (seq) => {
        const k = seq.findIndex((c) => ((c.dims || {}).report || 0) > 0);
        return k >= 0 && k <= 1;
      }
    }
  ];

  function score(s, steps) {
    const dims = ZY.catalog.dims.map((d) => d.key);
    const acc = {}, mx = {}, mn = {};
    dims.forEach((k) => (acc[k] = mx[k] = mn[k] = 0));
    let total = 0, fatal = null, wrong = 0;
    const detail = steps.filter((st) => s.nodes[st.node]).map((st) => {
      const n = s.nodes[st.node];
      const c = (st.choice === '__timeout' ? timeoutChoice(n) : n.choices.find((x) => x.id === st.choice)) || timeoutChoice(n);
      total += c.score;
      if (c.verdict === 'fatal' && !fatal) fatal = { node: n, choice: c };
      if (c.verdict === 'wrong' || c.verdict === 'fatal') wrong++;
      const opts = n.choices.concat([timeoutChoice(n)]);
      dims.forEach((k) => {
        const vals = opts.map((o) => (o.dims && o.dims[k]) || 0);
        acc[k] += (c.dims && c.dims[k]) || 0;
        mx[k] += Math.max.apply(null, vals);
        mn[k] += Math.min.apply(null, vals);
      });
      return { node: n, nodeId: st.node, choice: c, elapsed: st.elapsed };
    });
    const std = standardPath(s);
    const maxTotal = std.reduce((n, p) => n + p.choice.score, 0) || 1;
    const base = Math.round(clamp((total / maxTotal) * 100, 0, 100));
    // 时效：用时超过限时 70% 视为犹豫（超时本身已按"未作出处置"计分）
    const slow = detail.filter((d) => d.choice.id !== '__timeout' && d.elapsed != null && d.node.time && d.elapsed > d.node.time * 0.7);
    const timePenalty = Math.min(8, slow.length * 2);
    const seq = detail.map((d) => d.choice);
    const stdSeq = std.map((p) => p.choice);
    const orderHits = fatal ? [] : ORDER_RULES.filter((r) => r.ok(stdSeq) && !r.ok(seq));
    const orderPenalty = orderHits.reduce((n, r) => n + r.penalty, 0);
    let pct = clamp(base - timePenalty - orderPenalty, 0, 100);
    if (fatal) pct = Math.min(pct, 40);
    const dimScores = {};
    dims.forEach((k) => {
      dimScores[k] = mx[k] === mn[k] ? null : Math.round(((acc[k] - mn[k]) / (mx[k] - mn[k])) * 100);
    });
    if (fatal) {
      for (const k in fatal.choice.dims) if (fatal.choice.dims[k] < 0 && dimScores[k] != null) dimScores[k] = Math.min(dimScores[k], 30);
    }
    const weak = dims.filter((k) => dimScores[k] != null).sort((a, b) => dimScores[a] - dimScores[b]).filter((k) => dimScores[k] < 75).slice(0, 2);
    return {
      score: pct, base, total, maxTotal, fatal: !!fatal, fatalInfo: fatal, wrong, dims: dimScores, weak, detail, standard: std,
      timePenalty, slow: slow.map((d) => d.node.title), orderPenalty, orderHits, grade: ZY.catalog.grade(pct, !!fatal)
    };
  }

  function offlineMatch(text) {
    let best = null, bestScore = 0;
    for (const s of ZY.store.all()) {
      let sc = 0;
      for (const k of s.keywords || []) if (text.indexOf(k) >= 0) sc += k.length;
      if (s.title && text.indexOf(s.title) >= 0) sc += 6;
      if (sc > bestScore) {
        best = s;
        bestScore = sc;
      }
    }
    return bestScore >= 2 ? best : null;
  }

  function trimmedExample() {
    const s = JSON.parse(JSON.stringify(ZY.scenarios.find((x) => x.id === 'bof-splash')));
    const keep = ['N1', 'N2'];
    for (const k of Object.keys(s.nodes)) if (keep.indexOf(k) < 0) delete s.nodes[k];
    s.nodes.N2.choices.forEach((c) => (c.next = null));
    return s;
  }

  function buildMessages(desc, opts) {
    opts = opts || {};
    const tpls = Object.values(ZY.templates).map((t) => ({ id: t.id, name: t.name, desc: t.desc, slots: Object.keys(t.slots), views: Object.keys(t.views), wind: t.wind }));
    let sys = [
      '你是钢铁企业的安全培训专家和应急演练剧本设计师。你的任务是根据用户描述的现场工况或事故，设计一套可以在 3D 沙盒中运行的多分支应急处置演练，输出一个严格的 JSON 对象。',
      '',
      '【可用车间模板】（scene.template 只能从中选择，slot 和 view 只能用所选模板的名称）',
      JSON.stringify(tpls),
      '',
      '【资产库】（scene.props[].asset 只能从中选择；资产库没有的设备，用 placeholder 并在 label 写设备名称）',
      JSON.stringify(ZY.assets.catalog()),
      '',
      '【特效】（scene.effects[].type）',
      JSON.stringify(ZY.fx.catalog()),
      '特效的 at 可以是：模板 slot 名称、道具 id（默认取顶部）、"道具id.锚点"（如 ladle.top、converter.tap、crane.load_bottom、valve.leak、strand.mold_low、manhole.hole、detector.light），或坐标 [x,y,z]。molten_stream 还需要 to。',
      '',
      '【人物动作】npc.anim 可用：' + ANIMS.join('、'),
      '【能力维度】dims 只能用这些 key：' + ZY.catalog.dims.map((d) => `${d.key}=${d.name}`).join('，') + '；取值 -3 到 3 的整数。',
      '【判定等级】verdict：best 最佳(score 20)、ok 合理(12~16)、poor 欠妥(4~8)、wrong 错误(0~4)、fatal 致命红线(0，演练立即终止，next 为 null)。',
      '',
      '【状态字段】节点的 set（进入节点时）和选项的 act（选择后）可包含：',
      'view（模板 view 名或 {"near":"道具id.锚点","off":[x,y,z]}）、fx（{特效id: 0~1 强度}）、npc（{人物id: 动作名 或 {"anim","to","at","show","hide","speed","face"}}）、prop（{道具id: "show"|"hide"|"stop"|"lock" 或 {"type":"move","to":slot} | {"type":"drop"} | {"type":"lower","by":米} | {"type":"tilt","deg":角度}}）、flash（位置引用，用于爆炸闪光）、shake（0~1.5 镜头震动）、vignette（"fatal"|"warn"|""）、audio（{"alarm":bool,"rumble":0~1,"hiss":0~1,"detector":bool}）、power（bool，配电室照明）。',
      '',
      '【设计要求】',
      '1. 4~5 个决策节点，每个节点 3~4 个选项，选项要像一线员工在现场真实可能的反应，至少包含一个常见的错误做法；在合理的位置设置 fatal 红线选项，但不要每个节点都有。',
      '2. 节点之间按处置流程推进：发现险情→自身避险→协助他人/控制事态→信息报告→警戒或恢复/复盘。',
      '3. result 写选择后的现场后果（克制，不写血腥细节）；why 写判定理由，只引用通用安全原则或公开规程名称，不要编造具体条款号；不确定的写"以企业规程为准"。',
      '4. 每个节点给出 view 和 time（秒，8~20），并用 set 让场景随剧情变化（特效强度、人物动作、警报声）。fatal 选项的 act 要包含 "vignette":"fatal"。',
      '5. 必须包含 id（英文小写和短横线）、title、category、location、role、difficulty、duration、keywords（用于检索的中文关键词数组）、summary、briefing、basis（参考依据数组）、scene、start、nodes。',
      '6. 全部文本用简体中文。只输出 JSON，不要任何解释或 Markdown 代码块。',
      '',
      '【示例】（结构参考，内容不要照抄）',
      JSON.stringify(trimmedExample())
    ].join('\n');
    const rulings = ZY.store.rulings().slice(0, 20);
    if (rulings.length) {
      sys += '\n\n【企业已审核判定】以下选项的判定已经企业安全专家审核。生成的剧本中出现相同或相近的选项时，必须沿用这些判定和分值：\n' +
        rulings.map((r) => `- 「${r.text}」→ ${r.verdict}，${r.score} 分${r.category ? `（${r.category}）` : ''}`).join('\n');
    }
    let user = '请根据以下描述生成演练剧本：\n' + desc;
    if (opts.role) user += '\n学员岗位：' + opts.role;
    if (opts.template) user += '\n车间模板：' + opts.template;
    if (opts.focus) user += '\n本次是针对性复训，请让大多数节点重点考察「' + opts.focus + '」这一能力维度。';
    return [
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ];
  }

  function parseJSON(text) {
    let t = String(text || '').trim();
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < 0) throw new Error('模型没有返回 JSON');
    return JSON.parse(t.slice(a, b + 1));
  }

  let statusCache = null;
  async function status(force) {
    if (statusCache && !force) return statusCache;
    const st = ZY.store.settings();
    let res = { mode: 'offline', label: '本地规则引擎' };
    if (st.apiMode !== 'off') {
      // GitHub Pages 等纯静态托管没有 server.py 代理，不必探测
      if (location.protocol.indexOf('http') === 0 && st.apiMode !== 'direct' && !/\.github\.io$/.test(location.hostname)) {
        try {
          const r = await fetch('/api/status', { cache: 'no-store' });
          if (r.ok) {
            const j = await r.json();
            if (j.configured) res = { mode: 'proxy', label: '在线 · ' + (j.model || '模型'), model: j.model };
          }
        } catch (e) {}
      }
      if (res.mode === 'offline' && st.baseUrl && st.apiKey && st.model) res = { mode: 'direct', label: '在线 · ' + st.model, model: st.model };
    }
    statusCache = res;
    return res;
  }

  async function callModel(messages) {
    const st = await status();
    if (st.mode === 'proxy') {
      const r = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || '模型接口返回错误 ' + r.status);
      return j.content;
    }
    if (st.mode === 'direct') {
      const s = ZY.store.settings();
      const url = s.baseUrl.replace(/\/+$/, '') + '/chat/completions';
      const body = { model: s.model, messages, temperature: 0.6, response_format: { type: 'json_object' } };
      const go = (b) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.apiKey }, body: JSON.stringify(b) });
      let r = await go(body);
      if (r.status === 400) {
        delete body.response_format;
        r = await go(body);
      }
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j.error && j.error.message) || '模型接口返回错误 ' + r.status);
      return j.choices[0].message.content;
    }
    throw new Error('未配置模型接口');
  }

  const FAMILY_NAMES = { splash: '高温熔融金属喷溅', ladle: '钢包穿包漏钢', breakout: '连铸漏钢', gas: '煤气泄漏', confined: '有限空间作业', crane: '起重吊运', electric: '电气事故', fire: '设备火灾', generic: '未识别（按通用原则）' };

  function finish(s, desc, basis, engine) {
    s.id = 'gen-' + Date.now().toString(36);
    s.generated = true;
    s.engine = engine;
    s.prompt = desc;
    s.createdAt = Date.now();
    if (!s.basis.length) s.basis = basis;
    ZY.store.saveCustom(s);
    ZY.store.noteMissing(s.unmatched);
    return s;
  }

  async function generate(desc, opts) {
    opts = opts || {};
    const step = opts.onStep || (() => {});
    const text = desc + ' ' + (opts.role || '');
    const a = ZY.composer.analyze(desc, { role: opts.role });
    const tplId = opts.template || detectTemplate(text);
    step(0, 'done', `危险源：${FAMILY_NAMES[a.family]}${tplId ? ` · 区域：${ZY.templates[tplId].name}` : ''}`);
    const basis = detectBasis(text);
    step(1, 'done', basis.join('、'));
    const st = await status();
    let fallback = null;
    if (st.mode !== 'offline') {
      try {
        step(2, 'run', `正在调用 ${st.model || '模型'} 编写分支剧本`);
        const t0 = Date.now();
        const content = await callModel(buildMessages(desc, { role: opts.role, template: tplId, focus: opts.focus }));
        const raw = parseJSON(content);
        step(2, 'done', `模型用时 ${((Date.now() - t0) / 1000).toFixed(1)} 秒`);
        step(3, 'run', '检查节点连通性、资产与位置');
        const v = validate(raw);
        if (!v.ok) throw new Error('生成的剧本结构不完整：' + v.warnings.join('；'));
        v.scenario.warnings = v.warnings;
        step(3, 'done', v.warnings.length ? `已自动修正 ${v.warnings.length} 处` : '结构完整');
        const s = finish(v.scenario, desc, basis, 'model');
        return { scenario: s, warnings: v.warnings, source: 'model' };
      } catch (e) {
        console.warn('模型生成失败，改用本地规则引擎', e);
        fallback = e.message;
        step(2, 'fail', '模型调用失败，切换到本地规则引擎');
      }
    }
    step(2, 'run', '本地规则引擎：拆解工况要素，从处置片段库组合分支剧本');
    const out = ZY.composer.compose(desc, { role: opts.role, template: opts.template, focus: opts.focus, seed: Date.now() });
    step(2, 'done', `组合出 ${Object.keys(out.scenario.nodes).length} 个处置环节`);
    step(3, 'run', '检查节点连通性、资产与位置');
    const v = validate(out.scenario);
    if (!v.ok) {
      step(3, 'fail', v.warnings.join('；'));
      throw new Error('生成的剧本结构不完整：' + v.warnings.join('；'));
    }
    const warnings = [];
    if (fallback) warnings.push(`大模型调用失败（${fallback.slice(0, 80)}），已改用本地规则引擎生成`);
    if (opts.template && v.scenario.scene.template !== opts.template) warnings.push(`所选车间区域与识别到的危险源不匹配，已按危险源使用「${ZY.templates[v.scenario.scene.template].name}」`);
    warnings.push(...out.warnings, ...v.warnings);
    v.scenario.warnings = warnings;
    step(3, 'done', warnings.length ? `结构完整 · ${warnings.length} 条提示` : '结构完整');
    const s = finish(v.scenario, desc, basis, 'local');
    return { scenario: s, warnings, source: 'local', fallback };
  }

  function mockRecords() {
    const rnd = ZY.tex.rng(2026);
    const teams = ['炼钢一班', '炼钢二班', '连铸班', '能源中心', '成品库', '电气车间'];
    const pref = { 'bof-splash': [0, 1], 'bof-ladle-leak': [0, 1], 'caster-breakout': [2], 'gas-leak': [3], 'confined-space': [3], 'crane-coil': [4], 'elec-fire': [5] };
    const out = [];
    const weights = { best: 0.5, ok: 0.18, poor: 0.18, wrong: 0.1, fatal: 0.04 };
    for (let i = 0; i < 86; i++) {
      const s = ZY.scenarios[Math.floor(rnd() * ZY.scenarios.length)];
      const steps = [];
      let nid = s.start, guard = 0;
      while (nid && guard++ < 10) {
        const n = s.nodes[nid];
        const ws = n.choices.map((c) => weights[c.verdict] * (0.6 + rnd()));
        let r = rnd() * ws.reduce((a, b) => a + b, 0), k = 0;
        while (r > ws[k] && k < ws.length - 1) r -= ws[k++];
        const c = n.choices[k];
        steps.push({ node: nid, choice: c.id });
        nid = c.next;
      }
      const res = score(s, steps);
      const tp = pref[s.id] || [0];
      out.push({
        id: 'm' + i, mock: true, scenarioId: s.id, title: s.title, team: teams[tp[Math.floor(rnd() * tp.length)]],
        at: Date.now() - Math.floor(rnd() * 30) * 86400000, score: res.score, fatal: res.fatal, grade: res.grade.name, dims: res.dims, steps
      });
    }
    return out;
  }

  ZY.logic = { validate, score, standardPath, timeoutChoice, generate, status, offlineMatch, detectTemplate, mockRecords, buildMessages, familyNames: FAMILY_NAMES, resetStatus: () => (statusCache = null) };
})();
