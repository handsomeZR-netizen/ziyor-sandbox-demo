ZY.scenarios.push({
  id: 'caster-breakout',
  title: '连铸结晶器漏钢',
  category: '高温熔融金属',
  location: '炼钢厂 · 连铸浇注平台',
  role: '连铸浇钢工',
  difficulty: '高',
  duration: '约 4 分钟',
  keywords: ['连铸', '漏钢', '结晶器', '中间包', '二冷', '浇注', '铸坯', '浇钢'],
  summary: '浇注中结晶器下口漏钢，二冷区蒸汽弥漫，平台下方还有一名巡检工。',
  briefing: '你是 1 号连铸机的浇钢工，站在 7 米高的浇注平台上监控中间包和结晶器液面。平台下方的二冷区附近，巡检工小刘正在检查设备。',
  basis: ['《炼钢安全规程》（AQ 2001）关于连铸漏钢事故处置的要求', '企业连铸漏钢事故现场处置方案（通用示例）'],
  scene: {
    template: 'caster',
    view: 'overview',
    props: [
      { id: 'turret', asset: 'ladle_turret', slot: 'turret' },
      { id: 'tundish', asset: 'tundish', slot: 'tundish' },
      { id: 'strand', asset: 'caster_strand', slot: 'mold' },
      { id: 'estop', asset: 'estop', slot: 'estop', label: '浇注急停（联锁关水口）' },
      { id: 'pulpit', asset: 'control_room', slot: 'pulpit', label: '主控室' },
      { id: 'ext', asset: 'fire_extinguisher', slot: 'ext' },
      { id: 'assembly', asset: 'assembly_point', slot: 'assembly' }
    ],
    npcs: [
      { id: 'liu', slot: 'below_worker', label: '巡检工 小刘', wear: 'orange', anim: 'work', face: 'strand.zone2' },
      { id: 'zhou', slot: 'platform_mate', label: '浇钢工 老周', wear: 'blue', anim: 'work', face: 'tundish' }
    ],
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
  },
  start: 'N1',
  nodes: {
    N1: {
      title: '漏钢发生',
      text: '浇注进行中，结晶器下口突然窜出一团火光，二冷区喷出大量蒸汽，报警灯闪烁：发生漏钢了。你站在浇注平台上，距结晶器约 4 米。',
      view: 'platform',
      time: 12,
      set: { fx: { breakout: 1, steam: 1, pool: 0.5, smoke: 0.8, alarm1: 1, alarm2: 1 }, npc: { zhou: { anim: 'retreat', to: 'free1', speed: 0.9 } }, audio: { alarm: true, rumble: 0.8, hiss: 0.6 }, shake: 0.5 },
      choices: [
        {
          id: 'a', text: '立即按下浇注急停（联锁关闭中间包水口），停止供钢，同时报告主控室', verdict: 'best', score: 20, hotspot: 'estop',
          dims: { respond: 3, report: 2, risk: 1, rule: 2 },
          result: '你拍下急停按钮，中间包水口关闭，结晶器不再供钢。主控室回复："收到，铸机已停。"',
          why: '漏钢时第一时间停止供钢，可以从源头上减少漏出的钢水量。急停的具体位置和联锁方式以企业设备为准。',
          next: 'N2',
          act: { fx: { breakout: 0.4 } }
        },
        {
          id: 'b', text: '探身到平台边缘，往下看漏钢的位置', verdict: 'fatal', score: 0,
          dims: { risk: -3, protect: -3 },
          result: '你刚探出身子，一股夹着钢水飞溅的高温蒸汽从平台下方冲上来——',
          why: '漏钢时结晶器下方会喷出高温蒸汽和钢水，绝不能靠近或探身查看。',
          next: null,
          act: { view: 'close_mold', flash: 'strand.mold_low', flashPower: 1.2, shake: 1.4, vignette: 'fatal' }
        },
        {
          id: 'c', text: '沿最近的楼梯往下跑，赶紧离开平台', verdict: 'wrong', score: 4,
          dims: { protect: -2, risk: -2 },
          result: '你跑下楼梯才发现，这段楼梯正通向二冷区，蒸汽和飞溅物迎面扑来，只好又退了回去。',
          why: '撤离要走远离事故点的安全通道。这段楼梯紧挨着二冷区，漏钢时恰恰最危险。平时就应熟悉平台上的安全通道位置。',
          next: 'N2',
          act: { view: 'stairs', fx: { steam: 1 }, shake: 0.5 }
        },
        {
          id: 'd', text: '原地等主控室下指令', verdict: 'poor', score: 6,
          dims: { respond: -2, risk: -1 },
          result: '十几秒后主控室才远程停机，这段时间里又有不少钢水漏出。',
          why: '浇钢工就在现场、离急停最近，应按处置卡立即停止供钢，而不是等待。',
          next: 'N2',
          act: { fx: { pool: 0.9 } }
        }
      ]
    },

    N2: {
      title: '平台下有人',
      text: '供钢已经切断，但平台下方的二冷区里，巡检工小刘被蒸汽和飞溅物困在铸机旁。你从平台栏杆处能看到他。',
      view: 'rail_look_down',
      time: 12,
      set: { npc: { liu: { anim: 'shield' } }, fx: { breakout: 0.3, steam: 0.9 } },
      choices: [
        {
          id: 'a', text: '不下平台。用对讲机报告小刘的位置，同时喊话引导他往远离漏钢点的方向撤', verdict: 'best', score: 20,
          dims: { rescue: 3, report: 2, protect: 2 },
          result: '小刘听到你的喊声，捂着脸朝出坯辊道外侧跑了出去。',
          why: '在不进入危险区的前提下喊话引导、报告位置，是最安全有效的协助方式。',
          next: 'N3',
          act: { npc: { liu: { anim: 'run', to: 'runout_side' } } }
        },
        {
          id: 'b', text: '顺着楼梯下去把他拉出来', verdict: 'wrong', score: 4,
          dims: { rescue: 1, protect: -3, risk: -1 },
          result: '你冲下楼梯，被蒸汽逼得睁不开眼，最后是小刘自己摸索着跑了出来。',
          why: '施救者没有防护进入二冷区，很可能成为第二个受困者。',
          next: 'N3',
          act: { view: 'stairs', npc: { liu: { anim: 'run', to: 'runout_side' } }, shake: 0.4 }
        },
        {
          id: 'c', text: '拿平台上的水管往下冲，给他降温', verdict: 'wrong', score: 0,
          dims: { risk: -3, rule: -2 },
          result: '水流冲到地面的钢液上，炸起一片火星和蒸汽，小刘被吓得往后一退。',
          why: '向漏出的钢水浇水可能引发汽化爆炸，只会让险情更严重。',
          next: 'N3',
          act: { flash: 'below_pool', flashPower: 0.6, shake: 0.6, npc: { liu: { anim: 'run', to: 'runout_side' } } }
        }
      ]
    },

    N3: {
      title: '报告',
      text: '漏钢已经停止。主控室在对讲机里问："平台和铸机周围的人都撤出来了吗？现场什么情况？"',
      view: 'platform_exit',
      time: 15,
      set: { fx: { breakout: 0, steam: 0.6, pool: 0.4, smoke: 0.3 }, audio: { rumble: 0.3 } },
      choices: [
        {
          id: 'a', text: '"结晶器下口漏钢，已急停关水口。小刘已从二冷区撤出，需要检查有无烫伤。平台人员已撤到安全通道。"', verdict: 'best', score: 20,
          dims: { report: 3, rule: 1 },
          result: '主控室安排医护人员和设备检查人员按程序进场。',
          why: '报告完整，后续人员可以准确判断进场时机。',
          next: 'N4'
        },
        {
          id: 'b', text: '"都没事了。"', verdict: 'wrong', score: 2,
          dims: { report: -2 },
          result: '主控室不了解现场情况，准备安排人员下去清理。',
          why: '笼统的报告会掩盖风险，后续人员可能在高温钢液未冷却时进入。',
          next: 'N4'
        },
        {
          id: 'c', text: '先下去看看再回报', verdict: 'poor', score: 6,
          dims: { report: -1, protect: -1 },
          result: '你走到楼梯口才被同事提醒，下面还很危险。',
          why: '应先报告已掌握的情况，现场确认由专人在安全条件下进行。',
          next: 'N4'
        }
      ]
    },

    N4: {
      title: '恢复生产',
      text: '车间主任打来电话，希望尽快恢复浇注减少损失，问你现场能不能马上开机。',
      view: 'overview',
      time: 20,
      set: { fx: { alarm1: 0, alarm2: 0, steam: 0.4 }, audio: { alarm: false, hiss: 0.2 } },
      choices: [
        {
          id: 'a', text: '不能马上开机：要先确认人员撤出、漏钢冷却清理、设备检查完成，按规程交接后再恢复', verdict: 'best', score: 20,
          dims: { rule: 3, risk: 1 },
          result: '车间主任同意按程序处理。',
          why: '事故后恢复生产必须经过检查确认和交接，避免带隐患开机。',
          next: null
        },
        {
          id: 'b', text: '看着没什么事了，可以开', verdict: 'wrong', score: 0,
          dims: { rule: -3, risk: -2 },
          result: '开机后不久，受损的扇形段再次出现异常。',
          why: '漏钢可能损坏结晶器、足辊和扇形段，必须检查后才能恢复。',
          next: null
        },
        {
          id: 'c', text: '先开起来，边生产边清理', verdict: 'wrong', score: 0,
          dims: { rule: -3, protect: -1 },
          result: '清理人员在铸机运行状态下作业，险象环生。',
          why: '设备运行中进行清理作业违反安全规程，极易造成二次伤害。',
          next: null
        }
      ]
    }
  }
});
