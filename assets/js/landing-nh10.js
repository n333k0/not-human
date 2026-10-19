/* Not Human landing v10 (2026-10-18, owner): "Measure the leak" and the booking card.
   The leak layer opens from the hero's button: the page blurs behind it, the glass object stays sharp (landing-nh10.css raises
   .gl8), and four short questions run one at a time, each with one huge number you can type or drag. A voice reads each question.
   The estimate follows the field note "Hours first, money second" (out-essay-hours-first-money-second): people x hours a week x
   46 weeks x a 70% recoverable share x the hourly cost they give. It is labelled as an estimate; the audit measures the real one.
   Voice: plays assets/voice/leak-N.mp3 when the file exists (made once by tools/build-voice.py with a studio-quality voice).
   Without the files it uses the browser's voice only when that voice is a natural or neural one, so it is never robotic; else silent. */

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const WEEKS = 46, SHARE = .7, AUDIT = '$3,000';
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const num = n => Math.round(n).toLocaleString('en-US');

/* step 4 (owner, 2026-10-18): a long list, grouped, so it gives ideas: what an owner or an operations lead is quietly stuck doing,
   including the design work and the emails people don't think of handing off */
const CHIP_GROUPS = [
  ['Sales', ['Lead follow-up emails', 'Qualifying new leads', 'CRM updates', 'Proposals and quotes', 'Call notes into the CRM', 'Booking meetings', 'Chasing unsigned contracts']],
  ['Marketing & design', ['Social media posts', 'Newsletters', 'Ad variations', 'Design requests and resizes', 'Pitch decks', 'Case studies and blog posts', 'Product photos and mock-ups']],
  ['Customer support', ['Email and WhatsApp replies', 'Ticket triage', 'Answering the same questions', 'Order status questions', 'Replying to reviews', 'Refunds and returns']],
  ['Finance', ['Invoicing', 'Payment reminders', 'Expense receipts', 'Bank reconciliation', 'Month-end reports', 'Payroll inputs']],
  ['Operations', ['Copying data between tools', 'Spreadsheet clean-up', 'PDFs and forms', 'Purchase orders', 'Inventory checks', 'Vendor follow-ups', 'Scheduling and dispatch']],
  ['People', ['Screening CVs', 'Interview scheduling', 'Onboarding new hires', 'Policy questions', 'Timesheets']],
  ['Management & knowledge', ['Weekly status reports', 'Dashboards', 'Meeting notes and action items', 'SOPs and documentation', '“Where is that file?”', 'Approvals and sign-offs', 'Research and competitor tracking']],
];
const CHIPS = CHIP_GROUPS.flatMap(g => g[1]);
const STEPS = [
  { k: 'people', q: 'How many people are on your team?', hint: 'Everyone who touches the work, you included.',
    unit: v => (v === 1 ? 'person' : 'people'), min: 1, max: 200, top: 5000, step: 1, def: 10 },
  { k: 'hours', q: 'How many hours a week does each of them spend on repeat work?', hint: 'Copying between tools, chasing updates, re-typing, building the same report again.',
    unit: () => 'hours a week, each', min: 0, max: 30, top: 60, step: 1, def: 8 },
  { k: 'rate', q: 'What does an hour of their time cost you?', hint: 'Salary plus overhead, in US dollars. A rough number is fine.',
    pre: '$', unit: () => 'per hour', min: 15, max: 200, top: 1000, step: 5, def: 40 },
  { k: 'handoff', q: 'What would you hand off, if you could?', hint: 'Pick everything that eats your team\u2019s week, even the things you think can\u2019t be automated. Or skip.', chips: CHIPS }
];
/* what the voice says; keep in step with assets/voice/lines.json (tools/build-voice.py reads that file) */
const LINES = [
  'How many people are on your team?',
  'And how many hours a week does each of them spend on repeat work?',
  'What does an hour of their time cost you?',
  'What would you hand off, if you could? Even the things you think can\u2019t be automated.',
  'Here\u2019s what that repeat work is worth, every year.'
];

