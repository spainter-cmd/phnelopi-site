(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- μενού κινητού ---------- */
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού');
    nav.classList.toggle('is-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 1200px)').addEventListener('change', () => setMenu(false));

  /* ---------- Λιανική / B2B ---------- */
  const modeBtns = document.querySelectorAll('.segmented__btn');
  const setMode = (mode) => {
    document.body.classList.toggle('is-b2c', mode === 'b2c');
    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    store.set('ns-mode', mode);
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
