// The Not Human mark: a 3×3×3 lattice in orthographic projection; every pose is a pure function of t.
// Same construction as brands/not-human/exploration.html, drawn finer. Shared by deck-nh.html (nh.js)
// and not-human.html (landing-nh.js), so a change to the motion lands on both.
window.NHMark = (() => {
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const PI = Math.PI;
  const qA = (ax, ay, az, a) => { const s = Math.sin(a / 2) / Math.hypot(ax, ay, az); return [Math.cos(a / 2), ax * s, ay * s, az * s]; };
  const qM = (a, b) => [
    a[0]*b[0] - a[1]*b[1] - a[2]*b[2] - a[3]*b[3], a[0]*b[1] + a[1]*b[0] + a[2]*b[3] - a[3]*b[2],
    a[0]*b[2] - a[1]*b[3] + a[2]*b[0] + a[3]*b[1], a[0]*b[3] + a[1]*b[2] - a[2]*b[1] + a[3]*b[0]];
  const qC = q => [q[0], -q[1], -q[2], -q[3]];
  const qV = (q, v) => {
    const [w, x, y, z] = q, tx = 2 * (y*v[2] - z*v[1]), ty = 2 * (z*v[0] - x*v[2]), tz = 2 * (x*v[1] - y*v[0]);
    return [v[0] + w*tx + (y*tz - z*ty), v[1] + w*ty + (z*tx - x*tz), v[2] + w*tz + (x*ty - y*tx)];
  };
  const io4 = t => t < .5 ? 8*t*t*t*t : 1 - Math.pow(-2*t + 2, 4) / 2;
  const o3 = t => 1 - Math.pow(1 - t, 3);
  const X = [1,0,0], Y = [0,1,0];
  // the ambigram: H square-on, N after a quarter turn; toN pre-turns it so the front reads N
  const AMB = [[[-1,1,1],[-1,0,1],[-1,-1,1]], [[1,1,-1],[1,0,-1],[1,-1,-1]], [[-1,0,0],[0,0,0],[1,0,0]], [[-1,1,-1],[-1,0,0],[-1,-1,1]]];
  const toN = p => [p[2], p[1], -p[0]];
  // centre variant (v4, owner 2026-10-17): the N's diagonal runs through the middle of the cube, from the top of one
  // column through the centre node to the foot of the other. Seen square-on it would cross the H, so the H keeps its
  // crossbar and the N its diagonal: each draws in while the other draws out, during the turn.
  const CENTRE = !!window.NH_MARK_CENTRE;
  if (CENTRE) AMB[3] = [[1,1,-1],[0,0,0],[-1,-1,1]];

  function build(preset) {
    let t = 0, q = [1, 0, 0, 0];
    const rots = [], strokes = [];
    const hold = d => { t += d; };
    const rot = (axis, deg, d) => { const q1 = qM(qA(...axis, deg * PI / 180), q); rots.push({ t0: t, d, axis, a: deg * PI / 180, q0: q, q1 }); q = q1; t += d; };
    // two turns at once, the second about a fixed world axis applied over the first: a diagonal tumble.
    // A full turn on one axis lands where the other alone would, so the end pose stays exact.
    const rot2 = (a1, deg1, a2, deg2, d) => {
      const two = [[a1, deg1 * PI / 180], [a2, deg2 * PI / 180]];
      const q1 = qM(qA(...a2, two[1][1]), qM(qA(...a1, two[0][1]), q)); rots.push({ t0: t, d, two, q0: q, q1 }); q = q1; t += d;
    };
    const line = (pts, at, d) => {
      const inv = qC(q), o = pts.map(p => qV(inv, p)), L = [0];
      for (let i = 1; i < o.length; i++) L.push(L[i-1] + Math.hypot(o[i][0]-o[i-1][0], o[i][1]-o[i-1][1], o[i][2]-o[i-1][2]));
      const s = { o, L, len: L[L.length-1], tIn: at, dIn: d, tOut: 1e9, dOut: 1 }; strokes.push(s); return s;
    };
    const out = (list, at, d) => list.forEach(s => { s.tOut = at; s.dOut = d; });
    const amb = (f, at) => AMB.map((pts, i) => line(pts.map(f), at + [0, .08, .38, .5][i], [.55, .55, .45, .5][i]));
    // the logo loop, exploration.html loop-c: tumble in, draw the H, tumble on two axes to the N, tumble out to a bare cube (a seamless seam)
    if (preset === 'loop') {
      hold(.5); rot(Y, 90, 1.0); hold(.3); rot(X, -90, 1.0); hold(.3); rot([1,1,0], 180, 1.3); hold(.45);
      const k = amb(p => p, t); hold(2.2);
      const tt = t;
      if (CENTRE) { k[2].tOut = tt + .25; k[2].dOut = .6; k[3].tIn = tt + 1.0; k[3].dIn = .7; }
      rot2(Y, 90, X, 360, 2.2); hold(1.6);
      const te = t; rot([1,-1,0], 180, 1.3); out(CENTRE ? k.filter(s => s !== k[2]) : k, te + .15, .75); hold(.35);
    }
    else if (preset === 'hero') { hold(.4); rot(Y, 90, 1.0); hold(.25); rot(X, -90, 1.0); hold(.25); rot([1,1,0], 180, 1.3); hold(.35); amb(toN, t); hold(1.5); rot(Y, -90, 1.6); hold(.9); }
    else if (preset === 'chap') { amb(toN, 0); hold(1.15); rot(Y, -90, 1.25); hold(.35); }
    return { rots, strokes, T: t };
  }

  function orient(tl, t) {
    let q = [1, 0, 0, 0];
    for (const r of tl.rots) {
      if (t >= r.t0 + r.d) q = r.q1;
      else if (t >= r.t0) {
        const e = io4((t - r.t0) / r.d);
        if (r.two) return qM(qA(...r.two[1][0], r.two[1][1] * e), qM(qA(...r.two[0][0], r.two[0][1] * e), r.q0));
        return qM(qA(...r.axis, r.a * e), r.q0);
      }
      else break;
    }
    return q;
  }

  const lattice = [];
  for (const x of [-1,0,1]) for (const y of [-1,0,1]) for (const z of [-1,0,1]) lattice.push([x, y, z]);

  // o: { cx, cy, s (px per lattice step), lw, r, line (rgb), dot (rgb), grow(i) → 0..1, tilt (quaternion), alpha }
  function draw(ctx, tl, t, o) {
    let q = orient(tl, t);
    if (o.tilt) q = qM(o.tilt, q);
    const { cx, cy, s } = o, A = o.alpha ?? 1;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = o.lw;
    ctx.strokeStyle = `rgba(${o.line},${.95 * A})`;
    ctx.beginPath();
    for (const st of tl.strokes) {
      // drawn up to b, already undrawn up to a
      const b = st.len * o3(clamp((t - st.tIn) / st.dIn)), a = st.len * o3(clamp((t - st.tOut) / st.dOut));
      if (b - a < 1e-4) continue;
      for (let i = 0; i < st.o.length - 1; i++) {
        const l0 = st.L[i], l1 = st.L[i+1], u0 = Math.max(a, l0), u1 = Math.min(b, l1);
        if (u1 <= u0) continue;
        const at = u => { const f = (u - l0) / (l1 - l0); return st.o[i].map((c, k) => c + (st.o[i+1][k] - c) * f); };
        const p0 = qV(q, at(u0)), p1 = qV(q, at(u1));
        ctx.moveTo(cx + p0[0] * s, cy - p0[1] * s); ctx.lineTo(cx + p1[0] * s, cy - p1[1] * s);
      }
    }
    ctx.stroke();
    // dots back to front, the far ones dimmer: depth without perspective
    const pts = lattice.map((p, i) => [qV(q, p), i]).sort((a, b) => a[0][2] - b[0][2]);
    for (const [v, i] of pts) {
      const g = o.grow ? o.grow(i) : 1;
      if (g <= .01) continue;
      ctx.fillStyle = `rgba(${o.dot},${A * (.38 + .62 * (v[2] / 1.74 + 1) / 2)})`;
      ctx.beginPath(); ctx.arc(cx + v[0] * s, cy - v[1] * s, o.r * g, 0, 2 * PI); ctx.fill();
    }
    return q;
  }
  return { build, draw, qA, qM, lattice };
})();
