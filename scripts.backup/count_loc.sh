#!/bin/bash
# EuroPrint ERP — Kod hajmi hisoblagichi (rg bilan tezlashtirilgan)
# Ishlatish: bash scripts/count_loc.sh [katalog]
set -euo pipefail

DIR="${1:-.}"

# rg --files excludes .gitignore patterns (node_modules, dist, etc.) automatically
count_loc() {
  local glob="$1"
  local label="$2"

  local files
  files=$(rg --files -g "$glob" \
    -g '!**/.git/**' -g '!**/node_modules/**' -g '!**/dist/**' \
    "$DIR" 2>/dev/null)

  if [ -z "$files" ]; then
    echo "0 0"
    return
  fi

  local file_count lines
  file_count=$(echo "$files" | wc -l)
  lines=$(echo "$files" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
  echo "$file_count ${lines:-0}"
}

echo "╔══════════════════════════════════════════════════════╗"
echo "║          EuroPrint ERP — Kod Hajmi Hisoboti          ║"
echo "║  $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

printf "%-24s %8s %12s\n" "Tur" "Fayllar" "Satrlar"
printf "%-24s %8s %12s\n" "────────────────────────" "───────" "────────────"

read -r ts_files ts_lines   <<< "$(count_loc '*.ts'  'TypeScript (.ts)'  )"
read -r tsx_files tsx_lines  <<< "$(count_loc '*.tsx' 'TypeScript (.tsx)' )"
read -r sql_files sql_lines  <<< "$(count_loc '*.sql' 'SQL'               )"
read -r sh_files sh_lines    <<< "$(count_loc '*.sh'  'Shell'             )"
read -r json_files json_lines <<< "$(count_loc '*.json' 'JSON'            )"

printf "%-24s %8d %12d\n" "TypeScript (.ts)"  "$ts_files"   "$ts_lines"
printf "%-24s %8d %12d\n" "TypeScript (.tsx)"  "$tsx_files"  "$tsx_lines"
printf "%-24s %8d %12d\n" "SQL"                "$sql_files"  "$sql_lines"
printf "%-24s %8d %12d\n" "Shell (.sh)"        "$sh_files"   "$sh_lines"
printf "%-24s %8d %12d\n" "JSON"               "$json_files" "$json_lines"
printf "%-24s %8s %12s\n" "────────────────────────" "───────" "────────────"

total_files=$(( ts_files + tsx_files + sql_files + sh_files + json_files ))
total_lines=$(( ts_lines + tsx_lines + sql_lines + sh_lines + json_lines ))
printf "%-24s %8d %12d\n" "JAMI" "$total_files" "$total_lines"

echo ""

# Module breakdown
echo "Modul bo'yicha (TypeScript):"
printf "  %-30s %8s %12s\n" "Modul" "Fayllar" "Satrlar"
printf "  %-30s %8s %12s\n" "──────────────────────────────" "───────" "────────────"

for module_dir in apps/api/src/modules/*/; do
  mod=$(basename "$module_dir")
  mod_files=$(rg --files -g "*.ts" "$module_dir" 2>/dev/null | wc -l)
  if [ "$mod_files" -gt 0 ]; then
    mod_lines=$(rg --files -g "*.ts" "$module_dir" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
    printf "  %-30s %8d %12d\n" "$mod" "$mod_files" "${mod_lines:-0}"
  fi
done

echo ""
echo "  Yakunlandi: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
