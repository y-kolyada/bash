#!/usr/bin/env python3
"""Оболочка страницы: пути к оснастке, ссылки между языками, встроенные значки.

Шапка, навигация и переключатель языков на 68 страницах должны быть
одинаковыми. Руками это не держится: одна забытая страница - и читатель
проваливается в 404 или остаётся без кнопки копирования. Поэтому механика
переписывается скриптом, а не руками, и скрипт лежит в репозитории - его можно
запустить снова после любого переезда или добавления страницы.

Запуск (из корня репозитория):
    python3 tools/build-nav.py            # все языки
    python3 tools/build-nav.py ru en      # только эти папки

Скрипт идемпотентен: второй запуск ничего не меняет.

Ключ --migrate включает одно дополнительное правило, нужное только при переезде
с плоского корня: имя файла без языкового суффикса в нерусской странице
означало ссылку на русскую версию (так были устроены заглушки). После переезда
то же самое имя означает страницу рядом, в своей папке, поэтому правило
выключено по умолчанию и само отключается на странице, которая уже переехала
(признак - путь ../assets/). Без этой оговорки второй запуск с --migrate
переписал бы всю навигацию нерусских страниц на русские версии: проверено,
51 страница.

ЧТО ОН ДЕЛАЕТ
  1. Пути к оснастке: style.css и скрипты лежат в assets/, страницы - в папке
     языка, поэтому ссылка всегда ../assets/<файл>.
  2. Ссылки между страницами. Имя файла теперь одно на все языки, язык задаёт
     папка: своя страница - то же имя рядом, чужой язык - ../<язык>/<имя>.
  3. Файлы занятий переехали в lessons/.
  4. Значки - встроенный SVG вместо эмодзи. Эмодзи на машине без шрифта с
     эмодзи рисуется пустым квадратом: так уже было со значком кнопки
     копирования (⧉), и это видно только на снимке, глазами.
"""

import os
import re
import sys

LANGS = ('ru', 'en', 'uk', 'de')
ASSETS = ('style.css', 'swa.js', 'terms.js', 'cp.js')
PAGE = re.compile(r'(?P<attr>href=")(?P<name>index|glossary|[0-9]{2})(?:-(?P<lang>en|uk|de))?\.html')
LESSON = re.compile(r'(href=")((?:zadanie|zapis)-[0-9]+\.md|potom\.md|review-gemini-[0-9]+\.md)"')

# ЗНАЧКИ ЖИВУТ ЗДЕСЬ, А НЕ В СТРАНИЦАХ. Каждый помечен data-icon, и генератор
# умеет перерисовать его на всех страницах разом: иначе правка формы значка
# превращается в правку 68 файлов руками. Рисунок занимает поле целиком, иначе
# значок рядом с текстом выглядит мелким и поднятым, как верхний индекс.
def icon(name, body):
    return ('<svg class="icon" data-icon="%s" viewBox="0 0 20 20" width="16" height="16" '
            'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true">%s</svg>' % (name, body))


BOOK = icon('book',
            '<path d="M2.6 3.8h4.8a2.6 2.6 0 0 1 2.6 2.6v10a2.2 2.2 0 0 0-2.2-1.8H2.6z"/>'
            '<path d="M17.4 3.8h-4.8a2.6 2.6 0 0 0-2.6 2.6v10a2.2 2.2 0 0 1 2.2-1.8h5.2z"/>')
TARGET = icon('target',
              '<circle cx="10" cy="10" r="7.4"/><circle cx="10" cy="10" r="3.6"/>'
              '<circle cx="10" cy="10" r="0.7" fill="currentColor"/>')
SUN = icon('sun',
           '<circle cx="10" cy="10" r="3.8"/><path d="M10 1.2v2.2M10 16.6v2.2M1.2 10h2.2'
           'M16.6 10h2.2M3.7 3.7l1.6 1.6M14.7 14.7l1.6 1.6M16.3 3.7l-1.6 1.6'
           'M5.3 14.7l-1.6 1.6"/>')
