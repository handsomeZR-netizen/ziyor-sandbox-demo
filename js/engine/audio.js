(function () {
  const ZY = (window.ZY = window.ZY || {});
  let ctx = null, master = null, muted = false;
  const ch = {};
  let alarmTimer = null, detTimer = null;

  function noise(brown) {
    const len = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
    return b;
  }

  function loopNoise(brown, type, freq) {
    const src = ctx.createBufferSource();
    src.buffer = noise(brown);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(f).connect(g).connect(master);
    src.start();
    return g;
  }

  function tone(type, freq) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.value = 0;
    o.connect(f).connect(g).connect(master);
    o.start();
    return { o, g };
  }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.8;
      master.connect(ctx.destination);
      ch.rumble = loopNoise(true, 'lowpass', 320);
      ch.hiss = loopNoise(false, 'highpass', 2600);
      ch.alarm = tone('square', 660);
      ch.det = tone('square', 2900);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function setGain(g, v) {
    if (!ctx) return;
    g.gain.setTargetAtTime(v, ctx.currentTime, 0.25);
  }

  function setAlarm(on) {
    if (!ctx) return;
    clearInterval(alarmTimer);
    if (!on) {
      setGain(ch.alarm.g, 0);
      return;
    }
    setGain(ch.alarm.g, 0.035);
    let hi = false;
    alarmTimer = setInterval(() => {
      hi = !hi;
      ch.alarm.o.frequency.setTargetAtTime(hi ? 900 : 640, ctx.currentTime, 0.04);
    }, 420);
  }

  function setDetector(on) {
    if (!ctx) return;
    clearInterval(detTimer);
    ch.det.g.gain.cancelScheduledValues(ctx.currentTime);
    ch.det.g.gain.value = 0;
    if (!on) return;
    detTimer = setInterval(() => {
      const t = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        ch.det.g.gain.setValueAtTime(0.025, t + i * 0.18);
        ch.det.g.gain.setValueAtTime(0, t + i * 0.18 + 0.09);
      }
    }, 900);
  }

  function blip(freq, dur, type, vol, slideTo) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function boom(vol, dur) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise(true);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(80, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  ZY.audio = {
    ensure,
    apply(a) {
      if (!ensure()) return;
      if (a.rumble != null) setGain(ch.rumble, a.rumble * 0.5);
      if (a.hiss != null) setGain(ch.hiss, a.hiss * 0.06);
      if (a.alarm != null) setAlarm(a.alarm);
      if (a.detector != null) setDetector(a.detector);
    },
    sfx(name) {
      if (!ensure()) return;
      if (name === 'click') blip(1200, 0.05, 'square', 0.04);
      else if (name === 'tick') blip(1500, 0.06, 'square', 0.05);
      else if (name === 'good') {
        blip(660, 0.18, 'sine', 0.1);
        setTimeout(() => blip(990, 0.25, 'sine', 0.1), 110);
      } else if (name === 'bad') blip(220, 0.35, 'sawtooth', 0.06, 140);
      else if (name === 'fatal') {
        boom(0.9, 1.6);
        blip(120, 1.2, 'sawtooth', 0.08, 40);
      } else if (name === 'impact') boom(0.7, 0.9);
      else if (name === 'whoosh') boom(0.15, 0.5);
    },
    stopAll() {
      if (!ctx) return;
      setGain(ch.rumble, 0);
      setGain(ch.hiss, 0);
      setAlarm(false);
      setDetector(false);
    },
    setMuted(m) {
      muted = m;
      if (master) master.gain.value = m ? 0 : 0.8;
    },
    get muted() {
      return muted;
    }
  };
})();
