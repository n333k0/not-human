/* v10 home extras (2026-10-18): the 3D turn with a sheen on the case and pricing cards, and the audit report mock-up that pages
   through the report on its own. Static without JS: the cards sit flat, the mock-up shows the cover. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // the turn: a few degrees toward the pointer, a soft sheen where it is, settling back on leave
  const cards = document.querySelectorAll('.cs3, .pr-card');
  cards.forEach((c) => c.setAttribute('data-turn', ''));
  if (fine && !reduce) cards.forEach((c) => {
    const max = c.classList.contains('pr-card') ? 5 : 3.5;
    c.addEventListener('pointerenter', () => c.classList.add('turning'));   // the transition only once the site's rise has finished with the card
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, w = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', ((u - .5) * max * 2).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - w) * max * 1.4).toFixed(2) + 'deg');
      c.style.setProperty('--gx', (u * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (w * 100).toFixed(1) + '%'); c.classList.add('hot');
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); c.classList.remove('hot'); });
  });

  // the site's rise (landing-nh3.js) leaves .rv elements with will-change: transform, clip-path; on these cards, which hold their own
  // animated window, Chrome then stops repainting the layer. Once the rise has cleared its inline styles, drop the hint.
  const settle = (el) => new MutationObserver((ms, mo) => { if (!el.style.clipPath && !el.style.transform) { el.style.willChange = 'auto'; mo.disconnect(); } }).observe(el, { attributes: true, attributeFilter: ['style'] });
  document.querySelectorAll('.cs3, .pr-card, .cs-audit').forEach(settle);

  // the windows (the audit report, each case): page through on their own, one page every few seconds, only while on screen
  document.querySelectorAll('.rep').forEach((rep, n) => {
    // the dots and the page title float under the window now (owner, 2026-10-18), so look for them around it, not inside
    const root = rep.closest('.cs-audit__side') || rep;
    const strip = rep.querySelector('.rep__strip'), imgs = [...strip.querySelectorAll('img')], dots = [...root.querySelectorAll('.rep__pg i')], title = root.querySelector('.rep__t');
    strip.style.setProperty('--n', imgs.length);
    let i = 0, on = false, timer = 0;
    const go = (k) => { i = (k + imgs.length) % imgs.length; strip.style.setProperty('--i', i); dots.forEach((d, j) => d.classList.toggle('on', j === i)); if (title) title.textContent = imgs[i].alt; };
    const loop = () => { clearTimeout(timer); if (on && !reduce) timer = setTimeout(() => { go(i + 1); loop(); }, (i === 0 ? 3200 : 2600) + n * 350); };
    go(0);
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { on = es[0].isIntersecting; if (on) imgs.forEach((im) => { im.loading = 'eager'; }); loop(); }, { threshold: .25 }).observe(rep);
    dots.forEach((d, j) => {
      d.addEventListener('mouseenter', () => { go(j); loop(); });
      d.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); go(j); loop(); });   // a dot changes the page; it does not open the report
    });
  });
})();
