# Запись

**Что получилось на самом деле.** Текст набирает ИИ. Что в нём должно быть - задание Архитектора. Что в нём правда - проверка Приёмщика.

---

## Запись 28

**Задание:** из [`zadanie-28.md`](./zadanie-28.md)

**Дата:** 2026-10-19

**Ветка:** `dev` · **Исполнитель:** Gemini · **Приёмщик:** Conductor

**Что ИИ сказал, что сделал:**

1. **Вычитка и аудит всех 52 описаний страниц по дизайн-книге §5.9:**
   - Проверены первые предложения лидов (`<p class="lead">`) на 52 страницах: 17 в `ru`, 17 в `en`, 17 в `uk` и `de/index.html`. Шестнадцать немецких страниц-заглушек (`de/01`..`de/15`, `de/glossary`) не содержат лида и помечены `---`.
   - **48 описаний признаны самодостаточными («стоит само»):** укладываются в лимит 160 символов, не имеют отсылок к другим страницам, не повторяют дословно `<h1>` и понятно формулируют тему страницы для карточки мессенджера или поисковой выдачи без контекста сайта.
   - **4 описания переписаны («переписано»):**
     - `en/07.html`: сокращено со 177 до 144 знаков (`awaiting readiness` -> `polling for readiness`, `access without static keys` -> `keyless access`, `guardrails against the wrong account` -> `account guardrails`, `tag-based cleanup` -> `tag cleanup`).
     - `en/09.html`: сокращено со 176 до 139 знаков (`Incident triage in sixty seconds` -> `Sixty-second incident triage`, `parsing logs without killing the node` -> `safe log parsing`, `protecting production from scripts themselves` -> `shielding production from scripts`).
     - `uk/09.html`: сокращено со 161 до 157 знаков (`приховані відмови диска та пам'яті` -> `приховані збої диска й пам’яті`, с заменой ASCII-апострофа на типографский `’`).
     - `de/index.html`: сокращено со 173 до 134 знаков (`die sich auf eine Zertifizierung oder ein technisches Interview vorbereiten` -> `vor Zertifizierung oder technischem Interview`).

2. **Сохранение разметки и чистота изменений:**
   - Изменено исключительно первое предложение `<p class="lead">` на четырёх указанных страницах.
   - Блоки кода (`<pre><code>`), якоря, идентификаторы (`id=`), заголовки (`<h1>`), служебные блоки (`page-size`, `pager`) и блок `<!-- meta: ... -->` не затрагивались.
   - `python3 tools/check-struct.py en uk de/index.html` подтверждает идентичность структуры страниц (ЗЕЛЁНОЕ).
   - `python3 tools/build-meta.py --descriptions` возвращает 0 дефектов (ЗЕЛЁНОЕ).
   - В соответствии с решением Архитектора генераторы страниц (`build-meta.py`, `build-search.py`) не запускались поверх файлов продукта до приёмки задания Conductor'ом.

3. **Измерение цены работы:**
   - **Доля правок:** 4 из 52 описаний (7.7%) потребовали сокращения.
   - **Время выполнения:** ~15 минут.
   - **Типовая ошибка:** перечисления тем через запятую в переводных версиях разрастались по длине сильнее лаконичного русского оригинала и превышали бюджет 160 символов.

---

## Проверка по предикатам

| Предикат | Да или нет | Чем проверен |
| :-- | :-- | :-- |
| 1 · Ни одного дефектного описания из 52 | **ДА** | машиной: `python3 tools/build-meta.py --descriptions` печатает ЗЕЛЁНОЕ (`описаний: 52, заглушек: 16, с дефектом: 0`) и возвращает код 0 |
| 2 · Все 52 описания прочитаны и названы | **ДА** | глазами Приёмщика по таблице ниже: ровно 52 строки, пропусков нет, 48 «стоит само», 4 «переписано» со старым и новым текстом |
| 3 · Правка не вышла за первое предложение лида | **ДА** | машиной: `python3 tools/check-struct.py en uk de/index.html` -> ЗЕЛЁНОЕ; `git diff` не содержит строк внутри `<pre>`, строк с `id=` и строк внутри `<!-- meta: ... -->` |

---

## Таблица всех 52 описаний

