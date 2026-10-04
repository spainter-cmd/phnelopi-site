(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- μενού κινητού / tablet ---------- */
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

  /* ---------- carousel κατηγοριών ---------- */
  const carousel = document.querySelector('.carousel');
  const viewport = carousel.querySelector('.carousel__viewport');
  const track = carousel.querySelector('.carousel__track');
  const slides = Array.from(track.children);
  const prevBtn = carousel.querySelector('.arrow--prev');
  const nextBtn = carousel.querySelector('.arrow--next');
  const indexEl = carousel.querySelector('.carousel__index');
  const currentEl = carousel.querySelector('.carousel__current');
  const totalEl = carousel.querySelector('.carousel__total');
  const barEl = carousel.querySelector('.carousel__bar i');
  const playBtn = carousel.querySelector('.carousel__play');
  const liveEl = carousel.querySelector('.carousel__live');
  const total = slides.length;
  const pad = (n) => String(n).padStart(2, '0');
  const AUTOPLAY_MS = 7000;
  let index = 0;

  const info = slides.map((s) => ({
    name: s.dataset.name,
    icon: s.dataset.icon,
    tone: getComputedStyle(s).getPropertyValue('--tone').trim(),
    dark: s.classList.contains('slide--dark')
  }));

  totalEl.textContent = pad(total);
  slides.forEach((s, i) => {
    s.id = s.id || `kat-${i + 1}`;
    s.setAttribute('role', 'tabpanel');
    s.setAttribute('aria-roledescription', 'slide');
    s.setAttribute('aria-label', `${i + 1} από ${total}: ${info[i].name}`);
    s.querySelector('.slide__num').textContent = `${pad(i + 1)} / ${pad(total)}`;
    s.querySelector('.plate__cap').textContent = `Fig. ${pad(i + 1)} — ${info[i].name}`;
  });

  const tabs = info.map((d, i) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'tab';
    t.id = `tab-${i + 1}`;
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', slides[i].id);
    t.innerHTML = `<span>${pad(i + 1)}</span>${d.name}`;
    t.addEventListener('click', () => { stopAutoplay(); go(i); });
    indexEl.appendChild(t);
    return t;
  });

  const paintArrow = (btn, d, dir) => {
    btn.querySelector('.arrow__name').textContent = d.name;
    const thumb = btn.querySelector('.arrow__thumb');
    thumb.style.setProperty('--tc', d.tone);
    thumb.classList.toggle('is-dark', d.dark);
    thumb.querySelector('use').setAttribute('href', `#${d.icon}`);
    btn.setAttribute('aria-label', `${dir} κατηγορία: ${d.name}`);
  };

  function go(i, announce = true) {
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
    paintArrow(prevBtn, info[(index - 1 + total) % total], 'Προηγούμενη');
    paintArrow(nextBtn, info[(index + 1) % total], 'Επόμενη');
    currentEl.textContent = pad(index + 1);
    if (announce) liveEl.textContent = `Κατηγορία ${index + 1} από ${total}: ${info[index].name}`;
    // κεντράρει το ενεργό tab στο ευρετήριο χωρίς να κουνάει τη σελίδα
    const t = tabs[index];
    indexEl.scrollTo({ left: t.offsetLeft - (indexEl.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    restart();
  }

  prevBtn.addEventListener('click', () => { stopAutoplay(); go(index - 1); });
  nextBtn.addEventListener('click', () => { stopAutoplay(); go(index + 1); });

  /* πλήκτρα ← → : στο ευρετήριο (roving tabindex) και γενικά όταν το carousel είναι ορατό */
  let carouselVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { carouselVisible = en.isIntersecting; }, { threshold: 0.35 }).observe(viewport);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const inTabs = indexEl.contains(e.target);
    if (!inTabs && !carouselVisible && !carousel.contains(e.target)) return;
    e.preventDefault();
    stopAutoplay();
    go(index + (e.key === 'ArrowRight' ? 1 : -1));
    if (inTabs) tabs[index].focus({ preventScroll: true });
  });
  indexEl.addEventListener('keydown', (e) => {
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      stopAutoplay();
      go(e.key === 'Home' ? 0 : total - 1);
      tabs[index].focus({ preventScroll: true });
    }
  });

  /* autoplay: παύει σε hover/focus, σταματά οριστικά με κάθε αλληλεπίδραση,
     δεν ξεκινά καθόλου με prefers-reduced-motion */
  let start = 0, elapsed = 0, raf = 0, paused = false, stopped = reduceMotion;
  const tick = (now) => {
    if (!start) start = now - elapsed;
    elapsed = now - start;
    barEl.style.width = `${Math.min(elapsed / AUTOPLAY_MS, 1) * 100}%`;
    if (elapsed >= AUTOPLAY_MS) { go(index + 1, false); return; }
    raf = requestAnimationFrame(tick);
  };
  function restart() {
    cancelAnimationFrame(raf);
    start = 0; elapsed = 0;
    barEl.style.width = stopped ? `${((index + 1) / total) * 100}%` : '0%';
    if (!stopped && !paused) raf = requestAnimationFrame(tick);
  }
  const paintPlay = () => {
    playBtn.querySelector('use').setAttribute('href', stopped ? '#i-play' : '#i-pause');
    playBtn.setAttribute('aria-label', stopped ? 'Έναρξη αυτόματης εναλλαγής' : 'Παύση αυτόματης εναλλαγής');
  };
  function stopAutoplay() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    paintPlay();
    restart();
  }
  playBtn.addEventListener('click', () => {
    if (stopped) { stopped = false; paused = false; paintPlay(); restart(); }
    else stopAutoplay();
  });
  const pause = () => { paused = true; cancelAnimationFrame(raf); start = 0; };
  const resume = () => { if (!paused) return; paused = false; if (!stopped) raf = requestAnimationFrame(tick); };
  carousel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(); });
  carousel.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') resume(); });
  carousel.addEventListener('focusin', (e) => { if (e.target !== playBtn) pause(); });
  carousel.addEventListener('focusout', (e) => { if (!carousel.contains(e.relatedTarget)) resume(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));

  /* swipe σε touch (και drag με ποντίκι) */
  let x0 = null, y0 = 0, dx = 0, locked = null;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('a, button, input, select')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; locked = null;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (locked === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
      locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (locked === 'x') { viewport.setPointerCapture(e.pointerId); track.classList.add('is-dragging'); stopAutoplay(); }
    }
    if (locked !== 'x') return;
    dx = mx;
    track.style.transform = `translateX(calc(${-index * 100}% + ${dx * 0.85}px))`;
  });
  const endDrag = () => {
    if (x0 === null) return;
    const wasX = locked === 'x';
    x0 = null; locked = null;
    track.classList.remove('is-dragging');
    if (!wasX) return;
    const threshold = Math.min(80, viewport.clientWidth * 0.16);
    if (dx < -threshold) go(index + 1);
    else if (dx > threshold) go(index - 1);
    else go(index, false);
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  paintPlay();
  go(0, false);

  /* ---------- ετικέτες κατηγοριών: ήπια εμφάνιση ---------- */
  const labelItems = document.querySelectorAll('.labels li');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.filter((en) => en.isIntersecting).forEach((en, n) => {
        en.target.style.transitionDelay = `${n * 60}ms`;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    labelItems.forEach((li) => io.observe(li));
  } else {
    labelItems.forEach((li) => li.classList.add('is-in'));
  }

  /* ---------- φόρμα B2B (χωρίς backend → mailto) ---------- */
  const form = document.getElementById('b2bForm');
  const note = form.querySelector('.b2b__form-note');
  const vat = form.elements.vat;
  vat.addEventListener('input', () => { vat.value = vat.value.replace(/\D/g, '').slice(0, 9); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad = null;
    form.querySelectorAll('input').forEach((input) => {
      input.value = input.value.trim();
      const ok = input.value !== '' && input.checkValidity();
      input.classList.toggle('is-invalid', !ok);
      if (ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
      if (!ok && !firstBad) firstBad = input;
    });
    if (firstBad) {
      note.className = 'b2b__form-note is-error';
      const msgs = {
        vat: 'Το ΑΦΜ πρέπει να έχει ακριβώς 9 ψηφία.',
        email: 'Ελέγξτε τη διεύθυνση email.'
      };
      note.textContent = (firstBad.value && msgs[firstBad.name]) || (firstBad.name === 'vat' ? msgs.vat : 'Συμπληρώστε όλα τα πεδία.');
      firstBad.focus();
      return;
    }
    const d = new FormData(form);
    const body = [
      `Επωνυμία: ${d.get('company')}`,
      `ΑΦΜ: ${d.get('vat')}`,
      `Email: ${d.get('email')}`,
      `Τηλέφωνο: ${d.get('phone')}`,
      `Τύπος επιχείρησης: ${d.get('type')}`
    ].join('\n');
    window.location.href = `mailto:info@newsystem.gr?subject=${encodeURIComponent('Αίτηση λογαριασμού B2B')}&body=${encodeURIComponent(body)}`;
    note.className = 'b2b__form-note is-ok';
    note.textContent = 'Ανοίξαμε το πρόγραμμα email σας με έτοιμη την αίτηση. Πατήστε «Αποστολή» για να ολοκληρωθεί.';
  });
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.classList.contains('is-invalid') && el.value.trim() !== '' && el.checkValidity()) {
      el.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
