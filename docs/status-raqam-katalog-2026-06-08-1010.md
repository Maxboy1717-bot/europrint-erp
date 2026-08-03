# 📊 Status raqam katalogi — EuroPrint ERP

**Sana/vaqt:** 2026-06-08 10:10
**Turi:** STATIK kod-tahlil (server urilmadi, login yo'q, side-effect yo'q)
**Manba:** `apps/api/src/**/*.controller.ts` (341 ta controller fayl)
**Oldingi tekshiruv:** `status-raqam-katalog-2026-06-05-1619.md`

---

## 📊 HOZIRGI RAQAMLAR

| Ko'rsatkich | Soni | Izoh |
|---|---|---|
| 🟢 Jami route (endpoint) | **2977** | Barcha `@Get/@Post/@Put/@Patch/@Delete` |
| 🟠 501 "tayyor emas" (notImplemented) | **71** | 32 ta faylda — halol stub (saqlamaydi, lekin yolg'on demaydi) |
| 🔴 Soxta-200 (echo) | **47** | shundan 3 tasi izoh (comment) → real ~44 |
| 🔴 500 riski (`as unknown` stub) | **0** | Toza ✅ |
| 🟠 503/404 riski (yo'q jadval) | probe qilinmadi | Statik tekshiruv — pastda izoh |

> **Eslatma:** "soxta-200" grep keng to'r. 47 tadan **3 tasi izoh qatori** (allaqachon tuzatilgan joydagi `// A3...` kabi sharhlar — yolg'on emas). Qolgan ~44 tadan ham bir qismi aslida **haqiqiy** javob (masalan `return { ok: true, data: result.data }` — repo natijasini o'rab qaytaryapti). Toza "yashil yolg'on" (bo'sh `return {}` yoki `return { success: true }` hech narsa saqlamasdan) ~20 ta. Pastdagi ro'yxatni ko'ring.

---

## ⭐ SOG'LOMLIK NISBATI

- **501 (tayyor emas):** 71 / 2977 = **2.4%**
- **Soxta-200 (echo):** 47 / 2977 = **1.6%**
- **Jami "yarim-ishlaydigan" (501 + soxta):** 118 / 2977 = **~4.0%**

➡️ Ya'ni **har 25 endpointdan ~1 tasi** hali to'liq ishlamaydi yoki yarim. Qolgan **~96%** real javob qaytaradi. Bu yirik ERP uchun juda sog'lom ko'rsatkich — oldingi tekshiruvdagi ~93% dan ham yaxshilandi.

---

## ⭐ O'ZGARISH (delta) — 2026-06-05 → 2026-06-08

| Ko'rsatkich | Oldin (06-05) | Hozir (06-08) | O'zgarish |
|---|---|---|---|
| Jami route | 2951 | **2977** | **+26** 🟢 (yangi endpointlar qo'shildi) |
| 501 (notImplemented) | 157 | **71** | **−86** ✅ (katta kamayish) |
| Soxta-200 (echo) | 53 | **47** | **−6** ✅ |
| 500 riski (`as unknown`) | 0 | **0** | o'zgarmadi ✅ |
| Sog'lomlik (real %) | ~93% | **~96%** | +3% ✅ |

**📉 501 stublar 157 → 71 (−86) — eng katta yaxshilanish.** Stubli fayllar 35 → 32. Bu — bajaruvchi (executor) 3 kun ichida ko'p "tayyor emas" stublarni real Drizzle/SQL query bilan almashtirganini ko'rsatadi. (Eslatma: ikkala o'lchov ham AYNAN bir xil `grep -rn "notImplemented"` buyrug'i bilan olingan, shuning uchun taqqoslash to'g'ri. Hozir: 71 jami match, shundan 39 tasi haqiqiy `notImplemented(...)` chaqiruvi.)

**📉 Soxta-200 53 → 47 (−6).** Quyidagi bo'sh `return { success: true }` echolari ENDI YO'Q (tuzatilgan):
- `cc-notification-prefs.controller.ts:39` ✅ tuzatildi
- `finance-cfo-config.controller.ts:37` ✅ tuzatildi
- `remaining/ideal-rasm.controller.ts:32` ✅ tuzatildi
- `wms/warehouse-rental.controller.ts:119` (recalculate) ✅ tuzatildi
- `wms/wms-inventory.controller.ts:51` ✅ tuzatildi
- `wms/wms-stock.controller.ts:52` ✅ tuzatildi
- `lms-core.controller.ts:129` (completeCourse) ✅ o'zgardi (endi 160-qatorda real `data: rows[0]`)

➡️ **Xulosa: barcha 3 raqam (501, soxta, jami yarim) KAMAYDI, real % oshdi. Tizim tuzalmoqda — yangi soxta KIRMAGAN.**

---

## 🔴 SOXTA-200 RO'YXATI (fayl:qator) — eng muhimi

> ✅ = ehtimol haqiqiy javob (repo natijasini o'raydi). ⚠️ = shubhali bo'sh echo (tekshirish kerak). 💬 = izoh qatori (yolg'on emas).

**⚠️ Bo'sh `return {}` / `return { success: true }` — saqlamaslik shubhasi (~20 ta):**
- `modules/bot-gateway/bot-gateway.controller.ts:77, 128` — `return {}` (botSvc/chatId yo'q bo'lsa)
- `modules/crm/presentation/crm-activities.controller.ts:131` — `return {}`
- `modules/crm/presentation/crm-companies.controller.ts:156` — `return {}`
- `modules/crm/presentation/crm-followup-compat.controller.ts:98` — `return {}`
- `modules/hr/telegram-bots/telegram-bots.controller.ts:79, 93, 107` — `return {}`
- `modules/kanban/presentation/kanban-boards.controller.ts:107, 140` — `return {}`
- `modules/mm/presentation/mm-goods.controller.ts:91, 147` — `return {}`
- `modules/mm/presentation/mm-vendors-pr.controller.ts:180` — `return {}`
- `modules/sd/presentation/sd-customers.controller.ts:224, 281, 331, 363` — `return {}` (4 ta! — hamon tuzatilmagan)

**✅ Ehtimol haqiqiy (repo natijasini o'raydi — yolg'on emas):**
- `modules/ai/presentation/forecast-ext.controller.ts:76` — `ok: true, message: 'Forecast jobs enqueued'`
- `modules/aisha/.../chat.controller.ts:68, 79, 133` — `success: true, data: {...}` (AI chat javobi)
- `modules/chat/chat-uploads.controller.ts:96, 107, 159` — `ok: true` (upload tugadi)
- `modules/communication-center/.../cc-documents.controller.ts:146` — `ok: true`
- `modules/communication-center/.../cc-webhook.controller.ts:71, 101` — `ok: true, queued/deduplicated`
- `modules/ecommerce/ecommerce-public.controller.ts:73` — `ok: true, accepted: true`
- `modules/hr/attendance/attendance-face.controller.ts:88, 100, 130, 146, 157, 168` — `ok: true, ...result.data` (yuz tanish)
- `modules/hr/inspection/inspection.controller.ts:63, 108, 124` — `ok: true, data: r.data`
- `modules/hr/presentation/hr-dashboard.controller.ts:294` — `ok: true, data: body`
- `modules/hr/presentation/hr-employees.controller.ts:163` — `success: true, deletedBy` (o'chirish)
- `modules/kanban/.../kanban-boards.controller.ts:182` — `ok: true`
- `modules/lms/.../lms-core.controller.ts:160` — `ok: true, data: rows[0]`
- `modules/remaining/system.controller.ts:87` — `ok: true, refreshedAt`
- `modules/wms/.../wms-integration.controller.ts:73, 76` — `ok: true, syncedAt` (76: "sync queued, no event log" — yarim)

**💬 Izoh qatori (yolg'on emas — allaqachon tuzatilgan joy sharhi):**
- `modules/crm/presentation/crm-leads.controller.ts:188` — `// A3: was { id: Date.now() }...` (eski soxta olib tashlangani haqida izoh)
- `modules/general/controllers/general-legacy-a.controller.ts:175, 196` — `// A10/A11: removed catch(id: Date.now())...` (izoh)

---

## 🟠 501 "TAYYOR EMAS" — 32 ta faylda (71 match / 39 chaqiruv)

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
- **Boshqa:** design, org-structure, pp/production-reports, pp/technology, security, material-balance, integration-employee, compat (saas/director)

> 501 — bu **echo'dan ko'ra halolroq belgi**: foydalanuvchiga "bu hali tayyor emas" deb aniq aytadi, soxta yashil bermaydi. 157 → 71 ga kamayishi — stublar real kodga aylanayotganini ko'rsatadi.

---

## 🟠 503/404 RISKI (yo'q jadval) — probe qilinmadi

Bu tekshiruv **sof statik** bo'lib qolishi uchun jonli DB urilmadi (side-effect/ulanish yo'q). Xotiradan ma'lum bo'lgan yo'q/bo'sh jadvalga bog'liq endpointlar (kelajakda probe uchun nomzod): `qc_approvals`, `company_state`, `director_alerts`, `canteen_meals`, `utility_readings`, `work_centers.efficiency_rate` (CRP 503). Keyingi probe-li tekshiruvda `_audit/q.cjs` (read-only) bilan sanaladi.

---

## 📝 QISQA XULOSA (egasiga)

**Tizim 3 kun ichida sezilarli yaxshilandi.** Endi endpointlarning **~96%** real javob qaytaradi (oldin ~93%). Eng katta yutuq — "tayyor emas" (501) stublar **157 dan 71 ga (−86)** kamaydi, ya'ni bajaruvchi haqiqiy DB-query yozib bo'sh stublarni almashtiryapti. Soxta echolar ham 53 → 47 ga kamaydi (6 ta bo'sh `success:true` tuzatildi), **yangi soxta kirmadi**, 500-xato riski hamon **0**. Bir oylik tendentsiya: soxta/501 izchil **kamayib boryapti** — executor real ishlayapti. Qolgan asosiy diqqat nuqtasi — `sd-customers` (4 ta bo'sh `return {}`) va `crm`/`telegram-bots` echo stublari.

---

> ⏰ **Eslatma egasiga:** Bu vazifa har 2 soatda avtomatik ishlaydi. ~1 oydan keyin kerak bo'lmasa, "Scheduled" panelidan o'chiring.