/* ================================================================ the voice */
/* window.NH_VOICE.level (0..1) is how loud she is right now; landing-nh9.js makes the orb breathe and glow with it */
window.NH_VOICE = { level: 0 }; window.NH_LEAKMODE = { on: false };
/* the voice set: assets/voice/ by default; ?voice=<name> or window.NH_VOICE_SET plays assets/voice/<name>/ (to compare voices) */
const SET = ((new URLSearchParams(location.search).get('voice') || window.NH_VOICE_SET || '') + '').replace(/[^a-z0-9-]/gi, '');
const voice = (() => {
  const btn = $('.ob-voice');
  let on = localStorage.getItem('nh-voice') !== 'off', audio = null, synthVoice;
  let ctx = null, an = null, buf = null, src = null, mode = '', pulse = 0, raf = 0;
  // talking: the button's waves move, and the orb (landing-nh9.js) grows to fill the screen while she speaks
  const talk = v => { if (btn) btn.classList.toggle('talk', v); window.NH_LEAKMODE.talk = !!v; };
  // loudness: read from the audio itself when it can be; for the browser voice, a pulse on every word
  function meter() {
    let lv = 0;
    if (mode === 'file' && audio && !audio.paused) {
      if (an) { an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        lv = Math.min(1, Math.max(0, Math.sqrt(s / buf.length) * 3.6 - .03)); }
      else lv = .35 + .25 * Math.abs(Math.sin(audio.currentTime * 11));
    } else if (mode === 'synth' && speechSynthesis.speaking) { pulse *= .9; lv = Math.max(.25 + .1 * Math.sin(performance.now() / 70), pulse); }
    window.NH_VOICE.level = lv;
    raf = mode ? requestAnimationFrame(meter) : 0;
  }
  const run = m => { mode = m; if (!raf) raf = requestAnimationFrame(meter); };
  function wire(a) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      if (!an) { an = ctx.createAnalyser(); an.fftSize = 1024; buf = new Float32Array(an.fftSize); an.connect(ctx.destination); }
      src = ctx.createMediaElementSource(a); src.connect(an);
    } catch { an = null; }
  }
  const natural = () => {
    if (synthVoice !== undefined || !('speechSynthesis' in window)) return synthVoice || null;
    const vs = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
    if (!vs.length) return null;                                   // voices load late in Chrome; try again next time
    const rank = v => (/natural|neural/i.test(v.name) ? 0 : /premium|enhanced/i.test(v.name) ? 1 : /^Google US English$/i.test(v.name) ? 2 : 9)
      - (/aria|jenny|ava|emma|zoe|serena|sonia|libby/i.test(v.name) ? .5 : 0);
    const best = vs.sort((a, b) => rank(a) - rank(b))[0];
    synthVoice = rank(best) < 9 ? best : null;
    return synthVoice;
  };
  if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', () => { synthVoice = undefined; natural(); });
  function stop() {
    if (audio) { audio.pause(); audio = null; }
    if (src) { try { src.disconnect(); } catch {} src = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    mode = ''; window.NH_VOICE.level = 0; talk(false);
  }
  function synth(text) {
    const v = natural(); if (!v) return;
    const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = v.lang; u.rate = .98; u.pitch = 1.02;
    u.onstart = () => { talk(true); run('synth'); }; u.onboundary = () => { pulse = 1; };
    u.onend = u.onerror = () => { talk(false); mode = ''; window.NH_VOICE.level = 0; };
    speechSynthesis.speak(u);
  }
  function say(i) {
    stop(); if (!on || LINES[i] == null) return;
    const a = new Audio(`assets/voice/${SET ? SET + '/' : ''}leak-${i + 1}.mp3`); audio = a;
    wire(a);
    a.addEventListener('playing', () => { talk(true); run('file'); });
    a.addEventListener('ended', () => { talk(false); mode = ''; window.NH_VOICE.level = 0; });
    a.addEventListener('error', () => { if (audio === a) { audio = null; synth(LINES[i]); } }, { once: true });
    a.play().catch(() => {});                                      // a missing file still fires 'error' and falls back
  }
  const sync = () => btn && (btn.setAttribute('aria-pressed', String(on)), btn.setAttribute('aria-label', on ? 'Voice on. Turn it off' : 'Voice off. Turn it on'));
  sync();
  return { say, stop, toggle(i) { on = !on; localStorage.setItem('nh-voice', on ? 'on' : 'off'); sync(); on ? say(i) : stop(); } };
})();

