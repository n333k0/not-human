// Not Human landing v9 (from v8's engine, landing-nh8.js, which stays as it was). v9 adds: the owner's values as defaults; a
// long lens while the N, the H and the square hold, so they read dead straight; rods with visible ends; a light orb that
// keeps to the shape's rim and grows with it; a mouse-light slider; small marks where the hero's thin lines end.
// v8's notes follow.
// Not Human landing v8: one glass object travels the whole page, drawn on one canvas.
// Why the v7 glass looked stiff: it refracted nothing (the body was a flat tint), its light was tied to the camera (so a
// bigger object was lit exactly like a small one), and its softness came from the material, not the image. Here:
//  1. the room (near-black, a soft light orb, a faint lens ring, colour at the frame) is a WebGL function, drawn behind
//     the page and sampled by the glass, so the glass truly refracts it, split per colour channel (dispersion);
//  2. the lights are fixed in the world (rigs: orb, studio, backlit, window), so highlights travel and grow as the
//     object moves, turns or fills the screen;
//  3. the glass layer goes through a small post pass of our own: a soft blur, bloom and lens chromatic aberration,
//     which is what makes the edges glow and melt into the dark, as in the references.
// The journey: the hero (as v7), a big lens behind the About sentence, 1 → 5 nodes through the How cards, the whole
// cube opening big and stretched behind the next two sections, then a flat 3 × 3 square of connected nodes locked in
// "Fully integrated". landing-nh3.js keeps the page logic (window.NH_OWN3D switches its own 3D off).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const io = t => t < .5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
const o3 = t => 1 - (1 - t) ** 3;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const wide = () => innerWidth >= 900;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const { gsap, ScrollTrigger } = window;
const root = document.documentElement;

/* ---------------------------------------------------------------- settings: looks, light rigs, layer, knobs */
const LOOKS = {
  soft:    { refract: .55, disperse: .07, body: .24, rim: .62, rimPow: 3, spec: .95, soft: .5, bloom: .5, bloomR: 1.3, ca: 4, grain: .03, tint: '#c4ccff' },
  prism:   { refract: .7, disperse: .12, body: .22, rim: 1.1, rimPow: 3, spec: 1, soft: .3, bloom: .7, bloomR: 1, ca: 4.5, grain: .03, tint: '#d8dcff' },
  frosted: { refract: .35, disperse: .05, body: .5, rim: .6, rimPow: 2, spec: .6, soft: .8, bloom: 1.1, bloomR: 1.6, ca: 2, grain: .05, tint: '#aab4ff' },
  crisp:   { refract: .6, disperse: .08, body: .15, rim: 1.2, rimPow: 3.6, spec: 1.3, soft: .12, bloom: .5, bloomR: .8, ca: 1.6, grain: .02, tint: '#ffffff' },
  // the owner's reference cube: a dark blue body, thin bright edges, wide red-green-blue separation, a soft glow
  vivid:   { refract: .8, disperse: .15, body: .2, rim: 1.5, rimPow: 4.4, spec: 1.2, soft: .3, bloom: .75, bloomR: 1.1, ca: 8, grain: .04, tint: '#7f98ff' },
};
// the room around the glass. leak: colour pools pushed in past the frame, as in the owner's grainy references
const ROOMS = {
  night:  { leak: 0, ring: .6, aura: .6, cols: [[.34, .18, .62], [.1, .4, .46], [.48, .12, .2]] },
  leak:   { leak: .75, ring: .45, aura: .3, cols: [[.42, .26, .62], [.14, .42, .44], [.5, .16, .24]] },
  aurora: { leak: 1.1, ring: .35, aura: .5, cols: [[.2, .5, .62], [.46, .22, .66], [.16, .3, .62]] },
  ember:  { leak: .9, ring: .4, aura: .2, cols: [[.6, .2, .26], [.52, .3, .16], [.36, .14, .5]] },
  mono:   { leak: 0, ring: 0, aura: 0, cols: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] },
};
// still grain only: the page overlay, the room, and the glass each get their own amount
// v9 (owner, 2026-10-18): half as strong as v8's, then 20% back up
const GRAINS = { off: { css: 0, bg: 0, grain: 0 }, fine: { css: .026, bg: .007, grain: .018 }, film: { css: .078, bg: .03, grain: .042 } };
const LCOLS = { white: [1, 1, 1.04], lavender: [.86, .8, 1.12], teal: [.68, 1, 1.04], rose: [1.12, .76, .9] };
const SHADOWS = { off: { vig: 0, halo: 0 }, vignette: { vig: .55, halo: 0 }, halo: { vig: .45, halo: .65 } };
// the owner's values (in chat, 2026-10-18), plus v9's two new knobs: cursor (the lights that follow the mouse) and rim (how
// strongly the orb keeps to the shape's edge)
const DEF = Object.assign({}, LOOKS.soft, { look: 'soft', form: 'sphere', lights: 'backlit', lightCol: 'lavender', room: 'night', grainMode: 'film', shadow: 'halo', layer: 'auto',
  orb: 1, orbSize: .16, ring: .6, aura: .6, leak: 0, grain: .018, cursor: .6, orbRim: .75,
  // v10 (owner, 2026-10-18): a thick glass wall on every node and tube, the double edge that showed only when two nodes
  // crossed during the scroll. 0 = v9's thin glass; pages opt in with window.NH_WALL.
  wall: +(window.NH_WALL || 0), wallGlow: +(window.NH_WALL_GLOW || 1) });   // the owner's values, 2026-10-18 (late)
// saved panel values count only while the panel is shown (?panel): everyone else sees the defaults
const G = Object.assign({}, DEF, (() => { try { return root.classList.contains('show-panel') ? JSON.parse(localStorage.getItem('nh9') || '{}') : {}; } catch (e) { return {}; } })());
// light rigs, in world units (the camera sits at z ≈ 6.6 looking at the origin). orb: placed under the pointer's light,
// in front of the object ('front') or behind it ('back'). c: strength, s: sharpness (low = a large soft source)
const RIGS = {
  orb:     [{ orb: 4, c: 1.1, s: 24 }, { orb: -3, c: 1.4, s: 6 }, { p: [-6, 6, 5], c: .35, s: 14 }],
  studio:  [{ p: [-6, 6, 6], c: 1.2, s: 28 }, { p: [7, -1, 4], c: .35, s: 8 }, { p: [0, 5, -6], c: 1.1, s: 5 }],
  backlit: [{ p: [-4, 3, -5], c: 1.5, s: 5 }, { p: [5, -2, -4], c: 1.1, s: 5 }, { orb: 4, c: .45, s: 40 }],
  window:  [{ p: [0, 9, 7], c: 1.3, s: 4 }, { orb: -3, c: 1.1, s: 6 }, { p: [-8, 0, 2], c: .25, s: 3 }],
};
const save = () => { try { localStorage.setItem('nh9', JSON.stringify(G)); } catch (e) {} };
// auto: under the text everywhere (the How cards are frosted so it shows through them); front puts it over the page
const setLayer = () => { const v = G.layer === 'front' ? 'front' : 'behind'; if (root.dataset.glass !== v) root.dataset.glass = v; };
setLayer();

/* ---------------------------------------------------------------- the pointer and the orb (landing-nh7.js moves the orb) */
const ptr = { x: 0, y: 0, tx: 0, ty: 0, px: -1e4, py: -1e4 };
addEventListener('pointermove', e => { ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1; ptr.px = e.clientX; ptr.py = e.clientY; }, { passive: true });
document.addEventListener('pointerleave', () => { ptr.tx = ptr.ty = 0; ptr.px = ptr.py = -1e4; });

/* ---------------------------------------------------------------- the room, shared by the background and the glass */
const ROOM = /* glsl */`
  uniform vec2 uRes; uniform vec4 uOrb; uniform float uRing, uAura, uLeak, uVig, uTime; uniform vec3 uLA, uLB, uLC2, uLCol; uniform vec4 uHalo;
  vec3 room(vec2 uv) {
    vec2 asp = vec2(uRes.x / uRes.y, 1.0);
    vec3 c = vec3(.035, .035, .043);
    // the orb: a soft light, no hard core, its size set by uOrb.w (a fraction of the height)
    float d = length((uv - uOrb.xy) * asp), r = uOrb.w;
    c += uOrb.z * uLCol * (vec3(.62, .64, .78) * exp(-d * d / (r * r * .12)) + vec3(.42, .44, .66) * exp(-d * d / (r * r)) * .55 + vec3(.25, .3, .62) * exp(-d * d / (r * r * 6.0)) * .22);
    // a lens ring: very large, very faint, its colour split slightly, drifting against the orb
    vec2 rc = .5 + (uOrb.xy - .5) * -.18;
    float rd = length((uv - rc) * asp), R = .62;
    c += uRing * vec3(exp(-pow((rd - R - .012) / .018, 2.0)), exp(-pow((rd - R) / .016, 2.0)), exp(-pow((rd - R + .012) / .02, 2.0))) * vec3(.05, .055, .075);
    // colour that lives only at the frame
    float e = smoothstep(.42, .95, length((uv - .5) * vec2(1.0, 1.15)));
    c += uAura * e * mix(vec3(.16, .09, .42), vec3(.05, .2, .45), uv.y) * .25;
    // light leaks: three wide colour pools from beyond the frame, drifting very slowly
    vec2 p1 = (uv - vec2(1.06 + .03 * sin(uTime * .07), .95)) * asp, p2 = (uv - vec2(1.12, .38 + .05 * sin(uTime * .05))) * asp, p3 = (uv - vec2(-.1, .08 + .04 * cos(uTime * .06))) * asp;
    c += uLeak * (uLA * exp(-dot(p1, p1) / .2) + uLB * exp(-dot(p2, p2) / .12) + uLC2 * exp(-dot(p3, p3) / .16));
    // a soft shade around the object, then the vignette
    vec2 hp = (uv - uHalo.xy) * asp;
    c *= 1.0 - uHalo.w * .75 * exp(-dot(hp, hp) / max(1e-4, uHalo.z * uHalo.z)) * smoothstep(0.0, .6, length(hp) / max(1e-4, uHalo.z));
    c *= 1.0 - uVig * smoothstep(.3, 1.05, length((uv - .5) * vec2(1.0, 1.25)));
    return c;
  }`;
