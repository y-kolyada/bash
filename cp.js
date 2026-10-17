// cp.js - кнопка «скопировать» в каждом блоке кода.
//
// Имя файла то же, что у команды cp: копирование и есть вся его работа.
// Подключается только там, где есть блоки кода, - на заглушках он не нужен.
//
// Имена в коде английские, объяснения пока русские: код здесь профессия, а
// комментарий - урок. Комментарии переводятся на английский одним проходом в
// конце разработки сайта, когда механика перестанет меняться (potom.md).
(function () {
  // Подписи берём по языку страницы: один файл обслуживает все языки.
  var LANG = (document.documentElement.getAttribute('lang') || 'ru').slice(0, 2);
  var LABELS = {
    ru: { copy: 'Скопировать код', done: 'Скопировано', fail: 'Не удалось' },
    en: { copy: 'Copy code',       done: 'Copied',      fail: 'Failed' },
    uk: { copy: 'Скопіювати код',  done: 'Скопійовано', fail: 'Не вдалося' },
    de: { copy: 'Code kopieren',   done: 'Kopiert',     fail: 'Fehlgeschlagen' }
  };
  var label = LABELS[LANG] || LABELS.ru;

  // ДВА ПУТИ, И ВТОРОЙ - НЕ ПЕРЕСТРАХОВКА. Первое допущение автора было
  // неверным и его опровергла проверка в браузере: file:// в Chrome СЧИТАЕТСЯ
  // защищённым контекстом, и navigator.clipboard там есть. Но наличие API не
  // означает разрешения: writeText отклоняется, если у страницы нет права на
  // запись в буфер или нет фокуса. Поэтому запасной путь включается не по
  // отсутствию API, а по ЛЮБОМУ отказу - это разные условия, и проверять надо
  // именно отказ. execCommand устарел, но работает и там, где отказали.
  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    // Увести за левый край, а не спрятать display:none: скрытое поле нельзя
    // выделить, а без выделения копировать нечего.
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.top = '0';
    document.body.appendChild(area);
    area.select();
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
    area.remove();
    return copied;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text) ? Promise.resolve()
                                  : Promise.reject(new Error('both paths refused'));
      });
    }
    return fallbackCopy(text) ? Promise.resolve()
                              : Promise.reject(new Error('both paths refused'));
  }

  var blocks = document.querySelectorAll('pre > code');
  for (var i = 0; i < blocks.length; i++) {
    (function (code) {
      var pre = code.parentNode;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'cp-btn';
      button.setAttribute('aria-label', label.copy);
      // ЗНАЧОК - КАРТИНКА, А НЕ СИМВОЛ, и это тоже нашла проверка. Сначала
      // стоял типографский символ ⧉ (U+29C9): в браузере он отрисовался
      // пустым квадратом - глифа нет в стандартных шрифтах. Встроенный SVG
      // не зависит ни от шрифта, ни от внешнего файла и наследует цвет
      // кнопки через currentColor. Он скрыт от синтезатора речи: тот читает
      // aria-label кнопки, а картинка без подписи стала бы мусором в речи.
      button.innerHTML =
        '<svg class="cp-ico" aria-hidden="true" width="13" height="13" viewBox="0 0 16 16"'
        + ' fill="none" stroke="currentColor" stroke-width="1.6"'
        + ' stroke-linejoin="round">'
        + '<rect x="5.2" y="5.2" width="9" height="9" rx="1.6"/>'
        + '<path d="M10.8 2.5H3.3a1.6 1.6 0 0 0-1.6 1.6v7.5"/>'
        + '</svg>'
        + '<span class="cp-say" role="status"></span>';
      var status = button.querySelector('.cp-say');
      var timer = null;

      button.addEventListener('click', function () {
        // textContent, а не innerHTML: нужен ровно тот текст, который видно,
        // без разметки и без подставленных браузером символов.
        copyText(code.textContent).then(function () {
          respond(label.done, 'ok');
        }, function () {
          respond(label.fail, 'fail');
        });
      });

      function respond(message, state) {
        clearTimeout(timer);
        status.textContent = message;
        button.classList.add(state);
        timer = setTimeout(function () {
          status.textContent = '';
          button.classList.remove('ok', 'fail');
        }, 1500);
      }

      pre.appendChild(button);
    })(blocks[i]);
  }
})();
