// Not Human landing v7: the room (light leaks and a flare that follow the pointer), the closing light field in plain
// 2D canvas (light on purpose: no 3D in the footer), and the minimisable glass panel that tunes the material live.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ---------------------------------------------------------------- the orb, the ring, the edge aura */
// the orb trails the pointer on a soft lag and blooms brighter while the pointer moves; with no pointer it drifts on
// its own and fades in and out, as the light in the reference passes behind the glass now and then
const ptr = { x: innerWidth / 2, y: innerHeight / 2, on: false, t: 0 };
const orb = { x: innerWidth / 2, y: innerHeight * .45, i: 0, v: 0 };
// speed (2026-10-22): the orb's variables go only to the elements that read them (.leak and .orb, in v7), never to :root,
// and only when they change: a custom property on :root restyles the whole page every frame. v8 on have neither element,
// so they write nothing; the 3D reads window.NHOrb.
const lit = [...document.querySelectorAll('.leak, .orb')], said = new Map();
const put = (k, v) => { if (said.get(k) === v) return; said.set(k, v); for (const el of lit) el.style.setProperty(k, v); };
addEventListener('pointermove', e => {
  orb.v = Math.min(1, orb.v + Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y) / 260);
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; ptr.t = performance.now();
  put('--mx', (e.clientX / innerWidth * 2 - 1).toFixed(3));
  put('--my', (e.clientY / innerHeight * 2 - 1).toFixed(3));
}, { passive: true });
document.addEventListener('pointerleave', () => { ptr.on = false; });
let lastO = performance.now();
const tickOrb = now => {
  const dt = Math.min(.05, (now - lastO) / 1000); lastO = now;
  const idle = !ptr.on || now - ptr.t > 4000;
  // v10 (window.NH_ORB_DRIFT = share of the pointer, 0..1): the light wanders on its own, slowly, and only leans toward the pointer
  const drift = +(window.NH_ORB_DRIFT || 0);
  const wx = innerWidth * (.5 + Math.sin(now / 5200) * .3 + Math.sin(now / 2900) * .06), wy = innerHeight * (.48 + Math.sin(now / 3700) * .22 + Math.cos(now / 4300) * .05);
  const tx = drift ? (idle ? wx : wx + (ptr.x - wx) * drift) : (idle ? innerWidth * (.5 + Math.sin(now / 5200) * .3) : ptr.x);
  const ty = drift ? (idle ? wy : wy + (ptr.y - wy) * drift) : (idle ? innerHeight * (.48 + Math.sin(now / 3700) * .22) : ptr.y);
  const k = reduced ? 1 : 1 - Math.pow(drift ? .25 : .02, dt);
  orb.x += (tx - orb.x) * k; orb.y += (ty - orb.y) * k;
  orb.v *= Math.pow(.25, dt);
  const target = idle ? .35 + .35 * Math.max(0, Math.sin(now / 2300)) : .55 + orb.v * .6;
  orb.i += (target - orb.i) * (1 - Math.pow(.1, dt));
  if (lit.length) { put('--ox', orb.x.toFixed(1) + 'px'); put('--oy', orb.y.toFixed(1) + 'px'); put('--orb-i', orb.i.toFixed(3)); }
  window.NHOrb = { x: orb.x / innerWidth, y: orb.y / innerHeight, i: orb.i };
  requestAnimationFrame(tickOrb);
};
if (!reduced) requestAnimationFrame(tickOrb);

