ZY.scenarios.push({
  id: 'elec-fire',
  title: '配电室电缆沟着火',
  category: '电气火灾',
  location: '轧钢厂 · 1 号低压配电室',
  role: '值班电工',
  difficulty: '中',
  duration: '约 4 分钟',
  keywords: ['配电室', '电缆', '着火', '火灾', '电气', '开关柜', '冒烟', '触电', '灭火'],
  summary: '夜班巡检时发现 3 号低压柜下方电缆沟冒烟起火，伴有电火花。',
  briefing: '你是夜班值班电工，正在巡检 1 号低压配电室。配电室门口配有二氧化碳和干粉灭火器、墙上有室内消火栓和火灾报警按钮。',
  basis: ['《电力安全工作规程》关于电气设备着火"先断电、后灭火"的要求', '《建筑灭火器配置设计规范》（GB 50140）关于带电火灾适用灭火器的规定'],
  scene: {
    template: 'electric',
    view: 'door_in',
    props: [
      { id: 'ext', asset: 'fire_extinguisher', slot: 'ext', type: 'co2', rot: -90 },
      { id: 'ext2', asset: 'fire_extinguisher', slot: 'ext2', type: 'powder', rot: -90 },
      { id: 'alarmbtn', asset: 'alarm_button', slot: 'alarm_btn' },
      { id: 'hydrant', asset: 'hydrant', slot: 'hydrant' }
    ],
    npcs: [{ id: 'ff', slot: 'outside_ff2', label: '消防员', wear: 'navy', helmet: 'red', anim: 'idle', hidden: true }],
    effects: [
      { id: 'fire', type: 'fire', at: 'cab3', intensity: 0.15, r: 0.35 },
      { id: 'smoke', type: 'smoke', at: 'cab3', intensity: 0.3, r: 0.6 },
      { id: 'arc', type: 'arc', at: 'cab3_arc', intensity: 0 },
      { id: 'haze', type: 'smoke', at: 'smoke_room', intensity: 0, r: 5 }
    ],
    init: { audio: { rumble: 0.05 } }
  },
  start: 'N1',
  nodes: {
    N1: {
      title: '发现起火',
      text: '你推开配电室的门，一股刺鼻的焦糊味扑面而来。3 号低压柜下方的电缆沟里冒出浓烟，能看到火苗，还不时闪出电火花。',
      view: 'door_in',
      time: 12,
      set: { fx: { fire: 0.55, smoke: 0.8, arc: 0.7, haze: 0.2 }, audio: { rumble: 0.25, hiss: 0.15 } },
      choices: [
        {
          id: 'a', text: '立即报告调度，按规程断开着火回路的上级电源，再用二氧化碳或干粉灭火器在安全距离外扑救', verdict: 'best', score: 20, hotspot: 'ext',
          dims: { respond: 3, report: 2, rule: 3 },
          result: '调度确认后，你断开了上级开关，电火花随即消失。你拿起二氧化碳灭火器，在安全距离外对准火根喷射。',
          why: '电气火灾要"先断电、后灭火"。来不及断电时，只能使用二氧化碳、干粉等不导电的灭火剂，并保持安全距离。',
          next: 'N2',
          act: { fx: { arc: 0, fire: 0.4 } }
        },
        {
          id: 'b', text: '拉出墙边的消火栓水带，直接喷水灭火', verdict: 'fatal', score: 0, hotspot: 'hydrant',
          dims: { rule: -3, risk: -3, protect: -2 },
          result: '水柱打到还带电的开关柜上，电流顺着水流和潮湿的地面传到你身上——',
          why: '带电设备着火严禁用水扑救。水会导电，扑救人员可能触电身亡。',
          next: null,
          act: { flash: 'cab3_arc', flashPower: 0.8, shake: 1.2, vignette: 'fatal', fx: { arc: 1 } }
        },
        {
          id: 'c', text: '冲到柜子跟前，查看是哪根电缆着火', verdict: 'wrong', score: 2,
          dims: { protect: -3, risk: -2 },
          result: '你凑近电缆沟，被浓烟呛得直咳，一道电弧在你眼前炸开，你本能地后退摔倒在地。',
          why: '电缆燃烧产生的烟气有毒，带电状态下还可能产生电弧。不要在没有断电和防护的情况下靠近。',
          next: 'N2',
          act: { view: 'fire_close', shake: 0.7, fx: { arc: 1 }, vignette: 'warn' }
        },
        {
          id: 'd', text: '按下火灾报警按钮，关上配电室门，到门外向调度报告', verdict: 'ok', score: 12, hotspot: 'alarmbtn',
          dims: { report: 2, protect: 1, respond: -1 },
          result: '火灾报警响起，调度接到报告后远程断开了上级电源。但火在这几分钟里扩大了。',
          why: '报警和报告是对的，但作为值班电工，你本可以按规程断电并在初期扑救，把火灾控制在萌芽阶段。',
          next: 'N2',
          act: { view: 'outside', fx: { fire: 0.9, arc: 0 }, audio: { alarm: true } }
        }
      ]
    },

    N2: {
      title: '火势蔓延',
      text: '相关回路已经断电，室内照明熄灭，只剩应急灯。一瓶灭火器喷完后，火在电缆沟里还在蔓延，烟越来越浓，你开始呛咳。',
      view: 'door_in',
      time: 12,
      set: { power: false, fx: { fire: 0.85, smoke: 1, haze: 0.9, arc: 0 }, vignette: 'warn', audio: { rumble: 0.35 } },
      choices: [
        {
          id: 'a', text: '降低身体姿势撤到门外，关门控制烟气，在门口待命并引导消防人员', verdict: 'best', score: 20,
          dims: { protect: 3, respond: 2, rescue: 1 },
          result: '你弯腰低姿退出配电室，带上了门，并打电话确认消防人员已经出发。',
          why: '烟气浓度上升时应低姿撤离。关门可以限制空气流入、控制火势和烟气扩散。',
          next: 'N3',
          act: { view: 'outside' }
        },
        {
          id: 'b', text: '拿第二瓶灭火器继续往里冲，争取把火扑灭', verdict: 'wrong', score: 2,
          dims: { protect: -3, risk: -1 },
          result: '你冲到电缆沟旁，浓烟让你几乎睁不开眼，灭火器还没喷完你就不得不撤了出来。',
          why: '初期扑救失败、烟气变浓时，应立即撤离，把灭火交给专业消防人员。',
          next: 'N3',
          act: { view: 'fire_close', shake: 0.6 }
        },
        {
          id: 'c', text: '打开所有窗户排烟', verdict: 'poor', score: 6,
          dims: { respond: -1, risk: -1 },
          result: '窗户打开后烟气确实少了一些，但新鲜空气涌入，火势反而更旺了。',
          why: '火灾未扑灭前大量补入空气会助长燃烧。是否排烟应由消防人员根据现场判断。',
          next: 'N3',
          act: { fx: { fire: 1 } }
        }
      ]
    },

    N3: {
      title: '配合消防',
      text: '消防员赶到门口，问你："配电室里还有没有电？哪些设备可能还带电？"',
      view: 'outside',
      time: 18,
      set: { vignette: '', npc: { ff: { show: true, at: 'outside_ff2', anim: 'walk', to: 'outside_ff' } } },
      choices: [
        {
          id: 'a', text: '说明已断开的回路，指出仍可能带电的设备位置，并拿出配电系统图配合确认', verdict: 'best', score: 20,
          dims: { report: 3, rescue: 2, rule: 1 },
          result: '消防员根据你提供的信息确定了进攻路线，使用干粉和二氧化碳很快扑灭了火。',
          why: '准确说明带电情况，是保证消防人员安全的关键。',
          next: 'N4'
        },
        {
          id: 'b', text: '"应该都断了吧，你们进去吧。"', verdict: 'wrong', score: 0,
          dims: { report: -3, rule: -1 },
          result: '消防员没有贸然进入，坚持重新确认，耽误了几分钟。',
          why: '"应该"不等于"确认"。不确定的带电信息可能直接危及救援人员生命。',
          next: 'N4'
        },
        {
          id: 'c', text: '"我也不清楚，要问白班的人。"', verdict: 'poor', score: 4,
          dims: { report: -2 },
          result: '消防员只好联系调度逐一确认，扑救被推迟。',
          why: '值班电工应熟悉配电系统，事故时能准确说明运行方式和带电范围。',
          next: 'N4'
        }
      ]
    },

    N4: {
      title: '恢复送电',
      text: '火已扑灭。车间主任打电话催你尽快恢复送电，生产线还在等着。',
      view: 'overview',
      time: 20,
      set: { fx: { fire: 0, smoke: 0.25, haze: 0.3 }, audio: { rumble: 0.05, hiss: 0, alarm: false } },
      choices: [
        {
          id: 'a', text: '先检查受损电缆和设备绝缘、清理现场，办理工作票，再按送电程序逐级恢复', verdict: 'best', score: 20,
          dims: { rule: 3, risk: 1 },
          result: '检查发现 3 号柜出线电缆绝缘严重损坏，更换后才恢复送电。',
          why: '火灾后的设备必须经过检查确认，按程序送电，避免带故障合闸引发二次事故。',
          next: null,
          act: { power: true }
        },
        {
          id: 'b', text: '立刻合闸送电', verdict: 'wrong', score: 0,
          dims: { rule: -3, risk: -2 },
          result: '合闸瞬间，受损的电缆发生短路，开关跳闸，柜内再次冒烟。',
          why: '未经检查直接送电，极易造成短路和二次火灾。',
          next: null,
          act: { power: true, fx: { arc: 1, smoke: 0.8 }, shake: 0.6 }
        },
        {
          id: 'c', text: '只恢复没烧着的回路，烧坏的回头再修', verdict: 'poor', score: 6,
          dims: { rule: -1, risk: -1 },
          result: '部分回路恢复了，但没有检查的电缆隐患依然存在。',
          why: '"看起来没烧着"不等于绝缘完好。送电前应对相关回路逐一检查确认。',
          next: null,
          act: { power: true }
        }
      ]
    }
  }
});