const FS_VERT = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// the shared uniforms: every material reads the same objects, so one update per frame reaches all of them
const U = {
  uRes: { value: new THREE.Vector2(innerWidth, innerHeight) }, uOrb: { value: new THREE.Vector4(.5, .5, 0, .16) },
  uRing: { value: G.ring }, uAura: { value: G.aura }, uLeak: { value: 0 }, uVig: { value: 0 }, uTime: { value: 0 },
  uLA: { value: new THREE.Vector3() }, uLB: { value: new THREE.Vector3() }, uLC2: { value: new THREE.Vector3() }, uLCol: { value: new THREE.Vector3(1, 1, 1) },
  uHalo: { value: new THREE.Vector4(.5, .5, .1, 0) }, uGrainBg: { value: 0 },
};

/* ---------------------------------------------------------------- the background canvas: the room, at half resolution */
const bgCv = document.querySelector('.bg8'), glCv = document.querySelector('.gl8');
let bg = null;
try {
  const r = new THREE.WebGLRenderer({ canvas: bgCv, antialias: false, alpha: false, powerPreference: 'low-power' });
  r.setPixelRatio(.5);
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: FS_VERT, depthTest: false, depthWrite: false,
    fragmentShader: ROOM + `uniform float uGrainBg; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() { gl_FragColor = vec4(room(vUv) + (hash(floor(gl_FragCoord.xy)) - .5) * uGrainBg, 1.0); }` });
  const s = new THREE.Scene(); s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m));
  bg = { r, s, c: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
} catch (e) { console.warn('WebGL unavailable for the room', e); }