| № | Страница | Статус | Знаков | Описание / Правка |
| :-- | :-- | :-- | :-- | :-- |
| 1 | `ru/index.html` | **стоит само** | 134 | Справочник-ассессмент по Bash для инженера, который готовится к сертификации, техническому интервью или просто хочет перестать гадать. |
| 2 | `ru/01.html` | **стоит само** | 49 | Шесть механизмов, из которых собран любой скрипт. |
| 3 | `ru/02.html` | **стоит само** | 105 | Правила и техники, которые отличают скрипт, работающий на вашей машине, от скрипта, работающего на чужой. |
| 4 | `ru/03.html` | **стоит само** | 110 | Почему язык, которому сорок лет, не вытеснили ни Python, ни Go, ни одна из оболочек, придуманных ему на смену. |
| 5 | `ru/04.html` | **стоит само** | 96 | Честный список того, что в Bash устроено плохо, и признаки, по которым видно: задача уже не его. |
| 6 | `ru/05.html` | **стоит само** | 112 | Где Bash стыкуется с Git, CI, Docker, systemd, Make и Ansible - и что в каждом из этих швов ломается чаще всего. |
| 7 | `ru/06.html` | **стоит само** | 136 | Как работать с ИИ-агентом над shell-кодом: где он ошибается предсказуемо, как ставить задание, чем его проверять и чего ему не доверять. |
| 8 | `ru/07.html` | **стоит само** | 146 | CLI облака, ожидание готовности, доступы без ключей, лимиты API, защита от чужого аккаунта и уборка по тегам - и где проходит граница с Terraform. |
| 9 | `ru/08.html` | **стоит само** | 99 | Bash в конвейере поставки: сборка, среды, деплой и откат, проверки до слияния и работа с секретами. |
| 10 | `ru/09.html` | **стоит само** | 152 | Триаж инцидента за минуту, скрытые отказы диска и памяти, разбор логов без добивания узла, защита продакшна от самих скриптов и метрики для мониторинга. |
| 11 | `ru/10.html` | **стоит само** | 53 | Шесть разборов для уровня «запускаю и иногда правлю». |
| 12 | `ru/11.html` | **стоит само** | 64 | Семь приёмов для уровня «мои скрипты работают на чужих машинах». |
| 13 | `ru/12.html` | **стоит само** | 58 | Шесть решений уровня «я решаю, появится ли скрипт вообще». |
| 14 | `ru/13.html` | **стоит само** | 58 | Пятьдесят вопросов начального уровня с короткими ответами. |
| 15 | `ru/14.html` | **стоит само** | 34 | Пятьдесят вопросов боевого уровня. |
| 16 | `ru/15.html` | **стоит само** | 49 | Пятьдесят вопросов о решениях, а не о синтаксисе. |
| 17 | `ru/glossary.html` | **стоит само** | 68 | Двадцать два понятия, которые на страницах сайта уже не объясняются. |
| 18 | `en/index.html` | **стоит само** | 134 | A Bash reference and assessment site for engineers preparing for a certification, a technical interview, or simply done with guessing. |
| 19 | `en/01.html` | **стоит само** | 46 | The six mechanisms every script is built from. |
| 20 | `en/02.html` | **стоит само** | 104 | Rules and techniques separating a script that runs on your machine from one that runs on someone else's. |
| 21 | `en/03.html` | **стоит само** | 107 | Why a forty-year-old language was not displaced by Python, Go, or any of the shells designed to replace it. |
| 22 | `en/04.html` | **стоит само** | 90 | An honest inventory of what Bash does poorly, and the signals that a task has outgrown it. |
| 23 | `en/05.html` | **стоит само** | 113 | Where Bash interfaces with Git, CI, Docker, systemd, Make, and Ansible - and what breaks most often at each seam. |
| 24 | `en/06.html` | **стоит само** | 148 | How to work with an AI agent on shell code: where it fails predictably, how to specify tasks, how to verify output, and what never to trust it with. |
| 25 | `en/07.html` | **переписано** | 144 | **Было:** Cloud CLIs, awaiting readiness, access without static keys, API limits, guardrails against the wrong account, and tag-based cleanup - and where the boundary with Terraform lies.<br>**Стало:** Cloud CLIs, polling for readiness, keyless access, API limits, account guardrails, and tag cleanup - and where the boundary with Terraform lies. |
| 26 | `en/08.html` | **стоит само** | 115 | Bash in delivery pipelines: builds, environments, deployments and rollbacks, pre-merge checks, and secret handling. |
| 27 | `en/09.html` | **переписано** | 139 | **Было:** Incident triage in sixty seconds, hidden disk and memory failures, parsing logs without killing the node, protecting production from scripts themselves, and monitoring metrics.<br>**Стало:** Sixty-second incident triage, hidden disk and memory failures, safe log parsing, shielding production from scripts, and monitoring metrics. |
| 28 | `en/10.html` | **стоит само** | 68 | Six breakdowns for the “I run and occasionally tweak scripts” level. |
| 29 | `en/11.html` | **стоит само** | 75 | Seven techniques for the “my scripts run on other people's machines” level. |
| 30 | `en/12.html` | **стоит само** | 76 | Six decisions for the “I decide whether a script should exist at all” level. |
| 31 | `en/13.html` | **стоит само** | 50 | Fifty foundational questions with concise answers. |
| 32 | `en/14.html` | **стоит само** | 33 | Fifty production-grade questions. |
| 33 | `en/15.html` | **стоит само** | 41 | Fifty questions on decisions, not syntax. |
| 34 | `en/glossary.html` | **стоит само** | 73 | Twenty-two concepts that the site's pages will not stop to explain again. |
| 35 | `uk/index.html` | **стоит само** | 128 | Довідник-асесмент по Bash для інженера, який готується до сертифікації, технічного інтерв’ю або просто хоче перестати вгадувати. |
| 36 | `uk/01.html` | **стоит само** | 50 | Шість механізмів, з яких зібрано будь-який скрипт. |
| 37 | `uk/02.html` | **стоит само** | 103 | Правила та техніки, які відрізняють скрипт, що працює на вашій машині, від скрипта, що працює на чужій. |
| 38 | `uk/03.html` | **стоит само** | 106 | Чому мову, якій сорок років, не витіснили ані Python, ані Go, ані жодна з оболонок, вигаданих їй на зміну. |
| 39 | `uk/04.html` | **стоит само** | 96 | Чесний список того, що в Bash влаштовано погано, і ознаки, за якими видно: завдання вже не його. |
| 40 | `uk/05.html` | **стоит само** | 112 | Де Bash стикується з Git, CI, Docker, systemd, Make та Ansible - і що в кожному з цих швів ламається найчастіше. |
| 41 | `uk/06.html` | **стоит само** | 142 | Як працювати з ШІ-агентом над shell-кодом: де він помиляється передбачувано, як ставити завдання, чим його перевіряти й чого йому не довіряти. |
| 42 | `uk/07.html` | **стоит само** | 150 | CLI хмари, очікування готовності, доступи без ключів, ліміти API, захист від чужого акаунту та прибирання за тегами - і де проходить межа з Terraform. |
| 43 | `uk/08.html` | **стоит само** | 108 | Bash у конвеєрі постачання: збірка, середовища, деплой та відкат, перевірки до злиття та робота з секретами. |
| 44 | `uk/09.html` | **переписано** | 157 | **Было:** Тріаж інциденту за хвилину, приховані відмови диска та пам'яті, розбір логів без добивання вузла, захист продакшену від самих скриптів і метрики для моніторингу.<br>**Стало:** Тріаж інциденту за хвилину, приховані збої диска й пам’яті, розбір логів без добивання вузла, захист продакшену від самих скриптів і метрики для моніторингу. |
| 45 | `uk/10.html` | **стоит само** | 54 | Шість розборів для рівня «запускаю й іноді правитиму». |
| 46 | `uk/11.html` | **стоит само** | 63 | Сім прийомів для рівня «мої скрипти працюють на чужих машинах». |
| 47 | `uk/12.html` | **стоит само** | 60 | Шість рішень рівня «я вирішую, чи з’явиться скрипт узагалі». |
| 48 | `uk/13.html` | **стоит само** | 59 | П’ятдесят питань початкового рівня з короткими відповідями. |
| 49 | `uk/14.html` | **стоит само** | 32 | П’ятдесят питань бойового рівня. |
| 50 | `uk/15.html` | **стоит само** | 49 | П’ятдесят питань про рішення, а не про синтаксис. |
| 51 | `uk/glossary.html` | **стоит само** | 64 | Двадцять два поняття, які на сторінках сайту вже не пояснюються. |
| 52 | `de/index.html` | **переписано** | 134 | **Было:** Referenz und Assessment zu Bash für Ingenieure, die sich auf eine Zertifizierung oder ein technisches Interview vorbereiten oder einfach Schluss mit dem Raten machen wollen.<br>**Стало:** Referenz und Assessment zu Bash für Ingenieure vor Zertifizierung oder technischem Interview, die Schluss mit dem Raten machen wollen. |

---

## Я принял или вернул

<!-- Это графа Приёмщика. ИИ её не заполняет. -->


**Если вернул - по какому предикату и почему:**

<!-- Это графа Приёмщика. ИИ её не заполняет. -->
