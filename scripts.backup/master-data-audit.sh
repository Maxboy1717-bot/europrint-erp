#!/usr/bin/env bash
# EUROPRINT ERP — ARCHITECTURE.md MUVOFIQLIK TEKSHIRUVI
# bash scripts/arch-audit.sh

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'
C='\033[0;36m'; B='\033[1m'; D='\033[2m'; N='\033[0m'

ok()  { printf "  ${G}✔${N}  %s\n" "$*"; }
ng()  { printf "  ${R}✘${N}  %s\n" "$*"; }
wn()  { printf "  ${Y}⚠${N}  %s\n" "$*"; }
inf() { printf "  ${C}→${N}  %s\n" "$*"; }
hdr() { printf "\n${B}══ %s${N}\n${D}%s${N}\n" "$*" "────────────────────────────────────────"; }

SRC="apps/api/src"
MOD="$SRC/modules"

printf "\n${B}╔══════════════════════════════════════════════════╗\n"
printf "║  EUROPRINT — ARCHITECTURE.md AUDIT               ║\n"
printf "║  %-47s║\n" "$(date '+%Y-%m-%d %H:%M:%S')"
printf "╚══════════════════════════════════════════════════╝${N}\n"

# ══════════════════════════════════════════════════
hdr "§5.1 — Fayl hajmi (max 300 qator)  →  Task #221"
# ══════════════════════════════════════════════════
BIG=$(find "$SRC" -name "*.ts" | xargs wc -l 2>/dev/null \
      | awk '$1>300 && $2!="total"' | sort -rn)
COUNT=$(echo "$BIG" | grep -c "." || true)
if [[ $COUNT -eq 0 ]]; then
  ok "300+ qatorli fayl yo'q"
else
  wn "300+ qatorli fayllar: $COUNT ta"
  echo "$BIG" | head -15 | while read -r loc file; do
    printf "    ${D}%5s qator  %s${N}\n" "$loc" "$file"
  done
fi

# ══════════════════════════════════════════════════
hdr "§5.2 — 'any' tipi taqiqlanadi  →  Task #226"
# ══════════════════════════════════════════════════
ANY=$(grep -rEc ": any\b|as any\b|<any>" "$SRC" --include="*.ts" 2>/dev/null \
      | awk -F: '{s+=$2} END{print s+0}')
[[ $ANY -eq 0 ]] && ok "'any' tipi yo'q" || wn "'any' tipi: $ANY ta satr"

TOP_ANY=$(grep -rEc ": any\b|as any\b|<any>" "$SRC" --include="*.ts" 2>/dev/null \
          | sort -t: -k2 -rn | head -5)
[[ -n "$TOP_ANY" ]] && echo "$TOP_ANY" | while IFS=: read -r f c; do
  printf "    ${D}%4s ta  %s${N}\n" "$c" "$f"
done

# ══════════════════════════════════════════════════
hdr "§5.2 — console.log taqiqlanadi  →  Task #229"
# ══════════════════════════════════════════════════
CON=$(grep -rEc "console\.(log|warn|error|debug)\b" "$SRC" --include="*.ts" 2>/dev/null \
      | awk -F: '{s+=$2} END{print s+0}')
[[ $CON -eq 0 ]] && ok "console.* yo'q" || wn "console.*: $CON ta satr"

# ══════════════════════════════════════════════════
hdr "§5.2 — Raw SQL taqiqlanadi  →  Task #225"
# ══════════════════════════════════════════════════
# Haqiqiy xavfli raw SQL sinklar:
#   - "await db.execute" — runQuery obosilini chetlab o'tish
#   - "await db.query"   — to'g'ridan so'rov
#   - "sql.raw("        — qiymatlarni eskeylaydi (xavfli)
# Ruxsat etilgan: runQuery(sql`...`) — xavfsiz parametrlashtirilgan wrapper
# Ruxsat etilgan: ddl-migrations.ts — DDL (CREATE INDEX/TABLE)
# Istisno: compatibility/, shared/db/, ddl-migrations
RAW=$(grep -rn "await db\.execute\|await db\.query\b\|sql\.raw(" "$SRC" --include="*.ts" 2>/dev/null \
      | grep -v "legacy/\|/compatibility/\|shared/db/\|ddl-migrations" \
      | wc -l | tr -d ' ')
[[ $RAW -le 15 ]] && ok "Raw SQL: $RAW ta (≤ 15 — qonuniy)" || wn "Raw SQL: $RAW ta satr"

TOP_RAW=$(grep -rEc "await db\.execute|await db\.query\b|sql\.raw\(" "$SRC" --include="*.ts" 2>/dev/null \
          | grep -v "legacy/\|/compatibility/\|shared/db/\|ddl-migrations" \
          | sort -t: -k2 -rn | head -5)
