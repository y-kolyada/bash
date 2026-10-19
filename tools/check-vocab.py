#!/usr/bin/env python3
"""Словарь кода страницы: что на ней названо именем инструмента.

    python3 tools/check-vocab.py ru/06.html          сравнить с HEAD
    python3 tools/check-vocab.py ru/06.html prod     сравнить с другой версией
    python3 tools/check-vocab.py ru/06.html en/06.html HEAD   несколько страниц

Страницу можно и нужно сокращать: повторы уходят, и текст от этого выигрывает.
Но справочная ценность страницы - это названные в ней команды, ключи,
переменные и примеры. Потерю такой строки на тысяче слов глазами не увидеть,
а читатель, который пришёл за `set -o pipefail`, увидит сразу.

Сравниваются две вещи: блоки <pre><code> дословно и множество встроенных
<code>. Потеря - дефект и печатается списком. Появление нового - сведение, а не
дефект: страница имеет право сказать больше, чем говорила.

Вывод по-русски: он говорит тому, кто принимает работу.
"""

import re
import subprocess
import sys

BLOCK = re.compile(r'<pre\b[^>]*>\s*<code\b[^>]*>(.*?)</code>\s*</pre>', re.S | re.I)
INLINE = re.compile(r'<code\b[^>]*>(.*?)</code>', re.S | re.I)
TAG = re.compile(r'<[^>]+>')
ENTITIES = (('&lt;', '<'), ('&gt;', '>'), ('&quot;', '"'), ('&#39;', "'"),
            ('&#x27;', "'"), ('&nbsp;', ' '), ('&amp;', '&'))


def unescape(text):
    for what, to in ENTITIES:
        text = text.replace(what, to)
    return text


def plain(text):
    return ' '.join(unescape(TAG.sub(' ', text)).split())


def vocab(raw):
    """Словарь страницы: список блоков и множество встроенных имён."""
    blocks = [' '.join(unescape(b).split()) for b in BLOCK.findall(raw)]
    without = BLOCK.sub(' ', raw)
    inline = {plain(c) for c in INLINE.findall(without) if plain(c)}
    return blocks, inline


def before(ref, page):
    out = subprocess.run(['git', 'show', '%s:%s' % (ref, page)],
                         capture_output=True, text=True)
    if out.returncode:
        return None
    return out.stdout


def report(page, ref):
    was = before(ref, page)
    if was is None:
        print('  [ НЕТ ] %s: в версии %s такой страницы нет' % (page, ref))
        return ['нет страницы в ' + ref]
    with open(page, encoding='utf-8') as handle:
        now = handle.read()

    old_blocks, old_inline = vocab(was)
    new_blocks, new_inline = vocab(now)

    bad = []
    kept = [b for b in old_blocks if b in new_blocks]
    gone = [b for b in old_blocks if b not in new_blocks]
    lost = sorted(old_inline - new_inline)
    fresh = sorted(new_inline - old_inline)

    if gone:
        bad.append('блоков кода потеряно: %d' % len(gone))
    if lost:
        bad.append('имён потеряно: %d' % len(lost))

    print('  [ %s ] %s' % ('ДА ' if not bad else 'НЕТ', page))
    print('        блоков кода: %d было, %d осталось дословно' % (len(old_blocks), len(kept)))
    print('        встроенных имён: %d было, %d стало' % (len(old_inline), len(new_inline)))
    for block in gone[:4]:
        print('        -> потерян блок: %s' % block[:70])
    for name in lost[:12]:
        print('        -> потеряно имя: %s' % name)
    if len(lost) > 12:
        print('        -> ... и ещё %d' % (len(lost) - 12))
    if fresh:
        print('        новых имён: %d (%s)' % (len(fresh), ', '.join(fresh[:6])))
    return bad


def main(argv):
    args = argv[1:]
    if not args:
        print('укажите страницу: python3 tools/check-vocab.py ru/06.html [ref]')
        return 2
    ref = 'HEAD'
    pages = []
    for arg in args:
        if arg.endswith('.html'):
            pages.append(arg)
        else:
            ref = arg
    if not pages:
        print('укажите страницу: python3 tools/check-vocab.py ru/06.html [ref]')
        return 2

    print()
    print('  Словарь кода страницы против версии %s' % ref)
    print('  ' + '-' * 46)
    broken = 0
    for page in pages:
        if report(page, ref):
            broken += 1
    print('  ' + '-' * 46)
    print('  страниц сверено: %d, обеднели: %d' % (len(pages), broken))
    print('  %s' % ('\033[31mКРАСНОЕ\033[0m' if broken else '\033[32mЗЕЛЁНОЕ\033[0m'))
    print()
    return 1 if broken else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
