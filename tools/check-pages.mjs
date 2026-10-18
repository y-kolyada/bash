// check-pages.mjs - every page of the site in one browser run.
//
//   node tools/check-pages.mjs            whole repository
//   node tools/check-pages.mjs ru en      these folders only
//
// Measures what a file cannot show: the page at 390px, where nothing may run
// past the edge; the sticky sidebar, which must not be pushed above the
// viewport or out of the window; the scroll spy, where the last section must
// be active at the bottom of a page; and the floating button stack on a phone.
//
// Two window heights, because the spy failed only on tall windows: a page hits
// its bottom before the last heading reaches the top third.
//
// The phone is measured twice: at the reader's default size and at the largest
// of the three, where the text grows but the screen does not.
//
// Exits 1 if any page is faulty. Output is Russian: it speaks to the person
// who accepts the work.

import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.claude', '.agents', '__pycache__']);
const PHONE = { width: 390, height: 844 };
// Two window heights: at 860px everything was green and the defect was only
// visible on a taller screen.
const DESKTOPS = [{ width: 1280, height: 860 }, { width: 1280, height: 1400 }];
const STICKY_TOP = 18; // same value as nav.contents in style.css
// Under a pinned header the sidebar starts below its bottom edge, so the
// expected boundary is measured from the header, not from the window top.

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
// A reader who picked the largest font: the choice is read from storage by the
// inline script in <head>, so it has to be there before the page loads.
const phoneBig = await browser.newPage({ viewport: PHONE });
await phoneBig.addInitScript(() => {
  try { localStorage.setItem('swa-bash-font', 'l'); } catch (e) { /* private window */ }
});
const desktops = [];
for (const viewport of DESKTOPS) desktops.push([viewport, await browser.newPage({ viewport })]);
const bad = [];