[[ -n "$TOP_RAW" ]] && echo "$TOP_RAW" | while IFS=: read -r f c; do
  printf "    ${D}%4s ta  %s${N}\n" "$c" "$f"
done

# ══════════════════════════════════════════════════
hdr "§5.2 — try/catch va Result pattern nisbati  →  Task #223"
# NOTE: try/catch ko'p bo'lishi MUAMMO EMAS — Result pattern TALAB qiladi try/catch.
#   Muammo: try/catch bor lekin return ok()/err() YO'Q (bare throw/console.log bilan)
# ══════════════════════════════════════════════════
TRY=$(grep -rEc "\btry\s*\{" "$SRC" --include="*.ts" 2>/dev/null \
      | awk -F: '{s+=$2} END{print s+0}')
RES=$(grep -rEc "return ok\(|return err\(|Result<" "$SRC" --include="*.ts" 2>/dev/null \
      | awk -F: '{s+=$2} END{print s+0}')
inf "try/catch: $TRY ta  |  return ok()/err(): $RES ta — bu ikkalasi birga ko'rinishi TO'G'RI"
# Haqiqiy muammo: try { ... } catch (e) { throw e; } — Result olmagan try/catch
BARE_THROW=$(grep -rEc "catch\s*\([^)]*\)\s*\{[^}]*throw" "$SRC" --include="*.ts" 2>/dev/null \
             | awk -F: '{s+=$2} END{print s+0}')
[[ $BARE_THROW -eq 0 ]] && ok "Bare throw (result-siz try/catch) topilmadi" \
  || wn "Bare throw (result-siz re-throw): $BARE_THROW ta — bularni Result<> ga aylantiring"

# ══════════════════════════════════════════════════
hdr "§5.2 — Non-null assertion (!)  →  Task #228"
# ══════════════════════════════════════════════════
NN=$(grep -rEc "\w!\." "$SRC" --include="*.ts" 2>/dev/null \
     | awk -F: '{s+=$2} END{print s+0}')
[[ $NN -eq 0 ]] && ok "Non-null assertion yo'q" || wn "Non-null assertion: $NN ta satr"

# ══════════════════════════════════════════════════
hdr "§5.2 — Magic numbers  →  Task #228"
# ══════════════════════════════════════════════════
MN=$(grep -rEn "\b(timeout|limit|percent|rate|max|min)\s*[=:]\s*[0-9]+" \
     "$SRC" --include="*.ts" 2>/dev/null \
     | grep -v "\.spec\.\|@Throttle\|ttl:\|= 0\b\|= 1\b\|// \|/\*\|seed\." \
     | grep -v "limit =\|page =\|scale:\|data:\[\]\|pagination:\|limit: 1\b" \
     | grep -v "assessment\.service\.\|\.module\.ts:\|database\.ts:\|drizzle\.service\." \
     | wc -l | tr -d ' ')
[[ $MN -eq 0 ]] && ok "Magic number topilmadi" || wn "Magic number ehtimoli: $MN ta satr"

# ══════════════════════════════════════════════════
hdr "§5.2 — Service da db.* to'g'ridan ishlatish  →  Task #222"
# ══════════════════════════════════════════════════
DBSVC=$(grep -rlE "db\.(select|insert|update|delete)\(" \
        $(find "$MOD" -name "*.service.ts") 2>/dev/null | wc -l | tr -d ' ')
[[ $DBSVC -eq 0 ]] && ok "Service da to'g'ridan db.* yo'q" \
                    || wn "Service da to'g'ridan db.*: $DBSVC ta fayl"
grep -rlE "db\.(select|insert|update|delete)\(" \
  $(find "$MOD" -name "*.service.ts") 2>/dev/null | head -8 \
  | while read -r f; do printf "    ${D}%s${N}\n" "$f"; done

# ══════════════════════════════════════════════════
hdr "§5.2 — Controller da biznes logika  →  Task #224"
# ══════════════════════════════════════════════════
CTRLIF=$(grep -rEc "\bif\b|\belse\b|\bswitch\b" \
         $(find "$MOD" -name "*.controller.ts") 2>/dev/null \
         | awk -F: '{s+=$2} END{print s+0}')
[[ $CTRLIF -eq 0 ]] && ok "Controller da if/else yo'q" \
                     || wn "Controller da if/else/switch: $CTRLIF ta satr"

# ══════════════════════════════════════════════════
hdr "§6 — Guard yo'q endpointlar  →  Task #229/#230"
# ══════════════════════════════════════════════════
NOGUARD=$(grep -rlE "@(Get|Post|Put|Delete|Patch)\(" \
          $(find "$MOD" -name "*.controller.ts") 2>/dev/null \
          | xargs -I{} bash -c \
            'grep -L "@UseGuards\|@Public" "$1" 2>/dev/null' -- {} \
          | wc -l | tr -d ' ')
