ZY.scenarios.push({
  id: 'gas-leak',
  title: '煤气管道泄漏人员中毒',
  category: '煤气中毒',
  location: '炼铁厂 · 高炉煤气管道区',
  role: '能源中心巡检工',
  difficulty: '高',
  duration: '约 5 分钟',
  keywords: ['煤气', '泄漏', '中毒', '一氧化碳', 'CO', '阀门', '管道', '晕倒'],
  summary: '巡检时报警仪报警，阀门组旁一名工友倒地，你正处在下风向。',
  briefing: '你是能源中心巡检工，带着便携式一氧化碳报警仪在高炉煤气管道区巡检。今天刮东风，风从阀门组方向吹向你所在的位置。',
  basis: ['《工业企业煤气安全规程》（GB 6222）关于煤气泄漏、中毒救护的要求', '企业煤气中毒事故现场处置方案（通用示例）'],
  scene: {
    template: 'gas',
    view: 'overview',
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
    npcs: [
      { id: 'zhao', slot: 'victim', label: '工友 老赵', wear: 'blue', anim: 'fallen', rot: 60 },
      { id: 'sun', slot: 'upwind_far', label: '同事 小孙', wear: 'blue', anim: 'idle', hidden: true }
    ],
    effects: [
      { id: 'gas', type: 'gas', at: 'valve.leak', intensity: 0.5 },
      { id: 'det', type: 'alarm', at: 'detector.light', intensity: 0, range: 8 }
    ],
    init: { audio: { hiss: 0.25 } }
  },
  start: 'N1',
  nodes: {
    N1: {
      title: '报警仪尖叫',
      text: '你随身的一氧化碳报警仪突然尖叫，读数迅速升到 300 ppm 以上。前方十几米的阀门组旁，工友老赵倒在地上一动不动。风向标显示风正从阀门组吹向你。（画面中的黄绿色气团只是示意，真实煤气无色无味。）',
      view: 'patrol',
      time: 12,
      set: { fx: { gas: 1, det: 1 }, audio: { detector: true, hiss: 0.5 } },
      choices: [
        {
          id: 'a', text: '立即冲过去把老赵拖出来', verdict: 'fatal', score: 0,
          dims: { risk: -3, protect: -3, rescue: -1, rule: -2 },
          result: '你跑到老赵身边，刚弯腰去拖他，就感到一阵头晕目眩，双腿发软倒在了他旁边。',
          why: '高浓度煤气区域内没有空气呼吸器就去施救，施救者往往几次呼吸后就会中毒倒地。这是煤气事故伤亡扩大最常见的原因。',
          next: null,
          act: { view: 'victim_close', vignette: 'fatal', audio: { detector: true } }
        },
        {
          id: 'b', text: '朝侧风方向撤出气团，再绕到上风向，立即向调度报告：阀门组煤气泄漏，一人中毒倒地', verdict: 'best', score: 20,
          dims: { risk: 3, protect: 3, report: 2, rule: 1 },
          result: '你横穿出气团、绕到上风向，报警仪读数慢慢回落。你用对讲机向调度报告了泄漏位置和老赵倒地的情况。',
          why: '发现煤气泄漏，应向上风向或侧风向撤离，并立即报告。不要顺着风跑，也不要在没有防护的情况下靠近泄漏点。',
          next: 'N2',
          act: { view: 'crosswind', audio: { detector: false } }
        },
        {
          id: 'c', text: '屏住呼吸跑到阀门旁，关闭阀门切断气源', verdict: 'wrong', score: 0, hotspot: 'valve',
          dims: { risk: -2, protect: -3, respond: 1, rule: -2 },
          result: '你冲到阀门旁拧了几圈，头晕目眩，跌跌撞撞退了出来，差一点倒在老赵旁边。阀门也没能关严。',
          why: '屏住呼吸撑不了多久，进入泄漏点必须佩戴正压式空气呼吸器，并由专业人员按程序切断气源。',
          next: 'N2',
          act: { view: 'victim_close', shake: 0.5, vignette: 'warn' }
        },
        {
          id: 'd', text: '顺着风向往西跑，离阀门越远越好', verdict: 'poor', score: 6,
          dims: { risk: -2, protect: 1 },
          result: '你往西跑了很远，报警仪却一直响个不停。煤气正顺着风向往你这边扩散。',
          why: '下风向是气体扩散的方向，应向上风向或侧风向撤离。',
          next: 'N2',
          act: { view: 'downwind' }
        }
      ],
      timeout: { next: 'N2', act: { vignette: 'warn' } }
    },

    N2: {
      title: '是否施救',
      text: '你已经撤到上风向安全处，并报告了调度。救援队大约 5 分钟后到，但老赵情况危急。旁边的应急柜里有正压式空气呼吸器，同事小孙也赶到了。',
      view: 'upwind',
      time: 18,
      set: { vignette: '', npc: { sun: { show: true, at: 'upwind_far', anim: 'run', to: 'scba_side' } }, audio: { detector: false } },
      choices: [
        {
          id: 'a', text: '和小孙按预案施救：检查呼吸器气压和面罩气密后佩戴，一人进去救人、一人在外监护，保持通讯', verdict: 'best', score: 20, hotspot: 'scba',
          dims: { rescue: 3, protect: 2, rule: 2 },
          result: '你们检查完装备，小孙在气团外监护，你佩戴空气呼吸器进入，把老赵拖到了上风向。',
          why: '佩戴正压式空气呼吸器、双人配合、一人监护，是煤气区域施救的基本要求。前提是施救人员接受过训练。',
          next: 'N3'
        },
        {
          id: 'b', text: '自己背上呼吸器马上冲进去，不等小孙', verdict: 'poor', score: 8,
          dims: { rescue: 1, protect: -1, rule: -2 },
          result: '你成功把老赵拖了出来，但面罩一度漏气，你出来时也有些头晕。',
          why: '单人进入没有监护，一旦施救者自己出问题就没人知道。应双人配合、一人监护。',
          next: 'N3'
        },
        {
          id: 'c', text: '戴上普通防尘口罩进去救人', verdict: 'fatal', score: 0,
          dims: { protect: -3, rule: -3 },
          result: '你戴着防尘口罩走进气团，没几步就倒下了。',
          why: '防尘口罩和普通过滤式面具都不能防一氧化碳，更防不了缺氧。必须使用隔绝式的正压空气呼吸器。',
          next: null,
          act: { view: 'victim_close', vignette: 'fatal' }
        },
        {
          id: 'd', text: '在上风向设置警戒，阻止他人进入，等救援队并给他们指引位置', verdict: 'ok', score: 14,
          dims: { protect: 2, rescue: 1, report: 1 },
          result: '救援队到达后，在你的指引下迅速找到了老赵。',
          why: '没有把握时，守住警戒、等待专业救援是稳妥的选择，但老赵的救治时间会被拉长。',
          next: 'N3'
        }
      ]
    },

    N3: {
      title: '现场急救',
      text: '老赵被转移到上风向的空旷处。他面色潮红、叫不醒，但还有微弱的呼吸。',
      view: 'upwind',
      time: 18,
      set: { npc: { zhao: { anim: 'fallen', at: 'safe_patient' }, sun: { anim: 'kneel', at: 'safe_helper', face: 'zhao' } } },
      choices: [
        {
          id: 'a', text: '解开衣领腰带，保持呼吸道通畅，有条件时给氧并持续观察；一旦呼吸心跳停止立即心肺复苏，等待医护人员', verdict: 'best', score: 20,
          dims: { rescue: 3, rule: 1 },
          result: '老赵的呼吸逐渐平稳，医护人员到达后给他上了氧气，送往医院。',
          why: '一氧化碳中毒者应尽快脱离中毒环境，保持呼吸道通畅、给氧，必要时心肺复苏。',
          next: 'N4'
        },
        {
          id: 'b', text: '给他喂水，让他清醒过来', verdict: 'wrong', score: 2,
          dims: { rescue: -2 },
          result: '水呛进了老赵的气管，他剧烈咳嗽起来。',
          why: '意识不清的人不能喂水，容易造成误吸和窒息。',
          next: 'N4'
        },
        {
          id: 'c', text: '使劲掐人中、摇晃他', verdict: 'poor', score: 4,
          dims: { rescue: -1 },
          result: '老赵没有反应，你耽误了一些时间。',
          why: '掐人中和摇晃对中毒昏迷没有救治作用，应保持呼吸道通畅、给氧并观察生命体征。',
          next: 'N4'
        }
      ]
    },

    N4: {
      title: '外部车辆驶入',
      text: '泄漏点还在泄漏。厂区道路上一辆运输车正朝泄漏区方向开过来，司机好像没有注意到警示。',
      view: 'road',
      time: 10,
      set: { prop: { truck: { type: 'move', to: 'road_mid', speed: 2.2 } } },
      choices: [
        {
          id: 'a', text: '立即示意车辆停车、熄火或掉头远离，在路口设置警戒，严禁一切火源进入', verdict: 'best', score: 20,
          dims: { risk: 3, respond: 2, rule: 2 },
          result: '司机看到你的手势后停车熄火，倒车离开。你在路口拉起了警戒线。',
          why: '煤气泄漏区域严禁车辆和明火进入，车辆发动机和排气都可能成为点火源。',
          next: null,
          act: { prop: { truck: 'stop', tape: 'show' } }
        },
        {
          id: 'b', text: '挥手让车加速通过，尽快离开', verdict: 'wrong', score: 0,
          dims: { risk: -3, rule: -2 },
          result: '车辆从泄漏区边缘驶过，所幸当时浓度没有达到爆炸范围。',
          why: '煤气与空气混合达到一定浓度遇火会爆炸。不能让车辆穿过泄漏区。',
          next: null
        },
        {
          id: 'c', text: '不管它，继续守着老赵', verdict: 'poor', score: 6,
          dims: { risk: -2 },
          result: '车辆被远处的调度人员拦下，但你错过了第一时间的警戒。',
          why: '在照看伤员的同时，也要注意控制周边的点火源和无关人员。',
          next: null
        }
      ]
    }
  }
});
