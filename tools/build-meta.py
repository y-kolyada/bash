"""Page metadata: the size in words and the links to the neighbouring topics.

    python3 tools/build-meta.py            write it into the pages
    python3 tools/build-meta.py --check    tell whether the pages are stale

WHY IT IS BAKED AND NOT COUNTED IN THE BROWSER. A number written into the markup
is visible in the browser's reading mode, in print, to a search engine and to a
reader without JavaScript, and it does not jump into place after the paint. The
price is that it goes stale when the text changes, so --check is wired into
./check.sh: edit the text, forget to rebuild, and the check turns red.

WHAT COUNTS AS A WORD. Everything inside <main>, code blocks included: that is
what the reader scrolls through. The two blocks this tool writes are stripped
before counting - otherwise the count would feed on itself.

The chain of topics is index -> 01 .. 15 -> glossary. The landing has no
previous topic, the glossary has no next one, and no empty line is printed
there. Link text is the target page's own <h1>.
"""
import html
import pathlib
import re
import sys

LANGS = ('ru', 'en', 'uk', 'de')
CHAIN = ['index'] + ['%02d' % n for n in range(1, 16)] + ['glossary']

SAY = {
    'ru': {'size': 'Слов:', 'next': 'Следующая тема:', 'prev': 'Предыдущая тема:',
           'nav': 'Соседние темы', 'home': 'Посадочная страница'},
    'en': {'size': 'Words:', 'next': 'Next topic:', 'prev': 'Previous topic:',
           'nav': 'Neighbouring topics', 'home': 'Landing page'},
    'uk': {'size': 'Слів:', 'next': 'Наступна тема:', 'prev': 'Попередня тема:',
           'nav': 'Сусідні теми', 'home': 'Посадкова сторінка'},
    'de': {'size': 'Wörter:', 'next': 'Nächstes Thema:', 'prev': 'Vorheriges Thema:',
           'nav': 'Benachbarte Themen', 'home': 'Landingpage'},
}

MAIN = re.compile(r'<main.*?</main>', re.S)
H1 = re.compile(r'<h1[^>]*>(.*?)</h1>', re.S)
SIZE_BLOCK = re.compile(r'\n?[ \t]*<p class="page-size".*?</p>', re.S)
PAGER_BLOCK = re.compile(r'\n?[ \t]*<nav class="pager".*?</nav>', re.S)
ANCHOR = re.compile(r'<a class="anchor-link".*?</a>', re.S)
TAG = re.compile(r'<[^>]+>')
WORD = re.compile(r'[^\W_]', re.UNICODE)


def plain(markup):
    return html.unescape(TAG.sub(' ', markup))


def title(page):
    text = pathlib.Path(page).read_text(encoding='utf-8')
    found = H1.search(text)
    return re.sub(r'\s+', ' ', plain(found.group(1))).strip() if found else ''


def count_words(text):
    body = MAIN.search(text)
    if not body:
        return 0
    inner = SIZE_BLOCK.sub('', body.group(0))
    inner = PAGER_BLOCK.sub('', inner)
    inner = ANCHOR.sub(' ', inner)
    return sum(1 for w in re.split(r'\s+', plain(inner)) if WORD.search(w))


def size_line(lang, words):
    return ('\n    <p class="page-size" data-words="%d">%s %d</p>'
            % (words, SAY[lang]['size'], words))


def pager_block(lang, prev_page, next_page, titles):
    say = SAY[lang]
    rows = []
    if next_page:
        rows.append('        <p class="pager-next">%s <a href="%s.html">%s</a></p>'
                    % (say['next'], next_page, titles[next_page]))
    if prev_page:
        rows.append('        <p class="pager-prev">%s <a href="%s.html">%s</a></p>'
                    % (say['prev'], prev_page, titles[prev_page]))
    if not rows:
        return ''
    return ('\n      <nav class="pager" aria-label="%s">\n%s\n      </nav>'
            % (say['nav'], '\n'.join(rows)))


def rebuild(lang, name, titles):
    page = '%s/%s.html' % (lang, name)
    text = pathlib.Path(page).read_text(encoding='utf-8')

    text = SIZE_BLOCK.sub('', text)
    text = PAGER_BLOCK.sub('', text)

    spot = CHAIN.index(name)
    prev_page = CHAIN[spot - 1] if spot > 0 else None
    next_page = CHAIN[spot + 1] if spot + 1 < len(CHAIN) else None
    pager = pager_block(lang, prev_page, next_page, titles)
    if pager:
        text = text.replace('<footer>', '<footer>' + pager, 1)

    words = count_words(text)
    text = re.sub(r'(</h1>)', lambda m: m.group(1) + size_line(lang, words), text, count=1)
    return page, text


KINDS = [
    ('разбор темы (01-09)', ['%02d' % n for n in range(1, 10)]),
    ('примеры (10-12)', ['10', '11', '12']),
    ('банк вопросов (13-15)', ['13', '14', '15']),
    ('словарь', ['glossary']),
    ('посадочная', ['index']),
]


def report_sizes(sizes):
    """Отчёт, а не вердикт: на зелёное и красное эти числа не влияют.

    Ориентир полезен одним: страница, заметно вылезшая за него, чаще всего
    содержит две темы вместо одной. Это повод посмотреть на неё, а не повод
    резать текст.
    """
    print()
    print('  Объём страниц в словах - ориентир, на вердикт не влияет')
    print('  ' + '-' * 54)
    print('  %-24s %s' % ('вид страницы', ' '.join('%9s' % lang for lang in LANGS)))
    for name, pages in KINDS:
        cells = []
        for lang in LANGS:
            got = sorted(sizes[lang][page] for page in pages)
            cells.append('%9s' % ('%d-%d' % (got[0], got[-1]) if got[0] != got[-1] else got[0]))
        print('  %-24s %s' % (name, ' '.join(cells)))
    print('  ' + '-' * 54)


def main():
    check = '--check' in sys.argv
    stale = []
    done = 0
    sizes = {lang: {} for lang in LANGS}
    for lang in LANGS:
        titles = {name: title('%s/%s.html' % (lang, name)) for name in CHAIN}
        # Заголовок лендинга - предложение, в ссылке оно нечитаемо.
        titles['index'] = SAY[lang]['home']
        for name in CHAIN:
            page, text = rebuild(lang, name, titles)
            sizes[lang][name] = count_words(text)
            before = pathlib.Path(page).read_text(encoding='utf-8')
            if text == before:
                continue
            if check:
                stale.append(page)
            else:
                pathlib.Path(page).write_text(text, encoding='utf-8')
                done += 1

    print()
    print('  Объём страниц и соседние темы')
    print('  ' + '-' * 46)
    if check:
        if stale:
            print('  устарело страниц: %d' % len(stale))
            for page in stale[:8]:
                print('        -> %s' % page)
            if len(stale) > 8:
                print('        -> ... и ещё %d' % (len(stale) - 8))
            print('  пересобрать: python3 tools/build-meta.py')
            print('  ' + '-' * 46)
            print('  \033[31mКРАСНОЕ\033[0m')
            print()
            return 1
        print('  страниц в порядке: %d' % (len(LANGS) * len(CHAIN)))
        print('  ' + '-' * 46)
        print('  \033[32mЗЕЛЁНОЕ\033[0m')
        report_sizes(sizes)
        print()
        return 0
    print('  страниц переписано: %d из %d' % (done, len(LANGS) * len(CHAIN)))
    print('  ' + '-' * 46)
    report_sizes(sizes)
    print()
    return 0


if __name__ == '__main__':
    sys.exit(main())
