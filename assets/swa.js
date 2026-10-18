// swa.js - Simple Web Architecture utilities: theme, font scale & dynamic in-page TOC
(function () {
  // 1. Theme: restore and toggle
  const savedTheme = localStorage.getItem('ai-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // Inline SVG for the same reason as every other icon: the sun and moon
  // characters are missing from many fonts and render as empty boxes.
  const icon = (name, body) => '<svg class="icon" data-icon="' + name + '"'
    + ' viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor"'
    + ' stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'
    + ' aria-hidden="true">' + body + '</svg>';
  const SUN = icon('sun', '<circle cx="10" cy="10" r="3.8"/><path d="M10 1.2v2.2M10 16.6v2.2'
    + 'M1.2 10h2.2M16.6 10h2.2M3.7 3.7l1.6 1.6M14.7 14.7l1.6 1.6M16.3 3.7l-1.6 1.6'
    + 'M5.3 14.7l-1.6 1.6"/>');
  const MOON = icon('moon', '<path d="M16.4 12.6A7.4 7.4 0 0 1 7.4 3.6a7.4 7.4 0 1 0 9 9z"/>');

  const themeToggle = document.getElementById('themeToggle');
  function updateThemeUI() {
    if (!themeToggle) return;
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const isDark = currentTheme === 'dark' ||
      (!currentTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const icon = themeToggle.querySelector('.theme-icon');
    if (icon) {
      icon.innerHTML = isDark ? MOON : SUN;
    }
  }

  if (themeToggle) {
    updateThemeUI();
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const isDark = currentTheme === 'dark' ||
        (!currentTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const nextTheme = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('ai-theme', nextTheme);
      updateThemeUI();
    });
  }

  // 2. Font size: S / M / L
  const savedFont = localStorage.getItem('ai-font') || 'm';
  document.documentElement.setAttribute('data-font', savedFont);

  const fontBtns = document.querySelectorAll('.font-btn');
  function updateFontUI(activeSize) {
    fontBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-size') === activeSize);
    });
  }
  updateFontUI(savedFont);

  fontBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = btn.getAttribute('data-size');
      if (!size) return;
      document.documentElement.setAttribute('data-font', size);
      localStorage.setItem('ai-font', size);
      updateFontUI(size);
    });
  });

  // 3. Pinned header height. Anchor offset and sidebar position depend on it,
  //    and CSS cannot compute it: it follows the font size and the tagline.
  const header = document.querySelector('header.top');

  function fitHeader() {
    if (!header) return;
    const stuck = getComputedStyle(header).position === 'sticky';
    const height = stuck ? Math.round(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--header-h', height + 'px');
  }

  // 4. In-page table of contents and scroll spy
  let fitNav = function () {};
  let markActive = function () {};

  const tocContainer = document.getElementById('pageToc');
  const tocList = document.getElementById('tocList');
  if (tocContainer && tocList) {
    const items = Array.from(document.querySelectorAll('main h2[id], main .glossary-term[id]'));
    if (items.length > 0) {
      tocList.innerHTML = '';
      items.forEach((item) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + item.id;
        // A term card keeps its title in a nested h2/h3; a section is its own title.
        const titleEl = item.matches('.glossary-term')
          ? item.querySelector('h2, h3')
          : item;
        const text = titleEl ? titleEl.cloneNode(true) : item.cloneNode(true);
        const yakor = text.querySelector('.yakor');
        if (yakor) yakor.remove();
        const obj = text.querySelector('.glossary-object');
        if (obj) obj.remove();
        a.textContent = text.textContent.trim();
        li.appendChild(a);
        tocList.appendChild(li);
      });
      tocContainer.hidden = false;

      // Computed from position, not from IntersectionObserver: the last section
      // never reaches the top third on a tall window, so it was never active.
      // At the bottom of a page the last section is active by definition.
      const LINE = 0.35;

      markActive = function () {
        const line = window.innerHeight * LINE;
        let current = items[0];
        for (const item of items) {
          if (item.getBoundingClientRect().top <= line) current = item;
        }
        const doc = document.scrollingElement || document.documentElement;
        if (doc.scrollTop + window.innerHeight >= doc.scrollHeight - 2) {
          current = items[items.length - 1];
        }
        tocList.querySelectorAll('a').forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + current.id);
        });
        carryAnchor(current.id);
      };

      // Switching language keeps the place: anchors are identical in every
      // language, so the switcher only has to carry the current one. At the top
      // of a page the links stay clean; a language that lacks the section simply
      // opens at its beginning.
      function carryAnchor(id) {
        const doc = document.scrollingElement || document.documentElement;
        const keep = doc.scrollTop > 40;
        document.querySelectorAll('.lang-switcher a').forEach((link) => {
          const base = (link.getAttribute('href') || '').split('#')[0];
          link.setAttribute('href', keep ? base + '#' + id : base);
        });
      }

      // The sidebar is as tall as what is visible below it, not as the window:
      // otherwise its last items sit off screen while the header is still there.
      const nav = tocContainer.closest('nav.sessions');

      fitNav = function () {
        if (!nav || getComputedStyle(nav).position !== 'sticky') {
          if (nav) nav.style.maxHeight = '';
          return;
        }
        const top = Math.max(nav.getBoundingClientRect().top, 0);
        nav.style.maxHeight = Math.max(240, Math.round(window.innerHeight - top - 18)) + 'px';
      };
    }
  }

  // 5. Floating scroll buttons: to the top and to the bottom. Paging by screen
  //    is left to the finger and the wheel. Built here, not in the markup, so
  //    no page has to be edited to gain them.
  const SAY = {
    ru: ['В начало страницы', 'В конец страницы'],
    en: ['To the top of the page', 'To the bottom of the page'],
    uk: ['На початок сторінки', 'У кінець сторінки'],
    de: ['Zum Anfang der Seite', 'Zum Ende der Seite'],
  };
  const LONG_ENOUGH = 1.5; // shorter than this many screens needs no buttons

  function arrow(name, body) {
    return '<svg class="icon" data-icon="' + name + '" viewBox="0 0 20 20" width="22"'
      + ' height="22" fill="none" stroke="currentColor" stroke-width="1.7"'
      + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  const floats = document.createElement('div');
  floats.className = 'floats';
  floats.hidden = true;

  const says = SAY[document.documentElement.lang] || SAY.ru;
  const steps = [
    [says[0], arrow('to-top', '<path d="M5 10.5l5-5 5 5"/><path d="M5 15l5-5 5 5"/>'), 0],
    [says[1], arrow('to-bottom', '<path d="M5 5l5 5 5-5"/><path d="M5 9.5l5 5 5-5"/>'), 1],
  ];

  steps.forEach(([label, svg, toEnd]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'float-btn';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML = svg;
    btn.addEventListener('click', () => {
      const doc = document.scrollingElement || document.documentElement;
      window.scrollTo({ top: toEnd ? doc.scrollHeight : 0, behavior: 'smooth' });
    });
    floats.appendChild(btn);
  });

  document.body.appendChild(floats);

  // A collapse-all button pins itself to the same corner, so move it into the
  // stack instead of letting two buttons overlap.
  const svernut = document.querySelector('.svernut');
  if (svernut) floats.insertBefore(svernut, floats.firstChild);

  function fitFloats() {
    const doc = document.scrollingElement || document.documentElement;
    floats.hidden = doc.scrollHeight < window.innerHeight * LONG_ENOUGH;
  }

  // 6. One handler for everything that depends on scrolling and window size,
  //    throttled to an animation frame to avoid forced layout on every event.
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      fitHeader();
      fitNav();
      fitFloats();
      markActive();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  fontBtns.forEach((btn) => btn.addEventListener('click', onScroll));

  // First pass runs now, not in the next frame: until that frame the stack is
  // still hidden and the sidebar unsized, which is what a checker reads.
  fitHeader();
  fitNav();
  fitFloats();
  markActive();

  // 7. Print and PDF: expand every step for the booklet
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('details.step:not([open])').forEach((d) => {
      d.setAttribute('data-was-closed', 'true');
      d.setAttribute('open', '');
    });
  });
  window.addEventListener('afterprint', () => {
    document.querySelectorAll('details.step[data-was-closed]').forEach((d) => {
      d.removeAttribute('data-was-closed');
      d.removeAttribute('open');
    });
  });
})();
