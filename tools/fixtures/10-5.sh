# ru/10.html · 4 · Цикл по файлам
# A name with a space is the whole point: the correct loop keeps it, the one
# through $(ls) splits it in two.
#@ want: обрабатываю: old file.log
#@ want: обрабатываю: old
: > "old file.log"
: > app.log
