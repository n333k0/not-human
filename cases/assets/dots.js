/* Not Human dot icons: every icon is drawn on the brand's dot grid (the How-card art, shrunk to 5 x 5).
   The grid sits faint, the icon's nodes are lit, a hairline joins them, and a runner can travel the line.
   Coordinates are grid steps (0..4). Colour comes from CSS `color`, so one icon works on pearl and night.

   NHDots.icon(name, {size, run, label})  -> SVG string, 5 x 5 grid
   NHDots.art(path, nodes, {run})         -> SVG string, 7 x 7 grid in a 400 box (the card art)  */
(() => {
  // name: [path through grid points, lit nodes]
  const I = {
    mail:     ['M0 1 L4 1 L4 4 L0 4 Z M0 1 L2 3 L4 1', [[0, 1], [4, 1], [0, 4], [4, 4], [2, 3]]],
    invoice:  ['M1 0 L3 0 L4 1 L4 4 L1 4 Z M2 2 L3 2 M2 3 L3 3', [[1, 0], [3, 0], [4, 1], [4, 4], [1, 4]]],
    voice:    ['M0 2 L0 2 M1 1 L1 3 M2 0 L2 4 M3 1 L3 3 M4 2 L4 2', [[0, 2], [1, 1], [1, 3], [2, 0], [2, 4], [3, 1], [3, 3], [4, 2]]],
    brain:    ['M0 1 L2 0 L4 1 L3 3 L2 4 L1 3 Z M2 0 L2 2 L1 3 M2 2 L3 3 M2 2 L0 1 M2 2 L4 1', [[0, 1], [2, 0], [4, 1], [3, 3], [2, 4], [1, 3], [2, 2]]],
    cloud:    ['M0 3 L1 2 L1 1 L2 0 L3 1 L4 2 L4 3 Z', [[0, 3], [1, 1], [2, 0], [3, 1], [4, 3]]],
    lock:     ['M1 2 L3 2 L3 4 L1 4 Z M1 2 L1 1 L2 0 L3 1 L3 2', [[1, 2], [3, 2], [3, 4], [1, 4], [2, 0], [2, 3]]],
    mesh:     ['M0 0 L4 0 M0 2 L4 2 M0 4 L4 4 M0 0 L0 4 M2 0 L2 4 M4 0 L4 4', [[0, 0], [2, 0], [4, 0], [0, 2], [2, 2], [4, 2], [0, 4], [2, 4], [4, 4]]],
    person:   ['M1 0 L3 0 L3 2 L1 2 Z M0 4 L1 3 L3 3 L4 4', [[1, 0], [3, 0], [3, 2], [1, 2], [0, 4], [4, 4]]],
    check:    ['M0 2 L1 3 L2 4 L4 0', [[0, 2], [2, 4], [4, 0]]],
    chart:    ['M0 4 L1 2 L2 3 L3 1 L4 0 M0 4 L4 4', [[0, 4], [1, 2], [2, 3], [3, 1], [4, 0]]],
    calendar: ['M0 1 L4 1 L4 4 L0 4 Z M1 0 L1 1 M3 0 L3 1', [[0, 1], [4, 1], [4, 4], [0, 4], [1, 2], [2, 2], [3, 2], [1, 3]]],
    route:    ['M0 2 L2 2 L4 0 M2 2 L4 4 M2 2 L4 2', [[0, 2], [2, 2], [4, 0], [4, 2], [4, 4]]],
    chat:     ['M0 0 L4 0 L4 3 L2 3 L1 4 L1 3 L0 3 Z', [[0, 0], [4, 0], [4, 3], [1, 4], [0, 3]]],
    coin:     ['M0 1 L4 1 L4 4 L0 4 Z M0 2 L4 2', [[0, 1], [4, 1], [4, 4], [0, 4], [3, 3]]],
    sop:      ['M1 0 L4 0 L4 3 M0 1 L3 1 L3 4 L0 4 Z M1 2 L2 2 M1 3 L2 3', [[1, 0], [4, 0], [4, 3], [0, 1], [3, 4], [0, 4]]],
    bolt:     ['M3 0 L1 2 L3 2 L1 4', [[3, 0], [1, 2], [3, 2], [1, 4]]],
    clock:    ['M2 0 L4 2 L2 4 L0 2 Z M2 2 L2 1 M2 2 L3 2', [[2, 0], [4, 2], [2, 4], [0, 2], [2, 2]]],
    search:   ['M0 0 L3 0 L3 3 L0 3 Z M3 3 L4 4', [[0, 0], [3, 0], [3, 3], [0, 3], [4, 4]]],
    team:     ['M0 3 L2 1 L4 3 Z M2 1 L2 4', [[0, 3], [2, 1], [4, 3], [2, 4]]],
    agent:    ['M0 4 L0 0 L4 4 L4 0', [[0, 4], [0, 0], [2, 2], [4, 4], [4, 0]]],          // the N, the mark's letter
    store:    ['M0 1 L4 1 L4 4 L0 4 Z M0 1 L1 0 L3 0 L4 1 M2 4 L2 2', [[0, 1], [1, 0], [3, 0], [4, 1], [4, 4], [0, 4], [2, 2]]],
    pulse:    ['M0 2 L1 2 L2 0 L3 4 L4 2', [[0, 2], [2, 0], [3, 4], [4, 2]]],
    key:      ['M0 1 L2 1 L2 3 L0 3 Z M2 2 L4 2 M3 2 L3 3 M4 2 L4 3', [[0, 1], [2, 1], [2, 3], [0, 3], [4, 2]]],
    flag:     ['M0 4 L0 0 L4 0 L3 1 L4 2 L0 2', [[0, 4], [0, 0], [4, 0], [4, 2]]],
    loop:     ['M0 2 L2 0 L4 2 L2 4 Z M2 0 L2 4', [[0, 2], [2, 0], [4, 2], [2, 4]]],
    off:      ['M2 0 L2 2 M1 1 L0 2 L1 4 L3 4 L4 2 L3 1', [[2, 0], [2, 2], [0, 2], [4, 2], [1, 4], [3, 4]]],
  };

  const grid = (n, pitch, r, o) => {
    let s = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) s += `<circle class="g" cx="${o + x * pitch}" cy="${o + y * pitch}" r="${r}"/>`;
    return s;
  };
  const scale = (d, pitch, o) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${o + x * pitch} ${o + y * pitch}`);
  const firstRun = (d) => d.split(' M')[0];   // the runner travels the first stroke only

  function icon(name, opt = {}) {
    const def = I[name] || I.agent, size = opt.size || 28, p = 10, o = 5;
    const d = scale(def[0], p, o);
    const nodes = def[1].map(([x, y]) => `<circle class="on" cx="${o + x * p}" cy="${o + y * p}" r="1.9"/>`).join('');
    const run = opt.run ? `<circle class="runner" r="1.6"><animateMotion dur="${opt.dur || 3.2}s" repeatCount="indefinite" path="${firstRun(d)}"/></circle>` : '';
    const label = opt.label ? ` role="img" aria-label="${opt.label}"` : ' aria-hidden="true"';
    return `<svg class="dot-ic" viewBox="0 0 50 50" width="${size}" height="${size}"${label}>${grid(5, p, .9, o)}<path class="trace" d="${d}"/>${nodes}${run}</svg>`;
  }

  // Branching case workflows. Static diagram first; packets share one clock so they
  // reach a review node, pause, then continue. The same SVG is used on every cover.
  const escape = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function workflow(def, opt) {
    const duration = def.duration;
    const nodes = new Map(def.nodes.map(n => [n[0], n]));
    const xy = ([x, y]) => `${50 + x * 50} ${50 + y * 50}`;
    const time = n => +(n / duration).toFixed(5);
    const paths = new Set();
    let lines = '', packets = '';
    for (const [from, to, start, travel, bends = []] of def.edges) {
      const a = nodes.get(from), b = nodes.get(to);
      const path = 'M' + [a.slice(1, 3), ...bends, b.slice(1, 3)].map(xy).join(' L');
      if (!paths.has(path)) {
        paths.add(path);
        lines += `<path class="trace" pathLength="1" d="${path}"/>`;
      }
      if (opt.run !== false) {
        const end = start + travel;
        const times = start === 0 ? `0;${time(end)};1` : `0;${time(start)};${time(end)};1`;
        const points = start === 0 ? '0;1;1' : '0;0;1;1';
        const fadeTimes = start === 0 ? `0;${time(end - .05)};${time(end)};1` : `0;${time(start)};${time(start + .05)};${time(end - .05)};${time(end)};1`;
        const fades = start === 0 ? '1;1;0;0' : '0;0;1;1;0;0';
        packets += `<circle class="runner" r="4" opacity="0"><animateMotion dur="${duration}s" repeatCount="indefinite" path="${path}" keyPoints="${points}" keyTimes="${times}" calcMode="linear"/><animate attributeName="opacity" dur="${duration}s" repeatCount="indefinite" values="${fades}" keyTimes="${fadeTimes}"/></circle>`;
      }
    }
    const dots = def.nodes.map(([, x, y, label, human]) => {
      const cx = 50 + x * 50, cy = 50 + y * 50;
      const ring = human ? `<circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="currentColor" stroke-width="1.2" vector-effect="non-scaling-stroke" opacity=".75"/>` : '';
      return `<g><title>${escape(label)}</title>${ring}<circle class="on" cx="${cx}" cy="${cy}" r="5"/></g>`;
    }).join('');
    return `<svg class="dot-art" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escape(def.label)}">${grid(7, 50, 2.4, 50)}${lines}${dots}${packets}</svg>`;
  }

  // the card art: a 7 x 7 field on a 50 pitch in a 400 box, a traced route, lit nodes, a runner (as the site's How cards)
  function art(points, opt = {}) {
    if (!Array.isArray(points)) return workflow(points, opt);
    const P = points.map(([x, y]) => [50 + x * 50, 50 + y * 50]);
    const d = 'M' + P.map(([x, y]) => `${x} ${y}`).join(' L');
    const seen = new Set(), nodes = P.filter(([x, y]) => { const k = x + ',' + y; if (seen.has(k)) return false; seen.add(k); return true; })
      .map(([x, y]) => `<circle class="on" cx="${x}" cy="${y}" r="5"/>`).join('');
    const run = opt.run === false ? '' : `<circle class="runner" r="4"><animateMotion dur="${opt.dur || 5}s" repeatCount="indefinite" path="${d}"/></circle>`;
    return `<svg class="dot-art" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${grid(7, 50, 2.4, 50)}<path class="trace" pathLength="1" d="${d}"/>${nodes}${run}</svg>`;
  }

  window.NHDots = { icon, art, names: Object.keys(I) };
})();
