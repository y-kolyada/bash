#!/usr/bin/env bash
# Claim check: the site's statements about Bash are executed, not re-read.
#
#     tools/check-claims.sh
#
# Each line is a claim, a command and the expected output. If Bash behaves
# differently, the site is wrong somewhere. Output is Russian: it speaks to the
# person who accepts the work.
#
# Separate from the page check on purpose: that one turns red when markup
# breaks, this one when knowledge does, and the reason for red must be obvious.
#
# The claims come from independent reviews and from returns: every one of them
# once stood on the site in a wrong form or was under suspicion.

set -uo pipefail

FAIL=0
g() { printf '\033[32m%s\033[0m' "$1"; }
r() { printf '\033[31m%s\033[0m' "$1"; }

# claim "<what the site states>" "<expected output>" <command...>
claim() {
  local text=$1 want=$2; shift 2
  local got
  got=$("$@" 2>/dev/null)
  if [ "$got" = "$want" ]; then
    printf '  [ %s ] %s\n' "$(g 'ДА ')" "$text"
  else
    printf '  [ %s ] %s\n' "$(r 'НЕТ')" "$text"
    printf '        -> ждали «%s», получили «%s»\n' "$want" "$got"
    FAIL=$((FAIL + 1))
  fi
}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo
echo "  Проверка фактов сайта"
echo "  ----------------------------------------------"

claim "pipefail отдаёт код последнего упавшего звена" "5" \
  bash -o pipefail -c '(exit 2) | (exit 5) | true; echo $?'

claim "параметры и арифметика раскрываются одним проходом" "2 2" \
  bash -c 'x=1; echo $((x=2)) $x'

claim "trap EXIT не срабатывает при SIGKILL" "137" \
  bash -c 'bash -c "trap \"echo CLEANUP\" EXIT; kill -9 \$\$" 2>/dev/null; echo $?'

claim "wait без аргументов возвращает 0 при упавшем процессе" "0" \
  bash -c '(exit 7) & wait; echo $?'

claim "обёртка dry-run не перехватывает перенаправление" "[dry] echo new" \
  bash -c "f=$tmp/f; echo secret > \"\$f\"; dry() { echo \"[dry] \$*\"; }; dry echo new > \"\$f\"; cat \"\$f\""

claim "curl | bash исполняет пришедшее до обрыва" "executed rc=0" \
  bash -c '(printf "echo executed\n"; exit 18) | bash | tr -d "\n"; echo " rc=$?"'

claim "незакавыченная переменная раскрывает шаблон" "a.log b.log" \
  bash -c "cd $tmp && touch a.log b.log && v='*.log' && echo \$v"

claim "\$10 - это \$1 и символ 0" "a0 TEN" \
  bash -c 'set -- a b c d e f g h i TEN; echo "$10 ${10}"'

claim "[ - встроенная команда, [[ - ключевое слово" "builtin keyword" \
  bash -c 'echo "$(type -t [) $(type -t [[)"'

claim "фоновый процесс без перенаправлений держит вывод" "1" \
  bash -c 's=$SECONDS; out=$(sleep 1 & echo ok); echo $((SECONDS - s >= 1 ? 1 : 0))'

claim "шаблон без совпадений остаётся строкой" "$tmp/*.none" \
  bash -c "for f in $tmp/*.none; do echo \"\$f\"; done"

claim "local в dash есть" "1" \
  dash -c 'f() { local x=1; echo $x; }; f'

claim "((i++)) от нуля роняет скрипт под set -e" "1" \
  bash -c 'bash -c "set -e; i=0; ((i++)); echo reached"; echo $?'

claim "local x=\$(cmd) маскирует ошибку подстановки" "0" \
  bash -c 'set -e; f() { local x=$(false); }; f; echo $?'

claim "exit в функции под \$( ) не завершает скрипт" "alive 3" \
  bash -c 'f() { exit 3; }; v=$(f); echo "alive $?"'

claim "yes | head -n 1 под pipefail возвращает 141 (SIGPIPE)" "141" \
  bash -o pipefail -c 'yes | head -n 1 >/dev/null; echo $?'

claim "подстановка процесса <(cmd) раскрывается в /dev/fd/N" "ok" \
  bash -c 'p=$(echo <(true)); [[ $p =~ ^/dev/fd/[0-9]+$ ]] && echo ok'

claim "flock -n отклоняет параллельный запуск на занятом дескрипторе" "busy" \
  bash -c "exec 9>\"$tmp/lck\"; flock -n 9; flock -n \"$tmp/lck\" true || echo busy"

claim "truncate по имени удалённого файла не освобождает место" "5242880" \
  bash -c "d=$tmp/tr; mkdir -p \$d; dd if=/dev/zero of=\$d/log bs=1M count=5 2>/dev/null; exec 7<>\$d/log; rm \$d/log; truncate -s 0 \$d/log; stat -L -c %s /proc/\$\$/fd/7"

claim "усечение через /proc/PID/fd освобождает место" "0" \
  bash -c "d=$tmp/tr2; mkdir -p \$d; dd if=/dev/zero of=\$d/log bs=1M count=5 2>/dev/null; exec 7<>\$d/log; rm \$d/log; : > /proc/\$\$/fd/7; stat -L -c %s /proc/\$\$/fd/7"

echo "  ----------------------------------------------"
if [ "$FAIL" -eq 0 ]; then
  printf '  %s\n\n' "$(g 'ЗЕЛЁНОЕ')"
else
  printf '  %s  - строк со словом НЕТ: %s\n\n' "$(r 'КРАСНОЕ')" "$FAIL"
fi
[ "$FAIL" -eq 0 ]
