# ru/12.html · 3 · Устойчивость к повторам
# One line in done.log after the run: the work happened exactly once.
#@ want: работаю: 7
#@ then: test "$(wc -l < done.log)" = 1
line="строка отчёта"
id=7
work() { echo "работаю: $1"; }
: > done.log
