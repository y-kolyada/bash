# ru/11.html · 1 · Падать громко: trap ERR с номером строки
# No preparation needed, a trigger is: a trap that never fires proves nothing.
# The failing command is appended after the block, so the handler reports its
# line and exits with its code.
#@ code: 1
#@ want: ОТКАЗ: строка
#@ then: false
