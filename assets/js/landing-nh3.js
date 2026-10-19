// Not Human landing v3: the mark as a 3D object (three.js), scroll told with GSAP ScrollTrigger, Lenis smooth scroll.
// Hero: one sphere unravels into the lattice, the letter's nodes stay big while the rest fall back, rods draw the N,
// a two-axis turn shows the H, the camera goes in close, and it all collapses into one dot on the red.
// How it works: the mark holds the left on cream while the steps pass as cards, each with its own 3D shape.
// The surface is matte and velvety with a fine grain, lit warm from the top left, as in the reference.
// Everything reads without this file: the stages, cards and lists are plain HTML.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const io = t => t < .5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;    // power4 in-out: turns that never swing
const o3 = t => 1 - (1 - t) ** 3;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
const wide = () => innerWidth >= 900;

/* ---------------------------------------------------------------- smooth scroll */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ duration: 1.1, smoothWheel: true }); window.NHLenis = lenis;   // v10: the leak layer stops and restarts it
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
/* the veil: the loader, and the page transition between sections and pages, with the mark looping on the red */
const veil = document.querySelector('.veil'), veilCv = document.querySelector('.veil-mark');
let veilBusy = false;
const cover = () => gsap.fromTo(veil, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .75, ease: 'power4.inOut' });
const uncover = (delay = 0) => gsap.to(veil, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'power4.inOut', delay });
if (veil && !reduced) uncover(1.25); else if (veil) veil.style.display = 'none';
function goTo(el) {
  if (reduced || !veil || veilBusy) { lenis ? lenis.scrollTo(el, { immediate: true }) : el.scrollIntoView(); return; }
  veilBusy = true;
  cover().then(() => {
    lenis ? lenis.scrollTo(el, { immediate: true, force: true }) : el.scrollIntoView();
    ScrollTrigger.update();
    uncover(.3).then(() => { veilBusy = false; });
  });
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const el = document.querySelector(a.getAttribute('href'));
  if (!el) return;
  e.preventDefault(); goTo(el);
}));
// another page: the veil comes up, then the browser goes
$$('a[href$=".html"]').forEach(a => a.addEventListener('click', e => {
  if (reduced || !veil || e.metaKey || e.ctrlKey || e.shiftKey || (a.target && a.target !== '_self')) return;
  e.preventDefault(); cover().then(() => { location.href = a.href; });
}));
addEventListener('pageshow', e => { if (e.persisted && veil) gsap.set(veil, { clipPath: 'inset(0% 0% 100% 0%)' }); });

/* ---------------------------------------------------------------- scrambled text: letters resolve left to right through a band of noise */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#&*+=/<>';
function prepScramble(el) {
  if (el._chars) return;
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  el._chars = [...text].map(ch => { const s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); s._c = ch; el.append(s); return s; });
}
function scramble(el, dur = 1100) {
  prepScramble(el);
  const cs = el._chars, n = cs.length;
  if (reduced) { cs.forEach(s => { s.textContent = s._c; s.style.visibility = ''; }); return; }
  cancelAnimationFrame(el._raf);
  const t0 = performance.now(), band = 9;
  const step = now => {
    const front = Math.floor(seg(now, t0, t0 + dur) * (n + band));
    cs.forEach((s, i) => {
      if (i < front - band) { if (s.textContent !== s._c) s.textContent = s._c; s.style.visibility = ''; }
      else if (i < front) { s.style.visibility = ''; if (s._c !== ' ') s.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
      else s.style.visibility = 'hidden';
    });
    if (front < n + band) el._raf = requestAnimationFrame(step);
  };
  el._raf = requestAnimationFrame(step);
}
$$('[data-scramble], [data-scramble-scroll]').forEach(prepScramble);
$$('[data-scramble-scroll]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: () => scramble(el, 2200) }));

/* ---------------------------------------------------------------- the about sentence: focus brackets travel it, the rest stays soft (as on v2) */
const focusEl = document.querySelector('[data-focus]'), focusSec = focusEl?.closest('section');
let fws = [], fbox = null, fLast = -1;
if (focusEl && !reduced) {
  const words = focusEl.textContent.trim().split(/\s+/);
  focusEl.setAttribute('aria-label', focusEl.textContent.trim()); focusEl.textContent = '';
  fws = words.map((w, i) => { const s = document.createElement('span'); s.className = 'fw'; s.textContent = w; s.setAttribute('aria-hidden', 'true'); focusEl.append(s); if (i < words.length - 1) focusEl.append(' '); return s; });
  fbox = document.createElement('span'); fbox.className = 'focus-box'; fbox.setAttribute('aria-hidden', 'true'); fbox.innerHTML = '<i></i><i></i><i></i><i></i>'; focusEl.append(fbox);
}
function onFocus() {
  if (!fws.length) return;
  const r = focusSec.getBoundingClientRect(), vh = innerHeight;
  // phones (v10): the reading starts when the sentence has come a third of the way up the screen, and ends before it leaves the top
  const er = window.NH_READ && !wide() ? focusEl.getBoundingClientRect() : null;
  const p = wide() ? clamp(-r.top / Math.max(1, r.height - vh)) : er ? clamp((vh * window.NH_READ - er.top) / Math.max(1, er.height + vh * (window.NH_READ - .3))) : clamp((vh * .8 - r.top) / Math.max(1, r.height));
  const idx = Math.min(fws.length - 1, Math.floor(p * fws.length));
  if (idx === fLast) return; fLast = idx;
  const w = fws[idx];
  fbox.style.transform = `translate(${w.offsetLeft}px, ${w.offsetTop}px)`; fbox.style.width = w.offsetWidth + 'px'; fbox.style.height = w.offsetHeight + 'px';
  fws.forEach((f, i) => { const d = Math.max(0, Math.abs(i - idx) - 3); f.style.setProperty('--b', Math.min(d * .35, 2).toFixed(2) + 'px'); f.style.setProperty('--o', (1 - Math.min(d * .04, .4)).toFixed(2)); });
}

/* ---------------------------------------------------------------- the pointer, smoothed: everything 3D leans toward it */
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
document.addEventListener('pointerleave', () => { ptr.tx = ptr.ty = 0; });

/* ---------------------------------------------------------------- the surface: matte, velvety, a fine grain */
// one grain texture for every object: value noise at two scales, used as a bump and a roughness map
function grainTexture() {
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(N, N);
  const rnd = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = rnd(x, y) * .55 + rnd(x >> 2, y >> 2) * .3 + rnd(x >> 4, y >> 4) * .15, v = 112 + c * 40, i = (y * N + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 3);
  return tex;
}
// v5: one holographic glass for every mark (after Assets/glass-forge-reference.html, preset "prism": clearcoat,
// IOR 1.58, a strong iridescent film) on a pearl metallic base, so it reads the same on any background
const DARK = window.NH_MATERIAL === 'dark';                       // v7: dark glass on black
const METAL2 = window.NH_MATERIAL === 'metal2';                   // v5b: a finer holographic metal
const GLASS = window.NH_MATERIAL === 'glass' || DARK, HOLO = window.NH_MATERIAL === 'holo' || METAL2 || GLASS;
// v7's control panel reaches every live material, renderer and cursor light through these
window.NHMats = window.NHMats || []; window.NHRenderers = window.NHRenderers || []; window.NHLights = window.NHLights || [];
// v7 defaults: dark, clear glass with bright rims and strong dispersion, as in the owner's references
window.NH_GLASS = Object.assign(METAL2
  ? { color: '#f4f4f8', metalness: .75, roughness: .185, clearcoat: .42, clearcoatRoughness: .03, iridescence: .89, iridescenceIOR: 1.76, envMapIntensity: 1.75, exposure: 1 }   // owner's values, 2026-10-18
  : { color: '#ffffff', attenuationColor: '#d9d7ff', attenuationDistance: 3.2, thickness: 1.4, ior: 1.72,
  dispersion: 2.2, roughness: .04, clearcoat: 1, iridescence: .5, iridescenceIOR: 1.35, envMapIntensity: 2.6, exposure: 1.1, cursorLight: 30 },
  (() => { try { return JSON.parse(localStorage.getItem('nh-glass-' + window.NH_MATERIAL) || '{}'); } catch (e) { return {}; } })());
let HOLO_MAT = null;
// the glass itself, as in the reference lab's "prism" preset: full transmission, IOR 1.58, thickness 2.8, dispersion .8,
// a faint mint attenuation, clearcoat, iridescence .72. What gives it contrast is what it reflects (holoEnvironment).
function holoMaterial() {
  if (METAL2) {
    if (HOLO_MAT) return HOLO_MAT;
    const g = window.NH_GLASS;
    HOLO_MAT = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(g.color), metalness: g.metalness, roughness: g.roughness, clearcoat: g.clearcoat,
      clearcoatRoughness: g.clearcoatRoughness, iridescence: g.iridescence, iridescenceIOR: g.iridescenceIOR, iridescenceThicknessRange: [140, 720], envMapIntensity: g.envMapIntensity });
    window.NHMats.push(HOLO_MAT);
    return HOLO_MAT;
  }
  if (!GLASS) return HOLO_MAT || (HOLO_MAT = new THREE.MeshPhysicalMaterial({   // v5: pearl metal
    color: 0xF5F5FA, metalness: .9, roughness: .1, clearcoat: 1, clearcoatRoughness: .02, ior: 1.58, reflectivity: .62,
    iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 680], envMapIntensity: 1.55,
  }));
  if (DARK) {
    if (HOLO_MAT) return HOLO_MAT;
    HOLO_MAT = edgeGlassMaterial(); window.NHMats.push(HOLO_MAT);
    return HOLO_MAT;
  }
  return HOLO_MAT || (HOLO_MAT = new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF, transmission: 1, thickness: 3.2, ior: 1.58, dispersion: .8, roughness: .035, metalness: 0,
    attenuationColor: new THREE.Color(0xD2EEF6), attenuationDistance: 3.5, reflectivity: .62, envMapIntensity: 1.65,
    clearcoat: 1, clearcoatRoughness: .02, iridescence: .72, iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 520],
  }));
}
/* v7: edge glass. The reference glass is almost invisible: a clear body that lets the page through, drawn by thin bright
   rims with red-green-blue fringes, sharp white glints from a black studio, and a light orb that blooms through it,
   split into colour. This shader does exactly that, cheaply, over HTML (no scene behind it to refract). */