/* ================================================================ Measure the leak */
const ob = $('#leak');
const leak = ob && (() => {
  const ask = $('.ob-ask', ob), res = $('.ob-res', ob), prog = $$('.ob-prog li', ob);
  const elN = $('.ob-n', ob), elQ = $('.ob-q', ob), elHint = $('.ob-hint', ob), elNum = $('.ob-num', ob), elPre = $('.ob-pre', ob);
  const big = $('.ob-big', ob), unit = $('.ob-unit', ob), range = $('.ob-range', ob), chips = $('.ob-chips', ob), sum = $('.ob-sum', ob);
  const prev = $('.ob-prev', ob), next = $('.ob-next', ob), skip = $('.ob-skip', ob), back = $('.ob-back');
  const nextLabel = next.firstChild;                                  // the text node before the arrow
  const vals = Object.fromEntries(STEPS.filter(s => !s.chips).map(s => [s.k, s.def]));
  const picked = new Set(); let other = '';
  let step = 0, opener = null, open = false, fresh = true;   // fresh: the first digit typed replaces the shown number

  /* chips, built once */
  CHIP_GROUPS.forEach(([name, items]) => {
    const g = document.createElement('div'); g.className = 'ob-grp'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', name);
    const t = document.createElement('span'); t.className = 'ob-grp-t'; t.textContent = name; g.append(t);
    items.forEach(c => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { picked.has(c) ? picked.delete(c) : picked.add(c); b.setAttribute('aria-pressed', String(picked.has(c))); });
      g.append(b);
    });
    chips.append(g);
  });
  const otherIn = document.createElement('input'); otherIn.placeholder = 'Something else\u2026'; otherIn.setAttribute('aria-label', 'Something else');
  otherIn.addEventListener('input', () => { other = otherIn.value.trim(); });
  const og = document.createElement('div'); og.className = 'ob-grp'; og.append(otherIn); chips.append(og);

  const fitBig = () => { big.style.width = Math.max(1, big.value.length) * .62 + .08 + 'em'; };
  function setVal(v, from) {
    const s = STEPS[step];
    if (from !== 'type') big.value = String(v);
    vals[s.k] = v; fitBig();
    range.value = String(Math.min(Math.max(v, s.min), s.max));
    range.style.setProperty('--p', ((range.value - s.min) / (s.max - s.min)) * 100 + '%');
    unit.textContent = s.unit(v);
    sum.textContent = s.k === 'hours' ? `= ${num(vals.people * v)} hours a week across the team`
      : s.k === 'rate' ? `= ${num(vals.people * vals.hours * WEEKS)} hours a year at ${money(v)}` : '';
  }
  big.addEventListener('input', () => {
    const s = STEPS[step]; const d = big.value.replace(/\D/g, '').slice(0, String(s.top).length);
    big.value = d; if (d === '') { fitBig(); return; }
    setVal(Math.min(+d, s.top), 'type');
  });
  big.addEventListener('blur', () => { const s = STEPS[step]; if (s && !s.chips) setVal(Math.max(s.min, vals[s.k] || s.min)); });
  big.addEventListener('keydown', e => {
    if (fresh && /^\d$/.test(e.key)) big.value = '';
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') fresh = false;
    const s = STEPS[step]; if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault(); setVal(Math.min(s.top, Math.max(s.min, (vals[s.k] || 0) + (e.key === 'ArrowUp' ? s.step : -s.step))));
  });
  range.addEventListener('input', () => { fresh = true; setVal(+range.value); });

  // the orb (landing-nh9.js) frames the number on a question, sits between the question and the chips on step 4, and hangs behind the result
  function aim() {
    if (!open) return;
    const lm = window.NH_LEAKMODE, R = el => el.getBoundingClientRect();
    if (!res.hidden) { const r = R($('.ob-total', ob)); Object.assign(lm, { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.height * .55 }); return; }
    if (!chips.hidden) { const a = R(elHint).bottom, b = R(chips).top, g = b - a;
      Object.assign(lm, { x: innerWidth / 2, y: a + g / 2, r: Math.max(40, Math.min(150, g / 2 - 34)) }); return; }
    const r = R(elNum); Object.assign(lm, { x: innerWidth / 2, y: r.top + r.height / 2, r: Math.max(64, Math.min(200, r.height * .52)) });
  }
  addEventListener('resize', aim);

  // one view out, the next in; immediate while the layer itself is still fading in
  function swap(view, fill) {
    const cur = !ask.hidden ? ask : !res.hidden ? res : null;
    const go = () => { if (cur && cur !== view) cur.hidden = true; fill(); view.hidden = false; requestAnimationFrame(aim); };
    if (reduced || !cur || !ob.classList.contains('in')) { go(); return; }
    cur.classList.add('out');
    setTimeout(() => { cur.classList.remove('out'); go(); view.classList.add('out');
      requestAnimationFrame(() => requestAnimationFrame(() => view.classList.remove('out'))); }, 260);
  }

  function show(i) {
    step = i; ob.classList.toggle('done', i === STEPS.length);
    prog.forEach((p, k) => p.classList.toggle('on', k <= Math.min(i, STEPS.length - 1)));
    prev.hidden = i === 0;
    prev.lastChild.textContent = i === STEPS.length ? 'Change my numbers' : 'Back';
    skip.textContent = i === STEPS.length ? 'Close' : 'Not now';
    if (i === STEPS.length) { swap(res, result); voice.say(4); return; }
    const s = STEPS[i];
    nextLabel.textContent = i === STEPS.length - 1 ? 'See my number ' : 'Continue ';
    swap(ask, () => {
      elN.textContent = `${String(i + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}`;
      elQ.textContent = s.q; elHint.textContent = s.hint;
      const isChips = !!s.chips;
      elNum.hidden = unit.hidden = range.hidden = isChips; chips.hidden = !isChips;
      ask.classList.toggle('is-chips', isChips);
      if (!isChips) {
        elPre.textContent = s.pre || '';
        Object.assign(range, { min: s.min, max: s.max, step: s.step });
        range.setAttribute('aria-label', s.q); big.setAttribute('aria-label', s.q);
        setVal(vals[s.k]);
        fresh = true;
        if (finePointer) setTimeout(() => { big.focus({ preventScroll: true }); big.setSelectionRange(big.value.length, big.value.length); }, reduced ? 0 : 320);
      } else sum.textContent = '';
    });
    // the first line waits for the orb to fade in, so it is there when she speaks
    if (i === 0 && !ob.classList.contains('in')) setTimeout(() => { if (open && step === 0) voice.say(0); }, reduced ? 0 : 750);
    else voice.say(i);
  }

  function result() {
    const { people, hours, rate } = vals;
    const all = people * hours * WEEKS * rate, take = all * SHARE;
    const out = $('.ob-total-n', ob), tot = $('.ob-total', ob);
    $('.ob-all', ob).textContent = money(all);
    $('.ob-how', ob).textContent = `${num(people)} ${people === 1 ? 'person' : 'people'} \u00d7 ${hours} h a week \u00d7 ${WEEKS} weeks \u00d7 70% \u00d7 ${money(rate)} an hour. ` +
      'An estimate from your numbers, not a promise. The audit counts the real one from interviews with your team.';
    const first = people <= 10 ? 'one workflow' : people <= 50 ? 'the two or three workflows that pay back first' : 'one department at a time';
    $('.ob-start', ob).textContent = `Where we\u2019d start: the audit (${AUDIT}, 1\u20132 weeks), then ${first}.`;
    // size the number for its final width before it counts up, so it never jumps
    out.textContent = money(take); tot.style.fontSize = '';
    requestAnimationFrame(() => {
      const room = res.clientWidth || innerWidth - 32;
      if (tot.scrollWidth > room) tot.style.fontSize = parseFloat(getComputedStyle(tot).fontSize) * room / tot.scrollWidth * .96 + 'px';
      if (reduced) return;
      const t0 = performance.now(), D = 1500;
      const tick = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(2, -10 * k); out.textContent = money(take * (k === 1 ? 1 : e)); if (k < 1 && open) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    // carry the numbers into the booking card
    const hand = [...picked, other].filter(Boolean);
    const note = `From Measure the leak: ${num(people)} people \u00b7 ${hours} h a week each \u00b7 ${money(rate)}/h \u2192 about ${money(take)} a year an agent could take back` +
      (hand.length ? `. Would hand off: ${hand.join(', ')}.` : '.');
    window.NH_LEAK = { people, hours, rate, all: Math.round(all), take: Math.round(take), handoff: hand, note };
    const bl = $('.book-leak'); if (bl) { bl.textContent = note; bl.hidden = false; }
    document.dispatchEvent(new CustomEvent('nh:leak', { detail: window.NH_LEAK }));
  }

  /* focus stays inside while it is open */
  function trap(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Enter' && e.target === big) { e.preventDefault(); next.click(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('button, a[href], input, [tabindex]:not([tabindex="-1"])', ob).filter(el => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }

  function openIt(from) {
    if (open) return; open = true; opener = from || document.activeElement;
    ob.hidden = false; back.hidden = false; document.documentElement.classList.add('ob-open'); window.NHLenis?.stop(); window.NH_LEAKMODE.on = true;
    requestAnimationFrame(() => requestAnimationFrame(() => { ob.classList.add('in'); back.classList.add('in'); }));
    document.addEventListener('keydown', trap);
    show(0);
    if (!finePointer) setTimeout(() => next.focus({ preventScroll: true }), 50);
  }
  function close(keepFocus) {
    if (!open) return; open = false; voice.stop(); window.NH_LEAKMODE.on = false;
    ob.classList.remove('in'); back.classList.remove('in'); document.removeEventListener('keydown', trap);
    setTimeout(() => { if (open) return; ob.hidden = true; back.hidden = true; document.documentElement.classList.remove('ob-open'); window.NHLenis?.start(); }, reduced ? 0 : 520);
    if (!keepFocus && opener && opener.focus) opener.focus({ preventScroll: true });
  }

  next.addEventListener('click', () => { if (step < STEPS.length) show(step + 1); });
  prev.addEventListener('click', () => show(step === STEPS.length ? 0 : Math.max(0, step - 1)));
  skip.addEventListener('click', () => close());
  $('.ob-x', ob).addEventListener('click', () => close());
  $('.ob-voice', ob).addEventListener('click', () => voice.toggle(Math.min(step, LINES.length - 1)));
  // the two ways out: the call (landing-nh3.js scrolls there under its veil) and the audit case study (a page of its own)
  $('.ob-book', ob).addEventListener('click', () => close(true));
  $$('.ob-open').forEach(b => b.addEventListener('click', () => openIt(b)));
  if (/[#&?]leak\b/.test(location.hash + location.search)) setTimeout(() => openIt(), 400);   // nothuman…/#leak opens it
  return { open: openIt, close };
})();

/* ================================================================ the opening block: it rises and fades as the scroll starts */
(() => {
  const intro = $('.intro'); if (!intro) return;
  let raf = 0;
  const upd = () => {
    raf = 0;
    const k = Math.min(1, Math.max(0, scrollY / (innerHeight * .16)));      // gone by about a sixth of a screen, before Not / Human
    intro.style.setProperty('--io', String(1 - k)); window.NH_INTRO = 1 - k;   // landing-nh9.js dims the sphere while the title is up
    intro.style.setProperty('--iy', (reduced ? 0 : k * 48).toFixed(1) + 'px');
    intro.style.visibility = k >= 1 ? 'hidden' : '';
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  addEventListener('resize', upd); upd();
})();

/* ================================================================ the audit box: fine lines that draw along its dot grid (owner, 2026-10-18) */
(() => {
  const side = $('.cs-audit__side'); if (!side) return;
  const NS = 'http://www.w3.org/2000/svg', P = 46, O = 23;   // the grid of html.v10 body .cs-audit__side in cases-home.css
  const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  let svg = null;
  function build() {
    svg?.remove();
    const w = side.clientWidth, h = side.clientHeight; if (!w || !h) return;
    const cols = Math.floor((w - O) / P), rows = Math.floor((h - O) / P);
    svg = el('svg', { class: 'bg-lines', viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' });
    let seed = 11; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    for (let k = 0; k < 10; k++) {
      let x = Math.floor(rnd() * (cols + 1)), y = Math.floor(rnd() * (rows + 1)), dir = rnd() < .5 ? 0 : 1; const pts = [[x, y]];
      for (let s = 0, n = 3 + Math.floor(rnd() * 4); s < n; s++) {
        const len = 1 + Math.floor(rnd() * 3), sg = rnd() < .5 ? -1 : 1;
        if (dir === 0) x = Math.max(0, Math.min(cols, x + sg * len)); else y = Math.max(0, Math.min(rows, y + sg * len));
        pts.push([x, y]); dir = 1 - dir;
      }
      const d = 'M' + pts.map(([a, b]) => `${O + a * P} ${O + b * P}`).join(' L'), t = (7 + rnd() * 5).toFixed(1), dl = (k * .85).toFixed(2);
      const st = `--t:${t}s;--d:${dl}s`;
      svg.append(el('path', { d, pathLength: 1, style: st }));
      const [a0, b0] = pts[0], [a1, b1] = pts[pts.length - 1];
      svg.append(el('circle', { class: 'n', cx: O + a0 * P, cy: O + b0 * P, r: 2.6, style: st }), el('circle', { class: 'n', cx: O + a1 * P, cy: O + b1 * P, r: 2.6, style: st }));
      if (!reduced) {
        const r = el('circle', { class: 'r', r: 1.8 });
        r.append(el('animateMotion', { dur: `${t}s`, begin: `${dl}s`, repeatCount: 'indefinite', keyPoints: '0;1;1', keyTimes: '0;.45;1', calcMode: 'linear', path: d }),
          el('animate', { attributeName: 'opacity', values: '0;1;1;0;0', keyTimes: '0;.05;.42;.5;1', dur: `${t}s`, begin: `${dl}s`, repeatCount: 'indefinite' }));
        svg.append(r);
      }
    }
    side.prepend(svg);
  }
  build(); let tm = 0; addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(build, 200); });
})();

/* ================================================================ the booking card */
(() => {
  const card = $('.book-card'); if (!card) return;
  const cfg = Object.assign({ calendly: '', email: '', tz: 'America/Argentina/Buenos_Aires', hours: [10, 11, 12, 14, 15, 16] }, window.NH_BOOK || {});
  const days = $('.bk-days', card), slots = $('.bk-slots', card), form = $('.bk-form', card), pick = $('[data-bk="pick"]', card), done = $('.bk-done', card);
  const err = $('.bk-err', card), when = $('.bk-when', card);
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  $('.bk-tz span', card).textContent = 'your time' + (here ? ` (${here.split('/').pop().replace(/_/g, ' ')})` : '');

  // a wall-clock hour in our time zone, as a real instant (works across daylight-saving changes)
  const parts = (d, tz) => Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(d).filter(p => p.type !== 'literal').map(p => [p.type, +p.value]));
  const zoned = (y, m, d, h) => { const g = new Date(Date.UTC(y, m - 1, d, h)); const p = parts(g, cfg.tz); const off = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - g.getTime(); return new Date(g.getTime() - off); };

  const today = parts(new Date(), cfg.tz), list = [];
  for (let i = 1; list.length < 20 && i < 40; i++) {                  // four weeks of weekdays (owner: two more rows)
    const c = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
    const wd = c.getUTCDay(); if (wd === 0 || wd === 6) continue;
    list.push({ y: c.getUTCFullYear(), m: c.getUTCMonth() + 1, d: c.getUTCDate(), date: c });
  }
  let day = null, slot = null;
  const fmtDay = d => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

  list.forEach((o, i) => {
    const b = document.createElement('button'); b.type = 'button';
    b.innerHTML = `<b>${o.date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</b><span>${o.d}</span>`;
    b.setAttribute('aria-label', fmtDay(o.date)); b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => choose(i));
    days.append(b);
  });
  function choose(i) {
    day = list[i];
    $$('button', days).forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    slots.innerHTML = '';
    cfg.hours.forEach(h => {
      const t = zoned(day.y, day.m, day.d, h);
      const b = document.createElement('button'); b.type = 'button';
      const local = t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const otherDay = t.toLocaleDateString([], { day: 'numeric' }) !== String(day.d) ? ` (${t.toLocaleDateString([], { weekday: 'short' })})` : '';
      b.textContent = local + otherDay;
      b.addEventListener('click', () => { slot = t; details(); });
      slots.append(b);
    });
  }
  choose(0);

  const whenText = () => `${slot.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })} \u00b7 ${slot.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} your time \u00b7 30 min`;
  function details() {
    pick.hidden = true; form.hidden = false; done.hidden = true; err.textContent = '';
    when.textContent = whenText();
    if (window.NH_LEAK && !form.notes.value) form.notes.value = window.NH_LEAK.note;
    if (finePointer) form.name.focus();
  }
  document.addEventListener('nh:leak', e => { if (!form.hidden && !form.notes.value) form.notes.value = e.detail.note; });
  $('.bk-back', card).addEventListener('click', () => { form.hidden = true; pick.hidden = false; });
  $('.bk-again', card).addEventListener('click', () => { done.hidden = true; pick.hidden = false; });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim(), email = form.email.value.trim();
    if (!name) { err.textContent = 'Add your name.'; form.name.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'That email doesn\u2019t look right.'; form.email.focus(); return; }
    const notes = form.notes.value.trim(), company = form.company.value.trim();
    const ymd = `${slot.getFullYear()}-${String(slot.getMonth() + 1).padStart(2, '0')}-${String(slot.getDate()).padStart(2, '0')}`;
    let msg;
    if (cfg.calendly) {
      const u = new URL(cfg.calendly);
      u.searchParams.set('month', ymd.slice(0, 7)); u.searchParams.set('date', ymd);
      u.searchParams.set('name', name); u.searchParams.set('email', email);
      u.searchParams.set('a1', [company && `Company: ${company}`, `Asked for: ${whenText()}`, notes].filter(Boolean).join('\n'));
      window.open(u.toString(), '_blank', 'noopener');
      msg = 'Calendly opened in a new tab on that day, with your details filled in. Confirm the time there and the invite comes by email.';
    } else {
      const body = [`Name: ${name}`, `Email: ${email}`, company && `Company: ${company}`, `Time: ${whenText()} (${here})`, `Our time: ${slot.toLocaleString('en-GB', { timeZone: cfg.tz })} (${cfg.tz})`, notes && `\n${notes}`].filter(Boolean).join('\n');
      location.href = `mailto:${cfg.email}?subject=${encodeURIComponent('Leak call: ' + whenText())}&body=${encodeURIComponent(body)}`;
      msg = `Your email app should open with the request ready to send. If nothing opened, write to ${cfg.email} with the time you picked.`;
    }
    $('.bk-done-t', card).textContent = msg;
    form.hidden = true; done.hidden = false;
  });
})();
