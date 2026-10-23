ZY.scenarios.push({
  id: 'confined-space',
  title: '阀门井有限空间作业中毒',
  category: '有限空间',
  location: '炼铁厂 · 煤气管网 3 号阀门井',
  role: '作业监护人',
  difficulty: '高',
  duration: '约 4 分钟',
  keywords: ['有限空间', '阀门井', '下井', '中毒', '窒息', '缺氧', '监护', '受限空间', '井下'],
  summary: '井下作业人员突然失去应答，同事想戴口罩下井救人。',
  briefing: '你是 3 号阀门井检修作业的监护人。作业人员老钱已经下井检修阀门，你在井口负责监护，井口有三脚架、安全绳和通风机。',
  basis: ['《工贸企业有限空间作业安全规定》关于"先通风、再检测、后作业"和严禁盲目施救的要求', '《工业企业煤气安全规程》（GB 6222）'],
  scene: {
    template: 'gas',
    view: 'manhole_far',
    props: [
      { id: 'manhole', asset: 'manhole', slot: 'manhole' },
      { id: 'blower', asset: 'blower', slot: 'blower', to: [-1.4, 0.3, 1.8] },
      { id: 'scba', asset: 'scba_cabinet', slot: 'scba_north' },
      { id: 'aid', asset: 'first_aid', slot: 'first_aid' },
      { id: 'windsock', asset: 'windsock', slot: 'windsock' }
    ],
    npcs: [
      { id: 'li', slot: 'mate_far', label: '同事 小李', wear: 'blue', anim: 'idle', hidden: true },
      { id: 'qian', slot: 'patient', label: '作业人员 老钱', wear: 'orange', anim: 'fallen', hidden: true },
      { id: 'rescuer', slot: 'patient_helper', label: '救援队员', wear: 'navy', helmet: 'red', anim: 'kneel', hidden: true }
    ],
    effects: [{ id: 'gas', type: 'gas', at: 'manhole.hole', intensity: 0.15, wind: 0.4 }],
    init: { audio: { hiss: 0.05 } }
  },
  start: 'N1',
  nodes: {
    N1: {
      title: '井下失去应答',
      text: '老钱下井几分钟后，井下传来一声闷响。你喊他的名字，没有回应。安全绳还垂在井里，一动不动。',
      view: 'manhole',
      time: 12,
      set: { fx: { gas: 0.35 } },
      choices: [
        {
          id: 'a', text: '立刻顺着爬梯下井救人', verdict: 'fatal', score: 0,
          dims: { risk: -3, protect: -3, rule: -3 },
          result: '你刚下到井筒一半，就感到胸口发闷、眼前发黑，手一松滑了下去——',
          why: '有限空间里可能缺氧或积聚了有毒气体，监护人和其他人员盲目下井施救，是有限空间事故伤亡扩大的主要原因之一。',
          next: null,
          act: { view: 'hole', vignette: 'fatal', shake: 0.6 }
        },
        {
          id: 'b', text: '不下井：立即大声呼救、报告调度和救援队，同时开启通风机向井内强制送风', verdict: 'best', score: 20, hotspot: 'blower',
          dims: { rescue: 2, report: 3, protect: 2, rule: 2 },
          result: '通风机轰鸣着向井内送风，调度通知救援队携带空气呼吸器赶来。',
          why: '监护人严禁擅自进入有限空间。应立即报告、呼救，并通过强制通风改善井内环境，为救援争取时间。',
          next: 'N2',
          act: { audio: { rumble: 0.25 } }
        },
        {
          id: 'c', text: '用井口三脚架的绞盘和老钱身上的安全绳，尝试把他拉上来', verdict: 'ok', score: 16, hotspot: 'manhole',
          dims: { rescue: 3, protect: 2, report: -1 },
          result: '绞盘转动了几圈，安全绳绷紧了，但老钱卡在了井下的管道旁，拉不上来。你还没有报告调度。',
          why: '利用三脚架和安全绳进行非进入式救援是正确方向，前提是作业人员按要求系好了安全绳。但救援的同时必须立即报告和呼救。',
          next: 'N2'
        },
        {
          id: 'd', text: '趴在井口往下喊，等他自己爬上来', verdict: 'poor', score: 4,
          dims: { respond: -2, risk: -1 },
          result: '你喊了一分多钟，井下始终没有动静。',
          why: '失去应答说明井下人员可能已经中毒或缺氧，必须立即启动救援，不能等待。',
          next: 'N2'
        }
      ]
    },

    N2: {
      title: '同事要下井',
      text: '救援队还有几分钟才能到。同事小李跑过来，扯下脖子上的防尘口罩说："我戴着口罩下去拉他！"',
      view: 'manhole',
      time: 10,
      set: { npc: { li: { show: true, at: 'mate_far', anim: 'run', to: 'mate_north' } } },
      choices: [
        {
          id: 'a', text: '坚决拦住他：口罩和过滤式面具防不了缺氧和高浓度煤气，必须由佩戴正压式空气呼吸器的救援人员进入', verdict: 'best', score: 20,
          dims: { rescue: 2, rule: 3, risk: 2 },
          result: '小李愣了一下，停住了脚步，转身去帮忙接通风管。',
          why: '有限空间救援必须使用隔绝式呼吸防护装备。监护人有责任制止一切盲目施救。',
          next: 'N3',
          act: { npc: { li: { anim: 'work', face: 'blower' } } }
        },
        {
          id: 'b', text: '让他系好安全绳再下去', verdict: 'wrong', score: 2,
          dims: { rule: -2, protect: -1 },
          result: '小李下到井口就感觉头晕，被你们拽了上来。',
          why: '安全绳只能防坠落、便于拉出，不能防中毒和缺氧。没有呼吸防护就不能进入。',
          next: 'N3'
        },
        {
          id: 'c', text: '不阻止，让他赶紧下去', verdict: 'fatal', score: 0,
          dims: { rule: -3, rescue: -3 },
          result: '小李爬下井筒，没几秒就没了声音。一起事故变成了两个人受害。',
          why: '放任他人盲目施救，是监护人的严重失职，也是有限空间二次伤亡的典型过程。',
          next: null,
          act: { npc: { li: { anim: 'walk', to: 'manhole' } }, vignette: 'fatal' }
        }
      ]
    },

    N3: {
      title: '伤员救出',
      text: '救援队员佩戴空气呼吸器下井，把老钱救了上来。他没有意识，呼吸很微弱。',
      view: 'manhole_far',
      time: 18,
      set: { npc: { qian: { show: true }, rescuer: { show: true, face: 'qian' }, li: { anim: 'idle' } } },
      choices: [
        {
          id: 'a', text: '把他移到上风向空气新鲜处，保持呼吸道通畅，有条件时给氧；呼吸心跳停止立即心肺复苏，等待医护', verdict: 'best', score: 20, hotspot: 'aid',
          dims: { rescue: 3, rule: 1 },
          result: '在你们的持续照护下，老钱的呼吸逐渐恢复，被救护车送往医院。',
          why: '中毒、窒息人员救出后，要尽快脱离危险环境，保持呼吸道通畅、给氧，必要时心肺复苏。',
          next: 'N4'
        },
        {
          id: 'b', text: '就让他躺在井口旁边休息', verdict: 'poor', score: 4,
          dims: { rescue: -1, risk: -1 },
          result: '井口附近仍有气体逸出，老钱的情况没有好转，直到被移到上风向。',
          why: '井口附近仍可能有有毒气体，应将伤员移到上风向空气新鲜处。',
          next: 'N4'
        },
        {
          id: 'c', text: '给他灌水、拍打让他清醒', verdict: 'wrong', score: 2,
          dims: { rescue: -2 },
          result: '水呛进了气管，老钱的呼吸变得更困难了。',
          why: '意识不清的人不能喂水，拍打也没有救治作用。',
          next: 'N4'
        }
      ]
    },

    N4: {
      title: '事故调查',
      text: '事故调查组问你：这次事故最根本的问题出在哪里？',
      view: 'manhole_far',
      time: 20,
      set: { fx: { gas: 0.1 }, audio: { rumble: 0.05 } },
      choices: [
        {
          id: 'a', text: '作业前没有严格执行"先通风、再检测、后作业"，作业过程中也没有持续检测和强制通风', verdict: 'best', score: 20,
          dims: { rule: 3, risk: 2 },
          result: '调查组把这一条列为直接原因，要求所有有限空间作业严格执行作业审批和气体检测。',
          why: '有限空间作业必须先通风、再检测、后作业，并在作业过程中持续监测。这是防止中毒窒息的根本措施。',
          next: null
        },
        {
          id: 'b', text: '老钱自己太不小心', verdict: 'poor', score: 4,
          dims: { rule: -1 },
          result: '调查组提醒你：作业程序和监护落实，才是需要首先查找的问题。',
          why: '把事故归结为个人不小心，会掩盖作业管理上的漏洞。',
          next: null
        },
        {
          id: 'c', text: '阀门井太深，本来就危险，没办法', verdict: 'wrong', score: 0,
          dims: { rule: -2, risk: -2 },
          result: '调查组没有采纳这个说法。',
          why: '有限空间的风险可以通过通风、检测、审批和监护有效控制，"没办法"不是结论。',
          next: null
        }
      ]
    }
  }
});
