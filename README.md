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
| `assets/` | оснастка: `style.css`, `swa.js`, `terms.js`, `cp.js`, картинки в `assets/img/` |
| `tools/` | проверки и генераторы |
| `lessons/` | задания, записи занятий и `potom.md` |
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

`./check.sh` отвечает одним словом и запускает четыре проверки из `tools/`. По отдельности
они нужны, когда надо понять причину:

| Команда | Что устанавливает |
| :-- | :-- |
| `tools/check-page.sh ru/01.html` | страница есть, не пустая, заголовок свой |
| `tools/check-claims.sh` | утверждения сайта о Bash выполняются в терминале прямо сейчас |
| `python3 tools/check-links.py` | все внутренние ссылки и якоря: сколько и сколько битых |
| `node tools/check-pages.mjs` | все страницы на экране 390px и липкая панель навигации |
| `node tools/glaza.mjs ru/01.html` | снимок одной страницы: `telefon.png`, смотреть глазами |

**Зелёная проверка - не доказательство, что страница правдива.** Она доказывает, что
страница существует, не разъезжается и что проверяемые утверждения выполнились. Смысл
читает человек.

---

## Языки

Порядок переключателя - `EN | RU | UK | DE`. Русский полный. Английский переведён частично:
лендинг, первый раздел и словарь. Украинский и немецкий - честные заглушки со ссылкой на
русскую версию: это решение, а не отставание, и оно написано прямо на тех страницах.

---

## Ветки и публикация

`dev` - работа. `prod` - то, что отдано в GitHub Pages. Мерж `dev → prod` делается через
`--no-ff` и только на зелёной проверке, чтобы каждая поставка была видна в истории одним
узлом. `git push` и мерж в `prod` делает человек.

---

## Как это делается

Три артефакта на каждое занятие: **задание** (`lessons/zadanie-N.md`) пишется до работы,
**запись** (`lessons/zapis-N.md`) фиксирует, что получилось на самом деле, и **проверка**
отвечает ЗЕЛЁНОЕ или КРАСНОЕ. Отложенное уходит в `lessons/potom.md` строкой из трёх полей:
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
generators in `tools/`, the lesson records in `lessons/`. Russian is complete, English is
partial (landing page, key components, glossary), Ukrainian and German are honest stubs.

`./check.sh` answers green or red: it verifies that pages exist, that every internal link and
anchor resolves, that the site's claims about Bash still hold when executed in a terminal, and
that nothing overflows a 390px screen.
