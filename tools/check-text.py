"""Punctuation of the pages: one rule, held by a machine rather than by memory.

    python3 tools/check-text.py

WHY THIS EXISTS. The em dash is forbidden everywhere in this project - in text,
in code and in commit messages. The rule had been broken twice by hand before
anything checked it: a rule nobody enforces is a rule nobody keeps. Output is
Russian: it speaks to the person who accepts the work.
"""
import glob
import pathlib
import re
import sys

LANGS = ('ru', 'en', 'uk', 'de')
DASH = '—'
WHERE = re.compile(r'[^<>]{0,40}' + DASH + r'[^<>]{0,40}')


def main():
    bad = []
    pages = sorted(page for lang in LANGS for page in glob.glob('%s/*.html' % lang))
    for page in pages:
        text = pathlib.Path(page).read_text(encoding='utf-8')
        for found in WHERE.finditer(text):
            bad.append((page, re.sub(r'\s+', ' ', found.group(0)).strip()))

    print()
    print('  Пунктуация страниц')
    print('  ' + '-' * 46)
    print('  страниц просмотрено: %d' % len(pages))
    print('  длинных тире:        %d' % len(bad))
    for page, piece in bad[:8]:
        print('        -> %s: %s' % (page, piece[:70]))
    if len(bad) > 8:
        print('        -> ... и ещё %d' % (len(bad) - 8))
    print('  ' + '-' * 46)
    if bad:
        print('  \033[31mКРАСНОЕ\033[0m  - длинное тире запрещено: дефис с пробелами')
        print()
        return 1
    print('  \033[32mЗЕЛЁНОЕ\033[0m')
    print()
    return 0


if __name__ == '__main__':
    sys.exit(main())
