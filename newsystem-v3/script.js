(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- Λιανική / B2B ---------- */
  const modeBtns = document.querySelectorAll('.segmented__btn');
  const setMode = (mode) => {
    document.body.classList.toggle('is-b2c', mode === 'b2c');
    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    store.set('ns-mode', mode);
    document.dispatchEvent(new CustomEvent('ns:mode', { detail: mode }));
  };
  modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  setMode(store.get('ns-mode') === 'b2c' ? 'b2c' : 'b2b');

  /* ---------- HERO slider ---------- */
  const hero = document.querySelector('.hero');
  const viewport = hero.querySelector('.hero__viewport');
  const track = hero.querySelector('.hero__track');
  const slides = Array.from(track.children);
  const prevBtn = hero.querySelector('.arrow--prev');
  const nextBtn = hero.querySelector('.arrow--next');
  const tabsEl = hero.querySelector('.hero__tabs');
  const countEl = hero.querySelector('.hero__count');
  const barEl = hero.querySelector('.hero__progress b');
  const total = slides.length;
  const pad = (n) => String(n).padStart(2, '0');
  const AUTOPLAY_MS = 7000;
  let index = 0;

  const info = slides.map((s) => ({
    name: s.dataset.name,
    icon: s.dataset.icon,
    color: getComputedStyle(s).getPropertyValue('--c').trim(),
    dark: s.classList.contains('slide--dark')
  }));

  slides.forEach((s, i) => {
    s.id = s.id || `slide-${i + 1}`;
    s.setAttribute('role', 'tabpanel');
    s.setAttribute('aria-roledescription', 'slide');
    s.setAttribute('aria-label', `${i + 1} από ${total}: ${info[i].name}`);
    const num = s.querySelector('.slide__num');
    if (num) num.textContent = `${pad(i + 1)} / ${pad(total)}`;
  });

  const tabs = info.map((d, i) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'tab';
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', slides[i].id);
    t.style.setProperty('--tc', d.color);
    t.innerHTML = `<i class="${d.dark ? 'is-dark' : ''}"><svg aria-hidden="true"><use href="#${d.icon}"/></svg></i>${d.name}`;
    t.addEventListener('click', () => go(i));
    tabsEl.appendChild(t);
    return t;
  });

  const paintArrow = (btn, d) => {
    btn.querySelector('.arrow__name').textContent = d.name;
    const thumb = btn.querySelector('.arrow__thumb');
    thumb.style.setProperty('--tc', d.color);
    thumb.classList.toggle('is-dark', d.dark);
    thumb.querySelector('use').setAttribute('href', `#${d.icon}`);
  };

  function go(i) {
    index = (i + total) % total;
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((s, n) => {
      const active = n === index;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', String(!active));
      s.inert = !active;
    });
    tabs.forEach((t, n) => {
      const active = n === index;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });
    const prev = info[(index - 1 + total) % total];
    const next = info[(index + 1) % total];
    paintArrow(prevBtn, prev);
    paintArrow(nextBtn, next);
    prevBtn.setAttribute('aria-label', `Προηγούμενη κατηγορία: ${prev.name}`);
    nextBtn.setAttribute('aria-label', `Επόμενη κατηγορία: ${next.name}`);
    countEl.textContent = `${pad(index + 1)} / ${pad(total)}`;
    // κεντράρει το ενεργό tab χωρίς να μετακινεί τη σελίδα
    const t = tabs[index];
    tabsEl.scrollTo({ left: t.offsetLeft - (tabsEl.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    restart();
  }

  prevBtn.addEventListener('click', () => go(index - 1));
  nextBtn.addEventListener('click', () => go(index + 1));

  tabsEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index + (e.key === 'ArrowRight' ? 1 : -1));
      tabs[index].focus({ preventScroll: true });
    }
  });
  viewport.tabIndex = -1;
  hero.addEventListener('keydown', (e) => {
    if (e.target.closest('.hero__tabs, input, select')) return;
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  });

  /* autoplay με μπάρα προόδου — σταματά σε hover/focus/κρυφή καρτέλα */
  let start = 0, elapsed = 0, raf = 0, paused = false, stopped = reduceMotion;
  const tick = (now) => {
    if (!start) start = now - elapsed;
    elapsed = now - start;
    barEl.style.width = `${Math.min(elapsed / AUTOPLAY_MS, 1) * 100}%`;
    if (elapsed >= AUTOPLAY_MS) { go(index + 1); return; }
    raf = requestAnimationFrame(tick);
  };
  function restart() {
    cancelAnimationFrame(raf);
    start = 0; elapsed = 0;
    barEl.style.width = stopped ? `${((index + 1) / total) * 100}%` : '0%';
    if (!stopped && !paused) raf = requestAnimationFrame(tick);
  }
  const pause = () => { paused = true; cancelAnimationFrame(raf); start = 0; };
  const resume = () => { if (!paused) return; paused = false; if (!stopped) raf = requestAnimationFrame(tick); };
  hero.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(); });
  hero.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') resume(); });
  hero.addEventListener('focusin', pause);
  hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget)) resume(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));

  /* swipe σε κινητό / tablet */
  let x0 = null, y0 = 0, dx = 0, locked = null, ptype = '';
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('a, button, input, select')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; locked = null; ptype = e.pointerType;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (locked === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
      locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (locked === 'x') { viewport.setPointerCapture(e.pointerId); track.classList.add('is-dragging'); pause(); }
    }
    if (locked !== 'x') return;
    dx = mx;
    const edge = (index === 0 && dx > 0) || (index === total - 1 && dx < 0) ? 0.35 : 1;
    track.style.transform = `translateX(calc(${-index * 100}% + ${dx * edge}px))`;
  });
  const endDrag = () => {
    if (x0 === null) return;
    const wasX = locked === 'x';
    x0 = null; locked = null;
    track.classList.remove('is-dragging');
    if (!wasX) return;
    const threshold = Math.min(90, viewport.clientWidth * 0.18);
    if (ptype !== 'mouse') paused = false;
    if (dx < -threshold) go(index + 1);
    else if (dx > threshold) go(index - 1);
    else go(index);
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  go(0);

  /* ---------- stickers: "κολλάνε" καθώς εμφανίζονται ---------- */
  const stickerItems = document.querySelectorAll('.stickers li');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.filter((en) => en.isIntersecting).forEach((en, n) => {
        en.target.style.transitionDelay = `${n * 70}ms`;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    stickerItems.forEach((li) => io.observe(li));
  } else {
    stickerItems.forEach((li) => li.classList.add('is-in'));
  }

  /* ---------- φόρμα B2B ---------- */
  const form = document.getElementById('b2bForm');
  const note = form.querySelector('.b2b__form-note');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad = null;
    form.querySelectorAll('input').forEach((input) => {
      const ok = input.checkValidity() && input.value.trim() !== '';
      input.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstBad) firstBad = input;
    });
    if (firstBad) {
      note.classList.remove('is-ok');
      note.textContent = firstBad.name === 'vat' ? 'Το ΑΦΜ πρέπει να έχει 9 ψηφία.' : 'Συμπλήρωσε όλα τα πεδία.';
      firstBad.focus();
      return;
    }
    const d = new FormData(form);
    const body = [
      `Επωνυμία: ${d.get('company')}`,
      `ΑΦΜ: ${d.get('vat')}`,
      `Email: ${d.get('email')}`,
      `Τηλέφωνο: ${d.get('phone')}`,
      `Τύπος: ${d.get('type')}`
    ].join('\n');
    // Χωρίς backend: ανοίγει το email του χρήστη με έτοιμη την αίτηση.
    window.location.href = `mailto:info@newsystem.gr?subject=${encodeURIComponent('Αίτηση B2B λογαριασμού')}&body=${encodeURIComponent(body)}`;
    note.classList.add('is-ok');
    note.textContent = 'Ευχαριστούμε! Θα επικοινωνήσουμε μαζί σου εντός 24 ωρών.';
    form.reset();
  });
  form.addEventListener('input', (e) => {
    if (e.target.classList.contains('is-invalid') && e.target.checkValidity()) {
      e.target.classList.remove('is-invalid');
      e.target.removeAttribute('aria-invalid');
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

/* =========================================================
   v3 — shop: κατηγορίες, αναζήτηση, προϊόντα, καλάθι, αγαπημένα
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => n.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' });
  const isB2B = () => !document.body.classList.contains('is-b2c');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

  /* ---------- δεδομένα (ενδεικτικά για την παρουσίαση) ---------- */
  const CATS = [
    { id: 'koukles', short: 'Κούκλες', name: 'Κούκλες βιτρίνας', icon: 'i-mannequin', c: '#ffd23f', subs: ['Γυναικείες', 'Ανδρικές', 'Παιδικές', 'Μπούστα', 'Περούκες', 'Βάσεις'] },
    { id: 'kremastres', short: 'Κρεμάστρες', name: 'Κρεμάστρες', icon: 'i-hanger', c: '#ff6b4a', subs: ['Ξύλινες', 'Πλαστικές', 'Αντικλεπτικές', 'Παιδικές', 'Με λογότυπο'] },
    { id: 'rafieres', short: 'Ραφιέρες', name: 'Ραφιέρες & Modular', icon: 'i-shelf', c: '#4f7cff', dark: true, subs: ['Modular', 'Chrome Grid', 'Ορθοστάτες', 'Βραχίονες', 'Ράφια'] },
    { id: 'slatwall', short: 'Slatwall', name: 'Slatwall & Γόνδολες', icon: 'i-slat', c: '#2ec4a6', subs: ['Πάνελ slatwall', 'Γόνδολες', 'Γάντζοι', 'Ράφια slatwall'] },
    { id: 'stand', short: 'Σταντ', name: 'Σταντ & Gridwall', icon: 'i-rail', c: '#a78bfa', subs: ['Καλόγεροι ρούχων', 'Σταντ προβολής', 'Πάνελ gridwall', 'Τροχήλατα'] },
    { id: 'kathreptes', short: 'Καθρέπτες', name: 'Καθρέπτες', icon: 'i-mirror', c: '#ff8fc7', subs: ['Επιδαπέδιοι', 'Επιτοίχιοι', 'Δοκιμαστηρίων'] },
    { id: 'plexi', short: 'Plexiglass', name: 'Plexiglass', icon: 'i-plexi', c: '#5bd0f5', subs: ['Θήκες τιμών', 'Σταντ εντύπων', 'Βάσεις προβολής'] },
    { id: 'aksesouar', short: 'Αξεσουάρ', name: 'Αξεσουάρ & Ασφάλεια', icon: 'i-shield', c: '#ffa23a', subs: ['Αντικλεπτικά', 'Ετικέτες', 'Γάντζοι', 'Σακούλες'] }
  ];
  const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));

  const PRODUCTS = [
    { id: 'p1', cat: 'koukles', name: 'Κούκλα γυναικεία πολυεστερική, λευκή γυαλιστερή', pack: 'με βάση γυαλιού', retail: 189, b2b: 149, tags: ['top'] },
    { id: 'p2', cat: 'koukles', name: 'Μπούστο ανδρικό ραπτικής', pack: 'ύφασμα λινό, ρυθμιζόμενο ύψος', retail: 69, b2b: 52, tags: ['new'] },
    { id: 'p3', cat: 'kremastres', name: 'Κρεμάστρα ξύλινη φυσική με μπάρα', pack: 'συσκευασία 50 τεμ.', retail: 42, was: 49, b2b: 31, tags: ['top', 'offer'] },
    { id: 'p4', cat: 'kremastres', name: 'Κρεμάστρα πλαστική μαύρη 42 cm', pack: 'συσκευασία 100 τεμ.', retail: 28, b2b: 19, tags: ['top'] },
    { id: 'p5', cat: 'rafieres', name: 'Πάνελ Chrome Grid 60×150 cm', pack: 'χρωμέ', retail: 24, b2b: 18, tags: ['top'] },
    { id: 'p6', cat: 'rafieres', name: 'Ορθοστάτης modular χρωμέ 2 m', pack: 'με στηρίγματα τοίχου', retail: 16, b2b: 12, tags: ['new'], stock: 'order' },
    { id: 'p7', cat: 'slatwall', name: 'Πάνελ slatwall λευκό 120×120 cm', pack: 'MDF, 10 κανάλια', retail: 58, was: 66, b2b: 44, tags: ['offer', 'top'] },
    { id: 'p8', cat: 'slatwall', name: 'Γόνδολα διπλής όψης 125 cm', pack: 'με 4 ράφια ανά όψη', retail: 320, b2b: 255, tags: ['new'], stock: 'order' },
    { id: 'p9', cat: 'stand', name: 'Καλόγερος ρούχων τροχήλατος', pack: 'ρυθμιζόμενο ύψος, χρωμέ', retail: 79, was: 92, b2b: 59, tags: ['offer', 'top'] },
    { id: 'p10', cat: 'kathreptes', name: 'Καθρέπτης δαπέδου 40×170 cm', pack: 'μαύρο μεταλλικό πλαίσιο', retail: 119, b2b: 92, tags: ['new'] },
    { id: 'p11', cat: 'plexi', name: 'Θήκη τιμών plexiglass A6', pack: 'συσκευασία 10 τεμ.', retail: 22, was: 26, b2b: 15, tags: ['offer'] },
    { id: 'p12', cat: 'aksesouar', name: 'Αντικλεπτική ετικέτα RF', pack: 'συσκευασία 1000 τεμ.', retail: 65, b2b: 48, tags: ['top'] }
  ];
  const PROD = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

  /* ---------- βοηθητικά αναζήτησης (χωρίς τόνους) ---------- */
  const fold = (ch) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace('ς', 'σ').charAt(0) || ch;
  const norm = (str) => Array.from(str).map(fold).join('');
  const highlight = (text, q) => {
    if (!q) return esc(text);
    const i = norm(text).indexOf(norm(q));
    if (i < 0) return esc(text);
    const chars = Array.from(text);
    return esc(chars.slice(0, i).join('')) + '<mark>' + esc(chars.slice(i, i + Array.from(q).length).join('')) + '</mark>' + esc(chars.slice(i + Array.from(q).length).join(''));
  };
  const matches = (p, q) => !q || norm(`${p.name} ${p.pack} ${CAT[p.cat].name} ${CAT[p.cat].subs.join(' ')}`).includes(norm(q));

  /* ---------- τιμές ---------- */
  const priceOf = (p) => (isB2B() ? p.b2b : p.retail);
  const priceHTML = (p) => {
    let old = '', tag = '';
    if (isB2B()) {
      old = `<s class="price__old">${fmt(p.retail)}</s>`;
      tag = `<span class="price__tag">B2B −${Math.round((1 - p.b2b / p.retail) * 100)}%</span>`;
    } else if (p.was) {
      old = `<s class="price__old">${fmt(p.was)}</s>`;
      tag = `<span class="price__tag">−${Math.round((1 - p.retail / p.was) * 100)}%</span>`;
    }
    return `<div class="price"><span class="price__now">${fmt(priceOf(p))}</span>${old}${tag}<span class="price__vat">${isB2B() ? 'τιμή B2B · ' : ''}με ΦΠΑ</span></div>`;
  };

  /* ---------- κατάσταση ---------- */
  const state = { tab: 'top', q: '', cat: '', fav: false };
  const cart = new Map(Object.entries(store.get('ns3-cart', {})).filter(([id]) => PROD[id]));
  const favs = new Set(store.get('ns3-favs', []).filter((id) => PROD[id]));

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastT = 0;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  };
  const bump = (el) => { if (!el || reduceMotion) return; el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); };

  /* ---------- μπάρα κατηγοριών + mega menu ---------- */
  const catbar = $('#catbar');
  const mega = $('#mega');
  const megaInner = $('.mega__inner', mega);
  catbar.innerHTML = CATS.map((c) => `<li><button class="catbar__btn" type="button" data-cat="${c.id}" aria-expanded="false" aria-controls="mega"><i class="${c.dark ? 'is-dark' : ''}" style="--c:${c.c}">${icon(c.icon)}</i>${esc(c.short)}</button></li>`).join('');
  const catBtns = $$('.catbar__btn', catbar);
  let openCat = '';

  const renderMega = (c) => {
    megaInner.innerHTML = `
      <div class="mega__hero ${c.dark ? 'is-dark' : ''}" style="--c:${c.c}">
        <span class="sticker__icon">${icon(c.icon)}</span>
        <div><b>${esc(c.name)}</b><a href="#proionta" data-show-cat="${c.id}">Δες τα προϊόντα ${icon('i-arrow')}</a></div>
      </div>
      <div class="mega__subs" style="--c:${c.c}">${c.subs.map((s) => `<a href="#proionta" data-show-cat="${c.id}" data-q="${esc(s)}">${esc(s)}</a>`).join('')}</div>
      <div class="mega__promo"><b>Είσαι κατάστημα; <span>Τιμές B2B</span> σε όλη την κατηγορία.</b><p>Άνοιξε λογαριασμό με το ΑΦΜ σου.</p><a class="btn btn--yellow" href="#b2b">Αίτηση B2B ${icon('i-arrow')}</a></div>`;
  };
  const setMega = (id) => {
    openCat = id;
    catBtns.forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.cat === id)));
    if (id) { renderMega(CAT[id]); mega.hidden = false; } else { mega.hidden = true; }
  };
  catbar.addEventListener('click', (e) => {
    const b = e.target.closest('.catbar__btn');
    if (b) setMega(openCat === b.dataset.cat ? '' : b.dataset.cat);
  });
  // hover μόνο σε συσκευές με ποντίκι
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let hoverT = 0;
  catbar.addEventListener('mouseover', (e) => {
    const b = e.target.closest('.catbar__btn');
    if (!b || !finePointer.matches) return;
    clearTimeout(hoverT);
    hoverT = setTimeout(() => setMega(b.dataset.cat), openCat ? 60 : 180);
  });
  const navEl = $('.catbar');
  navEl.addEventListener('mouseleave', () => { if (!finePointer.matches) return; clearTimeout(hoverT); hoverT = setTimeout(() => setMega(''), 260); });
  navEl.addEventListener('mouseenter', () => clearTimeout(hoverT));
  document.addEventListener('click', (e) => { if (openCat && !e.target.closest('.catbar')) setMega(''); });

  /* ---------- αναζήτηση με προτάσεις ---------- */
  const form = $('#search');
  const q = $('#q');
  const qcat = $('#qcat');
  const sug = $('#suggest');
  qcat.insertAdjacentHTML('beforeend', CATS.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join(''));
  let sugItems = [];
  let sugIndex = -1;

  const closeSuggest = () => { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); sugIndex = -1; };
  const renderSuggest = () => {
    const term = q.value.trim();
    if (!term) { closeSuggest(); return; }
    const cats = CATS.filter((c) => (!qcat.value || c.id === qcat.value) && norm(`${c.name} ${c.subs.join(' ')}`).includes(norm(term))).slice(0, 3);
    const prods = PRODUCTS.filter((p) => (!qcat.value || p.cat === qcat.value) && matches(p, term)).slice(0, 5);
    sugItems = [...cats.map((c) => ({ type: 'cat', c })), ...prods.map((p) => ({ type: 'prod', p }))];
    let html = '';
    if (cats.length) html += '<li class="suggest__label" role="presentation">Κατηγορίες</li>' + cats.map((c, i) => `<li class="suggest__item" role="option" id="sg${i}" data-i="${i}" aria-selected="false"><span class="suggest__ic ${c.dark ? 'is-dark' : ''}" style="--c:${c.c}">${icon(c.icon)}</span><span class="suggest__txt"><b>${highlight(c.name, term)}</b><small>${c.subs.slice(0, 3).join(' · ')}</small></span></li>`).join('');
    if (prods.length) html += '<li class="suggest__label" role="presentation">Προϊόντα</li>' + prods.map((p, j) => { const i = cats.length + j; const c = CAT[p.cat]; return `<li class="suggest__item" role="option" id="sg${i}" data-i="${i}" aria-selected="false"><span class="suggest__ic ${c.dark ? 'is-dark' : ''}" style="--c:${c.c}">${icon(c.icon)}</span><span class="suggest__txt"><b>${highlight(p.name, term)}</b><small>${esc(c.name)} · ${esc(p.pack)}</small></span><span class="suggest__price">${fmt(priceOf(p))}</span></li>`; }).join('');
    if (!sugItems.length) html = `<li class="suggest__none">Δεν βρέθηκε κάτι για «${esc(term)}». Δοκίμασε «κρεμάστρα» ή «slatwall».</li>`;
    sug.innerHTML = html;
    sug.hidden = false;
    q.setAttribute('aria-expanded', 'true');
    sugIndex = -1;
  };
  const moveSuggest = (d) => {
    if (!sugItems.length) return;
    sugIndex = (sugIndex + d + sugItems.length) % sugItems.length;
    $$('.suggest__item', sug).forEach((li) => li.setAttribute('aria-selected', String(+li.dataset.i === sugIndex)));
    q.setAttribute('aria-activedescendant', `sg${sugIndex}`);
    $(`#sg${sugIndex}`)?.scrollIntoView({ block: 'nearest' });
  };
  const pickSuggest = (i) => {
    const it = sugItems[i];
    if (!it) return;
    closeSuggest();
    if (it.type === 'cat') { q.value = ''; showShop({ cat: it.c.id }); }
    else { q.value = it.p.name; showShop({ q: it.p.name, cat: it.p.cat }); highlightProduct(it.p.id); }
  };
  q.addEventListener('input', renderSuggest);
  q.addEventListener('focus', renderSuggest);
  qcat.addEventListener('change', renderSuggest);
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggest(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggest(-1); }
    else if (e.key === 'Escape') closeSuggest();
    else if (e.key === 'Enter' && sugIndex >= 0) { e.preventDefault(); pickSuggest(sugIndex); }
  });
  sug.addEventListener('mousedown', (e) => e.preventDefault());
  sug.addEventListener('click', (e) => { const li = e.target.closest('.suggest__item'); if (li) pickSuggest(+li.dataset.i); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) closeSuggest(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    closeSuggest();
    showShop({ q: q.value.trim(), cat: qcat.value });
  });

  /* ---------- προϊόντα ---------- */
  const list = $('#products');
  const result = $('#shopResult');
  const tabs = $$('.shop-tab');
  const shopSec = $('#proionta');

  const visible = () => PRODUCTS.filter((p) => {
    if (state.fav) return favs.has(p.id);
    if (state.q || state.cat) return (!state.cat || p.cat === state.cat) && matches(p, state.q);
    return state.tab === 'all' || p.tags.includes(state.tab);
  });

  const cardHTML = (p) => {
    const c = CAT[p.cat];
    const badge = p.tags.includes('offer') ? '<span class="product__badge product__badge--offer">Προσφορά</span>'
      : p.tags.includes('new') ? '<span class="product__badge product__badge--new">Νέο</span>'
      : p.tags.includes('top') ? '<span class="product__badge">🔥 Top</span>' : '';
    const inCart = cart.has(p.id);
    return `<li><article class="product" data-id="${p.id}" style="--c:${c.c}">
      <div class="product__media">${badge}<span class="product__sticker">${icon(c.icon)}</span>
        <button class="product__fav" type="button" aria-pressed="${favs.has(p.id)}" aria-label="${favs.has(p.id) ? 'Αφαίρεση από' : 'Προσθήκη στα'} αγαπημένα: ${esc(p.name)}">${icon('i-heart')}</button></div>
      <div class="product__body">
        <span class="product__cat">${esc(c.name)}</span>
        <h3 class="product__name">${esc(p.name)}</h3>
        <span class="product__pack">${esc(p.pack)}</span>
        <span class="product__stock ${p.stock === 'order' ? 'product__stock--order' : ''}">${p.stock === 'order' ? 'Κατόπιν παραγγελίας' : 'Σε απόθεμα'}</span>
        ${priceHTML(p)}
        <button class="btn btn--ink btn--block product__add ${inCart ? 'is-added' : ''}" type="button">${icon(inCart ? 'i-check' : 'i-cart')} ${inCart ? `Στο καλάθι (${cart.get(p.id)})` : 'Στο καλάθι'}</button>
      </div></article></li>`;
  };

  const renderProducts = () => {
    const items = visible();
    list.innerHTML = items.length ? items.map(cardHTML).join('') : `<li class="products__empty">${state.fav ? 'Δεν έχεις αγαπημένα ακόμα — πάτα την καρδιά σε ένα προϊόν.' : 'Δεν βρέθηκαν προϊόντα. Δοκίμασε άλλη αναζήτηση.'}</li>`;
    const filtered = state.fav || state.q || state.cat;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(!filtered && t.dataset.filter === state.tab)));
    if (filtered) {
      const what = state.fav ? 'στα αγαπημένα σου' : [state.q && `για «${esc(state.q)}»`, state.cat && `στην κατηγορία ${esc(CAT[state.cat].name)}`].filter(Boolean).join(' ');
      result.innerHTML = `${items.length} ${items.length === 1 ? 'προϊόν' : 'προϊόντα'} ${what} <button type="button" data-clear>Καθαρισμός</button>`;
    } else {
      result.textContent = '';
    }
    list.scrollLeft = 0;
    updateRail();
  };

  const showShop = (f) => {
    Object.assign(state, { q: '', cat: '', fav: false }, f);
    setMega('');
    renderProducts();
    shopSec.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const highlightProduct = (id) => {
    const el = $(`.product[data-id="${id}"]`, list);
    if (el && !reduceMotion) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04) rotate(-1deg)' }, { transform: 'scale(1)' }], { duration: 600, delay: 400 });
  };

  tabs.forEach((t) => t.addEventListener('click', () => { Object.assign(state, { tab: t.dataset.filter, q: '', cat: '', fav: false }); q.value = ''; qcat.value = ''; renderProducts(); }));
  result.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) { Object.assign(state, { q: '', cat: '', fav: false }); q.value = ''; qcat.value = ''; renderProducts(); } });

  // links προς κατηγορία (mega menu, stickers)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-show-cat]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.q) q.value = '';
    showShop({ cat: a.dataset.showCat });
  });
  $$('.stickers .sticker').forEach((s, i) => { if (CATS[i]) { s.dataset.showCat = CATS[i].id; s.setAttribute('href', '#proionta'); } });

  list.addEventListener('click', (e) => {
    const card = e.target.closest('.product');
    if (!card) return;
    const p = PROD[card.dataset.id];
    if (e.target.closest('.product__fav')) {
      favs.has(p.id) ? favs.delete(p.id) : favs.add(p.id);
      store.set('ns3-favs', [...favs]);
      updateCounts();
      if (state.fav) renderProducts();
      else {
        const b = $('.product__fav', card);
        b.setAttribute('aria-pressed', String(favs.has(p.id)));
        b.setAttribute('aria-label', `${favs.has(p.id) ? 'Αφαίρεση από' : 'Προσθήκη στα'} αγαπημένα: ${p.name}`);
      }
      bump($('#wishBtn'));
      toast(favs.has(p.id) ? '♥ Προστέθηκε στα αγαπημένα' : 'Αφαιρέθηκε από τα αγαπημένα');
    } else if (e.target.closest('.product__add')) {
      addToCart(p.id, 1);
      toast(`✓ ${p.name} — στο καλάθι`);
    }
  });

  // βελάκια του rail
  const prevR = $('.rail__btn--prev');
  const nextR = $('.rail__btn--next');
  function updateRail() {
    const max = list.scrollWidth - list.clientWidth - 2;
    prevR.disabled = list.scrollLeft <= 2;
    nextR.disabled = list.scrollLeft >= max;
  }
  const step = (d) => list.scrollBy({ left: d * list.clientWidth * 0.9, behavior: reduceMotion ? 'auto' : 'smooth' });
  prevR.addEventListener('click', () => step(-1));
  nextR.addEventListener('click', () => step(1));
  list.addEventListener('scroll', updateRail, { passive: true });
  window.addEventListener('resize', updateRail);

  /* ---------- καλάθι ---------- */
  const cartEl = $('#cart');
  const scrim = $('#scrim');
  const items = $('#cartItems');
  let lastFocus = null;

  function addToCart(id, n) {
    const qty = (cart.get(id) || 0) + n;
    if (qty <= 0) cart.delete(id); else cart.set(id, qty);
    store.set('ns3-cart', Object.fromEntries(cart));
    updateCounts();
    renderCart();
    // ενημέρωση του κουμπιού στην κάρτα
    const btn = $(`.product[data-id="${id}"] .product__add`, list);
    if (btn) {
      btn.classList.toggle('is-added', cart.has(id));
      btn.innerHTML = cart.has(id) ? `${icon('i-check')} Στο καλάθι (${cart.get(id)})` : `${icon('i-cart')} Στο καλάθι`;
    }
    if (n > 0) { bump($('#cartBtn')); bump($('#dockCart')); }
  }

  function updateCounts() {
    const n = [...cart.values()].reduce((a, b) => a + b, 0);
    [['#cartCount', n], ['#dockCount', n], ['#wishCount', favs.size]].forEach(([sel, v]) => {
      const el = $(sel);
      el.textContent = v;
      el.hidden = v === 0;
    });
    $('#cartBtn').setAttribute('aria-label', `Καλάθι, ${n} τεμάχια`);
    $('#wishBtn').setAttribute('aria-label', `Αγαπημένα, ${favs.size}`);
  }

  function renderCart() {
    let total = 0;
    items.innerHTML = [...cart.entries()].map(([id, n]) => {
      const p = PROD[id], c = CAT[p.cat], sum = priceOf(p) * n;
      total += sum;
      return `<li class="citem" data-id="${id}"><span class="citem__ic ${c.dark ? 'is-dark' : ''}" style="--c:${c.c}">${icon(c.icon)}</span>
        <div><b>${esc(p.name)}</b><small>${esc(p.pack)} · ${fmt(priceOf(p))}</small>
        <div class="qty"><button type="button" data-d="-1" aria-label="Μείωση">${icon('i-minus')}</button><output>${n}</output><button type="button" data-d="1" aria-label="Αύξηση">${icon('i-plus')}</button></div></div>
        <span class="citem__sum">${fmt(sum)}</span></li>`;
    }).join('');
    $('#cartTotal').textContent = fmt(total);
    cartEl.classList.toggle('has-items', cart.size > 0);
    $('#cartMode').innerHTML = isB2B() ? 'Βλέπεις <b>τιμές B2B</b> χονδρικής.' : 'Βλέπεις τιμές λιανικής. Είσαι επαγγελματίας; Γύρνα σε <b>B2B</b> για χαμηλότερες τιμές.';
    $('#checkout').disabled = cart.size === 0;
  }
  items.addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (b) addToCart(b.closest('.citem').dataset.id, +b.dataset.d);
  });

  const openCart = () => {
    lastFocus = document.activeElement;
    renderCart();
    scrim.hidden = false;
    cartEl.classList.add('is-open');
    cartEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    setTimeout(() => cartEl.focus(), 50);
  };
  const closeCart = () => {
    if (!cartEl.classList.contains('is-open')) return;
    cartEl.classList.remove('is-open');
    cartEl.setAttribute('aria-hidden', 'true');
    scrim.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus();
  };
  $('#cartBtn').addEventListener('click', openCart);
  $('#dockCart').addEventListener('click', openCart);
  $('.cart__close').addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  $('#checkout').addEventListener('click', () => toast('Σχέδιο παρουσίασης: εδώ θα συνδεθεί η ολοκλήρωση του e-shop.'));

  $('#wishBtn').addEventListener('click', () => {
    if (!favs.size) { toast('Πάτα την ♥ σε ένα προϊόν για να το κρατήσεις.'); return; }
    showShop({ fav: true });
  });
  $('#dockSearch').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => q.focus(), reduceMotion ? 0 : 350);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeCart();
    setMega('');
  });

  /* ---------- αλλαγή Λιανική / B2B ---------- */
  document.addEventListener('ns:mode', () => {
    renderProducts();
    renderCart();
    if (!sug.hidden) renderSuggest();
  });

  /* ---------- footer ---------- */
  $('#footCats').innerHTML = CATS.map((c) => `<li><a href="#proionta" data-show-cat="${c.id}">${esc(c.name)}</a></li>`).join('');
  // στο κινητό οι στήλες του footer ξεκινούν κλειστές
  if (window.matchMedia('(max-width: 639px)').matches) $$('.fcol').forEach((d) => { d.open = false; });

  renderProducts();
  renderCart();
  updateCounts();
})();
