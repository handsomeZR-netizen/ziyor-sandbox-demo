ZY.scenarios.push({
  id: 'bof-ladle-leak',
  title: '钢包吊运穿包漏钢',
  category: '高温熔融金属',
  location: '炼钢厂 · 转炉出钢跨吊运通道',
  role: '地面指挥（司索指挥工）',
  difficulty: '高',
  duration: '约 4 分钟',
  keywords: ['穿包', '漏钢', '钢包', '吊运', '天车', '起重', '事故坑'],
  summary: '天车吊运满包钢水途中包底漏钢，吊运路线下方还有两名清理工。',
  briefing: '你是出钢跨的地面指挥，负责用对讲机和手势指挥天车把满包钢水吊往精炼工位。吊运路线前方有两名清理工在作业。',
  basis: ['《炼钢安全规程》（AQ 2001）关于钢包吊运、事故钢包坑的要求', '《起重机械安全规程》（GB 6067）关于吊物下方禁止站人的要求'],
  scene: {
    template: 'bof',
    view: 'overview',
    props: [
      { id: 'converter', asset: 'converter', slot: 'converter', tilt: 0 },
      { id: 'crane', asset: 'crane', slot: 'crane_bay', load: 'ladle', hookY: 11, tonnage: '150t' },
      { id: 'pit', asset: 'emergency_pit', slot: 'pit' },
      { id: 'control', asset: 'control_room', slot: 'control_room' },
      { id: 'exit', asset: 'exit_door', slot: 'exit' },
      { id: 'assembly', asset: 'assembly_point', slot: 'assembly' },
      { id: 'tape', asset: 'barrier', pos: [10, 0, 5.2], w: 7, hidden: true }
    ],
    npcs: [
      { id: 'zhang', slot: 'path_ahead', label: '清理工 小张', wear: 'orange', anim: 'work', rot: 200 },
      { id: 'li', slot: 'path_ahead2', label: '清理工 小李', wear: 'orange', anim: 'work', rot: 160 }
    ],
    effects: [
      { id: 'drip', type: 'drip', at: 'crane.load_bottom', intensity: 0 },
      { id: 'pool', type: 'molten_pool', at: 'crane_floor', intensity: 0, r: 2.6 },
      { id: 'pool2', type: 'molten_pool', at: [10, 0, 1.6], intensity: 0, r: 2.2, seed: 7 },
      { id: 'smoke', type: 'smoke', at: 'crane_floor', intensity: 0, r: 1.5 },
      { id: 'alarm1', type: 'alarm', at: 'alarm1', intensity: 0 },
      { id: 'alarm2', type: 'alarm', at: 'alarm2', intensity: 0 }
    ],
    init: { audio: { rumble: 0.2 } }
  },
  start: 'N1',
  nodes: {
    N1: {
      title: '发现漏钢',
      text: '天车吊着满包钢水沿吊运通道缓缓东移。你突然看到包底有亮红色的钢水滴落，地面已经出现一小摊火红的钢液。吊运路线前方十多米处，两名清理工正背对着天车干活。',
      view: 'crane_ground',
      time: 12,
      set: { fx: { drip: 0.8, pool: 0.4, smoke: 0.5, alarm1: 1, alarm2: 1 }, audio: { alarm: true, rumble: 0.5 }, prop: { crane: 'stop' } },
      choices: [
        {
          id: 'a', text: '立即用对讲机通知天车司机：按预案把钢包吊往最近的事故坑，同时鸣笛示警', verdict: 'best', score: 20,
          dims: { respond: 3, report: 2, risk: 1, rule: 2 },
          result: '天车司机回复"收到"，鸣响警铃，调转方向把钢包吊往事故坑。',
          why: '钢包穿漏时，要尽快把钢包移到事故坑等指定的安全位置，减少钢水洒落在通道上，同时发出警示。具体路线和位置以企业预案为准。',
          next: 'N2',
          act: { prop: { crane: [{ type: 'move', pos: [15, 0, 2], speed: 1.4 }, { type: 'move', to: 'pit', speed: 1.2 }] } }
        },
        {
          id: 'b', text: '让天车司机原地停车，等领导来处理', verdict: 'poor', score: 6,
          dims: { respond: -2, risk: -1 },
          result: '钢包悬停在通道上方继续漏钢，地面的钢液越积越多，向四周漫开。调度随后下令按预案移往事故坑。',
          why: '原地停车会让钢水持续洒落在通道上，扩大危险区域。应按预案移往事故坑。',
          next: 'N2',
          act: { fx: { pool: 0.9, drip: 1 } }
        },
        {
          id: 'c', text: '跑到钢包下方，确认漏点在哪里', verdict: 'fatal', score: 0,
          dims: { risk: -3, protect: -3, rule: -3 },
          result: '你冲到钢包正下方抬头张望，一股钢水从包底喷出——',
          why: '吊运的钢包下方是绝对禁区，更不用说正在漏钢的钢包。任何时候都不能进入吊物下方。',
          next: null,
          act: { view: { near: 'crane.load_bottom', off: [0.8, -3.6, 1.6] }, fx: { drip: 1 }, flash: 'crane.load_bottom', shake: 1.4, vignette: 'fatal' }
        },
        {
          id: 'd', text: '大声呼喊，示意前方两名清理工撤离吊运路线', verdict: 'ok', score: 12,
          dims: { rescue: 2, risk: 1, respond: -1 },
          result: '两名清理工听到喊声回头张望，但天车还没有接到任何指令，钢包仍悬在原地漏钢。',
          why: '疏散人员是对的，但作为地面指挥，你的首要职责是立即指挥天车按预案处置。两件事应同时进行。',
          next: 'N2'
        }
      ]
    },

    N2: {
      title: '吊运路线下有人',
      text: '天车已按预案把钢包吊往事故坑。吊运路线正下方，那两名清理工还没完全反应过来，站在原地不知道往哪走。',
      view: 'workers',
      time: 10,
      set: { prop: { crane: ['stop', { type: 'move', pos: [15, 0, 2], speed: 1.4 }, { type: 'move', to: 'pit', speed: 1.2 }] } },
      choices: [
        {
          id: 'a', text: '在吊运路线外侧挥手喊话，让他们横向撤离，严禁从钢包下方穿过', verdict: 'best', score: 20,
          dims: { rescue: 3, risk: 2, rule: 1 },
          result: '两人按你的手势横向跑出吊运路线，钢包从他们刚才站的位置上方经过。',
          why: '指挥人员横向避让吊运路线，而不是让他们从吊物下方穿过，是起重作业的基本要求。',
          next: 'N3',
          act: { npc: { zhang: { anim: 'run', to: 'side_safe' }, li: { anim: 'run', to: 'side_safe2' } } }
        },
        {
          id: 'b', text: '跑到他们身边，把人拉出来', verdict: 'wrong', score: 4,
          dims: { protect: -2, rescue: 1, risk: -1 },
          result: '你冲进吊运路线，三个人一起跑开，钢包几乎从你们头顶经过。',
          why: '这样做让你自己也进入了吊运路线。应在路线外喊话指挥。',
          next: 'N3',
          act: { npc: { zhang: { anim: 'run', to: 'side_safe' }, li: { anim: 'run', to: 'side_safe2' } }, shake: 0.4 }
        },
        {
          id: 'c', text: '继续专心指挥天车，他们会自己看到', verdict: 'poor', score: 4,
          dims: { rescue: -2, risk: -1 },
          result: '直到钢包靠近，两人才发现头顶的险情，慌忙跑开。',
          why: '不能假设他人会自己发现危险。发现人员在危险区内必须主动预警。',
          next: 'N3',
          act: { npc: { zhang: { anim: 'run', to: 'side_safe', then: 'idle' }, li: { anim: 'run', to: 'side_safe2' } } }
        }
      ]
    },

    N3: {
      title: '钢液漫流',
      text: '钢包已到达事故坑上方，漏出的钢水流进坑内。但刚才滴在吊运路线上的钢液正在地面漫开，流向一处盖板破损的电缆沟。',
      view: 'workers',
      time: 15,
      set: { fx: { drip: 0.5, pool: 0.9, pool2: 0.9 } },
      choices: [
        {
          id: 'a', text: '设立警戒区禁止靠近，报告调度通知电工断开电缆沟内相关线路的电源，等钢液冷却后再清理', verdict: 'best', score: 20,
          dims: { risk: 2, respond: 2, report: 2, rule: 1 },
          result: '电工远程断开了该段电缆的电源，警戒区拉起，钢液在地面上逐渐冷却变暗。',
          why: '钢液流入电缆沟可能烧毁电缆、引发火灾或触电。先警戒、再断电，等冷却后清理，是稳妥的做法。',
          next: 'N4',
          act: { prop: { tape: 'show' } }
        },
        {
          id: 'b', text: '穿好防护用品，用干燥的砂土在钢液前方筑挡，阻止它流进电缆沟', verdict: 'ok', score: 14,
          dims: { respond: 2, risk: 1, protect: -1 },
          result: '你和同事用干砂筑起一道矮坝，钢液在坝前停住了。',
          why: '用干燥材料围堵钢液是常见的现场处置手段，但必须使用干燥材料、穿戴防护，并按预案由指定人员操作。',
          next: 'N4'
        },
        {
          id: 'c', text: '用消防水管冲水，给钢液快速降温', verdict: 'fatal', score: 0,
          dims: { risk: -3, rule: -3 },
          result: '水柱打到钢液上，瞬间发生剧烈的汽化爆炸。',
          why: '严禁用水冷却钢水和钢渣。熔融金属遇水会发生爆炸。',
          next: null,
          act: { flash: [10, 0.2, 1.6], flashPower: 1.3, shake: 1.5, vignette: 'fatal' }
        }
      ]
    },

    N4: {
      title: '汇报',
      text: '现场暂时稳定。调度在对讲机里要求你汇报情况。',
      view: 'pit',
      time: 20,
      set: { fx: { drip: 0, alarm1: 0, alarm2: 0 }, audio: { alarm: false, rumble: 0.15 } },
      choices: [
        {
          id: 'a', text: '"吊运途中钢包包底漏钢，钢包已放入事故坑。通道上有少量钢液，已警戒并断开电缆沟电源，两名清理工已撤离，无人受伤。"', verdict: 'best', score: 20,
          dims: { report: 3, rule: 1 },
          result: '调度确认情况后，安排检修和清理人员按程序进场。',
          why: '讲清原因、处置结果、次生风险和人员情况，便于后续统一调度。',
          next: null
        },
        {
          id: 'b', text: '"钢包漏了，已经处理好了。"', verdict: 'poor', score: 6,
          dims: { report: -1 },
          result: '调度不得不派人到现场重新了解情况。',
          why: '报告遗漏了次生风险和人员情况，后续人员可能在不知情的情况下进入危险区。',
          next: null
        },
        {
          id: 'c', text: '先不报告，等班后会再说', verdict: 'wrong', score: 0,
          dims: { report: -3, rule: -2 },
          result: '半小时后，一名不知情的工人差点踩进还没冷却的钢液区。',
          why: '事故和险情必须及时上报，瞒报、迟报会让风险继续扩大。',
          next: null
        }
      ]
    }
  }
});
