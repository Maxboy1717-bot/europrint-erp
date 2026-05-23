#!/usr/bin/env bash
RED='\033[0;31m'; GRN='\033[0;32m'; YEL='\033[1;33m'; NC='\033[0m'

FAIL=0
SRC="artifacts/erp-dashboard/src"

echo ""
echo "═══════════════════════════════════════════════"
echo "  .slice() Xavfsizlik Reviewer"
echo "═══════════════════════════════════════════════"

TARGETS=(
  "pages/HRDashboard.tsx"
  "pages/CoordinationPage.tsx"
  "pages/SupplyChainDashboard.tsx"
  "pages/MarketingExtended.tsx"
  "pages/MarketingDashboard.tsx"
  "pages/MESHomeDashboard.tsx"
  "pages/MESDashboard.tsx"
  "pages/MESExtended.tsx"
  "pages/MMExtended.tsx"
  "pages/MROExtended.tsx"
  "pages/SecurityExtended.tsx"
  "pages/IoTExtended.tsx"
  "pages/FinanceExtended.tsx"
  "pages/WMSExtended.tsx"
  "pages/QCDashboard.tsx"
  "pages/QCModule.tsx"
  "pages/SDDashboard.tsx"
  "pages/SDExtended.tsx"
  "pages/TechDashboard.tsx"
  "pages/FIDashboard.tsx"
  "pages/PPDashboard.tsx"
  "pages/HROnboarding.tsx"
  "pages/LMSDashboard.tsx"
  "pages/LMSExtended.tsx"
  "pages/InvoiceVerification.tsx"
  "pages/MaterialBalance.tsx"
  "pages/MaterialsAccounting.tsx"
  "pages/WarehouseDashboard.tsx"
  "pages/CashFlowManagement.tsx"
  "pages/ProductProfitability.tsx"
  "pages/EventsCalendar.tsx"
  "pages/CameraLiveMonitoring.tsx"
  "pages/CameraAIAnalytics.tsx"
  "pages/hr-dashboard/RiskTab.tsx"
  "pages/hr-dashboard/DisciplineTab.tsx"
  "pages/hr-dashboard/SafetyTab.tsx"
  "pages/employee-profile/AttendanceTab.tsx"
  "pages/employee-profile/PerformanceTab.tsx"
  "pages/analytics/LeaderboardTab.tsx"
  "pages/analytics/RemainingTabs.tsx"
  "pages/SDSalesManagement.tsx"
  "pages/SDOverviewDashboard.tsx"
  "pages/SecurityDashboard.tsx"
  "components/chat/page/CreateRoomModal.tsx"
  "components/chat/page/DirectMessageModal.tsx"
  "components/crm/ActivityPanel.tsx"
  "components/crm/MeetingCard.tsx"
  "components/director/OverdueOrdersCard.tsx"
  "components/director/ProductionStatusCard.tsx"
  "components/hr/stats/AttendanceDisciplineTables.tsx"
  "components/hr/stats/LearningHistoryTables.tsx"
  "components/wms/barcode/ChiqishNazoratibolimi.tsx"
  "components/wms/barcode/ChopNavbatiBolimi.tsx"
)

for rel in "${TARGETS[@]}"; do
  FILE="$SRC/$rel"
  if [ ! -f "$FILE" ]; then
    echo -e "${YEL}⚠ Topilmadi: $rel${NC}"
    continue
  fi

  HITS=$(grep -n '\.\s*slice\s*(' "$FILE" 2>/dev/null \
    | grep -v 'Array\.isArray' \
    | grep -v '\?\.' \
    | grep -v '\.toISOString()' \
    | grep -v '\.split(' \
    | grep -v "'\|\"" \
    | grep -v '^\s*//' || true)

  COUNT=$(echo "$HITS" | grep -c '.' || true)
  COUNT="${COUNT//[[:space:]]/}"

  if [ "${COUNT:-0}" -gt 0 ] && [ -n "$HITS" ]; then
    echo -e "${RED}✗ $rel — ${COUNT} ta xavfli .slice()${NC}"
    echo "$HITS" | head -5 | sed 's/^/    /'
    FAIL=$((FAIL + 1))
  else
    echo -e "${GRN}✓ $rel${NC}"
  fi
done

echo ""
echo "═══════════════════════════════════════════════"
echo "FAIL: ${FAIL}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GRN}✅ Barcha .slice() xavfsiz!${NC}"
  exit 0
else
  echo -e "${RED}❌ Tuzatish kerak${NC}"
  exit 1
fi
