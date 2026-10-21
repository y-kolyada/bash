# Запись

**Что получилось на самом деле.** Текст набирает ИИ. Что в нём должно быть - твоё задание. Что в нём правда - твоя проверка.

**Зачем она нужна.** В конце ИИ сам рассказывает, что он сделал. **Это его слова, а не доказательство.** Доказательство - команда `git diff`: она показывает, что изменилось в файлах на самом деле. Запись нужна, чтобы через неделю ты помнил, что просил и что из этого вышло.

---

## Запись 1

**Задание:** из [`step-1.md`](./step-1.md)

**Дата:** 2026-10-17

**Ветка:** `dev` · **Исполнитель:** Claude Code, Opus 5 · **Приёмщик:** Conductor

**Что ИИ сказал, что сделал:**

```bash
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ node glaza.mjs index.html
node:internal/modules/cjs/loader:1459
  throw err;
  ^

Error: Cannot find module '/home/ik/lab/ai-factory-builder/courses/bash/glaza.mjs'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)
    at Module._load (node:internal/modules/cjs/loader:1242:25)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v24.14.1
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ node glaza.mjs index.html
браузер не запустился: browserType.launch: Executable doesn't exist at /home/ik/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell
если написано "Executable doesn't exist" - браузер не скачан:
    npx playwright install chromium chromium-headless-shell
если написано "error while loading shared libraries" - системе не хватает библиотек,
покажи эту строку тренеру: нужен пароль взрослого.
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ npx playwright install chromium chromium-headless-shell
Downloading Chrome for Testing 148.0.7778.96 (playwright chromium v1223) from https://cdn.playwright.dev/builds/cft/148.0.7778.96/linux64/chrome-linux64.zip
175.4 MiB [====================] 100% 0.0s
Chrome for Testing 148.0.7778.96 (playwright chromium v1223) downloaded to /home/ik/.cache/ms-playwright/chromium-1223
Downloading FFmpeg (playwright ffmpeg v1011) from https://cdn.playwright.dev/dbazure/download/playwright/builds/ffmpeg/1011/ffmpeg-linux.zip
2.3 MiB [====================] 100% 0.0s
FFmpeg (playwright ffmpeg v1011) downloaded to /home/ik/.cache/ms-playwright/ffmpeg-1011
Downloading Chrome Headless Shell 148.0.7778.96 (playwright chromium-headless-shell v1223) from https://cdn.playwright.dev/builds/cft/148.0.7778.96/linux64/chrome-headless-shell-linux64.zip
113.2 MiB [====================] 100% 0.0s
Chrome Headless Shell 148.0.7778.96 (playwright chromium-headless-shell v1223) downloaded to /home/ik/.cache/ms-playwright/chromium_headless_shell-1223
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ node glaza.mjs index.html
экран телефона: 390px, страница: 390px
за край ничего не вылезло
снимок: telefon.png - посмотри на него сам
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ ./check.sh

  Проверка продукта
  ----------------------------------------------
  [ ДА  ] страница index.html на месте
  [ ДА  ] страница не пустая
  [ ДА  ] заголовок есть: Замени этот заголовок
  [ НЕТ ] заголовок всё ещё из шаблона
        -> поменяй <title> на свой - это твой продукт, не наш
  ----------------------------------------------
  КРАСНОЕ  - строк со словом НЕТ: 1

ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ git branch dev
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ git checkout dev
M       step-1.md
Switched to branch 'dev'
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ git checkout main
M       step-1.md
Switched to branch 'main'
Your branch is up to date with 'origin/main'.
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ git branch prod
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ git checkout dev
M       step-1.md
Switched to branch 'dev'
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ git status -bs
## dev
 M step-1.md
?? glaza.mjs
?? telefon.png
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ git add step-1.md && git commit -m "задание 1"
[dev 43f5dbc] задание 1
 1 file changed, 38 insertions(+), 5 deletions(-)
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ git push
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 4 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 3.93 KiB | 182.00 KiB/s, done.
Total 3 (delta 1), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (1/1), completed with 1 local object.
remote:
remote: Create a pull request for 'dev' on GitHub by visiting:
remote:      https://github.com/y-kolyada/bash/pull/new/dev
remote:
To https://github.com/y-kolyada/bash.git
 * [new branch]      dev -> dev
branch 'dev' set up to track 'origin/dev'.
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ ./check.sh

  Проверка продукта
  ----------------------------------------------
  [ ДА  ] страница index.html на месте
  [ ДА  ] страница не пустая
  [ ДА  ] заголовок есть: Bash · компоненты, практики и 150 вопросов · ai|
  [ ДА  ] заголовок свой, не из шаблона
  ----------------------------------------------
  ЗЕЛЁНОЕ
```

