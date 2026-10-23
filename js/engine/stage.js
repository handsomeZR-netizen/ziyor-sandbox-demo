(function () {
  const ZY = (window.ZY = window.ZY || {});
  const T = THREE;
  const D2R = Math.PI / 180;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const div = (cls) => {
    const d = document.createElement('div');
    d.className = cls;
    return d;
  };

  class Stage {
    constructor() {
      const r = (this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }));
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      r.outputEncoding = T.sRGBEncoding;
      r.toneMapping = T.ACESFilmicToneMapping;
      r.toneMappingExposure = 0.95;
      r.shadowMap.enabled = true;
      r.shadowMap.type = T.PCFSoftShadowMap;
      this.el = div('stage');
      this.el.appendChild(r.domElement);
      this.overlay = div('stage-overlay');
      this.el.appendChild(this.overlay);
      this.vig = div('stage-vignette');
      this.el.appendChild(this.vig);
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(58, 1, 0.1, 600);
      const pm = new T.PMREMGenerator(r);
      this.scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;
      pm.dispose();
      this.composer = new T.EffectComposer(r);
      this.composer.addPass(new T.RenderPass(this.scene, this.camera));
      this.bloom = new T.UnrealBloomPass(new T.Vector2(512, 512), 0.7, 0.45, 0.8);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new T.ShaderPass(T.GammaCorrectionShader));
      this.quality = 'high';
      this.controls = new T.OrbitControls(this.camera, r.domElement);
      this.controls.enabled = false;
      this.controls.enableDamping = true;
      this.controls.maxPolarAngle = Math.PI * 0.495;
      this.controls.minDistance = 2;
      this.controls.maxDistance = 60;
      this.mode = 'first';
      this.look = { yaw: 0, pitch: 0, ty: 0, tp: 0, drag: false, x: 0, y: 0 };
      this.cam = {
        pos: new T.Vector3(20, 10, 20), tgt: new T.Vector3(),
        fromP: new T.Vector3(), fromT: new T.Vector3(), toP: new T.Vector3(), toT: new T.Vector3(), t: 1, dur: 1
      };
      this.shakeAmt = 0;
      this.time = 0;
      this.running = false;
      this.fxGroup = new T.Group();
      this.scene.add(this.fxGroup);
      this.burst = new ZY.fx.Burst(this);
      this.props = {};
      this.npcs = {};
      this.effects = {};
      this.hotspots = [];
      this.tags = [];
      this.clock = new T.Clock();
      this._loop = this.loop.bind(this);
      this.bindLook();
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this.el);
    }

    bindLook() {
      const el = this.renderer.domElement, L = this.look;
      el.addEventListener('pointerdown', (e) => {
        if (this.mode !== 'first') return;
        L.drag = true;
        L.x = e.clientX;
        L.y = e.clientY;
        el.setPointerCapture(e.pointerId);
        this.el.classList.add('dragging');
      });
      el.addEventListener('pointermove', (e) => {
        if (!L.drag) return;
        L.ty = clamp(L.ty - (e.clientX - L.x) * 0.0045, -0.8, 0.8);
        L.tp = clamp(L.tp - (e.clientY - L.y) * 0.0035, -0.45, 0.45);
        L.x = e.clientX;
        L.y = e.clientY;
      });
      const up = () => {
        L.drag = false;
        this.el.classList.remove('dragging');
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }

    attach(container) {
      if (this.el.parentNode !== container) container.appendChild(this.el);
      this.resize();
      this.start();
    }

    detach() {
      this.stop();
      if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
    }

    setQuality(q) {
      this.quality = q;
      this.renderer.setPixelRatio(q === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
      this.resize();
    }

    setMode(m) {
      this.mode = m;
      this.controls.enabled = m === 'orbit';
      this.el.classList.toggle('orbit', m === 'orbit');
      if (m === 'orbit') {
        this.camera.position.copy(this.cam.pos);
        this.controls.target.copy(this.cam.tgt);
        this.controls.update();
      }
      this.look.ty = this.look.tp = 0;
    }

    resize() {
      const w = this.el.clientWidth, h = this.el.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      ZY.fx.scaleUniform.value = (h * this.renderer.getPixelRatio()) / (2 * Math.tan((this.camera.fov * D2R) / 2));
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.clock.getDelta();
      requestAnimationFrame(this._loop);
    }

    stop() {
      this.running = false;
    }

    clear() {
      for (const id in this.effects) this.effects[id].dispose();
      this.effects = {};
      if (this.world) {
        this.world.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material && !Array.isArray(o.material) && !o.material.userData.shared && o.material.dispose) o.material.dispose();
        });
        this.scene.remove(this.world);
      }
      this.world = null;
      this.props = {};
      this.npcs = {};
      this.setHotspots([]);
      this.tags.forEach((t) => t.el.remove());
      this.tags = [];
      this.setVignette('');
      this.shakeAmt = 0;
      this.asm = null;
    }

    // 逐个"拼装"场景中的设备和人员，用于展示 3D 沙盒是按描述现场搭出来的
    assemble(onStep, onDone) {
      const items = [];
      for (const id in this.props) {
        const g = this.props[id];
        if (g.visible) items.push({ g, label: g.userData.label || id, kind: 'prop' });
      }
      for (const id in this.npcs) {
        const n = this.npcs[id];
        if (n.g.visible) items.push({ g: n.g, label: n.label || '现场人员', kind: 'npc' });
      }
      const fx = Object.values(this.effects);
      const saved = fx.map((e) => e.target);
      fx.forEach((e) => {
        e.target = 0;
        e.I = 0;
      });
      items.forEach((it) => {
        it.s = it.g.scale.clone();
        it.g.scale.setScalar(0.001);
      });
      this.asm = { items, t: 0, gap: Math.min(0.34, 3 / Math.max(1, items.length)), onStep, onDone, fx, saved };
      return { props: items.filter((it) => it.kind === 'prop').length, npcs: items.filter((it) => it.kind === 'npc').length, effects: fx.length };
    }

    tickAssemble(dt) {
      const a = this.asm;
      a.t += dt;
      const c1 = 1.70158, c3 = c1 + 1;
      a.items.forEach((it, i) => {
        const k = clamp((a.t - i * a.gap) / 0.45, 0, 1);
        if (k > 0 && !it.started) {
          it.started = true;
          a.onStep && a.onStep(it.label, i + 1, a.items.length);
        }
        const e = Math.max(0.001, k >= 1 ? 1 : 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2));
        it.g.scale.set(it.s.x * e, it.s.y * e, it.s.z * e);
      });
      if (a.t > a.items.length * a.gap + 0.5) {
        a.items.forEach((it) => it.g.scale.copy(it.s));
        a.fx.forEach((e, i) => e.set(a.saved[i]));
        this.asm = null;
        a.onDone && a.onDone();
      }
    }

    load(scn) {
      this.clear();
      const sc = scn.scene || {};
      const tpl = ZY.templates[sc.template] || ZY.templates.bof;
      this.tpl = tpl;
      this.usedFree = 0;
      this.world = new T.Group();
      this.scene.add(this.world);
      const env = new T.Group();
      this.world.add(env);
      const ctx = { group: env, hall: tpl.hall, wind: tpl.wind, lights: { power: [], main: [], emergency: [] }, emissive: { power: [] } };
      tpl.build(ctx);
      this.ctx = ctx;
      ctx.lights.power.forEach((l) => (l.userData.base = l.intensity));
      this.scene.background = new T.Color(tpl.bg);
      this.scene.fog = tpl.fog ? new T.FogExp2(tpl.fog[0], tpl.fog[1]) : null;
      for (const p of sc.props || []) {
        const s = this.slotOf(p.slot, p.pos);
        ctx.slotPos = s.pos;
        const g = ZY.assets.build(p.asset, p, ctx);
        g.position.copy(s.pos);
        g.rotation.y = (p.rot == null ? s.rot : p.rot) * D2R;
        g.userData.id = p.id;
        if (p.label) g.userData.label = p.label;
        g.userData.queue = [];
        if (p.hidden) g.visible = false;
        this.world.add(g);
        this.props[p.id] = g;
      }
      this.world.updateMatrixWorld(true);
      for (const n of sc.npcs || []) {
        const npc = new ZY.assets.Npc(n);
        const s = this.slotOf(n.slot, n.pos);
        npc.g.position.copy(s.pos);
        if (n.face) {
          const f = this.resolve(n.face);
          npc.g.rotation.y = Math.atan2(f.x - s.pos.x, f.z - s.pos.z);
        } else npc.g.rotation.y = (n.rot == null ? s.rot : n.rot) * D2R;
        if (n.hidden) npc.g.visible = false;
        npc.id = n.id;
        this.world.add(npc.g);
        this.npcs[n.id] = npc;
      }
      for (const e of sc.effects || []) {
        const fx = ZY.fx.create(this, e);
        if (fx) this.effects[e.id] = fx;
      }
      this.setPower(true);
      this.buildTags();
      this.setView(sc.view || tpl.defaultView, true);
    }

    slotOf(name, pos) {
      if (Array.isArray(pos)) return { pos: new T.Vector3(pos[0], pos[1] || 0, pos[2]), rot: 0 };
      const tpl = this.tpl;
      let s = tpl.slots[name];
      if (!s) {
        const free = Object.keys(tpl.slots).filter((k) => k.indexOf('free') === 0);
        s = free.length ? tpl.slots[free[this.usedFree++ % free.length]] : [0, 0, 0];
      }
      return { pos: new T.Vector3(s[0], s[1], s[2]), rot: s[3] || 0 };
    }

    resolve(ref) {
      const v = new T.Vector3();
      if (!ref) return v.set(0, 1, 0);
      if (Array.isArray(ref)) return v.fromArray(ref);
      if (typeof ref === 'object') return this.resolve(ref.near || ref.at);
      let pid = ref, an = null;
      const i = ref.indexOf('.');
      if (i > 0) {
        pid = ref.slice(0, i);
        an = ref.slice(i + 1);
      }
      const p = this.props[pid];
      if (p) {
        const a = p.userData.anchors && p.userData.anchors[an || 'top'];
        if (a) return a.getWorldPosition(v);
        return v.copy(p.position).add(new T.Vector3(0, 1, 0));
      }
      const n = this.npcs[pid];
      if (n) return v.copy(n.g.position).add(new T.Vector3(0, an === 'feet' ? 0.1 : 1.2, 0));
      const s = this.tpl && this.tpl.slots[ref];
      if (s) return v.set(s[0], s[1], s[2]);
      return v.set(0, 1, 0);
    }

    viewSpec(v) {
      if (!v) v = this.tpl.defaultView;
      if (typeof v === 'string') {
        const s = this.tpl.views[v] || this.tpl.views[this.tpl.defaultView];
        return { p: new T.Vector3().fromArray(s.p), t: new T.Vector3().fromArray(s.t) };
      }
      if (v.near) {
        const c = this.resolve(v.near);
        const off = v.off || [2, 0, 2];
        return { p: c.clone().add(new T.Vector3().fromArray(off)), t: c };
      }
      return { p: new T.Vector3().fromArray(v.p), t: new T.Vector3().fromArray(v.t) };
    }

    setView(v, instant, dur) {
      const s = this.viewSpec(v), c = this.cam;
      if (instant) {
        c.pos.copy(s.p);
        c.tgt.copy(s.t);
        c.t = 1;
      } else {
        c.fromP.copy(c.pos);
        c.fromT.copy(c.tgt);
        c.toP.copy(s.p);
        c.toT.copy(s.t);
        c.t = 0;
        c.dur = dur || clamp(c.pos.distanceTo(s.p) / 7, 1.1, 3.0);
      }
      if (this.mode === 'orbit') {
        this.camera.position.copy(c.pos);
        this.controls.target.copy(c.tgt);
      }
      this.look.ty = this.look.tp = 0;
    }

    apply(st) {
      if (!st) return;
      if (st.view) this.setView(st.view);
      if (st.fx) for (const id in st.fx) if (this.effects[id]) this.effects[id].set(st.fx[id]);
      if (st.npc) {
        for (const id in st.npc) {
          const n = this.npcs[id];
          if (!n) continue;
          let a = st.npc[id];
          if (typeof a === 'string') a = { anim: a };
          if (a.show) n.g.visible = true;
          if (a.hide) n.g.visible = false;
          if (a.at) {
            n.g.position.copy(this.slotOf(a.at).pos);
            n.target = null;
          }
          if (a.face) {
            const f = this.resolve(a.face);
            n.g.rotation.y = Math.atan2(f.x - n.g.position.x, f.z - n.g.position.z);
          }
          if (a.to) {
            const tp = this.tpl.slots[a.to] ? this.slotOf(a.to).pos : this.resolve(a.to);
            n.moveTo(tp, a.speed, a.anim, a.then);
          } else if (a.anim) n.stop(a.anim);
        }
      }
      if (st.prop) {
        for (const id in st.prop) {
          const g = this.props[id];
          if (!g) continue;
          const acts = [].concat(st.prop[id]).map((a) => (typeof a === 'string' ? { type: a } : a));
          for (const a of acts) this.queueAction(g, a);
        }
      }
      if (st.power != null) this.setPower(st.power);
      if (st.flash) this.burst.flash(this.resolve(st.flash === true ? null : st.flash), st.flashPower || 1);
      if (st.shake) this.shakeAmt = Math.max(this.shakeAmt, st.shake);
      if (st.vignette != null) this.setVignette(st.vignette);
      if (st.audio && ZY.audio) ZY.audio.apply(st.audio);
    }

    // 立即完成所有进行中的人员走位、设备动作和特效渐变，用于回放时快速恢复到某一步的现场状态
    settle() {
      this.silent = true;
      for (const id in this.npcs) {
        const n = this.npcs[id];
        if (n.target) {
          n.g.position.copy(n.target);
          n.target = null;
          n.anim = n.then;
        }
      }
      for (const id in this.props) {
        const g = this.props[id], ud = g.userData;
        for (let i = 0; i < 800 && (ud.current || (ud.queue && ud.queue.length)); i++) {
          if (!ud.current) ud.current = this.makeStep(g, ud.queue.shift());
          if (ud.current(0.1)) ud.current = null;
        }
      }
      for (const id in this.effects) this.effects[id].I = this.effects[id].target;
      this.shakeAmt = 0;
      this.silent = false;
    }

    queueAction(g, a) {
      const ud = g.userData;
      switch (a.type) {
        case 'stop':
          ud.queue = [];
          ud.current = null;
          return;
        case 'show':
          g.visible = true;
          return;
        case 'hide':
          g.visible = false;
          return;
        case 'lock':
          if (ud.tag) ud.tag.visible = true;
          if (ud.lever) ud.lever.rotation.z = 0.9;
          return;
        case 'unlock':
          if (ud.tag) ud.tag.visible = false;
          return;
        case 'swing':
          ud.swing = { amp: a.amp || 0.06, t: 0, part: ud.anchors[a.part || 'load'] };
          return;
      }
      ud.queue.push(a);
    }

    makeStep(g, a) {
      const ud = g.userData, self = this;
      if (a.type === 'move') {
        const to = this.slotOf(a.to, a.pos).pos;
        const sp = a.speed || 2;
        return (dt) => {
          const d = to.clone().sub(g.position);
          d.y = 0;
          const dist = d.length();
          if (dist <= sp * dt) {
            g.position.x = to.x;
            g.position.z = to.z;
            ud.onMove && ud.onMove();
            return true;
          }
          g.position.addScaledVector(d.normalize(), sp * dt);
          ud.onMove && ud.onMove();
          return false;
        };
      }
      if (a.type === 'lower') {
        const part = ud.anchors[a.part || 'hook'];
        if (!part) return () => true;
        const target = part.position.y - (a.by || 3);
        return (dt) => {
          part.position.y = Math.max(target, part.position.y - (a.speed || 0.8) * dt);
          ud.update && ud.update(self.time);
          return part.position.y <= target + 1e-4;
        };
      }
      if (a.type === 'drop') {
        const part = ud.anchors[a.part || 'load'];
        const bottom = ud.anchors.load_bottom;
        if (!part || !bottom) return () => true;
        const dist = Math.max(0, bottom.getWorldPosition(new T.Vector3()).y - (a.floor == null ? 0.05 : a.floor));
        let v = 0, fallen = 0;
        return (dt) => {
          v += 9.8 * dt;
          let dy = v * dt;
          if (fallen + dy >= dist) {
            dy = dist - fallen;
            part.position.y -= dy;
            part.rotation.z += 0.12;
            const p = bottom.getWorldPosition(new T.Vector3());
            if (!self.silent) {
              self.burst.dust(p);
              self.shakeAmt = Math.max(self.shakeAmt, 1);
              ZY.audio && ZY.audio.sfx('impact');
            }
            return true;
          }
          fallen += dy;
          part.position.y -= dy;
          part.rotation.z += dt * 0.2;
          return false;
        };
      }
      if (a.type === 'tilt') {
        const part = ud.anchors[a.part || 'load'] || g;
        const target = (a.deg || 8) * D2R, axis = a.axis || 'x';
        return (dt) => {
          part.rotation[axis] += (target - part.rotation[axis]) * Math.min(1, dt * 1.5);
          return Math.abs(part.rotation[axis] - target) < 0.002;
        };
      }
      if (a.type === 'wait') {
        let t = 0;
        return (dt) => (t += dt) >= (a.dur || 1);
      }
      return () => true;
    }

    setPower(on) {
      const c = this.ctx;
      if (!c) return;
      c.lights.power.forEach((l) => (l.intensity = on ? l.userData.base : 0));
      c.emissive.power.forEach((m) => (m.emissiveIntensity = on ? 1.4 : 0));
      c.lights.emergency.forEach((l) => (l.intensity = on ? 0 : 0.7));
      this.powerOn = on;
    }

    setVignette(type) {
      this.vig.className = 'stage-vignette' + (type ? ' ' + type : '');
    }

    setHotspots(list) {
      this.hotspots.forEach((h) => h.el.remove());
      this.hotspots = (list || []).map((h) => {
        const el = document.createElement('button');
        el.className = 'hotspot' + (h.cls ? ' ' + h.cls : '');
        el.innerHTML = `<span class="hs-dot"></span><span class="hs-label">${h.label}</span>`;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          h.onClick && h.onClick();
        });
        this.overlay.appendChild(el);
        return { ref: h.ref, el };
      });
    }

    buildTags() {
      this.tags.forEach((t) => t.el.remove());
      this.tags = [];
      for (const id in this.npcs) {
        const n = this.npcs[id];
        if (!n.label) continue;
        const el = div('npc-tag');
        el.textContent = n.label;
        this.overlay.appendChild(el);
        this.tags.push({ npc: n, el });
      }
    }

    project(v) {
      const p = v.clone().project(this.camera);
      const w = this.el.clientWidth, h = this.el.clientHeight;
      return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h, ok: p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05 };
    }

    updateOverlay() {
      for (const h of this.hotspots) {
        const s = this.project(this.resolve(h.ref).add(new T.Vector3(0, 0.25, 0)));
        h.el.style.display = s.ok ? '' : 'none';
        h.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
      }
      for (const t of this.tags) {
        const n = t.npc;
        const lying = n.anim === 'fallen' || n.anim === 'crawl';
        const pos = n.g.position.clone().add(new T.Vector3(0, lying ? 0.7 : 2.25, 0));
        const s = this.project(pos);
        const vis = s.ok && n.g.visible && pos.distanceTo(this.camera.position) < 45;
        t.el.style.display = vis ? '' : 'none';
        t.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
      }
    }

    loop() {
      if (!this.running) return;
      requestAnimationFrame(this._loop);
      const dt = Math.min(0.05, this.clock.getDelta());
      this.time += dt;
      const t = this.time, c = this.cam, cam = this.camera;
      if (c.t < 1) {
        c.t = Math.min(1, c.t + dt / c.dur);
        const k = ease(c.t);
        c.pos.lerpVectors(c.fromP, c.toP, k);
        c.tgt.lerpVectors(c.fromT, c.toT, k);
      }
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.1);
      const sh = this.shakeAmt * this.shakeAmt * 0.12;
      if (this.mode === 'first') {
        const L = this.look;
        L.yaw += (L.ty - L.yaw) * Math.min(1, dt * 8);
        L.pitch += (L.tp - L.pitch) * Math.min(1, dt * 8);
        const dir = c.tgt.clone().sub(c.pos).normalize();
        const yaw = Math.atan2(dir.x, dir.z) + L.yaw;
        const pitch = clamp(Math.asin(clamp(dir.y, -1, 1)) + L.pitch, -1.3, 1.3);
        cam.position.copy(c.pos);
        cam.position.y += Math.sin(t * 0.9) * 0.012;
        cam.position.x += (Math.random() - 0.5) * sh;
        cam.position.y += (Math.random() - 0.5) * sh;
        cam.lookAt(cam.position.x + Math.sin(yaw) * Math.cos(pitch), cam.position.y + Math.sin(pitch), cam.position.z + Math.cos(yaw) * Math.cos(pitch));
      } else {
        if (c.t < 1) {
          cam.position.copy(c.pos);
          this.controls.target.copy(c.tgt);
        }
        this.controls.update();
      }
      for (const id in this.props) {
        const g = this.props[id], ud = g.userData;
        if (ud.update) ud.update(t);
        if (!ud.current && ud.queue && ud.queue.length) ud.current = this.makeStep(g, ud.queue.shift());
        if (ud.current && ud.current(dt)) ud.current = null;
        if (ud.swing && ud.swing.part) {
          ud.swing.t += dt;
          ud.swing.part.rotation.x = ud.swing.amp * Math.sin(ud.swing.t * 1.7);
        }
      }
      for (const id in this.npcs) this.npcs[id].update(dt);
      if (this.asm) this.tickAssemble(dt);
      for (const id in this.effects) this.effects[id].update(dt, t);
      this.burst.update(dt);
      this.updateOverlay();
      if (this.quality === 'high') this.composer.render(dt);
      else this.renderer.render(this.scene, cam);
    }

    snapshot(w, h) {
      if (this.quality === 'high') this.composer.render(0);
      else this.renderer.render(this.scene, this.camera);
      const src = this.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = w || 480;
      c.height = h || 270;
      const ctx = c.getContext('2d');
      const sr = src.width / src.height, dr = c.width / c.height;
      let sw = src.width, shh = src.height, sx = 0, sy = 0;
      if (sr > dr) {
        sw = src.height * dr;
        sx = (src.width - sw) / 2;
      } else {
        shh = src.width / dr;
        sy = (src.height - shh) / 2;
      }
      ctx.drawImage(src, sx, sy, sw, shh, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.72);
    }
  }

  ZY.Stage = Stage;
})();