/* ---------------------------------------------------------------- the glass */
const GLASS_VERT = /* glsl */`
  uniform float uRod, uGeoR;
  varying vec3 vN; varying vec3 vW; varying vec3 vA; varying float vRad; varying vec3 vL;
  #if CUT
  attribute vec4 aC0; attribute vec4 aC1; attribute vec4 aC2; attribute vec4 aC3;
  varying vec4 vC0; varying vec4 vC1; varying vec4 vC2; varying vec4 vC3; varying vec3 vP;
  #endif
  void main() {
    vL = position;
    #if CUT
    vC0 = aC0; vC1 = aC1; vC2 = aC2; vC3 = aC3;
    vP = position * vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));   // the tube's own units: x, z its width, y along it
    #endif
    mat4 m = modelMatrix * instanceMatrix;
    vec4 w = m * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(m) * normal);
    vA = uRod > .5 ? normalize(mat3(m) * vec3(0.0, 1.0, 0.0)) : vec3(0.0);
    vRad = length((m * vec4(1.0, 0.0, 0.0, 0.0)).xyz) * uGeoR;      // this piece's radius in world units
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const GLASS_FRAG = ROOM + /* glsl */`
  uniform mat4 uProj; uniform vec2 uBuf; uniform vec2 uPtr; uniform float uGlitch, uVoice, uFlow;
  uniform float uRod, uGeoR, uRefract, uDisperse, uBody, uRim, uRimPow, uSpec, uFade, uWall, uWallGlow;
  uniform vec3 uTint; uniform vec3 uLP[3]; uniform vec3 uLC[3]; uniform float uLS[3];
  varying vec3 vN; varying vec3 vW; varying vec3 vA; varying float vRad; varying vec3 vL;
  #if CUT
  varying vec4 vC0; varying vec4 vC1; varying vec4 vC2; varying vec4 vC3; varying vec3 vP;
  #endif
  vec2 toUv(vec3 p) { vec4 c = uProj * viewMatrix * vec4(p, 1.0); return c.xy / c.w * .5 + .5; }
  void main() {
    #if CUT
    // a joint: at each node a tube keeps only the part that lies nearer its own direction than its neighbours' (a 45 degree
    // miter at a corner, a clean T), so tubes meet evenly and never show through one another
    if (dot(vP - vec3(0.0, vC0.w, 0.0), vC0.xyz) < -1e-5 || dot(vP - vec3(0.0, vC1.w, 0.0), vC1.xyz) < -1e-5 ||
        dot(vP - vec3(0.0, vC2.w, 0.0), vC2.xyz) < -1e-5 || dot(vP - vec3(0.0, vC3.w, 0.0), vC3.xyz) < -1e-5) discard;
    #endif
    vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
    // v10 opening (owner, 2026-10-18, second pass): no more tears. Under the pointer, and while the voice speaks, the glass flows like
    // smoke behind a lens: a slow, domain-warped field bends the surface and splits the colours a touch more. uFlow keeps it
    // breathing while the leak layer is open; uVoice is the voice's loudness, so the orb moves as she talks.
    vec2 asp2 = vec2(uBuf.x / uBuf.y, 1.0), suv = toUv(vW), dq = (suv - uPtr) * asp2;
    float gf = uGlitch * smoothstep(.6, .0, length(dq));
    float fl = gf + uFlow + uVoice;
    if (fl > .001) {
      vec2 fp = (suv - .5) * asp2 * 2.4;
      float tt = uTime * (.32 + uVoice * .8);
      vec2 w1 = vec2(sin(fp.y * 1.9 + tt * 1.1), cos(fp.x * 1.6 - tt * .9));
      vec2 w2 = vec2(sin((fp.y + w1.x * .8) * 2.7 - tt * 1.4), cos((fp.x + w1.y * .8) * 2.4 + tt * 1.2));
      vec2 w3 = vec2(sin((fp.x + w2.y) * 4.3 + tt * 1.9), cos((fp.y + w2.x) * 3.9 - tt * 1.7)) * .35;
      N = normalize(N + vec3((w2 + w3) * fl * .3, 0.0));
    }
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    // a rod's end cap: shade it as a disc with a lit rim, so you can see where the tube stops
    float cap = uRod > .5 ? step(.7, abs(dot(N, vA))) : 0.0;
    if (uRod > .5 && cap < .5) ndv = clamp(ndv / max(.15, length(V - vA * dot(V, vA))), 0.0, 1.0);   // a tilted rod: its edge, not its slope
    float f = 1.0 - ndv;
    if (cap > .5) f = smoothstep(.35, 1.0, length(vL.xz) / uGeoR) * .95;
    // refraction: follow the bent ray through a thick lens and read the room where it lands, once per colour channel
    // the wall: how far out from the axis this fragment sits (0 centre, 1 edge); between 1 - uWall and 1 we look through the
    // glass itself, so it refracts harder and glows, and the inner surface draws a second, colour-split edge
    float rho = cap > .5 ? length(vL.xz) / uGeoR : sqrt(max(0.0, 1.0 - ndv * ndv));
    float ri = 1.0 - uWall, on = step(.001, uWall);
    float wall = on * smoothstep(ri - .05, ri + .03, rho);
    float th = vRad * uRefract * 4.0 * (1.0 + wall * 1.6);
    vec3 rr = refract(-V, N, 1.0 / (1.45 - uDisperse * (1.0 + fl * 3.0))), rg = refract(-V, N, 1.0 / 1.45), rb = refract(-V, N, 1.0 / (1.45 + uDisperse * (1.0 + fl * 3.0)));
    vec3 seen = vec3(room(toUv(vW + rr * th)).r, room(toUv(vW + rg * th)).g, room(toUv(vW + rb * th)).b);
    vec3 body = seen * mix(vec3(1.0), uTint, .4) * 1.1;
    // the lights live in the world: a soft source gives a broad, dim lobe; a small one a sharp, bright one
    vec3 light = vec3(0.0);
    for (int i = 0; i < 3; i++) {
      vec3 L = normalize(uLP[i] - vW), H = normalize(L + V);
      float s = uLS[i];
      float front = pow(max(dot(N, H), 0.0), s) * (s + 2.0) / 18.0 * smoothstep(0.0, .25, dot(N, L));   // only lights the surface can see
      float back = pow(max(dot(-L, V), 0.0), 2.0) * pow(f, 3.0) * .7;      // a light behind glows through the rim
      // glass reflects little face-on and a lot at a glance (Fresnel); the source itself shows as a small sharp glint
      float F = .05 + .95 * pow(f, 4.0);
      float glint = pow(max(dot(N, H), 0.0), 420.0) * smoothstep(0.0, .25, dot(N, L));
      light += uLC[i] * ((front * F + glint * .5) * uSpec + back * .9);
    }
    // the edge: brighter where the surface turns away, lit by what the room holds there
    light += pow(f, uRimPow) * uRim * (.35 + min(seen * 2.5, vec3(.8))) * mix(vec3(1.0), uTint, .3);
    vec3 innerEdge = vec3(exp(-pow((rho - ri * 1.012) / .045, 2.0)), exp(-pow((rho - ri) / .045, 2.0)), exp(-pow((rho - ri * .988) / .045, 2.0)));
    light += on * uWallGlow * (wall * .36 * (.5 + min(seen * 2.0, vec3(.9))) + innerEdge * .42) * mix(vec3(1.0), uTint, .35);
    // the voice: an eclipse. The core dims a little and the rim lights up as a soft corona, louder words brighter
    light += pow(f, uRimPow * .65) * uVoice * .6 * mix(vec3(1.0), uTint, .5);
    body *= 1.0 - uVoice * .3 * ndv;
    float a = uBody * (.55 + .45 * f) + wall * .18 * uWallGlow;
    vec3 col = body * a + light;
    gl_FragColor = vec4(col, clamp(a + dot(light, vec3(.3)) * .6, 0.0, 1.0)) * uFade;
  }`;
const GU = Object.assign({}, U, {
  uPtr: { value: new THREE.Vector2(-9, -9) }, uGlitch: { value: 0 }, uVoice: { value: 0 }, uFlow: { value: 0 },
  uProj: { value: new THREE.Matrix4() }, uBuf: { value: new THREE.Vector2(1, 1) },
  uRefract: { value: G.refract }, uDisperse: { value: G.disperse }, uBody: { value: G.body }, uRim: { value: G.rim }, uRimPow: { value: G.rimPow },
  uSpec: { value: G.spec }, uFade: { value: 1 }, uWall: { value: G.wall }, uWallGlow: { value: G.wallGlow }, uTint: { value: new THREE.Color(G.tint) },
  uLP: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uLC: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
  uLS: { value: [10, 10, 10] },
});
// max blending: the glass is light and a little shade, so stacked pieces never pile up into a solid, and rods show
// through the nodes as the inner edges of the reference cube do
const glassMat = (rod, geoR) => new THREE.ShaderMaterial({
  uniforms: Object.assign({}, GU, { uRod: { value: rod ? 1 : 0 }, uGeoR: { value: geoR } }), defines: { CUT: rod ? 1 : 0 },
  vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
});

/* ---------------------------------------------------------------- the lattice: 27 nodes and every rod any pose needs */
const LAT = []; for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) LAT.push(new THREE.Vector3(x, y, z));
const idx = (x, y, z) => (x + 1) * 9 + (y + 1) * 3 + (z + 1);
const CEN = idx(0, 0, 0);
// the ambigram (v4's centre-diagonal N): stroke k, segment j
const AMB = [[[-1, 1, 1], [-1, 0, 1], [-1, -1, 1]], [[1, 1, -1], [1, 0, -1], [1, -1, -1]], [[-1, 0, 0], [0, 0, 0], [1, 0, 0]], [[1, 1, -1], [0, 0, 0], [-1, -1, 1]]];
const IS_STROKE = LAT.map(p => AMB.flat().some(q => q[0] === p.x && q[1] === p.y && q[2] === p.z));
const letterMask = (k, h) => k === 2 ? h : k === 3 ? 1 - h : 1;
const nodeMask = (i, h) => (LAT[i].y === 0 && LAT[i].z === 0 && LAT[i].x !== 0) ? h : 1;
const RODS = [], rodOf = new Map();
const addRod = (a, b) => { const k = Math.min(a, b) + '-' + Math.max(a, b); if (!rodOf.has(k)) { rodOf.set(k, RODS.length); RODS.push([a, b]); } return rodOf.get(k); };
const rodId = (a, b) => rodOf.get(Math.min(a, b) + '-' + Math.max(a, b));
LAT.forEach((p, a) => LAT.forEach((q, b) => { if (a < b && p.distanceTo(q) < 1.01) addRod(a, b); }));       // 54 lattice edges
const AMB_ROD = AMB.map(pts => pts.slice(1).map((p, j) => addRod(idx(...pts[j]), idx(...p))));
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, y]) => addRod(CEN, idx(x, y, 0)));               // the square's spokes
// the square: the middle layer (z 0), its 12 edges and 4 spokes
const SQ_NODES = LAT.map((p, i) => i).filter(i => LAT[i].z === 0);
const SQ_RODS = RODS.map((r, i) => i).filter(i => { const [a, b] = RODS[i]; return LAT[a].z === 0 && LAT[b].z === 0; });
// How it works: one shape per card, each grown out of the last: a node, a pair, a triangle, a tetrahedron (four of the
// cube's corners) and an octahedron (its six face centres). Six nodes carry it; the cube takes them back afterwards.
const SLOTS = [CEN, idx(-1, 0, 0), idx(0, 1, 0), idx(0, -1, 0), idx(0, 0, 1), idx(0, 0, -1)];
const T = .95, O = 1.35;
const FORMS = [
  { p: [[0, 0, 0]], r: .62 },
  { p: [[-1.25, 0, 0], [1.25, 0, 0]], r: .5 },
  { p: [[0, 1.35, 0], [-1.17, -.68, 0], [1.17, -.68, 0]], r: .44 },
  { p: [[T, T, T], [-T, -T, T], [-T, T, -T], [T, -T, -T]], r: .4 },
  { p: [[O, 0, 0], [-O, 0, 0], [0, O, 0], [0, -O, 0], [0, 0, O], [0, 0, -O]], r: .34 },
];
FORMS.forEach(F => {
  const n = F.p.length;
  // every pair of nodes, except the octahedron's opposite corners
  F.e = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (!(n === 6 && b === a + 1 && a % 2 === 0)) F.e.push(addRod(SLOTS[a], SLOTS[b]));
});
const TARGET_NODES = LAT.map((_, i) => i).filter(i => IS_STROKE[i]).filter((_, m) => m % 2 === 0);
// the hero's thin lines: lattice edges between letter nodes, and four long diagonals across the cube
const EDGE_PAIRS = (() => {
  const out = [], s = LAT.map((_, i) => i).filter(i => IS_STROKE[i]);
  s.forEach((a, m) => s.slice(m + 1).forEach(b => { if (LAT[a].distanceTo(LAT[b]) < 1.01) out.push([a, b]); }));
  return out.concat([[0, 26], [2, 24], [6, 20], [8, 18]]);
})();

/* ---------------------------------------------------------------- a pose: everything one frame needs, so poses can be mixed */
const NR = RODS.length;
const newPose = () => ({ x: 0, y: 0, S: 1, q: new THREE.Quaternion(), P: new Float32Array(81), Z: new Float32Array(27), D: new Float32Array(NR), w: 1, lines: 0, fade: 1, lean: 1, tilt: 0 });
function mixPose(o, a, b, k) {
  o.x = lerp(a.x, b.x, k); o.y = lerp(a.y, b.y, k); o.S = lerp(a.S, b.S, k); o.q.copy(a.q).slerp(b.q, k);
  for (let i = 0; i < 81; i++) o.P[i] = lerp(a.P[i], b.P[i], k);
  for (let i = 0; i < 27; i++) o.Z[i] = lerp(a.Z[i], b.Z[i], k);
  for (let i = 0; i < NR; i++) o.D[i] = lerp(a.D[i], b.D[i], k);
  o.w = lerp(a.w, b.w, k); o.lines = lerp(a.lines, b.lines, k); o.fade = lerp(a.fade, b.fade, k); o.lean = lerp(a.lean, b.lean, k); o.tilt = lerp(a.tilt, b.tilt, k);
  return o;
}
const setLat = (p, sx, sy, sz) => { LAT.forEach((v, i) => { p.P[i * 3] = v.x * sx; p.P[i * 3 + 1] = v.y * sy; p.P[i * 3 + 2] = v.z * sz; }); };
const A = newPose(), B = newPose(), C = newPose(), OUT = newPose(), TMP = newPose();

/* ---------------------------------------------------------------- the scene */
let gl = null;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), UP = new THREE.Vector3(0, 1, 0);
const qa = (axis, deg) => new THREE.Quaternion().setFromAxisAngle(axis, deg * Math.PI / 180);
const Q_START = qa(Y, 45).premultiply(qa(X, -35.26)), Q_N = qa(Y, 90), Q_DEEP = qa(Y, -38).premultiply(qa(X, 26)), Q_ID = new THREE.Quaternion();
try { if (glCv) gl = makeGlass(); } catch (e) { console.warn('WebGL unavailable for the glass', e); }

function makeGlass() {
  const renderer = new THREE.WebGLRenderer({ canvas: glCv, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 4000);
  const outer = new THREE.Group(), inner = new THREE.Group(); outer.add(inner); scene.add(outer);
  const nodeGeo = new THREE.SphereGeometry(.27, 56, 40), cubeGeo = new RoundedBoxGeometry(.44, .44, .44, 6, .06);
  const nodes = new THREE.InstancedMesh(nodeGeo, glassMat(false, .27), 27); nodes.frustumCulled = false;
  const rodGeo = new THREE.CylinderGeometry(.085, .085, 1, 32, 1, false); rodGeo.translate(0, .5, 0);
  const rods = new THREE.InstancedMesh(rodGeo, glassMat(true, .085), NR); rods.frustumCulled = false;
  const CUTS = [0, 1, 2, 3].map(() => new THREE.InstancedBufferAttribute(new Float32Array(NR * 4), 4));
  CUTS.forEach((a, k) => rodGeo.setAttribute('aC' + k, a));
  const lineGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(EDGE_PAIRS.length * 6), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const lines = new THREE.LineSegments(lineGeo, lineMat); lines.frustumCulled = false; lines.renderOrder = -1;
  const ends = [...new Set(EDGE_PAIRS.flat())], MARKS = ends.map(i => ({ i, k: 0 })).concat([[0, 26], [2, 24], [6, 20], [8, 18]].map(([a, b]) => ({ a, b, k: 1 })));
  const markGeo = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(new Float32Array(MARKS.length * 3), 3))
    .setAttribute('aVis', new THREE.BufferAttribute(new Float32Array(MARKS.length), 1))
    .setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(MARKS.map(m => m.k)), 1));
  const markMat = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, uniforms: { uOp: { value: 0 }, uPx: { value: 14 } },
    vertexShader: `attribute float aVis, aKind; uniform float uPx; varying float vVis, vKind;
      void main() { vVis = aVis; vKind = aKind; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = uPx * (aKind > .5 ? .8 : 1.0); }`,
    fragmentShader: `uniform float uOp; varying float vVis, vKind;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0; float a;
        if (vKind > .5) { vec2 q = abs(p); float s = max(q.x, q.y); a = smoothstep(.62, .7, s) * (1.0 - smoothstep(.86, .94, s)); }   // a small square
        else { float r = length(p); a = smoothstep(.5, .58, r) * (1.0 - smoothstep(.7, .78, r)) + (1.0 - smoothstep(.12, .2, r))     // a ring and its dot
          + step(abs(p.y), .05) * step(.82, abs(p.x)) + step(abs(p.x), .05) * step(.82, abs(p.y)); }                                   // and four ticks
        gl_FragColor = vec4(vec3(1.0), a * uOp * vVis);
      }` });
  const marks = new THREE.Points(markGeo, markMat); marks.frustumCulled = false; marks.renderOrder = -1;
  inner.add(lines, marks, rods, nodes);
  // post: the glass draws into a multisampled buffer, then a soft copy (half size) and a bloom (quarter size, two
  // widening blurs) are made from it, and the composite splits the colours like a lens and adds the grain
  const opt = { type: THREE.HalfFloatType, depthBuffer: false };
  const main = new THREE.WebGLRenderTarget(1, 1, Object.assign({ samples: 4 }, opt));
  const h1 = new THREE.WebGLRenderTarget(1, 1, opt), h2 = new THREE.WebGLRenderTarget(1, 1, opt);
  const q1 = new THREE.WebGLRenderTarget(1, 1, opt), q2 = new THREE.WebGLRenderTarget(1, 1, opt);
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsScene = new THREE.Scene(), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); fsScene.add(quad);
  const copyMat = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, uTexel: { value: new THREE.Vector2() } }, vertexShader: FS_VERT, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D t; uniform vec2 uTexel; varying vec2 vUv;
      void main() { vec2 o = uTexel * .5; gl_FragColor = .25 * (texture2D(t, vUv + vec2(o.x, o.y)) + texture2D(t, vUv - vec2(o.x, o.y)) + texture2D(t, vUv + vec2(o.x, -o.y)) + texture2D(t, vUv + vec2(-o.x, o.y))); }` });
  const blurMat = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: FS_VERT, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D t; uniform vec2 uDir; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(t, vUv) * .2270270;
        c += (texture2D(t, vUv + uDir * 1.3846154) + texture2D(t, vUv - uDir * 1.3846154)) * .3162162;
        c += (texture2D(t, vUv + uDir * 3.2307692) + texture2D(t, vUv - uDir * 3.2307692)) * .0702703;
        gl_FragColor = c;
      }` });
  const compMat = new THREE.ShaderMaterial({
    uniforms: { tMain: { value: main.texture }, tSoft: { value: h1.texture }, tBloom: { value: q1.texture }, uBufPx: { value: new THREE.Vector2(1, 1) },
      uSoft: { value: G.soft }, uBloom: { value: G.bloom }, uCA: { value: G.ca }, uGrain: { value: G.grain } },
    vertexShader: FS_VERT, depthTest: false, depthWrite: false, blending: THREE.NoBlending,
    fragmentShader: `uniform sampler2D tMain, tSoft, tBloom; uniform vec2 uBufPx; uniform float uSoft, uBloom, uCA, uGrain; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec4 split(sampler2D t, vec2 uv, vec2 o) { vec4 r = texture2D(t, uv + o), g = texture2D(t, uv), b = texture2D(t, uv - o); return vec4(r.r, g.g, b.b, max(max(r.a, g.a), b.a)); }
      void main() {
        // lens aberration: red pushed out, blue pulled in, more toward the frame, never zero at the middle
        // px at a 900 px tall buffer, scaled with the buffer; a little everywhere, more toward the frame
        vec2 d = vUv - .5;
        vec2 o = (d * (.6 + 2.4 * length(d)) * 2.0 + vec2(.35, -.25)) * uCA * (uBufPx.y / 900.0) / uBufPx;
        vec4 c = mix(split(tMain, vUv, o), split(tSoft, vUv, o * 1.6), uSoft) + split(tBloom, vUv, o * 2.6) * uBloom;
        float g = (hash(floor(gl_FragCoord.xy)) - .5) * uGrain;
        c.rgb += g * c.a;
        c.a = clamp(max(c.a, dot(c.rgb, vec3(.3333))), 0.0, 1.0);
        c.rgb = min(c.rgb, vec3(1.0));
        gl_FragColor = c;
      }` });
  const pass = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); };
  function size() {
    renderer.setSize(innerWidth, innerHeight, false);
    const d = renderer.getPixelRatio(), w = Math.round(innerWidth * d), h = Math.round(innerHeight * d);
    main.setSize(w, h); h1.setSize(w >> 1, h >> 1); h2.setSize(w >> 1, h >> 1); q1.setSize(w >> 2, h >> 2); q2.setSize(w >> 2, h >> 2);
    GU.uBuf.value.set(w, h); compMat.uniforms.uBufPx.value.set(w, h);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  function render() {
    renderer.setRenderTarget(main); renderer.clear(); renderer.render(scene, camera);
    copyMat.uniforms.t.value = main.texture; copyMat.uniforms.uTexel.value.set(1 / main.width, 1 / main.height); pass(copyMat, h1);
    const R = G.bloomR;
    blurMat.uniforms.t.value = h1.texture; blurMat.uniforms.uDir.value.set(R / h1.width, 0); pass(blurMat, h2);
    blurMat.uniforms.t.value = h2.texture; blurMat.uniforms.uDir.value.set(0, R / h1.height); pass(blurMat, h1);
    copyMat.uniforms.t.value = h1.texture; copyMat.uniforms.uTexel.value.set(1 / h1.width, 1 / h1.height); pass(copyMat, q1);
    for (const k of [1.5, 3]) {
      blurMat.uniforms.t.value = q1.texture; blurMat.uniforms.uDir.value.set(R * k / q1.width, 0); pass(blurMat, q2);
      blurMat.uniforms.t.value = q2.texture; blurMat.uniforms.uDir.value.set(0, R * k / q1.height); pass(blurMat, q1);
    }
    pass(compMat, null);
  }
  function clear() { renderer.setRenderTarget(null); renderer.clear(); }
  size();
  const setForm = f => { nodes.geometry = f === 'cube' ? cubeGeo : nodeGeo; };
  return { renderer, scene, camera, outer, inner, nodes, rods, CUTS, lines, lineGeo, lineMat, compMat, size, render, clear, setForm, MARKS, markGeo, markMat, mats: [nodes.material, rods.material] };
}

/* ---------------------------------------------------------------- applying a pose */
const dummy = new THREE.Object3D(), va = new THREE.Vector3(), vb = new THREE.Vector3(), vd = new THREE.Vector3();
const INC = Array.from({ length: 27 }, () => []), RI = new Array(RODS.length).fill(null), qInv = new THREE.Quaternion(), uj = new THREE.Vector3();
function apply(p) {
  const { outer, inner, nodes, rods, lineGeo, lineMat } = gl;
  outer.position.set(p.x, p.y, 0); outer.scale.setScalar(p.S); inner.quaternion.copy(p.q);
  dummy.quaternion.identity();
  for (let i = 0; i < 27; i++) {
    dummy.position.set(p.P[i * 3], p.P[i * 3 + 1], p.P[i * 3 + 2]); dummy.scale.setScalar(Math.max(1e-4, p.Z[i])); dummy.updateMatrix(); nodes.setMatrixAt(i, dummy.matrix);
  }
  nodes.instanceMatrix.needsUpdate = true;
  // joints: which tubes meet at which node, then for each tube end the planes that give it the zone nearest its own direction
  for (const l of INC) l.length = 0;
  for (let r = 0; r < NR; r++) {
    RI[r] = null; const d = p.D[r];
    if (Math.abs(d) < .002) continue;
    const [a, b] = RODS[r], [s, e] = d > 0 ? [a, b] : [b, a], dir = new THREE.Vector3(p.P[e * 3] - p.P[s * 3], p.P[e * 3 + 1] - p.P[s * 3 + 1], p.P[e * 3 + 2] - p.P[s * 3 + 2]);
    const len = dir.length(); if (len < 1e-4) continue;
    dir.divideScalar(len); const ad = Math.abs(d); RI[r] = { s, e, dir, len, ad };
    INC[s].push({ r, u: dir }); if (ad > .999) INC[e].push({ r, u: dir.clone().negate() });
  }
  const R0 = .085 * p.w;
  for (let r = 0; r < NR; r++) {
    const ri = RI[r], C = gl.CUTS;
    for (let k = 0; k < 4; k++) C[k].array.fill(0, r * 4, r * 4 + 4);
    if (!ri) { dummy.position.set(0, 0, 0); dummy.scale.setScalar(1e-4); dummy.quaternion.identity(); dummy.updateMatrix(); rods.setMatrixAt(r, dummy.matrix); continue; }
    dummy.quaternion.setFromUnitVectors(UP, ri.dir); qInv.copy(dummy.quaternion).invert();
    const ext = [0, 0], off = [0, 0], pl = [[], []], ends = ri.ad > .999 ? 2 : 1;
    for (let k = 0; k < ends; k++) {
      const node = k ? ri.e : ri.s, u = k ? va.copy(ri.dir).negate() : ri.dir, sign = k ? -1 : 1;
      const near = INC[node].filter(x => x.r !== r).map(x => ({ x, c: u.dot(x.u) })).sort((m, n) => n.c - m.c).slice(0, 2);
      // a T: two tubes in line and this one square to them: it stops flush against their edge, no wedge showing through the glass
      if (near.length === 2 && Math.abs(near[0].c) < .2 && Math.abs(near[1].c) < .2 && near[0].x.u.dot(near[1].x.u) < -.9) { off[k] = R0; pl[k].push([0, sign, 0]); continue; }
      for (const { x, c } of near) {
        const cc = Math.min(.97, Math.max(-.999, c));
        ext[k] = Math.min(2.6 * R0, Math.max(ext[k], R0 * Math.sqrt((1 + cc) / (1 - cc)) * (c < -.99 ? 0 : 1)));
        uj.copy(x.u).applyQuaternion(qInv); pl[k].push([-uj.x, sign - uj.y, -uj.z]);
      }
    }
    const yS = ext[0], yE = ext[0] + ri.len * ri.ad;
    for (let k = 0; k < ends; k++) pl[k].forEach((n, j) => { const o = r * 4, a = C[k * 2 + j].array; a[o] = n[0]; a[o + 1] = n[1]; a[o + 2] = n[2]; a[o + 3] = k ? yE - off[1] : yS + off[0]; });
    va.set(p.P[ri.s * 3], p.P[ri.s * 3 + 1], p.P[ri.s * 3 + 2]);
    dummy.position.copy(va).addScaledVector(ri.dir, -ext[0]); dummy.scale.set(p.w, ext[0] + ri.len * ri.ad + ext[1], p.w); dummy.updateMatrix();
    rods.setMatrixAt(r, dummy.matrix);
  }
  gl.CUTS.forEach(c => { c.needsUpdate = true; });
  rods.instanceMatrix.needsUpdate = true;
  lineMat.opacity = p.lines; lines(p);
  for (const m of gl.mats) m.uniforms.uFade.value = p.fade;
}
function lines(p) {
  gl.markMat.uniforms.uOp.value = p.lines * .9; gl.markMat.uniforms.uPx.value = 14 * gl.renderer.getPixelRatio();
  if (p.lines < .003) return;
  const mp = gl.markGeo.attributes.position.array, mv = gl.markGeo.attributes.aVis.array;
  gl.MARKS.forEach((m, n) => {
    if (m.k) { for (let c = 0; c < 3; c++) mp[n * 3 + c] = (p.P[m.a * 3 + c] + p.P[m.b * 3 + c]) / 2; mv[n] = 1; }
    else { for (let c = 0; c < 3; c++) mp[n * 3 + c] = p.P[m.i * 3 + c]; mv[n] = 1 - smoothstep(.15, .5, p.Z[m.i]); }   // only where no node shows
  });
  gl.markGeo.attributes.position.needsUpdate = true; gl.markGeo.attributes.aVis.needsUpdate = true;
  const arr = gl.lineGeo.attributes.position.array;
  EDGE_PAIRS.forEach(([a, b], i) => { for (let k = 0; k < 3; k++) { arr[i * 6 + k] = p.P[a * 3 + k]; arr[i * 6 + 3 + k] = p.P[b * 3 + k]; } });
  gl.lineGeo.attributes.position.needsUpdate = true;
}

/* ---------------------------------------------------------------- screen ↔ world on the z = 0 plane */
const ray = new THREE.Vector3(), cam0 = new THREE.Vector3();
function toWorld(px, py, z = 0) {
  const c = gl.camera; c.updateMatrixWorld();
  ray.set(px / innerWidth * 2 - 1, 1 - py / innerHeight * 2, .5).unproject(c).sub(c.position).normalize();
  const t = (z - c.position.z) / ray.z;
  return cam0.copy(c.position).addScaledVector(ray, t).clone();
}
const ppu = () => { const a = toWorld(innerWidth / 2, innerHeight / 2), b = toWorld(innerWidth / 2 + 100, innerHeight / 2); return 100 / a.distanceTo(b); };

/* ---------------------------------------------------------------- the hero: v7's story, unchanged, as a pose */
const hero = document.querySelector('.hero'), stages = $$('.stage'), STAGE_AT = [[.20, .36], [.42, .58], [.64, .80]];
const targets = $$('.targets i');
let heroT = 0, intro = reduced ? 1 : 0, shiftX = 0;
const heroMap = p => { const K = window.NH_TAIL; if (!K || innerWidth >= 900) return p; const D0 = .20, c = 1 - (D0 - K), pe = .80 / c; return p <= pe ? p * c : .80 + (p - pe) / (1 - pe) * D0; };   // phones: everything after the third line (t .80 to 1) is squeezed into K of the hero
ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom bottom', onUpdate: s => { heroT = heroMap(s.progress); } });
gsap.to({ v: 0 }, { v: 1, duration: reduced ? 0 : 1.6, ease: 'expo.out', delay: reduced ? 0 : 1.7, onUpdate() { intro = this.targets()[0].v; } });
// v10 opening (owner, 2026-10-18): the page starts on one big, thick-walled sphere, lens-sized like the About one; over the first
// OPEN of the scroll it settles to the old start size, then the letter story runs, a touch quicker, inside the same hero length
const OPEN = +(window.NH_OPEN || 0); let heroOpen = 0;
function heroPose(o, t) {
  heroOpen = OPEN ? 1 - io(seg(t, 0, OPEN)) : 0;
  const spread = io(seg(t, OPEN || .04, .18)) * (1 - io(seg(t, .80, .94)));
  const sepK = o3(clamp(spread * 2.2)), gone = io(seg(t, .18, .30)), h = io(seg(t, .42, .54));
  if (t < .18) o.q.copy(Q_START);
  else if (t < .34) o.q.copy(Q_START).slerp(Q_N, io(seg(t, .18, .32)));
  else if (t < .40) o.q.copy(Q_N);
  else if (t < .58) { const e = io(seg(t, .40, .56)); o.q.copy(qa(Y, 90 * (1 - e))).premultiply(qa(X, 360 * e)); }
  else o.q.copy(Q_ID).slerp(Q_DEEP, io(seg(t, .62, .78)));
  const shrink = 1 - io(seg(t, .78, .88));
  setLat(o, spread, spread, spread);
  for (let i = 0; i < 27; i++) o.Z[i] = intro * (IS_STROKE[i] ? lerp(2.1, 1, sepK) * lerp(1, nodeMask(i, h), sepK) : lerp(2.1, .5, sepK) * (1 - gone));
  o.D.fill(0);
  AMB_ROD.forEach((rs, k) => rs.forEach((r, j) => { const w0 = .22 + k * .03 + j * .04; o.D[r] = o3(seg(t, w0, w0 + .06)) * shrink * letterMask(k, h); }));
  o.lines = lerp(.62, .8, seg(t, .62, .70)) * seg(t, OPEN ? OPEN + .01 : .06, .14) * (1 - seg(t, .80, .86));
  o.x = shiftX; o.y = 0; o.S = 1 + 1.1 * heroOpen; o.w = 1; o.fade = 1; o.lean = 1; o.tilt = 0;
  const back = io(seg(t, .79, .86));
  const camZ = lerp(lerp(5.9, 3.0, io(seg(t, .60, .78))), 6.6, back);
  const flat = Math.max(seg(t, .29, .32) * (1 - seg(t, .405, .43)), seg(t, .53, .56) * (1 - seg(t, .63, .66)));
  // phones: through the first two lines (the N, then the H) the object sits a bit above the middle, clear of the text at the bottom;
  // it eases back before the third line (owner, 2026-10-18)
  if (innerWidth < 900) o.y = .07 * 2 * camZ * (innerWidth / innerHeight < 1 ? 1.6 : 1) * Math.tan(THREE.MathUtils.degToRad(19)) * io(seg(t, .12, .22)) * (1 - io(seg(t, .56, .66)));
  return { camZ, flat: io(flat), targetsOn: t > .12 && t < .79 };
}
// one ball at a time: S scales the whole piece, Z each node
function ballPose(o, px, py, rPx, unit) {
  const w = toWorld(px, py); o.x = w.x; o.y = w.y;
  o.S = rPx / unit / .27; o.q.copy(Q_ID); o.P.fill(0); o.Z.fill(0); o.Z[CEN] = 1; o.D.fill(0); o.w = 1; o.lines = 0; o.fade = 1; o.lean = .5; o.tilt = 0;
}

/* ---------------------------------------------------------------- how it works: one more node per card */
const about = document.querySelector('#about'), howSec = document.querySelector('.how'), cards = $$('.card');
const slot = document.querySelector('.mark-slot');
const faqSec = document.querySelector('.faq-sec'), callSec = document.querySelector('#call');
// the shape at f (0 the first card … 4 the last): whole numbers hold a shape; between them the shape bursts open, turns
// and the new nodes split off the old ones, so each card arrives with one more stage of the system
function howPose(o, f, unit, time, cx, cy) {
  const a = clamp(Math.floor(f), 0, FORMS.length - 1), b = Math.min(FORMS.length - 1, a + 1), t = b > a ? clamp(f - a) : 0;
  const Fa = FORMS[a], Fb = FORMS[b], na = Fa.p.length, nb = Fb.p.length, e = io(t);
  o.Z.fill(0); o.D.fill(0); setLat(o, 1, 1, 1);
  const burst = 1 + Math.sin(Math.PI * e) * .55;                                   // it opens wide on the way
  SLOTS.forEach((ni, j) => {
    if (j >= Math.max(na, nb)) return;
    const from = Fa.p[j < na ? j : j % na], to = Fb.p[j < nb ? j : nb - 1];
    for (let c = 0; c < 3; c++) o.P[ni * 3 + c] = lerp(from[c], to[c], e) * burst;
    o.Z[ni] = j < na ? lerp(Fa.r, j < nb ? Fb.r : 0, e) : Fb.r * o3(seg(t, .12, .7));
    o.Z[ni] /= .27;
  });
  const keep = new Set(Fa.e.filter(r => Fb.e.includes(r)));
  Fa.e.forEach(r => { o.D[r] = keep.has(r) ? 1 : 1 - o3(seg(t, 0, .3)); });
  Fb.e.forEach(r => { if (!keep.has(r)) o.D[r] = o3(seg(t, .58, 1)); });
  for (let i = 0; i < 27; i++) o.Z[i] *= 1 + Math.sin(time * 1.8 + i) * .025;
  const spacePx = Math.min(innerWidth, innerHeight) * (innerWidth < 900 ? .22 : .24), S = spacePx / unit;
  const w = toWorld(cx, cy);
  o.x = w.x; o.y = w.y; o.S = S;
  // a slow tumble, plus a decisive turn between cards
  o.q.copy(qa(Y, 25 + (a + e) * 110 + time * 7)).premultiply(qa(X, 16 + Math.sin(time * .3) * 6 + e * 30 * Math.sin(Math.PI * e)));
  o.w = 1.05; o.lines = 0; o.fade = 1; o.lean = .35; o.tilt = 0;
}
// where the shape sits: the middle of the screen, on the cards' line
function howCentre() {
  const r = cards[0].querySelector('.card-in').getBoundingClientRect();
  return innerWidth < 900 ? [innerWidth / 2, innerHeight * .5] : [innerWidth / 2, r.top + r.height / 2];
}
// the cards: the first one is centred when How arrives; each holds at the centre, then the next slides in
const track = document.querySelector('.cards-track');
let howT = 0;
ScrollTrigger.create({ trigger: howSec, start: 'top top', end: 'bottom bottom', onUpdate: s => { howT = s.progress; } });
function howStep() {
  const g = howT * (cards.length - 1), a = Math.floor(g), fr = g - a;
  return Math.min(cards.length - 1, a + io(clamp((fr - .28) / .72)));
}
function phoneStep() {
  let f = 0;
  cards.forEach((c, i) => { if (i) { const r = c.getBoundingClientRect(); f += io(seg(r.top + r.height / 2, innerHeight * .95, innerHeight * .5)); } });
  return f;
}
function moveTrack(f) {
  if (!track || innerWidth < 900 || reduced) { track?.style.removeProperty('--tx8'); return; }
  const step = cards[1].offsetLeft - cards[0].offsetLeft;
  track.style.setProperty('--tx8', (-f * step).toFixed(1) + 'px');
}

/* ---------------------------------------------------------------- after the last card: the cube opens big, then locks as the square */
function cubePose(o, d, unit, time) {
  const spacePx = Math.min(innerWidth, innerHeight) * .5, S = spacePx / unit;
  const w = toWorld(innerWidth * .5, innerHeight * .5);
  o.x = w.x; o.y = w.y; o.S = S;
  const st = 1.25 + Math.sin(d * Math.PI) * .25;      // stretched open, like the hero's deep shot
  setLat(o, st * 1.12, st, st * .9);
  for (let i = 0; i < 27; i++) o.Z[i] = .5 + (i === CEN ? .25 : 0);
  o.D.fill(0);
  for (let r = 0; r < 54; r++) o.D[r] = o3(seg(d, .02 + (r % 9) * .012, .2 + (r % 9) * .012));
  o.q.copy(Q_START).premultiply(qa(Y, d * 140 + time * 2)).premultiply(qa(X, Math.sin(d * 3) * 12));
  o.w = .55; o.lines = 0; o.fade = .75; o.lean = .4; o.tilt = 0;
}
const slotPtr = { x: .5, y: .5, tx: .5, ty: .5, on: 0, ton: 0 };
slot?.addEventListener('pointermove', e => { const r = slot.getBoundingClientRect(); slotPtr.tx = (e.clientX - r.left) / r.width; slotPtr.ty = (e.clientY - r.top) / r.height; slotPtr.ton = 1; }, { passive: true });
slot?.addEventListener('pointerleave', () => { slotPtr.tx = slotPtr.ty = .5; slotPtr.ton = 0; });
function squarePose(o, unit, time) {
  const r = slot.getBoundingClientRect(), spacePx = Math.min(r.width, r.height) * .3, S = spacePx / unit;
  const w = toWorld(r.left + r.width / 2, r.top + r.height / 2);
  o.x = w.x; o.y = w.y; o.S = S;
  setLat(o, 1, 1, 0);
  // under the pointer the nearest nodes rise toward you, the others less, as on the Hairline lattice
  const sx = (slotPtr.x - .5) * 3.4, sy = (.5 - slotPtr.y) * 3.4;
  o.Z.fill(0);
  SQ_NODES.forEach(i => {
    const dd = Math.hypot(LAT[i].x - sx, LAT[i].y - sy);
    o.P[i * 3 + 2] = slotPtr.on * Math.max(0, 1 - dd / 1.6) * .9;
    o.Z[i] = .62 + slotPtr.on * Math.max(0, 1 - dd / 1.4) * .18 + Math.sin(time * 1.6 + i) * .015;
  });
  // the other layers fold onto the middle one
  LAT.forEach((v, i) => { if (v.z !== 0) { o.P[i * 3 + 2] = 0; } });
  o.D.fill(0); SQ_RODS.forEach(i => { o.D[i] = 1; }); DIAG.forEach(i => { o.D[i] = 1; });
  o.q.copy(Q_ID); o.w = .7; o.lines = 0; o.fade = 1; o.lean = 0; o.tilt = 1;
}

/* ---------------------------------------------------------------- the closing (owner, 2026-10-18): from Questions to the footer */
// a huge, thick-walled sphere rises from below the screen and settles, then drifts up while it shrinks to a node and runs through
// the shapes (pair, triangle, tetrahedron, octahedron), becomes the N, turns into the H, and lands behind the call as the N / H
// ambigram turning N to H, then bursts into the whole lattice, big and thin, behind the call
let closeWall = 1;
function nhPose(o, a, unit, cx, cy, spacePx, time) {
  const h = io(seg(a, 70, 20));
  setLat(o, 1, 1, 1); o.Z.fill(0); o.D.fill(0);
  for (let i = 0; i < 27; i++) o.Z[i] = IS_STROKE[i] ? nodeMask(i, h) : 0;
  AMB_ROD.forEach((rs, k) => rs.forEach(r => { o.D[r] = letterMask(k, h); }));
  const w = toWorld(cx, cy); o.x = w.x; o.y = w.y; o.S = spacePx / unit;
  o.q.copy(qa(Y, a)).premultiply(qa(X, Math.sin(time * .4) * 7 - 4));
  o.w = 1; o.lines = 0; o.fade = 1; o.lean = .5; o.tilt = 0;
}
function closingPose(o, u, unit, time) {
  const cx = innerWidth / 2, ih = innerHeight, cy = ih * .5, sp = Math.min(innerWidth, ih) * (innerWidth < 900 ? .22 : .24);
  const rBig = ih * (innerWidth < 900 ? .62 : .8), r0 = .62 * sp;
  const rise = o3(seg(u, 0, .14)), settle = io(seg(u, .14, .34));
  closeWall = lerp(1, .42, 1 - settle);                                   // the big sphere keeps the thick wall; it thins as it shrinks to the node's size
  if (u < .34) {
    const bigY = lerp(lerp(ih + rBig * 1.08, ih + rBig * .375, rise), cy, settle);
    ballPose(o, cx, bigY, lerp(rBig, r0, settle), unit); return;
  }
  if (u < .56) { howPose(o, 4 * io(seg(u, .34, .56)), unit, time, cx, cy); return; }
  nhPose(A, 90 * (1 - io(seg(u, .66, .74))), unit, cx, cy, sp * 1.05, time);                // the N, then it turns into the H
  if (u < .64) { howPose(C, 4, unit, time, cx, cy); mixPose(o, C, A, io(seg(u, .56, .64))); return; }
  if (u < .76) { mixPose(o, A, A, 0); return; }
  // then it bursts into the whole lattice, huge and thin, so the big text reads over a web of many connected points
  const R = Math.max(innerWidth, ih) * .34, k = o3(seg(u, .76, .94)), w = toWorld(cx, cy);
  setLat(B, 1, 1, 1); B.Z.fill(.32); B.D.fill(0); for (let r = 0; r < 54; r++) B.D[r] = 1;
  B.x = w.x; B.y = w.y; B.S = R / unit; B.q.copy(qa(Y, 20 + time * 6)).premultiply(qa(X, -18 + Math.sin(time * .2) * 6));
  B.w = .3; B.lines = 0; B.fade = 1; B.lean = .4; B.tilt = 0;
  mixPose(o, A, B, k); o.S *= 1 + Math.sin(Math.PI * k) * .3;
}

/* ---------------------------------------------------------------- the lights: rigs in the world */
function placeLights() {
  const rig = RIGS[G.lights] || RIGS.orb, o = window.NHOrb || { x: .5, y: .5, i: .5 };
  rig.forEach((l, i) => {
    if (l.orb !== undefined) gl.mats.forEach(m => m.uniforms.uLP.value[i].copy(toWorld(orbFx.x * innerWidth, (1 - orbFx.y) * innerHeight, l.orb)));
    else gl.mats.forEach(m => m.uniforms.uLP.value[i].set(...l.p));
    const c = l.c * (l.orb !== undefined ? (.4 + o.i * G.orb) * G.cursor : 1);
    const k = LCOLS[G.lightCol] || LCOLS.white;
    gl.mats.forEach(m => { m.uniforms.uLC.value[i].set(c * k[0], c * k[1], c * k[2]); m.uniforms.uLS.value[i] = l.s; });
  });
}

/* ---------------------------------------------------------------- the orb follows the shape */
// where the shape is on screen and how far it reaches (uv units, y up): its centre and the furthest visible node
const sv = new THREE.Vector3(), sm = new THREE.Matrix4();
function shapeOnScreen(cam) {
  gl.inner.updateMatrixWorld();
  const c = gl.outer.position.clone().project(cam), cx = (c.x + 1) / 2, cy = (c.y + 1) / 2, asp = innerWidth / innerHeight;
  let R = 0;
  for (let i = 0; i < 27; i++) {
    gl.nodes.getMatrixAt(i, sm); const s = new THREE.Vector3().setFromMatrixScale(sm).x;
    if (s < .05) continue;
    sv.setFromMatrixPosition(sm).applyMatrix4(gl.inner.matrixWorld).project(cam);
    const d = Math.hypot(((sv.x + 1) / 2 - cx) * asp, (sv.y + 1) / 2 - cy);
    const rr = s * .27 * gl.outer.scale.x / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.distanceTo(gl.outer.position));
    R = Math.max(R, d + rr);
  }
  return { x: cx, y: cy, R };
}
// the pointer's orb, pushed out to the shape's rim when it would sit behind it (a light dead behind glass only washes it),
// and grown with the shape, so the light reads as one with it as it opens, closes and travels
function setOrb(o, shape) {
  let tx = o.x, ty = 1 - o.y, ts = 1;
  if (shape && shape.R > .01) {
    const asp = innerWidth / innerHeight, dx = (tx - shape.x) * asp, dy = ty - shape.y, d = Math.hypot(dx, dy) || 1e-4;
    const rim = shape.R * 1.04;
    if (d < rim) { const k = G.orbRim; tx = lerp(tx, shape.x + dx / d * rim / asp, k); ty = lerp(ty, shape.y + dy / d * rim, k); }
    ts = 1 + Math.min(.7, shape.R * 1.4) * G.orbRim;
  }
  const k = reduced ? 1 : .1;
  orbFx.x += (tx - orbFx.x) * k; orbFx.y += (ty - orbFx.y) * k; orbFx.s += (ts - orbFx.s) * k;
  U.uOrb.value.set(orbFx.x, orbFx.y, o.i * G.orb, G.orbSize * orbFx.s);
}

/* ---------------------------------------------------------------- one loop */
let which = 'hero', lastTargets = null, lockFlat = 0, lockGoal = 0, wallGoal = 1, k1T = 0, k1S = 0, k1Time = 0;
const orbFx = { x: .5, y: .5, s: 1 }, glitchP = { x: -1e4, y: -1e4, v: 0, on: 0 };
// v10 "Measure the leak" (landing-nh10.js sets window.NH_LEAKMODE.on and window.NH_VOICE.level): leakK eases the object into the
// opening sphere while the layer is open; voiceS is the voice's loudness, smoothed. Both stay 0 on v9.
let leakK = 0, voiceS = 0; const LKP = newPose(), lkT = { x: 0, y: 0, r: 0, set: false };
function frame(time) {
  { const lm = window.NH_LEAKMODE, vo = window.NH_VOICE;
    leakK += ((lm && lm.on ? 1 : 0) - leakK) * (reduced ? 1 : .1);
    const vl = vo ? vo.level : 0; voiceS += (vl - voiceS) * (vl > voiceS ? .45 : .12); }   // quick to rise, slow to fall, like a breath
  ptr.x += (ptr.tx - ptr.x) * (reduced ? 1 : .07); ptr.y += (ptr.ty - ptr.y) * (reduced ? 1 : .07);
  const kp = reduced ? 1 : .08;
  slotPtr.x += (slotPtr.tx - slotPtr.x) * kp; slotPtr.y += (slotPtr.ty - slotPtr.y) * kp; slotPtr.on += (slotPtr.ton - slotPtr.on) * kp;
  const o = window.NHOrb || { x: .5, y: .5, i: .5 };
  U.uRes.value.set(innerWidth, innerHeight);
  U.uRing.value = G.ring; U.uAura.value = G.aura; U.uLeak.value = G.leak; U.uTime.value = time;
  if (!gl) { setOrb(o, null); if (bg) bg.r.render(bg.s, bg.c); return; }
  const ih = innerHeight, cam = gl.camera, narrow = innerWidth / innerHeight < 1 ? 1.6 : 1;
  const hr = hero.getBoundingClientRect();
  // hero stages push the mark aside (as v7)
  const sx = !wide() ? 0 : STAGE_AT[0][0] <= heroT && heroT < STAGE_AT[0][1] || STAGE_AT[2][0] <= heroT && heroT < STAGE_AT[2][1] ? 1.1 : STAGE_AT[1][0] <= heroT && heroT < STAGE_AT[1][1] ? -1.1 : 0;
  shiftX += (sx - shiftX) * (reduced ? 1 : .05);
  let camZ = 6.6, flat = 0, targetsOn = false, visible = true;
  if (hr.bottom > ih + 1) {
    which = 'hero';
    ({ camZ, flat, targetsOn } = heroPose(OUT, heroT));
  }
  // the camera: as the hero leaves it, for the rest of the page
  // v9: while a letter or the square holds, the lens goes very long (1.2°) and moves back to match: no perspective left
  flat = Math.max(flat, lockFlat);
  const fov = lerp(38, 1.2, flat), zoomK = Math.tan(THREE.MathUtils.degToRad(19)) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  const lean = 1 - flat;
  cam.position.set(ptr.x * .5 * lean, -ptr.y * .35 * lean, camZ * narrow * zoomK); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  { // the hover glitch lives only on the opening sphere; it fades as the sphere settles and is gone once the hero moves on
    const sp = Math.min(1, Math.hypot(ptr.px - glitchP.x, ptr.py - glitchP.y) / ih * 6); glitchP.x = ptr.px; glitchP.y = ptr.py;
    glitchP.v += (sp - glitchP.v) * .06; glitchP.on += ((ptr.px > -1e3 ? 1 : 0) - glitchP.on) * .05;
    // owner (2026-10-18, second pass): subtler and more fluid; it now swells with the pointer's speed and settles slowly
    GU.uGlitch.value = reduced ? 0 : seg(heroOpen, .12, .55) * glitchP.on * (.2 + .8 * glitchP.v) * .55;
    GU.uFlow.value = 0;   // owner (2026-10-18, third pass): no smoky flow in the leak; the same sphere, only bigger
    GU.uVoice.value = leakK * voiceS * (reduced ? .4 : 1);
    GU.uPtr.value.set(ptr.px / innerWidth, 1 - ptr.py / ih);
  }
  // the ball becoming the About lens: on phones it follows the scroll with a little inertia, so it eases in whatever the scroll distance
  k1S += (k1T - k1S) * (innerWidth < 900 && !reduced ? 1 - Math.exp(-Math.min(.1, Math.max(0, time - k1Time)) * 3.5) : 1); k1Time = time;
  let k1Next = hr.bottom > ih + 1 ? 0 : 1;
  lockGoal = 0; wallGoal = 1 - (hr.bottom > ih + 1 ? .3 * heroOpen : 0);   // the opening sphere is 2.1x bigger, so its wall is thinner to read as thick as the old start
  if (hr.bottom <= ih + 1) {
    const unit = ppu(); heroPose(A, 1);
    const ar = about.getBoundingClientRect(), hw = howSec.getBoundingClientRect();
    const fH = innerWidth < 900 ? phoneStep() : howStep(), [hx, hy] = howCentre();
    moveTrack(fH);
    if (hw.top > 0) {
      // About: the ball grows into a big lens behind the sentence, then settles in the middle of How as the first card arrives
      which = 'about';
      const b = clamp((ih - ar.top) / (ar.height + ih));
      const big = Math.min(innerWidth, ih) * .3 * (1 + Math.sin(time * .6) * .015);
      ballPose(B, innerWidth / 2 + Math.sin(b * Math.PI) * innerWidth * .04, ih * .5, big, unit);
      B.q.copy(qa(Y, b * 60)); B.lean = .6;
      howPose(C, 0, unit, time, hx, Math.min(hy, ih * .9));
      const k1 = io(seg(b, 0, innerWidth < 900 ? .12 : .28)), k2 = io(seg(b, .58, 1)); k1Next = k1;      // owner 2026-10-18: the descent starts earlier and runs longer
      wallGoal = 1 - k1S * (1 - io(seg(b, .5, .72)));            // thin while it reads as a lens, thick again before it descends far
      mixPose(TMP, A, B, k1S);
      mixPose(OUT, TMP, C, k2);
    } else if (hw.bottom > ih) {
      which = 'how';
      howPose(OUT, fH, unit, time, hx, hy);
    } else {
      const sr = slot.getBoundingClientRect(), c0 = (sr.top + sr.height / 2) - hw.bottom;
      const d = clamp((ih - hw.bottom) / (c0 + ih / 2));
      howPose(A, cards.length - 1, unit, time, hx, hy);
      lockGoal = io(seg(d, .8, 1));
      if (d < 1) {
        which = 'bridge';
        cubePose(B, d, unit, time);
        squarePose(C, unit, time);
        const k1 = io(seg(d, 0, .26)), k2 = io(seg(d, .66, 1));
        mixPose(TMP, A, B, k1);
        mixPose(OUT, TMP, C, k2);
      } else {
        const fq = faqSec.getBoundingClientRect(), cl = callSec.getBoundingClientRect();
        const cu = clamp((ih * .95 - fq.top) / (fq.height + ih * .95 + (cl.height - ih) * .35));       // 0 before Questions, 1 once the call is half read
        if (cu > 0) { which = 'closing'; lockGoal = 0; closingPose(OUT, cu, unit, time); wallGoal = closeWall; }
        else {
        which = 'slot'; lockGoal = 1;
        squarePose(OUT, unit, time);
        OUT.fade = clamp((sr.bottom + sr.height * .2) / (sr.height * .6));      // leaves with its section
        if (sr.bottom < -sr.height * .2) visible = false;
        }
      }
    }
  }
  // v10: Measure the leak (owner, 2026-10-18, third pass). The same sphere the home opens on grows, without disappearing, to fill
  // the screen behind the questions (the size of the owner's drawing), and moves a little while the voice speaks. No second orb,
  // no smoky flow: one ball, the same shader, so it costs what the opening already costs.
  if (leakK > .001) {
    const R = innerWidth < 900 ? Math.min(ih * .4, innerWidth * .64) : ih * .56;
    const wob = reduced ? 0 : voiceS;
    const tx = innerWidth / 2 + Math.sin(time * 1.3) * wob * 10, ty = ih / 2 + Math.cos(time * 1.1) * wob * 8;
    if (!lkT.set) { lkT.x = tx; lkT.y = ty; lkT.r = R; lkT.set = true; }
    lkT.x += (tx - lkT.x) * .2; lkT.y += (ty - lkT.y) * .2; lkT.r = R;
    ballPose(LKP, lkT.x, lkT.y, lkT.r * (1 + (reduced ? 0 : Math.sin(time * .8) * .01 + wob * .06)), ppu());   // it swells a little with every word
    LKP.lean = .45;
    if (!visible) { visible = true; OUT.fade = 0; }
    const fromSphere = which === 'hero' && heroOpen > .3;
    if (fromSphere) mixPose(OUT, OUT, LKP, io(leakK));          // on the opening the sphere just grows
    else if (leakK < .5) OUT.fade *= 1 - io(leakK * 2);          // anywhere else: the shape gives way to the sphere (mixing letters stacks 27 balls)
    else { mixPose(OUT, LKP, LKP, 0); const e = io(leakK * 2 - 1); OUT.fade = e; OUT.S *= .86 + .14 * e; }
    lockGoal *= 1 - leakK; wallGoal = lerp(wallGoal, .7, leakK);
    if (leakK > .5) which = 'leak';
  } else lkT.set = false;
  k1T = k1Next;
  setLayer();
  lockFlat += (lockGoal - lockFlat) * (reduced ? 1 : .12);
  if (!visible) { gl.clear(); hideTargets(); setOrb(o, null); if (bg) bg.r.render(bg.s, bg.c); return; }
  // v10 opening (owner, 2026-10-18): the sphere is a little dimmer while the opening title is up, so the title reads; it comes back
  // to full as the title leaves on scroll (NH_INTRO, from landing-nh10.js), and the leak layer always gets it at full
  if (window.NH_INTRO > 0 && which === 'hero') OUT.fade *= 1 - .38 * window.NH_INTRO * (1 - leakK);
  apply(OUT);
  // the piece leans toward the pointer (never while a letter holds square-on); in the slot it tilts under it
  const lk = OUT.lean * lean;
  gl.outer.rotation.y = (reduced ? 0 : Math.sin(time * .35) * .05 + ptr.x * .42) * lk + (slotPtr.x - .5) * .5 * OUT.tilt * slotPtr.on;
  gl.outer.rotation.x = (reduced ? 0 : Math.sin(time * .27) * .04 + ptr.y * .28) * lk + (slotPtr.y - .5) * .45 * OUT.tilt * slotPtr.on;
  gl.outer.updateMatrixWorld();
  GU.uProj.value.copy(cam.projectionMatrix);
  setOrb(o, shapeOnScreen(cam));
  if (bg) bg.r.render(bg.s, bg.c);
  // the room darkens a little around the object (Shadow: halo)
  { const c = gl.outer.position.clone().project(cam), r = Math.max(.04, OUT.S * 1.7 / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z));
    U.uHalo.value.set((c.x + 1) / 2, (c.y + 1) / 2, r, (SHADOWS[G.shadow] || SHADOWS.off).halo * OUT.fade); }
  placeLights();
  // v10: the thick wall stays on nodes and tubes, but the About lens goes back to v9's thin glass (owner, 2026-10-18)
  for (const m of gl.mats) m.uniforms.uWall.value = G.wall * wallGoal;
  gl.render();
  // the hero's corner marks follow some of the letter's nodes
  if (which === 'hero' && targetsOn) {
    const m = new THREE.Matrix4(), v = new THREE.Vector3();
    targets.forEach((el, i) => {
      gl.nodes.getMatrixAt(TARGET_NODES[i % TARGET_NODES.length], m);
      v.setFromMatrixPosition(m).applyMatrix4(gl.inner.matrixWorld).project(cam);
      el.style.opacity = 1;
      el.style.transform = `translate3d(${((v.x + 1) / 2 * innerWidth).toFixed(1)}px, ${((1 - v.y) / 2 * ih).toFixed(1)}px, 0)`;
    });
    lastTargets = true;
  } else hideTargets();
}
function hideTargets() { if (lastTargets !== false) { targets.forEach(el => { el.style.opacity = 0; }); lastTargets = false; } }

function resize() { if (bg) bg.r.setSize(innerWidth, innerHeight, false); if (gl) gl.size(); }
resize(); addEventListener('resize', resize);
gsap.ticker.add(time => frame(time));

/* ---------------------------------------------------------------- agent systems cards: the How cards' hover */
// under the pointer a card turns a little toward it (a third of v3's tilt, as the How cards in v9) and a pane of light follows
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) $$('.sys').forEach(c => {
  c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, w = (e.clientY - r.top) / r.height;
    c.style.setProperty('--ry', ((u - .5) * 22 * .3).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((w - .5) * -12 * .3).toFixed(2) + 'deg');
    c.style.setProperty('--gx', (u * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (w * 100).toFixed(1) + '%'); c.classList.add('hot');
  });
  c.addEventListener('pointerleave', () => { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); c.classList.remove('hot'); });
});

/* ---------------------------------------------------------------- the panel (drawn by landing-nh7.js) */
function applySettings() {
  if (!gl) return;
  const set = { uRefract: G.refract, uDisperse: G.disperse, uBody: G.body, uRim: G.rim, uRimPow: G.rimPow, uSpec: G.spec, uWall: G.wall, uWallGlow: G.wallGlow };
  for (const m of gl.mats) { for (const [k, v] of Object.entries(set)) m.uniforms[k].value = +v; m.uniforms.uTint.value.set(G.tint); }
  const c = gl.compMat.uniforms; c.uSoft.value = +G.soft; c.uBloom.value = +G.bloom; c.uCA.value = +G.ca; c.uGrain.value = +G.grain;
  gl.setForm(G.form);
  const R = ROOMS[G.room] || ROOMS.night; U.uLA.value.set(...R.cols[0]); U.uLB.value.set(...R.cols[1]); U.uLC2.value.set(...R.cols[2]);
  // the room is drawn at half size, so on dense screens its grain would read as coarse dots: leave it to the page overlay there
  const gm = GRAINS[G.grainMode] || GRAINS.fine; U.uGrainBg.value = (devicePixelRatio || 1) > 1.5 ? 0 : gm.bg; root.style.setProperty('--grain', gm.css);
  U.uVig.value = (SHADOWS[G.shadow] || SHADOWS.off).vig;
  U.uLCol.value.set(...(LCOLS[G.lightCol] || LCOLS.white));
  setLayer();
}
applySettings();
window.NH_PANEL = {
  title: 'Glass v9', values: G, save, apply: applySettings,
  reset() { try { localStorage.removeItem('nh9'); } catch (e) {} Object.keys(G).forEach(k => delete G[k]); Object.assign(G, DEF); },
  toggles: [
    ['Look', 'look', Object.keys(LOOKS), v => Object.assign(G, LOOKS[v])],
    ['Form', 'form', ['sphere', 'cube']],
    ['Lights', 'lights', Object.keys(RIGS)],
    ['Light colour', 'lightCol', Object.keys(LCOLS)],
    ['Room', 'room', Object.keys(ROOMS), v => { const R = ROOMS[v]; Object.assign(G, { leak: R.leak, ring: R.ring, aura: R.aura }); }],
    ['Grain (still)', 'grainMode', Object.keys(GRAINS), v => { G.grain = GRAINS[v].grain; }],
    ['Shadow', 'shadow', Object.keys(SHADOWS)],
    ['Layer', 'layer', ['auto', 'front', 'behind']],
  ],
  colors: [['Tint', 'tint']],
  knobs: [
    ['Glass', [['refract', 0, 1.5, .01], ['disperse', 0, .3, .002], ['body', 0, 1, .01], ['rim', 0, 3, .01], ['rimPow', .8, 6, .05], ['spec', 0, 3, .01], ['wall', 0, .45, .005], ['wallGlow', 0, 2.5, .01]]],
    ['Image', [['soft', 0, 1, .01], ['bloom', 0, 3, .01], ['bloomR', .2, 3, .01], ['ca', 0, 10, .05], ['grain', 0, .2, .002]]],
    ['Room', [['orb', 0, 2.5, .01], ['orbSize', .04, .4, .002], ['orbRim', 0, 1, .01], ['cursor', 0, 2, .01], ['ring', 0, 2, .01], ['aura', 0, 2, .01], ['leak', 0, 2, .01]]],
  ],
};
