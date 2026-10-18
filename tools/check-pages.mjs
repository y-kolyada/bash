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
// Exits 1 if any page is faulty. Output is Russian: it speaks to the person
// who accepts the work.

import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.claude', '.agents', '__pycache__']);
const PHONE = { width: 390, height: 844 };
// Two window heights: at 860px everything was green and the defect was only
// visible on a taller screen.
const DESKTOPS = [{ width: 1280, height: 860 }, { width: 1280, height: 1400 }];
const STICKY_TOP = 18; // same value as nav.sessions in style.css
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

  // Reader preference keys must carry no product marker: a page copied from
  // another site would quietly bring its own storage keys back.
  const keys = await phone.evaluate(() => {
    const src = document.documentElement.outerHTML;
    const found = [...src.matchAll(/localStorage\.(?:get|set)Item\('([^']+)'/g)].map((m) => m[1]);
    return found.filter((k) => k !== 'ai-theme' && k !== 'ai-font');
  });
  for (const key of keys) bad.push([file, 'чужой ключ настроек в странице: ' + key]);

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
      const nav = document.querySelector('nav.sessions');
      if (!nav) return null;
      const links = [...document.querySelectorAll('#tocList a')];

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

      // 3. The sidebar fits the window, so every item is reachable. Its edge is
      //    measured rather than scrolling, which the browser clamps to the old
      //    size. Worst case: the top of the page, header still in place.
      window.scrollTo(0, 0);
      await waitFor(() => Math.round(document.scrollingElement.scrollTop) === 0);
      await sleep();
      const below = Math.round(nav.getBoundingClientRect().bottom - window.innerHeight);

      return { hidden, spyOk, below: Math.max(0, below) };
    }, STICKY_TOP);

    if (!seen) continue;
    const where = ' (окно ' + viewport.height + 'px)';
    if (seen.hidden) bad.push([file, 'на дне страницы панель спрятана над окном на ' + seen.hidden + 'px' + where]);
    if (!seen.spyOk) bad.push([file, 'на дне страницы последний раздел не подсвечен в навигаторе' + where]);
    if (seen.below > 1) bad.push([file, 'панель не помещается в окно: её низ ниже края на ' + seen.below + 'px' + where]);
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
