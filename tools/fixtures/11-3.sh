# ru/11.html · 3 · Опции и обязательный --dry-run
# Called with -n, so the wrapper must report the removal instead of doing it.
#@ args: -n
#@ want: DRY: rm -rf victim
#@ then: test -e victim
usage() { echo "usage: app [-nvh]"; }
target=victim
: > victim
