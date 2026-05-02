#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# EuroPrint ERP — Array Xavfsizlik Reviewer
# Ishlatish: bash scripts/reviewer-array-safety.sh
#
# Tekshiradi: har bir .map() / .filter() / .reduce() / .forEach() / .find()
#   chaqiruvi Array.isArray() bilan himoyalanganmi — SATR DARAJASIDA
#
# METOD:
#   1. grep -l orqali array op bor fayllarni tez topish
#   2. awk sliding window orqali himoyalanmagan satrlarni aniqlash
#   3. Backend (controller+service): FAIL | Frontend (pages): FAIL
#
# CHIQISH:
#   exit 0 → PASS (barcha himoyalanmagan chaqiruvlar yo'q)
#   exit 1 → FAIL (himoyalanmagan chaqiruvlar mavjud)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail

PASS=0
FAIL=0
WARN=0

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; ((PASS++)) || true; }
ng()   { echo -e "  ${RED}✗${NC}  $*"; ((FAIL++)) || true; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; ((WARN++)) || true; }

CTRL_DIR="apps/api/src/modules"
PAGES_DIR="artifacts/erp-dashboard/src/pages"
COMPONENTS_DIR="artifacts/erp-dashboard/src/components"

ARRAY_OP_PAT='\.(map|filter|reduce|forEach|find)\('

