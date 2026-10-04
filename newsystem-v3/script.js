(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const icon = (id, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"><use href="#${id}"/></svg>`;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- δεδομένα κατηγοριών (μία πηγή για μενού, tiles, αναζήτηση) ---------- */
  const CATS = [
    { id: 'koukles', name: 'Κούκλες βιτρίνας', short: 'Κούκλες', icon: 'i-mannequin', tone: '#e9eef4', subs: ['Γυναικείες', 'Ανδρικές', 'Παιδικές', 'Μπούστα', 'Περούκες'], r: '-3deg' },
    { id: 'kremastres', name: 'Κρεμάστρες', short: 'Κρεμάστρες', icon: 'i-hanger', tone: '#f3ece3', subs: ['Ξύλινες', 'Πλαστικές', 'Αντικλεπτικές'], r: '2deg' },
    { id: 'rafieres', name: 'Ραφιέρες & Modular', short: 'Ραφιέρες', icon: 'i-shelf', tone: '#e7f0ee', subs: ['Chrome Grid', 'Ορθοστάτες', 'Βραχίονες', 'Ράφια'], r: '-2deg' },
    { id: 'slatwall', name: 'Slatwall & Γόνδολες', short: 'Slatwall', icon: 'i-slat', tone: '#efeae6', subs: ['Πάνελ slatwall', 'Γόνδολες', 'Εξαρτήματα'], r: '3deg' },
    { id: 'stant', name: 'Σταντ & Gridwall', short: 'Σταντ', icon: 'i-rail', tone: '#eceaf3', subs: ['Καλόγεροι', 'Σίτες gridwall', 'Σταντ προβολής'], r: '-3deg' },
    { id: 'kathreptes', name: 'Καθρέπτες', short: 'Καθρέπτες', icon: 'i-mirror', tone: '#eef1f2', subs: ['Επιδαπέδιοι', 'Επιτοίχιοι', 'Δοκιμαστηρίων'], r: '2deg' },
    { id: 'plexiglass', name: 'Plexiglass', short: 'Plexiglass', icon: 'i-plexi', tone: '#e6eff5', subs: ['Θήκες τιμών', 'Σταντ εντύπων', 'Βάσεις προβολής'], r: '-2deg' },
    { id: 'axesouar', name: 'Αξεσουάρ & Ασφάλεια', short: 'Αξεσουάρ', icon: 'i-shield', tone: '#f2ede4', subs: ['Αντικλεπτικά', 'Ετικέτες', 'Γάντζοι'], r: '3deg' },
    { id: 'kataskeves', name: 'Ειδικές κατασκευές', short: 'Ειδικές κατασκευές', icon: 'i-cube', tone: '#16202e', dark: true, href: '#kataskeves', subs: ['Ξύλο & μελαμίνη', 'Λάκα ματ / γυαλιστερή', 'Σίδηρος & inox', 'Κρύσταλλο & αλουμίνιο'], r: '-2deg' }
  ];
  const catById = Object.fromEntries(CATS.map((c) => [c.id, c]));
  const plural = (n) => `${n} υποκατηγορίες`;

  /* ---------- περιστροφή ανακοινώσεων ---------- */
  const msgs = $$('.announce__msg');
  if (msgs.length > 1 && !reduceMotion) {
    let m = 0;
    setInterval(() => {
      if (document.hidden) return;
      msgs[m].classList.remove('is-active');
      m = (m + 1) % msgs.length;
      msgs[m].classList.add('is-active');
    }, 5000);
  }

  /* ---------- body scroll lock + drawers ---------- */
  let lastFocus = null;
  const openDrawer = (el) => {
    lastFocus = document.activeElement;
    closeMega();
    el.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => el.classList.add('is-open'));
    $$(`[aria-controls="${el.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'true'));
    setTimeout(() => $('[data-close]', el).focus(), 50);
  };
  const closeDrawer = (el) => {
    if (el.hidden) return;
    el.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    $$(`[aria-controls="${el.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
    setTimeout(() => { el.hidden = true; }, reduceMotion ? 0 : 300);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  const drawers = $$('.drawer');
  drawers.forEach((d) => {
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]') || e.target.closest('a[href^="#"]')) closeDrawer(d);
    });
    // κράτα το focus μέσα στο drawer
    d.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = $$('a[href], button:not([disabled]), input', d).filter((x) => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  });
  $$('[aria-controls="drawer"]').forEach((b) => b.addEventListener('click', () => openDrawer($('#drawer'))));
  $$('[aria-controls="quote"]').forEach((b) => b.addEventListener('click', () => openDrawer($('#quote'))));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    drawers.forEach(closeDrawer);
    closeMega();
    closeSearch();
  });

  /* ---------- μενού κατηγοριών (desktop) με mega menu ---------- */
  const catnav = $('.catnav__list');
  CATS.forEach((c, i) => {
    const li = document.createElement('li');
    li.className = 'catnav__item';
    li.innerHTML = `
      <button type="button" aria-expanded="false" aria-controls="mega-${c.id}">${esc(c.short)}${icon('i-chevron')}</button>
      <div class="mega" id="mega-${c.id}">
        <div class="wrap mega__inner">
          <div><h3>${esc(c.name)}</h3><ul class="mega__links">
            ${c.subs.map((s) => `<li><a href="${c.href || '#'}">${esc(s)}${icon('i-arrow')}</a></li>`).join('')}
            <li><a href="${c.href || '#'}"><b>Όλα: ${esc(c.name)}</b>${icon('i-arrow')}</a></li>
          </ul></div>
          <div class="mega__about"><h3>Για επαγγελματίες</h3>
            <p>Με λογαριασμό B2B βλέπετε τον τιμοκατάλογο χονδρικής για όλη την κατηγορία και τιμολογείστε στην επιχείρησή σας.</p>
            <a class="btn btn--accent" href="#b2b">Είσοδος B2B ${icon('i-arrow')}</a>
          </div>
          <a class="mega__card" href="#" data-goto="${i}" style="--tone:${c.dark ? '#e9eef4' : c.tone}">${icon(c.icon)}<span class="sticker" style="transform:rotate(${c.r})">${esc(c.name)}</span></a>
        </div>
      </div>`;
    catnav.appendChild(li);
  });
  const b2bItem = document.createElement('li');
  b2bItem.className = 'catnav__item catnav__item--b2b';
  b2bItem.innerHTML = '<a href="#b2b">B2B Χονδρική</a>';
  catnav.appendChild(b2bItem);

  const navItems = $$('.catnav__item', catnav).filter((li) => li.querySelector('.mega'));
  let megaTimer = 0;
  function openMega(li) {
    navItems.forEach((x) => { const on = x === li; x.classList.toggle('is-open', on); x.firstElementChild.setAttribute('aria-expanded', String(on)); });
  }
  function closeMega() { openMega(null); }
  navItems.forEach((li) => {
    const btn = li.firstElementChild;
    btn.addEventListener('click', () => (li.classList.contains('is-open') ? closeMega() : openMega(li)));
    li.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(megaTimer); megaTimer = setTimeout(() => openMega(li), 120); });
    li.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(megaTimer); megaTimer = setTimeout(closeMega, 180); });
    li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) li.classList.contains('is-open') && closeMega(); });
    li.addEventListener('click', (e) => { if (e.target.closest('.mega a')) closeMega(); });
  });

  /* ---------- drawer κατηγοριών (κινητό) ---------- */
  const drawerList = $('.drawer__list');
  CATS.forEach((c) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button type="button" aria-expanded="false" aria-controls="dsub-${c.id}">${icon(c.icon)}<span>${esc(c.name)}</span>${icon('i-chevron')}</button>
      <div class="drawer__sub" id="dsub-${c.id}" hidden>
        ${c.subs.map((s) => `<a href="${c.href || '#'}">${esc(s)}</a>`).join('')}
        <a class="is-all" href="${c.href || '#'}">Όλη η κατηγορία</a>
      </div>`;
    const b = li.firstElementChild, sub = b.nextElementSibling;
    b.addEventListener('click', () => { const open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(open)); sub.hidden = !open; });
    drawerList.appendChild(li);
  });

  /* ---------- tiles κατηγοριών (stickers) + footer ---------- */
  $('.tiles').innerHTML = CATS.map((c) => `
    <li><a class="tile${c.dark ? ' tile--dark' : ''}" href="${c.href || '#'}" style="--tone:${c.tone};--r:${c.r}">
      ${icon(c.icon)}
      <span class="sticker">${esc(c.name)}<small>${plural(c.subs.length)}</small></span>
    </a></li>`).join('');
  $('.footer__cats').innerHTML = CATS.map((c) => `<li><a href="${c.href || '#'}">${esc(c.short)}</a></li>`).join('');

  /* ---------- carousel κατηγοριών ---------- */
  const carousel = $('.carousel');
  const viewport = $('.carousel__viewport', carousel);
  const track = $('.carousel__track', carousel);
  const slides = Array.from(track.children);
  const prevBtn = $('.arrow--prev', carousel);
  const nextBtn = $('.arrow--next', carousel);
  const dotsEl = $('.carousel__dots', carousel);
  const playBtn = $('.carousel__play', carousel);
  const liveEl = $('.carousel__live', carousel);
  const total = slides.length;
  const pad = (n) => String(n).padStart(2, '0');
  const AUTOPLAY_MS = 6500;
  const info = slides.map((s) => catById[s.dataset.id]);
  let index = 0;

  slides.forEach((s, i) => {
    s.id = `slide-${info[i].id}`;
    s.setAttribute('role', 'tabpanel');
    s.setAttribute('aria-roledescription', 'slide');
    s.setAttribute('aria-label', `${i + 1} από ${total}: ${info[i].name}`);
    $('.slide__num', s).textContent = `${pad(i + 1)} / ${pad(total)}`;
  });
  const dots = info.map((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', slides[i].id);
    b.setAttribute('aria-label', d.name);
    b.title = d.name;
    b.addEventListener('click', () => { stopAutoplay(); go(i); });
    dotsEl.appendChild(b);
    return b;
  });
  const paintArrow = (btn, d, label) => {
    $('.arrow__name', btn).textContent = d.name;
    $('.arrow__peek > svg use', btn).setAttribute('href', `#${d.icon}`);
    btn.setAttribute('aria-label', `${label} κατηγορία: ${d.name}`);
  };

  function go(i, announce = true) {
    index = (i + total) % total;
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((s, n) => {
      const on = n === index;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
      s.inert = !on;
    });
    dots.forEach((d, n) => { d.setAttribute('aria-selected', String(n === index)); d.tabIndex = n === index ? 0 : -1; });
    paintArrow(prevBtn, info[(index - 1 + total) % total], 'Προηγούμενη');
    paintArrow(nextBtn, info[(index + 1) % total], 'Επόμενη');
    if (announce) liveEl.textContent = `Κατηγορία ${index + 1} από ${total}: ${info[index].name}`;
    restart();
  }
  prevBtn.addEventListener('click', () => { stopAutoplay(); go(index - 1); });
  nextBtn.addEventListener('click', () => { stopAutoplay(); go(index + 1); });

  // πλήκτρα ← → όταν το carousel φαίνεται (όχι μέσα σε πεδία φόρμας)
  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.4 }).observe(viewport);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest('input, textarea, select, .drawer, .rail')) return;
    if (!visible && !carousel.contains(e.target)) return;
    e.preventDefault();
    stopAutoplay();
    go(index + (e.key === 'ArrowRight' ? 1 : -1));
    if (dotsEl.contains(e.target)) dots[index].focus();
  });

  // autoplay: παύει σε hover/focus, σταματά με κάθε αλληλεπίδραση, ανενεργό με reduced motion
  let timer = 0, paused = false, stopped = reduceMotion;
  function restart() { clearTimeout(timer); if (!stopped && !paused) timer = setTimeout(() => go(index + 1, false), AUTOPLAY_MS); }
  const paintPlay = () => {
    $('use', playBtn).setAttribute('href', stopped ? '#i-play' : '#i-pause');
    playBtn.setAttribute('aria-label', stopped ? 'Έναρξη αυτόματης εναλλαγής' : 'Παύση αυτόματης εναλλαγής');
  };
  function stopAutoplay() { if (stopped) return; stopped = true; clearTimeout(timer); paintPlay(); }
  playBtn.addEventListener('click', () => { stopped = !stopped; paused = false; paintPlay(); restart(); });
  const pause = () => { paused = true; clearTimeout(timer); };
  const resume = () => { if (!paused) return; paused = false; restart(); };
  carousel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(); });
  carousel.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') resume(); });
  carousel.addEventListener('focusin', (e) => { if (e.target !== playBtn) pause(); });
  carousel.addEventListener('focusout', (e) => { if (!carousel.contains(e.relatedTarget)) resume(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));

  // swipe
  let x0 = null, y0 = 0, dx = 0, lock = null;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('a, button')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; lock = null;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (lock === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
      lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (lock === 'x') { viewport.setPointerCapture(e.pointerId); track.classList.add('is-dragging'); stopAutoplay(); }
    }
    if (lock !== 'x') return;
    dx = mx;
    track.style.transform = `translateX(calc(${-index * 100}% + ${dx}px))`;
  });
  const endDrag = () => {
    if (x0 === null) return;
    const wasX = lock === 'x';
    x0 = null; lock = null;
    track.classList.remove('is-dragging');
    if (!wasX) return;
    const t = Math.min(80, viewport.clientWidth * 0.18);
    go(dx < -t ? index + 1 : dx > t ? index - 1 : index, Math.abs(dx) > t);
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // links που οδηγούν σε συγκεκριμένο slide (mega menu, αναζήτηση)
  const showCategory = (i) => {
    stopAutoplay();
    go(i);
    $('.hero').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goto]');
    if (!a) return;
    e.preventDefault();
    closeMega();
    showCategory(Number(a.dataset.goto));
  });

  paintPlay();
  go(0, false);

  /* ---------- αναζήτηση με προτάσεις ---------- */
  const fold = (s) => Array.from(s).map((ch) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().charAt(0) || ch).join('');
  const INDEX = CATS.flatMap((c, i) => [
    { label: c.name, sub: plural(c.subs.length), icon: c.icon, slide: i },
    ...c.subs.map((s) => ({ label: s, sub: c.name, icon: c.icon, slide: i }))
  ]).map((x) => ({ ...x, key: fold(x.label) }));
  const qInput = $('#q');
  const results = $('#search-results');
  let hits = [], sel = -1;
  const mark = (label, at, len) => at < 0 ? esc(label) : `${esc(label.slice(0, at))}<mark>${esc(label.slice(at, at + len))}</mark>${esc(label.slice(at + len))}`;
  function renderSearch() {
    const q = fold(qInput.value.trim());
    if (!q) { closeSearch(); return; }
    hits = INDEX.map((x) => ({ ...x, at: x.key.indexOf(q) })).filter((x) => x.at >= 0).sort((a, b) => a.at - b.at).slice(0, 8);
    sel = -1;
    results.innerHTML = hits.length
      ? hits.map((h, n) => `<li><a href="#" id="sr-${n}" role="option" aria-selected="false" data-n="${n}">${icon(h.icon)}<span><b>${mark(h.label, h.at, q.length)}</b><small>${esc(h.sub)}</small></span></a></li>`).join('')
      : `<li class="is-empty">Δεν βρέθηκε «${esc(qInput.value.trim())}». Δοκιμάστε π.χ. «κρεμάστρες» ή καλέστε μας στο 2310 541 741.</li>`;
    results.hidden = false;
    qInput.setAttribute('aria-expanded', 'true');
  }
  function closeSearch() { results.hidden = true; qInput.setAttribute('aria-expanded', 'false'); qInput.removeAttribute('aria-activedescendant'); }
  const pick = (n) => { const h = hits[n]; if (!h) return; closeSearch(); qInput.blur(); showCategory(h.slide); };
  qInput.addEventListener('input', renderSearch);
  qInput.addEventListener('focus', () => { if (qInput.value.trim()) renderSearch(); });
  qInput.addEventListener('keydown', (e) => {
    if (results.hidden || !hits.length) { if (e.key === 'Enter') e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length;
      $$('a', results).forEach((a, n) => a.setAttribute('aria-selected', String(n === sel)));
      qInput.setAttribute('aria-activedescendant', `sr-${sel}`);
    } else if (e.key === 'Enter') { e.preventDefault(); pick(sel < 0 ? 0 : sel); }
  });
  results.addEventListener('click', (e) => { const a = e.target.closest('a[data-n]'); if (a) { e.preventDefault(); pick(Number(a.dataset.n)); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) closeSearch(); });

  /* ---------- δημοφιλή + λίστα προσφοράς ---------- */
  const PRODUCTS = [
    ['Μπούστα', 'koukles'], ['Περούκες', 'koukles'], ['Ξύλινες κρεμάστρες', 'kremastres'], ['Αντικλεπτικές κρεμάστρες', 'kremastres'],
    ['Chrome Grid', 'rafieres'], ['Πάνελ slatwall', 'slatwall'], ['Καλόγεροι ρούχων', 'stant'], ['Καθρέπτες δοκιμαστηρίων', 'kathreptes'],
    ['Θήκες τιμών', 'plexiglass'], ['Αντικλεπτικά συστήματα', 'axesouar']
  ].map(([name, cat]) => ({ name, cat: catById[cat] }));

  const store = {
    get() { try { return JSON.parse(localStorage.getItem('ns-quote') || '[]'); } catch (e) { return []; } },
    set(v) { try { localStorage.setItem('ns-quote', JSON.stringify(v)); } catch (e) { /* χωρίς storage: μένει στη μνήμη */ } }
  };
  let quote = store.get().filter((n) => PRODUCTS.some((p) => p.name === n));

  const rail = $('.rail');
  rail.innerHTML = PRODUCTS.map((p, n) => `
    <li class="card">
      <a class="card__media" href="#" style="--tone:${p.cat.dark ? '#e9eef4' : p.cat.tone}" tabindex="-1" aria-hidden="true">${icon(p.cat.icon)}${n < 4 ? '<span class="sticker">Δημοφιλές</span>' : ''}</a>
      <div class="card__body">
        <span class="card__cat">${esc(p.cat.short)}</span>
        <a class="card__name" href="#">${esc(p.name)}</a>
        <p class="card__price">Τιμή: <a href="#b2b">με λογαριασμό B2B</a></p>
        <div class="card__add"><button class="btn" type="button" data-add="${esc(p.name)}"></button></div>
      </div>
    </li>`).join('');

  const badges = $$('.hact__badge');
  const qList = $('.quote__list');
  const qEmpty = $('.quote__empty');
  const qSend = $('.quote__send');
  function paintQuote(bump) {
    store.set(quote);
    badges.forEach((b) => {
      b.textContent = quote.length;
      b.classList.toggle('is-on', quote.length > 0);
      if (bump && !reduceMotion) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }
    });
    $$('.quote-count').forEach((x) => { x.textContent = quote.length; });
    $$('[data-add]').forEach((b) => {
      const added = quote.includes(b.dataset.add);
      b.classList.toggle('is-added', added);
      b.innerHTML = added ? `${icon('i-ok')} Στη λίστα` : `${icon('i-plus')} Στη λίστα προσφοράς`;
      b.setAttribute('aria-pressed', String(added));
    });
    qEmpty.hidden = quote.length > 0;
    qSend.disabled = quote.length === 0;
    qList.innerHTML = quote.map((name) => {
      const p = PRODUCTS.find((x) => x.name === name);
      return `<li>${icon(p.cat.icon)}<div><b>${esc(name)}</b><small>${esc(p.cat.name)}</small></div><button class="icon-btn" type="button" data-remove="${esc(name)}" aria-label="Αφαίρεση: ${esc(name)}">${icon('i-close')}</button></li>`;
    }).join('');
    $('.hact--quote').setAttribute('aria-label', `Λίστα προσφοράς (${quote.length})`);
    $('.dock__quote').setAttribute('aria-label', `Λίστα προσφοράς (${quote.length})`);
  }
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const n = add.dataset.add;
      quote = quote.includes(n) ? quote.filter((x) => x !== n) : [...quote, n];
      paintQuote(true);
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      quote = quote.filter((x) => x !== rm.dataset.remove);
      paintQuote(false);
      (($('[data-remove]', qList)) || $('[data-close]', $('#quote'))).focus();
    }
  });
  qSend.addEventListener('click', () => {
    const body = ['Καλησπέρα σας,', '', 'Θα ήθελα προσφορά για τα παρακάτω:', ...quote.map((n) => `- ${n}`), '', 'Επωνυμία / ΑΦΜ:', 'Τηλέφωνο:'].join('\n');
    window.location.href = `mailto:info@newsystem.gr?subject=${encodeURIComponent('Αίτημα προσφοράς')}&body=${encodeURIComponent(body)}`;
  });
  paintQuote(false);

  // βελάκια του rail
  const railBtns = $$('[data-rail]');
  const paintRail = () => {
    const max = rail.scrollWidth - rail.clientWidth - 2;
    railBtns[0].disabled = rail.scrollLeft <= 2;
    railBtns[1].disabled = rail.scrollLeft >= max;
  };
  railBtns.forEach((b) => b.addEventListener('click', () => {
    const card = $('.card', rail);
    const step = (card.offsetWidth + 14) * (window.innerWidth >= 900 ? 2 : 1);
    rail.scrollBy({ left: step * Number(b.dataset.rail), behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  rail.addEventListener('scroll', paintRail, { passive: true });
  window.addEventListener('resize', paintRail);
  paintRail();

  /* ---------- φόρμα B2B ---------- */
  const form = $('#b2bForm');
  const note = $('.b2b__note', form);
  const vat = form.elements.vat;
  vat.addEventListener('input', () => { vat.value = vat.value.replace(/\D/g, '').slice(0, 9); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let bad = null;
    $$('input', form).forEach((input) => {
      input.value = input.value.trim();
      const ok = input.value !== '' && input.checkValidity();
      input.classList.toggle('is-invalid', !ok);
      if (ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
      if (!ok && !bad) bad = input;
    });
    if (bad) {
      note.className = 'b2b__note is-error';
      note.textContent = bad.name === 'vat' ? 'Το ΑΦΜ πρέπει να έχει ακριβώς 9 ψηφία.'
        : bad.name === 'email' && bad.value ? 'Ελέγξτε τη διεύθυνση email.' : 'Συμπληρώστε τα υποχρεωτικά πεδία (*).';
      bad.focus();
      return;
    }
    const d = new FormData(form);
    const body = [`Επωνυμία: ${d.get('company')}`, `ΑΦΜ: ${d.get('vat')}`, `Email: ${d.get('email')}`, `Τηλέφωνο: ${d.get('phone')}`, `Τύπος επιχείρησης: ${d.get('type')}`].join('\n');
    window.location.href = `mailto:info@newsystem.gr?subject=${encodeURIComponent('Αίτηση λογαριασμού B2B')}&body=${encodeURIComponent(body)}`;
    note.className = 'b2b__note is-ok';
    note.textContent = 'Ανοίξαμε το email σας με έτοιμη την αίτηση. Πατήστε «Αποστολή» για να ολοκληρωθεί.';
  });
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.classList.contains('is-invalid') && el.value.trim() && el.checkValidity()) { el.classList.remove('is-invalid'); el.removeAttribute('aria-invalid'); }
  });

  $('#year').textContent = new Date().getFullYear();
})();
