(function () {
  const ZY = (window.ZY = window.ZY || {});
  const T = THREE;
  const scaleUniform = { value: 600 };

  const VS = `
    attribute float size; attribute float alpha; attribute vec3 pcolor;
    uniform float uScale; uniform float uMax; varying float vA; varying vec3 vC;
    void main(){
      vA = alpha; vC = pcolor;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = min(size * uScale / max(0.2, -mv.z), uMax);
      gl_Position = projectionMatrix * mv;
    }`;
  const FS = `
    uniform sampler2D map; varying float vA; varying vec3 vC;
    void main(){
      vec4 t = texture2D(map, gl_PointCoord);
      float a = t.a * vA;
      if (a < 0.003) discard;
      gl_FragColor = vec4(vC * t.rgb, a);
    }`;

  function lerp3(a, b, t, o) {
    o[0] = a[0] + (b[0] - a[0]) * t;
    o[1] = a[1] + (b[1] - a[1]) * t;
    o[2] = a[2] + (b[2] - a[2]) * t;
  }
  const C = [0, 0, 0];
  const B = {
    spark: {
      g: -9.8, drag: 0.35, floor: 0.03,
      paint(k, out) {
        if (k < 0.35) lerp3([3.2, 2.7, 1.7], [2.4, 1.0, 0.3], k / 0.35, out);
        else lerp3([2.4, 1.0, 0.3], [0.7, 0.12, 0.02], (k - 0.35) / 0.65, out);
        return [1 - k * k, 1 - 0.55 * k];
      }
    },
    smoke: {
      g: 0.45, drag: 0.6,
      paint(k, out) {
        const v = 0.13 + 0.12 * k;
        out[0] = v; out[1] = v; out[2] = v * 1.02;
        return [0.55 * Math.sin(Math.PI * k), 1 + 3 * k];
      }
    },
    steam: {
      g: 1.3, drag: 0.8,
      paint(k, out) {
        out[0] = out[1] = out[2] = 0.55;
        return [0.3 * (1 - k) * Math.min(1, k * 6), 1 + 4 * k];
      }
    },
    fire: {
      g: 3.0, drag: 1.0,
      paint(k, out) {
        if (k < 0.4) lerp3([3.0, 2.0, 0.9], [2.2, 0.65, 0.12], k / 0.4, out);
        else lerp3([2.2, 0.65, 0.12], [0.25, 0.04, 0.0], (k - 0.4) / 0.6, out);
        return [(1 - k) * Math.min(1, k * 8), 1 - 0.45 * k];
      }
    },
    gas: {
      g: 0.02, drag: 0.15,
      paint(k, out) {
        out[0] = 0.66; out[1] = 0.72; out[2] = 0.34;
        return [0.2 * Math.sin(Math.PI * k), 1 + 5 * k];
      }
    },
    dust: {
      g: -0.25, drag: 1.4,
      paint(k, out) {
        out[0] = 0.5; out[1] = 0.46; out[2] = 0.42;
        return [0.55 * (1 - k), 1 + 3 * k];
      }
    }
  };

  class PSystem {
    constructor(max, tex, additive, behavior) {
      this.max = max;
      this.b = behavior;
      this.pos = new Float32Array(max * 3);
      this.col = new Float32Array(max * 3);
      this.alpha = new Float32Array(max);
      this.size = new Float32Array(max);
      this.vel = new Float32Array(max * 3);
      this.life = new Float32Array(max);
      this.ml = new Float32Array(max);
      this.s0 = new Float32Array(max);
      this.next = 0;
      this.wind = [0, 0, 0];
      const geo = new T.BufferGeometry();
      const mk = (arr, n) => {
        const a = new T.BufferAttribute(arr, n);
        a.setUsage(T.DynamicDrawUsage);
        return a;
      };
      geo.setAttribute('position', mk(this.pos, 3));
      geo.setAttribute('pcolor', mk(this.col, 3));
      geo.setAttribute('alpha', mk(this.alpha, 1));
      geo.setAttribute('size', mk(this.size, 1));
      this.geo = geo;
      this.mat = new T.ShaderMaterial({
        uniforms: { map: { value: tex }, uScale: scaleUniform, uMax: { value: additive ? 46 : 900 } },
        vertexShader: VS,
        fragmentShader: FS,
        transparent: true,
        depthWrite: false,
        blending: additive ? T.AdditiveBlending : T.NormalBlending
      });
      this.points = new T.Points(geo, this.mat);
      this.points.frustumCulled = false;
      this.points.renderOrder = additive ? 12 : 8;
    }
    emit(x, y, z, vx, vy, vz, life, size) {
      const i = this.next;
      this.next = (i + 1) % this.max;
      const j = i * 3;
      this.pos[j] = x; this.pos[j + 1] = y; this.pos[j + 2] = z;
      this.vel[j] = vx; this.vel[j + 1] = vy; this.vel[j + 2] = vz;
      this.life[i] = life;
      this.ml[i] = life;
      this.s0[i] = size;
    }
    update(dt) {
      const b = this.b, w = this.wind;
      const drag = Math.max(0, 1 - b.drag * dt);
      for (let i = 0; i < this.max; i++) {
        if (this.life[i] <= 0) {
          if (this.alpha[i] !== 0) { this.alpha[i] = 0; this.size[i] = 0; }
          continue;
        }
        this.life[i] -= dt;
        if (this.life[i] <= 0) { this.alpha[i] = 0; this.size[i] = 0; continue; }
        const j = i * 3;
        this.vel[j] = (this.vel[j] + w[0] * dt) * drag;
        this.vel[j + 1] = (this.vel[j + 1] + (b.g + w[1]) * dt) * drag;
        this.vel[j + 2] = (this.vel[j + 2] + w[2] * dt) * drag;
        this.pos[j] += this.vel[j] * dt;
        this.pos[j + 1] += this.vel[j + 1] * dt;
        this.pos[j + 2] += this.vel[j + 2] * dt;
        if (b.floor != null && this.pos[j + 1] < b.floor) {
          this.pos[j + 1] = b.floor;
          this.vel[j + 1] *= -0.25;
          this.vel[j] *= 0.5;
          this.vel[j + 2] *= 0.5;
        }
        const k = 1 - this.life[i] / this.ml[i];
        const r = b.paint(k, C);
        this.col[j] = C[0]; this.col[j + 1] = C[1]; this.col[j + 2] = C[2];
        this.alpha[i] = r[0];
        this.size[i] = this.s0[i] * r[1];
      }
      const a = this.geo.attributes;
      a.position.needsUpdate = a.pcolor.needsUpdate = a.alpha.needsUpdate = a.size.needsUpdate = true;
    }
    dispose() {
      this.geo.dispose();
      this.mat.dispose();
    }
  }

  const R = Math.random;
  function jitter(v, r) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r;
    return [v.x + Math.cos(a) * d, v.y, v.z + Math.sin(a) * d];
  }

  class Effect {
    constructor(stage, def) {
      this.stage = stage;
      this.def = def;
      this.I = 0;
      this.target = def.intensity == null ? 1 : def.intensity;
      this.group = new T.Group();
      stage.fxGroup.add(this.group);
      this.systems = [];
      this.acc = {};
      this.origin = new T.Vector3();
      this.dynamic = typeof def.at === 'string' && def.at.indexOf('.') > 0;
      this.refresh();
    }
    refresh() {
      this.origin.copy(this.stage.resolve(this.def.at));
      if (this.def.offset) this.origin.add(new T.Vector3().fromArray(this.def.offset));
    }
    sys(max, texName, additive, beh) {
      const s = new PSystem(max, ZY.tex.get(texName), additive, beh);
      this.group.add(s.points);
      this.systems.push(s);
      return s;
    }
    light(color, dist) {
      const l = new T.PointLight(color, 0, dist || 20, 1.6);
      this.group.add(l);
      return l;
    }
    rate(key, perSec, dt) {
      this.acc[key] = (this.acc[key] || 0) + perSec * dt;
      const n = Math.floor(this.acc[key]);
      this.acc[key] -= n;
      return Math.min(n, 400);
    }
    set(v) {
      this.target = v;
    }
    update(dt, t) {
      if (this.dynamic) this.refresh();
      this.I += (this.target - this.I) * Math.min(1, dt * 2.2);
      if (Math.abs(this.I - this.target) < 0.002) this.I = this.target;
      this.tick(dt, t);
      for (const s of this.systems) s.update(dt);
    }
    tick() {}
    dispose() {
      for (const s of this.systems) s.dispose();
      this.group.traverse((o) => {
        if (o.geometry && !o.isPoints) o.geometry.dispose();
      });
      this.group.parent && this.group.parent.remove(this.group);
    }
  }

  class MoltenSplash extends Effect {
    constructor(st, def) {
      super(st, def);
      this.sp = this.sys(2600, 'glow', true, B.spark);
      this.dr = this.sys(320, 'glow', true, B.spark);
      this.l = this.light(0xff7a30, 30);
      this.r = def.r || 1.1;
    }
    tick(dt, t) {
      const I = this.I, o = this.origin;
      const n = this.rate('s', 850 * I, dt);
      for (let i = 0; i < n; i++) {
        const p = jitter(o, this.r);
        const a = R() * Math.PI * 2, hs = (1.2 + R() * 6) * (0.5 + 0.7 * I);
        this.sp.emit(p[0], p[1], p[2], Math.cos(a) * hs, (3.5 + R() * 9) * (0.6 + 0.6 * I), Math.sin(a) * hs, 0.8 + R() * 1.4, 0.13 + R() * 0.15);
      }
      const m = this.rate('d', 60 * I, dt);
      for (let i = 0; i < m; i++) {
        const p = jitter(o, this.r * 0.8);
        const a = R() * Math.PI * 2, hs = 1 + R() * 4 * I;
        this.dr.emit(p[0], p[1], p[2], Math.cos(a) * hs, 3 + R() * 7 * I, Math.sin(a) * hs, 1.3 + R(), 0.38 + R() * 0.28);
      }
      this.l.position.set(o.x, o.y + 2.6, o.z);
      this.l.intensity = I * (1.6 + Math.sin(t * 31) * 0.35 + R() * 0.4);
    }
  }

  class MoltenStream extends Effect {
    constructor(st, def) {
      super(st, def);
      const to = st.resolve(def.to);
      const from = this.origin.clone();
      const mid = from.clone().add(to).multiplyScalar(0.5);
      mid.y += 0.9;
      const curve = new T.QuadraticBezierCurve3(from, mid, to);
      const tex = ZY.tex.get('molten').clone();
      tex.needsUpdate = true;
      tex.repeat.set(1, 4);
      this.tex = tex;
      this.mat = new T.MeshStandardMaterial({ color: 0xff8a2a, map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 2.6, roughness: 0.5 });
      this.mesh = new T.Mesh(new T.TubeGeometry(curve, 24, def.radius || 0.2, 10, false), this.mat);
      this.group.add(this.mesh);
      this.to = to;
      this.sp = this.sys(600, 'glow', true, B.spark);
      this.l = this.light(0xff8a3a, 22);
      this.l.position.copy(to).add(new T.Vector3(0, 0.8, 0));
    }
    tick(dt, t) {
      const I = this.I;
      this.mesh.visible = I > 0.05;
      this.mat.emissiveIntensity = 2.6 * I;
      this.tex.offset.y -= dt * 1.6;
      const n = this.rate('s', 90 * I, dt);
      for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, hs = 0.5 + R() * 2.2;
        this.sp.emit(this.to.x, this.to.y + 0.1, this.to.z, Math.cos(a) * hs, 1.5 + R() * 3, Math.sin(a) * hs, 0.5 + R() * 0.6, 0.07 + R() * 0.06);
      }
      this.l.intensity = I * (1.8 + Math.sin(t * 23) * 0.3);
    }
    dispose() {
      this.mat.dispose();
      this.tex.dispose();
      super.dispose();
    }
  }

  class MoltenPool extends Effect {
    constructor(st, def) {
      super(st, def);
      const tex = ZY.tex.get('molten').clone();
      tex.needsUpdate = true;
      this.mat = new T.MeshStandardMaterial({ color: 0xff7a20, map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.8, roughness: 0.6 });
      this.mesh = new T.Mesh(ZY.assets.h.irregularDisc(1, def.seed || 31), this.mat);
      this.mesh.rotation.x = -Math.PI / 2;
      this.mesh.position.set(this.origin.x, (this.origin.y > 0.5 ? this.origin.y : 0) + 0.03, this.origin.z);
      this.group.add(this.mesh);
      this.radius = 0.01;
      this.max = def.r || 3;
      this.sm = this.sys(300, 'puff', false, B.smoke);
      this.l = this.light(0xff6a20, 16);
      this.l.position.copy(this.mesh.position).add(new T.Vector3(0, 0.7, 0));
    }
    tick(dt, t) {
      const I = this.I;
      this.radius += (I * this.max - this.radius) * Math.min(1, dt * 0.35);
      const r = Math.max(0.01, this.radius);
      this.mesh.scale.set(r, r, 1);
      this.mesh.visible = r > 0.05;
      this.mat.emissiveIntensity = 0.6 + 1.4 * I;
      const n = this.rate('s', 6 * I, dt);
      const p = this.mesh.position;
      for (let i = 0; i < n; i++) {
        const q = jitter(p, r * 0.8);
        this.sm.emit(q[0], p.y + 0.1, q[2], 0, 0.6 + R() * 0.6, 0, 4 + R() * 2, 0.8 + R() * 0.8);
      }
      this.l.intensity = Math.min(1, r / 2) * (1.4 + Math.sin(t * 17) * 0.2) * (I > 0.02 ? 1 : 0.5);
    }
    dispose() {
      this.mat.dispose();
      super.dispose();
    }
  }

  class Drip extends Effect {
    constructor(st, def) {
      super(st, def);
      this.dr = this.sys(500, 'glow', true, B.spark);
      this.l = this.light(0xff6a20, 10);
    }
    tick(dt, t) {
      const I = this.I, o = this.origin;
      const n = this.rate('d', 30 * I, dt);
      for (let i = 0; i < n; i++) {
        const p = jitter(o, 0.25);
        this.dr.emit(p[0], p[1], p[2], (R() - 0.5) * 0.3, -0.5, (R() - 0.5) * 0.3, 1.6, 0.16 + R() * 0.1);
      }
      this.l.position.copy(o);
      this.l.intensity = I * (1.2 + Math.sin(t * 20) * 0.2);
    }
  }

  class Smoke extends Effect {
    constructor(st, def) {
      super(st, def);
      this.sm = this.sys(700, 'puff', false, B.smoke);
      this.r = def.r || 1.4;
      this.dark = def.dark;
    }
    tick(dt) {
      const n = this.rate('s', 22 * this.I, dt);
      for (let i = 0; i < n; i++) {
        const p = jitter(this.origin, this.r);
        this.sm.emit(p[0], p[1], p[2], (R() - 0.5) * 0.5, 0.6 + R() * 0.9, (R() - 0.5) * 0.5, 5 + R() * 3, 1.4 + R() * 1.4);
      }
    }
  }

  class Steam extends Effect {
    constructor(st, def) {
      super(st, def);
      this.sm = this.sys(600, 'puff', false, B.steam);
      this.r = def.r || 1.5;
    }
    tick(dt) {
      const n = this.rate('s', 34 * this.I, dt);
      for (let i = 0; i < n; i++) {
        const p = jitter(this.origin, this.r);
        this.sm.emit(p[0], p[1], p[2], (R() - 0.5) * 0.8, 1.6 + R() * 2.2, (R() - 0.5) * 0.8, 2 + R() * 1.5, 0.9 + R() * 1.0);
      }
    }
  }

  class Fire extends Effect {
    constructor(st, def) {
      super(st, def);
      this.fl = this.sys(700, 'glow', true, B.fire);
      this.sm = this.sys(500, 'puff', false, B.smoke);
      this.l = this.light(0xff6a1a, 18);
      this.r = def.r || 0.6;
    }
    tick(dt, t) {
      const I = this.I, o = this.origin;
      const n = this.rate('f', 110 * I, dt);
      for (let i = 0; i < n; i++) {
        const p = jitter(o, this.r * (0.6 + I * 0.6));
        this.fl.emit(p[0], p[1], p[2], (R() - 0.5) * 0.4, 0.8 + R() * 1.4 * (0.5 + I), (R() - 0.5) * 0.4, 0.5 + R() * 0.6, 0.35 + R() * 0.45 * (0.6 + I));
      }
      const m = this.rate('s', 14 * I, dt);
      for (let i = 0; i < m; i++) {
        const p = jitter(o, this.r);
        this.sm.emit(p[0], p[1] + 0.6, p[2], (R() - 0.5) * 0.4, 0.8 + R() * 0.6, (R() - 0.5) * 0.4, 4 + R() * 2, 0.9 + R() * 0.8);
      }
      this.l.position.set(o.x, o.y + 0.8, o.z);
      this.l.intensity = I * (2.2 + Math.sin(t * 19) * 0.4 + R() * 0.5);
    }
  }

  class Gas extends Effect {
    constructor(st, def) {
      super(st, def);
      this.gs = this.sys(800, 'puff', false, B.gas);
      const w = (st.tpl && st.tpl.wind) || [0, 0, 0];
      const k = def.wind == null ? 1.3 : def.wind;
      this.gs.wind = [w[0] * k * 0.35, 0, w[2] * k * 0.35];
      this.v = [w[0] * k, 0, w[2] * k];
    }
    tick(dt) {
      const n = this.rate('g', 26 * this.I, dt);
      for (let i = 0; i < n; i++) {
        const p = jitter(this.origin, 0.4);
        this.gs.emit(p[0], p[1], p[2], this.v[0] + (R() - 0.5) * 1.2, (R() - 0.3) * 0.4, this.v[2] + (R() - 0.5) * 1.2, 9 + R() * 4, 1.0 + R() * 0.8);
      }
    }
  }

  class Arc extends Effect {
    constructor(st, def) {
      super(st, def);
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(new Float32Array(14 * 3), 3));
      this.line = new T.Line(geo, new T.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.95 }));
      this.line.frustumCulled = false;
      this.group.add(this.line);
      this.sp = this.sys(300, 'glow', true, B.spark);
      this.l = this.light(0x9fc8ff, 8);
      this.cool = 0;
    }
    tick(dt) {
      const I = this.I, o = this.origin;
      this.cool -= dt;
      const on = I > 0.05 && R() < I * 0.5;
      if (this.cool <= 0) {
        this.cool = 0.05;
        const p = this.line.geometry.attributes.position;
        const end = [o.x + (R() - 0.5) * 0.8, o.y + (R() - 0.5) * 0.6, o.z + (R() - 0.5) * 0.4];
        for (let i = 0; i < 14; i++) {
          const k = i / 13;
          const jit = Math.sin(k * Math.PI) * 0.12;
          p.setXYZ(i, o.x + (end[0] - o.x) * k + (R() - 0.5) * jit, o.y + (end[1] - o.y) * k + (R() - 0.5) * jit, o.z + (end[2] - o.z) * k + (R() - 0.5) * jit);
        }
        p.needsUpdate = true;
        this.line.visible = on;
        if (on) {
          for (let i = 0; i < 12; i++) {
            const a = R() * Math.PI * 2;
            this.sp.emit(o.x, o.y, o.z, Math.cos(a) * 2, 1 + R() * 2, Math.sin(a) * 2, 0.4 + R() * 0.4, 0.05);
          }
        }
      }
      this.l.position.copy(o);
      this.l.intensity = this.line.visible ? 2.5 * I : 0;
    }
  }

  class Alarm extends Effect {
    constructor(st, def) {
      super(st, def);
      const lens = new T.MeshStandardMaterial({ color: 0x400000, emissive: 0xff2a1a, emissiveIntensity: 0.2, transparent: true, opacity: 0.9 });
      this.lens = lens;
      const b = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.26, 16), lens);
      b.position.copy(this.origin);
      this.group.add(b);
      const base = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.08, 16), ZY.assets.h.mat('steelDark'));
      base.position.copy(this.origin).add(new T.Vector3(0, -0.17, 0));
      this.group.add(base);
      this.l = this.light(0xff2a1a, def.range || 18);
      this.l.position.copy(this.origin).add(new T.Vector3(0, 0.3, 0));
    }
    tick(dt, t) {
      const pulse = Math.max(0, Math.sin(t * 7));
      this.lens.emissiveIntensity = 0.2 + this.I * 2.5 * pulse;
      this.l.intensity = this.I * 1.6 * pulse;
    }
  }

  class Glow extends Effect {
    constructor(st, def) {
      super(st, def);
      this.l = this.light(def.color || 0xff8a3a, def.range || 18);
    }
    tick(dt, t) {
      this.l.position.copy(this.origin);
      this.l.intensity = this.I * (1.6 + Math.sin(t * 13) * 0.15);
    }
  }

  const TYPES = {
    molten_splash: { cls: MoltenSplash, label: '钢水喷溅（火花与钢渣飞溅）' },
    molten_stream: { cls: MoltenStream, label: '钢水流（需要 at 起点与 to 终点）' },
    molten_pool: { cls: MoltenPool, label: '地面钢液漫流（参数 r 最大半径）' },
    drip: { cls: Drip, label: '钢水滴落（漏钢）' },
    smoke: { cls: Smoke, label: '烟雾' },
    steam: { cls: Steam, label: '蒸汽' },
    fire: { cls: Fire, label: '火焰（带烟）' },
    gas: { cls: Gas, label: '有毒气体扩散示意（随模板风向飘散）' },
    arc: { cls: Arc, label: '电弧 / 电火花' },
    alarm: { cls: Alarm, label: '声光报警灯' },
    glow: { cls: Glow, label: '高温辉光（灯光）' }
  };

  class Burst {
    constructor(stage) {
      this.sp = new PSystem(900, ZY.tex.get('glow'), true, B.spark);
      this.du = new PSystem(400, ZY.tex.get('puff'), false, B.dust);
      stage.scene.add(this.sp.points);
      stage.scene.add(this.du.points);
      this.l = new T.PointLight(0xffc080, 0, 40, 1.4);
      stage.scene.add(this.l);
      this.k = 0;
    }
    flash(p, power) {
      power = power || 1;
      for (let i = 0; i < 500 * power; i++) {
        const a = R() * Math.PI * 2, hs = 2 + R() * 9;
        this.sp.emit(p.x, p.y, p.z, Math.cos(a) * hs, 3 + R() * 10, Math.sin(a) * hs, 0.8 + R() * 1.2, 0.1 + R() * 0.12);
      }
      this.l.position.copy(p).add(new T.Vector3(0, 1, 0));
      this.k = 6 * power;
    }
    dust(p) {
      for (let i = 0; i < 120; i++) {
        const a = R() * Math.PI * 2, hs = 1 + R() * 3;
        this.du.emit(p.x, p.y + 0.2, p.z, Math.cos(a) * hs, 0.3 + R() * 0.8, Math.sin(a) * hs, 1.5 + R() * 1.5, 0.8 + R() * 0.8);
      }
    }
    update(dt) {
      this.k = Math.max(0, this.k - dt * 9);
      this.l.intensity = this.k;
      this.sp.update(dt);
      this.du.update(dt);
    }
  }

  ZY.fx = {
    scaleUniform,
    types: TYPES,
    Burst,
    create(stage, def) {
      const t = TYPES[def.type];
      if (!t) return null;
      return new t.cls(stage, def);
    },
    catalog() {
      return Object.keys(TYPES).map((k) => ({ id: k, label: TYPES[k].label }));
    }
  };
})();