ICONS = {'book': BOOK, 'target': TARGET, 'sun': SUN}
REDRAW = re.compile(r'<svg class="icon".*?</svg>', re.S)


def which(svg):
    """Какой это значок. По data-icon, а для старой разметки - по рисунку:
    книга - два пути без окружностей, мишень - три окружности, солнце - и то и
    другое."""
    mark = re.search(r'data-icon="([a-z]+)"', svg)
    if mark:
        return mark.group(1) if mark.group(1) in ICONS else None
    circles, paths = svg.count('<circle'), svg.count('<path')
    if circles and paths:
        return 'sun'
    if circles:
        return 'target'
    return 'book' if paths == 2 else None


def rewrite(text, lang, migrate=False):
    counts = {'assets': 0, 'pages': 0, 'lessons': 0, 'icons': 0}
    if '../assets/' in text:
        migrate = False  # страница уже переехала, правило переезда не нужно

    for name in ASSETS:
        for attr in ('href', 'src'):
            before = text
            text = text.replace('%s="%s' % (attr, name), '%s="../assets/%s' % (attr, name))
            if text != before:
                counts['assets'] += 1

    def page(m):
        other = m.group('lang')
        name = m.group('name')
        attr = m.group('attr')
        if other is None:
            if lang == 'ru' or not migrate:
                return m.group(0)
            counts['pages'] += 1
            return '%s../ru/%s.html' % (attr, name)
        counts['pages'] += 1
        if other == lang:
            return '%s%s.html' % (attr, name)
        return '%s../%s/%s.html' % (attr, other, name)

    text = PAGE.sub(page, text)

    # ССЫЛКА НА ПАПКУ ОТКРЫВАЕТ СПИСОК ФАЙЛОВ. На сервере href="./" отдаёт
    # index.html, а при открытии страницы из файловой системы - каталог. Сайт
    # обязан работать обоими способами, поэтому путь всегда явный.
    before_dir = text
    text = text.replace('href="./"', 'href="index.html"')
    if text != before_dir:
        counts['pages'] += 1

    def lesson(m):
        counts['lessons'] += 1
        return '%s../lessons/%s"' % (m.group(1), m.group(2))

    text = LESSON.sub(lesson, text)

    for emoji, svg in (('📖', BOOK), ('🎯', TARGET), ('☼', SUN), ('☾', SUN)):
        counts['icons'] += text.count(emoji)
        text = text.replace(emoji, svg)

    def redraw(m):
        name = which(m.group(0))
        if name is None:
            return m.group(0)
        fresh = ICONS[name]
        if fresh != m.group(0):
            counts['icons'] += 1
        return fresh

    text = REDRAW.sub(redraw, text)

    return text, counts


def main(argv):
    args = [a for a in argv[1:] if not a.startswith('--')]
    migrate = '--migrate' in argv[1:]
    roots = [d for d in (args or LANGS) if os.path.isdir(d)]
    if not roots:
        print('нет папок языков - запускайте из корня репозитория')
        return 2

    total = {'files': 0, 'touched': 0, 'assets': 0, 'pages': 0, 'lessons': 0, 'icons': 0}
    for lang in roots:
        for name in sorted(os.listdir(lang)):
            if not name.endswith('.html'):
                continue
            path = os.path.join(lang, name)
            with open(path, encoding='utf-8') as handle:
                before = handle.read()
            after, counts = rewrite(before, lang, migrate)
            total['files'] += 1
            for key in counts:
                total[key] += counts[key]
            if after != before:
                total['touched'] += 1
                with open(path, 'w', encoding='utf-8') as handle:
                    handle.write(after)

    print()
    print('  Оболочка страниц')
    print('  ' + '-' * 46)
    print('  страниц просмотрено:   %d' % total['files'])
    print('  страниц изменено:      %d' % total['touched'])
    print('  путей к оснастке:      %d' % total['assets'])
    print('  ссылок между страницами: %d' % total['pages'])
    print('  ссылок на занятия:     %d' % total['lessons'])
    print('  значков заменено:      %d' % total['icons'])
    print('  ' + '-' * 46)
    print()
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
