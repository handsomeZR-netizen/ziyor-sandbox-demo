(function () {
  const ZY = (window.ZY = window.ZY || {});
  const T = THREE;
  const D2R = Math.PI / 180;

  function std(o) {
    const env = o.envMapIntensity;
    delete o.envMapIntensity;
    const m = new T.MeshStandardMaterial(o);
    m.envMapIntensity = env == null ? 0.22 : env;
    return m;
  }

  const MAT = {
    steel: () => std({ color: 0x6a7077, metalness: 0.75, roughness: 0.42 }),
    steelDark: () => std({ color: 0x34383d, metalness: 0.6, roughness: 0.6 }),
    steelDarkDS: () => std({ color: 0x34383d, metalness: 0.6, roughness: 0.6, side: T.DoubleSide }),
    steelGalv: () => std({ color: 0x9aa1a8, metalness: 0.7, roughness: 0.38 }),
    shell: () => std({ color: 0x3b3734, metalness: 0.55, roughness: 0.72, side: T.DoubleSide }),
    ladleShell: () => std({ color: 0x2f2b29, metalness: 0.5, roughness: 0.75 }),
    refractory: () => std({ color: 0x8a5a48, roughness: 0.92, map: ZY.tex.get('brick', [4, 1]) }),
    concrete: () => std({ color: 0x8d8b86, roughness: 0.95, map: ZY.tex.get('concrete') }),
    paintBlue: () => std({ color: 0x3f5d78, metalness: 0.35, roughness: 0.55 }),
    paintGray: () => std({ color: 0x7b8288, metalness: 0.35, roughness: 0.55 }),
    paintYellow: () => std({ color: 0xe0a619, metalness: 0.25, roughness: 0.5 }),
    paintYellowDark: () => std({ color: 0xb7860f, metalness: 0.3, roughness: 0.55 }),
    paintRed: () => std({ color: 0xb8271d, metalness: 0.25, roughness: 0.45 }),
    paintGreen: () => std({ color: 0x2f8a4c, roughness: 0.5 }),
    paintOrange: () => std({ color: 0xe8661c, roughness: 0.5 }),
    white: () => std({ color: 0xe8e8e4, roughness: 0.5 }),
    cabinetGray: () => std({ color: 0x8c9196, metalness: 0.4, roughness: 0.5 }),
    cabinetLight: () => std({ color: 0xc8ccc6, metalness: 0.25, roughness: 0.45 }),
    glass: () => std({ color: 0x9cc3e0, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }),
    water: () => std({ color: 0x1d2a33, metalness: 0.2, roughness: 0.04, transparent: true, opacity: 0.85, envMapIntensity: 1.2 }),
    wet: () => std({ color: 0x111111, roughness: 0.3, transparent: true, opacity: 0.35, depthWrite: false }),
    rubber: () => std({ color: 0x151515, roughness: 0.9 }),
    rubberMat: () => std({ color: 0x1c1c1c, roughness: 0.95 }),
    cable: () => std({ color: 0x222222, metalness: 0.6, roughness: 0.4 }),
    rope: () => std({ color: 0xd8c27a, roughness: 0.8 }),
    pitBlack: () => std({ color: 0x050505, roughness: 1 }),
    molten: () =>
      std({ color: 0xff8a2a, emissive: 0xffffff, emissiveMap: ZY.tex.get('molten'), map: ZY.tex.get('molten'), emissiveIntensity: 2.2, roughness: 0.6 }),
    hazard: () => std({ map: ZY.tex.get('hazard', [4, 1]), roughness: 0.6 }),
    checker: () => std({ color: 0x8a8f94, map: ZY.tex.get('checker', [3, 3]), metalness: 0.6, roughness: 0.5 }),
    copper: () => std({ color: 0x8a5634, metalness: 0.85, roughness: 0.35 }),
    coil: () => std({ color: 0x9aa0a7, metalness: 0.85, roughness: 0.3 }),
    coilDark: () => std({ color: 0x4a4644, metalness: 0.7, roughness: 0.55 }),
    coilEnd: () => std({ map: ZY.tex.get('coilEnd'), metalness: 0.8, roughness: 0.35 }),
    wearBlue: () => std({ color: 0x2b4c7e, roughness: 0.85 }),
    wearOrange: () => std({ color: 0xd6621e, roughness: 0.85 }),
    wearGray: () => std({ color: 0x5d6266, roughness: 0.85 }),
    wearNavy: () => std({ color: 0x1d2633, roughness: 0.85 }),
    pants: () => std({ color: 0x23324a, roughness: 0.85 }),
    reflect: () => std({ color: 0xdadada, emissive: 0x777777, roughness: 0.4 }),
    skin: () => std({ color: 0xc79a7c, roughness: 0.7 }),
    glove: () => std({ color: 0x6b5a3a, roughness: 0.9 }),
    boot: () => std({ color: 0x1b1b1b, roughness: 0.7 }),
    helmetYellow: () => std({ color: 0xf2c12e, roughness: 0.35 }),
    helmetWhite: () => std({ color: 0xf0f0ec, roughness: 0.35 }),
    helmetRed: () => std({ color: 0xd23a2c, roughness: 0.35 }),
    lampWarm: () => std({ color: 0x222222, emissive: 0xffe2b0, emissiveIntensity: 1.6 }),
    lampCool: () => std({ color: 0x222222, emissive: 0xe6f0ff, emissiveIntensity: 1.4 }),
    lightGreen: () => std({ color: 0x0a2a10, emissive: 0x37ff6a, emissiveIntensity: 1.6 }),
    lightRed: () => std({ color: 0x2a0a0a, emissive: 0xff3b30, emissiveIntensity: 1.6 }),
    lightAmber: () => std({ color: 0x2a1a0a, emissive: 0xffb020, emissiveIntensity: 1.4 }),
    screen: () => std({ color: 0x0a0f18, emissive: 0x3a7bd5, emissiveIntensity: 0.9 }),
    placeholder: () => std({ color: 0xff7a1a, transparent: true, opacity: 0.45, roughness: 0.6 }),
    ductGray: () => std({ color: 0xb0b4b8, metalness: 0.3, roughness: 0.7 }),
    doorGreen: () => std({ color: 0x2c5a44, metalness: 0.3, roughness: 0.6 }),
    doorGray: () => std({ color: 0x6c7378, metalness: 0.4, roughness: 0.55 }),
    cargo: () => std({ color: 0xc9ccd1, metalness: 0.3, roughness: 0.6 }),
    wood: () => std({ color: 0x8a6a44, roughness: 0.85 })
  };
  const mats = {};
  function mat(k) {
    if (typeof k !== 'string') return k;
    if (!mats[k]) {
      mats[k] = (MAT[k] || MAT.steel)();
      mats[k].userData.shared = true;
    }
    return mats[k];
  }

  const hotMats = [];
  function hot(level) {
    const i = Math.max(0, Math.min(5, level | 0));
    if (!hotMats[i]) {
      const cols = [0xffc060, 0xffa040, 0xff8030, 0xff6420, 0xff4a14, 0xe0380c];
      const ints = [2.4, 1.9, 1.5, 1.15, 0.85, 0.6];
      hotMats[i] = std({ color: 0x2a0c04, emissive: cols[i], emissiveIntensity: ints[i], roughness: 0.7 });
      hotMats[i].userData.shared = true;
    }
    return hotMats[i];
  }

  function mesh(geo, k, o) {
    const me = new T.Mesh(geo, mat(k));
    me.castShadow = !(o && o.noShadow);
    me.receiveShadow = true;
    return me;
  }
  function add(p, me, x, y, z) {
    me.position.set(x || 0, y || 0, z || 0);
    p.add(me);
    return me;
  }
  function box(p, w, h, d, k, x, y, z, o) {
    return add(p, mesh(new T.BoxGeometry(w, h, d), k, o), x, y, z);
  }
  function cyl(p, rt, rb, h, k, x, y, z, o) {
    o = o || {};
    const me = mesh(new T.CylinderGeometry(rt, rb, h, o.seg || 24, 1, !!o.open), k, o);
    if (o.rx) me.rotation.x = o.rx;
    if (o.rz) me.rotation.z = o.rz;
    return add(p, me, x, y, z);
  }
  function between(p, a, b, r, k, o) {
    const A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]);
    const me = mesh(new T.CylinderGeometry(r, r, A.distanceTo(B), (o && o.seg) || 10), k, o);
    me.position.copy(A).add(B).multiplyScalar(0.5);
    me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    p.add(me);
    return me;
  }
  function signMesh(p, text, opts, w, h, x, y, z, ry) {
    const t = ZY.tex.sign(text, opts);
    const mm = new T.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: (opts && opts.glow) || 0.35, roughness: 0.6 });
    const me = new T.Mesh(new T.PlaneGeometry(w, h), mm);
    me.position.set(x, y, z);
    if (ry) me.rotation.y = ry;
    p.add(me);
    return me;
  }
  function group(label) {
    const g = new T.Group();
    g.userData.anchors = {};
    g.userData.label = label;
    return g;
  }
  function anchor(g, name, x, y, z, parent) {
    const o = new T.Object3D();
    o.position.set(x, y, z);
    (parent || g).add(o);
    g.userData.anchors[name] = o;
    return o;
  }
  function irregularDisc(r, seed) {
    const geo = new T.CircleGeometry(1, 48);
    const pos = geo.attributes.position;
    const rnd = ZY.tex.rng(seed || 5);
    const k1 = rnd() * 6, k2 = rnd() * 6;
    for (let i = 1; i < pos.count; i++) {
      const a = Math.atan2(pos.getY(i), pos.getX(i));
      const s = r * (0.78 + 0.16 * Math.sin(a * 3 + k1) + 0.1 * Math.sin(a * 7 + k2));
      pos.setXY(i, Math.cos(a) * s, Math.sin(a) * s);
    }
    pos.needsUpdate = true;
    return geo;
  }

  function ladleBody(L, full) {
    const pts = [[0, 0], [1.65, 0], [1.76, 0.16], [2.0, 3.42], [2.08, 3.6], [1.9, 3.6], [1.82, 3.42]].map((a) => new T.Vector2(a[0], a[1]));
    const s = mesh(new T.LatheGeometry(pts, 40), 'ladleShell');
    s.material = mat('shell');
    L.add(s);
    const rim = mesh(new T.TorusGeometry(1.98, 0.12, 8, 40), 'refractory');
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 3.56;
    L.add(rim);
    for (const y of [1.1, 2.3]) {
      const b = mesh(new T.TorusGeometry(1.84 + y * 0.065, 0.07, 6, 40), 'steelDark');
      b.rotation.x = Math.PI / 2;
      b.position.y = y;
      L.add(b);
    }
    for (const s2 of [-1, 1]) cyl(L, 0.26, 0.26, 0.7, 'steel', s2 * 2.25, 2.9, 0, { rz: Math.PI / 2 });
    box(L, 0.5, 0.35, 0.5, 'steelDark', 0.6, -0.12, 0);
    if (full) {
      const m = mesh(new T.CircleGeometry(1.86, 36), 'molten', { noShadow: true });
      m.rotation.x = -Math.PI / 2;
      m.position.y = 3.4;
      L.add(m);
    }
  }

  function coilMesh(R, W, dark) {
    const c = new T.Group();
    const outer = mesh(new T.CylinderGeometry(R, R, W, 40, 1, true), dark ? 'coilDark' : 'coil');
    outer.rotation.z = Math.PI / 2;
    c.add(outer);
    for (const s of [-1, 1]) {
      const e = mesh(new T.RingGeometry(0.3, R, 40), 'coilEnd');
      e.position.x = (s * W) / 2;
      e.rotation.y = (s * Math.PI) / 2;
      c.add(e);
      const band = mesh(new T.TorusGeometry(R + 0.01, 0.02, 4, 40), 'steelDark', { noShadow: true });
      band.rotation.y = Math.PI / 2;
      band.position.x = s * 0.4;
      c.add(band);
    }
    const inner = mesh(new T.CylinderGeometry(0.3, 0.3, W, 20, 1, true), 'steelDarkDS');
    inner.rotation.z = Math.PI / 2;
    c.add(inner);
    return c;
  }

  function railLine(p, ax, az, bx, bz, h, k) {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / 1.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      box(p, 0.05, 1.1, 0.05, k, ax + (bx - ax) * t, h + 0.55, az + (bz - az) * t, { noShadow: true });
    }
    for (const y of [1.1, 0.55]) {
      const r = box(p, len, 0.05, 0.05, k, (ax + bx) / 2, h + y, (az + bz) / 2, { noShadow: true });
      r.rotation.y = -Math.atan2(bz - az, bx - ax);
    }
  }

  const clampSize = (v) => Math.max(0.6, Math.min(6, Number(v) || 1.4));

  const defs = {
    converter: {
      label: '转炉',
      desc: '炼钢转炉。参数 tilt：倾动角度 0~90，出钢时约 80',
      build(p) {
        const g = group(p.label || '转炉');
        const tilt = (p.tilt == null ? 0 : p.tilt) * D2R;
        for (const s of [-1, 1]) {
          box(g, 2.4, 8.5, 2.6, 'concrete', 0, 4.25, s * 4.6);
          box(g, 1.6, 1.2, 1.6, 'steelDark', 0, 8.6, s * 4.1);
        }
        const v = new T.Group();
        v.position.set(0, 8.5, 0);
        v.rotation.z = -tilt;
        g.add(v);
        const pts = [[0, -3.4], [1.6, -3.35], [2.6, -3.0], [3.1, -2.2], [3.25, -1], [3.25, 1.0], [3.0, 1.8], [2.3, 2.8], [1.75, 3.4], [1.6, 3.6]].map((a) => new T.Vector2(a[0], a[1]));
        v.add(mesh(new T.LatheGeometry(pts, 40), 'shell'));
        const ring = mesh(new T.TorusGeometry(3.6, 0.32, 12, 48), 'steelDark');
        ring.rotation.x = Math.PI / 2;
        v.add(ring);
        const band = mesh(new T.TorusGeometry(3.15, 0.1, 6, 48), 'steelDark');
        band.rotation.x = Math.PI / 2;
        band.position.y = -1.9;
        v.add(band);
        const rim = mesh(new T.TorusGeometry(1.62, 0.2, 8, 32), 'refractory');
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 3.6;
        v.add(rim);
        for (const s of [-1, 1]) cyl(v, 0.45, 0.45, 0.9, 'steel', 0, 0, s * 3.95, { rx: Math.PI / 2 });
        if (p.glow !== false && tilt > 0.3) {
          const d = mesh(new T.CircleGeometry(1.45, 32), 'molten', { noShadow: true });
          d.rotation.x = -Math.PI / 2;
          d.position.y = 3.1;
          v.add(d);
        }
        const tap = cyl(v, 0.25, 0.3, 0.9, 'refractory', 2.6, 2.45, 0, { rz: -1.15 });
        tap.castShadow = false;
        anchor(g, 'tap', 2.85, 2.6, 0, v);
        anchor(g, 'mouth', 0, 3.7, 0, v);
        box(g, 5.6, 4, 5.6, 'steelDark', 0.4, 14.6, 0);
        const duct = box(g, 3.2, 9, 3.2, 'steelDark', -2.6, 19.2, 0);
        duct.rotation.z = 0.45;
        anchor(g, 'top', 0, 12.5, 0);
        return g;
      }
    },

    ladle: {
      label: '钢包',
      desc: '钢包（盛钢桶），默认在钢包车上并盛满钢水。参数 car、full',
      build(p) {
        const g = group(p.label || '钢包');
        const carH = p.car === false ? 0 : 1.0;
        if (carH) {
          box(g, 4.4, 0.7, 3.4, 'paintYellowDark', 0, 0.65, 0);
          for (const sx of [-1.6, 1.6]) for (const sz of [-1.1, 1.1]) cyl(g, 0.32, 0.32, 0.25, 'steelDark', sx, 0.32, sz, { rx: Math.PI / 2 });
        }
        const L = new T.Group();
        L.position.y = carH;
        g.add(L);
        ladleBody(L, p.full !== false);
        anchor(g, 'top', 0, carH + 3.55, 0);
        anchor(g, 'bottom', 0, carH + 0.05, 0);
        return g;
      }
    },

    crane: {
      label: '桥式起重机（天车）',
      desc: '横跨车间的天车。参数 load：ladle/coil/空；hookY：吊钩高度',
      build(p, ctx) {
        const g = group(p.label || '天车');
        const H = ctx.hall.h - 3.2, d = ctx.hall.d;
        const z0 = ctx.slotPos ? ctx.slotPos.z : 0;
        const bridge = new T.Group();
        bridge.position.z = -z0;
        g.add(bridge);
        for (const sx of [-1.7, 1.7]) box(bridge, 0.9, 1.7, d - 1.4, 'paintYellow', sx, H, 0);
        for (const s of [-1, 1]) box(bridge, 5.4, 1.0, 1.5, 'paintYellowDark', 0, H - 0.15, s * (d / 2 - 1.0));
        box(bridge, 0.05, 0.9, d - 1.6, 'paintYellow', -2.35, H + 1.3, 0, { noShadow: true });
        box(bridge, 1.9, 2.0, 1.9, 'paintYellowDark', -2.3, H - 2.0, d / 2 - 4);
        box(bridge, 1.6, 1.1, 0.05, 'glass', -2.3, H - 1.8, d / 2 - 4.98, { noShadow: true });
        signMesh(bridge, p.tonnage || '32t', { bg: '#e0a619', fg: '#111', w: 256, h: 128, size: 64, center: true }, 1.6, 0.8, 2.16, H, 0, Math.PI / 2);
        const trolley = new T.Group();
        trolley.position.y = H + 1.0;
        g.add(trolley);
        box(trolley, 4.2, 1.1, 3.0, 'paintYellowDark', 0, 0, 0);
        cyl(trolley, 0.55, 0.55, 2.6, 'steelDark', 0, 0.75, 0, { rx: Math.PI / 2 });
        const hook = new T.Group();
        hook.position.y = p.hookY == null ? H - 6 : p.hookY;
        g.add(hook);
        g.userData.anchors.hook = hook;
        box(hook, 1.0, 1.0, 0.55, 'paintRed', 0, 0.5, 0);
        const hk = mesh(new T.TorusGeometry(0.28, 0.08, 8, 18, Math.PI * 1.4), 'steel');
        hk.position.set(0, -0.15, 0);
        hk.rotation.z = Math.PI * 0.8;
        hook.add(hk);
        const cables = [];
        for (const sx of [-0.32, 0.32])
          for (const sz of [-0.18, 0.18]) {
            const c = mesh(new T.CylinderGeometry(0.028, 0.028, 1, 6), 'cable', { noShadow: true });
            c.position.set(sx, 0, sz);
            g.add(c);
            cables.push(c);
          }
        const topY = H + 0.45;
        g.userData.update = () => {
          const hy = hook.position.y + 1.0;
          const len = Math.max(0.1, topY - hy);
          for (const c of cables) {
            c.scale.y = len;
            c.position.y = hy + len / 2;
          }
        };
        g.userData.update();
        if (p.load === 'ladle') {
          const load = new T.Group();
          hook.add(load);
          g.userData.anchors.load = load;
          box(load, 3.6, 0.45, 0.6, 'paintRed', 0, -0.55, 0);
          for (const s of [-1, 1]) box(load, 0.26, 2.3, 0.5, 'paintRed', s * 2.32, -1.75, 0);
          const L = new T.Group();
          L.position.y = -5.65;
          load.add(L);
          ladleBody(L, true);
          anchor(g, 'load_bottom', 0, 0.05, 0, L);
          anchor(g, 'load_top', 0, 3.6, 0, L);
        } else if (p.load === 'coil') {
          const load = new T.Group();
          hook.add(load);
          g.userData.anchors.load = load;
          box(load, 0.3, 3.2, 0.35, 'paintYellowDark', -1.35, -1.6, 0);
          box(load, 1.7, 0.3, 0.35, 'paintYellowDark', -0.6, -0.1, 0);
          box(load, 2.3, 0.22, 0.3, 'paintYellowDark', -0.25, -3.0, 0);
          const c = coilMesh(1.0, 1.5, !!p.dark);
          c.position.set(0.05, -3.0, 0);
          load.add(c);
          anchor(g, 'load_bottom', 0.05, -4.0, 0, load);
          anchor(g, 'load_top', 0.05, -2.0, 0, load);
        }
        anchor(g, 'top', 0, H + 1.5, 0);
        g.userData.onMove = () => {
          bridge.position.z = -g.position.z;
        };
        return g;
      }
    },

    breaker_box: {
      label: '总电闸',
      desc: '电源开关柜。参数 label、pillar（是否带立柱）',
      build(p) {
        const g = group(p.label || '总电闸');
        box(g, 1.2, 0.3, 0.8, 'concrete', 0, 0.15, 0);
        box(g, 0.95, 1.9, 0.5, 'cabinetGray', 0, 1.25, 0);
        box(g, 0.02, 1.7, 0.02, 'steelDark', 0, 1.25, 0.26, { noShadow: true });
        box(g, 0.08, 0.35, 0.08, 'paintRed', 0.3, 1.35, 0.28);
        box(g, 0.1, 0.55, 0.1, 'paintRed', 0.54, 1.5, 0.05);
        signMesh(g, p.label || '总电闸', { bg: '#f3c316', fg: '#111', icon: 'bolt' }, 0.72, 0.28, 0, 1.92, 0.256);
        if (p.pillar) box(g, 0.8, 10, 0.8, 'paintBlue', 0, 5, -0.7);
        anchor(g, 'top', 0, 2.4, 0.3);
        return g;
      }
    },

    control_room: {
      label: '主控室',
      desc: '高架操作室，正面为玻璃窗',
      build(p) {
        const g = group(p.label || '主控室');
        for (const sx of [-2.4, 2.4]) for (const sz of [-1.9, 1.9]) box(g, 0.3, 4, 0.3, 'paintBlue', sx, 2, sz);
        box(g, 5.2, 0.3, 4.2, 'steelDark', 0, 4.15, 0);
        box(g, 5.2, 2.6, 0.12, 'paintGray', 0, 5.6, -2.05);
        for (const s of [-1, 1]) box(g, 0.12, 2.6, 4.2, 'paintGray', s * 2.6, 5.6, 0);
        box(g, 5.4, 0.25, 4.4, 'steelDark', 0, 7.0, 0);
        box(g, 5.2, 0.9, 0.12, 'paintGray', 0, 4.75, 2.05);
        box(g, 5.0, 1.6, 0.05, 'glass', 0, 6.0, 2.06, { noShadow: true });
        box(g, 1.4, 0.05, 0.4, 'lampCool', 0, 6.84, 0, { noShadow: true });
        box(g, 3.2, 0.8, 0.8, 'steelDark', 0, 4.7, 1.3);
        for (const x of [-1, 0, 1]) box(g, 0.7, 0.45, 0.04, 'screen', x, 5.4, 1.1, { noShadow: true });
        for (let i = 0; i < 12; i++) box(g, 1.0, 0.08, 0.3, 'steelDark', 3.2, 0.34 * i + 0.1, 1.6 - i * 0.28);
        signMesh(g, p.label || '主控室', { bg: '#1f3b57', w: 512, h: 160, center: true }, 1.8, 0.56, 0, 7.4, 2.21);
        anchor(g, 'top', 0, 7.6, 2.2);
        return g;
      }
    },

    exit_door: {
      label: '安全出口',
      desc: '墙上的安全出口门与绿色指示牌',
      build(p) {
        const g = group(p.label || '安全出口');
        for (const s of [-1, 1]) {
          box(g, 0.2, 3.6, 0.3, 'steelDark', s * 1.7, 1.8, 0);
          box(g, 1.5, 3.3, 0.08, 'doorGreen', s * 0.78, 1.65, 0.05);
          box(g, 0.06, 0.4, 0.06, 'steelGalv', s * 0.2, 1.2, 0.12, { noShadow: true });
        }
        box(g, 3.6, 0.25, 0.3, 'steelDark', 0, 3.5, 0);
        signMesh(g, p.text || '安全出口', { bg: '#169b45', icon: 'run', arrow: p.arrow || 'right', glow: 1.1 }, 1.6, 0.62, 0, 4.15, 0.16);
        anchor(g, 'top', 0, 4.4, 0.3);
        return g;
      }
    },

    assembly_point: {
      label: '紧急集合点',
      desc: '室外或安全区的应急集合点标识',
      build(p) {
        const g = group(p.label || '紧急集合点');
        cyl(g, 0.06, 0.06, 2.6, 'steelGalv', 0, 1.3, 0);
        signMesh(g, p.text || '紧急集合点', { bg: '#169b45', w: 400, h: 400, size: 64, center: true, glow: 0.6 }, 1.1, 1.1, 0, 2.3, 0.07);
        const fl = new T.Mesh(new T.PlaneGeometry(3, 3), new T.MeshStandardMaterial({ color: 0x1f7a3d, roughness: 0.8, transparent: true, opacity: 0.55 }));
        fl.rotation.x = -Math.PI / 2;
        fl.position.set(0, 0.012, 1.6);
        g.add(fl);
        anchor(g, 'top', 0, 3.0, 0);
        return g;
      }
    },

    fire_extinguisher: {
      label: '灭火器',
      desc: '一对手提式灭火器。参数 type：powder 干粉 / co2 二氧化碳',
      build(p) {
        const co2 = p.type === 'co2';
        const g = group(p.label || (co2 ? '二氧化碳灭火器' : '干粉灭火器'));
        box(g, 0.62, 0.14, 0.3, 'paintRed', 0, 0.07, 0);
        for (const s of [-1, 1]) {
          cyl(g, 0.11, 0.11, 0.52, 'paintRed', s * 0.15, 0.4, 0);
          cyl(g, 0.045, 0.045, 0.1, 'steelDark', s * 0.15, 0.71, 0);
          if (co2) cyl(g, 0.02, 0.07, 0.22, 'rubber', s * 0.15 + 0.1, 0.6, 0.06, { rz: 0.6 });
        }
        signMesh(g, co2 ? '二氧化碳' : '干粉', { bg: '#b8271d', w: 300, h: 140, size: 52, center: true }, 0.5, 0.23, 0, 0.98, 0);
        anchor(g, 'top', 0, 1.15, 0);
        return g;
      }
    },

    hydrant: {
      label: '室内消火栓',
      desc: '墙面消火栓箱（内有水带）',
      build(p) {
        const g = group(p.label || '室内消火栓');
        box(g, 0.75, 0.95, 0.22, 'paintRed', 0, 0, 0);
        box(g, 0.55, 0.6, 0.02, 'glass', 0, 0.05, 0.12, { noShadow: true });
        const reel = mesh(new T.TorusGeometry(0.18, 0.05, 8, 20), 'white');
        reel.position.set(0, 0.05, 0.05);
        g.add(reel);
        signMesh(g, '消火栓', { bg: '#b8271d', w: 300, h: 120, size: 56, center: true }, 0.5, 0.2, 0, 0.62, 0.115);
        anchor(g, 'top', 0, 0.8, 0.12);
        return g;
      }
    },

    puddle: {
      label: '地面积水',
      desc: '地面积水。参数 r：半径',
      build(p) {
        const g = group(p.label || '地面积水');
        const r = p.r || 2;
        const w = new T.Mesh(irregularDisc(r, 9), mat('water'));
        w.rotation.x = -Math.PI / 2;
        w.position.y = 0.018;
        w.receiveShadow = true;
        g.add(w);
        const wet = new T.Mesh(irregularDisc(r * 1.35, 19), mat('wet'));
        wet.rotation.x = -Math.PI / 2;
        wet.position.y = 0.01;
        g.add(wet);
        anchor(g, 'top', 0, 0.15, 0);
        return g;
      }
    },

    emergency_pit: {
      label: '事故坑',
      desc: '钢包事故坑（地坑），用于紧急倾翻或放置漏包',
      build(p) {
        const g = group(p.label || '事故坑');
        box(g, 5, 0.02, 4, 'pitBlack', 0, 0.011, 0, { noShadow: true });
        const hz = mat('hazard');
        for (const s of [-1, 1]) {
          box(g, 5.4, 0.2, 0.2, hz, 0, 0.1, s * 2.1);
          box(g, 0.2, 0.2, 4.2, hz, s * 2.6, 0.1, 0);
        }
        cyl(g, 0.05, 0.05, 1.8, 'steelGalv', 3.2, 0.9, 2.3);
        signMesh(g, '事故坑', { bg: '#f3c316', fg: '#111', icon: 'warn', w: 512, h: 200 }, 1.0, 0.4, 3.2, 1.8, 2.36);
        anchor(g, 'top', 0, 0.3, 0);
        return g;
      }
    },

    tundish: {
      label: '中间包',
      desc: '连铸中间包，放在浇注平台上',
      build(p) {
        const g = group(p.label || '中间包');
        for (const sx of [-2.2, 2.2]) for (const sz of [-0.6, 0.6]) box(g, 0.3, 0.7, 0.3, 'steelDark', sx, 0.35, sz);
        box(g, 5.0, 1.1, 1.5, 'ladleShell', 0, 1.25, 0);
        const m = mesh(new T.PlaneGeometry(4.6, 1.1), 'molten', { noShadow: true });
        m.rotation.x = -Math.PI / 2;
        m.position.y = 1.79;
        g.add(m);
        box(g, 1.6, 0.12, 1.6, 'steelDark', -1.6, 1.86, 0);
        box(g, 1.2, 0.12, 1.6, 'steelDark', 1.8, 1.86, 0);
        cyl(g, 0.1, 0.1, 1.2, 'refractory', 0, 0.3, 0);
        anchor(g, 'top', 0, 1.9, 0);
        return g;
      }
    },

    ladle_turret: {
      label: '钢包回转台',
      desc: '连铸钢包回转台，一侧托着满包钢水',
      build(p) {
        const g = group(p.label || '钢包回转台');
        cyl(g, 1.6, 1.8, 0.6, 'paintBlue', 0, 0.3, 0);
        cyl(g, 1.1, 1.1, 5, 'paintBlue', 0, 2.8, 0);
        box(g, 1.0, 0.8, 10, 'paintBlue', 0, 5.2, 0);
        for (const zz of [4.6, -4.6]) for (const s of [-1, 1]) box(g, 0.5, 0.6, 2.6, 'paintBlue', s * 2.35, 5.3, zz);
        for (const zz of [4.6, -4.6]) box(g, 5.2, 0.5, 0.8, 'paintBlue', 0, 5.2, zz);
        const L = new T.Group();
        L.position.set(0, 2.7, 4.6);
        g.add(L);
        ladleBody(L, true);
        cyl(g, 0.13, 0.13, 1.5, 'refractory', 0.6, 2.0, 4.6);
        anchor(g, 'ladle_bottom', 0, 2.7, 4.6);
        anchor(g, 'top', 0, 6.5, 4.6);
        return g;
      }
    },

    caster_strand: {
      label: '连铸机（结晶器与铸流）',
      desc: '放在浇注平台的结晶器，铸坯向下弯曲延伸到地面辊道',
      build(p) {
        const g = group(p.label || '连铸机');
        box(g, 1.9, 0.9, 1.1, 'copper', 0, -0.45, 0);
        const top = mesh(new T.PlaneGeometry(1.5, 0.25), 'molten', { noShadow: true });
        top.rotation.x = -Math.PI / 2;
        top.position.y = 0.01;
        g.add(top);
        const R = p.radius || 5.3, N = 24;
        for (let i = 0; i < N; i++) {
          const a0 = (i / N) * (Math.PI / 2), a1 = ((i + 1) / N) * (Math.PI / 2), am = (a0 + a1) / 2;
          const len = R * (a1 - a0) + 0.02;
          const seg = new T.Mesh(new T.BoxGeometry(1.5, len, 0.25), hot((i / N) * 5));
          seg.position.set(0, -0.9 - R * Math.sin(am), R * (1 - Math.cos(am)));
          seg.rotation.x = -am;
          g.add(seg);
          if (i % 2 === 0) {
            for (const s of [-1, 1]) {
              const f = box(g, 0.14, len * 2.1, 0.9, 'steelDark', s * 1.05, seg.position.y, seg.position.z);
              f.rotation.x = -am;
            }
          }
        }
        const run = new T.Mesh(new T.BoxGeometry(1.5, 0.25, 12), hot(5));
        run.position.set(0, -0.9 - R, R + 6);
        g.add(run);
        for (let z = R; z < R + 12; z += 0.9) cyl(g, 0.22, 0.22, 2.2, 'steel', 0, -0.9 - R - 0.36, z, { rz: Math.PI / 2, seg: 12 });
        for (const s of [-1, 1]) box(g, 0.3, 0.5, 12.5, 'steelDark', s * 1.2, -0.9 - R - 0.5, R + 6);
        anchor(g, 'mold', 0, 0.2, 0);
        anchor(g, 'mold_low', 0, -1.2, 0.1);
        anchor(g, 'zone2', 0, -0.9 - R * 0.7, R * 0.29);
        anchor(g, 'runout', 0, -0.9 - R, R + 3);
        anchor(g, 'top', 0, 0.6, 0);
        return g;
      }
    },

    estop: {
      label: '急停按钮',
      desc: '黄色立柱急停按钮',
      build(p) {
        const g = group(p.label || '急停按钮');
        box(g, 0.24, 1.1, 0.24, 'paintYellow', 0, 0.55, 0);
        cyl(g, 0.1, 0.1, 0.09, 'lightRed', 0, 1.15, 0);
        signMesh(g, '急停', { bg: '#c8302a', w: 256, h: 128, size: 64, center: true }, 0.22, 0.11, 0, 0.9, 0.125);
        anchor(g, 'top', 0, 1.3, 0);
        return g;
      }
    },

    gas_valve: {
      label: '煤气阀门组',
      desc: '从主管引下的煤气阀门组（带手轮）',
      build(p) {
        const g = group(p.label || '煤气阀门组');
        box(g, 2.4, 0.1, 2.4, 'checker', 0, 0.05, -0.6);
        cyl(g, 0.42, 0.42, 5.7, 'paintGray', 0, 3.9, -0.6);
        cyl(g, 0.42, 0.42, 3.4, 'paintGray', 0, 6.75, -2.3, { rx: Math.PI / 2 });
        box(g, 1.0, 1.1, 1.0, 'paintGray', 0, 1.35, -0.6);
        for (const y of [0.75, 1.95]) cyl(g, 0.62, 0.62, 0.1, 'steelDark', 0, y, -0.6);
        cyl(g, 0.05, 0.05, 1.1, 'steel', 0, 2.45, -0.6);
        const wheel = mesh(new T.TorusGeometry(0.45, 0.04, 8, 24), 'paintRed');
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(0, 2.95, -0.6);
        g.add(wheel);
        cyl(g, 0.04, 0.04, 1.5, 'steelGalv', 1.4, 0.75, 0.3);
        signMesh(g, '当心煤气中毒', { bg: '#f3c316', fg: '#111', icon: 'warn' }, 1.0, 0.4, 1.4, 1.6, 0.34);
        anchor(g, 'leak', 0.55, 1.95, -0.1);
        anchor(g, 'top', 0, 3.3, -0.6);
        return g;
      }
    },

    gas_detector: {
      label: '固定式煤气报警仪',
      desc: '立杆式一氧化碳报警仪',
      build(p) {
        const g = group(p.label || '煤气报警仪');
        cyl(g, 0.05, 0.05, 1.8, 'steelGalv', 0, 0.9, 0);
        box(g, 0.26, 0.36, 0.13, 'cabinetGray', 0, 1.6, 0.07);
        const l = new T.Mesh(new T.SphereGeometry(0.06, 12, 8), mat('lightRed'));
        l.position.set(0, 1.86, 0.07);
        g.add(l);
        anchor(g, 'light', 0, 1.9, 0.1);
        anchor(g, 'top', 0, 2.05, 0.1);
        return g;
      }
    },

    windsock: {
      label: '风向标',
      desc: '风向袋，指示风向（袋口朝来风方向）',
      build(p, ctx) {
        const g = group(p.label || '风向标');
        cyl(g, 0.05, 0.06, 6, 'steelGalv', 0, 3, 0);
        const sock = new T.Group();
        sock.position.y = 5.8;
        g.add(sock);
        const segs = [[0.38, 0.32], [0.32, 0.26], [0.26, 0.2], [0.2, 0.15]];
        segs.forEach((r, i) => {
          const c = mesh(new T.CylinderGeometry(r[1], r[0], 0.55, 16, 1, true), i % 2 ? 'white' : 'paintOrange');
          c.material = c.material.clone();
          c.material.side = T.DoubleSide;
          c.rotation.z = -Math.PI / 2;
          c.position.x = 0.3 + i * 0.55;
          sock.add(c);
        });
        const w = (ctx && ctx.wind) || [-1, 0, 0];
        const base = Math.atan2(-w[2], w[0]);
        sock.rotation.y = base;
        g.userData.update = (t) => {
          sock.rotation.y = base + Math.sin(t * 1.7) * 0.08;
          sock.rotation.z = -0.08 + Math.sin(t * 2.3) * 0.04;
        };
        anchor(g, 'top', 0, 6.3, 0);
        return g;
      }
    },

    scba_cabinet: {
      label: '空气呼吸器柜',
      desc: '应急柜，内有正压式空气呼吸器',
      build(p) {
        const g = group(p.label || '空气呼吸器柜');
        box(g, 0.95, 1.6, 0.5, 'paintRed', 0, 0.8, 0);
        box(g, 0.8, 1.0, 0.02, 'glass', 0, 0.95, 0.26, { noShadow: true });
        for (const s of [-1, 1]) cyl(g, 0.1, 0.1, 0.6, 'paintYellow', s * 0.2, 0.9, 0.08);
        signMesh(g, '正压式空气呼吸器', { bg: '#b8271d', w: 512, h: 140, size: 50, center: true }, 0.9, 0.25, 0, 1.75, 0.2);
        anchor(g, 'top', 0, 2.0, 0.2);
        return g;
      }
    },

    manhole: {
      label: '阀门井（有限空间）',
      desc: '地下阀门井，井口有三脚架、安全绳和警示牌',
      build(p) {
        const g = group(p.label || '阀门井');
        const ring = mesh(new T.CylinderGeometry(0.56, 0.56, 0.35, 28, 1, true), 'concrete');
        ring.material = ring.material.clone();
        ring.material.side = T.DoubleSide;
        ring.position.y = 0.175;
        g.add(ring);
        const hole = new T.Mesh(new T.CircleGeometry(0.54, 28), mat('pitBlack'));
        hole.rotation.x = -Math.PI / 2;
        hole.position.y = 0.03;
        g.add(hole);
        cyl(g, 0.56, 0.56, 0.05, 'steelDark', 1.1, 0.03, 0.5);
        const top = [0, 2.6, 0];
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + 0.4;
          between(g, top, [Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2], 0.035, 'paintYellow');
        }
        box(g, 0.25, 0.25, 0.2, 'paintRed', 0.42, 1.1, 0.15);
        between(g, [0, 2.6, 0], [0, -0.3, 0], 0.012, 'rope', { noShadow: true });
        cyl(g, 0.04, 0.04, 1.4, 'steelGalv', -1.4, 0.7, 0.7);
        signMesh(g, '有限空间', { bg: '#f3c316', fg: '#111', icon: 'warn', sub: '未经许可 禁止入内' }, 1.0, 0.4, -1.4, 1.5, 0.75);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const c = mesh(new T.ConeGeometry(0.15, 0.5, 12), 'paintOrange');
          c.position.set(Math.cos(a) * 2.0, 0.25, Math.sin(a) * 2.0);
          g.add(c);
        }
        anchor(g, 'hole', 0, 0.3, 0);
        anchor(g, 'deep', 0, -0.8, 0);
        anchor(g, 'top', 0, 2.9, 0);
        return g;
      }
    },

    blower: {
      label: '通风机',
      desc: '移动式通风机，风管通向井口。参数 to：风管终点相对坐标',
      build(p) {
        const g = group(p.label || '通风机');
        box(g, 0.7, 0.3, 0.6, 'steelDark', 0, 0.15, 0);
        cyl(g, 0.35, 0.35, 0.45, 'paintYellow', 0, 0.62, 0, { rz: Math.PI / 2 });
        const to = p.to || [-1.4, 0.3, 1.8];
        between(g, [0.3, 0.62, 0], to, 0.13, 'ductGray');
        anchor(g, 'top', 0, 1.1, 0);
        return g;
      }
    },

    truck: {
      label: '运输车辆',
      desc: '厂内运输货车，车头朝 +x',
      build(p) {
        const g = group(p.label || '运输车辆');
        box(g, 7.4, 0.4, 2.0, 'steelDark', 0, 0.7, 0);
        box(g, 2.2, 2.2, 2.4, 'paintBlue', 3.2, 1.9, 0);
        box(g, 0.05, 0.9, 2.1, 'glass', 4.31, 2.4, 0, { noShadow: true });
        box(g, 5.0, 2.4, 2.4, 'cargo', -0.7, 2.1, 0);
        for (const x of [2.9, -1.2, -2.7]) for (const s of [-1, 1]) cyl(g, 0.5, 0.5, 0.3, 'rubber', x, 0.5, s * 1.1, { rx: Math.PI / 2 });
        for (const s of [-1, 1]) box(g, 0.05, 0.18, 0.3, 'lampWarm', 4.32, 1.2, s * 0.85, { noShadow: true });
        anchor(g, 'top', 0, 3.6, 0);
        return g;
      }
    },

    building: {
      label: '厂房',
      desc: '远处背景建筑。参数 w、h、d',
      build(p) {
        const g = group(p.label || '厂房');
        const w = p.w || 20, h = p.h || 12, d = p.d || 14;
        const m = new T.MeshStandardMaterial({ map: ZY.tex.get('windows', [w / 8, h / 8]), roughness: 0.8 });
        const b = new T.Mesh(new T.BoxGeometry(w, h, d), m);
        b.position.y = h / 2;
        b.receiveShadow = true;
        g.add(b);
        anchor(g, 'top', 0, h, 0);
        return g;
      }
    },

    coil_stack: {
      label: '钢卷垛',
      desc: '一排放在鞍座上的钢卷。参数 n：数量',
      build(p) {
        const g = group(p.label || '钢卷垛');
        const n = p.n || 8;
        for (let i = 0; i < n; i++) {
          const x = (i - (n - 1) / 2) * 2.2;
          box(g, 1.6, 0.35, 1.9, 'concrete', x, 0.175, 0);
          const c = coilMesh(1.0, 1.5, i % 3 === 1);
          c.rotation.y = Math.PI / 2;
          c.position.set(x, 1.2, 0);
          g.add(c);
        }
        anchor(g, 'top', 0, 2.4, 0);
        return g;
      }
    },

    saddle: {
      label: '空鞍座',
      desc: '放置钢卷的空鞍座',
      build(p) {
        const g = group(p.label || '空鞍座');
        box(g, 1.9, 0.35, 1.6, 'concrete', 0, 0.175, 0);
        for (const s of [-1, 1]) {
          const w = box(g, 1.9, 0.12, 0.6, 'rubber', 0, 0.42, s * 0.42);
          w.rotation.x = s * 0.5;
        }
        anchor(g, 'top', 0, 0.6, 0);
        return g;
      }
    },

    isolator: {
      label: '天车电源隔离开关',
      desc: '墙面电源隔离开关，可挂牌上锁（动作 lock）',
      build(p) {
        const g = group(p.label || '天车电源隔离开关');
        box(g, 0.6, 0.8, 0.25, 'cabinetGray', 0, 1.5, 0);
        const lever = box(g, 0.06, 0.4, 0.06, 'paintRed', 0.36, 1.6, 0.05);
        signMesh(g, '天车电源', { bg: '#1f3b57', w: 300, h: 120, size: 56, center: true }, 0.5, 0.2, 0, 2.05, 0.13);
        const tag = new T.Group();
        box(tag, 0.08, 0.08, 0.06, 'paintRed', 0.36, 1.35, 0.1);
        signMesh(tag, '禁止合闸', { bg: '#c8302a', sub: '有人工作', w: 400, h: 220, size: 60 }, 0.36, 0.2, 0.36, 1.12, 0.14);
        tag.visible = !!p.locked;
        g.add(tag);
        g.userData.tag = tag;
        g.userData.lever = lever;
        anchor(g, 'top', 0, 2.3, 0.15);
        return g;
      }
    },

    ladder: {
      label: '天车爬梯',
      desc: '通往天车的固定爬梯',
      build(p) {
        const g = group(p.label || '爬梯');
        const h = p.h || 14;
        for (const s of [-1, 1]) box(g, 0.06, h, 0.06, 'paintYellow', s * 0.25, h / 2, 0);
        for (let y = 0.3; y < h; y += 0.3) box(g, 0.5, 0.03, 0.03, 'paintYellow', 0, y, 0, { noShadow: true });
        anchor(g, 'top', 0, 2.2, 0.1);
        return g;
      }
    },

    switchgear: {
      label: '低压开关柜',
      desc: '一排开关柜。参数 n、prefix、start',
      build(p) {
        const g = group(p.label || '开关柜');
        const n = p.n || 10, w = 0.8;
        for (let i = 0; i < n; i++) {
          const x = (i - (n - 1) / 2) * w;
          box(g, w - 0.02, 2.2, 0.8, 'cabinetLight', x, 1.1, 0);
          box(g, 0.01, 2.0, 0.01, 'steelDark', x, 1.1, 0.405, { noShadow: true });
          signMesh(g, '#' + ((p.start || 1) + i), { bg: '#e8e8e4', fg: '#222', w: 200, h: 100, size: 56, center: true, border: '#888' }, 0.24, 0.12, x, 1.95, 0.41);
          const lights = ['lightGreen', 'lightRed', 'lightAmber'];
          lights.forEach((k, j) => {
            const s = new T.Mesh(new T.SphereGeometry(0.022, 8, 6), mat(k));
            s.position.set(x - 0.12 + j * 0.12, 1.65, 0.41);
            g.add(s);
          });
          const meter = new T.Mesh(new T.CircleGeometry(0.07, 20), mat('white'));
          meter.position.set(x, 1.38, 0.41);
          g.add(meter);
          anchor(g, 'cab' + ((p.start || 1) + i), x, 0.3, 0.45);
        }
        box(g, n * w, 0.12, 0.5, 'steelGalv', 0, 2.75, 0);
        anchor(g, 'top', 0, 2.4, 0.4);
        return g;
      }
    },

    alarm_button: {
      label: '火灾报警按钮',
      desc: '墙面手动火灾报警按钮',
      build(p) {
        const g = group(p.label || '火灾报警按钮');
        box(g, 0.14, 0.14, 0.06, 'paintRed', 0, 0, 0);
        box(g, 0.08, 0.08, 0.02, 'white', 0, 0, 0.035, { noShadow: true });
        signMesh(g, '火警', { bg: '#b8271d', w: 200, h: 100, size: 60, center: true }, 0.16, 0.08, 0, 0.14, 0.03);
        anchor(g, 'top', 0, 0.22, 0.05);
        return g;
      }
    },

    barrier: {
      label: '警戒线',
      desc: '一排锥桶和警戒带（可用 show 动作拉起）。参数 w：长度',
      build(p) {
        const g = group(p.label || '警戒线');
        const w = p.w || 4, n = Math.max(2, Math.round(w / 1.2) + 1);
        for (let i = 0; i < n; i++) {
          const x = -w / 2 + (i / (n - 1)) * w;
          const c = mesh(new T.ConeGeometry(0.16, 0.7, 12), 'paintOrange');
          c.position.set(x, 0.35, 0);
          g.add(c);
          box(g, 0.34, 0.04, 0.34, 'rubber', x, 0.02, 0);
        }
        const tape = mesh(new T.BoxGeometry(w, 0.08, 0.01), 'hazard', { noShadow: true });
        tape.material = tape.material.clone();
        tape.material.color = new T.Color(0xff5a4a);
        tape.position.y = 0.62;
        g.add(tape);
        anchor(g, 'top', 0, 1.0, 0);
        return g;
      }
    },

    first_aid: {
      label: '急救箱',
      desc: '急救箱',
      build(p) {
        const g = group(p.label || '急救箱');
        box(g, 0.5, 0.35, 0.25, 'paintGreen', 0, 0.175, 0);
        signMesh(g, '', { bg: '#2f8a4c', icon: 'cross', w: 200, h: 200 }, 0.24, 0.24, 0, 0.19, 0.126);
        anchor(g, 'top', 0, 0.5, 0);
        return g;
      }
    },

    tool_cart: {
      label: '工具车',
      desc: '检修工具车',
      build(p) {
        const g = group(p.label || '工具车');
        box(g, 0.9, 0.7, 0.5, 'paintRed', 0, 0.55, 0);
        for (const s of [-1, 1]) for (const t of [-1, 1]) cyl(g, 0.08, 0.08, 0.05, 'rubber', s * 0.35, 0.08, t * 0.2, { rx: Math.PI / 2 });
        anchor(g, 'top', 0, 1.0, 0);
        return g;
      }
    },

    pallet_stack: {
      label: '耐材垛',
      desc: '堆放的耐火材料或物料',
      build(p) {
        const g = group(p.label || '物料堆');
        const r = ZY.tex.rng(p.seed || 3);
        for (let i = 0; i < (p.n || 4); i++) {
          box(g, 1.2, 0.15, 1.0, 'wood', i * 1.4, 0.075, 0);
          box(g, 1.1, 0.6 + r() * 0.5, 0.9, 'refractory', i * 1.4, 0.5, 0);
        }
        anchor(g, 'top', 0, 1.3, 0);
        return g;
      }
    },

    placeholder: {
      label: '待补充设备',
      desc: '资产库中没有的设备，用带标签的占位体表示。参数 size：边长（米），默认 1.4',
      build(p) {
        const g = group(p.label || '待补充设备');
        const k = clampSize(p.size);
        const b = box(g, k, k, k, 'placeholder', 0, k / 2, 0);
        const edges = new T.LineSegments(new T.EdgesGeometry(b.geometry), new T.LineBasicMaterial({ color: 0xffa04a }));
        edges.position.copy(b.position);
        g.add(edges);
        const sw = Math.max(1.6, k * 1.1);
        signMesh(g, p.label || '待补充设备', { bg: '#2a2f36', fg: '#ffb15a', w: 512, h: 128, size: 52, center: true }, sw, sw / 4, 0, k + 0.35, 0);
        anchor(g, 'top', 0, k + 0.7, 0);
        return g;
      }
    }
  };

  class Npc {
    constructor(o) {
      o = o || {};
      this.label = o.label || '';
      this.g = new T.Group();
      this.root = new T.Group();
      this.g.add(this.root);
      const wear = { orange: 'wearOrange', gray: 'wearGray', navy: 'wearNavy' }[o.wear] || 'wearBlue';
      const helmet = { white: 'helmetWhite', red: 'helmetRed' }[o.helmet] || 'helmetYellow';
      const cap = (r, l) => new T.CapsuleGeometry(r, l, 4, 8);
      this.body = new T.Group();
      this.body.position.y = 0.92;
      this.root.add(this.body);
      box(this.body, 0.34, 0.18, 0.22, 'pants', 0, 0, 0);
      this.torso = new T.Group();
      this.torso.position.y = 0.09;
      this.body.add(this.torso);
      box(this.torso, 0.42, 0.56, 0.25, wear, 0, 0.3, 0);
      box(this.torso, 0.43, 0.04, 0.26, 'reflect', 0, 0.2, 0, { noShadow: true });
      box(this.torso, 0.43, 0.04, 0.26, 'reflect', 0, 0.4, 0, { noShadow: true });
      this.head = new T.Group();
      this.head.position.y = 0.62;
      this.torso.add(this.head);
      add(this.head, mesh(new T.SphereGeometry(0.115, 14, 10), 'skin'), 0, 0.1, 0);
      add(this.head, mesh(new T.SphereGeometry(0.145, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), helmet), 0, 0.14, 0);
      cyl(this.head, 0.175, 0.175, 0.02, helmet, 0, 0.14, 0.02);
      this.arm = {};
      this.elbow = {};
      for (const s of [-1, 1]) {
        const sh = new T.Group();
        sh.position.set(s * 0.27, 0.52, 0);
        this.torso.add(sh);
        add(sh, mesh(cap(0.055, 0.22), wear), 0, -0.15, 0);
        const el = new T.Group();
        el.position.y = -0.3;
        sh.add(el);
        add(el, mesh(cap(0.05, 0.2), wear), 0, -0.13, 0);
        add(el, mesh(new T.SphereGeometry(0.05, 8, 6), 'glove'), 0, -0.27, 0);
        this.arm[s] = sh;
        this.elbow[s] = el;
      }
      this.hip = {};
      this.knee = {};
      for (const s of [-1, 1]) {
        const hp = new T.Group();
        hp.position.set(s * 0.1, -0.05, 0);
        this.body.add(hp);
        add(hp, mesh(cap(0.075, 0.3), 'pants'), 0, -0.21, 0);
        const kn = new T.Group();
        kn.position.y = -0.43;
        hp.add(kn);
        add(kn, mesh(cap(0.065, 0.28), 'pants'), 0, -0.2, 0);
        box(kn, 0.12, 0.1, 0.24, 'boot', 0, -0.42, 0.04);
        this.hip[s] = hp;
        this.knee[s] = kn;
      }
      this.anim = o.anim || 'idle';
      this.t = Math.random() * 10;
      this.target = null;
      this.speed = 1.2;
      this.then = 'idle';
      this.lie = 0;
    }

    setAnim(a) {
      this.anim = a || 'idle';
    }

    moveTo(v, speed, anim, then) {
      this.target = v.clone();
      this.target.y = this.g.position.y;
      this.speed = speed || (anim === 'run' ? 3.2 : anim === 'crawl' ? 0.45 : 1.3);
      if (anim) this.anim = anim;
      this.then = then || (this.anim === 'crawl' ? 'fallen' : 'idle');
    }

    stop(anim) {
      this.target = null;
      if (anim) this.anim = anim;
    }

    update(dt) {
      this.t += dt;
      const t = this.t, a = this.anim;
      if (this.target) {
        const d = this.target.clone().sub(this.g.position);
        d.y = 0;
        const dist = d.length();
        if (dist < 0.08) {
          this.target = null;
          this.anim = this.then;
        } else {
          d.normalize();
          this.g.position.addScaledVector(d, Math.min(dist, this.speed * dt));
          let yaw = Math.atan2(d.x, d.z);
          if (a === 'retreat') yaw += Math.PI;
          let dy = yaw - this.g.rotation.y;
          while (dy > Math.PI) dy -= Math.PI * 2;
          while (dy < -Math.PI) dy += Math.PI * 2;
          this.g.rotation.y += dy * Math.min(1, dt * 8);
        }
      }
      const moving = !!this.target;
      const lieTarget = a === 'fallen' ? 1 : a === 'crawl' ? -1 : 0;
      this.lie += (lieTarget - this.lie) * Math.min(1, dt * 4);
      this.root.rotation.x = (-this.lie * Math.PI) / 2;
      this.root.position.y = Math.abs(this.lie) * 0.16;
      this.root.position.z = this.lie * 0.9;
      const zero = (o) => o.rotation.set(0, 0, 0);
      [this.torso, this.head, this.arm[1], this.arm[-1], this.elbow[1], this.elbow[-1], this.hip[1], this.hip[-1], this.knee[1], this.knee[-1]].forEach(zero);
      this.body.position.y = 0.92;
      const S = Math.sin;
      if (a === 'walk' || a === 'run' || a === 'retreat' || (moving && a === 'idle')) {
        const run = a === 'run';
        const f = run ? 10 : 6.5, amp = run ? 0.85 : 0.5;
        const ph = t * f * (a === 'retreat' ? -1 : 1);
        for (const s of [-1, 1]) {
          this.hip[s].rotation.x = S(ph + (s > 0 ? 0 : Math.PI)) * amp;
          this.knee[s].rotation.x = Math.max(0, S(ph + (s > 0 ? Math.PI / 2 : -Math.PI / 2))) * amp * 1.2;
          if (a === 'retreat') {
            this.arm[s].rotation.x = -1.4;
            this.elbow[s].rotation.x = -1.3;
          } else {
            this.arm[s].rotation.x = -S(ph + (s > 0 ? 0 : Math.PI)) * amp * 0.8;
            this.elbow[s].rotation.x = run ? -1.2 : -0.3;
          }
        }
        this.torso.rotation.x = run ? 0.28 : a === 'retreat' ? -0.12 : 0.05;
        this.body.position.y = 0.92 + Math.abs(S(ph)) * (run ? 0.06 : 0.025);
      } else if (a === 'shield') {
        for (const s of [-1, 1]) {
          this.arm[s].rotation.x = -1.6;
          this.arm[s].rotation.z = s * 0.3;
          this.elbow[s].rotation.x = -1.5;
        }
        this.torso.rotation.x = 0.35;
        this.body.position.y = 0.82;
        for (const s of [-1, 1]) {
          this.hip[s].rotation.x = -0.5;
          this.knee[s].rotation.x = 0.9;
        }
      } else if (a === 'fallen') {
        this.arm[1].rotation.z = -0.5 + S(t * 3) * 0.06;
        this.arm[-1].rotation.z = 0.8;
        this.hip[1].rotation.x = -0.25;
        this.knee[1].rotation.x = 0.4;
      } else if (a === 'crawl') {
        const ph = t * 4;
        for (const s of [-1, 1]) {
          this.arm[s].rotation.x = -2.6 + S(ph + (s > 0 ? 0 : Math.PI)) * 0.5;
          this.elbow[s].rotation.x = -0.5;
          this.hip[s].rotation.x = S(ph + (s > 0 ? Math.PI : 0)) * 0.3;
          this.knee[s].rotation.x = 0.6;
        }
      } else if (a === 'wave') {
        this.arm[1].rotation.z = 2.6 + S(t * 9) * 0.35;
        this.arm[-1].rotation.z = -2.6 - S(t * 9 + 1) * 0.35;
      } else if (a === 'call') {
        this.arm[-1].rotation.x = -2.3;
        this.elbow[-1].rotation.x = -2.2;
        this.head.rotation.y = S(t * 0.8) * 0.3;
      } else if (a === 'work') {
        for (const s of [-1, 1]) {
          this.arm[s].rotation.x = -0.9 + S(t * 3 + s) * 0.18;
          this.elbow[s].rotation.x = -0.7;
        }
        this.torso.rotation.x = 0.3;
      } else if (a === 'kneel') {
        this.body.position.y = 0.5;
        this.hip[1].rotation.x = -1.5;
        this.knee[1].rotation.x = 1.5;
        this.hip[-1].rotation.x = 0.1;
        this.knee[-1].rotation.x = 1.6;
        this.torso.rotation.x = 0.5;
        for (const s of [-1, 1]) {
          this.arm[s].rotation.x = -1.0 + S(t * 4 + s) * 0.15;
          this.elbow[s].rotation.x = -0.4;
        }
      } else {
        this.torso.rotation.x = S(t * 1.4) * 0.02;
        this.arm[1].rotation.z = 0.08;
        this.arm[-1].rotation.z = -0.08;
      }
    }
  }

  ZY.assets = {
    defs,
    Npc,
    h: { mat, box, cyl, between, signMesh, group, anchor, mesh, irregularDisc, railLine, hot },
    build(name, p, ctx) {
      const d = defs[name] || defs.placeholder;
      const g = d.build(p || {}, ctx || {});
      g.userData.asset = defs[name] ? name : 'placeholder';
      if (!g.userData.label) g.userData.label = d.label;
      return g;
    },
    catalog() {
      return Object.keys(defs).map((k) => ({ id: k, label: defs[k].label, desc: defs[k].desc }));
    }
  };
})();
