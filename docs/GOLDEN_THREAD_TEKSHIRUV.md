# EUROPRINT ERP — OLTIN ZANJIR TEKSHIRUVI

> **SD→PP→MES→QC→WMS→FIN zanjirini qanday tekshirish. Har ulanish uchun test.**
> "Oltin zanjir" = buyurtmadan buxgalteriagacha to'liq oqim.
> Bu uzilsa → ERP ning asosiy maqsadi bajarilmaydi.
> Bog'liq: [EVENT_KATALOGI.md](EVENT_KATALOGI.md) · [MODUL_SHARTNOMASI.md](MODUL_SHARTNOMASI.md) · [SPRINT_DOD.md](SPRINT_DOD.md)

---

## 1. OLTIN ZANJIR NIMA?

```
Buyurtma keldi → Mahsulot yaratildi → Smenada ishlab chiqarildi →
Sifat tekshiruvdan o'tdi → Omborga kiritildi → GL yozuvi qilindi

SD → PP → MES → QC → WMS → FIN

Har o'tish = EVENT (EventEmitter2):
  sd.sales_order.confirmed
    └→ [PP] pp.work_order.created
         └→ [MES] mes.session.started → mes.session.completed
                   └→ [QC] qc.inspection.created → qc.inspection.passed
                             └→ [WMS] wms.stock.received
                                       └→ [FIN] fin.entries.posted (GL)
```

---

## 2. PRE-COMMIT TEKSHIRUV (Avtomatik)

```bash
# Har commit oldidan (mavjud hook):
node scripts/golden-thread-chain-proof.cjs

# Bu skript nima tekshiradi:
# 1. sd.sales_order.confirmed → PP listener mavjudmi?
# 2. pp.work_order.created → MES listener mavjudmi?
# 3. mes.session.completed → QC listener mavjudmi?
# 4. qc.inspection.passed → WMS listener mavjudmi?
# 5. wms.stock.received → FIN listener mavjudmi?

# Natija:
# ✅ PASS → zanjir ulangan
# ❌ FAIL → qaysi ulanish uzilgan ko'rinadi
```

---

## 3. QIYMAT TEKSHIRUVI (Har Sprint Oxirida)

### 3.1 SD → PP tekshiruvi (Sprint 1-2 da)

```bash
# 1. Login:
TOKEN=$(curl -s -X POST http://127.0.0.1:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

# 2. Buyurtma yaratish:
ORDER=$(curl -s -X POST http://127.0.0.1:3030/api/sd/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"items":[{"material_id":1,"quantity":100}]}')
ORDER_ID=$(echo $ORDER | jq -r '.id')
echo "Buyurtma ID: $ORDER_ID"

# 3. Buyurtmani tasdiqlash (event emit qilish):
curl -s -X PATCH http://127.0.0.1:3030/api/sd/orders/$ORDER_ID/confirm \
  -H "Authorization: Bearer $TOKEN"

# 4. PP da ishlanma yaratildimi?
sleep 1  # Event async (1 sekund)
WO=$(curl -s http://127.0.0.1:3030/api/pp/work-orders?sales_order_id=$ORDER_ID \
  -H "Authorization: Bearer $TOKEN")
echo $WO | jq '.data | length'
# → 1 bo'lishi kerak (ishlanma yaratildi)
# → 0 → SD→PP event uzilgan!
```

### 3.2 PP → MES tekshiruvi (Sprint 3-4 da)

```bash
WO_ID=$(echo $WO | jq -r '.data[0].id')

# Smena boshlash:
SESSION=$(curl -s -X POST http://127.0.0.1:3030/api/mes/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"work_order_id\":$WO_ID,\"work_center_id\":1}")
SESSION_ID=$(echo $SESSION | jq -r '.id')
echo "Smena ID: $SESSION_ID"

# Smena tugatish (event emit):
curl -s -X PATCH http://127.0.0.1:3030/api/mes/sessions/$SESSION_ID/complete \
  -H "Authorization: Bearer $TOKEN"

# QC tekshiruv yaratildimi?
sleep 1
QC=$(curl -s http://127.0.0.1:3030/api/qc/inspections?session_id=$SESSION_ID \
  -H "Authorization: Bearer $TOKEN")
echo $QC | jq '.data | length'
# → 1 bo'lishi kerak
```

### 3.3 QC → WMS tekshiruvi (Sprint 5-6 da)

```bash
QC_ID=$(echo $QC | jq -r '.data[0].id')

# QC o'tdi deb belgilash:
curl -s -X PATCH http://127.0.0.1:3030/api/qc/inspections/$QC_ID/pass \
  -H "Authorization: Bearer $TOKEN"

# Ombor kirim bo'ldimi?
sleep 1
STOCK=$(curl -s http://127.0.0.1:3030/api/wms/stock?material_id=1 \
  -H "Authorization: Bearer $TOKEN")
echo $STOCK | jq '.quantity'
# → Oldingi miqdordan KO'P bo'lishi kerak
```

