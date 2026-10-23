(function () {
  const ZY = (window.ZY = window.ZY || {});
  const T = THREE;
  const H = () => ZY.assets.h;

  function plane(g, w, d, material, x, y, z, rx) {
    const m = new T.Mesh(new T.PlaneGeometry(w, d), material);
    m.rotation.x = rx == null ? -Math.PI / 2 : rx;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    g.add(m);
    return m;
  }

  function stdLights(ctx, o) {
    const g = ctx.group;
    const hemi = new T.HemisphereLight(o.sky || 0x8a96a6, o.ground || 0x2e2a26, o.hemi == null ? 0.4 : o.hemi);
    g.add(hemi);
    const dir = new T.DirectionalLight(o.sunColor || 0xd6dee8, o.sun == null ? 0.55 : o.sun);
    dir.position.set(o.sunPos[0], o.sunPos[1], o.sunPos[2]);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    const s = o.shadow || 40;
    Object.assign(dir.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 220 });
    dir.shadow.bias = -0.0004;
    dir.shadow.normalBias = 0.03;
    g.add(dir);
    g.add(dir.target);
    ctx.lights.main = [hemi, dir];
    (o.points || []).forEach((p) => {
      const l = new T.PointLight(p[3], p[4], p[5], 1.4);
      l.position.set(p[0], p[1], p[2]);
      g.add(l);
      ctx.lights.power.push(l);
    });
  }

  function walkway(g, from, to, width) {
    const m = H().mat('paintYellow');
    const dx = to[0] - from[0], dz = to[1] - from[1];
    const len = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
    const nx = -Math.sin(ang), nz = Math.cos(ang);
    for (const s of [-1, 1]) {
      const p = new T.Mesh(new T.PlaneGeometry(len, 0.14), m);
      p.rotation.x = -Math.PI / 2;
      p.rotation.z = -ang;
      p.position.set((from[0] + to[0]) / 2 + (nx * s * width) / 2, 0.012, (from[1] + to[1]) / 2 + (nz * s * width) / 2);
      g.add(p);
    }
  }

  function buildHall(ctx, o) {
    const g = ctx.group, h = H();
    const { w, d } = o;
    const ht = o.h;
    const floorMat = new T.MeshStandardMaterial({ map: ZY.tex.get(o.floor || 'concrete', [w / 6, d / 6]), roughness: 0.92, color: o.floorColor || 0x9a9a96 });
    floorMat.envMapIntensity = 0.15;
    plane(g, w, d, floorMat, 0, 0, 0);
    const wallMat = (len) => {
      const m = new T.MeshStandardMaterial({ map: ZY.tex.get('corrugated', [len / 5, (ht - 3) / 5]), color: o.wallColor || 0x8a929a, metalness: 0.5, roughness: 0.6 });
      m.envMapIntensity = 0.2;
      return m;
    };
    const walls = [
      [w, 0, -d / 2, 0], [w, 0, d / 2, Math.PI], [d, -w / 2, 0, Math.PI / 2], [d, w / 2, 0, -Math.PI / 2]
    ];
    for (const [len, x, z, ry] of walls) {
      const up = new T.Mesh(new T.PlaneGeometry(len, ht - 3), wallMat(len));
      up.position.set(x, 3 + (ht - 3) / 2, z);
      up.rotation.y = ry;
      up.receiveShadow = true;
      g.add(up);
      const band = new T.Mesh(new T.PlaneGeometry(len, 3), h.mat('concrete'));
      band.position.set(x, 1.5, z);
      band.rotation.y = ry;
      band.translateZ(0.05);
      band.receiveShadow = true;
      g.add(band);
    }
    const roof = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({ color: 0x24282d, roughness: 0.9 }));
    roof.rotation.x = Math.PI / 2;
    roof.position.y = ht;
    g.add(roof);
    const bay = o.bay || 8;
    for (let x = -w / 2 + bay / 2; x < w / 2; x += bay) {
      for (const s of [-1, 1]) {
        const z = s * (d / 2 - 0.6);
        h.box(g, 0.9, ht, 0.12, 'paintBlue', x, ht / 2, z - 0.4);
        h.box(g, 0.9, ht, 0.12, 'paintBlue', x, ht / 2, z + 0.4);
        h.box(g, 0.12, ht, 0.7, 'paintBlue', x, ht / 2, z);
      }
      h.box(g, 0.3, 0.3, d, 'steelDark', x, ht - 2.6, 0, { noShadow: true });
      h.box(g, 0.3, 0.3, d, 'steelDark', x, ht - 0.4, 0, { noShadow: true });
      for (let zz = -d / 2 + 3; zz < d / 2; zz += 4) h.box(g, 0.15, 2.2, 0.15, 'steelDark', x, ht - 1.5, zz, { noShadow: true });
      for (const zz of [-d / 4, d / 4]) h.cyl(g, 0.35, 0.45, 0.4, 'lampWarm', x, ht - 2.95, zz, { noShadow: true });
    }
    for (const s of [-1, 1]) {
      h.box(g, w, 1.0, 0.6, 'paintBlue', 0, ht - 4.2, s * (d / 2 - 0.6), { noShadow: true });
      h.box(g, w, 0.15, 0.15, 'steel', 0, ht - 3.62, s * (d / 2 - 0.6), { noShadow: true });
      const sky = new T.Mesh(new T.PlaneGeometry(w - 4, 2.2), new T.MeshStandardMaterial({ color: 0x111111, emissive: 0x9fb3c4, emissiveIntensity: 0.55 }));
      sky.rotation.x = Math.PI / 2;
      sky.position.set(0, ht - 0.05, s * d * 0.18);
      g.add(sky);
    }
    (o.walkways || []).forEach((p) => walkway(g, p.from, p.to, p.width || 2));
    stdLights(ctx, {
      sunPos: [w * 0.2, ht * 2.6, d * 0.5],
      shadow: Math.max(w, d) * 0.62,
      points: o.points,
      hemi: o.hemi,
      sun: o.sun
    });
  }

  const templates = {
    bof: {
      id: 'bof',
      name: '转炉炼钢车间（出钢跨）',
      desc: '转炉、钢包车轨道、天车、主控室、安全通道与东侧安全出口',
      hall: { w: 56, d: 36, h: 22 },
      bg: 0x16191d,
      fog: [0x1d2024, 0.011],
      slots: {
        converter: [-3, 0, -9], tapping: [3.2, 0, -9], under_ladle: [5.6, 0, -6.2], breaker_near: [7.6, 0, -5.4, -20],
        coworker: [6.4, 0, -3.6], wang_trip: [8.4, 0, -1.4], walkway_mid: [14, 0, 5], exit: [27.7, 0, 9, -90], exit_in: [26, 0, 9],
        assembly: [22, 0, 13.5], assembly_wang: [21.2, 0, 14.6], control_room: [-18, 0, 8, 139], crane_bay: [-6, 0, 2], crane_floor: [-6, 0, 2],
        pit: [15, 0, -4], path_ahead: [9, 0, 2.5], path_ahead2: [10.2, 0, 3.6], side_safe: [11, 0, 10.5], side_safe2: [12.2, 0, 11.2],
        extinguisher: [12.5, 0, 0.6], cordon: [19.5, 0, 6.2, 90], alarm1: [6, 7, -17.6], alarm2: [20, 6.5, 17.6],
        material1: [-14, 0, -14], material2: [16, 0, -15], free1: [-12, 0, -2], free2: [0, 0, 6], free3: [-20, 0, -8], free4: [18, 0, -10]
      },
      views: {
        overview: { p: [20, 11, 16], t: [0, 3, -7] },
        operator: { p: [11, 1.7, 3], t: [3.2, 3.4, -9] },
        close_ladle: { p: [6.3, 1.7, -4.4], t: [3.2, 3.6, -9] },
        breaker: { p: [8.9, 1.7, -3.4], t: [7.6, 1.4, -5.4] },
        walkway: { p: [16, 1.7, 5], t: [6, 2, -4] },
        safe: { p: [23.5, 1.7, 11.5], t: [7, 2.2, -5] },
        assembly: { p: [21, 1.7, 16.5], t: [12, 1.5, 4] },
        control: { p: [-17.3, 5.9, 7.4], t: [0, 4, -8] },
        crane_ground: { p: [3, 1.7, 11], t: [-6, 6.5, 2] },
        workers: { p: [6.5, 1.7, 7.5], t: [9.6, 1, 3] },
        pit: { p: [20, 1.7, 4], t: [14, 2.5, -3.5] }
      },
      defaultView: 'overview',
      build(ctx) {
        buildHall(ctx, {
          w: 56, d: 36, h: 22,
          walkways: [{ from: [6, 5], to: [28, 5], width: 2.2 }, { from: [11, -1.5], to: [11, 4], width: 1.8 }],
          points: [[-3, 15, -3, 0xffb070, 0.7, 45], [16, 16, 6, 0xd8e0ea, 0.55, 45]]
        });
        const g = ctx.group, h = H();
        for (const s of [-1, 1]) h.box(g, 26, 0.12, 0.14, 'steel', 9, 0.06, -9 + s * 1.1, { noShadow: true });
        for (let x = -3; x < 22; x += 1) h.box(g, 0.25, 0.06, 2.8, 'steelDark', x, 0.03, -9, { noShadow: true });
        const hz = h.mat('hazard');
        for (const [x, z, w, d] of [[5, -4.3, 12, 0.18], [5, -13.7, 12, 0.18], [-1, -9, 0.18, 9.4], [11, -9, 0.18, 9.4]]) {
          const m = new T.Mesh(new T.PlaneGeometry(w, d), hz);
          m.rotation.x = -Math.PI / 2;
          m.position.set(x, 0.013, z);
          g.add(m);
        }
        h.signMesh(g, '当心高温钢水', { bg: '#f3c316', fg: '#111', icon: 'warn', sub: '出钢区域 非作业人员禁止入内' }, 3.2, 1.25, 8, 4.2, -17.8);
        h.signMesh(g, '严禁积水', { bg: '#c8302a', icon: 'warn', sub: '钢水遇水会发生爆炸' }, 2.6, 1.0, 14, 4.2, -17.8);
        h.signMesh(g, '出钢跨', { bg: '#1f3b57', w: 512, h: 160, center: true }, 3, 0.95, -27.8, 6, 0, Math.PI / 2);
        for (const k of ['material1', 'material2']) {
          const s = this.slots[k];
          const st = ZY.assets.build('pallet_stack', { n: 4, seed: s[0] | 0 }, ctx);
          st.position.set(s[0], 0, s[2]);
          g.add(st);
        }
      }
    },

    caster: {
      id: 'caster',
      name: '连铸车间（浇注平台）',
      desc: '7 米高浇注平台、钢包回转台、中间包、结晶器、二冷区与出坯辊道',
      hall: { w: 48, d: 32, h: 20 },
      bg: 0x16191d,
      fog: [0x1d2024, 0.012],
      slots: {
        mold: [0, 7, -4], tundish: [0, 7, -4], turret: [0, 7, -9], estop: [2.8, 7, -1.4], pulpit: [7, 7, -9.5, -52],
        platform_mate: [-3, 7, -1.2], below_worker: [2.4, 0, 4.2], runout_side: [-4, 0, 10], below_pool: [0.6, 0, 2.6],
        assembly: [16, 0, 12], stairs_top: [4.5, 7, 2.2], plat_exit: [-13.5, 7, -2], ext: [8, 7, -1],
        alarm1: [-10, 10, -15.6], alarm2: [14, 6, 15.6], free1: [-8, 7, -6], free2: [-6, 0, 8], free3: [10, 0, 8], free4: [-16, 0, -8]
      },
      views: {
        overview: { p: [16, 13, 14], t: [0, 4, -2] },
        platform: { p: [6, 8.7, 0.5], t: [0, 7.3, -4] },
        close_mold: { p: [1.2, 8.6, -2.2], t: [0, 6, -4] },
        rail_look_down: { p: [3.4, 8.7, 1.6], t: [2.2, 0.6, 4.6] },
        stairs: { p: [4.5, 4.2, 6.2], t: [1.5, 1.2, 3.5] },
        platform_exit: { p: [-11, 8.7, -1], t: [0, 7.5, -4] },
        pulpit: { p: [6.6, 8.9, -8.4], t: [0, 7.5, -4] },
        below: { p: [8, 1.7, 9], t: [1, 2, 3] }
      },
      defaultView: 'overview',
      build(ctx) {
        buildHall(ctx, {
          w: 48, d: 32, h: 20,
          walkways: [{ from: [-20, 12], to: [20, 12], width: 2 }],
          points: [[0, 14, -4, 0xffb070, 0.6, 40], [10, 12, 8, 0xd8e0ea, 0.5, 40]]
        });
        const g = ctx.group, h = H();
        const ph = 7, cx = -2, cz = -5, pw = 24, pd = 14;
        h.box(g, pw, 0.4, pd, 'checker', cx, ph - 0.2, cz);
        for (const lx of [-12, -6, -1.5, 9, 12]) for (const lz of [-7, 7]) h.box(g, 0.5, ph - 0.4, 0.5, 'paintBlue', cx + lx, (ph - 0.4) / 2, cz + lz);
        const x0 = cx - pw / 2, x1 = cx + pw / 2, z0 = cz - pd / 2, z1 = cz + pd / 2;
        h.railLine(g, x0, z0, x1, z0, ph, 'paintYellow');
        h.railLine(g, x1, z0, x1, z1, ph, 'paintYellow');
        h.railLine(g, x0, z1, 3.6, z1, ph, 'paintYellow');
        h.railLine(g, 5.4, z1, x1, z1, ph, 'paintYellow');
        h.railLine(g, x0, z0, x0, -3.2, ph, 'paintYellow');
        h.railLine(g, x0, -0.8, x0, z1, ph, 'paintYellow');
        stairs(g, 4.5, ph, 2, 0);
        stairs(g, x0, ph, -2, -Math.PI / 2);
        h.signMesh(g, '平台安全通道', { bg: '#169b45', icon: 'run', arrow: 'right', glow: 1.0 }, 1.8, 0.7, x0 + 0.1, ph + 2.2, -2, Math.PI / 2);
        h.signMesh(g, '当心钢水飞溅', { bg: '#f3c316', fg: '#111', icon: 'warn', sub: '浇注区域 必须穿戴防护' }, 3, 1.15, -6, 11, -15.8);
        h.signMesh(g, '二冷区', { bg: '#c8302a', icon: 'warn', sub: '浇注时禁止进入' }, 2.2, 0.85, -2.5, 3, 4.6);
      }
    },

    gas: {
      id: 'gas',
      name: '煤气管道区（室外）',
      desc: '高架煤气主管、阀门组、风向标、厂区道路与远处煤气柜。风从东往西吹',
      hall: { w: 90, d: 70, h: 30 },
      outdoor: true,
      wind: [-1, 0, 0.12],
      bg: 0xa9b7c3,
      fog: [0xb6c0c8, 0.0095],
      slots: {
        valve: [4, 0, 3.2], victim: [5.2, 0, 5], detector_post: [1, 0, 6.5], windsock: [-6, 0, 12], scba: [20, 0, 9],
        scba_side: [20.6, 0, 10.4], assembly: [24, 0, 14], patrol_start: [-6, 0, 9], crosswind_safe: [-2, 0, 24],
        upwind_far: [32, 0, 8], safe_patient: [19, 0, 13.2], safe_helper: [19.9, 0, 13.9], downwind: [-24, 0, 6],
        road_east: [36, 0, 20, 180], road_mid: [14, 0, 20], road_block: [10, 0, 20, 90],
        manhole: [-14, 0, -9], blower: [-12.4, 0, -11], scba_north: [-8, 0, -13.5], mate_north: [-8.8, 0, -6.6], mate_far: [6, 0, -10],
        patient: [-4, 0, -12], patient_helper: [-3.2, 0, -11.2], first_aid: [-3, 0, -13.4],
        free1: [10, 0, -8], free2: [-20, 0, 14], free3: [14, 0, 12], free4: [-10, 0, 4]
      },
      views: {
        overview: { p: [22, 14, 30], t: [0, 2, 2] },
        patrol: { p: [-6, 1.7, 9], t: [4.5, 1.2, 4.5] },
        victim_close: { p: [3.2, 1.7, 7.2], t: [5.2, 0.3, 5] },
        crosswind: { p: [-2, 1.7, 24], t: [4, 1.5, 4] },
        upwind: { p: [21.5, 1.7, 16], t: [8, 1.2, 6] },
        downwind: { p: [-24, 1.7, 6], t: [4, 2, 4] },
        road: { p: [14, 1.7, 16], t: [30, 1.5, 20] },
        manhole: { p: [-11, 1.7, -5.5], t: [-14, 0.2, -9] },
        hole: { p: [-13.6, 1.3, -8.4], t: [-14.05, -1.5, -9.05] },
        manhole_far: { p: [-1, 1.7, -5.5], t: [-8, 0.6, -11] }
      },
      defaultView: 'overview',
      build(ctx) {
        const g = ctx.group, h = H();
        const gm = new T.MeshStandardMaterial({ map: ZY.tex.get('asphalt', [40, 40]), roughness: 0.95, color: 0x9a9894 });
        plane(g, 220, 220, gm, 0, 0, 0);
        const road = new T.MeshStandardMaterial({ map: ZY.tex.get('asphalt', [60, 2]), roughness: 0.9, color: 0x5c5c5e });
        plane(g, 220, 7, road, 0, 0.01, 20);
        for (let x = -100; x < 100; x += 6) plane(g, 3, 0.18, h.mat('white'), x, 0.02, 20);
        const pad = new T.MeshStandardMaterial({ map: ZY.tex.get('concrete', [3, 2]), roughness: 0.9, color: 0xa4a29c });
        plane(g, 14, 9, pad, 5, 0.012, 4);
        stdLights(ctx, { sky: 0xcfe0f0, ground: 0x6b6253, hemi: 0.85, sunColor: 0xfff2dc, sun: 1.15, sunPos: [40, 60, 25], shadow: 50 });
        for (let x = -36; x <= 36; x += 6) {
          for (const s of [-1, 1]) h.box(g, 0.35, 6, 0.35, 'paintGray', x, 3, s * 1.6);
          h.box(g, 0.3, 0.3, 3.6, 'paintGray', x, 6, 0);
          h.box(g, 0.25, 0.25, 3.6, 'paintGray', x, 4, 0, { noShadow: true });
        }
        h.cyl(g, 0.65, 0.65, 74, 'paintGray', 0, 6.75, -0.6, { rz: Math.PI / 2, seg: 28 });
        h.cyl(g, 0.4, 0.4, 74, 'paintBlue', 0, 6.55, 0.7, { rz: Math.PI / 2 });
        h.cyl(g, 0.25, 0.25, 74, 'paintGreen', 0, 6.4, 1.3, { rz: Math.PI / 2 });
        for (let x = -33; x <= 33; x += 6) h.cyl(g, 0.68, 0.68, 0.3, 'paintYellow', x, 6.75, -0.6, { rz: Math.PI / 2, noShadow: true });
        h.signMesh(g, '高炉煤气管道', { bg: '#f3c316', fg: '#111', icon: 'warn', sub: '当心中毒 禁止烟火' }, 2.2, 0.85, 10, 4.5, 1.8);
        for (let x = -40; x <= 40; x += 3) h.box(g, 0.08, 2.2, 0.08, 'steelGalv', x, 1.1, -17, { noShadow: true });
        h.box(g, 80, 0.06, 0.06, 'steelGalv', 0, 2.1, -17, { noShadow: true });
        h.box(g, 80, 0.06, 0.06, 'steelGalv', 0, 1.1, -17, { noShadow: true });
        const holder = h.cyl(g, 13, 13, 34, 'paintGray', -42, 17, -40, { seg: 40 });
        holder.castShadow = false;
        h.cyl(g, 13.4, 13.4, 1.2, 'steelDark', -42, 34.4, -40, { seg: 40, noShadow: true });
        for (const [x, z, ht] of [[30, -45, 55], [38, -48, 48]]) {
          h.cyl(g, 1.6, 2.2, ht, 'paintGray', x, ht / 2, z, { noShadow: true });
          for (let y = ht - 8; y > ht - 20; y -= 6) h.cyl(g, 1.75, 1.75, 2.2, 'paintRed', x, y, z, { noShadow: true });
        }
        for (const [x, z, w, ht, d] of [[48, -8, 18, 14, 22], [-48, 14, 20, 12, 24], [8, -38, 30, 16, 14], [-10, 40, 26, 10, 12]]) {
          const b = ZY.assets.build('building', { w, h: ht, d }, ctx);
          b.position.set(x, 0, z);
          g.add(b);
        }
      }
    },

    coil: {
      id: 'coil',
      name: '成品钢卷库（天车吊运）',
      desc: '钢卷垛、天车吊运通道、天车电源隔离开关与爬梯',
      hall: { w: 64, d: 30, h: 18 },
      bg: 0x16191d,
      fog: [0x1d2024, 0.01],
      slots: {
        crane_a: [-8, 0, 0], crane_path_end: [6, 0, 0], saddle_near: [-3.5, 0, 0], label_w1: [8, 0, 1.0], label_w2: [9.3, 0, -0.8],
        flee_1: [12, 0, 5.6], flee_2: [13.2, 0, 6.2], signal: [-2, 0, 6.5], isolator: [-31.7, 0, 6, 90], maint_in: [-24, 0, 10],
        ladder: [-29.6, 0, 12.6], ladder_foot: [-29.2, 0, 11.6], maintenance: [-6, 0, 4], alarm1: [0, 8, -14.6],
        free1: [14, 0, 4], free2: [-18, 0, -4], free3: [20, 0, -4], free4: [-20, 0, 4]
      },
      views: {
        overview: { p: [14, 10, 13], t: [-4, 3, 0] },
        signal: { p: [-2, 1.7, 6.5], t: [-8, 5.2, 0] },
        workers: { p: [2, 1.7, 4.5], t: [8.5, 1.2, 0] },
        isolator: { p: [-28.6, 1.7, 7.6], t: [-31.7, 1.5, 6] },
        saddle: { p: [-0.6, 1.7, 4.6], t: [-4, 1, 0] }
      },
      defaultView: 'overview',
      build(ctx) {
        buildHall(ctx, {
          w: 64, d: 30, h: 18,
          walkways: [{ from: [-30, 4.2], to: [30, 4.2], width: 0.01 }, { from: [-30, -4.2], to: [30, -4.2], width: 0.01 }],
          points: [[-10, 13, 0, 0xd8e0ea, 0.55, 40], [14, 13, 0, 0xd8e0ea, 0.55, 40]]
        });
        const g = ctx.group;
        for (const z of [-9.5, 9.5]) {
          for (const x of [-18, 6, 22]) {
            const st = ZY.assets.build('coil_stack', { n: x === 6 ? 5 : 7 }, ctx);
            st.position.set(x, 0, z);
            st.rotation.y = 0;
            g.add(st);
          }
        }
        H().signMesh(g, '吊物下方 严禁站人', { bg: '#c8302a', icon: 'warn', sub: '天车运行时人员必须避让' }, 3.4, 1.3, -4, 5, -14.8);
        H().signMesh(g, '成品库 2 跨', { bg: '#1f3b57', w: 512, h: 160, center: true }, 3, 0.95, 10, 5, -14.8);
      }
    },

    electric: {
      id: 'electric',
      name: '低压配电室',
      desc: '两排低压开关柜、电缆沟、绝缘垫、灭火器、消火栓与火灾报警按钮。东侧为门',
      hall: { w: 18, d: 12, h: 5.5 },
      bg: 0x0a0d14,
      fog: [0x0c0f14, 0.02],
      slots: {
        cab3: [-3.6, 0.05, -2.4], cab3_arc: [-3.6, 0.55, -2.78], ext: [8.3, 0, 1.8], ext2: [8.3, 0, -1.6],
        alarm_btn: [8.85, 1.4, 1.2, -90], hydrant: [8.85, 1.0, -3.2, -90], outside_ff: [11.5, 0, 0.8], outside_ff2: [16, 0, 2.5],
        smoke_room: [-2, 3.5, -1], free1: [-7, 0, 0], free2: [0, 0, 0.3], free3: [5, 0, 0.3]
      },
      views: {
        door_in: { p: [8.0, 1.7, 0.5], t: [-3.6, 0.6, -2.4] },
        overview: { p: [7.8, 4.7, 5.0], t: [-2, 0.6, -1.5] },
        fire_close: { p: [-1.6, 1.6, -0.6], t: [-3.6, 0.3, -2.4] },
        low_door: { p: [8.3, 0.9, 0.3], t: [-3, 0.4, -2] },
        outside: { p: [11.4, 1.7, 0.3], t: [-2, 1.0, -1.5] }
      },
      defaultView: 'door_in',
      build(ctx) {
        const g = ctx.group, h = H();
        const W = 18, D = 12, HT = 5.5;
        const fl = new T.MeshStandardMaterial({ map: ZY.tex.get('epoxy', [6, 4]), roughness: 0.35, color: 0xa6b0ac });
        plane(g, W, D, fl, 0, 0, 0);
        const outside = new T.MeshStandardMaterial({ map: ZY.tex.get('asphalt', [4, 4]), roughness: 0.9, color: 0x55575a });
        plane(g, 16, 14, outside, 17, 0.005, 0);
        const wall = new T.MeshStandardMaterial({ map: ZY.tex.get('paintedWall', [4, 2]), color: 0xd9ddd8, roughness: 0.8 });
        const low = new T.MeshStandardMaterial({ color: 0x6f8f86, roughness: 0.7 });
        const seg = (w, hh, d, m, x, y, z) => {
          const b = new T.Mesh(new T.BoxGeometry(w, hh, d), m);
          b.position.set(x, y, z);
          b.receiveShadow = true;
          b.castShadow = true;
          g.add(b);
        };
        seg(W, HT, 0.25, wall, 0, HT / 2, -D / 2);
        seg(W, HT, 0.25, wall, 0, HT / 2, D / 2);
        seg(0.25, HT, D, wall, -W / 2, HT / 2, 0);
        const side = (D / 2 - 0.8);
        seg(0.25, HT, side, wall, W / 2, HT / 2, -(0.8 + side / 2));
        seg(0.25, HT, side, wall, W / 2, HT / 2, 0.8 + side / 2);
        seg(0.25, HT - 2.4, 1.6, wall, W / 2, 2.4 + (HT - 2.4) / 2, 0);
        seg(W - 0.3, 1.2, 0.02, low, 0, 0.6, -D / 2 + 0.14);
        seg(W - 0.3, 1.2, 0.02, low, 0, 0.6, D / 2 - 0.14);
        const ceil = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ color: 0xcfd3d0, roughness: 0.9 }));
        ceil.rotation.x = Math.PI / 2;
        ceil.position.y = HT;
        g.add(ceil);
        const door = h.box(g, 1.5, 2.3, 0.06, 'doorGray', 9.6, 1.15, 0.75);
        door.rotation.y = -1.25;
        for (let i = 0; i < 3; i++) {
          const win = new T.Mesh(new T.PlaneGeometry(1.6, 0.7), new T.MeshStandardMaterial({ color: 0x050a14, emissive: 0x1a2a4a, emissiveIntensity: 0.6 }));
          win.position.set(-5 + i * 5, 4.4, -D / 2 + 0.14);
          g.add(win);
        }
        const panelMat = h.mat('lampCool').clone();
        ctx.emissive.power.push(panelMat);
        for (const x of [-5, 0, 5]) for (const z of [-3, 3]) {
          const p = new T.Mesh(new T.BoxGeometry(1.2, 0.05, 0.3), panelMat);
          p.position.set(x, HT - 0.03, z);
          g.add(p);
        }
        stdLights(ctx, {
          sky: 0x8899aa, ground: 0x222222, hemi: 0.35, sun: 0.25, sunPos: [6, 20, 10], shadow: 14,
          points: [[-4, 4.8, 0, 0xe8f0ff, 0.9, 16], [4, 4.8, 0, 0xe8f0ff, 0.9, 16]]
        });
        ctx.lights.power.push(ctx.lights.main[0]);
        const em = new T.PointLight(0xfff4e0, 0, 12, 1.5);
        em.position.set(7.5, 3.2, 0);
        g.add(em);
        ctx.lights.emergency.push(em);
        h.signMesh(g, '安全出口', { bg: '#169b45', icon: 'run', arrow: 'right', glow: 1.3 }, 0.9, 0.35, 8.85, 2.7, 0, -Math.PI / 2);
        h.signMesh(g, '配电重地 闲人免进', { bg: '#c8302a', icon: 'bolt' }, 1.8, 0.7, -9 + 0.14, 2.5, 0, Math.PI / 2);
        const rowA = ZY.assets.build('switchgear', { n: 14, start: 1 }, ctx);
        rowA.position.set(0, 0, -3.2);
        g.add(rowA);
        const rowB = ZY.assets.build('switchgear', { n: 10, start: 15 }, ctx);
        rowB.position.set(0, 0, 3.4);
        rowB.rotation.y = Math.PI;
        g.add(rowB);
        const pit = h.mat('pitBlack');
        h.box(g, 11.4, 0.01, 0.6, pit, 0, 0.006, -2.4, { noShadow: true });
        for (let i = 0; i < 12; i++) {
          const x = -5.5 + i * 0.95;
          if (Math.abs(x + 3.6) < 0.5) continue;
          h.box(g, 0.92, 0.03, 0.62, 'checker', x, 0.02, -2.4);
        }
        for (const z of [-0.6, 1.6]) h.box(g, 11.4, 0.012, 0.9, 'rubberMat', 0, 0.007, z, { noShadow: true });
        for (let i = 0; i < 3; i++) h.cyl(g, 0.04, 0.04, 0.9, 'rubber', -3.6, 0.03, -2.6 + i * 0.12, { rz: Math.PI / 2, noShadow: true });
      }
    }
  };

  function stairs(g, x, h, z, yaw) {
    const hh = H();
    const s = new T.Group();
    s.position.set(x, 0, z);
    s.rotation.y = yaw;
    g.add(s);
    const n = Math.ceil(h / 0.22), rise = h / n, run = 0.3;
    for (let i = 0; i < n; i++) hh.box(s, 1.4, 0.06, 0.3, 'checker', 0, h - (i + 1) * rise + 0.03, (i + 0.5) * run, { noShadow: true });
    const L = n * run, ang = Math.atan2(h, L), len = Math.hypot(h, L);
    for (const sx of [-0.75, 0.75]) {
      const b = hh.box(s, 0.08, 0.3, len, 'paintYellow', sx, h / 2, L / 2);
      b.rotation.x = ang;
      const r = hh.box(s, 0.05, 0.05, len, 'paintYellow', sx, h / 2 + 1.0, L / 2, { noShadow: true });
      r.rotation.x = ang;
    }
  }

  ZY.templates = templates;
})();
