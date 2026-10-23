(function () {
  const ZY = (window.ZY = window.ZY || {});
  const cache = {};

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function finish(c, opts) {
    opts = opts || {};
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (opts.srgb !== false) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  }

  function get(key, painter, repeat, opts) {
    if (!cache[key]) cache[key] = finish(painter(), opts);
    const base = cache[key];
    if (!repeat) return base;
    const t = base.clone();
    t.needsUpdate = true;
    t.repeat.set(repeat[0], repeat[1]);
    return t;
  }

  function noiseFill(ctx, w, h, base, spread, seed, block) {
    const r = rng(seed);
    block = block || 2;
    for (let y = 0; y < h; y += block) {
      for (let x = 0; x < w; x += block) {
        const v = base + (r() - 0.5) * spread;
        ctx.fillStyle = `rgb(${v | 0},${v | 0},${(v * 0.98) | 0})`;
        ctx.fillRect(x, y, block, block);
      }
    }
  }

  function blobs(ctx, w, h, n, color, rMin, rMax, seed, alpha) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, rad = rMin + r() * (rMax - rMin);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, color.replace('A', String(alpha * (0.4 + r() * 0.6))));
      g.addColorStop(1, color.replace('A', '0'));
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }

  const painters = {
    concrete() {
      const w = 512, c = makeCanvas(w, w), ctx = c.getContext('2d');
      noiseFill(ctx, w, w, 112, 26, 7, 2);
      blobs(ctx, w, w, 26, 'rgba(40,36,32,A)', 20, 90, 11, 0.35);
      blobs(ctx, w, w, 14, 'rgba(150,145,135,A)', 30, 80, 13, 0.18);
      const r = rng(17);
      ctx.strokeStyle = 'rgba(30,30,30,0.35)';
      for (let i = 0; i < 10; i++) {
        ctx.lineWidth = 0.6 + r();
        ctx.beginPath();
        let x = r() * w, y = r() * w;
        ctx.moveTo(x, y);
        for (let k = 0; k < 8; k++) {
          x += (r() - 0.5) * 40;
          y += (r() - 0.5) * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(25,25,25,0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, w - 2, w - 2);
      return c;
    },
    asphalt() {
      const w = 512, c = makeCanvas(w, w), ctx = c.getContext('2d');
      noiseFill(ctx, w, w, 70, 30, 21, 2);
      blobs(ctx, w, w, 30, 'rgba(20,20,22,A)', 20, 70, 23, 0.3);
      const r = rng(29);
      for (let i = 0; i < 2500; i++) {
        const v = 90 + r() * 70;
        ctx.fillStyle = `rgba(${v},${v},${v},0.5)`;
        ctx.fillRect(r() * w, r() * w, 1.5, 1.5);
      }
      return c;
    },
    corrugated() {
      const w = 256, h = 256, c = makeCanvas(w, h), ctx = c.getContext('2d');
      for (let x = 0; x < w; x++) {
        const v = 92 + Math.sin((x / 16) * Math.PI * 2) * 22;
        ctx.fillStyle = `rgb(${v - 6},${v},${v + 8})`;
        ctx.fillRect(x, 0, 1, h);
      }
      const r = rng(31);
      for (let i = 0; i < 22; i++) {
        const x = r() * w, len = 40 + r() * 160;
        const g = ctx.createLinearGradient(0, 0, 0, len);
        g.addColorStop(0, 'rgba(110,60,30,0.45)');
        g.addColorStop(1, 'rgba(110,60,30,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 2 + r() * 4, len);
      }
      blobs(ctx, w, h, 12, 'rgba(20,20,20,A)', 20, 60, 37, 0.25);
      return c;
    },
    paintedWall() {
      const w = 256, c = makeCanvas(w, w), ctx = c.getContext('2d');
      noiseFill(ctx, w, w, 196, 10, 41, 2);
      blobs(ctx, w, w, 10, 'rgba(120,120,110,A)', 20, 60, 43, 0.15);
      return c;
    },
    epoxy() {
      const w = 256, c = makeCanvas(w, w), ctx = c.getContext('2d');
      noiseFill(ctx, w, w, 120, 8, 47, 2);
      ctx.fillStyle = 'rgba(80,110,100,0.35)';
      ctx.fillRect(0, 0, w, w);
      return c;
    },
    hazard() {
      const w = 256, h = 64, c = makeCanvas(w, h), ctx = c.getContext('2d');
      ctx.fillStyle = '#e8b21c';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#151515';
      for (let x = -h; x < w + h; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 24, 0);
        ctx.lineTo(x + 24 + h, h);
        ctx.lineTo(x + h, h);
        ctx.closePath();
        ctx.fill();
      }
      return c;
    },
    molten() {
      const w = 256, c = makeCanvas(w, w), ctx = c.getContext('2d');
      ctx.fillStyle = '#ff7a12';
      ctx.fillRect(0, 0, w, w);
      blobs(ctx, w, w, 50, 'rgba(255,236,170,A)', 8, 40, 51, 0.9);
      blobs(ctx, w, w, 40, 'rgba(255,190,60,A)', 10, 50, 53, 0.7);
      blobs(ctx, w, w, 22, 'rgba(70,20,6,A)', 8, 34, 57, 0.85);
      return c;
    },
    glow() {
      const w = 64, c = makeCanvas(w, w), ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.8)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
      return c;
    },
    puff() {
      const w = 128, c = makeCanvas(w, w), ctx = c.getContext('2d');
      const r = rng(61);
      for (let i = 0; i < 14; i++) {
        const x = 34 + r() * 60, y = 34 + r() * 60, rad = 18 + r() * 26;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, 'rgba(255,255,255,0.35)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, w);
      }
      const m = ctx.createRadialGradient(64, 64, 30, 64, 64, 64);
      m.addColorStop(0, 'rgba(0,0,0,0)');
      m.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = m;
      ctx.fillRect(0, 0, w, w);
      return c;
    },
    brick() {
      const w = 256, c = makeCanvas(w, w), ctx = c.getContext('2d');
      ctx.fillStyle = '#2a1712';
      ctx.fillRect(0, 0, w, w);
      const r = rng(67);
      for (let y = 0; y < w; y += 32) {
        const off = (y / 32) % 2 ? 32 : 0;
        for (let x = -32; x < w; x += 64) {
          const v = 70 + r() * 40;
          ctx.fillStyle = `rgb(${v + 30},${v * 0.55},${v * 0.4})`;
          ctx.fillRect(x + off + 2, y + 2, 60, 28);
        }
      }
      return c;
    },
    checker() {
      const w = 128, c = makeCanvas(w, w), ctx = c.getContext('2d');
      noiseFill(ctx, w, w, 120, 12, 71, 2);
      ctx.fillStyle = 'rgba(200,200,200,0.35)';
      for (let y = 0; y < w; y += 16) {
        for (let x = 0; x < w; x += 16) {
          ctx.save();
          ctx.translate(x + 8, y + 8);
          ctx.rotate(((x + y) / 16) % 2 ? 0.7 : -0.7);
          ctx.fillRect(-5, -1.5, 10, 3);
          ctx.restore();
        }
      }
      return c;
    },
    windows() {
      const w = 256, c = makeCanvas(w, w), ctx = c.getContext('2d');
      ctx.fillStyle = '#4a4f55';
      ctx.fillRect(0, 0, w, w);
      const r = rng(73);
      for (let y = 12; y < w; y += 32) {
        for (let x = 10; x < w; x += 30) {
          const lit = r() > 0.6;
          ctx.fillStyle = lit ? 'rgba(255,220,160,0.9)' : 'rgba(30,40,50,0.9)';
          ctx.fillRect(x, y, 18, 18);
        }
      }
      return c;
    },
    sky() {
      const c = makeCanvas(16, 256), ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#7f9bb6');
      g.addColorStop(0.55, '#b9c6cf');
      g.addColorStop(1, '#d9d6cc');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 16, 256);
      return c;
    },
    coilEnd() {
      const w = 256, c = makeCanvas(w, w), ctx = c.getContext('2d');
      ctx.fillStyle = '#8b9097';
      ctx.fillRect(0, 0, w, w);
      for (let r = 128; r > 30; r -= 2) {
        const v = 120 + ((r * 37) % 40);
        ctx.strokeStyle = `rgb(${v},${v + 4},${v + 10})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(128, 128, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      return c;
    }
  };

  function sign(text, opts) {
    opts = opts || {};
    const key = 'sign:' + text + JSON.stringify(opts);
    if (cache[key]) return cache[key];
    const w = opts.w || 512, h = opts.h || 200;
    const c = makeCanvas(w, h), ctx = c.getContext('2d');
    ctx.fillStyle = opts.bg || '#17803d';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = opts.border || 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    let x0 = 28;
    if (opts.icon === 'warn') {
      ctx.fillStyle = '#f3c316';
      ctx.beginPath();
      ctx.moveTo(x0 + 70, 34);
      ctx.lineTo(x0 + 136, h - 34);
      ctx.lineTo(x0 + 4, h - 34);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.font = 'bold 90px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x0 + 70, h - 46);
      x0 += 150;
    } else if (opts.icon === 'run') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 110px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(opts.arrow === 'left' ? '←' : '→', x0 + 60, h / 2 + 38);
      x0 += 130;
    } else if (opts.icon === 'cross') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x0 + 40, 44, 40, h - 88);
      ctx.fillRect(x0 + 10, h / 2 - 20, 100, 40);
      x0 += 130;
    } else if (opts.icon === 'bolt') {
      ctx.fillStyle = '#f3c316';
      ctx.beginPath();
      ctx.moveTo(x0 + 80, 30);
      ctx.lineTo(x0 + 30, h / 2 + 10);
      ctx.lineTo(x0 + 70, h / 2 + 10);
      ctx.lineTo(x0 + 50, h - 30);
      ctx.lineTo(x0 + 110, h / 2 - 14);
      ctx.lineTo(x0 + 70, h / 2 - 14);
      ctx.closePath();
      ctx.fill();
      x0 += 130;
    }
    ctx.fillStyle = opts.fg || '#ffffff';
    ctx.textAlign = opts.center ? 'center' : 'left';
    ctx.textBaseline = 'middle';
    const tx = opts.center ? w / 2 : x0;
    const maxW = opts.center ? w - 40 : w - x0 - 24;
    let size = opts.size || (text.length > 6 ? 56 : 72);
    const font = (s, bold) => `${bold ? 'bold ' : ''}${s}px "Microsoft YaHei","PingFang SC",sans-serif`;
    ctx.font = font(size, true);
    while (size > 18 && ctx.measureText(text).width > maxW) {
      size -= 2;
      ctx.font = font(size, true);
    }
    if (opts.sub) {
      ctx.fillText(text, tx, h / 2 - size * 0.32);
      ctx.font = font(Math.round(size * 0.48), false);
      ctx.fillText(opts.sub, tx, h / 2 + size * 0.5);
    } else {
      ctx.fillText(text, tx, h / 2 + 2);
    }
    cache[key] = finish(c, { srgb: true });
    cache[key].wrapS = cache[key].wrapT = THREE.ClampToEdgeWrapping;
    return cache[key];
  }

  ZY.tex = {
    rng,
    get(name, repeat) {
      return get(name, painters[name], repeat);
    },
    sign
  };
})();