window.NH_EDGE = Object.assign({ tint: '#c9d4ff', body: .04, rim: .5, rimPower: 2.4, fringe: 1.0, chroma: .08, edge: .86, env: .45, spec: .3,
  orb: .8, orbSize: .09, inner: .3, grit: .035, glow: .3, glowWidth: .09, soft: .1 }, (() => { try { return JSON.parse(localStorage.getItem('nh-edge') || '{}'); } catch (e) { return {}; } })());
window.NHOrb = window.NHOrb || { x: .5, y: .5, i: 0 };
// the halo: an additive shell. Its glow peaks where the ray grazes the real surface (the silhouette of the inner
// form) and spreads both ways, split into red outside and blue inside, so the edge blooms into the background as in the
// reference. It brightens on the side that faces the orb. Shells: nodes are 1.35× (peak near ndv .67), rods 1.6× (.78).
const HALO = {};
function haloMaterial(kind) {
  if (HALO[kind]) return HALO[kind];
  const e = window.NH_EDGE;
  const m = new THREE.ShaderMaterial({
    // max blending: overlapping shells (the 27 nodes stacked in the dot, the depth rows of a flat letter) never add up
    transparent: true, depthWrite: false, toneMapped: false, side: THREE.FrontSide,
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: { uRod: { value: kind === 'rod' ? 1 : 0 }, uPeak: { value: kind === 'rod' ? .78 : .67 }, uGlow: { value: e.glow }, uGlowW: { value: e.glowWidth }, uChroma: { value: e.chroma },
      uTint: { value: new THREE.Color(e.tint) }, uOrb: { value: new THREE.Vector3(.5, .5, 0) }, uView: { value: new THREE.Vector4(0, 0, 1, 1) }, uOrbGain: { value: e.orb } },
    vertexShader: /* glsl */`
      uniform float uRod;
      varying vec3 vN; varying vec3 vW; varying vec3 vA;
      void main() {
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = m * instanceMatrix;
        #endif
        vec4 w = m * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(m) * normal);
        vA = uRod > .5 ? normalize(mat3(m) * vec3(0.0, 1.0, 0.0)) : vec3(0.0);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uPeak, uGlow, uGlowW, uChroma, uOrbGain, uRod; uniform vec3 uTint, uOrb; uniform vec4 uView;
      varying vec3 vN; varying vec3 vW; varying vec3 vA;
      float g(float x, float c, float w) { float d = (x - c) / w; return exp(-d * d); }
      void main() {
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        float ndv = abs(dot(N, V));
        if (dot(vA, vA) > .5) ndv /= max(.15, length(V - vA * dot(V, vA)));   // a tilted rod: measure across it
        float w = uGlowW, s = uChroma * 1.6;
        // red spreads outward (lower ndv), blue inward: a soft, wide colour split around the real edge
        vec3 c = vec3(g(ndv, uPeak - s, w * 1.1), g(ndv, uPeak, w), g(ndv, uPeak + s, w * .9));
        c *= mix(vec3(1.0), uTint, .35) * smoothstep(0.0, .35, ndv);
        vec2 sp = (gl_FragCoord.xy - uView.xy) / uView.zw;
        float side = clamp(dot(normalize(uOrb.xy - sp + 1e-4), normalize(N.xy + 1e-4)) * .5 + .5, 0.0, 1.0);
        c *= .55 + side * (.45 + uOrb.z * uOrbGain * .9);
        gl_FragColor = vec4(c * uGlow * (uRod > .5 ? .55 : 1.0), 0.0);   // alpha 0: the page composites it as added light
      }`,
  });
  HALO[kind] = m; window.NHMats.push(m);
  return m;
}
// the shader reads the screen from gl_FragCoord: tell it where this canvas sits, in drawing-buffer pixels
function edgeView(renderer, cv, camera) {
  if (!DARK || !HOLO_MAT || !HOLO_MAT.uniforms) return;
  const d = renderer.getPixelRatio(), r = cv.getBoundingClientRect();
  HOLO_MAT.uniforms.uView.value.set(-r.left * d, -(innerHeight - r.bottom) * d, innerWidth * d, innerHeight * d);
  for (const h of Object.values(HALO)) h.uniforms.uView.value.copy(HOLO_MAT.uniforms.uView.value);
  if (camera) HOLO_MAT.uniforms.uLight.value.copy(camera.position).add(new THREE.Vector3(ptr.x * 3, -ptr.y * 2.4, -camera.position.z * .45));
}
function edgeGlassMaterial() {
  const e = window.NH_EDGE;
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    // max blending: the glass is only light, so stacked nodes (27 in the dot) and crossing rods never pile up into a solid
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: {
      uTint: { value: new THREE.Color(e.tint) }, uBody: { value: e.body }, uRim: { value: e.rim }, uRimPow: { value: e.rimPower },
      uFringe: { value: e.fringe }, uChroma: { value: e.chroma }, uEdge: { value: e.edge }, uEnv: { value: e.env }, uSpec: { value: e.spec },
      uOrb: { value: new THREE.Vector3(.5, .5, 0) }, uOrbGain: { value: e.orb }, uOrbSize: { value: e.orbSize }, uInner: { value: e.inner },
      uLight: { value: new THREE.Vector3(0, 0, 4) }, uView: { value: new THREE.Vector4(0, 0, 1, 1) }, uTime: { value: 0 }, uGrit: { value: e.grit }, uSoft: { value: e.soft },
    },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vW; varying vec3 vA;
      void main() {
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = m * instanceMatrix;
        #endif
        vec4 w = m * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(m) * normal);
        #ifdef USE_INSTANCING
          vA = vec3(0.0);
        #else
          vA = normalize(mat3(m) * vec3(0.0, 1.0, 0.0));   // a rod: its axis
        #endif
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTint; uniform float uBody, uRim, uRimPow, uFringe, uChroma, uEdge, uEnv, uSpec, uOrbGain, uOrbSize, uInner, uTime, uGrit, uSoft;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      uniform vec3 uOrb; uniform vec3 uLight; uniform vec4 uView;
      varying vec3 vN; varying vec3 vW; varying vec3 vA;
      // a black studio: a few long thin white strips and two faint coloured panels, all analytic
      float strip(vec3 r, vec3 axis, float w) { return smoothstep(1.0 - w, 1.0, abs(dot(r, axis))); }
      vec3 studio(vec3 r) {
        float s = 0.0;
        s += smoothstep(.9, 1.0, dot(r, normalize(vec3(-.55, .72, .42)))) * 1.2;              // key softbox, top left, broad and soft
        s += (1.0 - smoothstep(.0, .14, abs(r.y - .58))) * smoothstep(.1, .6, -r.x) * .45;      // a long soft strip high on the left
        s += (1.0 - smoothstep(.0, .1, abs(r.x - .72))) * smoothstep(-.2, .4, r.y) * .35;       // a tall soft one on the right
        vec3 c = vec3(s);
        c += vec3(.45, .25, 1.0) * smoothstep(.93, 1.0, dot(r, normalize(vec3(-.8, -.3, -.4)))) * .5;
        c += vec3(.2, .7, 1.0) * smoothstep(.95, 1.0, dot(r, normalize(vec3(.7, -.5, -.3)))) * .45;
        return c;
      }
      float band(float f, float c, float w) { float d = (f - c) / w; return exp(-d * d); }
      void main() {
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        if (!gl_FrontFacing) N = -N;
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        if (dot(vA, vA) > .5) ndv = clamp(ndv / max(.15, length(V - vA * dot(V, vA))), 0.0, 1.0);   // a tilted rod: its edge, not its slope
        float f = 1.0 - ndv;
        // the rim: white, then a thin band split into red (outside), green, blue (inside)
        // the side that faces the orb catches more light: moving shapes change how their edges light up
        vec2 sp0 = (gl_FragCoord.xy - uView.xy) / uView.zw;
        float side = clamp(dot(normalize(uOrb.xy - sp0 + 1e-4), normalize(N.xy + 1e-4)) * .5 + .5, 0.0, 1.0);
        float lit = .55 + side * (.45 + uOrb.z * uOrbGain * .8);
        vec3 col = vec3(pow(f, uRimPow)) * uRim * lit;
        float c0 = uEdge, bw = .05 + uSoft;
        col += vec3(band(f, c0 + uChroma, bw * 1.2), band(f, c0, bw), band(f, c0 - uChroma, bw * .9)) * uFringe * lit;
        // a cool glow inside the edge, so the glass merges with the dark instead of being outlined
        col += uTint * pow(f, 1.6) * uInner * .5;
        // glints from the studio, stronger toward the edge
        vec3 R = reflect(-V, N);
        col += studio(R) * uEnv * (.25 + .75 * f);
        // the cursor light: a sharp highlight
        vec3 L = normalize(uLight - vW), H = normalize(L + V);
        // soft, as in the reference: a small round highlight and a wide faint sheen
        col += vec3(pow(max(dot(N, H), 0.0), 24.0)) * uSpec * .35 + vec3(pow(max(dot(N, H), 0.0), 6.0)) * uSpec * .06;   // broad and soft: no hard dot
        // the orb behind: it blooms through the glass, bent toward the rim and split into colour
        vec2 sp = (gl_FragCoord.xy - uView.xy) / uView.zw;
        float asp = uView.z / uView.w;
        vec2 bend = N.xy * (.03 + .09 * f);
        vec2 o = uOrb.xy;
        float dr = length((sp + bend * (1.0 + uChroma * 4.0) - o) * vec2(asp, 1.0));
        float dg = length((sp + bend - o) * vec2(asp, 1.0));
        float db = length((sp + bend * (1.0 - uChroma * 4.0) - o) * vec2(asp, 1.0));
        float s2 = uOrbSize * uOrbSize;
        vec3 orb = vec3(exp(-dr * dr / s2), exp(-dg * dg / s2), exp(-db * db / s2)) * uOrb.z * uOrbGain;
        col += orb * (.12 + 1.4 * f * f);   // through the middle only a little; it gathers at the rim
        // the inner reflection: a faint inverted rim on the far side, as a thick lens gives
        // fine grain in the glass itself: one hash per pixel, animated, almost free
        float gr = (hash(floor(gl_FragCoord.xy)) - .5) * uGrit;   // fixed grain: the same every frame
        col += gr * (.4 + f);
        float a = clamp(uBody + dot(col, vec3(.3333)) * .9, 0.0, 1.0);
        gl_FragColor = vec4(col * mix(vec3(1.0), uTint, .25), a);
      }`,
  });
}
// a pearl room with soft holographic bands and two white panels: what the glass reflects
function darkEnvironment(renderer) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: 0x020203, side: THREE.BackSide })));
  const strip = (x, y, z, w, h, c, k = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  strip(-5, 5, 4, 7, .5, 0xFFFFFF, 3);   // a long white strip high on the left: the bright rim
  strip(6, .5, 2, .4, 8, 0xFFFFFF, 2);   // a tall thin one on the right
  strip(-6, -2, -2, 2, 1.5, 0x7A3CFF, 1.2); // violet
  strip(4, -4, -4, 2, 1, 0x22B8FF, 1.2);  // cyan
  strip(0, -6, 3, 6, 1, 0xFF4F9A, 1.2);   // magenta from below
  strip(2, 6, -5, 3, 1, 0xFFB15A, 1.2);   // amber
  return new THREE.PMREMGenerator(renderer).fromScene(env, .02).texture;
}
function studioEnvironment(renderer) {
  // a smooth chrome studio: white sky, a crisp dark horizon (the contrast), a grey-violet floor, two soft softboxes,
  // and a thin holographic tint along the horizon. Smooth gradients, no stripes, so the metal reads fine, not chunky.
  const W = 2048, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, H);
  v.addColorStop(0, '#FFFFFF'); v.addColorStop(.38, '#F3F2F8'); v.addColorStop(.47, '#C9C6D8'); v.addColorStop(.495, '#2A2838');
  v.addColorStop(.52, '#4A4760'); v.addColorStop(.7, '#8A879C'); v.addColorStop(1, '#5A576C');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  const band = g.createLinearGradient(0, 0, W, 0);
  ['#FFC9EC', '#CFC8FF', '#BFEFFF', '#D4FFEA', '#FFE9C9', '#FFC9EC'].forEach((c, i, a) => band.addColorStop(i / (a.length - 1), c));
  g.globalAlpha = .55; g.fillStyle = band; g.fillRect(0, H * .455, W, H * .03); g.globalAlpha = 1;
  g.filter = 'blur(18px)'; g.fillStyle = '#FFFFFF';
  g.fillRect(W * .12, H * .12, W * .16, H * .24); g.fillRect(W * .62, H * .2, W * .1, H * .2);
  g.filter = 'none';
  const tex = new THREE.CanvasTexture(cv); tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  const env = new THREE.PMREMGenerator(renderer).fromEquirectangular(tex).texture; tex.dispose();
  return env;
}
function holoEnvironment(renderer) {
  if (DARK) return darkEnvironment(renderer);
  if (METAL2) return studioEnvironment(renderer);
  const env = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 64, 32), col = [], p = geo.attributes.position, c = new THREE.Color();
  // dark bands give the metal its contrast, as in a chrome studio; the light ones carry the holographic tint
  const bands = [[-1, 0x2C2A3A], [-.45, 0x8E8CA6], [-.2, 0xFFC9EC], [0, 0xCFC8FF], [.12, 0x1E1D29], [.24, 0xBFEFFF], [.48, 0xD4FFEA], [.7, 0x3A3850], [1, 0xFFFFFF]];
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 10, a = Math.atan2(p.getZ(i), p.getX(i)) / Math.PI * .18;
    const t = clamp(y + a, -1, 1);
    let k = 0; while (k < bands.length - 2 && t > bands[k + 1][0]) k++;
    const [t0, c0] = bands[k], [t1, c1] = bands[k + 1];
    c.set(c0).lerp(new THREE.Color(c1), clamp((t - t0) / (t1 - t0))); col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  env.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  for (const [x, y, z, w, h] of [[-4, 4, 5, 6, 3], [5, 1, -3, 3, 7]]) {
    const pnl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    pnl.position.set(x, y, z); pnl.lookAt(0, 0, 0); env.add(pnl);
  }
  return new THREE.PMREMGenerator(renderer).fromScene(env, .02).texture;
}
// v6: real glass refracts what is behind it, and our canvases are clear. So each glass scene carries a backdrop
// fixed to its camera that only the refraction pass sees (it writes no colour to the page): holographic light,
// dark bands and our dot grid, so the glass has something with contrast to bend.
let BACKDROP_TEX = null;
function backdropTexture() {
  if (BACKDROP_TEX) return BACKDROP_TEX;
  const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d');
  if (DARK) {
    // black, with coloured light pools and a few thin bright lines: what the dark glass bends into its fringes
    g.fillStyle = '#030305'; g.fillRect(0, 0, N, N);
    for (const [x, y, r, c] of [[.18, .2, .4, '#5B2CFF'], [.85, .3, .35, '#1E8BFF'], [.6, .85, .4, '#FF3D8E'], [.1, .8, .25, '#FF9A3D']]) {
      const rg = g.createRadialGradient(x * N, y * N, 0, x * N, y * N, r * N); rg.addColorStop(0, c + '55'); rg.addColorStop(1, c + '00');
      g.fillStyle = rg; g.fillRect(0, 0, N, N);
    }
    g.save(); g.translate(N / 2, N / 2); g.rotate(-.5);
    for (const [o, w] of [[-.4, .006], [-.12, .003], [.15, .008], [.38, .003]]) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(-N, o * N, N * 2, w * N); }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.35)';
    for (let y = 32; y < N; y += 64) for (let x = 32; x < N; x += 64) { g.beginPath(); g.arc(x, y, 2.4, 0, 6.283); g.fill(); }
    BACKDROP_TEX = new THREE.CanvasTexture(cv); BACKDROP_TEX.colorSpace = THREE.SRGBColorSpace;
    BACKDROP_TEX.wrapS = BACKDROP_TEX.wrapT = THREE.RepeatWrapping; BACKDROP_TEX.repeat.set(2, 2);
    return BACKDROP_TEX;
  }
  const base = g.createLinearGradient(0, 0, N, N);
  base.addColorStop(0, '#FFFFFF'); base.addColorStop(.3, '#F1E6FF'); base.addColorStop(.55, '#DDF3FF'); base.addColorStop(.8, '#E6FFF3'); base.addColorStop(1, '#FFE6F5');
  g.fillStyle = base; g.fillRect(0, 0, N, N);
  for (const [x, y, r, c] of [[.2, .25, .35, '#FFB8E6'], [.8, .3, .3, '#B9C8FF'], [.6, .8, .35, '#A8F0D8'], [.15, .85, .25, '#D7C2FF']]) {
    const rg = g.createRadialGradient(x * N, y * N, 0, x * N, y * N, r * N); rg.addColorStop(0, c); rg.addColorStop(1, c + '00');
    g.fillStyle = rg; g.fillRect(0, 0, N, N);
  }
  g.save(); g.translate(N / 2, N / 2); g.rotate(-.5);
  for (const [o, w, col] of [[-.46, .008, '#16151C'], [-.33, .014, '#2A2840'], [-.18, .004, '#16151C'], [-.04, .02, '#22213A'], [.1, .005, '#16151C'], [.24, .012, '#2A2840'], [.37, .004, '#16151C'], [.45, .01, '#22213A']]) {
    g.fillStyle = col; g.fillRect(-N, o * N, N * 2, w * N);
  }
  g.restore();
  g.fillStyle = 'rgba(22,21,28,.6)';
  for (let y = 32; y < N; y += 64) for (let x = 32; x < N; x += 64) { g.beginPath(); g.arc(x, y, 3, 0, 6.283); g.fill(); }
  BACKDROP_TEX = new THREE.CanvasTexture(cv); BACKDROP_TEX.colorSpace = THREE.SRGBColorSpace;
  BACKDROP_TEX.wrapS = BACKDROP_TEX.wrapT = THREE.RepeatWrapping; BACKDROP_TEX.repeat.set(3, 3);   // finer: the glass bends many thin lines, not one wide band
  return BACKDROP_TEX;
}
function glassBackdrop(scene, camera, dist = 30) {
  if (!GLASS || DARK) return;   // v7's edge glass draws its own light; nothing to refract
  const m = new THREE.Mesh(new THREE.PlaneGeometry(dist * 2.4, dist * 2.4), new THREE.MeshBasicMaterial({ map: backdropTexture(), depthWrite: false, toneMapped: false }));
  m.position.set(0, 0, -dist); m.renderOrder = -10; m.frustumCulled = false;
  m.onBeforeRender = (renderer) => { m.material.colorWrite = renderer.getRenderTarget() !== null; };
  camera.add(m); if (!camera.parent) scene.add(camera);
}
window.NHGlassBackdrop = glassBackdrop;
window.NHHoloEnv = holoEnvironment;
window.NHHoloMaterial = holoMaterial;   // the closing field shares the one material when it can   // the closing field (landing-nh4.js) reflects the same room
let GRAIN = null;
function clayMaterial(color = 0xF27A34, sheen = 0xFFB878) {
  if (HOLO) return holoMaterial();
  GRAIN = GRAIN || grainTexture();
  return new THREE.MeshPhysicalMaterial({ color, roughness: .84, metalness: 0, sheen: .55, sheenRoughness: .55, sheenColor: new THREE.Color(sheen),
    bumpMap: GRAIN, bumpScale: 2.6, roughnessMap: GRAIN, envMapIntensity: .1 });
}
// warm key from the top left, a red bounce from below, a soft environment for the velvet edge
function lightScene(scene, renderer) {
  window.NHRenderers.push(renderer);
  if (METAL2) { scene.environment = holoEnvironment(renderer); renderer.toneMappingExposure = window.NH_GLASS.exposure; scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xD8DCE8, .35)); return; }
  if (DARK) {
    scene.environment = holoEnvironment(renderer);
    renderer.toneMappingExposure = window.NH_GLASS.exposure;
    const cur = new THREE.PointLight(0xFFFFFF, window.NH_GLASS.cursorLight, 0, 1.4); cur.position.set(0, 0, 4); scene.add(cur); window.NHLights.push(cur);
    return;
  }
  if (HOLO) { scene.environment = holoEnvironment(renderer); scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xD8DCE8, .6)); const k = new THREE.DirectionalLight(0xFFFFFF, 1.6); k.position.set(-5, 6, 4); scene.add(k); return; }
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  // little ambient, so the shadow side stays dark red-brown: that contrast is most of the look
  scene.add(new THREE.HemisphereLight(0xFFDDBB, 0x4A0A05, .95));
  const key = new THREE.DirectionalLight(0xFFE8CC, 4.3); key.position.set(-5, 6, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xFF5A2E, .3); fill.position.set(6, -3, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xFF8A52, .9); rim.position.set(4, 2, -5); scene.add(rim);
}
function makeRenderer(canvas, maxDpr = 1.75) {
  if (window.NH_MATERIAL === 'dark') maxDpr = Math.min(maxDpr, 1.25);   // v7: glass is heavy; keep the buffers small
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, maxDpr));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.12;
  return r;
}

/* ---------------------------------------------------------------- the mark: the 3×3×3 lattice and the ambigram's rods */
// as in nh-mark.js: square-on it reads H; a quarter turn about Y shows the N
const AMB = [[[-1, 1, 1], [-1, 0, 1], [-1, -1, 1]], [[1, 1, -1], [1, 0, -1], [1, -1, -1]], [[-1, 0, 0], [0, 0, 0], [1, 0, 0]], [[-1, 1, -1], [-1, 0, 0], [-1, -1, 1]]];
// v4: the N's diagonal through the centre node (see nh-mark.js). The crossbar (stroke 2) belongs to the H, the diagonal
// (stroke 3) to the N; letterMask(k, h) hides whichever does not belong to the letter on show (h 0 = N … 1 = H).
const CENTRE = !!window.NH_MARK_CENTRE;
if (CENTRE) AMB[3] = [[1, 1, -1], [0, 0, 0], [-1, -1, 1]];
const letterMask = (k, h) => !CENTRE ? 1 : k === 2 ? h : k === 3 ? 1 - h : 1;
// the crossbar's two end nodes (±1, 0, 0) belong only to the H; while the N shows they would bunch up at its centre
const nodeMask = (i, h) => !CENTRE ? 1 : (LAT[i].y === 0 && LAT[i].z === 0 && LAT[i].x !== 0) ? h : 1;
const LAT = []; for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) LAT.push(new THREE.Vector3(x, y, z));
const key3 = v => v.join(',');
const STROKE = new Set(AMB.flat().map(key3));
const IS_STROKE = LAT.map(p => STROKE.has(key3(p.toArray())));
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), UP = new THREE.Vector3(0, 1, 0);
const qa = (axis, deg) => new THREE.Quaternion().setFromAxisAngle(axis, deg * Math.PI / 180);
const Q_START = qa(Y, 45).premultiply(qa(X, -35.26));   // corner-on: the cube as a molecule
const Q_N = qa(Y, 90);
const Q_DEEP = qa(Y, -38).premultiply(qa(X, 26));

function buildMark(parent, { r = .27, rod = .085, color, sheen } = {}) {
  const mat = clayMaterial(color, sheen);
  const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 48, 32), mat, LAT.length);
  parent.add(nodes);
  // v7: a soft shell around each node, a third larger, that carries the glow and its colour split past the edge
  const halo = DARK ? new THREE.InstancedMesh(new THREE.SphereGeometry(r * 1.35, 40, 28), haloMaterial('node'), LAT.length) : null;
  if (halo) { halo.renderOrder = 2; parent.add(halo); }
  let rodHaloGeo = null;
  const rodGeo = new THREE.CylinderGeometry(rod, rod, 1, 28, 1); rodGeo.translate(0, .5, 0);
  const rods = [];
  AMB.forEach((pts, k) => pts.slice(1).forEach((p, j) => {
    const a = new THREE.Vector3(...pts[j]), b = new THREE.Vector3(...p), d = b.clone().sub(a);
    const m = new THREE.Mesh(rodGeo, mat);
    if (DARK) { const h = new THREE.Mesh(rodHaloGeo || (rodHaloGeo = (() => { const g = new THREE.CylinderGeometry(rod * 1.6, rod * 1.6, 1, 28, 1, true); g.translate(0, .5, 0); return g; })()), haloMaterial('rod')); h.renderOrder = 2; m.add(h); }
    m.quaternion.setFromUnitVectors(UP, d.clone().normalize()); m.scale.set(1, 1e-4, 1);
    parent.add(m); rods.push({ m, a, len: d.length(), k, j });
  }));
  const dummy = new THREE.Object3D();
  // spread: 0 one point … 1 the lattice; draw(k, j): 0..1 per rod; size(i): each node's scale
  function set({ spread, draw, size }) {
    LAT.forEach((p, i) => { dummy.position.copy(p).multiplyScalar(spread); dummy.scale.setScalar(Math.max(1e-4, size(i))); dummy.updateMatrix(); nodes.setMatrixAt(i, dummy.matrix); if (halo) halo.setMatrixAt(i, dummy.matrix); });
    nodes.instanceMatrix.needsUpdate = true; if (halo) halo.instanceMatrix.needsUpdate = true;
    rods.forEach(rd => { const d = draw(rd.k, rd.j); rd.m.position.copy(rd.a).multiplyScalar(spread); rd.m.scale.set(1, Math.max(1e-4, rd.len * spread * d), 1); rd.m.visible = d > .001 && spread > .02; });
  }
  return { nodes, rods, set };
}

// thin white lines: every lattice edge between two of the letter's nodes, and a few long diagonals across the cube
const EDGE_PAIRS = (() => {
  const out = [], idx = LAT.map((_, i) => i).filter(i => IS_STROKE[i]);
  idx.forEach((a, m) => idx.slice(m + 1).forEach(b => { if (LAT[a].distanceTo(LAT[b]) < 1.01) out.push([a, b]); }));
  return out.concat([[0, 26], [2, 24], [6, 20], [8, 18]]);
})();
function edgeLines(parent, soft) {
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(EDGE_PAIRS.length * 6), 3));
  const mat = new THREE.LineBasicMaterial({ color: DARK ? 0xFFFFFF : HOLO ? 0x3C3A52 : 0xFFF1E6, transparent: true, opacity: 0, depthWrite: false });
  parent.add(new THREE.LineSegments(geo, mat));
  const tmp = new THREE.Vector3();
  return { update(spread, opacity) {
    const arr = geo.attributes.position.array;
    EDGE_PAIRS.forEach(([a, b], i) => { tmp.copy(LAT[a]).multiplyScalar(spread).toArray(arr, i * 6); tmp.copy(LAT[b]).multiplyScalar(spread).toArray(arr, i * 6 + 3); });
    geo.attributes.position.needsUpdate = true; mat.opacity = opacity;
  } };
}

/* ---------------------------------------------------------------- hero */
const canvas = document.getElementById('gl');
const targets = $$('.targets i');
let gl = null;
// v8 draws every 3D layer itself (landing-nh8.js): this file keeps the page logic only
const OWN3D = !!window.NH_OWN3D;
if (!OWN3D) try { gl = makeHero(); } catch (e) { console.warn('WebGL unavailable, showing the 2D mark', e); draw2D(canvas); }

function makeHero() {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene(); lightScene(scene, renderer);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  glassBackdrop(scene, camera);
  const outer = new THREE.Group(), inner = new THREE.Group(); outer.add(inner); scene.add(outer);
  const mark = buildMark(inner);
  // thin white lines between far nodes, the construction showing through
  const edges = edgeLines(inner);
  const q = new THREE.Quaternion();
  const TARGET_NODES = LAT.map((_, i) => i).filter(i => IS_STROKE[i]).filter((_, m) => m % 2 === 0);

  // the whole hero as one pure function of t (0..1), so scrubbing back and forth is exact
  function pose(t, intro) {
    const spread = io(seg(t, .04, .18)) * (1 - io(seg(t, .80, .94)));
    const dot = 1 - spread;
    const sepK = o3(clamp(spread * 2.2));                               // nodes shrink as soon as they separate: no blob
    const gone = io(seg(t, .18, .30));                                 // the nodes off the letter leave once the rods draw
    if (t < .18) q.copy(Q_START);
    else if (t < .34) q.copy(Q_START).slerp(Q_N, io(seg(t, .18, .32)));
    else if (t < .40) q.copy(Q_N);
    else if (t < .58) { const e = io(seg(t, .40, .56)); q.copy(qa(Y, 90 * (1 - e))).premultiply(qa(X, 360 * e)); }
    else q.copy(new THREE.Quaternion()).slerp(Q_DEEP, io(seg(t, .62, .78)));
    inner.quaternion.copy(q);
    const shrink = 1 - io(seg(t, .78, .88));
    mark.set({
      spread,
      size: i => intro * (IS_STROKE[i] ? lerp(2.1, 1, sepK) * lerp(1, nodeMask(i, io(seg(t, .42, .54))), sepK) : lerp(2.1, .5, sepK) * (1 - gone)),
      draw: (k, j) => { const w0 = .22 + k * .03 + j * .04; return o3(seg(t, w0, w0 + .06)) * shrink * letterMask(k, io(seg(t, .42, .54))); },
    });
    edges.update(spread, lerp(.62, .8, seg(t, .62, .70)) * seg(t, .06, .14) * (1 - seg(t, .80, .86)));
    // the camera goes in close for the deep shot, so rods cross the frame as in the reference
    const back = io(seg(t, .79, .86));
    const camZ = lerp(lerp(5.9, 3.0, io(seg(t, .60, .78))), 6.6, back);
    // while the N (t .33–.40) and the H (t .56–.62) hold, the lens goes long: flat perspective, the letter reads square-on
    const flat = Math.max(seg(t, .29, .32) * (1 - seg(t, .405, .43)), seg(t, .53, .56) * (1 - seg(t, .63, .66)));
    return { camZ, flat: io(flat), targetsOn: t > .12 && t < .79 };
  }
  return { renderer, scene, camera, outer, inner, nodes: mark.nodes, pose, TARGET_NODES };
}

function draw2D(cv) {
  // no WebGL: the 2D mark (nh-mark.js) holds the N
  const NH = window.NHMark; if (!NH || !cv) return;
  const ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  const fit = () => {
    const r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = Math.min(r.width, r.height) * .16;
    NH.draw(ctx, NH.build('loop'), 10.2, { cx: r.width / 2, cy: r.height / 2, s, lw: 1.4, r: 2.4, line: '232,98,58', dot: '232,98,58' });
  };
  fit(); addEventListener('resize', fit);
}

const hero = document.querySelector('.hero'), call = document.querySelector('.call');
const stages = $$('.stage'), STAGE_AT = [[.20, .36], [.42, .58], [.64, .80]];
const flanks = $$('.flank');
let heroT = 0, callT = 0, intro = reduced ? 1 : 0, which = 'hero';
const heroMap = p => { const K = window.NH_TAIL; if (!K || innerWidth >= 900) return p; const D0 = .20, c = 1 - (D0 - K), pe = .80 / c; return p <= pe ? p * c : .80 + (p - pe) / (1 - pe) * D0; };   // phones: everything after the third line (t .80 to 1) is squeezed into K of the hero
ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom bottom', onUpdate: s => { heroT = heroMap(s.progress); } });
ScrollTrigger.create({ trigger: call, start: 'top bottom', end: 'bottom bottom', onUpdate: s => { callT = s.progress; } });
gsap.to({ v: 0 }, { v: 1, duration: reduced ? 0 : 1.6, ease: 'expo.out', delay: reduced ? 0 : 1.7, onUpdate() { intro = this.targets()[0].v; } });
setTimeout(() => flanks.forEach(f => scramble(f, 900)), reduced ? 0 : 1900);

const stageOn = stages.map(() => false);
function updateHero() {
  stages.forEach((st, i) => {
    const on = heroT >= STAGE_AT[i][0] && heroT < STAGE_AT[i][1];
    if (on !== stageOn[i]) { stageOn[i] = on; st.classList.toggle('on', on); if (on) scramble(st.querySelector('.big'), 1000); }
  });
  // v6: Not / Human appear only once you scroll (the bar has shrunk) and leave as the mark unravels
  const fo = document.documentElement.classList.contains('v6') ? (window.NH_OPEN ? seg(heroT, window.NH_OPEN * .6, window.NH_OPEN + .015) : seg(heroT, .004, .03)) * (1 - seg(heroT, .12, .17)) : 1 - seg(heroT, .03, .1);
  flanks.forEach(f => f.style.setProperty('--fo', fo.toFixed(3)));
  hero.style.setProperty('--co', (1 - seg(heroT, .0, .03)).toFixed(3));
}
// which red section is on screen decides what the scene shows; over cream the hero canvas rests
function sceneT() {
  const hr = hero.getBoundingClientRect(), cr = call.getBoundingClientRect();
  if (DARK ? hr.bottom > innerHeight + 1 : hr.bottom > innerHeight * .2) { which = 'hero'; return heroT; }
  if (cr.top < innerHeight && call.querySelector('.call-field, .lightfield')) { which = 'none'; return .97; }   // v4: the closing section draws its own field
  if (cr.top < innerHeight) { which = 'call'; return callT < .4 ? lerp(.04, .40, io(seg(callT, .03, .4))) : callT < .7 ? lerp(.40, .60, seg(callT, .4, .7)) : lerp(.60, .78, seg(callT, .7, 1)); }
  which = 'none'; return .97;
}
function resize() {
  if (gl) { gl.renderer.setSize(innerWidth, innerHeight, false); gl.camera.aspect = innerWidth / innerHeight; gl.camera.updateProjectionMatrix(); }
  how.forEach(v => v.resize());
}
const proj = new THREE.Vector3(), mtx = new THREE.Matrix4();
let lastWhich = '', shiftX = 0;
const heroDot = { x: innerWidth / 2, y: innerHeight / 2, r: 100 };

function renderHero(time) {
  if (!gl) return;
  const t = sceneT();
  if (which !== lastWhich) { canvas.style.setProperty('--gl-o', which === 'none' ? '0' : '1'); lastWhich = which; }
  if (which === 'none') { targets.forEach(el => el.style.opacity = 0); return; }
  const { camZ, flat, targetsOn } = gl.pose(t, intro);
  const sx = !wide() ? 0 : which === 'call' ? 1.2 : stageOn[0] || stageOn[2] ? 1.1 : stageOn[1] ? -1.1 : 0;
  shiftX += (sx - shiftX) * (reduced ? 1 : .05);
  gl.outer.position.x = shiftX;
  const narrow = innerWidth / innerHeight < 1 ? 1.6 : 1;
  // dolly zoom: a narrower lens, moved back by the same ratio, keeps the size and flattens the depth
  const fov = lerp(38, 14, flat), zoomK = Math.tan(THREE.MathUtils.degToRad(19)) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  if (gl.camera.fov !== fov) { gl.camera.fov = fov; gl.camera.updateProjectionMatrix(); }
  const lean = 1 - flat;   // square-on while a letter holds: no pointer lean, no sway
  gl.camera.position.set(ptr.x * .5 * lean, -ptr.y * .35 * lean, camZ * narrow * zoomK);
  gl.camera.lookAt(0, 0, 0);
  // the form turns toward the pointer: the hero answers the mouse
  if (!reduced) { gl.outer.rotation.y = (Math.sin(time * .35) * .05 + ptr.x * .42) * lean; gl.outer.rotation.x = (Math.sin(time * .27) * .04 + ptr.y * .28) * lean; }
  edgeView(gl.renderer, canvas, gl.camera);
  gl.renderer.render(gl.scene, gl.camera);
  if (DARK) {
    // where the collapsed ball sits on screen, and how big: How's layer picks it up from exactly here
    gl.inner.updateMatrixWorld();
    const c = new THREE.Vector3().setFromMatrixPosition(gl.inner.matrixWorld), d = c.distanceTo(gl.camera.position);
    const s = c.clone().project(gl.camera);
    heroDot.x = (s.x + 1) / 2 * innerWidth; heroDot.y = (1 - s.y) / 2 * innerHeight;
    heroDot.r = .27 * 2.1 * intro / (Math.tan(THREE.MathUtils.degToRad(gl.camera.fov / 2)) * d) * innerHeight / 2;
  }
  targets.forEach((el, i) => {
    const on = targetsOn;
    el.style.opacity = on ? 1 : 0;
    if (!on) return;
    gl.nodes.getMatrixAt(gl.TARGET_NODES[i % gl.TARGET_NODES.length], mtx);
    proj.setFromMatrixPosition(mtx).applyMatrix4(gl.inner.matrixWorld).project(gl.camera);
    el.style.transform = `translate3d(${((proj.x + 1) / 2 * innerWidth).toFixed(1)}px, ${((1 - proj.y) / 2 * innerHeight).toFixed(1)}px, 0)`;
  });
}

/* ---------------------------------------------------------------- how it works: one piece, one sequence
   The mark starts as a dot on the left and opens into the letter. As the first card arrives it closes into a single
   sphere and moves into the card, landing at the centre of the card's own drawing; as the cards pass, the sphere
   follows the one in front. The cards are DOM; the sphere is one 3D object drawn over them. */
const howSec = document.querySelector('.how'), track = document.querySelector('.cards-track'), cards = $$('.card');
const howMarkEl = document.querySelector('.how-mark'), howCv = document.querySelector('.how-gl');
let howT = 0, howView = null;
const how = [];   // views that need resize(); kept for the hero's resize()
function makeHowView(cv) {
  const renderer = makeRenderer(cv, 1.75);
  const scene = new THREE.Scene(); lightScene(scene, renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.set(0, 0, 14);
  glassBackdrop(scene, camera);
  const holder = new THREE.Group(), turn = new THREE.Group(), inner = new THREE.Group();
  holder.add(turn); turn.add(inner); scene.add(holder);
  // on the cream the piece needs more light than on the red: a peach clay, a brighter key and a little more exposure
  if (!HOLO) { renderer.toneMappingExposure = 1.28; const key2 = new THREE.DirectionalLight(0xFFF0DC, 2.2); key2.position.set(-6, 7, 6); scene.add(key2); }
  const mark = buildMark(inner, { color: 0xF7964E, sheen: 0xFFD9A8 });
  const edges = edgeLines(inner, true);
  const v = { cv, renderer, scene, camera, holder, turn, inner, mark, edges, w: 1, h: 1, on: false, dock: null,
    resize() { const r = cv.getBoundingClientRect(); if (!r.width) return; v.w = r.width; v.h = r.height; renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); } };
  new IntersectionObserver(es => { v.on = es[0].isIntersecting; }).observe(cv);
  v.resize(); how.push(v);
  return v;
}
// screen point (px, inside the canvas) → world point on the z = 0 plane; and how many px one world unit spans there
function toWorld(v, px, py) {
  const halfH = Math.tan(THREE.MathUtils.degToRad(v.camera.fov / 2)) * v.camera.position.z, halfW = halfH * v.camera.aspect;
  return { x: (px / v.w * 2 - 1) * halfW, y: (1 - py / v.h * 2) * halfH, ppu: v.h / (2 * halfH) };
}
const dock = { x: 0, y: 0, s: 1, init: false };
function renderHow(time, dt) {
  const v = howView; if (!v || !v.on) return;
  const cr = v.cv.getBoundingClientRect(), mr = howMarkEl.getBoundingClientRect();
  // where the N waits: the middle of the left column (on a phone, the block above the cards)
  const mx = mr.left - cr.left + mr.width / 2, my = mr.top - cr.top + mr.height / 2;
  const M = toWorld(v, mx, my), markSize = Math.min(mr.width, mr.height) * .62 / (2.7 * M.ppu);
  const open = reduced || !wide() ? 1 : io(seg(howT, .0, .07));
  const qN = qa(Y, 90), qH = new THREE.Quaternion();
  const sway = reduced ? 0 : Math.sin(time * .3) * .12;
  if (!wide() || reduced) {
    v.holder.position.set(M.x, M.y, 0); v.holder.scale.setScalar(markSize);
    v.inner.quaternion.copy(qN);
    v.mark.set({ spread: open, size: i => IS_STROKE[i] ? nodeMask(i, 0) : 0, draw: kk => letterMask(kk, 0) });
    v.edges.update(open, .55 * open); v.renderer.render(v.scene, v.camera); return;
  }
  // v4: the canvas covers the screen, so the piece can arrive from above: as you leave About it drops in from the top
  // edge to its place on the left, opens into the N, and the story below runs on; at the end it rides up with the page
  const FALL = document.documentElement.classList.contains('v4');
  let drop = 1, ride = 0, startPt = null;
  if (FALL) {
    const hr = howSec.getBoundingClientRect();
    const show = DARK ? hero.getBoundingClientRect().bottom <= innerHeight + 1 && hr.bottom > 0 : hr.top < innerHeight && hr.bottom > 0;
    v.holder.visible = show;
    if (!show) { v.renderer.render(v.scene, v.camera); return; }
    drop = io(seg(innerHeight - hr.top, innerHeight * .05, innerHeight));         // 0 above the screen … 1 landed on the left
    ride = Math.min(0, hr.bottom - innerHeight);                                    // px the section has moved up past its end
    if (DARK) {
      // v7: one ball. It is the hero's until the hero unpins; then it is here, at the same place and size, and glides
      // down to rest small under the About line, rides up with it, and drops into the N
      const h0 = hero.getBoundingClientRect();
      const sig = document.querySelector('.about-sig'), sr = sig ? sig.getBoundingClientRect() : { left: innerWidth / 2, width: 0, bottom: innerHeight * .8 };
      const k1 = io(seg(innerHeight - h0.bottom, 0, innerHeight * .85));
      // it heads for the spot under the About line, but never leaves the screen while that line is still coming in
      const sx = lerp(heroDot.x, sr.left + sr.width / 2, k1) - cr.left, sy = lerp(heroDot.y, Math.min(sr.bottom + 48, innerHeight * .8), k1) - cr.top, sR = lerp(heroDot.r, 13, k1);
      const S0 = toWorld(v, sx, sy);
      startPt = { x: S0.x, y: S0.y, s: sR / (.27 * S0.ppu) };
    }
  }
  // the story: the N on the left closes into one sphere; the sphere passes through every card as a dot;
  // leaving the last card it opens again, and stands on the right as the H
  const rects = cards.map(c => c.querySelector('.card-in').getBoundingClientRect());
  const centre = r => r.left + r.width / 2;
  // 0: the N on the left … 1: a dot inside card 1. In v7 the story waits until How is pinned, so the ball never drifts early
  const k = DARK && howSec.getBoundingClientRect().top > 1 ? 0 : io(seg(centre(rects[0]), innerWidth * .98, innerWidth * .72));
  let f = 0; rects.forEach((r, i) => { if (i) f += seg(centre(r), innerWidth * .8, innerWidth * .42); });
  const n = rects.length - 1;
  const a = Math.min(n, Math.floor(f)), b = Math.min(n, a + 1), fr = io(f - a);  // between which two cards it travels, eased to settle dead centre
  const ra = rects[a], rb = rects[b], tw = lerp(ra.width, rb.width, fr);
  // the free band of a card (about 44% down), with a low arc on the hop from one card to the next
  const tx = lerp(centre(ra), centre(rb), fr) - cr.left;
  const ty = lerp(ra.top + ra.height * .44, rb.top + rb.height * .44, fr) - cr.top - Math.sin(Math.PI * fr) * tw * .1;
  const T = toWorld(v, tx, ty), dotS = tw * .085 / (.27 * T.ppu);
  const out = io(seg(howT, .84, .98));                                            // leaving the last card, becoming the H
  const R = toWorld(v, innerWidth * .72 - cr.left, cr.height * .5);
  const px = lerp(T.x, R.x, out), py = lerp(T.y, R.y, out), ps = lerp(dotS, markSize * 1.15, out);
  const breathe = 1 + Math.sin(time * 2.2) * .04 * k * (1 - out);
  const top = toWorld(v, HOLO ? innerWidth / 2 - cr.left : mx, -60);                 // just above the top edge (v5: top middle)
  const st = startPt || { x: top.x, y: top.y, s: markSize };
  v.holder.position.set(lerp(lerp(st.x, M.x, drop), px, k), lerp(lerp(st.y, M.y, drop), py, k) - ride / M.ppu, 0);
  v.holder.scale.setScalar(lerp(lerp(st.s, markSize, drop), ps * breathe, k));
  const spread = k < 1 ? open * (1 - k) : out;
  v.inner.quaternion.copy(k < 1 ? qN : qH);
  // the centre node is the dot; the others grow only as they move clear of it, so nothing clumps
  const grow = io(seg(spread, .12, .55));
  v.mark.set({ spread, size: i => !IS_STROKE[i] ? 0 : LAT[i].lengthSq() === 0 ? 1 : grow * nodeMask(i, k < 1 ? 0 : out),
    draw: (kk, jj) => k < 1 ? letterMask(kk, 0) : o3(seg(out, .35 + kk * .08 + jj * .04, .55 + kk * .08 + jj * .04)) * letterMask(kk, 1) });
  v.edges.update(spread, .55 * spread);
  edgeView(v.renderer, v.cv, v.camera);
  const calm = k < 1 ? 1 - k : out;                                               // the dot stays still; the letters sway and lean
  const lean = k < 1 ? calm : 0;                                                  // the H on the right stands square-on
  v.turn.rotation.y = sway * calm * .6 + ptr.x * .2 * lean;
  v.turn.rotation.x = (ptr.y * .15 - .06) * lean;
  v.renderer.render(v.scene, v.camera);
}
try { if (howCv && !OWN3D) howView = makeHowView(howCv); } catch (e) { console.warn('WebGL unavailable for How it works', e); }

// the track moves left as you scroll; each card comes in turned and settles flat near the centre
let runX = 0;
function sizeHow() { runX = wide() && !reduced ? Math.max(0, track.scrollWidth - innerWidth * .52) : 0; }
ScrollTrigger.create({ trigger: howSec, start: 'top top', end: 'bottom bottom', onUpdate: s => { howT = s.progress; } });
function updateCards() {
  if (!wide() || reduced) { track.style.removeProperty('--tx'); cards.forEach(c => { c._ry = c._rz = 0; }); return; }
  // the track waits until the letter has opened, then moves
  track.style.setProperty('--tx', (-seg(howT, .08, 1) * runX).toFixed(1) + 'px');
  cards.forEach(c => {
    const r = c.getBoundingClientRect(), x = (r.left + r.width / 2) / innerWidth;   // 0 left … 1 right
    c._ry = c._rz = 0;                                                              // cards stay flat; only the pointer tilts them
  });
}
// under the pointer a card leans toward it and a soft light follows the pointer across it
cards.forEach(c => {
  const inEl = c.querySelector('.card-in');
  c._ry = c._rz = 0; c._mx = c._my = 0;
  if (!fine || reduced) return;
  c.addEventListener('pointermove', e => {
    const r = inEl.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, w = (e.clientY - r.top) / r.height;
    c._mx = (u - .5) * 22; c._my = (w - .5) * -12; c.classList.add('hot');
    inEl.style.setProperty('--gx', (u * 100).toFixed(1) + '%'); inEl.style.setProperty('--gy', (w * 100).toFixed(1) + '%'); inEl.style.setProperty('--go', '1');
  });
  c.addEventListener('pointerleave', () => { c._mx = c._my = 0; c.classList.remove('hot'); });
});
function applyCards() {
  cards.forEach(c => {
    const inEl = c.querySelector('.card-in');
    inEl.style.setProperty('--ry', (c._ry + c._mx).toFixed(2) + 'deg');
    inEl.style.setProperty('--rx', c._my.toFixed(2) + 'deg');
    inEl.style.setProperty('--rz', c._rz.toFixed(2) + 'deg');
  });
}

/* ---------------------------------------------------------------- the mark slot: our 3D mark, played with the pointer */
const markSlot = document.querySelector('.mark-slot');
if (markSlot && HOLO && !OWN3D) try {
  const cv = document.createElement('canvas'); cv.className = 'mark-slot-gl'; cv.setAttribute('aria-hidden', 'true'); markSlot.append(cv);
  const renderer = makeRenderer(cv, 1.5), scene = new THREE.Scene(); lightScene(scene, renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.set(0, 0, 7.2); glassBackdrop(scene, camera);
  const turn = new THREE.Group(), inner = new THREE.Group(); turn.add(inner); scene.add(turn);
  const mark = buildMark(inner); const edges = edgeLines(inner, true);
  const sp = { x: .5, y: .5, tx: .5, ty: .5, hov: 0, th: 0 };
  markSlot.addEventListener('pointermove', e => { const r = markSlot.getBoundingClientRect(); sp.tx = (e.clientX - r.left) / r.width; sp.ty = (e.clientY - r.top) / r.height; sp.th = 1; }, { passive: true });
  markSlot.addEventListener('pointerleave', () => { sp.tx = .5; sp.ty = .5; sp.th = 0; });
  let on = false; new IntersectionObserver(es => { on = es[0].isIntersecting; }).observe(markSlot);
  const size = () => { const r = markSlot.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);
  gsap.ticker.add((time, dt) => {
    if (!on) return;
    const k = reduced ? 1 : .08;
    sp.x += (sp.tx - sp.x) * k; sp.y += (sp.ty - sp.y) * k; sp.hov += (sp.th - sp.hov) * k;
    // left of the slot reads N, right reads H; the turn between is the two-axis one the logo uses
    const h = io(clamp((sp.x - .2) / .6));
    inner.quaternion.copy(qa(Y, 90 * (1 - h))).premultiply(qa(X, 360 * h));
    turn.rotation.x = (sp.y - .5) * .5; turn.rotation.y = (reduced ? 0 : Math.sin(time * .4) * .08) * (1 - sp.hov);
    const spread = .82 + sp.hov * .18;   // at rest the lattice is drawn in a little; under the pointer it opens fully
    mark.set({ spread, size: i => IS_STROKE[i] ? nodeMask(i, h) : 0, draw: kk => letterMask(kk, h) });
    edges.update(spread, .35 + sp.hov * .3);
    edgeView(renderer, cv, camera);
    renderer.render(scene, camera);
  });
} catch (e) { console.warn('WebGL unavailable for the mark slot', e); }

/* ---------------------------------------------------------------- departments: the list names, the detail answers */
const items = $$('.cap'), capImg = document.querySelector('.cap-img'), capsEl = document.querySelector('.caps');
// a row lights up, and the plate shows over it, only while the pointer is on it
items.forEach(el => el.addEventListener('pointerenter', () => {
  items.forEach(o => o.classList.toggle('on', o === el));
  if (capImg) capImg.style.setProperty('--cy', (el.offsetTop + el.offsetHeight / 2) + 'px');
  capsEl?.classList.add('hovering');
}));
capsEl?.addEventListener('pointerleave', () => { items.forEach(o => o.classList.remove('on')); capsEl.classList.remove('hovering'); });

/* ---------------------------------------------------------------- the about glow leans toward the pointer */
const glow = document.querySelector('.glow');
if (glow && !reduced) {
  const gx = gsap.quickTo(glow, 'x', { duration: 1.6, ease: 'power3.out' }), gy = gsap.quickTo(glow, 'y', { duration: 1.6, ease: 'power3.out' });
  addEventListener('pointermove', e => { gx((e.clientX - innerWidth / 2) * .25); gy((e.clientY - innerHeight / 2) * .25); }, { passive: true });
}

/* ---------------------------------------------------------------- header: detaches into a floating pill; the symbol keeps looping */
const header = document.querySelector('.site-header'), themed = $$('main > section[data-theme]'), phone = matchMedia('(max-width: 767px)');
function onHeader() {
  if (!header) return;
  header.toggleAttribute('data-scrolled', phone.matches || scrollY > 24);
  // the pill stays a while: it hides only after a long run downwards, and comes back on any scroll up
  const dy = scrollY - (onHeader.y ?? scrollY); onHeader.y = scrollY;
  if (dy < -2) { onHeader.run = 0; header.removeAttribute('data-hide'); }
  // owner, 2026-10-18: the pill always floats on top for now; to hide it again after a long run down, restore this line
  // else if (dy > 0) { onHeader.run = (onHeader.run || 0) + dy; if (onHeader.run > 900 && scrollY > 1200) header.setAttribute('data-hide', ''); }
  const s = themed.find(el => { const r = el.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
  if (s && header.dataset.theme !== s.dataset.theme) header.dataset.theme = s.dataset.theme;
}
const burger = header?.querySelector('.burger-btn');
const setMenu = open => {
  header.setAttribute('data-anim', '');                      // transitions only after first use, so page load doesn't animate
  header.toggleAttribute('data-menu', open);
  open ? lenis?.stop() : lenis?.start();
  document.documentElement.style.overflow = open ? 'hidden' : '';
  burger?.setAttribute('aria-expanded', String(open)); burger?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
burger?.addEventListener('click', () => setMenu(!header.hasAttribute('data-menu')));
$$('.m-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => e.key === 'Escape' && header?.hasAttribute('data-menu') && setMenu(false));
matchMedia('(min-width: 1024px)').addEventListener('change', m => m.matches && setMenu(false));
const mini = document.querySelector('.mini'), NHm = window.NHMark, miniTl = NHm ? NHm.build('loop') : null;
let miniT = reduced ? 6.5 : 0;
function drawMini(dt) {
  if (!mini || !miniTl) return;
  const dpr = Math.min(devicePixelRatio || 1, 2), r = mini.getBoundingClientRect(), W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
  if (mini.width !== W || mini.height !== H) { mini.width = W; mini.height = H; }
  const ctx = mini.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
  if (!reduced) miniT = (miniT + dt) % miniTl.T;
  const ink = (getComputedStyle(mini).color.match(/\d+(\.\d+)?/g) || [255, 244, 236]).slice(0, 3).join(',');
  const s = r.width * .5 / (Math.sqrt(3) + .2);
  NHm.draw(ctx, miniTl, miniT, { cx: r.width / 2, cy: r.height / 2, s, lw: Math.max(.9, s * .1), r: Math.max(.9, s * .11), line: ink, dot: ink });
}

/* ---------------------------------------------------------------- one loop for everything */
resize(); sizeHow();
addEventListener('resize', () => { resize(); sizeHow(); fLast = -1; });
addEventListener('load', () => { ScrollTrigger.refresh(); resize(); sizeHow(); });
/* ---------------------------------------------------------------- blocks rise out of a mask as they arrive (no fades) */
if (!reduced) {
  gsap.set('.rv', { y: 70, clipPath: 'inset(0% 0% 100% 0%)' });
  ScrollTrigger.batch('.rv', { start: 'top 88%', once: true,
    // the mask is cleared once open: a box clip would cut descenders that hang below a tight line-height (the g of "integrated")
    onEnter: els => gsap.to(els, { y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'power4.out', stagger: .09, overwrite: true, clearProps: 'clipPath,transform' }) });
}

/* ---------------------------------------------------------------- case-study images: the mark looping on its own clock, while on screen */
const csMarks = $$('.cs-mark').map((cv, i) => ({ cv, t: reduced ? +cv.dataset.pose : +cv.dataset.pose + i, on: false }));
const csIO = new IntersectionObserver(es => es.forEach(e => { const m = csMarks.find(k => k.cv === e.target); if (m) m.on = e.isIntersecting; }));
csMarks.forEach(m => csIO.observe(m.cv));
function drawCases(dt) {
  if (!miniTl) return;
  for (const m of csMarks) {
    if (!m.on) continue;
    const dpr = Math.min(devicePixelRatio || 1, 2), r = m.cv.getBoundingClientRect(), W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    if (m.cv.width !== W || m.cv.height !== H) { m.cv.width = W; m.cv.height = H; }
    const ctx = m.cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
    if (!reduced) m.t = (m.t + dt * .8) % miniTl.T;
    const s = Math.min(r.width, r.height) * .5 * .56 / (Math.sqrt(3) + .2);
    const ink = DARK ? '255,255,255' : HOLO ? '40,38,56' : '255,244,236';
    NHm.draw(ctx, miniTl, m.t, { cx: r.width / 2, cy: r.height * .5, s, lw: 1.2, r: 2.4, line: ink, dot: ink });
  }
}

// the veil's mark: the same loop as the bar's symbol, larger, in cream
let veilT = 0;
function drawVeil(dt) {
  if (!veilCv || !miniTl || reduced) return;
  const cp = getComputedStyle(veil).clipPath;
  if (cp && cp.includes('100%') && !veilBusy) return;          // hidden: nothing to draw
  const dpr = Math.min(devicePixelRatio || 1, 2), r = veilCv.getBoundingClientRect(), W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
  if (veilCv.width !== W || veilCv.height !== H) { veilCv.width = W; veilCv.height = H; }
  const ctx = veilCv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
  veilT = (veilT + dt * 1.6) % miniTl.T;
  const s = r.width * .5 / (Math.sqrt(3) + .2);
  NHm.draw(ctx, miniTl, veilT, { cx: r.width / 2, cy: r.height / 2, s, lw: 1, r: 1.6, line: DARK ? '255,255,255' : '28,23,21', dot: DARK ? '255,255,255' : '28,23,21' });
}
// v5: the aura rises from the bottom as the hero leaves (the About block's top goes from the screen's bottom to its top)
const aura = document.querySelector('.aura'), aboutSec = document.querySelector('#about');
let auraY = -1;
function onAura() {
  if (!aura || !aboutSec) return;
  const t = reduced ? 1 : clamp((innerHeight - aboutSec.getBoundingClientRect().top) / innerHeight);
  const y = Math.round((1 - t) * 1000) / 10;
  if (y !== auraY) { auraY = y; aura.style.setProperty('--aura-y', y + '%'); }
  if (METAL2 && howSec) {
    const hw = howSec.getBoundingClientRect(), ih = innerHeight;
    const o = (1 - .55 * clamp((ih - hw.top) / ih)) * (1 - clamp((ih * .6 - hw.bottom) / (ih * .6)));
    aura.style.setProperty('--aura-o', o.toFixed(3));
  }
}
let lastTick = 0;
gsap.ticker.add((time) => {
  const dt = Math.min(.05, lastTick ? time - lastTick : .016); lastTick = time;
  for (const L of window.NHLights) L.position.set(ptr.x * 4.5, -ptr.y * 3, 4);
  if (DARK && HOLO_MAT && HOLO_MAT.uniforms) {
    const o = window.NHOrb, U = HOLO_MAT.uniforms;
    U.uOrb.value.set(o.x, 1 - o.y, o.i); U.uTime.value = time;
    for (const h of Object.values(HALO)) h.uniforms.uOrb.value.copy(U.uOrb.value);
  }
  onHeader(); drawMini(dt); drawVeil(dt); onFocus(); drawCases(dt); onAura();
  const k = reduced ? 1 : .07;
  ptr.x += (ptr.tx - ptr.x) * k; ptr.y += (ptr.ty - ptr.y) * k;
  updateHero();
  renderHero(time);
  updateCards(); applyCards();
  renderHow(time, dt);
});
