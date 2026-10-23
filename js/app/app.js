(function () {
  const ZY = window.ZY;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const app = $('#app');
  const V = ZY.catalog.verdicts;
  const DIM = {};
  ZY.catalog.dims.forEach((d) => (DIM[d.key] = d));
  const quiet = (o) => {
    if (!o) return o;
    const c = Object.assign({}, o);
    delete c.audio;
    return c;
  };
  const nodeCount = (s) => Object.keys(s.nodes || {}).length;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmtDate = (t) => {
    const d = new Date(t);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  let stage = null;
  function getStage() {
    if (!stage) {
      stage = new ZY.Stage();
      stage.setQuality(ZY.store.settings().quality);
    }
    return stage;
  }

  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }

  async function refreshBadge() {
    const st = await ZY.logic.status();
    const b = $('#modeBadge');
    b.textContent = st.label;
    b.className = 'badge ' + (st.mode === 'offline' ? 'off' : 'on');
    return st;
  }

  let cleanup = null;
  function route() {
    if (cleanup) {
      try {
        cleanup();
      } catch (e) {
        console.error(e);
      }
      cleanup = null;
    }
    const hash = location.hash.replace(/^#\/?/, '');
    const [view, arg] = hash.split('/');
    document.body.classList.remove('playing');
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === (view || 'home') || (view === 'edit' && a.dataset.nav === 'home')));
    window.scrollTo(0, 0);
    if (view === 'edit') cleanup = Editor(decodeURIComponent(arg || ''));
    else if (view === 'play') cleanup = Player(decodeURIComponent(arg || ''));
    else if (view === 'report') cleanup = Report(arg);
    else if (view === 'dash') cleanup = Dash();
    else cleanup = Home();
  }

  const EXAMPLES = [
    ['钢水喷溅', '转炉出钢时钢包下方有积水，突然发生钢水喷溅，旁边还有一名同事'],
    ['连铸漏钢', '连铸结晶器漏钢，平台下方二冷区有巡检工'],
    ['煤气泄漏', '煤气管道区巡检，报警仪报警，有人倒在阀门旁'],
    ['钢丝绳断股', '天车吊运钢卷时发现钢丝绳断股，前方有人作业'],
    ['配电室着火', '配电室电缆沟着火冒烟，有电火花'],
    ['有限空间', '阀门井内作业人员突然失去应答']
  ];
  const DEMO_ID = 'bof-splash';
  // lucide 图标（ISC 许可）
  const svg = (body) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const ICON = {
    sparkles: svg('<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>'),
    play: svg('<polygon points="6 3 20 12 6 21 6 3"/>'),
    info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>')
  };
  const STEPS = ['理解工况', '检索规程依据', '编写分支剧本与 3D 场景', '结构校验', '拼装 3D 沙盒'];

  const engineName = (s) => (s.engine === 'local' ? '规则引擎生成' : s.custom ? '副本' : 'AI 生成');
  const isDraft = (s) => (s.generated || s.custom) && !ZY.store.isPublished(s.id);

  function card(s, thumbs) {
    const th = thumbs[s.id];
    const ov = ZY.store.overrideCount(s.id);
    const own = s.generated || s.custom;
    return `
      <article class="sc-card" data-id="${esc(s.id)}">
        <div class="sc-thumb ${th ? '' : 'empty'} cat-${esc(catKey(s.category))}" ${th ? `style="background-image:url(${th})"` : ''}>
          <span class="sc-cat">${esc(s.category)}</span>
          ${own ? `<span class="sc-ai ${isDraft(s) ? '' : 'pub'}">${engineName(s)} · ${isDraft(s) ? '草稿' : '已发布'}</span>` : ''}
          ${th ? '' : `<span class="sc-ph">${esc(s.title)}</span>`}
        </div>
        <div class="sc-body">
          <h3>${esc(s.title)}</h3>
          <p class="sc-meta">${esc(s.location || '')}</p>
          <p class="sc-sum">${esc(s.summary || '')}</p>
          <div class="sc-tags">
            <span>岗位：${esc(s.role)}</span><span>${nodeCount(s)} 个决策节点</span><span>${esc(s.duration || '')}</span>
            ${ov ? `<span class="tag-ok">专家已改判 ${ov} 处</span>` : ''}
          </div>
          <div class="sc-actions">
            <a class="btn primary" href="#/play/${encodeURIComponent(s.id)}">开始演练</a>
            <a class="btn" href="#/edit/${encodeURIComponent(s.id)}">审核剧本</a>
          </div>
        </div>
      </article>`;
  }
  function catKey(c) {
    return { 高温熔融金属: 'molten', 煤气中毒: 'gas', 起重伤害: 'crane', 电气火灾: 'elec', 触电: 'elec', 火灾: 'molten', 有限空间: 'space' }[c] || 'other';
  }

  // 描述太短时追问 2~3 个关键工况，不回答就按默认值生成
  function clarifyQuestions(desc, role, tplPicked) {
    const a = ZY.composer.analyze(desc, { role });
    const fam = ZY.composer.families[a.family];
    const qs = [];
    if (a.family === 'generic' && !tplPicked) qs.push({ key: 'tpl', q: '险情发生在哪个区域？', opts: Object.values(ZY.templates).map((t) => ({ label: t.name, val: t.id })) });
    if (!a.role) qs.push({ key: 'role', q: '学员扮演什么岗位？', opts: fam.roles.map((r) => ({ label: r, val: r })) });
    if (!a.mods.people) {
      const ppl = {
        crane: [['吊运路线前方有人作业', '吊运路线前方有两名工人在作业']],
        ladle: [['吊运路线下方有人', '吊运路线前方有两名清理工在作业']],
        breakout: [['平台下方有巡检工', '平台下方二冷区有一名巡检工']],
        gas: [['有人倒在泄漏点附近', '有一名工友倒在阀门旁']]
      }[a.family] || (a.family === 'confined' || a.family === 'electric' ? null : [['旁边还有一名同事', '旁边还有一名同事'], ['已有人员受伤倒地', '有一名同事受伤倒地']]);
      if (ppl) qs.push({ key: 'people', q: '现场人员情况？', opts: [{ label: '没有其他人员', val: '' }].concat(ppl.map(([label, val]) => ({ label, val }))) });
    }
    if ((a.family === 'splash' || a.family === 'ladle') && !a.mods.water) qs.push({ key: 'risk', q: '有没有次生风险？', opts: [{ label: '没有', val: '' }, { label: '地面有积水', val: '地面有积水' }] });
    if ((a.family === 'fire' || a.family === 'generic') && !a.mods.oil) qs.push({ key: 'risk', q: '有没有次生风险？', opts: [{ label: '没有', val: '' }, { label: '附近有油品 / 液压油', val: '附近有液压油' }] });
    return { qs: qs.slice(0, 3), analysis: a };
  }

  function Home() {
    const tpls = Object.values(ZY.templates);
    const demo = ZY.store.get(DEMO_ID);
    app.innerHTML = `
      <div class="hero-band">
        <section class="hero">
          <div class="hero-main">
            <span class="hero-badge"><i></i>钢铁企业安全培训 · AI 应急演练沙盒</span>
            <h1>输入一段事故描述，<br />生成可演练的 3D 应急沙盒</h1>
            <p class="lead">自动搭建 3D 现场、多分支处置剧本与评分规则；学员演练后输出能力画像与补强方向。</p>
            <div class="composer card">
              <div class="card-head"><h3>描述现场工况或事故</h3><p>写清危险源、现场人员和次生风险，生成的沙盒更贴近现场</p></div>
              <textarea id="desc" rows="3" placeholder="例如：转炉出钢时钢包下方有积水，突然发生钢水喷溅，旁边还有一名同事"></textarea>
              <div class="composer-row">
                <label>学员岗位<input id="role" placeholder="选填，默认自动推断" /></label>
                <label>车间区域<select id="tpl"><option value="">自动识别</option>${tpls.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
                <button id="btnGen" class="btn primary lg">${ICON.sparkles}<span>生成演练</span></button>
              </div>
              <div class="clarify" id="clarify" hidden></div>
              <div class="chips"><span class="chips-label">示例场景</span>${EXAMPLES.map(([label, text]) => `<button class="chip" data-text="${esc(text)}">${esc(label)}</button>`).join('')}</div>
            </div>
            <p class="mode-note">${ICON.info}<span id="modeNote"></span></p>
          </div>
          <aside class="hero-side" id="heroSide">
            <div class="guide card">
              <div class="card-head"><h4>使用流程</h4><p>三步完成一次应急演练</p></div>
              <ol class="guide-steps">
                <li><span class="step-no">1</span><div><b>描述场景</b><p>输入工况或事故，信息不足时系统会追问</p></div></li>
                <li><span class="step-no">2</span><div><b>审核剧本</b><p>查看分支剧本与判定依据，专家可逐项改判</p></div></li>
                <li><span class="step-no">3</span><div><b>学员演练</b><p>3D 现场限时作答，自动评分并给出补强方向</p></div></li>
              </ol>
              ${demo ? `<div class="guide-try">
                <p>先看效果？直接体验一套标准案例</p>
                <a class="btn" href="#/play/${encodeURIComponent(demo.id)}">${ICON.play}体验示例：${esc(demo.title)}</a>
                <small>${esc(demo.duration || '')} · ${nodeCount(demo)} 个决策环节 · 岗位：${esc(demo.role)}</small>
              </div>` : ''}
            </div>
            <div class="gen-panel" id="genPanel">
              <h4>正在生成演练</h4>
              <ol class="steps">${STEPS.map((s, i) => `<li data-i="${i}"><span class="st-dot"></span><div><b>${s}</b><small></small></div></li>`).join('')}</ol>
              <div class="gen-msg" id="genMsg"></div>
            </div>
          </aside>
        </section>
      </div>
      <section class="library">
        <div class="lib-head">
          <div><h2>演练库</h2><p class="lib-desc">标准案例可直接演练；新生成的剧本默认为草稿，经安全专家审核后用于正式考核。</p></div>
          <div class="tabs" id="libTabs"></div>
        </div>
        <div class="grid" id="grid"></div>
      </section>`;
    let tab = 'all';
    const render = () => {
      const thumbs = ZY.store.thumbs();
      const mine = ZY.store.custom();
      const lists = { all: ZY.store.all(), std: ZY.scenarios, mine };
      $('#libTabs').innerHTML = [['all', '全部'], ['std', '标准案例'], ['mine', '我生成的']]
        .map(([k, name]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${name}<em>${lists[k].length}</em></button>`).join('');
      $('#grid').innerHTML = lists[tab].length
        ? lists[tab].map((s) => card(s, thumbs)).join('')
        : '<div class="empty-lib">还没有生成过剧本。在上方描述一个场景，生成的剧本会出现在这里。</div>';
    };
    render();
    $('#libTabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      tab = b.dataset.tab;
      render();
    });
    refreshBadge().then((st) => {
      $('#modeNote').innerHTML =
        st.mode === 'offline'
          ? '当前为<b>离线演示模式</b>：本地规则引擎秒级生成，可在右上角「设置」中接入大模型。'
          : `已接入大模型 <b>${esc(st.model || '')}</b>：生成一套剧本约 20~60 秒，调用失败时自动切换本地规则引擎。`;
    });
    $$('.chip').forEach((c) => c.addEventListener('click', () => {
      $('#desc').value = c.dataset.text;
      $('#clarify').hidden = true;
      $('#desc').focus();
    }));
    let busy = false;
    const setStep = (i, state, msg) => {
      const li = $(`.steps li[data-i="${i}"]`);
      if (!li) return;
      li.className = state;
      if (msg != null) $('small', li).textContent = msg;
    };
    const showClarify = (desc, qs) => {
      const box = $('#clarify');
      box.innerHTML = `
        <p class="cl-head"><b>补充几个关键工况</b><span class="muted">描述比较简短，回答后生成的沙盒和剧本更贴近现场；也可以跳过，按默认值生成。</span></p>
        ${qs.map((q) => `<div class="cl-q" data-key="${q.key}"><span>${esc(q.q)}</span><div class="cl-opts">${q.opts.map((o, i) => `<button class="cl-opt ${i ? '' : 'on'}" data-val="${esc(o.val)}">${esc(o.label)}</button>`).join('')}</div></div>`).join('')}
        <div class="cl-acts"><button class="btn ghost sm" id="clSkip">跳过，用默认值</button><button class="btn primary sm" id="clGo">按以上条件生成</button></div>`;
      box.hidden = false;
      box.onclick = (e) => {
        const o = e.target.closest('.cl-opt');
        if (!o) return;
        $$('.cl-opt', o.parentNode).forEach((x) => x.classList.toggle('on', x === o));
      };
      $('#clSkip').onclick = () => {
        box.hidden = true;
        runGen(desc);
      };
      $('#clGo').onclick = () => {
        const extra = [];
        $$('.cl-q', box).forEach((q) => {
          const v = $('.cl-opt.on', q).dataset.val;
          if (q.dataset.key === 'role') $('#role').value = v;
          else if (q.dataset.key === 'tpl') $('#tpl').value = v;
          else if (v) extra.push(v);
        });
        const full = desc + (extra.length ? '，' + extra.join('，') : '');
        $('#desc').value = full;
        box.hidden = true;
        runGen(full);
      };
    };
    $('#btnGen').addEventListener('click', () => {
      if (busy) return;
      const desc = $('#desc').value.trim();
      if (desc.length < 2) {
        toast('先描述一下现场工况或事故场景', 'warn');
        $('#desc').focus();
        return;
      }
      if (!$('#clarify').hidden) return $('#clGo').click();
      if (desc.length < 40) {
        const { qs } = clarifyQuestions(desc, $('#role').value.trim(), $('#tpl').value);
        if (qs.length) return showClarify(desc, qs);
      }
      runGen(desc);
    });
    const runGen = async (desc) => {
      if (busy) return;
      busy = true;
      $('#btnGen').disabled = true;
      $('#btnGen span').textContent = '生成中…';
      $$('.steps li').forEach((li) => {
        li.className = '';
        $('small', li).textContent = '';
      });
      $('#genMsg').innerHTML = '';
      $('#heroSide').classList.add('busy');
      const t0 = Date.now();
      const tick = setInterval(() => {
        const li = $('.steps li.run small');
        if (li && li.dataset.base == null) li.dataset.base = li.textContent;
        if (li) li.textContent = `${li.dataset.base}（${Math.round((Date.now() - t0) / 1000)} 秒）`;
      }, 500);
      try {
        const res = await ZY.logic.generate(desc, { role: $('#role').value.trim(), template: $('#tpl').value, onStep: setStep });
        setStep(4, 'run', '进入剧本审核，开始拼装');
        sessionStorage.setItem('zy.just', JSON.stringify({ id: res.scenario.id, source: res.source, warnings: res.warnings, assemble: true }));
        setTimeout(() => (location.hash = '#/edit/' + encodeURIComponent(res.scenario.id)), 500);
      } catch (e) {
        console.error(e);
        $('#genMsg').innerHTML = `<div class="err">${esc(e.message)}</div>`;
      } finally {
        clearInterval(tick);
        busy = false;
        const b = $('#btnGen');
        if (b) {
          b.disabled = false;
          $('span', b).textContent = '生成演练';
        }
      }
    };
    let cancelled = false;
    thumbJob(() => cancelled, render);
    return () => {
      cancelled = true;
      if (stage && stage.el.parentNode && stage.el.parentNode.id === 'thumbHost') stage.detach();
      const host = $('#thumbHost');
      if (host) host.remove();
    };
  }

  async function thumbJob(isCancelled, onDone) {
    const missing = ZY.store.all().filter((s) => !ZY.store.thumbs()[s.id]);
    if (!missing.length) return;
    const host = document.createElement('div');
    host.id = 'thumbHost';
    host.className = 'thumb-host';
    document.body.appendChild(host);
    const st = getStage();
    st.attach(host);
    st.setMode('first');
    for (const raw of missing) {
      if (isCancelled()) return;
      const s = ZY.store.get(raw.id);
      try {
        st.load(s);
        st.apply(quiet(s.scene.init));
        const n = s.nodes[s.start];
        st.setView(n.view, true);
        st.apply(Object.assign(quiet(n.set) || {}, { view: null, shake: 0 }));
        await new Promise((r) => setTimeout(r, 1700));
        if (isCancelled()) return;
        ZY.store.saveThumb(s.id, st.snapshot(480, 270));
        onDone();
      } catch (e) {
        console.warn('缩略图生成失败', s.id, e);
      }
    }
    st.detach();
    host.remove();
  }

  function Editor(id) {
    let s = ZY.store.get(id);
    if (!s) {
      app.innerHTML = `<section class="empty-page"><h2>找不到这个剧本</h2><a class="btn" href="#/">返回工坊</a></section>`;
      return null;
    }
    const just = JSON.parse(sessionStorage.getItem('zy.just') || 'null');
    sessionStorage.removeItem('zy.just');
    const fresh = !!(just && just.id === id);
    const own = !!ZY.store.custom().find((x) => x.id === id);
    let mode = own && sessionStorage.getItem('zy.editmode') === id ? 'edit' : 'view';
    sessionStorage.removeItem('zy.editmode');
    const tpl = ZY.templates[s.scene.template];
    let currentNode = null;
    const warnings = (fresh && just.warnings) || s.warnings || [];
    const fellBack = warnings.some((w) => w.indexOf('大模型调用失败') === 0);
    app.innerHTML = `
      <section class="editor">
        <div class="ed-left">
          <a class="back" href="#/">← 返回工坊</a>
          ${fresh ? `<div class="banner ok">${just.source === 'model' ? '大模型' : '本地规则引擎'}已按描述生成剧本${fellBack ? '（大模型调用失败，已自动切换）' : ''}。生成内容默认是草稿：请审核每个选项的判定和依据，确认后再发布给学员。</div>` : ''}
          <header class="ed-head" id="edHead"></header>
          <div class="tree" id="tree"></div>
        </div>
        <div class="ed-right">
          <div class="ed-stage" id="edStage"></div>
          <div class="ed-stage-bar"><span id="previewLabel">场景总览</span><span class="muted">拖动旋转视角，滚轮缩放</span></div>
        </div>
      </section>`;
    const st = getStage();
    st.attach($('#edStage'));
    st.setMode('orbit');
    ZY.audio.stopAll();
    const reload = () => {
      st.load(s);
      st.apply(quiet(s.scene.init));
    };
    reload();

    const reviewedCount = () => Object.values(s.nodes).reduce((n, x) => n + x.choices.filter((c) => c.reviewed).length, 0);
    const choiceCount = () => Object.values(s.nodes).reduce((n, x) => n + x.choices.length, 0);
    const verdictOpts = (v) => Object.keys(V).map((k) => `<option value="${k}" ${k === v ? 'selected' : ''}>${V[k].name}</option>`).join('');
    const nextOpts = (c) => `<option value="">${c.verdict === 'fatal' ? '演练终止' : '演练结束'}</option>` +
      Object.keys(s.nodes).map((k) => `<option value="${k}" ${c.next === k ? 'selected' : ''}>${k} · ${esc(s.nodes[k].title)}</option>`).join('');

    const renderHead = () => {
      const pub = ZY.store.published()[id];
      const live = pub || !own;
      const approved = ZY.store.isApproved(id);
      $('#edHead').innerHTML = `
        <span class="pill">${esc(s.category)}</span>${own ? `<span class="pill ai">${engineName(s)}</span>` : '<span class="pill">案例库</span>'}<span class="pill ${live ? 'ok' : 'draft'}">${live ? '已发布' : '草稿'}</span>${own ? `<span class="pill ${approved ? 'ok' : 'draft'}">${approved ? '专家已审核' : '待专家审核'}</span>` : ''}
        ${mode === 'edit' ? `<input class="ed-title" data-f="meta|title" value="${esc(s.title)}" />` : `<h1>${esc(s.title)}</h1>`}
        <p class="muted">${esc(s.location)} · 岗位：${mode === 'edit' ? `<input class="ed-inline" data-f="meta|role" value="${esc(s.role)}" />` : esc(s.role)} · ${nodeCount(s)} 个决策环节 · 车间模板：${esc(tpl.name)}</p>
        ${mode === 'edit' ? `<textarea class="ed-area" rows="2" data-f="meta|briefing" placeholder="开场说明">${esc(s.briefing || '')}</textarea>` : `<p>${esc(s.briefing || s.summary || '')}</p>`}
        ${s.prompt ? `<p class="muted">原始描述：「${esc(s.prompt)}」</p>` : ''}
        ${s.understanding ? `<div class="under"><b>场景理解</b>${s.understanding.map((u) => `<span><em>${esc(u.k)}</em>${esc(u.v)}</span>`).join('')}</div>` : ''}
        <div class="basis"><b>参考依据</b>${(s.basis || []).map((b) => `<span>${esc(b)}</span>`).join('')}<em>公开资料与通用原则，需按企业规程确认</em></div>
        ${(s.unmatched || []).length ? `<div class="degrade"><b>资产降级</b>${s.unmatched.map((u) => `<span>「${esc(u.text)}」→ ${u.fallback === 'similar' && ZY.assets.defs[u.asset] ? `相近资产「${esc(ZY.assets.defs[u.asset].label)}」` : '带标签占位体'}</span>`).join('')}<em>已加入待补充资产清单。资产做一次，所有场景都能复用。</em></div>` : ''}
        ${warnings.length ? `<details class="warns"><summary>生成与校验提示 ${warnings.length} 条</summary><ul>${warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></details>` : ''}
        <div class="ed-actions">
          <a class="btn primary" href="#/play/${encodeURIComponent(s.id)}">开始演练</a>
          <button class="btn ${mode === 'edit' ? 'active' : ''}" id="btnEdit">${mode === 'edit' ? '完成编辑' : '编辑剧本'}</button>
          <button class="btn ${mode === 'expert' ? 'active' : ''}" id="btnExpert">${mode === 'expert' ? '完成改判' : '专家改判'}</button>
          ${own ? `<button class="btn" id="btnPub">${pub ? '已发布 · 查看链接' : '发布演练'}</button>` : ''}
          <button class="btn ghost" id="btnExport">导出 JSON</button>
          ${own ? '<button class="btn ghost danger" id="btnDel">删除</button>' : ''}
        </div>
        ${mode === 'edit' ? '<p class="check" id="check"></p>' : ''}
        ${mode === 'expert' ? `<div class="check ok expert-line"><span>改判模式：调整判定或分值后立即生效，并沉淀到企业判定库，同类场景再生成时会沿用。已改判 ${reviewedCount()} 处。</span>${own ? `<button class="btn xs ${approved ? '' : 'primary'}" id="btnApprove">${approved ? '撤销审核结论' : '整套剧本审核通过'}</button>` : ''}</div>` : ''}`;
      if (mode === 'edit') runCheck();
    };

    const choiceTag = (c) => (c.ruled ? '<span class="tag-ok">沿用专家判定</span>' : c.reviewed ? '<span class="tag-ok">已改判</span>' : '');
    const renderTree = () => {
      const order = [];
      const seen = new Set();
      const walk = (nid) => {
        if (!nid || seen.has(nid) || !s.nodes[nid]) return;
        seen.add(nid);
        order.push(nid);
        s.nodes[nid].choices.forEach((c) => walk(c.next));
      };
      walk(s.start);
      Object.keys(s.nodes).forEach((k) => !seen.has(k) && order.push(k));
      $('#tree').innerHTML = order.map((nid, i) => {
        const n = s.nodes[nid];
        if (mode === 'edit') {
          return `
          <div class="node edit ${currentNode === nid ? 'cur' : ''} ${seen.has(nid) ? '' : 'orphan'}" data-node="${nid}">
            <div class="node-head"><span class="nidx">${i + 1}</span><input class="ed-inline grow" data-f="node|${nid}|title" value="${esc(n.title)}" /><label class="muted lim">限时<input class="ed-num" type="number" min="6" max="40" data-f="node|${nid}|time" value="${n.time}" />秒</label><button class="btn xs ghost" data-preview="${nid}">预览</button>${nid !== s.start ? `<button class="btn xs ghost danger" data-delnode="${nid}">删除</button>` : ''}</div>
            ${seen.has(nid) ? '' : '<p class="orphan-tip">这个环节还没有任何选项指向它，学员走不到这里。请在其他环节选项的「去向」中选择它。</p>'}
            <textarea class="ed-area" rows="3" data-f="node|${nid}|text" placeholder="情境描述">${esc(n.text)}</textarea>
            <ul class="choices">${n.choices.map((c) => `
              <li class="ch edit v-${c.verdict}">
                <div class="ch-row">
                  <select data-f="ch|${nid}|${c.id}|verdict">${verdictOpts(c.verdict)}</select>
                  <input type="number" min="0" max="20" data-f="ch|${nid}|${c.id}|score" value="${c.score}" />
                  <textarea class="ed-area grow" rows="1" data-f="ch|${nid}|${c.id}|text" placeholder="选项内容">${esc(c.text)}</textarea>
                  <button class="btn xs ghost danger" data-delch="${nid}|${c.id}" title="删除这个选项">×</button>
                </div>
                <div class="ch-edit">
                  <label><span>后果</span><textarea class="ed-area" rows="2" data-f="ch|${nid}|${c.id}|result">${esc(c.result)}</textarea></label>
                  <label><span>解析</span><textarea class="ed-area" rows="2" data-f="ch|${nid}|${c.id}|why">${esc(c.why)}</textarea></label>
                  <label><span>去向</span><select data-f="ch|${nid}|${c.id}|next" ${c.verdict === 'fatal' ? 'disabled' : ''}>${nextOpts(c)}</select></label>
                </div>
              </li>`).join('')}</ul>
            ${n.choices.length < 4 ? `<button class="btn xs ghost add" data-addch="${nid}">＋ 添加选项</button>` : ''}
          </div>`;
        }
        return `
          <div class="node ${currentNode === nid ? 'cur' : ''}" data-node="${nid}">
            <div class="node-head"><span class="nidx">${i + 1}</span><b>${esc(n.title)}</b><span class="muted">限时 ${n.time} 秒</span><button class="btn xs ghost" data-preview="${nid}">预览</button></div>
            <p class="node-text">${esc(n.text)}</p>
            <ul class="choices">${n.choices.map((c) => `
              <li class="ch v-${c.verdict}">
                <div class="ch-row">
                  ${mode === 'expert' ? `<select data-v="${nid}|${c.id}">${verdictOpts(c.verdict)}</select><input type="number" min="0" max="20" value="${c.score}" data-s="${nid}|${c.id}" />` : `<span class="vpill" style="--c:${V[c.verdict].color}">${V[c.verdict].name}</span><span class="score">${c.score} 分</span>`}
                  <span class="ch-text">${esc(c.text)}</span>
                  ${choiceTag(c)}
                </div>
                <div class="ch-detail">
                  <p><b>后果</b>${esc(c.result)}</p>
                  <p><b>解析</b>${esc(c.why)}</p>
                  <p class="dims">${Object.keys(c.dims || {}).map((k) => `<span class="${c.dims[k] >= 0 ? 'up' : 'down'}">${DIM[k].name} ${c.dims[k] > 0 ? '+' : ''}${c.dims[k]}</span>`).join('')}
                  <span class="goto">${c.next ? '→ ' + esc((s.nodes[c.next] || {}).title || c.next) : c.verdict === 'fatal' ? '→ 演练终止' : '→ 演练结束'}</span>
                  <button class="btn xs ghost" data-act="${nid}|${c.id}">预览后果</button></p>
                </div>
              </li>`).join('')}</ul>
          </div>`;
      }).join('') + (mode === 'edit' ? '<button class="btn sm ghost add-node" id="addNode">＋ 添加决策环节</button>' : '');
    };

    // ---- 编辑模式：直接改剧本文字、选项、分值和去向，自动保存 ----
    let saveTimer = null;
    const flush = () => {
      if (!saveTimer) return;
      clearTimeout(saveTimer);
      saveTimer = null;
      ZY.store.clearOverrides(id);
      ZY.store.saveCustom(s, true);
    };
    const save = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveTimer = 1;
        flush();
        runCheck();
        if (ZY.store.isApproved(id)) {
          ZY.store.approve(id, false);
          renderHead();
          toast('剧本内容有修改，需要安全专家重新审核', 'warn');
        }
      }, 350);
    };
    function runCheck() {
      const el = $('#check');
      if (!el) return;
      const v = ZY.logic.validate(s);
      const issues = v.warnings.filter((w) => /不可达|结束节点|不存在的节点/.test(w));
      Object.values(s.nodes).forEach((n) => {
        if (n.choices.length < 2) issues.push(`「${n.title}」的选项少于 2 个`);
        if (n.choices.some((c) => !String(c.text || '').trim())) issues.push(`「${n.title}」有选项还没有填写内容`);
      });
      if (!Object.values(s.nodes).some((n) => n.choices.some((c) => c.verdict === 'best'))) issues.push('剧本里没有任何"最佳处置"选项');
      el.className = 'check ' + (issues.length ? 'warn' : 'ok');
      el.textContent = issues.length ? '结构检查：' + issues.join('；') : '结构检查通过：所有环节可达，每条路径都有终点。修改会自动保存。';
    }
    const onField = (el, rerender) => {
      const [kind, a, b, c] = el.dataset.f.split('|');
      if (kind === 'meta') s[a] = el.value;
      else if (kind === 'node') s.nodes[a][b] = b === 'time' ? clamp(Math.round(Number(el.value) || 15), 6, 40) : el.value;
      else if (kind === 'ch') {
        const ch = s.nodes[a].choices.find((x) => x.id === b);
        if (c === 'score') {
          ch.score = clamp(Math.round(Number(el.value) || 0), 0, 20);
          ch.reviewed = ch.ruled = false;
        } else if (c === 'verdict') {
          ch.verdict = el.value;
          ch.reviewed = ch.ruled = false;
          if (ch.verdict === 'fatal') {
            ch.next = null;
            ch.act = Object.assign({}, ch.act, { vignette: 'fatal' });
          } else if (ch.act && ch.act.vignette === 'fatal') ch.act = Object.assign({}, ch.act, { vignette: '' });
        } else if (c === 'next') ch.next = el.value || null;
        else ch[c] = el.value;
      }
      save();
      if (rerender) renderTree();
    };
    const left = $('.ed-left');
    left.addEventListener('input', (e) => {
      if (mode === 'edit' && e.target.dataset.f && e.target.tagName !== 'SELECT') onField(e.target, false);
    });
    left.addEventListener('change', (e) => {
      if (mode === 'edit' && e.target.dataset.f && e.target.tagName === 'SELECT') onField(e.target, true);
    });

    const preview = (nid) => {
      currentNode = nid;
      const n = s.nodes[nid];
      reload();
      st.apply(quiet(n.set));
      st.setView(n.view || tpl.defaultView);
      $('#previewLabel').textContent = '预览：' + n.title;
      $$('.node').forEach((el) => el.classList.toggle('cur', el.dataset.node === nid));
    };
    $('#tree').addEventListener('click', (e) => {
      const p = e.target.closest('[data-preview]');
      if (p) return preview(p.dataset.preview);
      const a = e.target.closest('[data-act]');
      if (a) {
        const [nid, cid] = a.dataset.act.split('|');
        preview(nid);
        const c = s.nodes[nid].choices.find((x) => x.id === cid);
        setTimeout(() => {
          st.apply(quiet(c.act));
          $('#previewLabel').textContent = '预览后果：' + c.text.slice(0, 24);
          setTimeout(() => st.setVignette(''), 2500);
        }, 900);
        return;
      }
      const addc = e.target.closest('[data-addch]');
      if (addc) {
        const n = s.nodes[addc.dataset.addch];
        const cid = 'abcdef'.split('').find((k) => !n.choices.some((c) => c.id === k));
        n.choices.push({ id: cid, text: '', verdict: 'ok', score: 12, dims: {}, result: '', why: '', next: null });
        save();
        renderTree();
        return;
      }
      const delc = e.target.closest('[data-delch]');
      if (delc) {
        const [nid, cid] = delc.dataset.delch.split('|');
        const n = s.nodes[nid];
        if (n.choices.length <= 2) return toast('每个环节至少保留 2 个选项', 'warn');
        n.choices = n.choices.filter((c) => c.id !== cid);
        save();
        renderTree();
        return;
      }
      const deln = e.target.closest('[data-delnode]');
      if (deln) {
        const nid = deln.dataset.delnode;
        if (!confirm(`删除环节「${s.nodes[nid].title}」？指向它的选项会改为"演练结束"。`)) return;
        delete s.nodes[nid];
        Object.values(s.nodes).forEach((n) => n.choices.forEach((c) => c.next === nid && (c.next = null)));
        save();
        renderHead();
        renderTree();
        return;
      }
      if (e.target.closest('#addNode')) {
        let k = Object.keys(s.nodes).length + 1;
        while (s.nodes['N' + k]) k++;
        const nid = 'N' + k;
        s.nodes[nid] = {
          title: '新环节', text: '', view: tpl.defaultView, time: 15,
          choices: [
            { id: 'a', text: '', verdict: 'best', score: 20, dims: {}, result: '', why: '', next: null },
            { id: 'b', text: '', verdict: 'wrong', score: 2, dims: {}, result: '', why: '', next: null }
          ]
        };
        save();
        renderHead();
        renderTree();
        const el = $(`.node[data-node="${nid}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const li = e.target.closest('.ch');
      if (li && mode !== 'edit' && !e.target.closest('select,input')) li.classList.toggle('open');
    });

    // ---- 专家改判：按企业规程调整判定，沉淀到判定库 ----
    $('#tree').addEventListener('change', (e) => {
      const t = e.target;
      const key = t.dataset.v || t.dataset.s;
      if (mode !== 'expert' || !key) return;
      const [nid, cid] = key.split('|');
      const patch = t.dataset.v ? { verdict: t.value } : { score: clamp(Number(t.value) || 0, 0, 20) };
      if (patch.verdict === 'fatal') patch.next = null;
      ZY.store.setOverride(id, nid, cid, patch);
      s = ZY.store.get(id);
      const c = s.nodes[nid].choices.find((x) => x.id === cid);
      ZY.store.addRuling({ text: c.text, verdict: c.verdict, score: c.score, category: s.category, from: s.title });
      renderHead();
      renderTree();
      toast('已保存专家改判：本剧本立即生效，同类场景再生成时也会沿用', 'ok');
    });

    const openPublish = () => {
      flush();
      const link = location.origin + location.pathname + '#/play/' + encodeURIComponent(id);
      const pub = ZY.store.published()[id];
      const reviewed = reviewedCount(), total = choiceCount();
      const approved = ZY.store.isApproved(id);
      const v = ZY.logic.validate(s);
      const issues = v.warnings.filter((w) => /不可达|少于|结束节点|不存在的节点/.test(w));
      const root = $('#modal-root');
      root.innerHTML = `
        <div class="modal-bg"><div class="modal">
          <h3>${pub ? '演练已发布' : '发布演练'}</h3>
          <p class="muted">学员在 PC 浏览器打开下面的链接，即可进入 3D 沙盒演练，成绩自动计入能力看板。</p>
          <div class="linkbox"><input readonly id="pubLink" value="${esc(link)}" /><button class="btn sm" id="pubCopy">复制链接</button></div>
          <ul class="pub-check">
            <li class="${issues.length ? 'warn' : 'ok'}">结构检查${issues.length ? `有 ${issues.length} 条提示：${esc(issues[0])}` : '通过'}</li>
            <li class="${approved ? 'ok' : 'warn'}">${approved ? '安全专家已审核通过整套剧本' : `安全专家尚未审核通过整套剧本${reviewed ? `（已改判 ${reviewed} / ${total} 个选项）` : ''}`}</li>
            <li class="${(s.unmatched || []).length ? 'warn' : 'ok'}">${(s.unmatched || []).length ? `有 ${s.unmatched.length} 处资产降级（占位体或相近资产）` : '场景资产全部来自资产库'}</li>
          </ul>
          ${approved ? '' : '<p class="pub-note">这个剧本还没有经过安全专家审核通过。发布后学员端会标注"试练"，成绩不计入正式考核。专家可以在「专家改判」中确认整套剧本后再正式发布。</p>'}
          <div class="modal-acts">
            ${pub ? '<button class="btn ghost danger" id="pubUndo">撤回发布</button>' : ''}
            <button class="btn ghost" id="pubClose">关闭</button>
            ${pub ? '' : '<button class="btn primary" id="pubGo">确认发布</button>'}
          </div>
        </div></div>`;
      const close = () => (root.innerHTML = '');
      $('#pubClose').onclick = close;
      $('.modal-bg').onclick = (e) => e.target.classList.contains('modal-bg') && close();
      $('#pubCopy').onclick = () => {
        const done = () => toast('链接已复制', 'ok');
        if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, () => {
          $('#pubLink').select();
          document.execCommand('copy');
          done();
        });
        else {
          $('#pubLink').select();
          document.execCommand('copy');
          done();
        }
      };
      if ($('#pubGo')) $('#pubGo').onclick = () => {
        ZY.store.publish(id, { reviewed, total });
        toast(approved ? '已发布，学员可以通过链接进入演练' : '已发布为试练，成绩不计入正式考核', 'ok');
        renderHead();
        openPublish();
      };
      if ($('#pubUndo')) $('#pubUndo').onclick = () => {
        ZY.store.unpublish(id);
        close();
        renderHead();
        toast('已撤回发布，剧本回到草稿状态');
      };
    };

    $('#edHead').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.id === 'btnEdit') {
        if (!own) {
          if (!confirm('案例库剧本不能直接修改。是否另存为副本，在副本上编辑？')) return;
          const c = ZY.store.fork(id);
          sessionStorage.setItem('zy.editmode', c.id);
          location.hash = '#/edit/' + encodeURIComponent(c.id);
          return;
        }
        if (mode === 'edit') {
          flush();
          ZY.store.dropThumb(id);
          toast('剧本已保存', 'ok');
        }
        mode = mode === 'edit' ? 'view' : 'edit';
      } else if (b.id === 'btnExpert') {
        flush();
        s = ZY.store.get(id);
        mode = mode === 'expert' ? 'view' : 'expert';
      } else if (b.id === 'btnApprove') {
        const on = !ZY.store.isApproved(id);
        ZY.store.approve(id, on);
        toast(on ? '已记录专家审核结论：整套剧本可用于正式考核' : '已撤销审核结论，剧本回到待审核状态', on ? 'ok' : 'warn');
      } else if (b.id === 'btnPub') return openPublish();
      else if (b.id === 'btnExport') {
        const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = s.id + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
        return;
      } else if (b.id === 'btnDel') {
        if (!confirm('确定删除这个剧本吗？')) return;
        ZY.store.removeCustom(id);
        location.hash = '#/';
        return;
      } else return;
      renderHead();
      renderTree();
    });

    renderHead();
    renderTree();
    const shoot = () => {
      if (!ZY.store.thumbs()[id] && st.el.parentNode && st.el.parentNode.id === 'edStage') ZY.store.saveThumb(id, st.snapshot(480, 270));
    };
    let thumbTimer = null;
    if (fresh && just.assemble) {
      const stats = st.assemble(
        (label, i, n) => ($('#previewLabel').textContent = `正在拼装 3D 沙盒（${i}/${n}）：${label}`),
        () => {
          const el = $('#previewLabel');
          if (el) el.textContent = `拼装完成：${stats.props} 个设备道具、${stats.npcs} 名人员、${stats.effects} 个险情特效`;
          thumbTimer = setTimeout(shoot, 600);
        }
      );
    } else thumbTimer = setTimeout(shoot, 2200);
    return () => {
      clearTimeout(thumbTimer);
      flush();
      $('#modal-root').innerHTML = '';
      st.detach();
    };
  }

  function Player(id) {
    const s = ZY.store.get(id);
    if (!s) {
      app.innerHTML = `<section class="empty-page"><h2>找不到这个剧本</h2><a class="btn" href="#/">返回工坊</a></section>`;
      return null;
    }
    document.body.classList.add('playing');
    const settings = ZY.store.settings();
    const tpl = ZY.templates[s.scene.template];
    const std = ZY.logic.standardPath(s);
    // 未经专家审核的生成剧本只能试练，成绩不计入正式考核
    const pub = ZY.store.published()[s.id];
    const approved = !!(s.generated || s.custom) && ZY.store.isApproved(s.id);
    const trial = !!(s.generated || s.custom) && !(pub && approved);
    const trialWhy = !pub ? '这个剧本还是草稿，尚未发布' : '这个剧本还没有经过安全专家审核';
    app.innerHTML = `
      <section class="player">
        <div class="pl-stage" id="plStage"></div>
        <div class="hud-top">
          <div class="hud-info"><span class="pill">${esc(s.category)}</span>${trial ? '<span class="pill trial">试练</span>' : ''}<b>${esc(s.title)}</b><span class="muted">岗位：${esc(s.role)}</span></div>
          <div class="hud-step" id="hudStep"></div>
          <div class="hud-right">
            <div class="timer" id="timer"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="bg"/><circle cx="22" cy="22" r="19" class="fg" id="timerFg"/></svg><span id="timerTxt"></span></div>
            <button class="icon-btn" id="btnMute">${settings.sound ? '声音 开' : '声音 关'}</button>
            <button class="icon-btn" id="btnExit">退出演练</button>
          </div>
        </div>
        <div class="hint" id="hint">拖动画面可以环顾四周</div>
        <div class="panel" id="panel" hidden>
          <div class="narr"><h3 id="nTitle"></h3><p id="nText"></p></div>
          <div class="opts" id="opts"></div>
        </div>
        <div class="result" id="result" hidden></div>
        <div class="brief" id="brief">
          <div class="brief-card">
            <p class="eyebrow">${esc(s.location)}</p>
            <h1>${esc(s.title)}</h1>
            <p class="role">你的岗位：<b>${esc(s.role)}</b></p>
            <p>${esc(s.briefing || s.summary)}</p>
            <ul class="brief-rules"><li>共 ${std.length} 个左右的处置环节，每个环节限时作答，超时按"未作出处置"计，作答犹豫也会扣分</li><li>可以点选项，也可以按数字键 1~4；画面中闪烁的标签也可以直接点击</li><li>演练结束后自动评分，并给出能力分析和补强方向</li></ul>
            ${trial ? `<p class="trial-note"><b>试练</b>${trialWhy}，判定依据为公开规程和通用原则。本次成绩只用于练习，不计入正式考核。</p>` : ''}
            <button class="btn primary lg" id="btnStart">进入现场</button>
          </div>
        </div>
      </section>`;
    const st = getStage();
    st.attach($('#plStage'));
    st.setMode('first');
    st.load(s);
    st.apply(quiet(s.scene.init));
    st.setView(s.scene.view || tpl.defaultView, true);
    const steps = [];
    let node = null, nodeId = null, locked = true, timer = null, deadline = 0, stepNo = 0, typing = null, lastChoice = null, resTimer = null;
    const t0 = Date.now();
    const C = 2 * Math.PI * 19;
    $('#timerFg').style.strokeDasharray = C;

    function stopTimer() {
      clearInterval(timer);
      timer = null;
    }
    function startTimer(sec) {
      stopTimer();
      deadline = Date.now() + sec * 1000;
      let lastSec = null;
      $('#timer').classList.remove('urgent');
      timer = setInterval(() => {
        const left = Math.max(0, deadline - Date.now());
        const secLeft = Math.ceil(left / 1000);
        $('#timerTxt').textContent = secLeft;
        $('#timerFg').style.strokeDashoffset = C * (1 - left / (sec * 1000));
        $('#timer').classList.toggle('urgent', secLeft <= 3);
        if (secLeft <= 3 && secLeft !== lastSec && secLeft > 0) ZY.audio.sfx('tick');
        lastSec = secLeft;
        if (left <= 0) {
          stopTimer();
          choose(ZY.logic.timeoutChoice(node));
        }
      }, 100);
    }

    function typeText(el, text, done) {
      clearInterval(typing);
      let i = 0;
      el.textContent = '';
      typing = setInterval(() => {
        i += 2;
        el.textContent = text.slice(0, i);
        if (i >= text.length) {
          clearInterval(typing);
          typing = null;
          done && done();
        }
      }, 22);
      el.onclick = () => {
        if (!typing) return;
        clearInterval(typing);
        typing = null;
        el.textContent = text;
        done && done();
      };
    }

    function enterNode(nid) {
      nodeId = nid;
      node = s.nodes[nid];
      stepNo++;
      $('#hudStep').innerHTML = `第 <b>${stepNo}</b> 步 · ${esc(node.title)}`;
      $('#result').hidden = true;
      st.setVignette('');
      st.setView(node.view || tpl.defaultView);
      st.apply(node.set);
      $('#panel').hidden = false;
      $('#panel').classList.remove('show');
      requestAnimationFrame(() => $('#panel').classList.add('show'));
      $('#nTitle').textContent = node.title;
      $('#opts').innerHTML = node.choices.map((c, i) => `<button class="opt" data-i="${i}" disabled><span class="k">${i + 1}</span><span>${esc(c.text)}</span></button>`).join('');
      locked = true;
      const ready = () => {
        if (nodeId !== nid) return;
        locked = false;
        $$('.opt').forEach((b) => (b.disabled = false));
        st.setHotspots(node.choices.filter((c) => c.hotspot).map((c) => ({ ref: c.hotspot, label: (st.props[c.hotspot] && st.props[c.hotspot].userData.label) || c.text.slice(0, 8), onClick: () => choose(c) })));
        startTimer(node.time || 15);
      };
      typeText($('#nText'), node.text, () => setTimeout(ready, 250));
    }

    function choose(c) {
      if (locked && c.id !== '__timeout') return;
      if (!node) return;
      locked = true;
      stopTimer();
      clearInterval(typing);
      $$('.opt').forEach((b) => (b.disabled = true));
      const idx = node.choices.indexOf(c);
      if (idx >= 0) $$('.opt')[idx].classList.add('picked');
      steps.push({ node: nodeId, choice: c.id, elapsed: Math.round((Date.now() - (deadline - (node.time || 15) * 1000)) / 1000) });
      lastChoice = c;
      st.setHotspots([]);
      ZY.audio.sfx('click');
      setTimeout(() => ZY.audio.sfx(V[c.verdict].sfx), 150);
      if (c.act) st.apply(c.act);
      const end = c.verdict === 'fatal' || !c.next;
      resTimer = setTimeout(() => {
        if (!$('#panel')) return;
        $('#panel').classList.remove('show');
        const r = $('#result');
        r.className = 'result v-' + c.verdict;
        r.innerHTML = `
          <div class="res-card">
            <div class="res-head"><span class="vbig" style="--c:${V[c.verdict].color}">${V[c.verdict].name}</span>${c.id === '__timeout' ? '<span class="muted">超时未作答</span>' : `<span class="muted">你的选择：${esc(c.text)}</span>`}</div>
            <p class="res-text">${esc(c.result)}</p>
            <div class="res-why"><b>为什么</b><p>${esc(c.why)}</p></div>
            <div class="res-foot"><span class="muted">${c.reviewed || approved ? '该判定已由安全专家审核' : '判定依据：公开规程与通用安全原则，以企业规程为准'}</span>
            <button class="btn primary" id="btnNext">${c.verdict === 'fatal' ? '演练终止 · 查看结果' : end ? '查看演练结果' : '继续'}</button></div>
          </div>`;
        r.hidden = false;
        $('#btnNext').addEventListener('click', next);
        setTimeout(() => $('#btnNext') && $('#btnNext').focus(), 50);
      }, c.verdict === 'fatal' ? 1600 : 900);
    }

    function next() {
      const c = lastChoice;
      if (!c || $('#result').hidden) return;
      lastChoice = null;
      if (c.verdict === 'fatal' || !c.next) return finish();
      enterNode(c.next);
    }

    function finish() {
      stopTimer();
      ZY.audio.stopAll();
      const res = ZY.logic.score(s, steps);
      const rec = {
        id: 'r' + Date.now().toString(36), scenarioId: s.id, title: s.title, role: s.role, at: Date.now(),
        score: res.score, fatal: res.fatal, grade: res.grade.name, dims: res.dims, steps, duration: Math.round((Date.now() - t0) / 1000), trial
      };
      ZY.store.addRecord(rec);
      location.hash = '#/report/' + rec.id;
    }

    $('#btnStart').addEventListener('click', () => {
      ZY.audio.ensure();
      ZY.audio.setMuted(!settings.sound);
      if (s.scene.init && s.scene.init.audio) ZY.audio.apply(s.scene.init.audio);
      $('#brief').classList.add('hide');
      setTimeout(() => $('#brief') && $('#brief').remove(), 400);
      setTimeout(() => $('#hint') && $('#hint').classList.add('hide'), 5000);
      enterNode(s.start);
    });
    $('#opts').addEventListener('click', (e) => {
      const b = e.target.closest('.opt');
      if (b && !b.disabled) choose(node.choices[Number(b.dataset.i)]);
    });
    $('#btnMute').addEventListener('click', () => {
      const m = !ZY.audio.muted;
      ZY.audio.setMuted(m);
      $('#btnMute').textContent = m ? '声音 关' : '声音 开';
    });
    $('#btnExit').addEventListener('click', () => {
      if (steps.length && !confirm('退出后本次演练不会记录成绩，确定退出吗？')) return;
      location.hash = '#/';
    });
    const onKey = (e) => {
      if (e.key === 'Enter' && !$('#result').hidden) {
        e.preventDefault();
        next();
        return;
      }
      const k = Number(e.key);
      if (k >= 1 && k <= 4 && node && !locked && node.choices[k - 1]) choose(node.choices[k - 1]);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      stopTimer();
      clearInterval(typing);
      clearTimeout(resTimer);
      document.removeEventListener('keydown', onKey);
      ZY.audio.stopAll();
      st.setHotspots([]);
      st.detach();
    };
  }

  function drawRadar(cv, series) {
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) / 2 - 46;
    const dims = ZY.catalog.dims;
    const ang = (i) => -Math.PI / 2 + (i / dims.length) * Math.PI * 2;
    g.strokeStyle = 'rgba(24,24,27,0.1)';
    g.lineWidth = 1;
    for (let r = 1; r <= 4; r++) {
      g.beginPath();
      dims.forEach((d, i) => {
        const x = cx + Math.cos(ang(i)) * (R * r) / 4, y = cy + Math.sin(ang(i)) * (R * r) / 4;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      });
      g.closePath();
      g.stroke();
    }
    dims.forEach((d, i) => {
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(ang(i)) * R, cy + Math.sin(ang(i)) * R);
      g.stroke();
      g.fillStyle = '#71717a';
      g.font = '500 12.5px "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(d.name, cx + Math.cos(ang(i)) * (R + 24), cy + Math.sin(ang(i)) * (R + 18));
    });
    for (const s of series) {
      g.beginPath();
      dims.forEach((d, i) => {
        const v = s.values[d.key] == null ? 0 : s.values[d.key];
        const x = cx + Math.cos(ang(i)) * R * (v / 100), y = cy + Math.sin(ang(i)) * R * (v / 100);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      });
      g.closePath();
      g.setLineDash(s.dash ? [5, 4] : []);
      g.strokeStyle = s.color;
      g.lineWidth = 2;
      g.stroke();
      if (s.fill) {
        g.fillStyle = s.fill;
        g.fill();
      }
      g.setLineDash([]);
      if (!s.dash) {
        dims.forEach((d, i) => {
          const v = s.values[d.key];
          if (v == null) return;
          g.beginPath();
          g.arc(cx + Math.cos(ang(i)) * R * (v / 100), cy + Math.sin(ang(i)) * R * (v / 100), 3.5, 0, Math.PI * 2);
          g.fillStyle = s.color;
          g.fill();
        });
      }
    }
  }

  function avgDims(recs) {
    const out = {};
    ZY.catalog.dims.forEach((d) => {
      const vals = recs.map((r) => r.dims && r.dims[d.key]).filter((v) => v != null);
      out[d.key] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    });
    return out;
  }

  function Report(rid) {
    const r = ZY.store.record(rid);
    const s = r && ZY.store.get(r.scenarioId);
    if (!r || !s) {
      app.innerHTML = `<section class="empty-page"><h2>找不到这次演练记录</h2><a class="btn" href="#/">返回工坊</a></section>`;
      return null;
    }
    const res = ZY.logic.score(s, r.steps);
    const mocks = ZY.logic.mockRecords();
    let benchRecs = mocks.filter((m) => m.scenarioId === s.id), benchLabel = '同场景平均（模拟数据）';
    if (!benchRecs.length) {
      benchRecs = mocks.filter((m) => (ZY.store.raw(m.scenarioId) || {}).category === s.category);
      benchLabel = '同类场景平均（模拟数据）';
    }
    if (!benchRecs.length) {
      benchRecs = mocks;
      benchLabel = '全员平均（模拟数据）';
    }
    const bench = avgDims(benchRecs);
    const stdMap = {};
    res.standard.forEach((p) => (stdMap[p.node] = p.choice));
    const others = (ids) => ids.filter((x) => x !== s.id).map((x) => ZY.store.raw(x)).filter(Boolean);
    app.innerHTML = `
      <section class="report">
        <a class="back" href="#/">← 返回工坊</a>
        <div class="rp-top">
          <div class="score-card ${res.grade.cls}">
            <div class="score-num">${res.score}<small>分</small></div>
            <div class="grade">${res.grade.name}</div>
          </div>
          <div class="rp-sum">
            <p class="eyebrow">${esc(s.location)} · ${fmtDate(r.at)} · 用时 ${Math.floor(r.duration / 60)} 分 ${r.duration % 60} 秒</p>
            <h1>${esc(s.title)}</h1>
            <p class="muted">岗位：${esc(s.role)} · 共作答 ${res.detail.length} 步 · 错误及以上 ${res.wrong} 次</p>
            ${r.trial ? '<div class="trial-banner"><b>试练成绩</b>这个剧本尚未经过安全专家审核或还没有正式发布，本次成绩只用于练习，不计入正式考核和能力看板统计。</div>' : ''}
            ${res.fatal ? `<div class="fatal-banner"><b>触发红线：</b>在「${esc(res.fatalInfo.node.title)}」环节选择了「${esc(res.fatalInfo.choice.text)}」。在真实现场，这一操作极可能造成严重伤亡，本次演练判定为不合格。</div>` : `<div class="ok-banner">本次演练没有触发红线操作。</div>`}
            <div class="breakdown">
              <span><b>基础分 ${res.base}</b><em>步骤得分 ${res.total} / ${res.maxTotal}</em></span>
              ${res.timePenalty ? `<span class="minus">时效修正 −${res.timePenalty}<em>${res.slow.length} 个环节作答犹豫：${esc(res.slow.join('、'))}</em></span>` : '<span class="plus">时效 ±0<em>每个环节都在限时 70% 以内作答</em></span>'}
              ${res.fatal ? '<span class="minus">触发红线<em>总分封顶 40 分，等级直接判为不合格</em></span>' : res.orderHits.length ? res.orderHits.map((h) => `<span class="minus">顺序修正 −${h.penalty}<em>${esc(h.name)}：${esc(h.tip)}</em></span>`).join('') : '<span class="plus">顺序 ±0<em>关键动作的先后顺序符合要求</em></span>'}
            </div>
          </div>
        </div>
        <div class="rp-grid">
          <div class="rp-box">
            <h3>能力画像</h3>
            <canvas id="radar" class="radar"></canvas>
            <div class="legend"><span class="lg-me">本次演练</span><span class="lg-bench">${benchLabel}</span></div>
            <ul class="dimbars">${ZY.catalog.dims.map((d) => {
              const v = res.dims[d.key];
              return `<li><span>${d.name}</span><div class="bar"><i style="width:${v == null ? 0 : v}%;background:${v == null ? 'transparent' : v >= 75 ? 'var(--green)' : v >= 50 ? 'var(--amber)' : 'var(--red)'}"></i></div><b>${v == null ? '未考察' : v}</b></li>`;
            }).join('')}</ul>
          </div>
          <div class="rp-box">
            <h3 class="h-row">处置路径回放<button class="btn xs" data-replay="0">从头回看 3D 画面</button></h3>
            <ol class="path">${res.detail.map((d, i) => {
              const best = stdMap[d.nodeId];
              const diverge = best && best.id !== d.choice.id;
              return `<li class="v-${d.choice.verdict}">
                <div class="p-head"><b>${esc(d.node.title)}</b><span class="vpill" style="--c:${V[d.choice.verdict].color}">${V[d.choice.verdict].name}</span><span class="score">${d.choice.score} 分${d.elapsed != null && d.choice.id !== '__timeout' ? ` · 用时 ${d.elapsed} 秒` : ''}</span></div>
                <p>你的选择：${esc(d.choice.id === '__timeout' ? '超时未作答' : d.choice.text)}</p>
                ${diverge ? `<p class="std">标准处置：${esc(best.text)}</p>` : '<p class="std ok">与标准处置一致</p>'}
                <div class="p-acts"><button class="btn xs ghost" data-replay="${i}">回看这一步</button>${diverge ? `<button class="btn xs ghost" data-replay="${i}" data-mode="std">看标准处置</button>` : ''}</div>
              </li>`;
            }).join('')}</ol>
          </div>
        </div>
        <div class="rp-box train">
          <h3>后续补强方向</h3>
          ${res.weak.length ? `<div class="train-grid">${res.weak.map((k) => {
            const t = ZY.catalog.training[k];
            return `<div class="train-card">
              <div class="tc-head"><b>${DIM[k].name}</b><span>${res.dims[k]} 分</span></div>
              <h4>${esc(t.title)}</h4>
              <ul>${t.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
              <div class="tc-acts">
                ${others(t.recommend).map((o) => `<a class="btn sm ghost" href="#/play/${encodeURIComponent(o.id)}">练习：${esc(o.title)}</a>`).join('')}
                <button class="btn sm primary" data-focus="${k}">生成「${DIM[k].name}」复训场景</button>
              </div>
            </div>`;
          }).join('')}</div>` : '<p class="muted">各项能力表现良好，可以挑战难度更高的场景，或换一个岗位视角重新演练。</p>'}
        </div>
        <div class="rp-actions">
          <a class="btn primary" href="#/play/${encodeURIComponent(s.id)}">再练一次</a>
          <a class="btn" href="#/edit/${encodeURIComponent(s.id)}">查看剧本</a>
          <a class="btn ghost" href="#/dash">查看能力看板</a>
        </div>
        <div class="gen-inline" id="genInline" hidden></div>
      </section>`;
    const redraw = () => drawRadar($('#radar'), [
      { values: bench, color: '#a1a1aa', dash: true },
      { values: res.dims, color: '#18181b', fill: 'rgba(24,24,27,0.08)' }
    ]);
    redraw();
    window.addEventListener('resize', redraw);
    let replay = null;
    $$('[data-replay]').forEach((b) => b.addEventListener('click', () => {
      if (replay) replay();
      replay = Replay(s, res.detail, stdMap, Number(b.dataset.replay), b.dataset.mode || 'mine', () => (replay = null));
    }));
    $$('[data-focus]').forEach((b) => b.addEventListener('click', async () => {
      const k = b.dataset.focus;
      const box = $('#genInline');
      box.hidden = false;
      box.innerHTML = `<div class="gen-panel active"><h4>正在生成「${DIM[k].name}」复训场景</h4><ol class="steps">${STEPS.map((x, i) => `<li data-i="${i}"><span class="st-dot"></span><div><b>${x}</b><small></small></div></li>`).join('')}</ol><div class="gen-msg"></div></div>`;
      box.scrollIntoView({ behavior: 'smooth' });
      const setStep = (i, state, msg) => {
        const li = $(`li[data-i="${i}"]`, box);
        if (!li) return;
        li.className = state;
        if (msg != null) $('small', li).textContent = msg;
      };
      try {
        const desc = `${s.title}相关的${s.category}场景（换一个工况或变化条件），学员岗位：${s.role}。学员在上次演练中「${DIM[k].name}」得分偏低。`;
        const out = await ZY.logic.generate(desc, { role: s.role, focus: DIM[k].name, onStep: setStep });
        setStep(4, 'run', '进入剧本审核，开始拼装');
        sessionStorage.setItem('zy.just', JSON.stringify({ id: out.scenario.id, source: out.source, warnings: out.warnings, assemble: true }));
        setTimeout(() => (location.hash = '#/edit/' + encodeURIComponent(out.scenario.id)), 400);
      } catch (e) {
        $('.gen-msg', box).innerHTML = `<div class="err">${esc(e.message)}</div>`;
      }
    }));
    return () => {
      if (replay) replay();
      window.removeEventListener('resize', redraw);
    };
  }

  // 结算页的 3D 回放：恢复到某一步的现场状态，再播放"我的选择"或"标准处置"的后果
  function Replay(s, detail, stdMap, start, startMode, onClose) {
    const tpl = ZY.templates[s.scene.template];
    const root = $('#modal-root');
    root.innerHTML = `
      <div class="modal-bg"><div class="modal replay">
        <div class="rpl-head"><b id="rplTitle"></b><span class="muted" id="rplStep"></span><button class="icon-btn" id="rplClose">关闭</button></div>
        <div class="rpl-stage" id="rplStage"></div>
        <div class="rpl-info"><p class="rpl-text" id="rplText"></p><div class="rpl-choice" id="rplChoice"></div></div>
        <div class="rpl-acts">
          <div class="seg"><button class="btn sm" data-m="mine">我的选择</button><button class="btn sm" data-m="std">标准处置</button></div>
          <span class="grow"></span>
          <button class="btn sm ghost" id="rplPrev">上一步</button><button class="btn sm primary" id="rplNext">下一步</button>
        </div>
      </div></div>`;
    const st = getStage();
    st.attach($('#rplStage'));
    st.setMode('first');
    ZY.audio.stopAll();
    let k = start, m = startMode, timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const calm = (o) => Object.assign({}, quiet(o), { view: null, shake: 0, flash: null, vignette: null });
    const show = () => {
      timers.forEach(clearTimeout);
      timers = [];
      const d = detail[k], best = stdMap[d.nodeId];
      const same = !best || best.id === d.choice.id;
      if (same) m = 'mine';
      const c = m === 'std' ? best : d.choice;
      st.load(s);
      st.apply(quiet(s.scene.init));
      st.settle();
      for (let i = 0; i < k; i++) {
        st.apply(calm(detail[i].node.set));
        if (detail[i].choice.act) st.apply(calm(detail[i].choice.act));
        st.settle();
      }
      st.setView(d.node.view || tpl.defaultView, true);
      st.apply(Object.assign({}, quiet(d.node.set), { view: null, shake: 0 }));
      st.setVignette('');
      $('#rplTitle').textContent = d.node.title;
      $('#rplStep').textContent = `第 ${k + 1} / ${detail.length} 步`;
      $('#rplText').textContent = d.node.text;
      $('#rplChoice').innerHTML = `<p class="muted">${m === 'std' ? '标准处置' : '你的选择'}：${esc(c.id === '__timeout' ? '超时未作答' : c.text)}</p>`;
      $$('.seg .btn', root).forEach((b) => {
        b.classList.toggle('active', b.dataset.m === m);
        b.disabled = b.dataset.m === 'std' && same;
      });
      $('#rplPrev').disabled = k === 0;
      $('#rplNext').disabled = k === detail.length - 1;
      later(() => {
        if (c.act) st.apply(quiet(c.act));
        $('#rplChoice').innerHTML = `
          <div class="rc-head"><span class="vpill" style="--c:${V[c.verdict].color}">${V[c.verdict].name}</span><b>${esc(c.id === '__timeout' ? '超时未作答' : c.text)}</b>${same ? '<span class="tag-ok">与标准处置一致</span>' : ''}</div>
          <p>${esc(c.result)}</p>`;
      }, 1500);
    };
    const close = () => {
      timers.forEach(clearTimeout);
      st.setVignette('');
      st.detach();
      root.innerHTML = '';
      onClose && onClose();
    };
    $('#rplClose').onclick = close;
    $('.modal-bg', root).onclick = (e) => e.target.classList.contains('modal-bg') && close();
    $('#rplPrev').onclick = () => {
      k = Math.max(0, k - 1);
      m = 'mine';
      show();
    };
    $('#rplNext').onclick = () => {
      k = Math.min(detail.length - 1, k + 1);
      m = 'mine';
      show();
    };
    $$('.seg .btn', root).forEach((b) => (b.onclick = () => {
      m = b.dataset.m;
      show();
    }));
    show();
    return close;
  }

  function Dash() {
    const mine = ZY.store.records();
    const real = mine.filter((r) => !r.trial);
    const trialN = mine.length - real.length;
    const all = ZY.logic.mockRecords().concat(real);
    const n = all.length;
    const avg = Math.round(all.reduce((a, r) => a + r.score, 0) / n);
    const pass = Math.round((all.filter((r) => !r.fatal && r.score >= 60).length / n) * 100);
    const fatalRate = Math.round((all.filter((r) => r.fatal).length / n) * 100);
    const teams = {};
    all.forEach((r) => {
      const t = r.team || '本机演练';
      (teams[t] = teams[t] || []).push(r);
    });
    const byScn = {};
    all.forEach((r) => (byScn[r.scenarioId] = byScn[r.scenarioId] || []).push(r));
    const errs = {};
    all.forEach((r) => r.steps.forEach((st) => {
      const s = ZY.store.raw(r.scenarioId);
      if (!s || !s.nodes[st.node]) return;
      const c = s.nodes[st.node].choices.find((x) => x.id === st.choice);
      if (!c || (c.verdict !== 'wrong' && c.verdict !== 'fatal')) return;
      const key = r.scenarioId + '|' + st.node + '|' + c.id;
      errs[key] = errs[key] || { s, c, n: 0 };
      errs[key].n++;
    }));
    const topErr = Object.values(errs).sort((a, b) => b.n - a.n).slice(0, 7);
    const teamAvg = avgDims(all);
    const weakest = ZY.catalog.dims.filter((d) => teamAvg[d.key] != null).sort((a, b) => teamAvg[a.key] - teamAvg[b.key])[0];
    const rulings = ZY.store.rulings();
    const missing = Object.entries(ZY.store.missingAssets()).sort((a, b) => b[1].n - a[1].n);
    app.innerHTML = `
      <section class="dash">
        <div class="sec-head"><h2>安全能力看板</h2><p>以下包含 ${n - real.length} 条模拟演练数据和 ${real.length} 条本机正式演练记录，用于展示数据积累后能看到的分析。${trialN ? `另有 ${trialN} 条试练记录（未经专家审核的剧本）不计入统计。` : ''}</p></div>
        <div class="kpis">
          <div class="kpi"><span>参训人次</span><b>${n}</b></div>
          <div class="kpi"><span>平均得分</span><b>${avg}</b></div>
          <div class="kpi"><span>合格率</span><b>${pass}%</b></div>
          <div class="kpi danger"><span>红线触发率</span><b>${fatalRate}%</b></div>
          <div class="kpi"><span>最薄弱能力</span><b>${weakest ? weakest.name : '-'}</b></div>
        </div>
        <div class="dash-grid">
          <div class="rp-box"><h3>全员能力画像</h3><canvas id="radar2" class="radar"></canvas></div>
          <div class="rp-box"><h3>各班组平均得分</h3><ul class="hbars">${Object.keys(teams).map((t) => {
            const v = Math.round(teams[t].reduce((a, r) => a + r.score, 0) / teams[t].length);
            return `<li><span>${esc(t)}</span><div class="bar"><i style="width:${v}%"></i></div><b>${v}</b><em>${teams[t].length} 人次</em></li>`;
          }).join('')}</ul></div>
          <div class="rp-box"><h3>各场景合格率</h3><ul class="hbars">${Object.keys(byScn).map((id) => {
            const list = byScn[id], s = ZY.store.raw(id);
            const v = Math.round((list.filter((r) => !r.fatal && r.score >= 60).length / list.length) * 100);
            return `<li><span>${esc(s ? s.title : id)}</span><div class="bar"><i style="width:${v}%;background:${v >= 75 ? 'var(--green)' : v >= 55 ? 'var(--amber)' : 'var(--red)'}"></i></div><b>${v}%</b></li>`;
          }).join('')}</ul></div>
          <div class="rp-box"><h3>高频错误操作</h3><ol class="errs">${topErr.map((e) => `<li><span class="vpill" style="--c:${V[e.c.verdict].color}">${V[e.c.verdict].name}</span><div><b>${esc(e.c.text)}</b><small>${esc(e.s.title)}</small></div><em>${e.n} 次</em></li>`).join('')}</ol></div>
        </div>
        <div class="sec-head"><h2>知识沉淀</h2><p>每次生成和审核都会让系统更贴近企业实际：专家改过的判定会被同类场景沿用，资产库缺的设备会记下来，做一次就能被所有场景复用。</p></div>
        <div class="dash-grid">
          <div class="rp-box"><h3 class="h-row">企业判定库<span class="muted">${rulings.length} 条专家判定</span></h3>
            ${rulings.length ? `<ol class="errs rulings">${rulings.slice(0, 12).map((x) => `<li><span class="vpill" style="--c:${(V[x.verdict] || V.ok).color}">${(V[x.verdict] || V.ok).name}</span><div><b>${esc(x.text)}</b><small>${esc(x.category || '')}${x.from ? ' · 来自「' + esc(x.from) + '」' : ''} · ${fmtDate(x.at)}</small></div><em>${x.score} 分</em></li>`).join('')}</ol>`
              : '<p class="empty-tip">还没有专家改判。在剧本审核页点「专家改判」调整判定或分值，结果会沉淀到这里，同类场景再生成时自动沿用。</p>'}
          </div>
          <div class="rp-box"><h3 class="h-row">待补充资产清单<span class="muted">${missing.length} 项</span></h3>
            ${missing.length ? `<ol class="errs missing">${missing.slice(0, 12).map(([name, m]) => `<li><span class="vpill" style="--c:${m.fallback === 'similar' ? 'var(--blue)' : 'var(--amber)'}">${m.fallback === 'similar' ? '相近替代' : '占位体'}</span><div><b>${esc(name)}</b><small>${m.fallback === 'similar' && ZY.assets.defs[m.asset] ? `目前用「${esc(ZY.assets.defs[m.asset].label)}」代替` : '目前用带标签的占位体表示'}</small></div><em>${m.n} 次</em></li>`).join('')}</ol>`
              : '<p class="empty-tip">目前生成的场景都能用资产库现有资产拼出来。描述里出现资产库没有的设备时，会记录在这里，按出现次数排序，作为资产制作的优先级。</p>'}
          </div>
        </div>
      </section>`;
    const redraw = () => drawRadar($('#radar2'), [{ values: teamAvg, color: '#18181b', fill: 'rgba(24,24,27,0.08)' }]);
    redraw();
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }

  function openSettings() {
    const s = ZY.store.settings();
    const root = $('#modal-root');
    root.innerHTML = `
      <div class="modal-bg"><div class="modal">
        <h3>设置</h3>
        <div class="form">
          <label>画质<select id="sQuality"><option value="high">高（泛光后期）</option><option value="low">低（适合集成显卡）</option></select></label>
          <label>声音<select id="sSound"><option value="1">开</option><option value="0">关</option></select></label>
          <hr/>
          <p class="muted">不配置模型接口时，系统用本地规则引擎按描述生成场景；接入大模型后剧情更丰富、更贴近描述细节，调用失败会自动退回本地引擎。推荐用 <code>python server.py</code> 启动 Demo，在 <code>config.json</code> 里配置密钥，密钥不会出现在浏览器中。也可以在下面填写兼容 OpenAI 格式的接口，由浏览器直接调用（仅限演示）。</p>
          <label>接口模式<select id="sMode"><option value="auto">自动（优先本地代理）</option><option value="direct">浏览器直连</option><option value="off">关闭（仅用本地规则引擎）</option></select></label>
          <label>Base URL<input id="sBase" placeholder="例如 https://api.deepseek.com/v1" /></label>
          <label>API Key<input id="sKey" type="password" placeholder="sk-..." /></label>
          <label>模型名称<input id="sModel" placeholder="例如 deepseek-chat" /></label>
          <p class="muted" id="sStatus"></p>
        </div>
        <div class="modal-acts"><button class="btn ghost" id="sCancel">取消</button><button class="btn primary" id="sSave">保存</button></div>
      </div></div>`;
    $('#sQuality').value = s.quality;
    $('#sSound').value = s.sound ? '1' : '0';
    $('#sMode').value = s.apiMode;
    $('#sBase').value = s.baseUrl;
    $('#sKey').value = s.apiKey;
    $('#sModel').value = s.model;
    ZY.logic.status(true).then((st) => ($('#sStatus').textContent = '当前状态：' + st.label));
    const close = () => (root.innerHTML = '');
    $('#sCancel').addEventListener('click', close);
    $('.modal-bg').addEventListener('click', (e) => e.target.classList.contains('modal-bg') && close());
    $('#sSave').addEventListener('click', async () => {
      const ns = { quality: $('#sQuality').value, sound: $('#sSound').value === '1', apiMode: $('#sMode').value, baseUrl: $('#sBase').value.trim(), apiKey: $('#sKey').value.trim(), model: $('#sModel').value.trim() };
      ZY.store.saveSettings(ns);
      if (stage) stage.setQuality(ns.quality);
      ZY.audio.setMuted(!ns.sound);
      ZY.logic.resetStatus();
      const st = await refreshBadge();
      close();
      toast('设置已保存：' + st.label, 'ok');
      if (!location.hash || location.hash === '#/') route();
    });
  }

  $('#btnSettings').addEventListener('click', openSettings);
  window.addEventListener('hashchange', route);
  refreshBadge();
  route();
})();
