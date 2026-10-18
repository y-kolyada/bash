# ru/11.html · 5 · Параллельная обработка
#@ want: обработан logs/a.log
process() { echo "обработан $1"; }
work() { sleep 0.1; }
mkdir -p logs
: > logs/a.log
: > logs/b.log
