#!/usr/bin/env bash
# Example check: the code shown on the Examples pages is executed, not trusted.
#
#     tools/check-examples.sh [page...]        default: ru/10.html ru/11.html ru/12.html
#
# Every <pre> on those pages declares its kind in the markup, so the contract
# is visible to a reader of the page and not guessed by this script:
#
#   data-run="run"     self-contained: executed as it stands
#   data-run="setup"   needs files or helper functions: the fixture
#                      tools/fixtures/<page>-<n>.sh is prepended, then executed
#   data-run="syntax"  reaches the outside world (network, /var/lock, another
#                      tool): parsed with bash -n, never executed
#
# A fixture is a plain bash prelude. Lines shaped "#@ key: value" are read by
# this script rather than by bash:
#
#   #@ args: -n victim     positional arguments for the block
#   #@ code: 2             expected exit status (default 0)
#   #@ want: DRY: rm       substring the output must contain (repeatable)
#   #@ then: test -e file  command appended after the block; failure fails it
#
# Each block runs in its own temporary directory with TMPDIR pointing there, so
# a block that calls mktemp also stays inside it: nothing is created next to the
# site. Output is Russian: it speaks to the person who accepts the work.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

PAGES=("$@")
[ ${#PAGES[@]} -gt 0 ] || PAGES=(ru/10.html ru/11.html ru/12.html)

FIXTURES=tools/fixtures
LIMIT=20

g() { printf '\033[32m%s\033[0m' "$1"; }
r() { printf '\033[31m%s\033[0m' "$1"; }

FAIL=0
RAN=0
PARSED=0

ok()  { printf '  [ %s ] %s\n' "$(g 'ДА ')" "$1"; }
bad() { printf '  [ %s ] %s\n' "$(r 'НЕТ')" "$1"; FAIL=$((FAIL + 1)); }

tmp=$(mktemp -d "${TMPDIR:-/tmp}/examples.XXXXXX") || exit 2
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/blocks"

python3 - "$tmp/blocks" "${PAGES[@]}" > "$tmp/list" <<'PY' || exit 2
import html, pathlib, re, sys

CODE = re.compile(r'<pre\b([^>]*)>\s*<code\b[^>]*>(.*?)</code>\s*</pre>', re.S | re.I)
KIND = re.compile(r'data-run="(run|setup|syntax)"')

out = pathlib.Path(sys.argv[1])
for page in sys.argv[2:]:
    text = pathlib.Path(page).read_text(encoding='utf-8')
    for number, match in enumerate(CODE.finditer(text), 1):
        found = KIND.search(match.group(1))
        name = '%s-%d' % (pathlib.Path(page).stem, number)
        (out / (name + '.sh')).write_text(html.unescape(match.group(2)) + '\n',
                                          encoding='utf-8')
        print('%s\t%s\t%s' % (page, name, found.group(1) if found else 'нет'))
PY

echo
echo "  Проверка примеров запуском"
echo

while IFS=$'\t' read -r page id kind; do
  block="$tmp/blocks/$id.sh"
  fixture="$FIXTURES/$id.sh"

  if [ "$kind" = "нет" ]; then
    bad "$id · блок без пометки data-run ($page)"
    continue
  fi

  if [ "$kind" = syntax ]; then
    if out=$(bash -n "$block" 2>&1); then
      ok "$id · разобран, не исполнялся"
      PARSED=$((PARSED + 1))
    else
      bad "$id · bash -n: $out"
    fi
    continue
  fi

  if [ "$kind" = setup ] && [ ! -f "$fixture" ]; then
    bad "$id · помечен setup, но заготовки $fixture нет"
    continue
  fi
  if [ "$kind" = run ] && [ -f "$fixture" ]; then
    bad "$id · помечен run, но у него есть заготовка $fixture"
    continue
  fi

  args=()
  want=()
  after=()
  code=0
  if [ -f "$fixture" ]; then
    while IFS= read -r line; do
      case $line in
        '#@ args: '*) read -ra args <<< "${line#'#@ args: '}" ;;
        '#@ code: '*) code="${line#'#@ code: '}" ;;
        '#@ want: '*) want+=("${line#'#@ want: '}") ;;
        '#@ then: '*) after+=("${line#'#@ then: '}") ;;
      esac
    done < "$fixture"
  fi

  dir="$tmp/work/$id"
  mkdir -p "$dir"
  {
    [ -f "$fixture" ] && cat "$fixture"
    cat "$block"
    [ ${#after[@]} -gt 0 ] && printf '%s\n' "${after[@]}"
  } > "$dir/example.sh"

  ( cd "$dir" && TMPDIR="$dir" timeout "$LIMIT" bash example.sh \
      ${args[@]+"${args[@]}"} ) > "$dir/out" 2>&1
  got=$?

  trouble=""
  [ "$got" = "$code" ] || trouble="код возврата $got, ждали $code"
  for text in ${want[@]+"${want[@]}"}; do
    grep -qF -- "$text" "$dir/out" || trouble="${trouble:+$trouble; }в выводе нет «$text»"
  done

  if [ -z "$trouble" ]; then
    ok "$id · исполнен"
    RAN=$((RAN + 1))
  else
    bad "$id · $trouble"
    sed -e 's/^/        | /' -e '12q' "$dir/out"
  fi
done < "$tmp/list"

echo
echo "  ----------------------------------------------"
printf '  исполнено блоков: %s · только разобрано: %s\n' "$RAN" "$PARSED"
echo "  ----------------------------------------------"
if [ "$FAIL" -eq 0 ]; then
  printf '  %s\n\n' "$(g 'ЗЕЛЁНОЕ')"
else
  printf '  %s  - блоков со словом НЕТ: %s\n\n' "$(r 'КРАСНОЕ')" "$FAIL"
fi

[ "$FAIL" -eq 0 ]
