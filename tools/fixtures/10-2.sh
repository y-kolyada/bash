# ru/10.html · 1 · Первый скрипт: файл, права, запуск
# The block runs hello.sh, so hello.sh has to exist: it is the previous block.
#@ want: сегодня:
cat > hello.sh <<'INNER'
#!/usr/bin/env bash
echo "сегодня: $(date +%F)"
df -h / | tail -1
INNER