for (const file of files) {
  const url = 'file://' + resolve(file);

  await phone.goto(url);
  // The button stack is measured on a phone: tightest screen, and the thumb.
  // Clicks are tested on one page per language, because smooth scrolling takes
  // about a second and a ten-minute check stops being run.
  const floats = await phone.evaluate(async (checkClicks) => {
    const sleep = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep();
    const doc = document.scrollingElement;
    const stack = document.querySelector('.floats');
    if (!stack) return ['стопки кнопок нет вовсе'];

    const bad = [];
    const long = doc.scrollHeight >= window.innerHeight * 1.5;
    const shown = !stack.hidden;
    if (long && !shown) bad.push('на длинной странице нет кнопок прокрутки');
    if (!long && shown) bad.push('на короткой странице кнопки прокрутки лишние');
    if (!shown) return bad;

    const btns = [...stack.children];
    const rect = (el) => el.getBoundingClientRect();
    for (const b of btns) {
      const r = rect(b);
      if (Math.round(r.width) < 44 || Math.round(r.height) < 44) {
        bad.push('кнопка меньше 44px: ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
      if (!b.getAttribute('aria-label')) bad.push('у кнопки нет доступного имени');
    }
    for (let i = 0; i < btns.length; i++) {
      for (let j = i + 1; j < btns.length; j++) {
        const a = rect(btns[i]), b = rect(btns[j]);
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
          bad.push('кнопки в стопке наезжают друг на друга');
        }
      }
    }
    const r = rect(stack);
    if (Math.round(r.right) > window.innerWidth || Math.round(r.bottom) > window.innerHeight) {
      bad.push('стопка вылезает за край экрана');
    }

    if (checkClicks && btns.length >= 2) {
      const down = btns[btns.length - 1];
      const up = btns[btns.length - 2];
      down.click();
      for (let i = 0; i < 120; i++) {
        if (doc.scrollTop + window.innerHeight >= doc.scrollHeight - 2) break;
        await sleep();
      }
      if (doc.scrollTop + window.innerHeight < doc.scrollHeight - 2) bad.push('кнопка «в конец» не доводит до низа');
      up.click();
      for (let i = 0; i < 120; i++) {
        if (doc.scrollTop === 0) break;
        await sleep();
      }
      if (doc.scrollTop !== 0) bad.push('кнопка «в начало» не доводит до верха');
    }
    return bad;
  }, /\/02\.html$/.test(file.replace(/\\/g, '/')));

  for (const why of floats) bad.push([file, why + ' (телефон)']);

  // Search opens, finds, highlights the chosen section, remembers the picked item,
  // and closes cleanly via button and Escape after reopening.
  if (/\/02\.html$/.test(file.replace(/\\/g, '/'))) {
    const search = await phone.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const button = document.querySelector('.find-btn');
      const clearMark = document.querySelector('.clear-mark-btn');
      if (!button) return ['кнопки поиска нет в шапке'];
      if (!clearMark) return ['кнопки снятия подсветки нет в шапке'];
      if (getComputedStyle(clearMark).display !== 'none') return ['кнопка снятия подсветки видна до поиска'];
      button.click();
      for (let i = 0; i < 60 && !document.querySelector('.search-input'); i++) await sleep(50);
      const panel = document.querySelector('.search-panel');
      const input = document.querySelector('.search-input');
      if (!panel || !input) return ['панель поиска не открылась'];
      // While a language is being translated its index holds the finished pages
      // only. The full path is checked where this page is in the index; where it
      // is not, the panel is still expected to open, answer and close.
      const indexed = !!(window.SEARCH && window.SEARCH.i
        .some((entry) => String(entry[0]).startsWith('02.html#')));
      input.value = 'pipefail';
      input.dispatchEvent(new Event('input'));
      await sleep(120);
      const links = [...document.querySelectorAll('.search-results a')];
      const note = document.querySelector('.search-empty');
      if (!indexed && !links.length && !note) return ['пустой ответ поиска не объяснён читателю'];
      if (indexed && !links.length) return ['поиск по слову pipefail не нашёл ничего'];
      if (indexed) {
        if (!links[0].getAttribute('href').includes('#')) return ['результат ведёт на страницу без якоря'];
        const samePage = links.find((a) => (a.getAttribute('href') || '').startsWith('02.html#'));
        if (!samePage) return ['среди результатов нет раздела текущей страницы 02.html'];
        samePage.click();
        if (getComputedStyle(panel).display !== 'none') return ['поиск не закрылся при переходе к разделу'];
        if (!document.querySelectorAll('mark.search-mark').length) return ['найденные слова не подсвечены в разделе'];
        if (getComputedStyle(clearMark).display === 'none') return ['кнопка снятия подсветки не появилась'];
        button.click();
        if (getComputedStyle(panel).display === 'none') return ['поиск не открылся повторно'];
        if (!document.querySelector('.search-results a.picked')) return ['выбранный пункт не сохранил подсветку в списке'];
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        if (getComputedStyle(panel).display !== 'none') return ['повторно открытый поиск не закрылся по Escape'];
        clearMark.click();
        if (document.querySelectorAll('mark.search-mark').length) return ['подсветка слов не снялась кнопкой очистки'];
        if (getComputedStyle(clearMark).display !== 'none') return ['кнопка снятия подсветки не скрылась после очистки'];
        return [];
      }
      document.querySelector('.search-close').click();
      if (getComputedStyle(panel).display !== 'none') return ['поиск не закрылся кнопкой закрытия'];
      button.click();
      if (getComputedStyle(panel).display === 'none') return ['поиск не открылся повторно'];
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      if (getComputedStyle(panel).display !== 'none') return ['повторно открытый поиск не закрылся по Escape'];
      return [];
    });
    for (const why of search) bad.push([file, why]);
  }

  // Телефон: меню свёрнуто в строку, и страница открывается на своём тексте.
  // Раньше заголовок начинался на 901px при экране 844px - целый экран меню
  // перед текстом, на каждой странице и при любом способе прихода.
  const fold = await phone.evaluate(async (deep) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = [];
    const nav = document.querySelector('nav.contents');
    if (!nav || !nav.querySelector('a')) return out;

    const btn = document.querySelector('.nav-fold');
    if (!btn) return ['на телефоне нет свёрнутой строки меню'];
    if (getComputedStyle(btn).display === 'none') return ['свёрнутая строка меню спрятана на телефоне'];
    if (!nav.classList.contains('nav-folded')) out.push('меню открыто при загрузке страницы');

    const main = document.querySelector('main');
    const top = main ? Math.round(main.getBoundingClientRect().top) : 0;
    if (main && top >= window.innerHeight) {
      out.push('текст не виден без прокрутки: он начинается на ' + top + 'px при экране ' + window.innerHeight + 'px');
    }

    const here = nav.querySelector('[aria-current="page"]');
    if (here) {
      const num = here.querySelector('.num');
      const title = here.textContent.replace(num ? num.textContent : '', '').trim();
      if (title && !btn.textContent.includes(title)) out.push('свёрнутая строка не называет текущую страницу');
    }

    // Разворот и касание раздела проверяются на одной странице языка: каждый
    // прыжок по якорю стоит секунды, а проверка должна оставаться запускаемой.
    if (!deep) return out;
    btn.click();
    await sleep(150);
    if (nav.classList.contains('nav-folded')) out.push('меню не разворачивается касанием');
    const items = [...nav.querySelectorAll('ol > li > a')].filter((a) => a.offsetParent);
    if (items.length !== 15) out.push('в развёрнутом меню пунктов ' + items.length + ', а не 15');
    const sections = [...document.querySelectorAll('#tocList a')].filter((a) => a.offsetParent);
    // Заглушке взять разделы неоткуда: на ней нет ни одного заголовка с якорем.
    const hasSections = document.querySelectorAll('main h2[id], main .glossary-term[id]').length > 0;
    if (here && hasSections && sections.length === 0) {
      out.push('в развёрнутом меню нет разделов текущей страницы');
    }
    if (sections.length) {
      sections[0].click();
      await sleep(350);
      if (!nav.classList.contains('nav-folded')) out.push('меню не свернулось после касания раздела');
      if (btn.getAttribute('aria-expanded') !== 'false') out.push('после сворачивания aria-expanded осталась true');
    }
    return out;
  }, /\/01\.html$/.test(file.replace(/\\/g, '/')));
  for (const why of fold) bad.push([file, why + ' (телефон)']);

  // Storage belongs to the origin, not to the folder: a sibling site published
  // under the same domain would read these keys as its own. Every key carries
  // the engine and the site - swa-bash-*. The rule is checked as a pattern, not
  // as a list of two names, so a new key cannot slip in unnamed.
  const keys = await phone.evaluate(() => {
    const src = document.documentElement.outerHTML;
    const found = [...src.matchAll(/(?:local|session)Storage\.(?:get|set|remove)Item\('([^']+)'/g)]
      .map((m) => m[1]);
    return found.filter((k) => !/^swa-bash-/.test(k));
  });
  for (const key of keys) bad.push([file, 'ключ хранилища не по шаблону swa-bash-*: ' + key]);

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

  await phoneBig.goto(url);
  const big = await phoneBig.evaluate(() => {
    const out = { font: document.documentElement.getAttribute('data-font'), over: [], early: true };
    const viewport = document.documentElement.clientWidth;
    for (const el of document.querySelectorAll('body *')) {
      if (el.getBoundingClientRect().right > viewport + 1) {
        out.over.push(el.tagName + ': ' + el.textContent.trim().slice(0, 30));
      }
    }
    // The size has to be set in <head>: applied later, the page would first
    // paint at the default size and then jump.
    const head = document.head.innerHTML;
    out.early = head.includes("'swa-bash-font'") && head.includes('data-font');
    return out;
  });
  if (big.font !== 'l') bad.push([file, 'выбранный размер шрифта не применился: data-font=' + big.font]);
  if (!big.early) bad.push([file, 'размер шрифта применяется не в <head>, страница мигнёт']);
  if (big.over.length) {
    bad.push([file, 'при большом шрифте за край вылезло элементов: ' + big.over.length + ' (' + big.over[0] + ')']);
  }

  // The font scale is measured where it was broken: the search panel. One page
  // per language is enough - the stylesheet is one.
  if (/\/01\.html$/.test(file.replace(/\\/g, '/'))) {
    const scale = await phone.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const px = (sel) => {
        const el = document.querySelector(sel);
        return el ? parseFloat(getComputedStyle(el).fontSize) : null;
      };
      const find = document.querySelector('.find-btn');
      if (!find) return ['кнопки поиска нет в шапке'];
      find.click();
      for (let i = 0; i < 60 && !document.querySelector('.search-input'); i++) await sleep(50);
      const input = document.querySelector('.search-input');
      if (!input) return ['панель поиска не открылась'];
      input.value = 'pipefail';
      input.dispatchEvent(new Event('input'));
      await sleep(150);

      const read = (size) => {
        document.querySelector('.font-' + size).click();
        return { h2: px('main h2'), where: px('.search-where'), snip: px('.search-snip') };
      };
      const small = read('s');
      const medium = read('m');
      const large = read('l');
      read('m');
      document.querySelector('.search-close').click();

      const bad = [];
      for (const part of ['h2', 'where', 'snip']) {
        if (small[part] === null) continue;
        if (!(small[part] < medium[part] && medium[part] < large[part])) {
          bad.push('размер «' + part + '» не следует за настройкой шрифта: '
                   + small[part] + ' / ' + medium[part] + ' / ' + large[part]);
        }
      }
      if (localStorage.getItem('swa-bash-font') !== 'm') bad.push('настройка шрифта не вернулась к средней');
      return bad;
    });
    for (const why of scale) bad.push([file, why + ' (телефон)']);
  }

  for (const [viewport, desktop] of desktops) {
    await desktop.goto(url);
    const seen = await desktop.evaluate(async (top) => {
      // Waiting on a timer makes a flaky check: layout is recomputed in an
      // animation frame, which under load arrives after the pause. Wait for a
      // condition instead, bounded by a timeout.
      const sleep = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      async function waitFor(ready, tries = 60) {
        for (let i = 0; i < tries; i++) {
          if (ready()) return true;
          await sleep();
        }
        return false;
      }
      const nav = document.querySelector('nav.contents');
      if (!nav) return null;
      const links = [...document.querySelectorAll('#tocList a')];

      // Разделы страницы живут внутри её пункта меню, а не отдельным блоком под
      // всем списком: иначе навигатор оказывается за кромкой панели.
      const toc = document.getElementById('pageToc');
      const here = nav.querySelector('[aria-current="page"]');
      const host = here && (here.closest('li') || here.parentElement);
      // Два случая, и они требуют разного. У страницы со своим пунктом меню
      // разделы лежат внутри этого пункта. У лендинга своего пункта нет - его
      // разделы стоят первыми в панели, над картой сайта. Заглушке вкладывать
      // нечего: разделов на ней нет, и движок блок не трогает.
      // У лендинга своего пункта нет: его разделы должны стоять выше карты
      // сайта. Проверяется порядок, а не «первый элемент»: первой в панели
      // стоит свёрнутая строка меню для телефона.
      const list = nav.querySelector('ol');
      const placed = host
        ? !!(toc && host.contains(toc))
        : !!(toc && list && (toc.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING));
      const nested = links.length === 0 || placed;
      const ownItem = !!host;
      const firstTop = links.length
        ? links[0].getBoundingClientRect().top - nav.getBoundingClientRect().top
        : 0;
      const firstVisible = links.length ? firstTop < nav.clientHeight : true;
      const navScrollBefore = nav.scrollTop;

      // 1. Top of the sidebar at the bottom of the page: neither above the
      //    window nor under the pinned header.
      const bottom = () => Math.round(document.scrollingElement.scrollTop + window.innerHeight)
        >= document.scrollingElement.scrollHeight - 2;
      window.scrollTo(0, document.scrollingElement.scrollHeight);
      await waitFor(bottom);
      await sleep();
      nav.scrollTop = 0;
      const head = document.querySelector('header.top');
      const stuck = head && getComputedStyle(head).position === 'sticky';
      const want = stuck ? Math.round(head.getBoundingClientRect().bottom) + top - 6 : top;
      const hidden = Math.max(0, Math.round(want - nav.getBoundingClientRect().top) - 2);

      // 2. The last section is active when the page is at its bottom.
      const lastLink = links[links.length - 1];
      await waitFor(() => !links.length || lastLink.classList.contains('active'));
      const active = document.querySelector('#tocList a.active');
      const spyOk = !links.length || (active && active === lastLink);

      // Switching language keeps the place: every switcher link carries the
      // anchor of the section that is current, and nothing while at the top.
      const langs = [...document.querySelectorAll('.lang-switcher a')];
      const wanted = active ? active.getAttribute('href') : '';
      const carried = !links.length || langs.every((a) => a.getAttribute('href').endsWith(wanted));

      // 3. The sidebar fits the window, so every item is reachable. Its edge is
      //    measured rather than scrolling, which the browser clamps to the old
      //    size. Worst case: the top of the page, header still in place.
      window.scrollTo(0, 0);
      await waitFor(() => Math.round(document.scrollingElement.scrollTop) === 0);
      await sleep();
      const below = Math.round(nav.getBoundingClientRect().bottom - window.innerHeight);
      const clean = langs.every((a) => !a.getAttribute('href').includes('#'));

      // Панель не ездит сама: активный пункт читатель подводит рукой.
      const navScrollKept = nav.scrollTop === navScrollBefore;

      return { hidden, spyOk, below: Math.max(0, below), carried, clean,
               nested, ownItem, firstVisible, firstTop: Math.round(firstTop),
               navVisible: nav.clientHeight, navScrollKept };
    }, STICKY_TOP);

    if (!seen) continue;
    const where = ' (окно ' + viewport.height + 'px)';
    if (seen.hidden) bad.push([file, 'на дне страницы панель спрятана над окном на ' + seen.hidden + 'px' + where]);
    if (!seen.spyOk) bad.push([file, 'на дне страницы последний раздел не подсвечен в навигаторе' + where]);
    if (!seen.carried) bad.push([file, 'переключатель языков не уносит текущий раздел' + where]);
    if (!seen.clean) bad.push([file, 'в начале страницы в ссылках языков остался якорь' + where]);
    if (seen.below > 1) bad.push([file, 'панель не помещается в окно: её низ ниже края на ' + seen.below + 'px' + where]);
    if (!seen.nested) {
      bad.push([file, seen.ownItem
        ? 'разделы страницы стоят не внутри её пункта меню' + where
        : 'у страницы нет своего пункта меню, и её разделы не подняты над картой сайта' + where]);
    }
    if (!seen.firstVisible) {
      bad.push([file, 'первый раздел не виден без прокрутки панели: он на ' + seen.firstTop + 'px при видимой части панели ' + seen.navVisible + 'px' + where]);
    }
    if (!seen.navScrollKept) bad.push([file, 'панель прокрутилась сама при прокрутке страницы' + where]);
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