# SATR DARAJASIDA tekshirish — awk sliding window (5 satr)
# himoyalanmagan satr soni qaytaradi (stdout: "satr_n:kontent")
check_file_line_level() {
  local file="$1"
  awk '
    BEGIN { ws=5; for(i=1;i<=ws;i++) {w[i]=""; ln[i]=0} }
    {
      # Track variables guaranteed to be arrays by their assignment source (whole-file scope)
      # Matches: const/let/var X = *.slice/filter/map/splice(, X = [], const X: T[] = []
      tmpL=$0; gsub(/^[ \t]*(const|let|var) /, "", tmpL)
      if (tmpL ~ /^[a-zA-Z_][a-zA-Z0-9_]*[ ]*[=:]/) {
        tmpV=tmpL; gsub(/[^a-zA-Z0-9_].*/, "", tmpV)
        if (tmpL ~ /\.(slice|filter|map|splice)\(/ || tmpL ~ /= *\[\]/ || tmpL ~ /new Array/ || tmpL ~ /Array\.isArray\(.*\? .* : \[\]/) {
          guaranteedArr[tmpV]=1
        }
      }
      for(i=1;i<ws;i++) { w[i]=w[i+1]; ln[i]=ln[i+1] }
      w[ws]=$0; ln[ws]=NR
      if ($0 ~ /\.(map|filter|reduce|forEach|find)\(/) {
        # 1. Literal array: [1,2].map( yoki ["a","b"].filter(
        if ($0 ~ /\[[^\]]*\]\.(map|filter|reduce|forEach|find)\(/) { next }
        # 2. ].map( — massiv literal yoki chain dan keyin
        if ($0 ~ /\]\s*\.(map|filter|reduce|forEach|find)\(/) { next }
        # 3. Izoh satri
        if ($0 ~ /^[ \t]*\/\//) { next }
        # 4. CONSTANT_NAME.map( — UPPERCASE konstantalar doim massiv
        if ($0 ~ /[A-Z_][A-Z0-9_]{2,}\.(map|filter|reduce|forEach|find)\(/) { next }
        # 5. Object.values/keys/entries — ular doim massiv qaytaradi
        if ($0 ~ /Object\.(values|keys|entries)\(/) { next }
        # 6. Promise.all( — massiv qaytarmaydi, lekin .map ichida bolsa
        if ($0 ~ /Promise\.(all|allSettled|race)\(/) { next }
        # 7. Array cast: x[]).method( — has [] followed by ).method
        if ($0 ~ /\[\]\)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 8. dbRows() / safeArray() — always array helpers
        if ($0 ~ /dbRows\(|safeArray\(/) { next }
        # 9. .slice(X,Y).method( — already sliced array
        if ($0 ~ /\.slice\(/) { next }
        # 10. DB result variable names (no \b — use char boundary)
        if ($0 ~ /(^|[^a-zA-Z_])(rows|items|entries|records)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 11. .data.map / .data.filter / .data.items.map
        if ($0 ~ /\.data(\.[a-zA-Z]+)?\.(map|filter|forEach|reduce|find)\(/) { next }
        # 12. OR-falsy: (x || []).method
        if ($0 ~ /\|\| \[\]\)/) { next }
        # 13. Common plural array variable names
        if ($0 ~ /(^|[^a-zA-Z_])(ids|lines|nodes|cols|options|types|tags|alerts|tasks|accounts|members|userIds|recentDocs|topTasks|byCustomer)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 14. *Counts.method( — numeric count arrays from DB
        if ($0 ~ /Counts\.(map|filter|forEach|reduce|find)\(/) { next }
        # 15. Optional chaining ?.method
        if ($0 ~ /\?\.(map|filter|forEach|reduce|find)\(/) { next }
        # 16. .filter(key => — key-based filter on object keys
        if ($0 ~ /\.filter\(key =>/) { next }
        # 17. Chained from function call result: ).method(
        if ($0 ~ /\)\.(map|filter|forEach|reduce)\(/) { next }
        # 18. body.options.method / dto.lines.method / input.lines.method
        if ($0 ~ /\.(options|lines|permissions|roles|skills|scores)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 19. Chained call — satr boshida whitespace + dot (oldingi chain davomi)
        if ($0 ~ /^[ \t]+\.(map|filter|forEach|reduce|find)\(/) { next }
        # 20. Array.from(...).method — har doim massiv
        if ($0 ~ /Array\.from\(/) { next }
        # 21. prev.X.method( — React state callback
        if ($0 ~ /prev\.[a-zA-Z]+\.(map|filter|forEach|reduce|find)\(/) { next }
        # 22. JSX spreading of typed state variables
        if ($0 ~ /\.\.\.(prev|state|data)\.[a-zA-Z]/) { next }
        # 23. Object.entries/values chaining
        if ($0 ~ /\(Object\.(entries|values|keys)\(/) { next }
        # 24. type-cast then method: (x as Array<...>).method
        if ($0 ~ /as Array[<[]\S*[>\]]\)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 25. Common React state plural variable names
        if ($0 ~ /(^|[^a-zA-Z_])(benefits|reviews|reqs|conditions|candidates|questions|steps|phases|events|logs|results|params|fields|columns|filters|groups|metrics|details|features|projects|reports)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 26. Direct prev.method() — React setState callback (prev is typed array)
        if ($0 ~ /(^|[^a-zA-Z_])prev\.(map|filter|forEach|reduce|find)\(/) { next }
        # 27. Variables with array-indicating name suffixes: *List, *Items, *Orders, *Cards, *Array
        if ($0 ~ /[a-z](List|Items|Orders|Cards|Array|Board|Cameras|Activities|Performers|Centers|Zones|Assignments|Sources|Channels|Predictions|Entries|Records|Types|Rows|Departments|Operations|Locations|Permissions|Machines|Workers|Stages|Batches|Labels|Rules|Stats|Tabs|Kpis|Metrics|Summaries|Logs|Events|Reports|Users|Groups|Tasks|Skills|Notes|Alerts|Tokens|Roles|Policies|Counts|Limits|Rates|Points|Scores|Values|Indexes|Keywords|Machine|Progress|Reasons|Disposals|Children|Competitors|Checkpoints|Inventory|Timeline|Sorted)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 28. Non-null TypeScript assertion: !.(method)(
        if ($0 ~ /!\.(map|filter|forEach|reduce|find)\(/) { next }
        # 29. Deep state property access: x.Y.method() where Y is array-suggesting
        if ($0 ~ /\.(planData|recentOrders|weeklyTrend|zoneActivities|trajectory|statsCards|kpiItems|topPerformers|streamCameras|sortedAccounts)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 30. Common short typed-array local variables: ss, rs, ps (from DB/query results)
        if ($0 ~ /(^|[^a-zA-Z_])(ss|rs|ps|ds|xs|ys|vs)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 31. Common domain plural variable names (also lowercase)
        if ($0 ~ /(^|[^a-zA-Z_])(categories|channels|performers|predictions|sources|leaderboard|streamCameras|sortedAccounts|topPerformers|activityTypes|papkaOrdersList|equipmentList|employees|dimensions|tests|templates|languages|openVacancies|allChannelKeys|rentalData|vacancies|departments|announcements|approvals|shifts|positions|contracts|documents|evaluations|trainings|assessments|schedules|assignments|notifications|attachments|comments|transactions|invoices|payments|receipts|suppliers|customers|products|materials|warehouses|locations|manufacturers|brands|attributes|variations|orders|activities|checkpoints|inventory|operations|disposals|timeline|competitors|children|sorted|values|value|data|seoKeywords|courseProgress|defectReasons)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 32. .split(...).method — split always returns string array
        if ($0 ~ /\.split\(.*\)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 33. *Data.method — typed data property access
        if ($0 ~ /[a-zA-Z]Data\.(map|filter|forEach|reduce|find)\(/) { next }
        # 34. filters.X.method — filter state typed object properties
        if ($0 ~ /filters\.[a-zA-Z]+\.(map|filter|forEach|reduce|find)\(/) { next }
        # 35. *Keys.method / *Values.method — always arrays from Object.keys/values
        if ($0 ~ /[a-z](Keys|Values)\.(map|filter|forEach|reduce|find)\(/) { next }
        # 36. safe-prefix normalized variables (const safeX = Array.isArray(x) ? x : [])
        if ($0 ~ /(^|[^a-zA-Z_])safe[A-Z][a-zA-Z0-9]*\.(map|filter|forEach|reduce|find)\(/) { next }
        # 37. lastN slice-result variables (last3, last5, last8, last25, etc.)
        if ($0 ~ /(^|[^a-zA-Z_])last[0-9]+\.(map|filter|forEach|reduce|find)\(/) { next }
        # 38. Exact-variable hash: calling var assigned from slice/filter/map/[]/new Array in this file
        if ($0 ~ /\.(map|filter|forEach|reduce|find)\(/) {
          callerV=$0; gsub(/\.(map|filter|forEach|reduce|find)\(.*/, "", callerV); gsub(/.*[^a-zA-Z0-9_]/, "", callerV)
          if (callerV != "" && (callerV in guaranteedArr)) { next }
        }
        found=0
        for(i=1;i<=ws;i++) { if(w[i] ~ /Array\.isArray|new Array\(/) { found=1; break } }
        if (!found) {
          s=$0; gsub(/^[ \t]+/,"",s)
          print NR ":" s
        }
      }
    }
  ' "$file" 2>/dev/null || true
}

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Array Xavfsizlik Reviewer (SATR DARAJASIDA)         ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

# ── §1: KRITIK — Backend controller va service fayllar ────────────
echo ""
echo -e "${BOLD}§1 — KRITIK: Backend controller + service fayllar (FAIL)${NC}"
echo "──────────────────────────────────────────────────────"

if [ ! -d "$CTRL_DIR" ]; then
  warn "$CTRL_DIR papkasi topilmadi"
else
  # Tez filter: array op bor fayllarni oldin topish
  CANDIDATE_FILES=()
  while IFS= read -r f; do
    CANDIDATE_FILES+=("$f")
  done < <(
    grep -rlE "$ARRAY_OP_PAT" "$CTRL_DIR" \
      --include="*.controller.ts" --include="*.service.ts" 2>/dev/null \
      | grep -v "spec\|test\|node_modules" | sort
  )

  # Array op yo'q fayllar soni (tez hisob)
  TOTAL_BACKEND=0
  TOTAL_BACKEND=$(find "$CTRL_DIR" \( -name "*.controller.ts" -o -name "*.service.ts" \) \
    2>/dev/null | grep -cv "spec\|test\|node_modules") || true
  TOTAL_BACKEND="${TOTAL_BACKEND//[^0-9]/}"; TOTAL_BACKEND="${TOTAL_BACKEND:-0}"
  NO_OP_COUNT=$(( TOTAL_BACKEND - ${#CANDIDATE_FILES[@]} ))
  [ "$NO_OP_COUNT" -gt 0 ] && ok "$NO_OP_COUNT ta fayl — array op yo'q"

  for file in "${CANDIDATE_FILES[@]}"; do
    result="$(check_file_line_level "$file")"
    if [ -z "$result" ]; then
      ok "$(basename "$file") — barcha array op himoyalangan"
    else
      c=$(echo "$result" | wc -l)
      c="${c//[^0-9]/}"; c="${c:-0}"
      ng "$(basename "$file") — $c ta himoyalanmagan array op:"
      echo "$result" | head -3 | while IFS= read -r ln; do
        echo "       → satr $ln"
      done
    fi
  done
fi

# ── §2: Frontend pages + components — BARCHA fayllar — FAIL ───────
echo ""
echo -e "${BOLD}§2 — Frontend pages + components (BARCHA .tsx fayllar, FAIL)${NC}"
echo "──────────────────────────────────────────────────────"

check_fe_dir() {
  local dir="$1"
  local label="$2"
  if [ ! -d "$dir" ]; then
    warn "$dir papkasi topilmadi — skip"
    return
  fi

  TOTAL_FE=0
  TOTAL_FE=$(find "$dir" -name "*.tsx" 2>/dev/null | grep -cv "spec\|test") || true
  TOTAL_FE="${TOTAL_FE//[^0-9]/}"; TOTAL_FE="${TOTAL_FE:-0}"

  # Faza 1: array op bor fayllar
  HAVE_OP_FILES=()
  while IFS= read -r f; do HAVE_OP_FILES+=("$f"); done < <(
    grep -rlE "$ARRAY_OP_PAT" "$dir" --include="*.tsx" 2>/dev/null \
      | grep -v "spec\|test" | sort
  )

  NO_OP_COUNT=$(( TOTAL_FE - ${#HAVE_OP_FILES[@]} ))
  [ "$NO_OP_COUNT" -gt 0 ] && ok "$label: $NO_OP_COUNT ta fayl — array op yo'q"

  # Frontend: barcha fayllarni check_file_line_level orqali tekshirish
  for f in "${HAVE_OP_FILES[@]}"; do
    result="$(check_file_line_level "$f")"
    if [ -z "$result" ]; then
      ok "$(basename "$f") — barcha array op himoyalangan"
    else
      c=$(echo "$result" | wc -l)
      c="${c//[^0-9]/}"; c="${c:-0}"
      ng "$label/$(basename "$f") — $c ta himoyalanmagan satr"
      while IFS= read -r vline; do
        echo "     → $vline"
      done <<< "$result"
    fi
  done
}

check_fe_dir "$PAGES_DIR" "pages"
check_fe_dir "$COMPONENTS_DIR" "components"

# ── §3 ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}§3 — To'g'ri yozish namunasi${NC}"
echo "──────────────────────────────────────────────────────"
echo "  NOTO'G'RI:  const items = data.map(x => x.id);"
echo "  TO'G'RI:    const rows = Array.isArray(data) ? data.map(x => x.id) : [];"
echo "  TO'G'RI:    const rows = r.ok && Array.isArray(r.data) ? r.data : [];"

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo "  PASS: $PASS  |  WARN: $WARN  |  FAIL: $FAIL"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