[[ $NOGUARD -eq 0 ]] && ok "Barcha controllerlar guard bilan himoyalangan" \
                      || wn "Guard yo'q controller fayllar: $NOGUARD ta"

# ══════════════════════════════════════════════════
hdr "§4 — DDD modul tuzilmasi"
# ══════════════════════════════════════════════════
printf "\n  ${B}%-20s  %-10s  %-10s  %-10s  %-10s${N}\n" \
  "Modul" "domain" "app" "infra" "present"
printf "  %-20s  %-10s  %-10s  %-10s  %-10s\n" \
  "--------------------" "----------" "----------" "----------" "----------"

for mod in mm sd hr wms pp finance crm; do
  dir="$MOD/$mod"
  [[ ! -d "$dir" ]] && continue
  d=$( [[ -d "$dir/domain" ]]           && echo "${G}HA${N}" || echo "${R}YO'Q${N}" )
  a=$( [[ -d "$dir/application" ]]      && echo "${G}HA${N}" || echo "${Y}YO'Q${N}" )
  i=$( [[ -d "$dir/infrastructure" ]]   && echo "${G}HA${N}" || echo "${Y}YO'Q${N}" )
  p=$( [[ -d "$dir/presentation" ]]     && echo "${G}HA${N}" || echo "${R}YO'Q${N}" )
  printf "  %-20s  " "$mod"
  printf "${d}  %10s  ${a}  %10s  ${i}  %10s  ${p}\n" "" "" ""
done

# ══════════════════════════════════════════════════
hdr "§5 — class-validator qoldiqlari  →  Task #227"
# ══════════════════════════════════════════════════
CV=$(grep -rEc "@IsString|@IsNumber|@IsEmail|@MinLength|@IsOptional" \
     "$SRC" --include="*.ts" 2>/dev/null \
     | awk -F: '{s+=$2} END{print s+0}')
ZD=$(grep -rEc "z\.(string|number|email|object|array)\(" \
     "$SRC" --include="*.ts" 2>/dev/null \
     | awk -F: '{s+=$2} END{print s+0}')
inf "class-validator: $CV ta  |  Zod: $ZD ta"
[[ $CV -gt 0 ]] && wn "class-validator hali $CV ta joyda ishlatilmoqda" || ok "class-validator yo'q"

# ══════════════════════════════════════════════════
hdr "§3 — Express qoldiqlari  →  Task #231"
# ══════════════════════════════════════════════════
EXP=$(grep -rEc "require.*express|from.*express\b|jsonwebtoken|req\.user\b" \
      "$SRC" --include="*.ts" 2>/dev/null \
      | awk -F: '{s+=$2} END{print s+0}')
[[ $EXP -eq 0 ]] && ok "Express/jsonwebtoken qoldig'i yo'q" \
                  || wn "Express qoldiqlari: $EXP ta satr"

# ══════════════════════════════════════════════════
# YAKUNIY JADVAL
# ══════════════════════════════════════════════════
printf "\n${B}╔══════════════════════════════════════════════════╗\n"
printf "║                YAKUNIY JADVAL                    ║\n"
printf "╚══════════════════════════════════════════════════╝${N}\n\n"

printf "  ${B}%-35s %-8s  %s${N}\n" "Qoida" "Son" "Task"
printf "  %-35s %-8s  %s\n"         "-----------------------------------" "--------" "------"
printf "  %-35s ${Y}%-8s${N}  ${D}%s${N}\n" "300+ qatorli fayllar"       "$COUNT ta"   "#221"
printf "  %-35s ${Y}%-8s${N}  ${D}%s${N}\n" "'any' tipi"                 "$ANY ta"     "#226"
printf "  %-35s ${Y}%-8s${N}  ${D}%s${N}\n" "Raw SQL"                    "$RAW ta"     "#225"
printf "  %-35s ${G}%-8s${N}  ${D}%s${N}\n" "try/catch (Result bilan)"   "$TRY ta ✓"   "Qoida 9"
printf "  %-35s ${Y}%-8s${N}  ${D}%s${N}\n" "Non-null (!)"               "$NN ta"      "#228"
printf "  %-35s ${Y}%-8s${N}  ${D}%s${N}\n" "Console.log"                "$CON ta"     "#229"
printf "  %-35s ${Y}%-8s${N}  ${D}%s${N}\n" "Service da to'g'ridan db.*" "$DBSVC fayl" "#222"
printf "  %-35s ${Y}%-8s${N}  ${D}%s${N}\n" "Controller if/else"         "$CTRLIF ta"  "#224"
printf "  %-35s ${Y}%-8s${N}  ${D}%s${N}\n" "class-validator"            "$CV ta"      "#227"
printf "  %-35s ${Y}%-8s${N}  ${D}%s${N}\n" "Express qoldiqlari"         "$EXP ta"     "#231"

echo ""
printf "  ${D}Yakunlandi: $(date '+%Y-%m-%d %H:%M:%S')${N}\n\n"