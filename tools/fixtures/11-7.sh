# ru/11.html · 7 · Логирование с уровнями
# Same reason as 11-1: the functions are called after the block, and the log is
# matched in stderr, where the page says it belongs.
#@ code: 1
#@ want: [INFO] работаю
#@ want: [ERROR] упало
#@ then: info "работаю"
#@ then: die "упало"
