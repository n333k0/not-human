/* The audit demo: renders audit-data.js as a scroll-told page and wires its interactions.
   Every effect has a static default: without JS the page is empty (it is generated), but with reduced motion
   everything shows at once and nothing is pinned. */
(() => {
  const A = window.NHA, I = window.NHDots.icon, body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const AR = '<svg class="ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.2 3H9v4.8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  const ARR = '<svg class="ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8M6.5 2.5 10 6 6.5 9.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const HOME = '../';   // rewritten to the site root when published
  const money = (k) => k >= 1000 ? '$' + (k / 1000).toFixed(1) + 'M' : '$' + k + 'k';
  const person = (ini) => A.people.find((p) => p[0] === ini);
  document.documentElement.classList.add('js');
  document.title = 'Audit demo · Not Human';

  const TONES = { a: '#F3F2F7', b: '#B4A6FF', c: '#6F63F2', h: '#C8BEFF', w: '#5B2CFF' };
  const AREA = { Billing: '#F3F2F7', Collections: '#B4A6FF', Close: '#6F63F2', Payables: '#9B98A8', Reporting: '#5B2CFF' };
  const totalValue = A.value.reduce((a, v) => a + v[1], 0);

  /* ---------------------------------------------------------------- pieces */
  // the three weeks as a board: one column per week, one card per day, open a card to read what we learned
  const board = () => [1, 2, 3].map((w) => {
    const days = A.agenda.filter((d) => d[1] === w);
    return `<div class="kb__col"><div class="kb__h"><span class="mono">Week</span><b>0${w}</b><span class="mono">${['Listening to the team', 'Reading a year of numbers', 'Building the plan'][w - 1]}</span><span class="mono kb__n">${days.length} days</span></div>
      ${days.map(([d, , t, who, tools, learn]) => `<details class="kc panel"><summary><span class="mono">${esc(d)} · ${who.length ? 'with the team' : 'our desk'}</span><b>${esc(t)}</b>
        <span class="kc__who">${who.map((i) => `<span class="ava" title="${esc(person(i)[1])}, ${esc(person(i)[2])}">${i}</span>`).join('')}${who.length ? `<span class="kc__names">${who.map((i) => esc(person(i)[1]) + ', ' + esc(person(i)[2])).join(' · ')}</span>` : ''}</span><span class="kc__plus" aria-hidden="true"></span></summary>
        <div class="kc__b">${tools.length ? `<div class="kc__tools">${tools.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}<span class="mono">What we learned</span><p>${esc(learn)}</p></div></details>`).join('')}</div>`;
  }).join('');

  const network = () => {
    const W = 760, H = 520, cx = W / 2, cy = H / 2, R = 200, n = A.systems.length;
    let ed = '', nd = '', pk = '';
    A.systems.forEach(([name, role, st], i) => {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / n), x = cx + Math.cos(a) * R * 1.35, y = cy + Math.sin(a) * R;
      const d = `M${x.toFixed(1)} ${y.toFixed(1)} Q ${((x + cx) / 2 + Math.sin(a) * 30).toFixed(1)} ${((y + cy) / 2 - Math.cos(a) * 30).toFixed(1)} ${cx} ${cy}`;
      ed += `<path class="ed ${st}" d="${d}"/>`;
      if (st === 'auto' && !reduce) pk += `<circle class="pk" r="3"><animateMotion dur="2.6s" begin="${i * .3}s" repeatCount="indefinite" path="${d}"/></circle>`;
      const tx = x > cx + 10 ? 14 : x < cx - 10 ? -14 : 0, anchor = tx > 0 ? 'start' : tx < 0 ? 'end' : 'middle', ty = tx === 0 ? (y < cy ? -18 : 28) : 4;
      nd += `<g class="nd" data-i="${i}" tabindex="0" role="button" aria-label="${esc(name)}"><circle cx="${x}" cy="${y}" r="7"/><text x="${x + tx}" y="${y + ty}" text-anchor="${anchor}">${esc(name)}</text><text class="r" x="${x + tx}" y="${y + ty + 15}" text-anchor="${anchor}">${esc(role)}</text></g>`;
    });
    return `<svg viewBox="-40 0 ${W + 80} ${H}" role="img" aria-label="How the nine tools connect to the finance team: two sync on their own, four are copied by hand, three lose information.">${ed}${pk}<g class="hub"><circle cx="${cx}" cy="${cy}" r="44"/><text x="${cx}" y="${cy - 3}" text-anchor="middle">Finance</text><text x="${cx}" y="${cy + 11}" text-anchor="middle">team</text></g>${nd}</svg>`;
  };

  const dots = () => {
    let s = '', i = 0;
    A.time.forEach(([label, pc, tone], k) => { for (let j = 0; j < pc; j++, i++) { const x = (i % 10) * 50 + 25, y = Math.floor(i / 10) * 50 + 25; s += `<circle class="tone-${tone}" data-k="${k}" cx="${x}" cy="${y}" r="${tone === 'h' ? 9 : 10}"/>`; } });
    return `<svg viewBox="0 0 500 500" role="img" aria-label="The team's week as 100 dots: ${A.time.map((t) => `${t[1]} ${t[0]}`).join(', ')}">${s}</svg>`;
  };

  // paper: a straight line of steps. reality: a snake through a grid, handoffs ringed in lilac
  const paperSVG = (steps) => {
    const W = 360, gap = W / (steps.length - 1 || 1);
    return `<svg viewBox="-20 0 400 120" aria-hidden="true"><path class="ln" pathLength="1" d="M0 50 L${W} 50"/>${steps.map((t, i) => `<circle class="st" cx="${i * gap}" cy="50" r="7"/><text x="${i * gap}" y="${i % 2 ? 90 : 26}" text-anchor="middle">${esc(t)}</text>`).join('')}</svg>`;
  };
  const realSVG = (n, h) => {
    const cols = 6, P = [];
    for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), c = r % 2 ? cols - 1 - (i % cols) : i % cols; P.push([30 + c * 110, 30 + r * 70 + ((i * 37) % 3) * 6]); }
    const ho = new Set(); for (let k = 1; k <= h; k++) ho.add(Math.round(k * n / (h + 1)));
    let g = ''; for (let r = 0; r < Math.ceil(n / cols) + 0; r++) for (let c = 0; c < cols; c++) g += `<circle class="gd" cx="${30 + c * 110}" cy="${30 + r * 70}" r="2"/>`;
    const H = 30 + (Math.ceil(n / cols) - 1) * 70 + 50;
    return `<svg viewBox="0 0 610 ${H}" aria-hidden="true">${g}<path class="ln" pathLength="1" d="M${P.map((p) => p.join(' ')).join(' L')}"/>${P.map(([x, y], i) => ho.has(i) ? `<circle class="ho" cx="${x}" cy="${y}" r="9"/>` : `<circle class="st" cx="${x}" cy="${y}" r="5.5"/>`).join('')}</svg>`;
  };

  const bubbles = () => {
    const W = 760, H = 460, L = 70, B = 400, T = 30, Rt = 730, maxV = 450;
    const lanes = { 1: 'Quick to build', 2: 'Some work', 3: 'Bigger build' };
    let s = `<line class="ax" x1="${L}" y1="${B}" x2="${Rt}" y2="${B}"/><line class="ax" x1="${L}" y1="${T}" x2="${L}" y2="${B}"/>`;
    [1, 2, 3].forEach((e) => { const x = L + (e - .5) * ((Rt - L) / 3); s += `<text x="${x}" y="${B + 30}" text-anchor="middle">${lanes[e]}</text>`; if (e > 1) s += `<line class="ax" x1="${L + (e - 1) * ((Rt - L) / 3)}" y1="${T}" x2="${L + (e - 1) * ((Rt - L) / 3)}" y2="${B}" stroke-dasharray="2 6"/>`; });
    const yOf = (v) => B - Math.sqrt(Math.min(v, maxV) / maxV) * (B - T - 24) - 6;      // square-root scale: small wins stay readable
    [10, 50, 100, 200, 400].forEach((v) => { const y = yOf(v); s += `<text x="${L - 12}" y="${y + 4}" text-anchor="end">$${v}k</text><line class="ax" x1="${L}" x2="${Rt}" y1="${y}" y2="${y}" stroke-dasharray="1 7"/>`; });
    const lanesN = {}; A.opps.forEach((o) => { lanesN[o[3]] = (lanesN[o[3]] || 0) + 1; });
    const placed = {}, laneW = (Rt - L) / 3;
    A.opps.map((o, i) => [o, i]).sort((a, b) => a[0][2] - b[0][2]).forEach(([[area, name, v, e], i]) => {
      placed[e] = (placed[e] || 0) + 1; const k = placed[e], n = lanesN[e];
      const x = L + (e - 1) * laneW + laneW * (k - .5) / n, y = yOf(v), r = 7 + Math.sqrt(v) * 1.15;
      const lab = v >= 110 ? `<text x="${x + r + 6}" y="${y + 4}">${esc(name)}</text>` : '';
      s += `<g class="bb" data-i="${i}" data-area="${area}" tabindex="0" role="button" aria-label="${esc(name)}, ${money(v)} a year"><circle cx="${x}" cy="${y}" r="${r}" fill="${AREA[area]}" fill-opacity=".85"/>${lab}</g>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Fourteen opportunities by value and effort">${s}<text x="${L}" y="${T - 12}">Value a year</text><text x="${Rt}" y="${B + 54}" text-anchor="end">Effort →</text></svg>`;
  };

  const gantt = () => {
    const rows = A.opps.map((o, i) => [o, i]).sort((a, b) => a[0][4][0] - b[0][4][0]);
    return `<div class="gantt__in"><span></span><div class="gantt__wk">${Array.from({ length: 12 }, (_, i) => `<span>W${i + 1}</span>`).join('')}</div>
      ${rows.map(([[area, name, v, e, [a, b]]]) => `<div class="gantt__row"><div class="gantt__nm">${esc(name)}<small>${esc(area)} · ${money(v)}</small></div><div class="gantt__lane"><i style="left:${(a - 1) / 12 * 100}%;width:${(b - a + 1) / 12 * 100}%"></i></div></div>`).join('')}</div>`;
  };

  /* ---------------------------------------------------------------- page */
  const CH = [['audit', 'The audit', 'search'], ['findings', 'The findings', 'flag'], ['plan', 'The plan', 'chart']];
  body.innerHTML = `<div class="au">
  <aside class="side"><a class="side__brand" href="index.html"><canvas data-mark data-speed="1" aria-hidden="true"></canvas><span><b>Not Human</b><span class="mono-s">Audit demo</span></span></a>
    <nav class="side__nav">${CH.map(([k, n, ic], i) => `<a href="#${k}" data-ch="${k}">${I(ic, { size: 22 })}<span class="no">/0${i + 1}</span><span class="nm">${n}</span><span class="side__prog"></span></a>`).join('')}</nav>
    <div class="side__foot"><a href="${HOME}">Not Human home</a><a href="index.html">All case studies</a><a href="case-finance.html">Finance case study</a><span class="mono-s">Illustrative · names and numbers invented</span></div></aside>
  <main class="au-main">
    <div class="top"><b>${esc(A.company)}</b><span class="sep"></span><span class="mono">Finance</span><span class="sep"></span><span class="mono">${esc(A.range)}</span><span class="tag tag--hold"><i></i>Illustrative · audit complete</span></div>

    <section class="au-cover"><div data-rise><div class="au-k"><span class="tag">Audit demo</span><span class="tag">Finance</span><span class="tag">Illustrative</span></div>
        <h1>Three weeks with your finance team, and what we found.</h1>
        <p class="au-lede">An audit is ${esc(A.range)}. We sit with the people who do the work, connect to your tools read-only, and come back with what is really happening, what it costs and what to build first. This is what you would receive, for an agency group like yours.</p>
        <div class="au-k" style="margin-top:24px">${A.profile.map((p) => `<span class="tag">${esc(p)}</span>`).join('')}</div></div>
      <canvas data-mark data-speed="1" data-scale="1" aria-hidden="true"></canvas>
      <div class="au-stats">${A.stats.map(([n, l]) => `<div class="panel" data-rise><b data-count="${n}">${n}</b><span class="mono">${esc(l)}</span></div>`).join('')}</div></section>

    <section class="au-sec" id="audit"><div data-rise><span class="mono">Chapter /01 · The audit</span><h2 class="au-h2">Three weeks, sitting next to your team.</h2>
      <p class="au-lede">The first week we listen and watch the work happen. The second we look at a year of your numbers. The third we turn it into a plan. Open any day to see what we learned.</p></div>
      <div class="au-sub"><h3>Day by day</h3><span class="mono">Three weeks · open any day</span></div>
      <div class="kb">${board()}</div>

      <div class="au-sub"><h3>Who we talked to</h3><span class="mono">${A.people.length} people · in their words</span></div>
      <div class="ppl">${A.people.map(([ini, n, role, team, q]) => `<article class="panel" data-rise><div class="ph"><span class="ava">${ini}</span><div><b>${esc(n)}</b><span class="mono">${esc(role)}</span></div></div><q>${esc(q)}</q></article>`).join('')}</div>

      <div class="au-sub"><h3>Your tools, and how they talk to each other</h3><span class="mono">Connected read-only · click a tool</span></div>
      <div class="net"><div class="panel" style="padding:16px">${network()}</div>
        <div class="panel net__side"><span class="mono" data-nrole>Nine tools</span><h4 data-nname>Two talk on their own. The rest need a person.</h4><p data-nnote>Every line is a path money or information takes. Dashed lines are someone copying by hand; dotted lines are where information gets lost.</p>
          <div class="lg"><span><svg viewBox="0 0 44 6"><path d="M0 3h44" stroke="#B4A6FF" stroke-width="1.6"/></svg>Syncs on its own</span><span><svg viewBox="0 0 44 6"><path d="M0 3h44" stroke="rgba(255,255,255,.6)" stroke-width="1.6" stroke-dasharray="4 5"/></svg>A person copies it across</span><span><svg viewBox="0 0 44 6"><path d="M0 3h44" stroke="#C8BEFF" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/></svg>Information gets lost</span></div></div></div>
    </section>

    <section class="au-sec" id="findings"><div data-rise><span class="mono">Chapter /02 · The findings</span><h2 class="au-h2">Where the week really goes.</h2>
      <p class="au-lede">What we saw, put so leadership can take it in over a coffee. Every number comes from your team’s own hours and a year of your data.</p></div>
      <div class="au-sub"><h3>Your team’s week, in 100 dots</h3><span class="mono">14 people · one dot is 1% of their time</span></div>
      <div class="dots100"><div data-rise>${dots()}</div><div><div class="tleg">${A.time.map(([l, pc, tone, line], k) => `<button data-k="${k}"><svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" ${tone === 'h' ? 'fill="none" stroke="#C8BEFF" stroke-width="1.6"' : `fill="${TONES[tone]}"`}/></svg><span><b>${esc(l)}</b><small>${esc(line)}</small></span><span class="pc">${pc}%</span></button>`).join('')}</div><p class="tnote">${esc(A.timeNote)}</p></div></div>

      <div class="au-sub"><h3>How it’s written down, and how it really runs</h3><span class="mono">Five processes · pick one</span></div>
      <div class="chips" role="tablist">${A.processes.map((p, i) => `<button role="tab" aria-pressed="${i === 0}" data-p="${i}">${esc(p[0])}</button>`).join('')}</div>
      <div class="pr" data-pr></div>

      <div class="au-sub"><h3>What we found</h3><span class="mono">${A.findings.length} findings · open any of them</span></div>
      <div>${A.findings.map(([tag, n, h, story, cost], i) => `<div class="fd"><button aria-expanded="false"><span class="mono">/0${i + 1}</span><span class="num">${esc(n)}</span><h4>${esc(h)}</h4><span class="tag">${esc(tag)}</span><span class="chev">${ARR}</span></button>
        <div class="fd__b"><div><span class="mono">What we saw</span><p>${esc(story)}</p></div><div class="cost"><span class="mono">What it costs</span><p>${esc(cost)}</p></div></div></div>`).join('')}</div>

      <div class="au-sub"><h3>What could go wrong if nothing changes</h3><span class="mono">Risk register</span></div>
      <div class="risks">${A.risks.map(([k, lv, t, d]) => `<div class="panel" data-rise><span class="lvl ${lv}"><i></i>${lv} · ${esc(k)}</span><h4>${esc(t)}</h4><p>${esc(d)}</p></div>`).join('')}</div>
    </section>

    <section class="au-sec" id="plan"><div data-rise><span class="mono">Chapter /03 · The plan</span><h2 class="au-h2">What we’d build, in what order, and what it’s worth.</h2>
      <p class="au-lede">Fourteen things worth automating, ranked by value and effort. A person stays on every decision that involves money or a client.</p></div>
      <div class="au-sub"><h3>What it’s worth</h3><span class="mono">A year · modelled from your data</span></div>
      <div class="val"><div data-rise><div class="val__n"><span data-money="${totalValue}">$1.2M</span><small>a year</small></div></div>
        <div data-rise><div class="vstack">${A.value.map(([n, v], i) => `<i style="flex:${v};background:${['#F3F2F7', '#B4A6FF', '#6F63F2', '#5B2CFF', '#9B98A8'][i]}"></i>`).join('')}</div>
          <div class="vrows">${A.value.map(([n, v, d], i) => `<div><i style="background:${['#F3F2F7', '#B4A6FF', '#6F63F2', '#5B2CFF', '#9B98A8'][i]}"></i><span><b>${esc(n)}</b><small>${esc(d)}</small></span><span class="v">${money(v)}</span></div>`).join('')}</div>
          <p class="vnote">${esc(A.valueNote)}</p></div></div>

      <div class="au-sub"><h3>Everything worth automating, on one map</h3><span class="mono">Bigger circle, more value · click one</span></div>
      <div class="chips" data-areas><button aria-pressed="true" data-a="All">All</button>${Object.keys(AREA).map((a) => `<button aria-pressed="false" data-a="${a}">${a}</button>`).join('')}</div>
      <div class="om"><div class="panel" style="padding:18px">${bubbles()}</div><div class="panel om__side" data-om></div></div>

      <div class="au-sub"><h3>Twelve weeks, cheapest wins first</h3><span class="mono">Nothing waits on something unbuilt</span></div>
      <div class="panel gantt">${gantt()}<div class="gantt__ms"><span class="ms"><b>Week 2</b>First agents in shadow mode</span><span class="ms"><b>Week 4</b>Billing live, every invoice approved</span><span class="ms"><b>Week 8</b>First month-end with agents</span><span class="ms"><b>Week 12</b>Everything measured again</span></div></div>

      <div class="au-sub"><h3>How it’s built, and why it’s safe</h3><span class="mono">The technical side · for your IT lead</span></div>
      <p class="au-lede" style="margin-top:0">${esc(A.tech.lede)}</p>
      <div class="chips" role="tablist" style="margin-top:22px">${Object.entries(A.tech.modes).map(([k, m], i) => `<button role="tab" aria-pressed="${i === 0}" data-mode="${k}">${esc(m.name)}</button>`).join('')}</div>
      <div class="arch panel" data-arch></div>
      <div class="au-sub"><h3>What it connects to, and what it may do</h3><span class="mono">Scopes per tool · read, draft or write</span></div>
      <div class="panel conn"><div class="conn__h"><span class="mono">Tool</span><span class="mono">How we connect</span><span class="mono">What the agent may do</span><span class="mono">Access</span></div>
        ${A.tech.connectors.map(([n, how, may, lv]) => `<div class="conn__r"><b>${esc(n)}</b><span>${esc(how)}</span><span>${esc(may)}</span><span class="acc ${lv}"><i></i>${lv}</span></div>`).join('')}</div>
      <p class="mono" style="margin-top:12px">Nothing gets permission to pay, delete or send money. “Draft” means a person approves before anything leaves.</p>
      <div class="au-sub"><h3>Each agent, as the spec we ship</h3><span class="mono">Pick one · this is what your IT lead reviews</span></div>
      <div class="spec"><div class="spec__tabs" role="tablist">${A.tech.specs.map(([k], i) => `<button role="tab" aria-pressed="${i === 0}" data-spec="${i}">${esc(k)}</button>`).join('')}</div><pre class="panel spec__code" data-spec-out></pre></div>
      <div class="au-sub"><h3>Six things we guarantee</h3><span class="mono">Written into every build</span></div>
      <div class="guar">${A.tech.guarantees.map(([t, d], i) => `<div class="panel" data-rise>${I(['mesh', 'key', 'lock', 'check', 'sop', 'off'][i], { size: 32, run: true })}<b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div>

      <div class="au-sub"><h3>What we need from your team</h3><span class="mono">Less than you’d think</span></div>
      <div class="need">${A.roles.map(([r, d]) => `<div class="panel" data-rise>${I('person', { size: 28 })}<b>${esc(r)}</b><p>${esc(d)}</p></div>`).join('')}</div>

      <div class="au-sub"><h3>What happens next</h3><span class="mono">From this page to the first close</span></div>
      <ol class="steps">${A.next.map(([t, d]) => `<li class="panel" data-rise><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join('')}</ol>
    </section>

    <section class="au-close"><div><p class="mono">Your turn</p><h2>Show us one process. We’ll show you the real one.</h2></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--solid" href="${HOME}#call">Book a 30-minute call ${AR}</a><a class="btn" href="index.html">See the case studies</a></div></section>
    <footer class="foot"><span>Not Human · a RemotoLabs company</span><span>Illustrative audit: the company, the people and the numbers are invented for this demo.</span><span>© 2026</span></footer>
  </main></div>`;

  /* ---------------------------------------------------------------- interactions */
  // rise and count-up
  const seen = (el, fn, margin = '-10%') => { if (reduce || !('IntersectionObserver' in window)) return fn(); const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(); io.disconnect(); } }), { rootMargin: `0px 0px ${margin} 0px` }); io.observe(el); };
  $$('[data-rise]').forEach((el, i) => { el.style.transitionDelay = ((i % 4) * 90) + 'ms'; seen(el, () => el.classList.add('in'), '-6%'); });
  const countUp = (el, to, fmt) => { if (reduce) { el.textContent = fmt(to); return; } const t0 = performance.now(), d = 1400; const f = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(Math.round(to * e)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
  $$('[data-count]').forEach((el) => seen(el, () => countUp(el, +el.dataset.count, (v) => v)));
  $$('[data-money]').forEach((el) => seen(el, () => countUp(el, +el.dataset.money, (v) => '$' + (v / 1000).toFixed(1) + 'M')));

  // tools network
  const showTool = (i) => { const [n, r, st, note] = A.systems[i]; $$('.nd').forEach((g) => g.classList.toggle('on', +g.dataset.i === i));
    $('[data-nrole]').textContent = `${r} · ${{ auto: 'syncs on its own', manual: 'copied by hand', broken: 'information gets lost' }[st]}`; $('[data-nname]').textContent = n; $('[data-nnote]').textContent = note; };
  $$('.nd').forEach((g) => { const i = +g.dataset.i; g.addEventListener('click', () => showTool(i)); g.addEventListener('mouseenter', () => showTool(i)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTool(i); } }); });

  // 100 dots: point at a category to light its dots
  const dsvg = $('.dots100 svg');
  const lightK = (k) => { dsvg.classList.toggle('dim', k !== null); $$('circle', dsvg).forEach((c) => c.classList.toggle('hi', +c.dataset.k === k)); $$('.tleg button').forEach((b) => b.classList.toggle('on', +b.dataset.k === k)); };
  $$('.tleg button').forEach((b) => { b.addEventListener('mouseenter', () => lightK(+b.dataset.k)); b.addEventListener('focus', () => lightK(+b.dataset.k)); b.addEventListener('click', () => lightK(+b.dataset.k)); });
  $('.tleg').addEventListener('mouseleave', () => lightK(null));
  if (!reduce) seen(dsvg, () => $$('circle', dsvg).forEach((c, i) => { const r = c.getAttribute('r'); c.setAttribute('r', 0); setTimeout(() => c.setAttribute('r', r), i * 14); }));

  // paper vs reality
  const pr = $('[data-pr]');
  const showP = (i) => { const [area, paper, n, h, cycle, vol, gaps] = A.processes[i];
    $$('[data-p]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.p === i));
    pr.classList.remove('drawn');
    pr.innerHTML = `<div class="pr__cols"><div class="panel"><span class="mono">On paper · ${paper.length} steps</span>${paperSVG(paper)}<p style="margin:0;font:400 14.5px/1.5 var(--font-text);color:var(--fg-soft)">How the process is described, in the handbook or in people’s heads.</p></div>
      <div class="panel"><span class="mono">In real life · ${n} steps · ${h} handoffs (ringed)</span>${realSVG(n, h)}</div></div>
      <div class="kpis">${[[n, 'Real steps'], [h, 'Handoffs between people'], [cycle, 'How long it takes'], [vol, 'How much of it']].map(([v, l]) => `<div class="panel"><b style="${String(v).length > 6 ? 'font-size:clamp(22px,1.8vw,30px);font-weight:300;letter-spacing:-.02em' : ''}">${esc(v)}</b><span class="mono">${esc(l)}</span></div>`).join('')}</div>
      <div class="panel" style="padding:8px 22px 4px"><ul class="gaps">${gaps.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => pr.classList.add('drawn'))); };
  $$('[data-p]').forEach((b) => b.addEventListener('click', () => showP(+b.dataset.p))); showP(0);

  // findings
  $$('.fd > button').forEach((b) => b.addEventListener('click', () => { const o = b.parentElement.toggleAttribute('open'); b.setAttribute('aria-expanded', o); }));

  // the opportunity map
  const side = $('[data-om]');
  const showO = (i) => { const [area, name, v, e, [a, b], now, then, who] = A.opps[i]; $$('.bb').forEach((g) => g.classList.toggle('on', +g.dataset.i === i));
    side.innerHTML = `<span class="mono">${esc(area)} · ${['', 'quick to build', 'some work', 'bigger build'][e]}</span><h4>${esc(name)}</h4><span class="big">${money(v)}<span class="mono" style="margin-left:8px">a year</span></span>
      <dl><div><dt>Today</dt><dd>${esc(now)}</dd></div><div><dt>After</dt><dd>${esc(then)}</dd></div><div><dt>When</dt><dd>Weeks ${a}–${b}</dd></div><div><dt>Waits for a person</dt><dd class="hold">${esc(who)}</dd></div></dl>`; };
  $$('.bb').forEach((g) => { const i = +g.dataset.i; g.addEventListener('click', () => showO(i)); g.addEventListener('mouseenter', () => showO(i)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showO(i); } }); });
  showO(1);
  $$('[data-areas] button').forEach((b) => b.addEventListener('click', () => { const a = b.dataset.a; $$('[data-areas] button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    const svg = $('.om svg'); svg.classList.toggle('flt', a !== 'All'); $$('.bb').forEach((g) => g.classList.toggle('off', a !== 'All' && g.dataset.area !== a));
    const first = A.opps.findIndex((o) => a === 'All' || o[0] === a); if (first >= 0) showO(a === 'All' ? 1 : first); }));

  // the technical side: deployment mode, agent specs
  const arch = $('[data-arch]');
  const showMode = (k) => { const m = A.tech.modes[k]; $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === k));
    arch.innerHTML = `<p class="arch__line">${esc(m.line)}</p>${m.layers.map(([n, spec, why], i) => `<div class="arch__row" style="--i:${i}"><span class="mono">L${m.layers.length - i}</span><b>${esc(n)}</b><span class="arch__spec">${esc(spec)}</span><span class="arch__why">${esc(why)}</span></div>`).join('')}`;
    arch.classList.remove('in'); requestAnimationFrame(() => requestAnimationFrame(() => arch.classList.add('in'))); };
  $$('[data-mode]').forEach((b) => b.addEventListener('click', () => showMode(b.dataset.mode))); showMode('cloud');
  const hl = (src) => esc(src).split('\n').map((ln) => {
    const m = ln.match(/^(\s*)(- )?([\w.:\/*-]+:)?(.*)$/); if (!m) return ln;
    let [, ind, dash, key, rest] = m; rest = rest.replace(/(#.*)$/, '<span class="c">$1</span>').replace(/(\[[^\]]+\])/g, '<span class="b">$1</span>').replace(/(&quot;[^&]*&quot;)/g, '<span class="s">$1</span>');
    return `${ind}${dash ? '<span class="d">- </span>' : ''}${key ? `<span class="k">${key}</span>` : ''}${rest}`; }).join('\n');
  const showSpec = (i) => { $$('[data-spec]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.spec === i)); $('[data-spec-out]').innerHTML = hl(A.tech.specs[i][1]); };
  $$('[data-spec]').forEach((b) => b.addEventListener('click', () => showSpec(+b.dataset.spec))); showSpec(0);

  // twelve weeks
  const gt = $('.gantt'); seen(gt, () => { gt.classList.add('on'); $$('.gantt__lane i', gt).forEach((i, k) => (i.style.transitionDelay = (k * 70) + 'ms')); });

  // the chapter rail: which chapter you are in, and how far through it
  const secs = CH.map(([k]) => document.getElementById(k));
  const onScroll = () => {
    let cur = 0; secs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    $$('.side__nav a').forEach((a, i) => { if (i === cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      const r = secs[i].getBoundingClientRect(), k = Math.min(1, Math.max(0, (innerHeight * .4 - r.top) / r.height)); $('.side__prog', a).style.width = (k * 100) + '%'; });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
