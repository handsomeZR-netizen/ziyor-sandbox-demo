ZY.scenarios.push({
  id: 'crane-coil',
  title: '天车吊运钢卷钢丝绳断股',
  category: '起重伤害',
  location: '冷轧厂 · 成品钢卷库',
  role: '司索指挥工',
  difficulty: '中',
  duration: '约 4 分钟',
  keywords: ['天车', '起重', '吊运', '钢卷', '钢丝绳', '断股', '吊物', '行车'],
  summary: '吊运 20 吨钢卷途中钢丝绳断股、钢卷倾斜，路线前方有两名贴标工。',
  briefing: '你是成品库的司索指挥工，用对讲机和手势指挥天车把一卷热轧钢卷从 2 跨西侧吊往东侧鞍座。东侧通道上有两名贴标工在作业。',
  basis: ['《起重机械安全规程》（GB 6067）关于吊物下方禁止站人、钢丝绳报废的要求', '《起重吊运指挥信号》（GB/T 5082）紧急停止信号'],
  scene: {
    template: 'coil',
    view: 'overview',
    props: [
      { id: 'crane', asset: 'crane', slot: 'crane_a', load: 'coil', hookY: 9, tonnage: '32t' },
      { id: 'saddle', asset: 'saddle', slot: 'saddle_near' },
      { id: 'isolator', asset: 'isolator', slot: 'isolator' },
      { id: 'ladder', asset: 'ladder', slot: 'ladder', h: 14 }
    ],
    npcs: [
      { id: 'chen', slot: 'label_w1', label: '贴标工 小陈', wear: 'blue', anim: 'work', rot: 90 },
      { id: 'wu', slot: 'label_w2', label: '贴标工 小吴', wear: 'blue', anim: 'work', rot: 100 },
      { id: 'meng', slot: 'maint_in', label: '维修工 老孟', wear: 'orange', helmet: 'white', anim: 'idle', hidden: true }
    ],
    effects: [{ id: 'alarm1', type: 'alarm', at: 'alarm1', intensity: 0 }],
    init: { prop: { crane: { type: 'move', to: 'crane_path_end', speed: 0.5 } }, audio: { rumble: 0.12 } }
  },
  start: 'N1',
  nodes: {
    N1: {
      title: '钢丝绳断股',
      text: '天车吊着一卷约 20 吨的钢卷，正沿通道向东移动。你发现吊具一侧的钢丝绳有明显断股，钢卷开始轻微倾斜。吊运路线前方，两名贴标工背对着天车在干活。',
      view: 'signal',
      time: 10,
      set: { prop: { crane: [{ type: 'tilt', part: 'load', deg: 6, axis: 'x' }] } },
      choices: [
        {
          id: 'a', text: '立即发出紧急停止信号并用对讲机喊停，要求司机停止运行', verdict: 'best', score: 20,
          dims: { respond: 3, risk: 2, rule: 2 },
          result: '你双臂伸直快速左右摆动，同时在对讲机里大喊"紧急停车"。天车应声停住。',
          why: '发现吊具异常，指挥人员应立即发出紧急停止信号。任何人发出的紧急停止信号，司机都必须立即执行。',
          next: 'N2',
          act: { prop: { crane: 'stop' } }
        },
        {
          id: 'b', text: '跑到钢卷下方扶住，防止它继续倾斜', verdict: 'fatal', score: 0,
          dims: { risk: -3, protect: -3, rule: -3 },
          result: '你刚跑到钢卷下方，断股的钢丝绳彻底崩断，钢卷砸了下来——',
          why: '吊物下方是绝对禁区。20 吨的钢卷靠人力不可能扶住，进入吊物下方只会造成伤亡。',
          next: null,
          act: { view: { near: 'crane.load_bottom', off: [1.2, -3.3, 1.8] }, prop: { crane: ['stop', { type: 'drop', part: 'load' }] }, shake: 1.5, vignette: 'fatal' }
        },
        {
          id: 'c', text: '让司机加速，赶紧把钢卷送到目的地卸下', verdict: 'wrong', score: 0,
          dims: { respond: -2, risk: -2, rule: -2 },
          result: '天车加速后钢卷剧烈晃动，断股处又崩开了几根钢丝，前方两名贴标工惊慌地跑开。',
          why: '吊具异常时继续运行、加速运行，会进一步加大钢丝绳受力，增加断绳风险。',
          next: 'N2',
          act: { prop: { crane: ['stop', { type: 'move', to: 'crane_path_end', speed: 1.4 }], }, npc: { chen: { anim: 'run', to: 'flee_1' }, wu: { anim: 'run', to: 'flee_2' } }, shake: 0.3 }
        },
        {
          id: 'd', text: '先冲过去，把前方两名贴标工拉开', verdict: 'poor', score: 8,
          dims: { rescue: 2, respond: -2 },
          result: '两名贴标工被你拉离了通道，但天车还在运行，钢卷越来越斜。',
          why: '人员避让是对的，但险情源头是天车还在运行。应先发紧急停止信号，再疏散人员。',
          next: 'N2',
          act: { npc: { chen: { anim: 'run', to: 'flee_1' }, wu: { anim: 'run', to: 'flee_2' } } }
        }
      ]
    },

    N2: {
      title: '是否落钩',
      text: '天车已经停住，钢卷悬在离地约 5 米处，还在缓慢摆动。司机在对讲机里问："要不要马上落下来？"',
      view: 'signal',
      time: 15,
      set: { prop: { crane: ['stop', { type: 'swing', amp: 0.05 }] }, npc: { chen: { anim: 'run', to: 'flee_1' }, wu: { anim: 'run', to: 'flee_2' } } },
      choices: [
        {
          id: 'a', text: '确认落点周围无人后，指挥司机慢速、平稳落钩，把钢卷放到最近的空鞍座上', verdict: 'best', score: 20, hotspot: 'saddle',
          dims: { respond: 3, risk: 1, rule: 2 },
          result: '天车缓缓移到空鞍座上方，钢卷一点点下降，平稳落在鞍座上。',
          why: '确认无人后就近平稳落地，可以最快消除悬吊隐患。落钩必须慢速平稳，避免冲击载荷。',
          next: 'N3',
          act: { prop: { crane: [{ type: 'move', to: 'saddle_near', speed: 0.8 }, { type: 'lower', part: 'hook', by: 4.8, speed: 0.6 }] } }
        },
        {
          id: 'b', text: '让钢卷一直吊在空中，等维修工来处理', verdict: 'poor', score: 6,
          dims: { respond: -1, risk: -1 },
          result: '钢卷悬吊了二十多分钟，断股处在持续受力。所幸维修工到场后指挥落了下来。',
          why: '带缺陷的钢丝绳长时间悬吊重物风险很高，应在确认安全后尽快就近落地。',
          next: 'N3',
          act: { prop: { crane: [{ type: 'wait', dur: 2 }, { type: 'move', to: 'saddle_near', speed: 0.8 }, { type: 'lower', part: 'hook', by: 4.8, speed: 0.6 }] } }
        },
        {
          id: 'c', text: '让司机快速落钩，越快放下越好', verdict: 'wrong', score: 2,
          dims: { respond: -1, rule: -2 },
          result: '钢卷急速下落时猛地一顿，断股的钢丝绳又崩断了几股，所幸没有完全断开。',
          why: '快速落钩和急停会产生冲击载荷，对已经断股的钢丝绳非常危险。',
          next: 'N3',
          act: { shake: 0.5, prop: { crane: [{ type: 'move', to: 'saddle_near', speed: 1.2 }, { type: 'lower', part: 'hook', by: 4.8, speed: 1.6 }] } }
        }
      ]
    },

    N3: {
      title: '检修前断电',
      text: '钢卷已经落在鞍座上。维修工老孟准备爬上天车更换钢丝绳，但天车的电源还没有断开。',
      view: 'isolator',
      time: 15,
      set: { npc: { meng: { show: true, at: 'maint_in', anim: 'walk', to: 'ladder_foot', speed: 1.1 } } },
      choices: [
        {
          id: 'a', text: '要求先断开天车电源隔离开关，挂"禁止合闸，有人工作"牌并上锁，确认后再上车作业', verdict: 'best', score: 20, hotspot: 'isolator',
          dims: { rule: 3, risk: 2, protect: 1 },
          result: '老孟断开隔离开关，挂上警示牌并上了锁，然后才开始爬梯。',
          why: '检修前断电、挂牌、上锁，是防止检修中设备被误启动的基本制度。',
          next: 'N4',
          act: { prop: { isolator: 'lock' } }
        },
        {
          id: 'b', text: '让他抓紧时间换，电源不用停', verdict: 'wrong', score: 0,
          dims: { rule: -3, risk: -2 },
          result: '老孟爬上天车时，一名不知情的司机差点合上了运行开关。',
          why: '不断电检修，一旦有人误操作就可能造成挤压、坠落或触电。',
          next: 'N4'
        },
        {
          id: 'c', text: '你也爬上去帮忙，两个人干得快些', verdict: 'poor', score: 4,
          dims: { rule: -2, protect: -1 },
          result: '你们俩都上了天车，但谁也没有去断电挂牌。',
          why: '人多不等于安全。检修前的断电挂牌上锁一步都不能少，而且你不是这项检修的作业人员。',
          next: 'N4'
        }
      ]
    },

    N4: {
      title: '事后复盘',
      text: '班后复盘时，安全员问你：怎样才能避免这类险情再次发生？',
      view: 'overview',
      time: 20,
      set: { prop: { crane: 'stop' } },
      choices: [
        {
          id: 'a', text: '吊运前按要求点检吊具和钢丝绳，达到报废标准立即更换；吊运时严禁人员在吊物下方停留或通过', verdict: 'best', score: 20,
          dims: { rule: 3, risk: 2 },
          result: '安全员把钢丝绳点检要求加进了班前确认表。',
          why: '大多数断绳事故都有前兆，班前点检能提前发现断股、磨损和变形。',
          next: null
        },
        {
          id: 'b', text: '以后吊运的时候多注意一下', verdict: 'poor', score: 4,
          dims: { rule: -1 },
          result: '安全员追问："具体注意什么？"',
          why: '整改措施要具体到制度和检查项，"多注意"无法落地。',
          next: null
        },
        {
          id: 'c', text: '主要是钢丝绳质量不好，应该让供应商负责', verdict: 'poor', score: 4,
          dims: { rule: -1, risk: -1 },
          result: '安全员提醒你，使用前的点检是使用单位的责任。',
          why: '设备质量是一方面，日常点检和报废管理是现场必须落实的责任。',
          next: null
        }
      ]
    }
  }
});
