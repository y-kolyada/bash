// glaza.mjs - глаза для ИИ.
//
//   npm i playwright          (один раз, в папке своего проекта)
//   node glaza.mjs index.html
//
// Открывает твою страницу так, как её увидит телефон, и говорит, что с ней не
// так. ИИ сам страницу не видит: он читает текст файлов. Этот скрипт - то, чем
// он смотрит.
//
// Возвращает 1, если что-то вылезло за край, и 0, если всё в порядке. Поэтому
// из него можно сделать проверку, а не только запускать руками.
//
// ПОЧЕМУ playwright СТАВИТСЯ ИМЕННО В ПАПКУ ПРОЕКТА. Если его там нет, node
// идёт искать выше - в родительские папки - и может найти ЧУЖОЙ, другой
// версии. Тогда ошибка будет про невидимый файл браузера, а не про то, что
// установка не там. Так и случилось при первой проверке этого скрипта.

const file = process.argv[2] || 'index.html';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('playwright не найден. Поставь его в ЭТОЙ папке:');
  console.error('    npm init -y');
  console.error('    npm i playwright');
  console.error('    npx playwright install chromium chromium-headless-shell');
  process.exit(2);
}

// Путь может быть и адресом, и именем файла, и полным путём от корня.
const url = file.startsWith('http') ? file
  : 'file://' + (file.startsWith('/') ? file : process.cwd() + '/' + file);

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  console.error('браузер не запустился: ' + String(e.message).split('\n')[0]);
  console.error('если написано "Executable doesn\'t exist" - браузер не скачан:');
  console.error('    npx playwright install chromium chromium-headless-shell');
  console.error('если написано "error while loading shared libraries" - системе не хватает библиотек,');
  console.error('покажи эту строку тренеру: нужен пароль взрослого.');
  process.exit(2);
}

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url);

// Всё меряется внутри страницы: этот код выполняется в самом браузере.
const beda = await page.evaluate(() => {
  const okno = document.documentElement.clientWidth;
  const vylezli = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.right > okno + 1) vylezli.push(el.tagName + ': ' + el.textContent.trim().slice(0, 30));
  }
  return { okno, stranica: document.documentElement.scrollWidth, vylezli };
});

console.log('экран телефона: ' + beda.okno + 'px, страница: ' + beda.stranica + 'px');
console.log(beda.vylezli.length ? 'за край вылезло: ' + beda.vylezli.length : 'за край ничего не вылезло');
for (const v of beda.vylezli.slice(0, 5)) console.log('  ' + v);

await page.screenshot({ path: 'telefon.png', fullPage: true });
console.log('снимок: telefon.png - посмотри на него сам');

await browser.close();
process.exit(beda.vylezli.length ? 1 : 0);