/* ---------------------------------------------------------------- the closing light field: dots that catch the pointer's light */
const field = document.querySelector('.lightfield'), sec = field?.closest('section');
if (field) {
  const ctx = field.getContext('2d');
  let w = 0, h = 0, dpr = 1, on = false, lx = -1e4, ly = -1e4, tx = -1e4, ty = -1e4, idle = 0;
  const fit = () => { const r = field.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); w = r.width; h = r.height; field.width = w * dpr; field.height = h * dpr; };
  fit(); addEventListener('resize', fit);
  new IntersectionObserver(es => { on = es[0].isIntersecting; }).observe(field);
  sec.addEventListener('pointermove', e => { const r = field.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; idle = 0; }, { passive: true });
  sec.addEventListener('pointerleave', () => { tx = ty = -1e4; });
  const COL = [[156, 140, 255], [95, 210, 255], [255, 124, 200]];
  let last = performance.now();
  const frame = now => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (on) {
      idle += dt;
      // with no pointer, the light drifts slowly on its own along a figure of eight
      const auto = tx < -1e3 || idle > 3;
      const ax = w / 2 + Math.sin(now / 2600) * w * .32, ay = h * .45 + Math.sin(now / 1300) * h * .22;
      const gx = auto ? ax : tx, gy = auto ? ay : ty, k = reduced ? 1 : 1 - Math.pow(.002, dt);
      lx = lx < -1e3 ? gx : lx + (gx - lx) * k; ly = ly < -1e3 ? gy : ly + (gy - ly) * k;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      const S = w < 700 ? 22 : 30, x0 = (w % S) / 2, y0 = (h % S) / 2, R = Math.max(w, h) * .38;
      for (let y = y0; y < h; y += S) for (let x = x0; x < w; x += S) {
        const d = Math.hypot(x - lx, y - ly), f = Math.max(0, 1 - d / R), f2 = f * f;
        const c = COL[Math.floor((x / w) * 3) % 3];
        ctx.fillStyle = f2 > .02 ? `rgba(${Math.round(255 + (c[0] - 255) * (1 - f))},${Math.round(255 + (c[1] - 255) * (1 - f))},${Math.round(255 + (c[2] - 255) * (1 - f))},${(.08 + f2 * .9).toFixed(3)})` : 'rgba(255,255,255,.07)';
        ctx.beginPath(); ctx.arc(x, y, .8 + f2 * 1.9, 0, 6.283); ctx.fill();
      }
      // the light itself: a soft bloom where it is
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, R * .7);
      g.addColorStop(0, 'rgba(170,150,255,.18)'); g.addColorStop(.4, 'rgba(80,170,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------- the glass panel */
// v8 hands over its own settings (window.NH_PANEL): toggles (button rows), colours, knobs, apply and save
const EXT = window.NH_PANEL;
if (EXT) {
  const G = EXT.values;
  const p = document.createElement('aside');
  p.className = 'nh-panel' + (localStorage.getItem('nh-panel-min') === '0' ? '' : ' min');
  p.setAttribute('aria-label', 'Glass panel');
  const num = (k, st) => (+G[k]).toFixed(st < .1 ? 3 : 2);
  const field = ([k, a, b, st]) => `<label><span>${k}</span><span data-v="${k}">${num(k, st)}</span><input type="range" min="${a}" max="${b}" step="${st}" value="${G[k]}" data-k="${k}"></label>`;
  p.innerHTML = `<header><span><b>●</b> ${EXT.title}</span><span class="tog">${p.classList.contains('min') ? '+' : '–'}</span></header>
    <div class="body">
      ${EXT.toggles.map(([t, key, opts]) => `<h4>${t}</h4><div class="presets" data-t="${key}">${opts.map(v => `<button data-tv="${v}">${v}</button>`).join('')}</div>`).join('')}
      <div class="row">${EXT.colors.map(([t, k]) => `<label><span>${t}</span><input type="color" data-c="${k}" value="${G[k]}"></label>`).join('')}</div>
      ${EXT.knobs.map(([t, ks]) => `<h4>${t}</h4>` + ks.map(field).join('')).join('')}
      <div class="row"><button data-a="copy">Copy values</button><button data-a="reset">Reset</button></div>
    </div>`;
  document.body.append(p);
  const sync = () => {
    p.querySelectorAll('input[type=range]').forEach(i => { i.value = G[i.dataset.k]; p.querySelector(`[data-v="${i.dataset.k}"]`).textContent = num(i.dataset.k, +i.step); });
    p.querySelectorAll('input[type=color]').forEach(i => { i.value = G[i.dataset.c]; });
    p.querySelectorAll('[data-t]').forEach(row => row.querySelectorAll('button').forEach(b => b.classList.toggle('on', G[row.dataset.t] === b.dataset.tv)));
  };
  sync();
  p.querySelector('header').addEventListener('click', () => {
    p.classList.toggle('min'); p.querySelector('.tog').textContent = p.classList.contains('min') ? '+' : '–';
    try { localStorage.setItem('nh-panel-min', p.classList.contains('min') ? '1' : '0'); } catch (e) {}
  });
  p.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.k) { G[t.dataset.k] = +t.value; p.querySelector(`[data-v="${t.dataset.k}"]`).textContent = num(t.dataset.k, +t.step); }
    if (t.dataset.c) G[t.dataset.c] = t.value;
    EXT.apply(); EXT.save();
  });
  p.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tv) {
      const key = b.closest('[data-t]').dataset.t, tg = EXT.toggles.find(x => x[1] === key);
      G[key] = b.dataset.tv; if (tg[3]) tg[3](b.dataset.tv);
    }
    if (b.dataset.a === 'reset') EXT.reset();
    if (b.dataset.a === 'copy') { navigator.clipboard?.writeText(JSON.stringify(G, null, 1)); b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy values'; }, 1400); return; }
    sync(); EXT.apply(); EXT.save();
  });
}
const MODE = window.NH_MATERIAL, METAL = MODE === 'metal2', EDGE = MODE === 'dark';
const G = EDGE ? window.NH_EDGE : window.NH_GLASS;
if (G && !EXT) {
  const PRESETS = METAL ? {
    pearl:  { color: '#f4f4f8', metalness: .75, roughness: .185, iridescence: .89, iridescenceIOR: 1.76, envMapIntensity: 1.75, clearcoat: .42 },
    chrome: { color: '#ffffff', metalness: 1, roughness: .02, iridescence: .25, iridescenceIOR: 1.3, envMapIntensity: 1.6, clearcoat: 1 },
    satin:  { color: '#eeeef4', metalness: .85, roughness: .22, iridescence: .6, iridescenceIOR: 1.5, envMapIntensity: 1.2, clearcoat: .4 },
    opal:   { color: '#fbf6ff', metalness: .7, roughness: .12, iridescence: 1, iridescenceIOR: 1.8, envMapIntensity: 1.4, clearcoat: 1 },
  } : EDGE ? {
    vivid:  { tint: '#c9d4ff', body: .04, rim: .5, rimPower: 2.4, fringe: 1.0, chroma: .08, edge: .86, env: .45, spec: .3, orb: .8, orbSize: .09, inner: .3, grit: .035, glow: .3, glowWidth: .09, soft: .1 },
    crystal:{ tint: '#ffffff', body: .02, rim: .8, rimPower: 3.6, fringe: .7, chroma: .045, edge: .9, env: .9, spec: .6, orb: .9, orbSize: .07, inner: .3, glow: .25, glowWidth: .1, soft: .06 },
    smoke:  { tint: '#9aa0c8', body: .14, rim: .45, rimPower: 2, fringe: .45, chroma: .05, edge: .84, env: .35, spec: .25, orb: .9, orbSize: .11, inner: .8, glow: .5, glowWidth: .17, soft: .16 },
    prism:  { tint: '#e6dcff', body: .04, rim: .6, rimPower: 2.4, fringe: 1.2, chroma: .1, edge: .84, env: .5, spec: .35, orb: 1.1, orbSize: .1, inner: .6, glow: .6, glowWidth: .15, soft: .16 },
  } : {
    obsidian: { color: '#ffffff', attenuationColor: '#8f98ff', attenuationDistance: 1.4, thickness: 1.7, ior: 1.72, dispersion: 1.6, roughness: .05, iridescence: .55, envMapIntensity: 2.2 },
    prism:    { color: '#ffffff', attenuationColor: '#e1f9f2', attenuationDistance: 5, thickness: 2.8, ior: 1.58, dispersion: .8, roughness: .035, iridescence: .72, envMapIntensity: 1.65 },
    smoke:    { color: '#d9d6e6', attenuationColor: '#3a3550', attenuationDistance: .7, thickness: 2.2, ior: 1.5, dispersion: 1.1, roughness: .12, iridescence: .3, envMapIntensity: 2.6 },
    neon:     { color: '#ffffff', attenuationColor: '#ff6fd0', attenuationDistance: 1.8, thickness: 1.4, ior: 2.0, dispersion: 2.4, roughness: .03, iridescence: 1, envMapIntensity: 2.4 },
  };
  const KNOBS = EDGE ? [
    ['Glass', [['body', 0, .5, .005], ['rim', 0, 3, .01], ['rimPower', .8, 8, .05], ['fringe', 0, 4, .01], ['chroma', 0, .2, .002], ['edge', .6, .99, .005],
               ['env', 0, 3, .01], ['spec', 0, 4, .01], ['inner', 0, 2, .01], ['grit', 0, .3, .005], ['soft', 0, .4, .005], ['glow', 0, 2, .01], ['glowWidth', .03, .4, .005]]],
    ['Light', [['orb', 0, 4, .01], ['orbSize', .02, .3, .002], ['leak', 0, 2, .01], ['flare', 0, 2, .01], ['grain', 0, .3, .005]]],
  ] : METAL ? [
    ['Metal', [['metalness', 0, 1, .01], ['roughness', 0, .6, .005], ['iridescence', 0, 1, .01], ['iridescenceIOR', 1, 2.33, .01], ['clearcoat', 0, 1, .01], ['envMapIntensity', 0, 4, .05]]],
    ['Light', [['exposure', .4, 2.2, .01]]],
  ] : [
    ['Glass', [['thickness', 0, 5, .05], ['ior', 1, 2.33, .01], ['dispersion', 0, 4, .05], ['roughness', 0, .6, .005], ['attenuationDistance', .1, 8, .05],
               ['iridescence', 0, 1, .01], ['iridescenceIOR', 1, 2.33, .01], ['clearcoat', 0, 1, .01], ['envMapIntensity', 0, 5, .05]]],
    ['Light', [['exposure', .4, 2.2, .01], ['cursorLight', 0, 120, 1], ['leak', 0, 1.5, .01], ['flare', 0, 1.2, .01], ['grain', 0, .3, .005]]],
  ];
  if (!METAL) Object.assign(G, { leak: G.leak ?? 1, flare: G.flare ?? 1, grain: G.grain ?? .07 });
  const save = () => { try { localStorage.setItem(EDGE ? 'nh-edge' : 'nh-glass-' + MODE, JSON.stringify(G)); } catch (e) {} };
  function apply() {
    if (EDGE) {
      const map = { tint: 'uTint', body: 'uBody', rim: 'uRim', rimPower: 'uRimPow', fringe: 'uFringe', chroma: 'uChroma', edge: 'uEdge', env: 'uEnv', spec: 'uSpec', orb: 'uOrbGain', orbSize: 'uOrbSize', inner: 'uInner', grit: 'uGrit', soft: 'uSoft', glow: 'uGlow', glowWidth: 'uGlowW' };
      for (const m of window.NHMats || []) if (m.uniforms) for (const [k, u] of Object.entries(map)) { if (!m.uniforms[u]) continue; if (k === 'tint') m.uniforms[u].value.set(G.tint); else m.uniforms[u].value = +(G[k] ?? m.uniforms[u].value); }
      root.style.setProperty('--leak', G.leak); root.style.setProperty('--flare', G.flare); root.style.setProperty('--grain', G.grain);
      return;
    }
    for (const m of window.NHMats || []) {
      for (const k of ['thickness', 'ior', 'dispersion', 'roughness', 'attenuationDistance', 'iridescence', 'iridescenceIOR', 'clearcoat', 'envMapIntensity', 'metalness']) if (G[k] !== undefined && k in m) m[k] = +G[k];
      m.color.set(G.color); if (G.attenuationColor) m.attenuationColor.set(G.attenuationColor); m.needsUpdate = true;
    }
    for (const r of window.NHRenderers || []) r.toneMappingExposure = +G.exposure;
    for (const l of window.NHLights || []) l.intensity = +G.cursorLight;
    if (!METAL) { root.style.setProperty('--leak', G.leak); root.style.setProperty('--flare', G.flare); root.style.setProperty('--grain', G.grain); }
  }
  const p = document.createElement('aside');
  p.className = 'nh-panel' + (localStorage.getItem('nh-panel-min') === '0' ? '' : ' min');
  p.setAttribute('aria-label', 'Glass panel');
  const field = ([k, a, b, st]) => `<label><span>${k}</span><span data-v="${k}">${(+G[k]).toFixed(st < .1 ? 3 : 2)}</span><input type="range" min="${a}" max="${b}" step="${st}" value="${G[k]}" data-k="${k}"></label>`;
  p.innerHTML = `<header><span><b>●</b> ${METAL ? 'Metal' : 'Glass'}</span><span class="tog">${p.classList.contains('min') ? '+' : '–'}</span></header>
    <div class="body">
      <div class="presets">${Object.keys(PRESETS).map(n => `<button data-p="${n}">${n}</button>`).join('')}</div>
      <div class="row"><label><span>Tint</span><input type="color" data-c="${EDGE ? 'tint' : 'color'}" value="${EDGE ? G.tint : G.color}"></label>${METAL || EDGE ? '' : `<label><span>Inside</span><input type="color" data-c="attenuationColor" value="${G.attenuationColor}"></label>`}</div>
      ${KNOBS.map(([t, ks]) => `<h4>${t}</h4>` + ks.map(field).join('')).join('')}
      <div class="row"><button data-a="copy">Copy values</button><button data-a="reset">Reset</button></div>
    </div>`;
  document.body.append(p);
  const sync = () => {
    p.querySelectorAll('input[type=range]').forEach(i => { i.value = G[i.dataset.k]; p.querySelector(`[data-v="${i.dataset.k}"]`).textContent = (+G[i.dataset.k]).toFixed(+i.step < .1 ? 3 : 2); });
    p.querySelectorAll('input[type=color]').forEach(i => { i.value = G[i.dataset.c]; });
  };
  p.querySelector('header').addEventListener('click', () => {
    p.classList.toggle('min'); p.querySelector('.tog').textContent = p.classList.contains('min') ? '+' : '–';
    try { localStorage.setItem('nh-panel-min', p.classList.contains('min') ? '1' : '0'); } catch (e) {}
  });
  p.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.k) { G[t.dataset.k] = +t.value; p.querySelector(`[data-v="${t.dataset.k}"]`).textContent = (+t.value).toFixed(+t.step < .1 ? 3 : 2); }
    if (t.dataset.c) G[t.dataset.c] = t.value;
    apply(); save();
  });
  p.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.p) { Object.assign(G, PRESETS[b.dataset.p]); p.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', x === b)); }
    if (b.dataset.a === 'reset') { try { localStorage.removeItem(EDGE ? 'nh-edge' : 'nh-glass-' + MODE); } catch (e) {} if (EDGE) Object.assign(G, PRESETS.vivid, { leak: 1, flare: 1, grain: .07 }); else Object.assign(G, METAL ? Object.assign({}, PRESETS.pearl, { exposure: 1.02 }) : Object.assign({}, PRESETS.obsidian, { clearcoat: 1, iridescenceIOR: 1.35, exposure: 1.1, cursorLight: 30, leak: 1, flare: .55, grain: .09 })); }
    if (b.dataset.a === 'copy') { navigator.clipboard?.writeText(JSON.stringify(G, null, 1)); b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy values'; }, 1400); return; }
    sync(); apply(); save();
  });
  // the materials are created by landing-nh3.js; apply once they exist
  const wait = () => (window.NHMats || []).length ? apply() : requestAnimationFrame(wait);
  wait();
}