### 3.4 WMS → FIN tekshiruvi (Sprint 7 da)

```bash
# GL entries yaratildimi?
ENTRIES=$(curl -s http://127.0.0.1:3030/api/fin/entries?date=today \
  -H "Authorization: Bearer $TOKEN")
echo $ENTRIES | jq '.data | length'
# → > 0 bo'lishi kerak (GL yozuvi bor)

# Balans tekshiruvi:
BALANCE=$(psql $DATABASE_URL -t -c "
  SELECT SUM(CASE WHEN side='DEBIT' THEN amount ELSE -amount END)
  FROM entries
  WHERE created_at::date = CURRENT_DATE;
")
echo "Balans: $BALANCE"
# → 0 bo'lishi kerak (debet = kredit)
```

---

## 4. DOMAIN EVENTS MONITORING

```sql
-- Outbox holati (har kun tekshir):
SELECT
  event_type,
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest
FROM domain_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, status
ORDER BY status, event_type;

-- Natija tahlili:
-- status='PUBLISHED' → yaxshi (relay o'tkazdi)
-- status='PENDING' old > 5 daqiqa → muammo (relay ishlamayapti!)
-- status='FAILED' → dead-letter (manual tekshir)
-- count=0 (barcha) → event emit bo'lmayapti (zanjir uzilgan!)

-- Sprint 3 dan keyin bu so'rov quyidagini ko'rsatishi kerak:
-- sales_order.confirmed  → PUBLISHED
-- work_order.created     → PUBLISHED
-- session.completed      → PUBLISHED
-- inspection.passed      → PUBLISHED
-- stock.received         → PUBLISHED
```

---

## 5. EVENT LISTENER BORLIGINI TEKSHIRISH

```bash
# Har event uchun listener bor ekanini tekshirish:
grep -rn "@OnEvent('sales_order.confirmed')" apps/api/src/ --include="*.ts"
# → PP modulida listener bo'lishi kerak

grep -rn "@OnEvent('work_order.created')" apps/api/src/ --include="*.ts"
# → MES modulida listener bo'lishi kerak

grep -rn "@OnEvent('session.completed')" apps/api/src/ --include="*.ts"
# → QC modulida listener bo'lishi kerak

grep -rn "@OnEvent('inspection.passed')" apps/api/src/ --include="*.ts"
# → WMS modulida listener bo'lishi kerak

grep -rn "@OnEvent('stock.received')" apps/api/src/ --include="*.ts"
# → FIN modulida listener bo'lishi kerak

# Har natija bo'sh bo'lsa → zanjir uzilgan! (no-op yoki yo'q)
```

---

## 6. NO-OP LISTENER TEKSHIRUVI

```bash
# No-op listener (bod qiladi, hech ish qilmaydi):
grep -A 5 "@OnEvent(" apps/api/src/ -rn --include="*.ts" | \
  grep -B 2 "console\.log\|// TODO\|return;"
# → Bu yerda chiqqan har natija = no-op listener → tuzatish kerak

# No-op listenerlar (hozir V1 da mavjud):
# MES → QC: session.completed listener → faqat console.log
# IoT → MES: anomaly detected → no-op
# POS → GL: movement completed → deferred (FIX4)
```

---

## 7. SPRINT BO'YICHA OLTIN ZANJIR HOLATI

| Ulanish | Sprint | Holat | Tekshiruv |
|---------|--------|-------|-----------|
| SD → PP | Sprint 2-3 | 🔲 QURILMAGAN | §3.1 |
| PP → MES | Sprint 3-4 | 🔲 QURILMAGAN | §3.2 |
| MES → QC | Sprint 4-5 | ⚠️ NO-OP | §3.3 |
| QC → WMS | Sprint 5-6 | 🔲 QURILMAGAN | §3.3 |
| WMS → FIN | Sprint 6-7 | 🔲 QURILMAGAN | §3.4 |
| Outbox relay | Sprint 1+ | ⚠️ 0 events | §4 |

**Maqsad Sprint 7 oxirida:** Barcha ✅ ULANGAN

---

## 8. OLTIN ZANJIR BUTUNLIGI (Doim Tekshirilsin)

```bash
# CLAUDE.md pre-commit hookda (mavjud):
node scripts/golden-thread-chain-proof.cjs

# Bu skript yangilanishi kerak bo'lgan holat:
# Yangi modul qo'shilganda (MES, QC, WMS, FIN)
# yangi event tiplar → skriptga qo'sh

# scripts/golden-thread-chain-proof.cjs tarkibi tekshirish:
cat scripts/golden-thread-chain-proof.cjs | grep "OnEvent"
# → Barcha 5 ta ulanish tekshirilishi kerak
```

---

*EuroPrint ERP · Oltin Zanjir Tekshiruvi · Versiya: 2026-06-18*
