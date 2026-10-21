# devops-bash · сайт-ассессмент по Bash

Сайт для инженера, который готовится к ассессменту, сертификации или интервью по Bash:
ключевые компоненты языка, сила и границы, взаимосвязи с остальным инструментом, практики в
контексте AI, Clouds, DevOps и SRE, разборы трёх уровней и банк из 150 вопросов с ответами.

Один из сайтов серии **AI Factory**. Архитектура - **Simple Web Architecture**: статический
HTML и CSS, минимум ванильного JavaScript, ноль бэкенда, ноль сборки. Страницу можно открыть
двойным щелчком из файловой системы, и она работает целиком.

**Опубликовано:** https://y-kolyada.github.io/bash/

---

## Как здесь всё лежит

| Где | Что |
| :-- | :-- |
| `index.html` | дверь: выбор языка и переход на `ru/` |
| `check.sh` | проверка сайта одной командой: ЗЕЛЁНОЕ или КРАСНОЕ |
| `ru/` `en/` `uk/` `de/` | страницы: по 17 на язык, имена одинаковые (`index.html`, `01.html` … `15.html`, `glossary.html`) |
| `assets/` | оснастка: `style.css`, `swa.js`, `search.js`, `terms.js`, `cp.js`, индексы поиска `search-<язык>.js`, картинки в `assets/img/` |
| `tools/` | проверки и генераторы |
| `lessons/` | задания, записи занятий, находки переводчика `notes-N.md` и `backlog.md` |
| `AGENTS.md` | правила для ИИ-агентов: роли, стоп-кран, инварианты страницы |

**Имя файла одно на все языки, язык задаёт папка.** Ссылка на свою страницу - то же имя
рядом, на чужой язык - `../<язык>/<имя>.html`. Оболочку страниц (пути к оснастке, ссылки
между языками, значки) переписывает скрипт, а не руки:

```bash
python3 tools/build-nav.py
```

---

## Проверка

```bash
npm i playwright                                     # один раз
npx playwright install chromium chromium-headless-shell
./check.sh
```

`./check.sh` отвечает одним словом и запускает шесть проверок из `tools/`. По отдельности
они нужны, когда надо понять причину:

| Команда | Что устанавливает |
| :-- | :-- |
| `tools/check-page.sh ru/01.html` | страница есть, не пустая, заголовок свой |
| `tools/check-claims.sh` | утверждения сайта о Bash выполняются в терминале прямо сейчас |
| `tools/check-examples.sh` | примеры со страниц `10`-`12` запускаются: сколько исполнено, сколько только разобрано |
| `python3 tools/check-links.py` | все внутренние ссылки и якоря: сколько и сколько битых |
| `python3 tools/build-search.py --check` | индекс поиска отвечает страницам, а не вчерашнему их состоянию |
| `node tools/check-pages.mjs` | все страницы на экране 390px, липкая панель, подсветка раздела, плавающие кнопки, поиск |

Остальные инструменты запускаются руками, когда нужны:

| Команда | Что делает |
| :-- | :-- |
| `python3 tools/build-nav.py` | переписывает оболочку страниц: пути к оснастке, ссылки между языками, значки |
| `python3 tools/build-nav.py --relink <язык>` | ссылки на ещё не переведённые страницы ведут в русскую версию, и обратно после перевода |
| `python3 tools/build-search.py` | пересобирает индексы поиска `assets/search-<язык>.js` |
| `python3 tools/check-struct.py [язык]` | сверяет перевод с русским оригиналом: якоря, разделы, блоки кода, число вопросов, алфавит |
| `node tools/shot.mjs ru/01.html` | снимок одной страницы: `phone.png`, смотреть глазами |

Заготовки для примеров второго рода лежат в `tools/fixtures/`: по файлу на блок кода,
который без подготовки не запустится.

**Зелёная проверка - не доказательство, что страница правдива.** Она доказывает, что
страница существует, не разъезжается и что проверяемые утверждения выполнились. Смысл
читает человек.

---

## Языки

Порядок переключателя - `EN | RU | UK | DE`. Русский - оригинал. Английский переведён
полностью, все 17 страниц. Украинский в работе. Немецкий - честные заглушки со ссылкой на
английскую версию: это решение, а не отставание, и оно написано прямо на тех страницах.

**Якорь не зависит от языка.** Все `id` английские и одинаковые во всех четырёх языках,
поэтому переключатель языков оставляет читателя в том же разделе, а ссылка из словаря ведёт в
раздел на любом языке. Переименовывает их только скрипт, с проверкой ссылок.

---

## Ветки и публикация

`dev` - работа. `prod` - то, что отдано в GitHub Pages. Мерж `dev → prod` делается через
`--no-ff` и только на зелёной проверке, чтобы каждая поставка была видна в истории одним
узлом. `git push` и мерж в `prod` делает человек.

---

## Как это делается

Три артефакта на каждое занятие: **задание** (`lessons/step-N.md`) пишется до работы,
**запись** (`lessons/record-N.md`) фиксирует, что получилось на самом деле, и **проверка**
отвечает ЗЕЛЁНОЕ или КРАСНОЕ. Отложенное уходит в `lessons/backlog.md` строкой из трёх полей:
что, зачем, **почему не сейчас**. Правила работы ИИ в этом репозитории - в
[`AGENTS.md`](./AGENTS.md).

---

## The same, in English

**devops-bash** is a Bash assessment site from the AI Factory series: key components of the
language, its strengths and limits, how it connects to Git, CI, containers and systemd,
practices for AI, cloud, DevOps and SRE contexts, worked examples at three levels and a bank
of 150 interview questions with answers.

It is a **Simple Web Architecture** project: static HTML and CSS, a little vanilla
JavaScript, no backend, no build step. Pages live under one folder per language (`ru/`, `en/`,
`uk/`, `de/`) and share the same filenames; the engine is in `assets/`, the checks and
generators in `tools/`, the lesson records in `lessons/`. Russian is the original, English is complete, Ukrainian is in progress and German is an
honest stub. Anchors are English and identical in every language.

`./check.sh` answers green or red. It verifies that pages exist, that every internal link and
anchor resolves, that the site's claims about Bash still hold when executed in a terminal, that
the code examples on the Examples pages still run, that the search index matches the pages, and
that nothing overflows a 390px screen.
