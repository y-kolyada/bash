#!/usr/bin/env python3
"""Сверка переведённой страницы с русским оригиналом.

Перевод обязан остаться переводом: та же структура, те же якоря, те же команды.
Проверяется машиной, потому что принимать полсотни страниц на языке, которого
не читаешь, иначе нельзя - это чтение наугад.

Запуск (из корня репозитория):
    python3 tools/check-struct.py en            все страницы языка
    python3 tools/check-struct.py en/01.html    одна страница
    python3 tools/check-struct.py uk de         несколько языков

ЧТО СВЕРЯЕТСЯ

  1. Якоря: набор и порядок всех id совпадают с оригиналом. Ссылка из словаря,
     из другого раздела и из чужого языка должна попасть в то же место.
  2. Разделы: число заголовков h2 с якорем.
  3. Блоки кода: их число и СКЕЛЕТ каждого - то, что остаётся после удаления
     комментариев и человеческих строк в кавычках. Комментарии переводятся,
     команда - нет: grep -q не должен стать grep -Q.
  4. Вопросы: число пунктов в банке и ровно 50 на страницах уровней.
  5. Язык: в английской и немецкой странице не осталось кириллицы; в
     украинской есть её собственные буквы (і, ї, є, ґ) и нет русских (ы, э, ъ).
  6. Оболочка: 15 пунктов навигации, переключатель на четыре языка, и в
     странице не осталось карточки-заглушки «перевод готовится».
"""

import os
import re
import sys

SOURCE = 'ru'
LANGS = ('en', 'uk', 'de')
SECTIONS = 15

STRIP = re.compile(r'<script\b.*?</script>|<!--.*?-->', re.S | re.I)
ID = re.compile(r'\bid\s*=\s*"([^"]+)"')
H2 = re.compile(r'<h2\b[^>]*\bid\s*=\s*"[^"]+"', re.I)
CODE = re.compile(r'<pre\b[^>]*>\s*<code\b[^>]*>(.*?)</code>\s*</pre>', re.S | re.I)
QA_ITEM = re.compile(r'<ol class="qa"[^>]*>(.*?)</ol>', re.S | re.I)
NAV_ITEM = re.compile(r'<nav class="sessions".*?</nav>', re.S | re.I)
LANG_LINK = re.compile(r'<div class="lang-switcher".*?</div>', re.S | re.I)
ENTITIES = (('&lt;', '<'), ('&gt;', '>'), ('&quot;', '"'), ('&#39;', "'"), ('&amp;', '&'))

# Символы, по которым слово опознаётся как код, а не как человеческая речь.
# Точка сюда не входит: «subst.» и «подстановка» - это перевод, а не команда.
CODEISH = set('${}()[]<>*~|&/=+\\`!%^"\'')

CYRILLIC = re.compile(r'[\u0400-\u04FF]')
UK_OWN = re.compile(r'[іїєґІЇЄҐ]')
RU_ONLY = re.compile(r'[ыэъЫЭЪ]')

# Комментарий начинается с # в начале слова: внутри ${v#x} решётка не комментарий.
COMMENT = re.compile(r'(?m)(?:(?<=\s)|^)#.*$')
# Человеческая строка в кавычках переводится, строка с подстановкой - нет.
QUOTED = re.compile(r'"([^"\\$`]*)"|\'([^\'\\$`]*)\'')


def read(path):
    with open(path, encoding='utf-8') as handle:
        return handle.read()


def unescape(text):
    for what, to in ENTITIES:
        text = text.replace(what, to)
    return text


def skeleton(code):
    code = COMMENT.sub('', unescape(code))
    code = QUOTED.sub('""', code)
    return ' '.join(code.split())


def shape(code):
    """Форма блока: сколько строк и какие в нём «кодовые» слова. Словами из
    букв схема и отличается от перевода, а {a,b}, $var и *.txt обязаны
    совпасть."""
    text = unescape(code)
    tokens = [t for t in text.split() if any(ch in CODEISH for ch in t)]
    return (len(text.strip().splitlines()), tokens)


def is_scheme(code):
    """Схема, а не команды: после снятия комментариев и человеческих строк в
    русском оригинале осталась кириллица. Такие блоки переводятся целиком -
    сверять их посимвольно нельзя, но форма обязана остаться той же."""
    return bool(CYRILLIC.search(skeleton(code)))