**Что показал `git diff`:**

```bash
ik@KL52-DEV01:~/lab/ai-factory-builder/courses/bash$ git diff
diff --git a/index.html b/index.html
index 7d5fa7d..50a67c8 100644
--- a/index.html
+++ b/index.html
@@ -3,44 +3,188 @@
 <head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
-<title>Замени этот заголовок</title>
-<style>
-  :root { --bg: #fbfbfa; --fg: #1a1a18; --dim: #6b6b66; --line: #e4e4e0; }
-  @media (prefers-color-scheme: dark) {
-    :root { --bg: #16161a; --fg: #f0f0ee; --dim: #9a9a95; --line: #2e2e34; }
-  }
-  * { box-sizing: border-box; }
-  body {
-    margin: 0; padding: 48px 16px; background: var(--bg); color: var(--fg);
-    font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
-    display: flex; justify-content: center;
-  }
-  main { max-width: 34rem; width: 100%; }
-  h1 { font-size: 1.75rem; line-height: 1.2; margin: 0 0 .75rem; }
-  p { margin: 0 0 1rem; }
-  .dim { color: var(--dim); }
-  .box { border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px; margin-top: 28px; }
-  code { background: var(--line); padding: .1em .35em; border-radius: 4px; font-size: .9em; }
-</style>
+<title>Bash · компоненты, практики и 150 вопросов · ai|</title>
+<link rel="stylesheet" href="style.css?v=1">
+<script>
+  (function() {
+    var t = localStorage.getItem('b1-theme');
+    if (t) document.documentElement.setAttribute('data-theme', t);
+    var f = localStorage.getItem('b1-font');
+    if (f) document.documentElement.setAttribute('data-font', f);
+  })();
+</script>
 </head>
 <body>
-<main>
+<div class="wrap">

-  <h1>Страница работает</h1>
+<header class="top">
+  <div class="brand-group">
+    <a class="home" href="./">
+      <span class="badge-ai">ai|</span>
+      <span class="sub-brand">devops-bash</span>
+    </a>
+    <div class="three" aria-hidden="true">компоненты · практика · 150 вопросов</div>
+  </div>

....
```


**Проверка по предикатам:**

| Предикат | Да или нет | Чем проверен |
| --- | --- | --- |
| 1 · страница своя и это карта сайта | **НЕТ** | глазами: бейдж `ai|` не отображался - `style.css` ссылается на `imgs/`, а папку не скопировали |
| 2 · оснастка работает и запоминается | ДА | глазами в браузере |
| 3 · термины объяснены | ДА | глазами в браузере |
| 4 · телефон и зелёная проверка | ДА | `node glaza.mjs index.html` → код 0; `./check.sh` → ЗЕЛЁНОЕ |

**Я принял или вернул:** **вернул по предикату 1.** Три предиката из четырёх выполнены, но без логотипа шапка не соответствует заданию. Возврат - не провал: это обычная работа.

Обсудить и доработать:

```markdown
1. "index.html - был шаблонной заглушкой, стал лендинг-картой devops-bash на русском." - посмотрел - выглядит вполне хорошо, но есть несколько вопросов:
  - не отображается изображение логотипа "ai|", напомню - у нас 2 изображения - для день и ночь
  - раздел 5 в главном меню у нас "Примеры: IGL / Pro / Noob". Может нам сделать 3 отдельных страницы для Примеры: IGL, Pro, Noob? Это как разные уровни в игре... Думаю будет лучше их разделить. А то какая-то
  каша получися когда мы будем заливать контент.
  - то же самое по разделю 6 "150 вопросов и ответов" - я бы тоже сделал 3 отдельных страницы IGL, Pro, Noob с вопросами. Что скажешь?
2. "компоненты · практика · 150 вопросов" - может слоган для Bash сделать "интсрументы · практика · 150 вопросов" ?
```

**Если вернул - по какому предикату и почему:**

