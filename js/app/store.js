(function () {
  const ZY = window.ZY;
  const K = { custom: 'zy.custom', over: 'zy.overrides', rec: 'zy.records', set: 'zy.settings', thumbs: 'zy.thumbs', rulings: 'zy.rulings', pub: 'zy.published', missing: 'zy.missingAssets', approved: 'zy.approved' };
  const read = (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch (e) {
      return d;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      console.warn('localStorage 写入失败', e);
      return false;
    }
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  ZY.store = {
    custom() {
      return read(K.custom, []);
    },
    saveCustom(s, keepPos) {
      const list = this.custom();
      const i = list.findIndex((x) => x.id === s.id);
      if (keepPos && i >= 0) list[i] = s;
      else {
        if (i >= 0) list.splice(i, 1);
        list.unshift(s);
      }
      write(K.custom, list.slice(0, 30));
    },
    removeCustom(id) {
      write(K.custom, this.custom().filter((x) => x.id !== id));
      this.clearOverrides(id);
      this.unpublish(id);
      this.approve(id, false);
      const t = this.thumbs();
      delete t[id];
      write(K.thumbs, t);
    },
    fork(id) {
      const s = this.get(id);
      if (!s) return null;
      s.id = 'copy-' + Date.now().toString(36);
      s.title = s.title + '（副本）';
      s.forkOf = id;
      s.custom = true;
      s.createdAt = Date.now();
      this.saveCustom(s);
      return s;
    },
    all() {
      return this.custom().concat(ZY.scenarios);
    },
    raw(id) {
      return this.all().find((s) => s.id === id) || null;
    },
    get(id) {
      const s = this.raw(id);
      if (!s) return null;
      const c = clone(s);
      const ov = read(K.over, {})[id] || {};
      for (const nid in ov) {
        const node = c.nodes[nid];
        if (!node) continue;
        for (const cid in ov[nid]) {
          const ch = node.choices.find((x) => x.id === cid);
          if (ch) {
            const v = ov[nid][cid].verdict;
            if (v && v !== ch.verdict) ch.why = ZY.catalog.expertWhy(v, ch.why);
            Object.assign(ch, ov[nid][cid]);
            ch.reviewed = true;
          }
        }
      }
      return c;
    },
    overrides(id) {
      return read(K.over, {})[id] || {};
    },
    overrideCount(id) {
      const o = this.overrides(id);
      let n = 0;
      for (const k in o) n += Object.keys(o[k]).length;
      return n;
    },
    setOverride(id, nid, cid, patch) {
      const all = read(K.over, {});
      all[id] = all[id] || {};
      all[id][nid] = all[id][nid] || {};
      all[id][nid][cid] = Object.assign(all[id][nid][cid] || {}, patch);
      write(K.over, all);
    },
    clearOverrides(id) {
      const all = read(K.over, {});
      delete all[id];
      write(K.over, all);
    },
    records() {
      return read(K.rec, []);
    },
    addRecord(r) {
      const list = this.records();
      list.unshift(r);
      write(K.rec, list.slice(0, 200));
    },
    record(id) {
      return this.records().find((r) => r.id === id) || null;
    },
    settings() {
      return Object.assign({ quality: 'high', sound: true, apiMode: 'auto', baseUrl: '', apiKey: '', model: '' }, read(K.set, {}));
    },
    saveSettings(s) {
      write(K.set, s);
    },
    thumbs() {
      return read(K.thumbs, {});
    },
    saveThumb(id, url) {
      const t = this.thumbs();
      t[id] = url;
      if (!write(K.thumbs, t)) {
        write(K.thumbs, { [id]: url });
      }
    },
    dropThumb(id) {
      const t = this.thumbs();
      delete t[id];
      write(K.thumbs, t);
    },
    // 专家改判沉淀为企业判定库：同类场景再生成时优先沿用
    rulings() {
      return read(K.rulings, []);
    },
    addRuling(r) {
      const list = this.rulings().filter((x) => !(x.text === r.text && x.category === r.category));
      list.unshift(Object.assign({ at: Date.now() }, r));
      write(K.rulings, list.slice(0, 120));
    },
    // 安全专家对整套剧本的审核结论；剧本内容被修改后需要重新审核
    isApproved(id) {
      return !!read(K.approved, {})[id];
    },
    approve(id, on) {
      const a = read(K.approved, {});
      if (on) a[id] = { at: Date.now() };
      else delete a[id];
      write(K.approved, a);
    },
    published() {
      return read(K.pub, {});
    },
    isPublished(id) {
      return !!this.published()[id];
    },
    publish(id, info) {
      const p = this.published();
      p[id] = Object.assign({ at: Date.now() }, info);
      write(K.pub, p);
    },
    unpublish(id) {
      const p = this.published();
      delete p[id];
      write(K.pub, p);
    },
    missingAssets() {
      return read(K.missing, {});
    },
    noteMissing(list) {
      if (!list || !list.length) return;
      const m = this.missingAssets();
      list.forEach((u) => {
        m[u.text] = m[u.text] || { n: 0, fallback: u.fallback, asset: u.asset || null };
        m[u.text].n++;
        m[u.text].at = Date.now();
      });
      write(K.missing, m);
    }
  };
})();
