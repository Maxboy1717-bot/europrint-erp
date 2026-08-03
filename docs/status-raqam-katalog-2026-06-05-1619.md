# 📊 Status raqam katalogi — EuroPrint ERP

**Sana/vaqt:** 2026-06-05 16:19
**Turi:** STATIK kod-tahlil (server urilmadi, login yo'q, side-effect yo'q)
**Manba:** `apps/api/src/**/*.controller.ts` (340 ta controller fayl)

---

## 📊 HOZIRGI RAQAMLAR

| Ko'rsatkich | Soni | Izoh |
|---|---|---|
| 🟢 Jami route (endpoint) | **2951** | Barcha `@Get/@Post/@Put/@Patch/@Delete` |
| 🟠 501 "tayyor emas" (notImplemented) | **157** | 35 ta faylda — halol stub (saqlamaydi, lekin yolg'on demaydi) |
| 🔴 Soxta-200 (echo) | **53** | "ishladi" ko'rinadi — pastdagi ro'yxatga qarang |
| 🔴 500 riski (`as unknown` stub) | **0** | Toza ✅ |
| 🟠 503/404 riski (yo'q jadval) | probe qilinmadi | Pastda izoh |

> **Eslatma:** "soxta-200" grep keng to'r — 53 tadan bir qismi aslida **haqiqiy** javob (masalan `return { ok: true, data: result.data }` — pastda repository natijasini o'rab qaytaryapti). Toza "yashil yolg'on" (bo'sh `return {}` yoki `return { success: true }` hech narsa saqlamasdan) ~20-25 ta. Pastdagi ro'yxatda har birini ko'rib chiqing.

---

## ⭐ SOG'LOMLIK NISBATI

- **501 (tayyor emas):** 157 / 2951 = **5.3%**
- **Soxta-200 (echo):** 53 / 2951 = **1.8%**
- **Jami "yarim-ishlaydigan" (501 + soxta):** 210 / 2951 = **~7.1%**

➡️ Ya'ni **har 14 endpointdan ~1 tasi** hali to'liq ishlamaydi yoki yolg'on yashil. Qolgan **~93%** real javob qaytaradi. Bu — yirik ERP uchun sog'lom ko'rsatkich.

---

## ⭐ O'ZGARISH (delta)

**Bu — BIRINCHI tekshiruv (bazaviy).** docs/ ichida oldingi `status-raqam-katalog-*.md` topilmadi. Keyingi ishga tushishlarda shu raqamlarga nisbatan o'zgarish (kamaydimi/oshdimi) ko'rsatiladi.

Bazaviy raqamlar (keyingi solishtirish uchun eslab qoling):
- Jami route: **2951**
- 501: **157** (35 fayl)
- Soxta-200: **53**
- 500 riski: **0**

---

## 🔴 SOXTA-200 RO'YXATI (fayl:qator) — eng muhimi

> Pastdagilar "yashil yolg'on" bo'lishi mumkin. ✅ = ehtimol haqiqiy javob (repo natijasini o'raydi). ⚠️ = shubhali bo'sh echo (tekshirish kerak).

**⚠️ Bo'sh `return {}` / `return { success: true }` — saqlamaslik shubhasi:**
- `modules/bot-gateway/bot-gateway.controller.ts:77, 128` — `return {}` (botSvc/chatId yo'q bo'lsa)
- `modules/crm/presentation/crm-activities.controller.ts:131` — `return {}`
- `modules/crm/presentation/crm-companies.controller.ts:156` — `return {}`
- `modules/crm/presentation/crm-followup-compat.controller.ts:98` — `return {}`
- `modules/hr/telegram-bots/telegram-bots.controller.ts:79, 93, 107` — `return {}`
- `modules/kanban/presentation/kanban-boards.controller.ts:107, 140` — `return {}`
- `modules/mm/presentation/mm-goods.controller.ts:91, 147` — `return {}`
- `modules/mm/presentation/mm-vendors-pr.controller.ts:163` — `return {}`
- `modules/sd/presentation/sd-customers.controller.ts:224, 281, 331, 363` — `return {}` (4 ta!)
- `modules/communication-center/presentation/cc-notification-prefs.controller.ts:39` — `return { success: true }`
- `modules/finance/presentation/finance-cfo-config.controller.ts:37` — `return { success: true }`
- `modules/lms/presentation/lms-core.controller.ts:129` — `completeCourse` → `return { success: true }`
- `modules/remaining/ideal-rasm.controller.ts:32` — `return { success: true }`
- `modules/wms/presentation/warehouse-rental.controller.ts:119` — `recalculate` → `return { success: true }`
- `modules/wms/presentation/wms-inventory.controller.ts:51` — `return { success: true }`
- `modules/wms/presentation/wms-stock.controller.ts:52` — `return { success: true }`

**⚠️ `id: Date.now()` — soxta ID (DB sequence emas):**
- `modules/crm/presentation/crm-leads.controller.ts:186` — `id: Date.now(), ...sent: true`
- `modules/general/controllers/general-legacy-a.controller.ts:160, 179` — `catch → ({ ...body, id: Date.now() })` (xato bo'lsa soxta echo)

**✅ Ehtimol haqiqiy (repo natijasini o'raydi — yolg'on emas):**
- `modules/aisha/.../chat.controller.ts:68, 79, 133` — `success: true, data: {...}` (AI chat javobi)
- `modules/chat/chat-uploads.controller.ts:96, 107, 159` — `ok: true` (upload tugadi)
- `modules/communication-center/.../cc-documents.controller.ts:146` — `ok: true`
- `modules/communication-center/.../cc-webhook.controller.ts:71, 101` — `ok: true, queued/deduplicated`
- `modules/ecommerce/ecommerce-public.controller.ts:73` — `ok: true, accepted: true`
- `modules/hr/attendance/attendance-face.controller.ts:88, 100, 130, 146, 157, 168` — `ok: true, ...result.data` (yuz tanish)
- `modules/hr/inspection/inspection.controller.ts:63, 108, 124` — `ok: true, data: r.data`
- `modules/hr/presentation/hr-employees-ext.controller.ts:169` — `return { data: [] }` (natija yo'q bo'lsa)
- `modules/hr/presentation/hr-employees.controller.ts:159` — `success: true, deletedBy` (o'chirish)
- `modules/kanban/.../kanban-boards.controller.ts:182` — `ok: true`
- `modules/lms/.../lms-core.controller.ts:148` — `ok: true, data: rows[0]`
- `modules/remaining/system.controller.ts:87` — `ok: true, refreshedAt`
- `modules/wms/.../wms-integration.controller.ts:73, 76` — `ok: true, syncedAt` (76: "sync queued, no event log" — yarim)

---

## 🟠 501 "TAYYOR EMAS" — 35 ta faylda (157 endpoint)

Eng ko'p stubli modullar (halol "tayyor emas" — yolg'on demaydi):
- **IoT:** iot-alerts, iot-main, iot-sensors-main, iot-tablet, wms/iot-enhanced (5 fayl)
- **WMS:** wms-barcode, wms-catalog, wms-integration (3 fayl)
- **LMS:** lms-lessons, lms-misc
- **Kanban:** kanban-cards, kanban-reports
- **HR:** hr-compat-a, hr-dashboard-extra
- **MM:** mm-dashboard, mm-purchase-orders
- **QC:** qc-defects, qc-new
- **Finance:** finance-extended-payroll, finance-main, reports
- **AI:** ai, ai-agents
- **Boshqa:** design, org-structure, pos-stub, pos/stock, pp/production-reports, pp/technology, security, material-balance, integration-employee, compat (saas/director/warehouse-catalog)

> 501 — bu **yaxshi belgi** (echo'dan ko'ra halolroq): foydalanuvchiga "bu hali tayyor emas" deb aniq aytadi, soxta yashil bermaydi.

---

## 🟠 503/404 RISKI (yo'q jadval) — probe qilinmadi

Bu tekshiruv **sof statik** bo'lib qolishi uchun jonli DB urilmadi (side-effect/ulanish yo'q). Xotiradan ma'lum bo'lgan yo'q/bo'sh jadvalga bog'liq endpointlar (kelajakda probe uchun nomzod): `qc_approvals`, `company_state`, `director_alerts`, `canteen_meals`, `utility_readings`, `work_centers.efficiency_rate` (CRP 503). Bular jonli DB'da yo'q bo'lsa 500/503 berishi mumkin. Keyingi probe-li tekshiruvda `_audit/q.cjs` (mavjud) bilan sanaladi.

---

## 📝 QISQA XULOSA (egasiga)

Tizimning **~93%** endpointi real javob qaytaradi; faqat **~7%** (210/2951) hali yarim — shundan **157** tasi halol "tayyor emas" (501), atigi **~20-25** tasi haqiqiy "yashil yolg'on" echo. **500 xato riski 0** — bu juda yaxshi. Bu birinchi (bazaviy) o'lchov, shuning uchun "kamaydimi/oshdimi" tendentsiyasini keyingi ishga tushishlarda ko'rsataman. Eng ko'p e'tibor talab qiladigan joy — `sd-customers` (4 ta bo'sh `return {}`) va `crm`/`telegram-bots` echo stublari.

---

> ⏰ **Eslatma egasiga:** Bu vazifa har 2 soatda avtomatik ishlaydi. ~1 oydan keyin kerak bo'lmasa, "Scheduled" panelidan o'chiring.