1. Не принято - смотри "Обсудить и доработать:"
```markdown
**Страница есть, она своя и она - карта сайта.** Открываются два файла в корне: `index.html` (русский) и `index-en.html` (английский), совпадающие по смыслу. У каждого свой `<title>` (не шаблонный), в шапке - бейдж-инвариант `ai|` и продуктовый маркер `devops-bash`. На странице перечислены все семь целей сайта - 8.a компоненты, 8.b практики в контексте AI, 8.c взаимосвязи, 8.d слабости, 8.e примеры по уровням IGL / Pro / Noob, 8.f банк 150 вопросов и ответов, 8.z предельная лаконичность, - и у каждой одной строкой сказано, что внутри будет. Страница открывается блоком «Главная мысль» из 3–7 фраз и заканчивается секцией «Артефакты», написанной для взрослого читателя.
```
2. Принято:
```markdown
**Оснастка работает и запоминается.** Не перезагружая страницу, можно: переключить день/ночь, сменить размер шрифта тремя шагами (`А A A`), перейти RU ⇄ EN в обе стороны. Выбор темы и размера шрифта сохраняется после перезагрузки. Боковой навигатор по странице подсвечивает тот раздел, который сейчас на экране, и имеет собственную прокрутку. У каждого заголовка раздела есть значок `#`, который даёт ссылку именно на этот раздел - её можно переслать, и она открывает нужное место.
```
3. Принято:
```markdown
**Термины не оставлены без объяснения.** На лендинге не меньше пяти терминов Bash оформлены интерактивными кнопками: по нажатию показывается карточка с объяснением, на телефоне - выезжающая снизу панель. Есть страница `glossary.html` с теми же терминами, и при выключенном JavaScript термин остаётся читаемым обычным текстом.
```
4. Принято:
```markdown
**Это читается на телефоне, и проверка зелёная.** `node glaza.mjs index.html` печатает «за край ничего не вылезло» и возвращает код 0; то же для `index-en.html`. `./check.sh` печатает ЗЕЛЁНОЕ и ни одной строки со словом НЕТ. На снимке `telefon.png` слова не наезжают друг на друга - это смотрит Приёмщик глазами, скрипт этого не умеет.
```

---

## Что сделано после возврата · 2026-10-17

1. **Предикат 1, логотип.** Скопирована папка `imgs/` с двумя картинками бейджа:
   `ai-badge.png` (день) и `ai-badge-invert.png` (ночь). Причина поломки записана выше:
   скопировали `style.css`, но не то, на что он ссылается. Урок на будущее - при переносе
   оснастки переносится не файл, а файл вместе со своими ссылками.
2. **Структура сайта.** Разделы «Примеры» и «Вопросы» разнесены на три страницы каждый -
   Noob, Pro, IGL. Было 6 пунктов в навигации, стало 10. Причина: контент трёх уровней на
   одной странице смешается. Уточнение внесено в [`step-1.md`](./step-1.md).
3. **Слоган шапки.** «компоненты · практика · 150 вопросов» → «инструменты · практика ·
   150 вопросов». Решение Архитектора.
4. **[`backlog.md`](./backlog.md) заполнен** - девять строк отложенного, у каждой написано,
   почему не сейчас. Первая из них - цветовая гамма серии сайтов.

**Решение Приёмщика: принял после доработки, 2026-10-17.** Возврат по предикату 1 закрыт,
остальные три стояли с первого раза. Сайт опубликован: https://y-kolyada.github.io/bash/

**Повторная проверка после правок:** `./check.sh` → ЗЕЛЁНОЕ; `node glaza.mjs index.html` →
«за край ничего не вылезло», код 0. Предикаты 2 и 3 машиной не проверяются - их закрывает
глаз Приёмщика.

**Отдельная находка, не из задания.** `glaza.mjs` сначала отработал у ИИ и упал у Приёмщика:
у ИИ `node` нашёл `playwright` в родительской папке `ai-factory-builder`, а не в проекте.
Это ровно та ловушка, о которой предупреждает комментарий в самом `glaza.mjs`. Зелёный
результат, полученный на чужой зависимости, не считается - проверка должна падать на чистом
клоне, если ставить нечего.

---

## Правило, которое дороже всех остальных

**Слова о работе - не работа.** Сравнивай с заданием, а не с рассказом о результате.
