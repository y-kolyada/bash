# ru/10.html · 6 · Чтение файла построчно
# Leading spaces and a backslash check what IFS= and -r are there for.
#@ want: строка:   с отступом
#@ want: строка: C:\new
printf '  с отступом\nC:\\new\n' > names.txt
