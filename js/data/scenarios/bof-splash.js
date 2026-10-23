ZY.scenarios.push({
  id: 'bof-splash',
  title: '转炉出钢钢水喷溅',
  category: '高温熔融金属',
  location: '炼钢厂 · 转炉出钢跨',
  role: '炉前工',
  difficulty: '中',
  duration: '约 4 分钟',
  keywords: ['钢水', '喷溅', '出钢', '转炉', '钢包', '炉前', '积水', '钢渣'],
  summary: '出钢时钢包附近积水引发钢水喷溅，同事老王就在喷溅区附近。',
  briefing: '你是 2 号转炉的炉前工，正在出钢跨配合出钢作业。钢包车已就位，转炉正在倾动出钢。同班的老王在钢包东侧观察出钢情况。',
  basis: ['《炼钢安全规程》（AQ 2001）关于熔融金属作业区防水、防潮的要求', '企业钢水喷溅事故现场处置方案（通用示例）'],
  scene: {
    template: 'bof',
    view: 'overview',
    props: [
      { id: 'converter', asset: 'converter', slot: 'converter', tilt: 80 },
      { id: 'ladle', asset: 'ladle', slot: 'tapping' },
      { id: 'crane', asset: 'crane', slot: 'crane_bay', hookY: 13 },
      { id: 'breaker', asset: 'breaker_box', slot: 'breaker_near', label: '总电闸', pillar: true },
      { id: 'control', asset: 'control_room', slot: 'control_room' },
      { id: 'exit', asset: 'exit_door', slot: 'exit' },
      { id: 'assembly', asset: 'assembly_point', slot: 'assembly' },
      { id: 'water', asset: 'puddle', slot: 'under_ladle', r: 2.2, label: '地面积水' },
      { id: 'ext', asset: 'fire_extinguisher', slot: 'extinguisher' },
      { id: 'tape', asset: 'barrier', slot: 'cordon', w: 4, hidden: true }
    ],
    npcs: [
      { id: 'wang', slot: 'coworker', label: '老王', wear: 'blue', anim: 'work', face: 'tapping' },
      { id: 'fixer', slot: 'exit_in', label: '检修工', wear: 'orange', helmet: 'white', anim: 'idle', hidden: true }
    ],
    effects: [
      { id: 'stream', type: 'molten_stream', at: 'converter.tap', to: 'ladle.top', intensity: 1 },
      { id: 'splash', type: 'molten_splash', at: 'ladle.top', intensity: 0.12 },
      { id: 'steam', type: 'steam', at: 'water', intensity: 0, r: 1.6 },
      { id: 'smoke', type: 'smoke', at: 'ladle.top', intensity: 0.35, r: 1.8 },
      { id: 'mouth', type: 'glow', at: 'converter.mouth', intensity: 0.8 },
      { id: 'alarm1', type: 'alarm', at: 'alarm1', intensity: 0 },
      { id: 'alarm2', type: 'alarm', at: 'alarm2', intensity: 0 }
    ],
    init: { audio: { rumble: 0.35 } }
  },
  start: 'N1',
  nodes: {
    N1: {
      title: '发现险情',
      text: '转炉正在出钢。钢包附近突然爆发剧烈喷溅，火花和钢渣四处飞溅，钢包下方的积水开始冒出白汽。喷溅点距离你约 8 米，老王正踉跄着往后退。',
      view: 'operator',
      time: 12,
      set: {
        fx: { splash: 1, steam: 0.9, smoke: 0.8, alarm1: 1, alarm2: 1 },
        npc: { wang: { anim: 'retreat', to: 'wang_trip', speed: 0.8 } },
        audio: { alarm: true, rumble: 0.9, hiss: 0.35 },
        shake: 0.5
      },
      choices: [
        {
          id: 'a', text: '上前查看情况', verdict: 'fatal', score: 0,
          dims: { risk: -3, protect: -3, rule: -2 },
          result: '你朝钢包走近了几步。积水遇高温钢水瞬间汽化，引发更猛烈的二次喷溅，钢渣迎面泼来。在真实现场，这一步极易造成严重烧伤甚至死亡。',
          why: '钢水喷溅的范围和二次爆炸都无法预判。任何人不得靠近喷溅区查看，第一动作必须是迅速撤离到安全区域。',
          next: null,
          act: { view: 'close_ladle', fx: { splash: 1 }, flash: 'ladle.top', flashPower: 1.2, shake: 1.4, vignette: 'fatal' }
        },
        {
          id: 'b', text: '直接撤离现场，边撤边用对讲机报告班组长', verdict: 'best', score: 20,
          dims: { risk: 2, protect: 3, report: 2, rule: 1 },
          result: '你转身沿黄色安全通道快速撤离，边跑边用对讲机报告："出钢跨 2 号钢包喷溅，地面有积水，老王在钢包附近！"',
          why: '先让自己脱离危险区，同时第一时间报告险情位置和人员情况，这是钢水喷溅时的标准处置顺序。',
          next: 'N2',
          act: { view: 'walkway' }
        },
        {
          id: 'c', text: '撤离前先切断总电闸，再撤离上报', verdict: 'poor', score: 6, hotspot: 'breaker',
          dims: { risk: -1, protect: -2, respond: 1, rule: -1 },
          result: '总电闸装在钢包旁的立柱上。你冒着飞溅的钢渣冲过去拉闸，手臂被烫伤，好在伤得不重，随后撤离并上报。',
          why: '在这个场景里，总电闸位于喷溅区内，拉闸也不是炉前工此刻的首要职责，紧急停机应由主控室执行。如果企业规程规定由本岗位就近断电，且电闸位于安全区，可由专家把这一项改判为合理处置。',
          next: 'N2',
          act: { view: 'breaker', fx: { splash: 1 }, shake: 0.6 }
        },
        {
          id: 'd', text: '站在原地大声呼喊老王，让他快跑', verdict: 'poor', score: 8,
          dims: { risk: 1, protect: -2, rescue: 1, report: -1 },
          result: '老王听到喊声加快了脚步，但你自己仍站在喷溅范围边缘，一块钢渣落在你脚边。',
          why: '提醒同事是对的，但应当边撤离边呼喊，而不是停在危险区里。',
          next: 'N2',
          act: { npc: { wang: { anim: 'run', to: 'wang_trip' } } }
        }
      ],
      timeout: { next: 'N2', act: { fx: { splash: 1 }, shake: 0.6 } }
    },

    N2: {
      title: '同事受困',
      text: '你撤到安全出口附近。回头一看，老王在通道边摔倒了，离喷溅点约 10 米，正挣扎着想站起来。喷溅还没有停。',
      view: 'safe',
      time: 15,
      set: { npc: { wang: { anim: 'fallen', at: 'wang_trip' } }, fx: { splash: 0.85 } },
      choices: [
        {
          id: 'a', text: '立刻冲回去，把老王拖出来', verdict: 'wrong', score: 4,
          dims: { rescue: 1, protect: -3, risk: -2 },
          result: '你冲回通道，热浪扑面而来，飞溅的钢渣逼得你几次后退，两个人都被困在危险区边缘，直到喷溅减弱才脱身。',
          why: '没有评估就盲目施救，是事故扩大的常见原因。施救的前提是确认自身安全，例如喷溅已经减弱、或有防护和专业人员配合。',
          next: 'N3',
          act: { view: 'walkway', shake: 0.5 }
        },
        {
          id: 'b', text: '在安全区边缘喊话，引导老王往远离喷溅的方向爬，同时呼叫救援', verdict: 'best', score: 20,
          dims: { rescue: 3, report: 2, protect: 1, risk: 1 },
          result: '你在安全区边缘大喊："往东边爬，别回头！"同时用对讲机呼叫："出钢跨有人摔倒，需要救援！"老王顺着通道爬出了喷溅范围。',
          why: '不进入危险区，通过喊话引导和呼叫专业救援来帮助受困人员，兼顾了施救和自身安全。',
          next: 'N3',
          act: { npc: { wang: { anim: 'crawl', to: 'walkway_mid', speed: 0.7 } } }
        },
        {
          id: 'c', text: '先撤到集合点报到，等待清点人数', verdict: 'poor', score: 8,
          dims: { protect: 2, rescue: -2, report: -1 },
          result: '你在集合点报了到，但没有说老王摔倒的事，救援人员过了几分钟才发现他。',
          why: '撤离后必须立即把已知的受困人员位置报告出去，不能只等集合点清点。',
          next: 'N3',
          act: { view: 'assembly' }
        }
      ]
    },

    N3: {
      title: '报告险情',
      text: '老王已经被转移到安全区，手臂有轻度烫伤。班组长在对讲机里急促地问："现场什么情况？"你需要在最短时间内讲清楚。',
      view: 'assembly',
      time: 15,
      set: { npc: { wang: { anim: 'idle', at: 'assembly_wang', face: 'tapping' } }, fx: { splash: 0.6 } },
      choices: [
        {
          id: 'a', text: '"出钢跨 2 号钢包喷溅，钢包下有积水。老王摔倒后已撤出，手臂轻度烫伤，现场暂时没有其他人。"', verdict: 'best', score: 20,
          dims: { report: 3, rule: 1, risk: 1 },
          result: '班组长立即通知主控室停止出钢，并安排医护人员到集合点处理老王的烫伤。',
          why: '报告讲清了地点、险情、次生风险和人员情况，指挥人员可以马上作出决策。',
          next: 'N4'
        },
        {
          id: 'b', text: '"出大事了！快来人！"', verdict: 'wrong', score: 4,
          dims: { report: -2 },
          result: '班组长追问了好几遍才弄清楚发生了什么，停止出钢的指令晚了将近一分钟。',
          why: '信息不完整的报告会延误决策。应急报告至少要包括地点、险情、人员情况和已采取的措施。',
          next: 'N4'
        },
        {
          id: 'c', text: '"钢包喷了，我先去拿灭火器！"', verdict: 'wrong', score: 2, hotspot: 'ext',
          dims: { report: -1, respond: -2, rule: -2 },
          result: '你拎着灭火器往回走，被赶来的班组长拦住了。',
          why: '钢水喷溅不是灭火器能处置的险情，水基灭火器接触钢水还可能引发爆炸。这时应先完成报告，并远离危险区。',
          next: 'N4'
        }
      ]
    },

    N4: {
      title: '现场警戒',
      text: '主控室已停止出钢。这时一名不知情的检修工推着工具车从东门进来，正朝出钢跨方向走。地面的积水还在冒着白汽。',
      view: 'safe',
      time: 12,
      set: {
        fx: { stream: 0, splash: 0.25, steam: 0.5, smoke: 0.5 },
        npc: { fixer: { show: true, at: 'exit_in', anim: 'walk', to: 'walkway_mid', speed: 1.0 } },
        audio: { rumble: 0.4 }
      },
      choices: [
        {
          id: 'a', text: '立即拦住他，说明情况，并在通道口拉起警戒线', verdict: 'best', score: 20,
          dims: { risk: 2, respond: 2, rule: 1 },
          result: '检修工停下脚步。你和他一起在通道口拉起警戒线，禁止无关人员进入出钢跨。',
          why: '事故现场必须尽快设立警戒，防止不知情的人员进入造成二次伤害。',
          next: 'N5',
          act: { npc: { fixer: { anim: 'idle' } }, prop: { tape: 'show' } }
        },
        {
          id: 'b', text: '提醒他一句"里面出事了，你自己小心点"', verdict: 'poor', score: 6,
          dims: { risk: -1, respond: -1 },
          result: '检修工"哦"了一声，继续往里走，直到被班组长喝止。',
          why: '口头提醒不能代替警戒。应当明确制止并设置警戒区。',
          next: 'N5'
        },
        {
          id: 'c', text: '去现场用水冲掉积水，防止再次喷溅', verdict: 'fatal', score: 0,
          dims: { risk: -3, rule: -3 },
          result: '你拎起水管走向钢包。水接触到地面上的高温钢渣，瞬间汽化爆炸。',
          why: '高温钢水和钢渣遇水会发生剧烈的汽化爆炸，严禁用水处理钢水、钢渣现场。',
          next: null,
          act: { view: 'close_ladle', fx: { steam: 1 }, flash: 'water', flashPower: 1.2, shake: 1.4, vignette: 'fatal' }
        }
      ]
    },

    N5: {
      title: '事后复盘',
      text: '险情已经得到控制。安全员组织班组复盘，请你说出这次喷溅最可能的直接原因和整改方向。',
      view: 'overview',
      time: 20,
      set: { fx: { splash: 0, steam: 0.15, smoke: 0.2, alarm1: 0, alarm2: 0 }, audio: { alarm: false, rumble: 0.1, hiss: 0 } },
      choices: [
        {
          id: 'a', text: '钢包下方积水是重要诱因。建议出钢前检查确认作业区地面、钢包和渣罐干燥无积水，并排查漏水点', verdict: 'best', score: 20,
          dims: { risk: 2, rule: 2 },
          result: '安全员把"出钢前确认地面无积水"写进了班前检查表。',
          why: '找准直接原因并落实到检查制度上，事故复盘才算闭环。',
          next: null
        },
        {
          id: 'b', text: '主要是老王站的位置不对', verdict: 'poor', score: 6,
          dims: { risk: -1, rule: -1 },
          result: '安全员提醒你：站位是其中一个因素，但积水才是这次喷溅的直接诱因。',
          why: '复盘时应先找直接原因和管理漏洞，而不是只关注个人行为。',
          next: null
        },
        {
          id: 'c', text: '这种事是运气不好，谁也没办法', verdict: 'wrong', score: 0,
          dims: { risk: -2, rule: -2 },
          result: '安全员摇了摇头。',
          why: '钢水喷溅有明确的诱因（积水、潮湿料、操作不当），大多数是可以预防的。',
          next: null
        }
      ]
    }
  }
});
