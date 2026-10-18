// check-pages.mjs - все страницы сайта одним запуском браузера.
//
//   node tools/check-pages.mjs            # все страницы репозитория
//   node tools/check-pages.mjs ru en      # только эти папки
//
// Мерит две вещи, которые нельзя увидеть в тексте файла:
//
//   1. ТЕЛЕФОН. Ширина экрана 390px: ничто не должно вылезать за край.
//      То же, что делает glaza.mjs, но по всем страницам и без снимка -
//      снимок смотрят глазами по одной странице, а это проверка.
//
//   2. ЛИПКАЯ ПАНЕЛЬ. На широком экране навигация - position: sticky, и она
//      не может выйти за границу своего контейнера (сетки .cols). Если под
//      сеткой есть пустое дно, то на дне страницы панель прижимается к этой
//      границе и уезжает ВВЕРХ, за край окна: её первые пункты недостижимы ни
//      прокруткой панели (её scrollTop уже 0), ни прокруткой страницы (она
//      уже внизу). Так было потеряно 118px - два первых раздела сайта.
//      Поэтому мерим, на сколько пикселей панель спрятана над окном: 0 или брак.
//
// Возвращает 1, если хоть одна страница в браке.

import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.claude', '.agents', '__pycache__']);
const PHONE = { width: 390, height: 844 };
// ДВЕ ВЫСОТЫ ОКНА, И ЭТО НЕ ПЕРЕСТРАХОВКА. Подсветка последнего раздела
// отваливалась только на высоких окнах: страница упиралась в дно раньше, чем
// заголовок доезжал до верхней трети. На 860px всё было зелено, дефект нашёл
// Приёмщик глазами на своём экране.
const DESKTOPS = [{ width: 1280, height: 860 }, { width: 1280, height: 1400 }];
const STICKY_TOP = 18; // то же значение, что в style.css у nav.sessions
// Под закреплённой шапкой панель начинается на 12px ниже её нижнего края,
// поэтому ожидаемая граница считается от шапки, а не от верха окна.

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('playwright не найден. Поставьте его в этой папке:');
  console.error('    npm i playwright');
  console.error('    npx playwright install chromium chromium-headless-shell');
  process.exit(2);
}

function pages(root) {
  const found = [];
  for (const name of readdirSync(root).sort()) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(root, name);
    if (statSync(path).isDirectory()) found.push(...pages(path));
    else if (name.endsWith('.html')) found.push(path);
  }
  return found;
}

const roots = process.argv.slice(2);
const files = (roots.length ? roots : ['.']).flatMap((r) => (statSync(r).isDirectory() ? pages(r) : [r]));

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  console.error('браузер не запустился: ' + String(e.message).split('\n')[0]);
  console.error('    npx playwright install chromium chromium-headless-shell');
  process.exit(2);
}

const phone = await browser.newPage({ viewport: PHONE });
const desktops = [];
for (const viewport of DESKTOPS) desktops.push([viewport, await browser.newPage({ viewport })]);
const bad = [];

for (const file of files) {
  const url = 'file://' + resolve(file);

  await phone.goto(url);
  const overflow = await phone.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.getBoundingClientRect().right > viewport + 1) {
        out.push(el.tagName + ': ' + el.textContent.trim().slice(0, 30));
      }
    }
    return out;
  });

  if (overflow.length) bad.push([file, 'за край вылезло элементов: ' + overflow.length + ' (' + overflow[0] + ')']);

  for (const [viewport, desktop] of desktops) {
    await desktop.goto(url);
    const seen = await desktop.evaluate(async (top) => {
      const sleep = () => new Promise((r) => setTimeout(r, 120));
      const nav = document.querySelector('nav.sessions');
      if (!nav) return null;
      const links = [...document.querySelectorAll('#tocList a')];

      // 1. Верх панели на дне страницы: не должен уехать ни за верхний край
      //    окна, ни под закреплённую шапку.
      window.scrollTo(0, document.scrollingElement.scrollHeight);
      await sleep();
      nav.scrollTop = 0;
      const head = document.querySelector('header.top');
      const stuck = head && getComputedStyle(head).position === 'sticky';
      const want = stuck ? Math.round(head.getBoundingClientRect().bottom) + top - 6 : top;
      const hidden = Math.max(0, Math.round(want - nav.getBoundingClientRect().top) - 2);

      // 2. Последний раздел подсвечен, когда страница на дне.
      const active = document.querySelector('#tocList a.active');
      const spyOk = !links.length || (active && active === links[links.length - 1]);

      // 3. Последний пункт панели достижим её собственной прокруткой.
      window.scrollTo(0, 0);
      await sleep();
      // ДВА ПРИСВОЕНИЯ, А НЕ ОДНО. После смены предела высоты браузер зажимает
      // первое присвоение по прежнему размеру панели и не доезжает до конца
      // (измерено: 769 вместо 794). Человек с колесом этого не замечает - он
      // просто крутит дальше, - а проверка иначе краснеет на честной странице.
      nav.scrollTop = nav.scrollHeight;
      await sleep();
      nav.scrollTop = nav.scrollHeight;
      await sleep();
      const last = links[links.length - 1];
      const below = last ? Math.round(last.getBoundingClientRect().bottom - window.innerHeight) : 0;

      return { hidden, spyOk, below: Math.max(0, below) };
    }, STICKY_TOP);

    if (!seen) continue;
    const where = ' (окно ' + viewport.height + 'px)';
    if (seen.hidden) bad.push([file, 'на дне страницы панель спрятана над окном на ' + seen.hidden + 'px' + where]);
    if (!seen.spyOk) bad.push([file, 'на дне страницы последний раздел не подсвечен в навигаторе' + where]);
    if (seen.below) bad.push([file, 'последний пункт панели не достать прокруткой: ниже окна на ' + seen.below + 'px' + where]);
  }
}

await browser.close();

console.log();
console.log('  Проверка страниц: телефон 390px и липкая панель');
console.log('  ' + '-'.repeat(46));
console.log('  страниц проверено: ' + files.length);
console.log('  в браке:           ' + bad.length);
for (const [file, why] of bad.slice(0, 20)) console.log('        -> ' + file + ': ' + why);
if (bad.length > 20) console.log('        -> ... и ещё ' + (bad.length - 20));
console.log('  ' + '-'.repeat(46));
console.log('  ' + (bad.length ? 'КРАСНОЕ' : 'ЗЕЛЁНОЕ'));
console.log();
process.exit(bad.length ? 1 : 0);
