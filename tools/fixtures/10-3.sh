# ru/10.html · 2 · Переменные и кавычки
# The page claims an unquoted rm deletes "мой" and "отчёт.txt" - that is, not
# the file itself. The appended test holds that claim to its word.
#@ want: мой отчёт.txt
#@ then: test -e "мой отчёт.txt"
: > "мой отчёт.txt"
