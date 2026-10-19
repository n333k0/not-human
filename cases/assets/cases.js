/* Not Human case studies: renders the case document, the demo and the index from data.js.
   <body data-view="case|demo|index" data-case="finance|sales|operations">. Needs dots.js and data.js first. */
(() => {
  const D = window.NHC, I = window.NHDots.icon, ART = window.NHDots.art;
  const body = document.body, view = body.dataset.view, id = body.dataset.case;
  const C = D.cases.find((c) => c.id === id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const AR = '<svg class="ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.2 3H9v4.8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  const ARR = '<svg class="ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8M6.5 2.5 10 6 6.5 9.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  const ARL = '<svg class="ar" viewBox="0 0 12 12" aria-hidden="true"><path d="M10 6H2M5.5 2.5 2 6l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  const HOME = '../';   // rewritten to the site root when published
  const mark = (cls = '', scale) => `<canvas data-mark data-speed="1"${scale ? ` data-scale="${scale}"` : ''} class="${cls}" aria-hidden="true"></canvas>`;
  document.documentElement.classList.add('js');

  /* ---------------------------------------------------------------- the system diagram (shared) */
  // tools on the left, one signed door, the private server on the tailnet holding agents and the second brain,
  // the approval queue, the team's devices on the right. Packets travel the wires.
  function flowSVG(cls, tools) {
    const T = tools.slice(0, 5), H = 360, rowY = (i) => 60 + i * 60;
    let s = `<svg class="flow-wide" viewBox="0 0 1100 ${H}" role="img" aria-label="Your tools send events through one signed door to a private server on your Tailscale network. Agents there read the second brain, prepare work, and anything that matters waits for a person before it goes back into your tools.">`;
    s += `<rect class="net" x="300" y="16" width="560" height="${H - 32}"/><text x="314" y="38">Your private network · Tailscale</text>`;
    T.forEach((t, i) => { s += `<rect class="box" x="10" y="${rowY(i) - 20}" width="190" height="40"/><text class="t" x="24" y="${rowY(i) + 6}">${esc(t[0])}</text><path class="wire lane" d="M200 ${rowY(i)} C 240 ${rowY(i)}, 250 180, 330 180"/>`; });
    s += `<rect class="box hl" x="330" y="150" width="120" height="60"/><text class="t" x="344" y="178">Signed door</text><text x="344" y="196">webhooks in</text>`;
    s += `<path class="wire lane" d="M450 180 L520 180"/>`;
    s += `<rect class="box hl" x="520" y="60" width="200" height="240"/><text x="536" y="84">Your server</text>`;
    ['Agents', 'Second brain', 'Audit log'].forEach((n, i) => { s += `<rect class="box" x="536" y="${100 + i * 64}" width="168" height="48"/><text class="t" x="550" y="${130 + i * 64}">${n}</text>`; });
    s += `<path class="wire lane" d="M720 180 L760 180"/>`;
    s += `<rect class="box" x="760" y="140" width="90" height="80"/><text class="t" x="772" y="172">Approval</text><text x="772" y="192">a person</text>`;
    s += `<path class="wire lane" d="M850 180 C 900 180, 900 90, 950 90"/><path class="wire lane" d="M850 180 C 900 180, 900 270, 950 270"/>`;
    s += `<rect class="box" x="950" y="66" width="140" height="48"/><text class="t" x="964" y="96">Team devices</text>`;
    s += `<rect class="box" x="950" y="246" width="140" height="48"/><text class="t" x="964" y="276">Back to tools</text>`;
    if (!reduce) {
      const paths = T.map((t, i) => `M200 ${rowY(i)} C 240 ${rowY(i)}, 250 180, 330 180 L520 180 L760 180`);
      paths.forEach((p, i) => { s += `<circle class="pkt" r="3.4"><animateMotion dur="4.2s" begin="${i * .8}s" repeatCount="indefinite" path="${p}"/></circle>`; });
      s += `<circle class="pkt h" r="3.4"><animateMotion dur="3s" begin="1s" repeatCount="indefinite" path="M760 180 L850 180 C 900 180, 900 270, 950 270"/></circle>`;
      s += `<circle class="pkt" r="3"><animateMotion dur="3.6s" begin="2s" repeatCount="indefinite" path="M850 180 C 900 180, 900 90, 950 90"/></circle>`;
    }
    s += '</svg>';
    const mob = [['Your tools', 'mail', 'events'], ['Signed door', 'lock', 'webhooks in'], ['Your server · Tailscale', 'cloud', 'private'], ['Agents read the second brain', 'brain', 'prepare'], ['A person approves', 'person', 'decide'], ['Back into your tools', 'check', 'done']]
      .map(([t, ic, m]) => `<div>${I(ic, { size: 24 })}${t}<span class="mono">${m}</span></div>`).join('');
    return `<div class="${cls}">${s}<div class="flow-mobile">${mob}</div></div>`;
  }

  /* ---------------------------------------------------------------- reveals */
  function arm(root = document) {
    const els = [...root.querySelectorAll('[data-rise], .dot-art')];
    if (reduce || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    els.forEach((e) => { if (e.classList.contains('dot-art')) e.setAttribute('data-armed', ''); });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); e.target.removeAttribute('data-armed'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e, i) => { if (e.hasAttribute('data-rise')) e.style.transitionDelay = ((i % 4) * 90) + 'ms'; io.observe(e); });
  }

  /* ================================================================ CASE DOCUMENT (pearl) */
  function renderCase() {
    document.title = `${C.dept} case study · Not Human`;
    const sec = (title, mono, inner, idA = '') => `<section class="sec wrap"${idA ? ` id="${idA}"` : ''}><div class="head" data-rise><h2>${title}</h2><span class="mono">${mono}</span></div>${inner}</section>`;
    const S = D.stack;
    body.innerHTML = `
<header class="bar"><a class="bar__brand" href="index.html">${mark()}Not Human</a>
  <nav class="bar__nav"><a href="${HOME}">Not Human home</a><a href="index.html">All case studies</a><a href="#how">How it runs</a><a href="#results">Results</a><a class="btn" href="demo-${C.id}.html">Open the interactive demo ${AR}</a></nav></header>
<main>
  <section class="doc-hero">
    <div data-rise><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag">Case study /${C.no}</span><span class="tag">${esc(C.dept)}</span><span class="tag">Illustrative</span></div>
      <h1>${esc(C.title)}</h1>
      <p class="mono" style="margin-top:18px">${esc(C.kicker)}</p>
      <div class="facts">${C.client.facts.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}</div></div>
    <figure class="doc-hero__art" data-rise style="margin:0">${ART(C.art)}
      <figcaption class="doc-hero__metric"><span class="mono">${esc(C.card.metric)}<br>was ${esc(C.card.before)}</span><b>${esc(C.card.after)}</b></figcaption></figure>
  </section>
  <aside class="notice" data-rise>${I('flag', { size: 22 })}<p>${esc(D.note)}</p></aside>

  ${sec('In one minute', 'The short version · for anyone', `<div class="minute">${C.oneMinute.map((p, i) => `<div data-rise><span class="mono">/0${i + 1}</span><p>${esc(p)}</p></div>`).join('')}</div>`)}

  <section class="wrap quote"><blockquote data-rise>${esc(C.pain)}</blockquote><p class="mono" data-rise>${esc(C.painBy)}</p></section>

  ${sec('The company', `${esc(C.client.name)} · ${C.client.stack.length} tools`, `<div class="two"><div data-rise>${C.challenge.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    <div data-rise><p class="mono" style="margin:0 0 12px">The tools they already used. Nothing was replaced.</p><div class="tools">${C.client.stack.map(([n, k, v]) => `<div><b>${esc(n)}</b><span class="mono-s">${esc(k)} · ${esc(v)}</span></div>`).join('')}</div></div></div>`)}

  ${sec('The audit', `${C.audit.weeks} · ${C.audit.people} people · ${C.audit.workflows} workflows`, `<p class="body" data-rise style="font-size:clamp(17px,1.25vw,20px)">${esc(C.audit.method)}</p>
    <div class="finds">${C.audit.findings.map(([n, t]) => `<div class="find" data-rise><b>${esc(n)}</b><p>${esc(t)}</p></div>`).join('')}</div>
    <p class="pattern" data-rise>${esc(C.audit.pattern)}</p>`)}

  ${sec('What we built', `${C.systems.length} agents · one system · inside their tools`, `<div class="systems">${C.systems.map((s, i) => `<article class="sys" data-rise>
      <div style="display:flex;justify-content:space-between;align-items:center">${I(s.icon, { size: 40, run: true, dur: 3 + i * .4 })}<span class="mono">/0${i + 1}</span></div>
      <h3>${esc(s.name)}</h3><p>${esc(s.does)}</p>
      <dl><div><dt>Starts when</dt><dd>${esc(s.trigger)}</dd></div><div><dt>Waits for a person</dt><dd class="hold">${esc(s.human)}</dd></div></dl></article>`).join('')}</div>`)}

  ${sec('A day, before and after', 'What changed for the people', `<div class="day"><div data-rise><span class="mono">Before</span><ol>${C.day.before.map(([t, x]) => `<li><span class="mono">${esc(t)}</span><span>${esc(x)}</span></li>`).join('')}</ol></div>
    <div class="after" data-rise><span class="mono">After</span><ol>${C.day.after.map(([t, x]) => `<li><span class="mono">${esc(t)}</span><span>${esc(x)}</span></li>`).join('')}</ol></div></div>`)}

  ${sec(S.title, 'Cloud · Tailscale · second brain · a person in charge', `<p class="body" data-rise style="font-size:clamp(17px,1.25vw,20px)">${esc(S.lede)}</p>
    <div data-rise>${flowSVG('flow', C.client.stack)}</div>
    <div class="layers">${S.layers.map((l) => `<div class="layer" data-rise>${I(l.icon, { size: 36, run: true })}<h3>${esc(l.name)}</h3><p>${esc(l.plain)}</p><details><summary>The technical detail</summary><p>${esc(l.tech)}</p></details></div>`).join('')}</div>
    <p class="models" data-rise>${esc(S.models)}</p>`, 'how')}

  ${sec('How it rolled out', 'Audit → document → automate', `<ol class="rollout">${C.rollout.map(([w, t, d]) => `<li data-rise><span class="mono">${esc(w)}</span><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join('')}</ol>`)}

  ${sec('Results', 'Modelled · re-measured after go-live', `<table class="results" data-rise><thead><tr><th>What we measured</th><th>Before</th><th>After</th></tr></thead><tbody>${C.results.map(([m, b, a]) => `<tr><td>${esc(m)}</td><td class="b">${esc(b)}</td><td class="a">${esc(a)}</td></tr>`).join('')}</tbody></table>`, 'results')}

  ${sec('The math', 'Hours first, money second', `<div class="math"><div data-rise><span class="mono">Time returned (cost)</span><table>${C.math.cost.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</table><p class="total">${esc(C.math.costTotal)}</p></div>
    <div data-rise><span class="mono">Upside, kept apart until measured</span><table>${C.math.upside.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</table><p class="note">${esc(C.math.note)}</p></div></div>`)}

  ${sec('What stays human', 'Agents prepare · people decide', `<ul class="human">${C.human.map((h) => `<li data-rise>${I('person', { size: 32 })}${esc(h)}</li>`).join('')}</ul>`)}

  ${sec('What the client owns', 'No lock-in', `<div class="owns">${S.owns.map(([t, p], i) => `<div data-rise>${I(['key', 'lock', 'off', 'sop'][i], { size: 32 })}<h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>`)}

  ${sec('Words we used', 'A short glossary', `<dl class="gloss">${D.glossary.map(([t, d]) => `<div data-rise><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`)}

  <section class="close"><div><p class="mono">See it working</p><h2>Walk through the system, chapter by chapter.</h2></div>
    <div class="close__btns"><a class="btn btn--solid" href="demo-${C.id}.html">Open the interactive demo ${AR}</a><a class="btn" href="audit-demo.html" target="_blank" rel="noopener noreferrer">See the audit report</a><a class="btn" href="index.html">All case studies</a></div></section>
</main>
<footer class="foot"><span>Not Human · a RemotoLabs company</span><span>${esc(D.note)}</span><span>© 2026</span></footer>`;
    arm();
  }

  /* ================================================================ DEMO (night) */
  const CH = [['overview', 'Overview', 'agent'], ['discovery', 'Discovery', 'search'], ['setup', 'Setup', 'sop'], ['team', 'Team views', 'team'], ['engine', 'Under the hood', 'route'], ['outcomes', 'Outcomes', 'chart']];
  function renderDemo() {
    const M = C.demo;
    document.title = `${C.dept} demo · Not Human`;
    const nav = CH.map(([k, n, ic], i) => `<a href="#${k}" data-ch="${k}">${I(ic, { size: 22 })}<span class="no">${i ? '/0' + i : ''}</span><span class="nm">${n}</span></a>`).join('');
    const nextBtn = (k) => { const i = CH.findIndex((c) => c[0] === k); const nx = CH[i + 1], pv = CH[i - 1];
      return `<div class="next">${pv ? `<a class="btn" href="#${pv[0]}">${ARL} ${pv[1]}</a>` : '<span></span>'}${nx ? `<a class="btn btn--solid" href="#${nx[0]}">Next: ${nx[1]} ${ARR}</a>` : `<a class="btn btn--solid" href="case-${C.id}.html">Read the full case study ${AR}</a>`}</div>`; };
    const sub = (t, m) => `<div class="sub"><h2>${t}</h2><span class="mono">${m}</span></div>`;

    const overview = `<section class="chap" id="ch-overview"><div class="ov"><div class="chap__h" style="margin:0"><span class="mono">Interactive demo · ${esc(C.dept)} · illustrative</span>
        <h1>The ${esc(C.dept.toLowerCase())} system, step by step.</h1><p>${esc(C.oneMinute[1])}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:28px"><a class="btn btn--solid" href="#discovery">Start with discovery ${ARR}</a><a class="btn" href="case-${C.id}.html">Read the case study</a></div></div>
        ${mark('', 1)}</div>
      <div class="ov-list">${CH.slice(1).map(([k, n, ic], i) => `<a class="panel" href="#${k}">${I(ic, { size: 30, run: true })}<span class="mono">/0${i + 1}</span><b>${n}</b><p>${['How we learned the operation and what to automate first', 'How the team’s know-how became rules agents follow', 'What each person sees in their day', 'How the agents work together, and where it all runs', 'What changed, and what the client owns'][i]}</p></a>`).join('')}</div></section>`;

    const tools = C.client.stack;
    const totalH = M.heat.reduce((a, h) => a + h[1], 0);
    const discovery = `<section class="chap" id="ch-discovery" hidden><div class="chap__h"><span class="mono">Chapter /01 · ${C.audit.weeks}</span><h1>How we learned this operation.</h1>
        <p>${esc(C.audit.method)} Every tool was connected read-only first, so we could see how work really moves before changing anything.</p></div>
      ${sub('Tools connected and mapped', 'Read-only · nothing migrated')}
      <div class="syswall">${tools.map(([n, k, v]) => `<div class="tool panel"><div class="tool__top"><span class="tool__ini">${esc(n[0])}</span><span class="st"><i></i><em>Connecting</em></span></div><b>${esc(n)}</b><span class="mono-s">${esc(k)} · ${esc(v)}</span></div>`).join('')}</div>
      <div class="counts">${[[tools.length, 'Tools mapped'], [C.audit.workflows, 'Workflows traced'], [C.audit.people, 'People interviewed'], [C.audit.findings[0][0], esc(C.audit.findings[0][1]).split(',')[0]]].map(([n, l]) => `<div class="panel"><b>${n}</b><span class="mono">${l}</span></div>`).join('')}</div>
      ${sub('Where the time goes', 'Share of manual work · click a row')}
      <div class="heat">${M.heat.map(([n, p, w]) => `<button aria-expanded="false"><span class="nm">${esc(n)}</span><span class="tr"><i style="transform:scaleX(${p / Math.max(...M.heat.map((h) => h[1]))})"></i></span><span class="pc">${Math.round(p / totalH * 100)}%</span><span class="why">${esc(w)}</span></button>`).join('')}</div>
      ${sub('What to automate first', 'Ranked by value · click any row')}
      <div class="panel vsplit"><div class="row1"><span class="mono">Yearly value, modelled</span><b>${esc(M.value.total)}</b></div>
        <div class="vbar">${M.value.split.filter((v) => v[1] > 0).map(([n, v], i) => `<i style="flex:${v};background:${['#F3F2F7', '#B4A6FF', '#5B2CFF'][i]}"></i>`).join('')}<i style="flex:${Math.max(4, M.value.split[0][1] * .15)};background:repeating-linear-gradient(90deg,rgba(180,166,255,.5) 0 2px,transparent 2px 6px)"></i></div>
        <div class="vlegend">${M.value.split.map(([n, v, l], i) => `<span><span class="mono">${esc(n)}</span><b>${esc(l)}</b></span>`).join('')}</div>
        <span class="mono-s" style="text-transform:none;letter-spacing:0;font-family:var(--font-text);font-size:13px">Cost is time returned to the team. Upside is shown hatched: it is real, but we only count it after measuring it.</span></div>
      <div class="opps panel">${M.opps.map(([p, n, a, v, w, does, hum]) => `<div class="opp"><button aria-expanded="false"><span class="mono">${p}</span><span class="nm">${esc(n)}</span><span class="pbar"><span><i style="width:${a}%"></i></span>${a}%</span><span class="val">${esc(v)}</span><span class="mono wk">${w}</span><span class="chev">${ARR}</span></button>
        <div class="opp__d"><div><span class="mono">What the agent does</span><p>${esc(does)}</p></div><div class="hold"><span class="mono">Waits for a person</span><p>${esc(hum)}</p></div></div></div>`).join('')}</div>
      <p class="mono" style="margin-top:12px">Automation % = share of the work an agent can take today · weeks = time to go live</p>
      ${nextBtn('discovery')}</section>`;

    const setup = `<section class="chap" id="ch-setup" hidden><div class="chap__h"><span class="mono">Chapter /02 · 1 week</span><h1>How the team’s know-how became rules.</h1>
        <p>Everything the team knew, written down or not, became rules the agents follow and people can read. The tools stayed where they were.</p></div>
      ${sub('The rule compiler', 'Their document in · rules out')}
      <div class="compiler"><div class="panel file">${I('sop', { size: 40 })}<div class="file__doc">${I('invoice', { size: 26 })}<b>${esc(M.sop.file)}</b></div>
          <div class="prog"><i></i></div><p class="mono" data-cstat>${M.sop.extracted} rules found · ${M.sop.unwritten} unwritten rules from interviews</p>
          <button class="btn btn--solid" data-compile style="justify-self:start">Compile the rules ${ARR}</button>
          <p style="margin:0;font:400 14px/1.5 var(--font-text);color:var(--fg-soft)">Each rule keeps a confidence score: how sure the compiler is that it read the rule right. Anything under 95% is checked by the person who owns the process.</p></div>
        <div class="panel rules" data-state="idle">${M.sop.rules.map(([t, c], i) => `<div class="rule"><span class="mono">${String(i + 1).padStart(2, '0')}</span><p>${esc(t)}</p><span class="pc">${c}%</span></div>`).join('')}</div></div>
      ${sub('The unwritten rules', 'From interviews · now written down')}
      <div class="tacit">${M.sop.tacit.map(([t, who, kind]) => `<div class="panel"><p>${esc(t)}</p><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="mono">Source: ${esc(who)}</span><span class="tag">${esc(kind)}</span></div></div>`).join('')}</div>
      ${sub('How the agents connect', 'Zero migration')}
      <div class="tabs" role="tablist">${[['api', 'Through the tool’s own door (API)'], ['inbox', 'Reading inboxes and chat'], ['files', 'Reading files']].map(([k, n], i) => `<button role="tab" aria-selected="${i === 0}" data-tab="${k}">${n}</button>`).join('')}</div>
      <div class="panel integ" data-integ>${''}</div>
      ${sub('How sure is sure enough', 'Drag a threshold')}
      <div class="panel thr">${M.thresholds.map(([wf, th, base], i) => `<div class="thr__row" data-i="${i}"><b>${esc(wf)}</b><input type="range" min="70" max="99" value="${th}" aria-label="Confidence threshold for ${esc(wf)}"><div class="thr__out"><span class="mono"><span data-th>${th}</span>% bar · <span data-auto></span>% alone</span><div class="thr__mix"><i></i><i></i></div></div></div>`).join('')}</div>
      <p class="mono" style="margin-top:12px">White = goes ahead alone · lilac = waits for a person. A higher bar sends more to people.</p>
      ${nextBtn('setup')}</section>`;

    const team = `<section class="chap" id="ch-team" hidden><div class="chap__h"><span class="mono">Chapter /03 · in production</span><h1>What each person saw in their day.</h1>
        <p>Agents work overnight and between meetings. In the morning, each person opens a short queue of things that need their judgement. Try approving one.</p></div>
      <div class="roles" role="tablist">${M.roles.map((r, i) => `<button role="tab" aria-selected="${i === 0}" data-role="${r.id}">${esc(r.name)}</button>`).join('')}</div>
      <div data-roleview></div>${nextBtn('team')}</section>`;

    const R = M.run;
    const engine = `<section class="chap" id="ch-engine" hidden><div class="chap__h"><span class="mono">Chapter /04 · how it works</span><h1>How the agents work together.</h1>
        <p>One event comes in. A coordinating agent splits the job between specialists, each following the client’s rules, and the result waits for a person when it matters. Press run.</p></div>
      ${sub('A live example', esc(R.label))}
      <div class="run"><div class="panel event"><span class="mono">The event</span>${I('bolt', { size: 34, run: true })}<ul>${R.event.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
          <button class="btn btn--solid" data-run style="justify-self:start">Run it ${ARR}</button></div>
        <div class="panel orch"><div class="orch__main">${I('agent', { size: 34, run: true })}<div><b>Coordinating agent</b><span class="mono">splits the job · ${R.subs.length} specialists</span></div></div>
          ${R.subs.map(([n, t, out, rule, c]) => `<div class="subag wait">${I('route', { size: 24 })}<div><b>${esc(n)}</b><p>${esc(out)}</p><div class="rl">${esc(rule)}</div></div><div class="tm">${esc(t)}<br>${c}%</div></div>`).join('')}
          <div class="result">${I('person', { size: 26 })}<span>${esc(R.result)}</span></div></div></div>
      ${sub('Where it runs', 'Your cloud · your private network')}
      ${flowSVG('panel infra', C.client.stack)}
      <div class="layers" style="margin-top:12px">${D.stack.layers.slice(0, 3).map((l) => `<div class="layer panel">${I(l.icon, { size: 32, run: true })}<h3>${esc(l.name)}</h3><p>${esc(l.plain)}</p></div>`).join('')}</div>
      ${sub('It learns from corrections', 'The feedback loop')}
      <div class="fb"><div class="panel"><span class="mono">The agent said</span><b class="strike">${esc(M.feedback.pred)}</b></div><div class="panel"><span class="mono">A person corrected</span><b>${esc(M.feedback.corr)}</b></div>
        <div class="panel"><p style="margin:0;font:400 15px/1.5 var(--font-text);color:var(--fg-soft)">${esc(M.feedback.note)}</p><div class="acc"><span><span class="mono">Before</span><br><b>${M.feedback.before}%</b></span><span><span class="mono">After</span><br><b>${M.feedback.after}%</b></span></div></div></div>
      ${sub('When the business changes', 'Rules update from the source')}
      <ul class="changes">${M.changes.map(([d, t, x, n]) => `<li><span class="mono">${esc(d)}</span><div><b>${esc(t)}</b><p>${esc(x)}</p></div><span class="tag">${n} rule${n > 1 ? 's' : ''} updated</span></li>`).join('')}</ul>
      ${nextBtn('engine')}</section>`;

    const cv = M.curve, cw = 900, chh = 260, minV = 85, maxV = 100;
    const pts = cv.map((v, i) => [40 + i * ((cw - 60) / (cv.length - 1)), 20 + (1 - (v - minV) / (maxV - minV)) * (chh - 50)]);
    const curve = `<svg viewBox="0 0 ${cw} ${chh}" role="img" aria-label="Accuracy rose from ${cv[0]}% to ${cv[cv.length - 1]}% over ${cv.length - 1} weeks">${[85, 90, 95, 100].map((v) => { const y = 20 + (1 - (v - minV) / (maxV - minV)) * (chh - 50); return `<line class="gridl" x1="40" x2="${cw - 20}" y1="${y}" y2="${y}"/><text x="0" y="${y + 4}">${v}%</text>`; }).join('')}
      <path class="ln" pathLength="1" d="M${pts.map((p) => p.join(' ')).join(' L')}"/>${pts.map(([x, y], i) => `<circle class="pt" cx="${x}" cy="${y}" r="3.5"/><text x="${x - 10}" y="${chh - 4}">W${i}</text>`).join('')}
      <text x="${pts[pts.length - 1][0] - 120}" y="${pts[pts.length - 1][1] - 14}" style="fill:#F3F2F7">${cv[cv.length - 1]}% after ${cv.length - 1} weeks</text></svg>`;
    const outcomes = `<section class="chap" id="ch-outcomes" hidden><div class="chap__h"><span class="mono">Chapter /05 · modelled</span><h1>What they were left with.</h1>
        <p>The numbers below are modelled for this illustrative agency and would be re-measured against the audit’s baseline after go-live. The system, the rules and the knowledge stay with the client.</p></div>
      ${sub('Before and after', 'Modelled')}
      <div class="panel"><table class="ba-table"><thead><tr><th>Measure</th><th>Before</th><th>After</th></tr></thead><tbody>${C.results.map(([m, b, a]) => `<tr><td>${esc(m)}</td><td class="b">${esc(b)}</td><td class="a">${esc(a)}</td></tr>`).join('')}</tbody></table></div>
      ${sub('The agents get better every week', 'Agreement with the team’s own decisions')}
      <div class="panel curve">${curve}</div>
      ${sub('Every action, written down', 'Search the audit trail')}
      <div class="trail"><input type="search" placeholder="Search: an agent, an action, a person…" aria-label="Search the audit trail"><div class="panel" data-trail></div></div>
      ${sub('They own all of this', 'No lock-in')}
      <div class="owns4">${D.stack.owns.map(([t, p], i) => `<div class="panel">${I(['key', 'lock', 'off', 'sop'][i], { size: 30 })}<h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
      ${sub('The value, with the math', 'Hours first, money second')}
      <div class="panel" style="padding:20px"><table class="ba-table" style="margin:-16px 0 0">${C.math.cost.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td class="b">${esc(b)}</td><td class="a" style="text-align:right">${esc(c)}</td></tr>`).join('')}</table>
        <p style="margin:18px 0 0;font:300 24px/1.2 var(--font-display)">${esc(C.math.costTotal)}</p><p class="mono" style="margin-top:10px;text-transform:none;letter-spacing:0;font-family:var(--font-text);font-size:13.5px">${esc(C.math.note)}</p></div>
      ${nextBtn('outcomes')}</section>`;

    body.innerHTML = `<div class="demo"><aside class="side"><a class="side__brand" href="index.html">${mark()}<span><b>Not Human</b><span class="mono-s">${esc(C.dept)} system</span></span></a><nav class="side__nav">${nav}</nav>
        <div class="side__foot"><a href="case-${C.id}.html">Read the case study</a><a href="index.html">All case studies</a><a href="${HOME}">Not Human home</a><span class="mono-s">Illustrative demo</span></div></aside>
      <div class="main"><div class="top"><b>${esc(C.client.name)}</b><span class="sep"></span><span class="mono">${esc(C.dept)}</span><span class="sep"></span><span class="mono">${C.rollout.length} steps · ${C.rollout[C.rollout.length - 1][0]}</span><span class="tag tag--hold"><i></i>Illustrative · modelled numbers</span></div>
        ${overview}${discovery}${setup}${team}${engine}${outcomes}</div></div>`;
    wireDemo(M);
  }

  function wireDemo(M) {
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
    // chapters by hash
    const show = () => {
      const k = (location.hash || '#overview').slice(1), key = CH.some((c) => c[0] === k) ? k : 'overview';
      $$('.chap').forEach((s) => (s.hidden = s.id !== 'ch-' + key));
      $$('.side__nav a').forEach((a) => { if (a.dataset.ch !== key) a.removeAttribute('aria-current'); else a.setAttribute('aria-current', 'page'); });
      scrollTo(0, 0);
      enter(key);
    };
    addEventListener('hashchange', show);
    const done = {};
    function enter(k) {
      if (k === 'discovery' && !done.d) { done.d = 1; $$('.tool').forEach((t, i) => setTimeout(() => { t.classList.add('ok'); t.querySelector('.st em').textContent = 'Connected'; }, reduce ? 0 : 250 + i * 180)); }
      if (k === 'outcomes') { requestAnimationFrame(() => $('.curve').classList.add('on')); }
    }
    // discovery: heat rows and opportunity rows open
    $$('.heat button').forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true')));
    $$('.opp > button').forEach((b) => b.addEventListener('click', () => { const o = b.parentElement, op = o.toggleAttribute('open'); b.setAttribute('aria-expanded', op); }));
    // setup: compile
    const rules = $('.rules'), prog = $('.prog i');
    $('[data-compile]').addEventListener('click', (e) => {
      e.currentTarget.disabled = true; prog.style.transform = 'scaleX(1)';
      $$('.rule', rules).forEach((r) => { r.style.opacity = '.18'; });
      rules.dataset.state = 'run';
      $$('.rule', rules).forEach((r, i) => setTimeout(() => { r.style.opacity = '1'; }, reduce ? 0 : 400 + i * 260));
      setTimeout(() => { $('[data-cstat]').textContent = `Compiled · ${M.sop.extracted} rules · ${M.sop.unwritten} unwritten rules captured`; e.currentTarget && (e.currentTarget.textContent = 'Compiled'); }, reduce ? 0 : 1900);
    });
    // setup: integration tabs
    const integ = $('[data-integ]');
    const integText = { api: 'Direct, scoped access through each tool’s official door. Real time, with the agent’s own key.', inbox: 'The agent reads a shared inbox or channel with its own account, the way a new colleague would.', files: 'Documents and old spreadsheets are read once into the second brain, then kept in sync.' };
    const setInteg = (k) => { integ.innerHTML = `<p>${integText[k]}</p>` + M.integ[k].map((t) => `<span class="tag">${esc(t)}</span>`).join(''); $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === k)); };
    $$('.tabs button').forEach((b) => b.addEventListener('click', () => setInteg(b.dataset.tab))); setInteg('api');
    // setup: thresholds. A higher bar sends more to people: the auto share falls about 2.4 points per point of bar
    $$('.thr__row').forEach((row) => {
      const [wf, th0, base] = M.thresholds[+row.dataset.i], inp = $('input', row);
      const upd = () => { const th = +inp.value, auto = Math.max(5, Math.min(97, Math.round(base - (th - th0) * 2.4)));
        $('[data-th]', row).textContent = th; $('[data-auto]', row).textContent = auto; const [a, b] = $$('.thr__mix i', row); a.style.flex = `0 0 ${auto}%`; b.style.flex = `1 1 auto`; };
      inp.addEventListener('input', upd); upd();
    });
    // team views
    const rv = $('[data-roleview]');
    const role = (rid) => {
      const r = M.roles.find((x) => x.id === rid);
      $$('.roles button').forEach((b) => b.setAttribute('aria-selected', b.dataset.role === rid));
      const max = Math.max(...r.week);
      rv.innerHTML = `<p class="role-intro">${esc(r.intro)}</p>
        <div class="counts" style="margin:0 0 12px">${r.stats.map(([n, l]) => `<div class="panel"><b>${esc(n)}</b><span class="mono">${esc(l)}</span></div>`).join('')}</div>
        <p class="mono" style="margin:0 0 22px">${esc(r.was)}</p>
        <div class="sub" style="margin-top:0"><h2>Waiting for ${esc(r.name.toLowerCase())}</h2><span class="mono" data-left>${r.queue.length} item${r.queue.length > 1 ? 's' : ''} need a person</span></div>
        <div class="queue">${r.queue.map(([qid, pr, type, title, ctx, c]) => `<article class="qi panel" data-q="${qid}"><div><div class="qi__top"><span class="pri ${pr}"></span><span class="mono">${qid} · ${esc(type)}</span><span class="conf">${c}% sure</span></div><h3>${esc(title)}</h3><p>${esc(ctx)}</p><span class="stamp"></span></div>
          <div class="act"><button class="btn btn--solid" data-a="Approved">Approve</button><button class="btn" data-a="Sent back to edit">Edit</button><button class="btn" data-a="On hold">Hold</button></div></article>`).join('')}</div>
        <div class="sub"><h2>Hours given back each week</h2><span class="mono">First month in production</span></div>
        <div class="panel weekbars">${r.week.map((h, i) => `<div><b>${h} h</b><i style="height:${Math.round(h / max * 100)}%"></i><span class="mono">Week ${i + 1}</span></div>`).join('')}</div>`;
      $$('.qi', rv).forEach((q) => $$('[data-a]', q).forEach((b) => b.addEventListener('click', () => {
        q.classList.add('done'); $('.stamp', q).textContent = `${b.dataset.a} by ${r.name.toLowerCase()} · logged to the audit trail`;
        const left = $$('.qi:not(.done)', rv).length; $('[data-left]', rv).textContent = left ? `${left} item${left > 1 ? 's' : ''} need a person` : 'Queue clear';
      })));
    };
    $$('.roles button').forEach((b) => b.addEventListener('click', () => role(b.dataset.role))); role(M.roles[0].id);
    // under the hood: run the specialists one by one
    $('[data-run]').addEventListener('click', (e) => {
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Running…';
      const subs = $$('.subag'), res = $('.result'); res.classList.remove('on'); subs.forEach((s) => { s.classList.add('wait'); s.classList.remove('busy'); });
      let t = 200;
      subs.forEach((s, i) => { const dur = reduce ? 0 : Math.min(1400, parseFloat(M.run.subs[i][1]) * 450);
        setTimeout(() => { s.classList.remove('wait'); s.classList.add('busy'); }, reduce ? 0 : t);
        setTimeout(() => s.classList.remove('busy'), reduce ? 0 : t + dur); t += dur + 120; });
      setTimeout(() => { res.classList.add('on'); btn.disabled = false; btn.innerHTML = `Run it again ${ARR}`; }, reduce ? 0 : t + 100);
    });
    // outcomes: audit trail search
    const trail = $('[data-trail]');
    const drawTrail = (q = '') => { const ql = q.toLowerCase();
      trail.innerHTML = M.trail.filter((r) => !ql || r.join(' ').toLowerCase().includes(ql)).map(([t, who, st, txt, c]) => `<div class="tr-row"><span class="t">${t}</span><span class="who">${esc(who)}</span><span class="st ${st}">${{ auto: 'Done alone', held: 'Waits for a person', human: 'By a person' }[st]}</span><span>${esc(txt)}</span><span class="c">${c}%</span></div>`).join('') || '<div class="tr-row"><span></span><span></span><span></span><span>Nothing matches.</span><span></span></div>'; };
    $('.trail input').addEventListener('input', (e) => drawTrail(e.target.value)); drawTrail();
    show();
  }

  /* ================================================================ INDEX (pearl) */
  function renderIndex() {
    document.title = 'Case studies · Not Human';
    const depts = ['All', ...D.cases.map((c) => c.dept)];
    body.innerHTML = `
<header class="bar"><a class="bar__brand" href="index.html">${mark()}Not Human</a><nav class="bar__nav"><a href="${HOME}">Not Human home</a><a href="audit-demo.html" target="_blank" rel="noopener noreferrer">The audit report</a><a href="#how">How every system runs</a><a class="btn" href="#cases">See the cases ${ARR}</a></nav></header>
<main>
  <section class="idx-hero"><div data-rise><span class="mono">Case studies · interactive demos</span><h1>What an agent system looks like inside an agency.</h1>
    <p>Three illustrative engagements, one per department. Each has a case study you can read in ten minutes and a demo you can click through, from the first audit to the numbers after.</p></div>
    <div data-rise class="idx-mark">${mark('', 1)}</div></section>
  <a class="feat wrap" href="audit-demo.html" data-rise target="_blank" rel="noopener noreferrer"><div class="feat__in"><span class="mono">Start here · the audit demo</span><h2>Three weeks with a finance team, and what we found.</h2><p>What an audit delivers, told as a story: the days with the team, the findings and the plan, for an illustrative agency group. Dark, interactive, about five minutes.</p><span class="btn btn--solid">Open the audit demo ${AR}</span></div><div class="feat__art">${ART([[0, 3], [1, 3], [1, 2], [2, 2], [3, 1], [4, 2], [5, 1], [6, 1]])}</div></a>
  <div class="filters" id="cases" role="toolbar" aria-label="Filter by department">${depts.map((d, i) => `<button class="chip" aria-pressed="${i === 0}" data-f="${d}">${d}</button>`).join('')}<span class="mono count" data-count>${D.cases.length} case studies</span></div>
  <section class="cards">${D.cases.map((c) => `<article class="ccard" data-dept="${c.dept}" data-rise><div class="ccard__art">${ART(c.art)}<div class="tags"><span class="tag">/${c.no} · ${esc(c.dept)}</span><span class="tag">Illustrative</span></div></div>
      <div class="ccard__body"><span class="mono">${esc(c.kicker)}</span><h2>${esc(c.title)}</h2>
        <div class="metric"><span class="mono">${esc(c.card.metric)}</span><div><b>${esc(c.card.after)}</b><small>from ${esc(c.card.before)}</small></div>
          <div class="ba"><span>Before</span><span class="bar2"><i style="transform:scaleX(${c.card.b})"></i></span><span>${esc(c.card.before)}</span></div>
          <div class="ba after"><span>After</span><span class="bar2"><i style="transform:scaleX(${c.card.a})"></i></span><span>${esc(c.card.after)}</span></div></div>
        <p>${esc(c.card.line)}</p>
        <div class="btns"><a class="btn btn--solid" href="case-${c.id}.html">Read the case ${AR}</a><a class="btn" href="demo-${c.id}.html">Open the demo</a></div></div></article>`).join('')}
  </section>
  <section class="idx-how" id="how">${D.stack.layers.slice(0, 6).map((l) => `<div data-rise>${I(l.icon, { size: 40, run: true })}<h3>${esc(l.name)}</h3><p>${esc(l.plain)}</p></div>`).join('')}</section>
  <aside class="notice" style="margin-top:var(--sec)">${I('flag', { size: 22 })}<p>${esc(D.note)} Varick Agents’ public case studies and demo inspired the format; their numbers are their own claims and are not used here.</p></aside>
  <section class="close"><div><p class="mono">Your turn</p><h2>Show us one process. We’ll show you the real one.</h2></div><div class="close__btns"><a class="btn btn--solid" href="${HOME}#call">Book a 30-minute call ${AR}</a></div></section>
</main>
<footer class="foot"><span>Not Human · a RemotoLabs company</span><span>Internal draft · not published</span><span>© 2026</span></footer>`;
    document.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.f; document.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x === b));
      let n = 0; document.querySelectorAll('.ccard').forEach((c) => { const on = f === 'All' ? true : c.dataset.dept === f; c.hidden = !on; if (on && c.dataset.dept !== 'slot') n++; });
      document.querySelector('[data-count]').textContent = `${n} case stud${n === 1 ? 'y' : 'ies'}`;
    }));
    arm();
  }

  if (view === 'case' && C) renderCase();
  else if (view === 'demo' && C) renderDemo();
  else renderIndex();
})();
