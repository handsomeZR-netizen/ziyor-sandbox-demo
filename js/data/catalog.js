(function () {
  const ZY = (window.ZY = window.ZY || {});
  ZY.scenarios = ZY.scenarios || [];

  ZY.catalog = {
    dims: [
      { key: 'risk', name: '风险识别', desc: '能否第一时间识别险情及次生风险' },
      { key: 'protect', name: '自我防护', desc: '是否优先保证自身安全、远离危险区' },
      { key: 'respond', name: '应急处置', desc: '处置动作是否正确、及时' },
      { key: 'report', name: '信息报告', desc: '是否及时、准确地上报险情' },
      { key: 'rescue', name: '协同救援', desc: '能否在保证安全的前提下协助他人、配合救援' },
      { key: 'rule', name: '规程掌握', desc: '是否掌握相关安全规程和禁令' }
    ],

    verdicts: {
      best: { name: '最佳处置', color: '#059669', sfx: 'good' },
      ok: { name: '合理处置', color: '#2563eb', sfx: 'good' },
      poor: { name: '处置欠妥', color: '#d97706', sfx: 'bad' },
      wrong: { name: '错误处置', color: '#ea580c', sfx: 'bad' },
      fatal: { name: '致命错误', color: '#dc2626', sfx: 'fatal' }
    },

    training: {
      risk: {
        title: '危险源辨识专项训练',
        tips: ['复习高温熔融金属、煤气、起重、电气、有限空间五类典型危险源', '练习识别次生风险：积水、带电体、可燃物、气体扩散方向', '对照岗位风险告知卡，说出本岗位最可能发生的三类事故'],
        recommend: ['bof-splash', 'gas-leak']
      },
      protect: {
        title: '个人防护与避险训练',
        tips: ['牢记"先撤离、再处置"：任何处置动作都不能以进入危险区为代价', '熟悉本区域安全通道、集合点和上风向位置', '实操正压式空气呼吸器、隔热防护服等防护用品'],
        recommend: ['caster-breakout', 'confined-space']
      },
      respond: {
        title: '应急处置流程演练',
        tips: ['逐条复述本岗位应急处置卡', '明确急停、断电、切断气源分别由谁执行、在什么位置执行', '进行限时决策训练，减少紧急情况下的犹豫'],
        recommend: ['elec-fire', 'crane-coil']
      },
      report: {
        title: '事故信息报告训练',
        tips: ['报告四要素：地点、险情、人员情况、已采取的措施', '练习对讲机和电话报告的规范用语', '熟悉报告链路：班组长、调度、安全管理部门'],
        recommend: ['bof-ladle-leak', 'gas-leak']
      },
      rescue: {
        title: '科学施救训练',
        tips: ['禁止盲目施救，施救前先确认自身防护和环境安全', '掌握喊话引导、非进入式救援等不进入危险区的施救方法', '学习心肺复苏和中毒、烧伤的现场急救'],
        recommend: ['confined-space', 'gas-leak']
      },
      rule: {
        title: '安全规程与禁令学习',
        tips: ['熔融金属遇水爆炸、带电设备禁止用水灭火等基本禁令', '挂牌上锁、作业许可和"先通风、再检测、后作业"制度', '学习同类事故案例，完成事故复盘与整改闭环'],
        recommend: ['crane-coil', 'elec-fire']
      }
    },

    // 专家改判后的解析：说明判定来源，保留通用原则下的原分析供对照
    expertWhy(verdict, orig) {
      if (String(orig || '').indexOf('企业安全专家已按本企业规程审核') === 0) return orig;
      const name = (this.verdicts[verdict] || {}).name || verdict;
      return `企业安全专家已按本企业规程审核，将这一项判定为「${name}」。` + (orig ? `（通用原则下的分析：${orig}）` : '');
    },

    grade(score, fatal) {
      if (fatal) return { name: '不合格', cls: 'fail' };
      if (score >= 90) return { name: '优秀', cls: 'great' };
      if (score >= 75) return { name: '良好', cls: 'good' };
      if (score >= 60) return { name: '合格', cls: 'pass' };
      return { name: '不合格', cls: 'fail' };
    },

    defaultTimeout: {
      text: '未作出处置（超时）',
      verdict: 'wrong',
      score: 0,
      dims: { respond: -2, risk: -1 },
      result: '你在原地犹豫，没有采取任何行动，险情还在发展。在应急状态下，犹豫本身就是危险。',
      why: '应急处置要求在最短时间内作出判断。平时把岗位应急处置卡练熟，才能在紧急时刻不犹豫。'
    }
  };
})();
