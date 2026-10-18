// swa.js - Simple Web Architecture utilities: theme, font scale & dynamic in-page TOC
(function () {
  // 1. Инициализация и переключение темы (День / Ночь)
  const savedTheme = localStorage.getItem('b1-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // Значки кнопки темы - встроенный SVG по той же причине, что и остальные:
  // символы ☼ и ☾ есть не в каждом шрифте и рисуются пустым квадратом.
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
      localStorage.setItem('b1-theme', nextTheme);
      updateThemeUI();
    });
  }

  // 2. Управление размером шрифта (S / M / L)
  const savedFont = localStorage.getItem('b1-font') || 'm';
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
      localStorage.setItem('b1-font', size);
      updateFontUI(size);
    });
  });

  // 3. Высота закреплённой шапки: от неё зависят отступ якоря и место панели.
  //    В CSS её не вычислить - она зависит от размера шрифта и длины слогана.
  const header = document.querySelector('header.top');

  function fitHeader() {
    if (!header) return;
    const stuck = getComputedStyle(header).position === 'sticky';
    const height = stuck ? Math.round(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--header-h', height + 'px');
  }

  // 4. Динамический навигатор по странице (In-Page TOC / Scroll Spy)
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
        // Берём заголовок: для карточки термина из вложенного h2/h3, иначе из самого элемента
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

      // ПОДСВЕТКА РАЗДЕЛА СЧИТАЕТСЯ ПО ПОЛОЖЕНИЮ, А НЕ ЧЕРЕЗ IntersectionObserver,
      // И ЭТО ИСПРАВЛЕНИЕ. Наблюдатель подсвечивал раздел, когда тот входил в
      // верхнюю треть окна. У последнего раздела страницы такой возможности нет:
      // страница упирается в своё дно раньше, чем он туда доедет. На окне высотой
      // 1200px и выше «Артефакты» не подсвечивались никогда - ни прокруткой, ни
      // щелчком по самому пункту. Счёт по положению такой ловушки не имеет: на
      // дне страницы активен последний раздел, это верно по определению.
      const LINE = 0.35; // та же треть экрана, что была у наблюдателя

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
      };

      // ВЫСОТА ПАНЕЛИ РАВНА ТОМУ, ЧТО ВИДНО, А НЕ ВЫСОТЕ ОКНА. Пока шапка не
      // уехала вверх, панель начинается ниже верха окна, и её низ оказывается за
      // нижним краем: последние пункты недостижимы, хотя панель «прокручена до
      // конца». Поэтому предел высоты считается от её настоящего положения.
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

  // 5. Один обработчик на всё, что зависит от прокрутки и размера окна.
  //    Пересчёт идёт в кадре отрисовки: иначе чтение размеров на каждом
  //    событии прокрутки заставляет браузер считать разметку заново.
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      fitHeader();
      fitNav();
      markActive();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  fontBtns.forEach((btn) => btn.addEventListener('click', onScroll));
  onScroll();

  // 6. Поддержка режима печати и PDF (раскрытие всех шагов для брошюры)
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
