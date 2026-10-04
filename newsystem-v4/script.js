/* New System v4 — μενού, αναζήτηση, προϊόντα, ΦΠΑ/B2B, καλάθι */
(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const VAT = 0.24;
  const FREE_SHIP = 150;
  const fmt = (n) => n.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' });
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const stars = () => `<span class="stars">${icon('i-star').repeat(5)}</span>`;

  /* ---------- Δεδομένα (ενδεικτικά) ---------- */
  const CATS = [
    { id: 'rafieres', name: 'Ραφιέρες & Modular', short: 'Ραφιέρες', icon: 'i-shelf', c: '#4f7cff', count: 214, subs: ['Συστήματα modular', 'Chrome Grid', 'Ορθοστάτες', 'Βραχίονες & μπάρες', 'Ράφια γυάλινα', 'Ράφια μελαμίνης'], blurb: 'Συστήματα ραφιών για τοίχο και κέντρο καταστήματος.' },
    { id: 'slatwall', name: 'Slatwall & Γόνδολες', short: 'Slatwall', icon: 'i-slat', c: '#2ec4a6', count: 168, subs: ['Πάνελ slatwall', 'Εξαρτήματα slatwall', 'Γόνδολες', 'Γάντζοι', 'Ράφια γόνδολας', 'Μετωπικές'], blurb: 'Πάνελ, γόνδολες και όλα τα εξαρτήματα προβολής.' },
    { id: 'koukles', name: 'Κούκλες βιτρίνας', short: 'Κούκλες', icon: 'i-mannequin', c: '#ffd23f', count: 96, subs: ['Γυναικείες', 'Ανδρικές', 'Παιδικές', 'Μπούστα ραπτικής', 'Περούκες', 'Βάσεις & ανταλλακτικά'], blurb: 'Πολυεστερικές και πλαστικές, σε ματ ή γυαλιστερό.' },
    { id: 'kremastres', name: 'Κρεμάστρες', short: 'Κρεμάστρες', icon: 'i-hanger', c: '#ff6b4a', count: 142, subs: ['Ξύλινες', 'Πλαστικές', 'Βελούδινες', 'Αντικλεπτικές', 'Παιδικές', 'Με λογότυπο'], blurb: 'Σε ποσότητες χονδρικής, με δυνατότητα λογότυπου.' },
    { id: 'stand', name: 'Σταντ & Gridwall', short: 'Σταντ', icon: 'i-rail', c: '#a78bfa', count: 121, subs: ['Καλόγεροι ρούχων', 'Σταντ προβολής', 'Πάνελ gridwall', 'Τροχήλατα', 'Σταντ εντύπων'], blurb: 'Κινητές λύσεις προβολής για κάθε χώρο.' },
    { id: 'kathreptes', name: 'Καθρέπτες & Δοκιμαστήρια', short: 'Καθρέπτες', icon: 'i-mirror', c: '#ff8fc7', count: 38, subs: ['Επιδαπέδιοι', 'Επιτοίχιοι', 'Δοκιμαστηρίων', 'Κουρτίνες & ράγες'], blurb: 'Σε διαστάσεις και πλαίσια που ταιριάζουν στο ύφος σας.' },
    { id: 'plexi', name: 'Plexiglass & Σήμανση', short: 'Plexiglass', icon: 'i-plexi', c: '#5bd0f5', count: 187, subs: ['Θήκες τιμών', 'Σταντ εντύπων', 'Βάσεις προβολής', 'Ετικέτες ραφιού', 'Κοπή στα μέτρα'], blurb: 'Θήκες, σταντ και κατασκευές κομμένες στα μέτρα σας.' },
    { id: 'aksesouar', name: 'Αξεσουάρ & Ασφάλεια', short: 'Αξεσουάρ', icon: 'i-shield', c: '#ffa23a', count: 263, subs: ['Αντικλεπτικά συστήματα', 'Ετικέτες & tags', 'Γάντζοι', 'Σακούλες', 'Αξεσουάρ ταμείου'], blurb: 'Ό,τι μικρό χρειάζεται για να δουλεύει σωστά το κατάστημα.' }
  ];
  const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));

  // Τιμές χωρίς ΦΠΑ (λιανική / B2B)
  const PRODUCTS = [
    { id: 'p1', cat: 'slatwall', name: 'Πάνελ slatwall λευκό 120×120 cm, 10 κανάλια', pack: 'MDF 18 mm, με ένθετα αλουμινίου', retail: 58, was: 66, b2b: 44, tags: ['offer', 'top'], rating: 4.9, reviews: 41 },
    { id: 'p2', cat: 'rafieres', name: 'Ορθοστάτης modular χρωμέ 240 cm', pack: 'διπλής διάτρησης, με στηρίγματα τοίχου', retail: 19, b2b: 14, tags: ['top'], rating: 4.8, reviews: 63 },
    { id: 'p3', cat: 'kremastres', name: 'Κρεμάστρα ξύλινη φυσική με μπάρα, 44 cm', pack: 'συσκευασία 50 τεμ.', retail: 42, was: 49, b2b: 31, tags: ['top', 'offer'], rating: 4.7, reviews: 128 },
    { id: 'p4', cat: 'koukles', name: 'Κούκλα γυναικεία πολυεστερική, λευκή γυαλιστερή', pack: 'με βάση γυαλιού, ύψος 178 cm', retail: 189, b2b: 149, tags: ['top'], rating: 4.9, reviews: 22 },
    { id: 'p5', cat: 'stand', name: 'Καλόγερος ρούχων τροχήλατος, χρωμέ', pack: 'ρυθμιζόμενο ύψος 110–180 cm', retail: 79, was: 92, b2b: 59, tags: ['offer', 'top'], rating: 4.6, reviews: 87 },
    { id: 'p6', cat: 'rafieres', name: 'Πάνελ Chrome Grid 60×150 cm', pack: 'χρωμέ, πλέγμα 5×5 cm', retail: 24, b2b: 18, tags: ['top'], rating: 4.8, reviews: 54 },
    { id: 'p7', cat: 'aksesouar', name: 'Αντικλεπτική ετικέτα RF 8.2 MHz', pack: 'συσκευασία 1.000 τεμ.', retail: 65, b2b: 48, tags: ['top'], rating: 4.7, reviews: 19 },
    { id: 'p8', cat: 'plexi', name: 'Θήκη τιμών plexiglass A6, όρθια', pack: 'συσκευασία 10 τεμ.', retail: 22, was: 26, b2b: 15, tags: ['offer', 'top'], rating: 4.8, reviews: 73 },
    { id: 'p9', cat: 'slatwall', name: 'Γόνδολα διπλής όψης 125 cm, 4 ράφια/όψη', pack: 'μεταλλική, γκρι RAL 7035', retail: 320, b2b: 255, tags: ['new'], rating: 5, reviews: 6, stock: 'order' },
    { id: 'p10', cat: 'koukles', name: 'Μπούστο ανδρικό ραπτικής, λινό', pack: 'ρυθμιζόμενο ύψος, ξύλινη βάση', retail: 69, b2b: 52, tags: ['new'], rating: 4.5, reviews: 8 },
    { id: 'p11', cat: 'kathreptes', name: 'Καθρέπτης δαπέδου 40×170 cm', pack: 'μαύρο μεταλλικό πλαίσιο', retail: 119, b2b: 92, tags: ['new'], rating: 4.9, reviews: 11 },
    { id: 'p12', cat: 'stand', name: 'Πάνελ gridwall μαύρο 60×180 cm', pack: 'με πόδια, πλέγμα 7,5 cm', retail: 34, b2b: 26, tags: ['new'], rating: 4.6, reviews: 14 },
    { id: 'p13', cat: 'kremastres', name: 'Κρεμάστρα βελούδινη μαύρη, αντιολισθητική', pack: 'συσκευασία 100 τεμ.', retail: 36, was: 44, b2b: 27, tags: ['offer', 'new'], rating: 4.8, reviews: 39 },
    { id: 'p14', cat: 'rafieres', name: 'Ράφι γυάλινο 100×30 cm, 8 mm', pack: 'ακμές τροχισμένες', retail: 14, was: 17, b2b: 10.5, tags: ['offer'], rating: 4.7, reviews: 27 },
    { id: 'p15', cat: 'aksesouar', name: 'Γάντζος slatwall 15 cm, χρωμέ', pack: 'συσκευασία 25 τεμ.', retail: 18, was: 21, b2b: 13, tags: ['offer'], rating: 4.9, reviews: 95 },
    { id: 'p16', cat: 'plexi', name: 'Σταντ εντύπων plexiglass A4, επιτραπέζιο', pack: 'συσκευασία 5 τεμ.', retail: 27, b2b: 20, tags: ['new'], rating: 4.6, reviews: 9 }
  ];
  const PROD = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

  /* ---------- Κατάσταση ---------- */
  const state = {
    vat: store.get('ns4.vat', 'ex'),        // ex | inc
    mode: store.get('ns4.mode', 'b2b'),     // b2b | b2c
    cart: store.get('ns4.cart', {}),
    wish: store.get('ns4.wish', []),
    tab: 'top',
    query: ''
  };
  const isB2B = () => state.mode === 'b2b';
  const net = (p) => isB2B() ? p.b2b : p.retail;
  const gross = (n) => n * (1 + VAT);
  const shown = (n) => state.vat === 'inc' ? gross(n) : n;
  const vatLabel = () => state.vat === 'inc' ? 'με ΦΠΑ' : 'χωρίς ΦΠΑ';
  const altLabel = () => state.vat === 'inc' ? 'χωρίς ΦΠΑ' : 'με ΦΠΑ';
  const alt = (n) => state.vat === 'inc' ? n : gross(n);

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('is-visible'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-visible'), 2200); };

  /* ---------- Διακόπτες ΦΠΑ / B2B ---------- */
  const paintToggles = () => {
    $$('[data-vat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vat === state.vat)));
    $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  };
  document.addEventListener('click', (e) => {
    const v = e.target.closest('[data-vat]');
    const m = e.target.closest('[data-mode]');
    if (v) { state.vat = v.dataset.vat; store.set('ns4.vat', state.vat); }
    else if (m) { state.mode = m.dataset.mode; store.set('ns4.mode', state.mode); }
    else return;
    paintToggles(); renderProducts(); renderCart();
  });

  /* ---------- Μενού (desktop) ---------- */
  const navList = $('#navList');
  const mega = $('#mega');
  const megaInner = $('.mega__inner', mega);
  navList.innerHTML = CATS.map((c) => `<li><a class="nav__link" href="#categories" data-cat="${c.id}" aria-expanded="false" aria-controls="mega">${esc(c.short)} ${icon('i-chev')}</a></li>`).join('')
    + `<li><a class="nav__link nav__link--offer" href="#products" data-tab="offer">${icon('i-percent')} Προσφορές</a></li>`
    + `<li><a class="nav__link" href="#custom">Κατασκευές</a></li>`
    + `<li><a class="nav__link nav__link--b2b" href="#b2b">B2B</a></li>`;
  const links = $$('.nav__link[data-cat]', navList);
  let megaT;
  const openMega = (id) => {
    const c = CAT[id];
    const third = Math.ceil(c.subs.length / 2);
    const col = (list) => `<ul>${list.map((s) => `<li><a href="#categories" data-filter="${c.id}">${esc(s)}</a></li>`).join('')}</ul>`;
    megaInner.innerHTML = `
      <div class="mega__col"><h3>${esc(c.name)}</h3>${col(c.subs.slice(0, third))}<ul><li><a class="mega__all" href="#categories" data-filter="${c.id}">Όλα τα προϊόντα (${c.count}) →</a></li></ul></div>
      <div class="mega__col"><h3>&nbsp;</h3>${col(c.subs.slice(third))}</div>
      <div class="mega__col"><h3>Δημοφιλή</h3><ul>${PRODUCTS.filter((p) => p.cat === c.id).slice(0, 4).map((p) => `<li><a href="#products" data-product="${p.id}">${esc(p.name)}</a></li>`).join('')}</ul></div>
      <div class="mega__card" style="--c:${c.c}">${icon(c.icon)}<b>${esc(c.name)}</b><p>${esc(c.blurb)}</p><a class="btn btn--navy" href="#categories" data-filter="${c.id}">Δες την κατηγορία ${icon('i-arrow')}</a></div>`;
    links.forEach((l) => l.setAttribute('aria-expanded', String(l.dataset.cat === id)));
    mega.hidden = false;
  };
  const closeMega = () => { mega.hidden = true; links.forEach((l) => l.setAttribute('aria-expanded', 'false')); };
  links.forEach((l) => {
    l.addEventListener('mouseenter', () => { clearTimeout(megaT); openMega(l.dataset.cat); });
    l.addEventListener('focus', () => openMega(l.dataset.cat));
    l.addEventListener('click', (e) => { e.preventDefault(); closeMega(); filterByCat(l.dataset.cat); });
  });
  $('.nav').addEventListener('mouseleave', () => { megaT = setTimeout(closeMega, 150); });
  mega.addEventListener('mouseenter', () => clearTimeout(megaT));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMega(); closeDrawer(); closeCart(); hideSuggest(); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav')) closeMega(); });

  /* ---------- Μενού κινητού ---------- */
  const drawer = $('#drawer');
  const drawerBody = $('#drawerBody');
  drawerBody.innerHTML = `
    <div class="drawer__tools">
      <div class="vat" role="group" aria-label="Τιμές"><button type="button" class="vat__btn" data-vat="ex">χωρίς ΦΠΑ</button><button type="button" class="vat__btn" data-vat="inc">με ΦΠΑ</button></div>
      <div class="vat" role="group" aria-label="Πελάτης"><button type="button" class="vat__btn" data-mode="b2c">Λιανική</button><button type="button" class="vat__btn" data-mode="b2b">B2B</button></div>
    </div>
    ${CATS.map((c) => `<details><summary>${icon(c.icon)}${esc(c.name)}${icon('i-chev', 'chev')}</summary><ul>${c.subs.map((s) => `<li><a href="#categories" data-filter="${c.id}">${esc(s)}</a></li>`).join('')}<li><a href="#categories" data-filter="${c.id}"><b>Όλα (${c.count}) →</b></a></li></ul></details>`).join('')}
    <a class="drawer__link" href="#products" data-tab="offer">${icon('i-percent')} Προσφορές</a>
    <a class="drawer__link" href="#custom">${icon('i-cube')} Ειδικές κατασκευές</a>
    <a class="drawer__link" href="#guides">${icon('i-book')} Οδηγοί &amp; συμβουλές</a>
    <a class="drawer__link" href="#contact">${icon('i-pin')} Showroom &amp; επικοινωνία</a>`;
  const openDrawer = () => { drawer.hidden = false; document.body.classList.add('is-locked'); $('#burger').setAttribute('aria-expanded', 'true'); paintToggles(); };
  const closeDrawer = () => { if (drawer.hidden) return; drawer.hidden = true; document.body.classList.remove('is-locked'); $('#burger').setAttribute('aria-expanded', 'false'); };
  $('#burger').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('.drawer__backdrop').addEventListener('click', closeDrawer);
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) closeDrawer(); });

  /* ---------- Κατηγορίες (grid + footer) ---------- */
  $('#catgrid').innerHTML = CATS.map((c) => `
    <a class="ccard" href="#products" data-filter="${c.id}" style="--c:${c.c}">
      <span class="ccard__img">${icon(c.icon)}</span>
      <span class="ccard__body"><b>${esc(c.name)}</b><small>${c.count} προϊόντα</small><span>Δες τα προϊόντα ${icon('i-arrow')}</span></span>
    </a>`).join('');
  $('#footerCats').innerHTML = CATS.map((c) => `<li><a href="#products" data-filter="${c.id}">${esc(c.name)}</a></li>`).join('');

  /* ---------- Προϊόντα ---------- */
  const pgrid = $('#pgrid');
  const resultsEl = $('#results');
  const titleEl = $('#productsTitle');
  const TAB_TITLES = { top: 'Τα πιο δημοφιλή', new: 'Νέα προϊόντα', offer: 'Προσφορές' };
  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ');
  const matches = (p, q) => { const f = fold(q); return fold(p.name).includes(f) || fold(CAT[p.cat].name).includes(f) || fold(p.pack).includes(f); };

  const priceHtml = (p) => {
    const n = net(p);
    const wasHtml = (p.was && !isB2B()) ? `<del>${fmt(shown(p.was))}</del>` : '';
    const b2bHint = (!isB2B()) ? `<span class="pcard__b2b">B2B: ${fmt(shown(p.b2b))} ${vatLabel()}</span>` : '';
    return `<div class="price">${fmt(shown(n))} ${wasHtml}<span class="price__vat">${vatLabel()}</span></div>
      <span class="price__alt"><b>${fmt(alt(n))}</b> ${altLabel()}</span>${b2bHint}`;
  };
  const card = (p) => {
    const c = CAT[p.cat];
    const badges = [];
    if (p.tags.includes('offer') && !isB2B()) badges.push('<span class="badge badge--offer">Προσφορά</span>');
    if (p.tags.includes('top')) badges.push('<span class="badge badge--top">Best seller</span>');
    if (p.tags.includes('new')) badges.push('<span class="badge">Νέο</span>');
    if (isB2B()) badges.push('<span class="badge badge--b2b">Τιμή B2B</span>');
    const wished = state.wish.includes(p.id);
    return `<article class="pcard" data-id="${p.id}">
      <div class="pcard__img" style="--c:${c.c}">${icon(c.icon)}<div class="pcard__badges">${badges.join('')}</div>
        <button class="pcard__wish" type="button" data-wish="${p.id}" aria-pressed="${wished}" aria-label="Προσθήκη στα αγαπημένα">${icon('i-heart')}</button></div>
      <div class="pcard__body">
        <span class="pcard__cat">${esc(c.name)}</span>
        <a class="pcard__name" href="#products">${esc(p.name)}</a>
        <span class="pcard__pack">${esc(p.pack)}</span>
        <span class="pcard__rating">${stars()} ${p.rating.toLocaleString('el-GR')} <span>(${p.reviews})</span></span>
        <div class="pcard__price">${priceHtml(p)}</div>
        <span class="stock ${p.stock === 'order' ? 'stock--order' : ''}">${p.stock === 'order' ? 'Κατόπιν παραγγελίας · 5–7 ημέρες' : 'Ετοιμοπαράδοτο'}</span>
        <div class="pcard__actions">
          <div class="qty"><button type="button" data-qty="-1" aria-label="Λιγότερα">${icon('i-minus')}</button><input type="number" min="1" value="1" aria-label="Ποσότητα"><button type="button" data-qty="1" aria-label="Περισσότερα">${icon('i-plus')}</button></div>
          <button class="pcard__add" type="button" data-add="${p.id}">${icon('i-cart')} Στο καλάθι</button>
        </div>
      </div></article>`;
  };
  const currentList = () => {
    if (state.query) return PRODUCTS.filter((p) => matches(p, state.query));
    if (state.tab.startsWith('cat:')) return PRODUCTS.filter((p) => p.cat === state.tab.slice(4));
    return PRODUCTS.filter((p) => p.tags.includes(state.tab));
  };
  const renderProducts = () => {
    const list = currentList();
    const isFilter = Boolean(state.query) || state.tab.startsWith('cat:');
    $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === state.tab)));
    titleEl.textContent = state.query ? `Αποτελέσματα για «${state.query}»` : state.tab.startsWith('cat:') ? CAT[state.tab.slice(4)].name : TAB_TITLES[state.tab];
    resultsEl.hidden = !isFilter;
    resultsEl.innerHTML = isFilter ? `${list.length} προϊόντα <button type="button" id="clearFilter">Καθαρισμός</button>` : '';
    pgrid.innerHTML = list.length ? list.map(card).join('') : '<p class="pgrid__empty">Δεν βρέθηκαν προϊόντα. Δοκίμασε άλλη λέξη ή κάλεσέ μας στο 2310 541 741.</p>';
  };
  const filterByCat = (id) => { state.query = ''; $('#q').value = ''; state.tab = 'cat:' + id; renderProducts(); $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const setTab = (tab) => { state.query = ''; $('#q').value = ''; state.tab = tab; renderProducts(); };
  $$('.tab').forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    const t = e.target.closest('[data-tab]:not(.tab)');
    const pr = e.target.closest('[data-product]');
    if (f) { e.preventDefault(); closeMega(); filterByCat(f.dataset.filter); }
    else if (t) { e.preventDefault(); setTab(t.dataset.tab); $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (pr) { e.preventDefault(); closeMega(); state.query = PROD[pr.dataset.product].name; $('#q').value = state.query; renderProducts(); $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (e.target.id === 'clearFilter') setTab('top');
  });

  // Ποσότητα, καλάθι, αγαπημένα στις κάρτες
  pgrid.addEventListener('click', (e) => {
    const q = e.target.closest('[data-qty]');
    const a = e.target.closest('[data-add]');
    const w = e.target.closest('[data-wish]');
    if (q) { const inp = $('input', q.parentElement); inp.value = Math.max(1, (parseInt(inp.value, 10) || 1) + Number(q.dataset.qty)); }
    else if (a) { const inp = $('.qty input', a.closest('.pcard')); addToCart(a.dataset.add, Math.max(1, parseInt(inp.value, 10) || 1)); }
    else if (w) {
      const id = w.dataset.wish;
      const i = state.wish.indexOf(id);
      if (i >= 0) state.wish.splice(i, 1); else state.wish.push(id);
      store.set('ns4.wish', state.wish);
      w.setAttribute('aria-pressed', String(i < 0));
      paintCounts();
      toast(i < 0 ? 'Προστέθηκε στα αγαπημένα' : 'Αφαιρέθηκε από τα αγαπημένα');
    }
  });
  $('#wishBtn').addEventListener('click', () => {
    if (!state.wish.length) { toast('Δεν έχεις αγαπημένα ακόμα'); return; }
    state.query = ''; $('#q').value = '';
    state.tab = 'wish';
    renderWish();
    $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const renderWish = () => {
    const list = PRODUCTS.filter((p) => state.wish.includes(p.id));
    $$('.tab').forEach((t) => t.setAttribute('aria-selected', 'false'));
    titleEl.textContent = 'Τα αγαπημένα σου';
    resultsEl.hidden = false;
    resultsEl.innerHTML = `${list.length} προϊόντα <button type="button" id="clearFilter">Πίσω στα δημοφιλή</button>`;
    pgrid.innerHTML = list.map(card).join('');
  };

  /* ---------- Αναζήτηση ---------- */
  const form = $('#search');
  const q = $('#q');
  const sug = $('#suggest');
  let sel = -1;
  const hideSuggest = () => { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); sel = -1; };
  const mark = (text, query) => { const i = fold(text).indexOf(fold(query)); return i < 0 ? esc(text) : esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + query.length)) + '</mark>' + esc(text.slice(i + query.length)); };
  const showSuggest = () => {
    const v = q.value.trim();
    if (v.length < 2) { hideSuggest(); return; }
    const cats = CATS.filter((c) => fold(c.name).includes(fold(v)) || c.subs.some((s) => fold(s).includes(fold(v)))).slice(0, 3);
    const prods = PRODUCTS.filter((p) => matches(p, v)).slice(0, 6);
    if (!cats.length && !prods.length) { sug.innerHTML = `<li class="suggest__head">Κανένα αποτέλεσμα για «${esc(v)}»</li>`; }
    else {
      sug.innerHTML = (cats.length ? `<li class="suggest__head">Κατηγορίες</li>` + cats.map((c) => `<li role="option" data-filter="${c.id}">${icon(c.icon)}${mark(c.name, v)}<small>${c.count} προϊόντα</small></li>`).join('') : '')
        + (prods.length ? `<li class="suggest__head">Προϊόντα</li>` + prods.map((p) => `<li role="option" data-product="${p.id}">${icon(CAT[p.cat].icon)}${mark(p.name, v)}<small>${fmt(shown(net(p)))}</small></li>`).join('') : '');
    }
    sug.hidden = false; q.setAttribute('aria-expanded', 'true'); sel = -1;
  };
  q.addEventListener('input', showSuggest);
  q.addEventListener('focus', showSuggest);
  q.addEventListener('keydown', (e) => {
    const opts = $$('[role="option"]', sug);
    if (sug.hidden || !opts.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === sel)));
    } else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); opts[sel].click(); }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) hideSuggest(); });
  sug.addEventListener('click', () => hideSuggest());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = q.value.trim();
    hideSuggest();
    state.query = v;
    if (!v) { setTab('top'); return; }
    state.tab = 'search';
    renderProducts();
    $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- Καλάθι ---------- */
  const cart = $('#cart');
  const cartItems = $('#cartItems');
  const openCart = () => { cart.hidden = false; document.body.classList.add('is-locked'); renderCart(); };
  const closeCart = () => { if (cart.hidden) return; cart.hidden = true; document.body.classList.remove('is-locked'); };
  $('#cartBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  $('.cart__backdrop').addEventListener('click', closeCart);
  const addToCart = (id, qty) => {
    state.cart[id] = (state.cart[id] || 0) + qty;
    store.set('ns4.cart', state.cart);
    paintCounts();
    toast(`Προστέθηκε: ${PROD[id].name}`);
    renderCart();
  };
  const cartLines = () => Object.entries(state.cart).map(([id, qty]) => ({ p: PROD[id], qty }));
  const paintCounts = () => {
    const count = Object.values(state.cart).reduce((a, b) => a + b, 0);
    const netSum = cartLines().reduce((s, l) => s + net(l.p) * l.qty, 0);
    $('#cartCount').textContent = count; $('#cartCount').hidden = !count;
    $('#cartTotalMini').textContent = fmt(shown(netSum));
    $('#wishCount').textContent = state.wish.length; $('#wishCount').hidden = !state.wish.length;
  };
  const renderCart = () => {
    paintCounts();
    const lines = cartLines();
    if (!lines.length) { cartItems.innerHTML = '<p class="cart__empty">Το καλάθι σου είναι άδειο.<br>Πρόσθεσε προϊόντα από τις κατηγορίες.</p>'; }
    else {
      cartItems.innerHTML = lines.map(({ p, qty }) => `<div class="citem" data-id="${p.id}">
        <span class="citem__img">${icon(CAT[p.cat].icon)}</span>
        <div><div class="citem__name">${esc(p.name)}</div><div class="citem__meta">${fmt(shown(net(p)))} / τεμ. ${vatLabel()}</div>
          <div class="citem__ctrl"><div class="qty"><button type="button" data-cq="-1" aria-label="Λιγότερα">${icon('i-minus')}</button><input type="number" min="1" value="${qty}" aria-label="Ποσότητα"><button type="button" data-cq="1" aria-label="Περισσότερα">${icon('i-plus')}</button></div><button type="button" class="citem__rm" data-rm="${p.id}">Αφαίρεση</button></div></div>
        <div class="citem__price">${fmt(shown(net(p) * qty))}</div></div>`).join('');
    }
    const netSum = lines.reduce((s, l) => s + net(l.p) * l.qty, 0);
    const vat = netSum * VAT;
    $('#sumNet').textContent = fmt(netSum);
    $('#sumVat').textContent = fmt(vat);
    $('#sumTotal').textContent = fmt(netSum + vat);
    const left = Math.max(0, FREE_SHIP - netSum);
    $('#cartShip').innerHTML = netSum >= FREE_SHIP
      ? `<b>✓ Δωρεάν αποστολή</b> για αυτή την παραγγελία.<div class="bar" style="--w:100%"><i></i></div>`
      : `Πρόσθεσε ακόμα <b>${fmt(left)}</b> (χωρίς ΦΠΑ) για δωρεάν αποστολή.<div class="bar" style="--w:${Math.round(netSum / FREE_SHIP * 100)}%"><i></i></div>`;
  };
  cartItems.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cq]');
    const r = e.target.closest('[data-rm]');
    if (c) { const id = c.closest('.citem').dataset.id; state.cart[id] = Math.max(1, state.cart[id] + Number(c.dataset.cq)); }
    else if (r) delete state.cart[r.dataset.rm];
    else return;
    store.set('ns4.cart', state.cart); renderCart();
  });
  cartItems.addEventListener('change', (e) => {
    if (!e.target.matches('input')) return;
    const id = e.target.closest('.citem').dataset.id;
    state.cart[id] = Math.max(1, parseInt(e.target.value, 10) || 1);
    store.set('ns4.cart', state.cart); renderCart();
  });
  $('#checkout').addEventListener('click', () => {
    if (!cartLines().length) { toast('Το καλάθι είναι άδειο'); return; }
    toast('Σχέδιο παρουσίασης — η ολοκλήρωση παραγγελίας θα ενεργοποιηθεί στο τελικό site');
  });

  /* ---------- Φόρμες ---------- */
  const b2bForm = $('#b2bForm');
  const b2bNote = $('.b2b__form-note', b2bForm);
  b2bForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('input, select', b2bForm).forEach((inp) => {
      const valid = inp.checkValidity() && (inp.tagName === 'SELECT' || inp.value.trim() !== '');
      inp.closest('.field').classList.toggle('is-invalid', !valid);
      ok = ok && valid;
    });
    if (!ok) { b2bNote.textContent = 'Συμπλήρωσε σωστά όλα τα πεδία (ΑΦΜ 9 ψηφία).'; b2bNote.classList.add('is-error'); return; }
    const d = new FormData(b2bForm);
    const body = ['Αίτηση λογαριασμού B2B', '', `Επωνυμία: ${d.get('company')}`, `ΑΦΜ: ${d.get('afm')}`, `Τηλέφωνο: ${d.get('phone')}`, `Email: ${d.get('email')}`, `Τύπος: ${d.get('type')}`].join('\n');
    b2bNote.classList.remove('is-error');
    b2bNote.textContent = 'Ευχαριστούμε! Ανοίγει το email σου με την αίτηση — θα απαντήσουμε εντός μίας εργάσιμης.';
    window.location.href = `mailto:info@newsystem.gr?subject=${encodeURIComponent('Αίτηση B2B λογαριασμού')}&body=${encodeURIComponent(body)}`;
  });
  const nl = $('#nlForm');
  nl.addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('input', nl);
    $('.newsletter__note', nl).textContent = inp.checkValidity() && inp.value ? 'Ευχαριστούμε, εγγράφηκες στο newsletter!' : 'Γράψε ένα έγκυρο email.';
  });

  /* ---------- Διάφορα ---------- */
  const toTop = $('#toTop');
  window.addEventListener('scroll', () => toTop.classList.toggle('is-visible', window.scrollY > 600), { passive: true });
  $('#year').textContent = new Date().getFullYear();

  paintToggles();
  renderProducts();
  renderCart();
})();