def facts(path):
    raw = read(path)
    text = STRIP.sub(' ', raw)
    nav = NAV_ITEM.search(text)
    switcher = LANG_LINK.search(text)
    qa = []
    for block in QA_ITEM.findall(text):
        qa.append(block.count('<li>'))
    return {
        'ids': ID.findall(text),
        'sections': len(H2.findall(text)),
        'codes': [skeleton(c) for c in CODE.findall(text)],
        'shapes': [shape(c) for c in CODE.findall(text)],
        'schemes': [is_scheme(c) for c in CODE.findall(text)],
        'questions': sum(qa),
        'nav': nav.group(0).count('<li>') if nav else 0,
        'langs': switcher.group(0).count('<a ') if switcher else 0,
        'stub': 'stub-card' in text,
        'raw': raw,
    }


def compare(target, source, lang):
    bad = []
    a, b = facts(target), facts(source)

    if a['ids'] != b['ids']:
        only_here = [i for i in a['ids'] if i not in b['ids']]
        only_there = [i for i in b['ids'] if i not in a['ids']]
        if only_here or only_there:
            bad.append('якоря разошлись: лишние %s, потерянные %s'
                       % (only_here[:3] or '-', only_there[:3] or '-'))
        else:
            bad.append('якоря те же, но в другом порядке')
    if a['sections'] != b['sections']:
        bad.append('разделов %d, в оригинале %d' % (a['sections'], b['sections']))
    if len(a['codes']) != len(b['codes']):
        bad.append('блоков кода %d, в оригинале %d' % (len(a['codes']), len(b['codes'])))
    else:
        for n in range(len(b['codes'])):
            if b['schemes'][n]:
                if a['shapes'][n] != b['shapes'][n]:
                    bad.append('схема %d: форма разошлась с оригиналом (строк %d против %d)'
                               % (n + 1, a['shapes'][n][0], b['shapes'][n][0]))
                    break
            elif a['codes'][n] != b['codes'][n]:
                bad.append('блок кода %d изменён: %s'
                           % (n + 1, a['codes'][n][:60] or '(пусто)'))
                break
    if a['questions'] != b['questions']:
        bad.append('вопросов %d, в оригинале %d' % (a['questions'], b['questions']))
    elif a['questions'] and a['questions'] != 50:
        bad.append('вопросов %d, а на странице уровня их ровно 50' % a['questions'])
    if a['nav'] != SECTIONS:
        bad.append('пунктов навигации %d вместо %d' % (a['nav'], SECTIONS))
    if a['langs'] != 4:
        bad.append('в переключателе языков %d ссылки вместо четырёх' % a['langs'])
    if a['stub']:
        bad.append('осталась карточка «перевод готовится»')

    if lang in ('en', 'de'):
        left = CYRILLIC.findall(a['raw'])
        left = [c for c in left if c not in '\u0410']  # подпись кнопки шрифта, чиненная генератором
        if left:
            bad.append('осталась кириллица: %d символов' % len(left))
    elif lang == 'uk':
        if not UK_OWN.search(a['raw']):
            bad.append('нет украинских букв (і, ї, є, ґ) - страница не переведена')
        if RU_ONLY.search(a['raw']):
            bad.append('остались русские буквы ы, э, ъ')
    return bad


def pages(args):
    out = []
    for arg in args:
        if os.path.isfile(arg):
            out.append(arg)
        elif os.path.isdir(arg):
            out += [os.path.join(arg, n) for n in sorted(os.listdir(arg)) if n.endswith('.html')]
    return out


def main(argv):
    args = argv[1:] or list(LANGS)
    targets = pages(args)
    if not targets:
        print('нечего сверять: укажите язык (en) или страницу (en/01.html)')
        return 2

    rows = []
    for target in targets:
        lang, name = os.path.split(target)
        lang = os.path.basename(lang)
        source = os.path.join(SOURCE, name)
        if lang == SOURCE:
            continue
        if not os.path.isfile(source):
            rows.append((target, ['нет русского оригинала ' + source]))
            continue
        rows.append((target, compare(target, source, lang)))

    broken = [r for r in rows if r[1]]
    print()
    print('  Сверка перевода с оригиналом')
    print('  ' + '-' * 46)
    for target, bad in rows:
        mark = 'ДА ' if not bad else 'НЕТ'
        print('  [ %s ] %s' % (mark, target))
        for line in bad:
            print('        -> %s' % line)
    print('  ' + '-' * 46)
    print('  страниц сверено: %d, расходятся: %d' % (len(rows), len(broken)))
    print('  %s' % ('КРАСНОЕ' if broken else 'ЗЕЛЁНОЕ'))
    print()
    return 1 if broken else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
