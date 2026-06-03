# STATUS-2 — Write Endpoint Statik Katalog (2026-06-02)

> **Rol:** Tahlilchi (READ-ONLY). Hech bir write endpoint JONLI chaqirilmadi — faqat
> kod statik tahlili + read-only `information_schema` so'rovlari (`_audit/q.cjs`).
> Manba: `apps/api/src`. Jonli DB: `europrint`@127.0.0.1:5432.

## Qamrov (halol)

- **Jami write dekorator:** 1340 ta (`@Post`×830, `@Patch`×275, `@Delete`×143, `@Put`×92), 301 controller/fayl bo'ylab.
- **Metodologiya:** 1340 endpointni bittalab o'qib bo'lmaydi. Shuning uchun **signal-asosli triage**:
  1. Butun kod bazasi bo'ylab fake-create markerlari (`id: Date.now()`, `{ success: true }` / `{}` no-op qaytaruvchi write metodlar) global grep bilan topildi — bularning **HAMMASI** o'qildi.
  2. Barcha `notImplemented()` / `NOT_IMPLEMENTED` write endpointlar (501) ajratildi va tasdiqlandi (false-positive'lar qo'lda filtrlash bilan).
  3. Maqsad jadvallar 1 batch'da `information_schema` orqali tekshirildi (40+ jadval).
  4. Asosiy real-write modullari (finance/sd/pp/qc/hr/crm/wms/mes/mm/pos/lms) servis qatlamida INSERT mavjudligi bilan tasdiqlandi.
- **To'liq o'qilgan controllerlar:** ~25 ta (barcha fake-create/501 manbalar + namuna real-write). Qolgan ~276 fayl signal-skan + servis-INSERT tasdiq bilan qamrab olindi (bittalab o'qilmadi).
- **Eslatma:** Memory'dagi ba'zi drift da'volari **eskirgan** bo'lib chiqdi (pastga qarang).

---

## Eskirgan drift da'volari — JONLI DB bilan TEKSHIRILDI

| Da'vo (memory) | Jonli holat 2026-06-02 | Xulosa |
|---|---|---|
| `work_centers.efficiency_rate` YO'Q → CRP 503 | ustun **BOR** | ✅ TUZATILGAN |
| `positions.id` sequence buzuq | `id` ustun **BOR** | ✅ qisman tuzatilgan |
| `domain_events.id` cuid2 default buzuq | default = `gen_random_uuid()` | ✅ TUZATILGAN |
| `sd_sales_orders.version` default yo'q | default = `0` | ✅ TUZATILGAN |
| `material_cards.name` YO'Q (xom_ashyo) | `name` YO'Q, `xom_ashyo` BOR | ⚠️ HALI DRIFT (faqat o'qishda) |
| `org_departments.name_uz` YO'Q | `name_uz` YO'Q | ⚠️ HALI DRIFT |
| `employees.manager_id` 0/30 NULL | ustun BOR (data NULL) | (data masalasi, drift emas) |

---

## 1-MODUL: compatibility (142 write endpoint)

| Endpoint | Tur | Real/Fake/Stub | Maqsad jadval (bor?) | Validatsiya | Kutilgan status | Muammo |
|---|---|---|---|---|---|---|
| POST /asset-management/assets | POST | REAL | assets (✅, svc) | Zod AssetSchema | 201 | — |
| PUT /asset-management/assets/:id | PUT | REAL | assets (✅) | Zod partial | 200 | — |
| DELETE /asset-management/assets/:id | DELETE | REAL | assets (✅) | — | 200 | — |
| POST /asset-management/maintenance | POST | REAL | asset_maintenance (✅) | Zod | 201 | — |
| POST /asset-management/disposals | POST | REAL | asset_disposals (✅) | Zod | 201 | — |
| POST /asset-management/transfers | POST | REAL | asset_transfers (✅) | Zod | 201 | — |
| **POST /asset-management/insurance** | POST | **💀 FAKE** | asset_insurance (✅ bor!) | yo'q (Record) | 200 lekin saqlamaydi | `return { id: Date.now(), ...b, created: true }` — jadval bor, lekin yozmaydi |
| PUT /asset-management/assets/:id/depreciate | PUT | 💀 FAKE (echo) | — | yo'q | 200 (echo) | `return { id, depreciated: true, ...b }` — hisob yo'q, yozuv yo'q |
| POST /asset-management/assets/:id/depreciate | POST | 💀 FAKE (echo) | — | yo'q | 200 (echo) | bir xil echo |
| PUT/PATCH /asset-management/maintenance/:id/complete | PUT/PATCH | 💀 FAKE (echo) | asset_maintenance (✅) | yo'q | 200 (echo) | status echo, DB update yo'q |
| POST /saas (create) | POST | STUB | tenants | yo'q | 501 | notImplemented |
| POST /saas/tenants/:id/onboard | POST | STUB | — | yo'q | 501 | notImplemented |
| PATCH /saas/tenants/:id/modules | PATCH | STUB | — | — | 501 | notImplemented |
| DELETE /saas/tenants/:id | DELETE | STUB | — | — | 501 | notImplemented |
| POST /orders-registry | POST | STUB | — | — | 501 | notImplemented |
| POST /europrint-control/deleted-records/:id/restore | POST | STUB | — | — | 501 | notImplemented |
| Boshqa ~120 (resources, warehouse-*, pos-warehouse-integration, ...) | mix | asosan REAL | material_cards (✅, `xom_ashyo` to'g'ri), pos_* | qisman | 200/201 | resources.service INSERT `xom_ashyo` ishlatadi — to'g'ri |

## 2-MODUL: design (2 write fayl)

| Endpoint | Tur | Real/Fake/Stub | Maqsad jadval (bor?) | Validatsiya | Kutilgan status | Muammo |
|---|---|---|---|---|---|---|
| POST /design | POST | REAL (CQRS) | design_orders (✅) | DTO | 201 | RequestDesignCommand → repo |
| PATCH /design/:id/status | PATCH | REAL (CQRS) | design_orders (✅) | DTO | 200 | UpdateDesignStatusCommand |
| **POST /design/orders** | POST | **💀 FAKE** | design_orders (✅ bor!) | Zod | 201 lekin saqlamaydi | `return { id: Date.now(), ...dto, created: true }` |
| **POST /design/orders/:id/messages** | POST | **💀 FAKE** | design_order_messages (❌ yo'q) | Zod | 201 lekin saqlamaydi | `id: Date.now()` echo |

## 3-MODUL: finance (24 write fayl)

| Endpoint | Tur | Real/Fake/Stub | Maqsad jadval (bor?) | Validatsiya | Kutilgan status | Muammo |
|---|---|---|---|---|---|---|
| POST /finance-extended/income-expense | POST | REAL | finance_income_expense (svc) | Zod | 201 | — |
| PUT/DELETE income-expense/:id | PUT/DEL | REAL | (svc) | Zod | 200 | — |
| **POST /finance-extended/inventory-counts** | POST | **💀 FAKE** | inventory_counts (✅ bor!) | Zod | 201 lekin saqlamaydi | `id: Date.now()` |
| **POST /finance-extended/asset-inventory** | POST | **💀 FAKE** | asset_inventory (✅ bor!) | Zod | 201 lekin saqlamaydi | `id: Date.now()` |
| **POST /finance/cfo-config** | POST | **💀 FAKE** | — | yo'q | 201 lekin saqlamaydi | `return { success: true }` — svc chaqiruv yo'q |
| POST /finance/payments (legacy record) | POST | STUB (qasddan) | finance_payments (✅) | — | 501 | qasddan: orphan to'lov GL'ni buzardi; to'g'ri yo'l `/finance/payments/record` |
| POST /finance/payments/record | POST | REAL | finance_payments (✅) + GL | Zod | 201 | GL posting bilan (memory) |
| POST /finance/extended/payroll-calculations/:id/approve | POST | STUB | payroll_calculations | — | 501 | notImplemented |
| Boshqa GL/AR/AP/payroll (compute/approve/run) | mix | REAL | gl_*, finance_* (svc) | Zod | 200/201 | INSERT mavjud (21 fayl) |

## 4-MODUL: iot (11 write fayl) — eng yomon stub klaster

| Endpoint | Tur | Real/Fake/Stub | Maqsad jadval (bor?) | Validatsiya | Kutilgan status | Muammo |
|---|---|---|---|---|---|---|
| **POST /iot-sensors** | POST | **💀 FAKE** | iot_sensors (✅ bor!) | Zod | 201 lekin saqlamaydi | `id: Date.now()` |
| PATCH /iot-sensors/alerts/:id/resolve | PATCH | STUB | — | Zod | 501 | notImplemented |
| POST /iot/tablet/sessions | POST | STUB | — | — | 501 | notImplemented |
| POST /iot/production-sessions | POST | STUB | — | — | 501 | notImplemented |
| POST /iot/production-sessions/:id/start | POST | STUB | — | — | 501 | notImplemented |
| POST /iot/production-sessions/:id/stop | POST | STUB | — | — | 501 | notImplemented |
| POST /iot/production-sessions/:id/defect | POST | STUB | — | — | 501 | notImplemented |
| POST /iot/production-sessions/:id/evaluation | POST | STUB | — | — | 501 | notImplemented |
| POST /iot/production-sessions/:id/material-return | POST | STUB | — | — | 501 | notImplemented |
| POST /iot/production-sessions/:id/inline-qc | POST | STUB | — | — | 501 | notImplemented |
| POST /iot/tablet/handover | POST | STUB | — | — | 501 | notImplemented |
| POST/PATCH /iot/material-kit-items/:id/scan | POST/PATCH | STUB | — | — | 501 | notImplemented (×2) |
| POST /iot/alerts | POST | STUB | — | — | 501 | notImplemented |
| PATCH /iot/devices/:id | PATCH | STUB | — | — | 501 | notImplemented |

## 5-MODUL: wms (19 write fayl)

| Endpoint | Tur | Real/Fake/Stub | Maqsad jadval (bor?) | Validatsiya | Kutilgan status | Muammo |
|---|---|---|---|---|---|---|
| POST /warehouse/transfers | POST | REAL | warehouse_transfers (✅, svc) | Zod | 201 | — |
| POST /warehouse/internal-requests | POST | REAL | (svc) | Zod | 201 | — |
| POST /warehouse/goods-receipts | POST | REAL | goods_receipts (✅) | Zod | 201 | — |
| POST /warehouse/goods-receipts/:id/complete | POST | REAL | (svc) | — | 201 | — |
| POST /warehouse/goods-receipts/lines/:id/qc | POST | REAL | goods_receipt_lines (✅) | Zod | 201 | — |
| **POST /warehouse/goods-receipts/:id/lines** | POST | **💀 FAKE** | goods_receipt_lines (✅ bor!) | Zod | 201 lekin saqlamaydi | `id: Date.now()` |
| GET /warehouse/transfers/:id | GET | 💀 FAKE (echo) | — | — | 200 | `{ id, status: 'pending' }` hardcoded |
| PATCH /warehouse/transfers/:id/status | PATCH | 💀 FAKE (echo) | — | Zod | 200 (echo) | DB update yo'q, body echo |
| **POST /wms-inventory** (adjustment) | POST | **💀 FAKE** | — | yo'q | 201 lekin saqlamaydi | `return { success: true }` svc yo'q |
| **POST /wms-stock** (createStock) | POST | **💀 FAKE** | — | yo'q | 201 lekin saqlamaydi | `return { success: true }` svc yo'q |
| POST /wms/barcode/material-kits | POST | STUB | — | — | 501 | notImplemented |
| POST/PATCH/DELETE /wms/barcode/printer-config | mix | STUB | — | — | 501 | notImplemented |
| PATCH /wms/barcode/material-kits/:id/status | PATCH | STUB | — | — | 501 | notImplemented |
| POST /wms/integration, /warehouses/:id/sync-pos | POST | STUB | — | — | 501 | notImplemented |
| POST /wms/iot-enhanced/orders/:id/calculate-bom | POST | STUB | — | — | 501 | notImplemented |

## 6-MODUL: hr (162 write endpoint — eng katta)

| Endpoint | Tur | Real/Fake/Stub | Maqsad jadval (bor?) | Validatsiya | Kutilgan status | Muammo |
|---|---|---|---|---|---|---|
| Asosiy massa (~150): employees, payroll, leave, shifts, skills, incidents, cases, pipeline, vacancies | mix | **REAL** | employees/users/payroll/... (✅, 47 fayl INSERT) | Zod | 200/201 | servis qatlami real DB yozadi |
| **POST /hr/.../attendance** (general-legacy-b) | POST | **💀 FAKE** | attendance (✅ bor!) | Zod | 201 lekin saqlamaydi | `id: Date.now()` |
| hr-dashboard.controller (~14 metod) | mix | STUB | — | qisman | 501 | `NOT_IMPLEMENTED` (pip/:id, birthdays/settings, daily-reports POST) |
| POST /hr/hrc-tests/sessions | POST | STUB | — | — | 501 | notImplemented |
| POST /hr/hrc-tests/tool-test/questions | POST | STUB | — | — | 501 | notImplemented |
| PATCH/DELETE /hr/hrc-tests/tool-test/questions/:id | PATCH/DEL | STUB | — | — | 501 | notImplemented |
| POST /hr/recruitment/pipeline/:id/checklist | POST | STUB | — | — | 501 | notImplemented |
| Telegram-bots POST (notify-*, vacancy-published) | POST | REAL | (svc yon-ta'sir) | Zod | 201 | `return {}` lekin svc.notify* CHAQIRILADI — fake EMAS |

## 7-MODUL: crm (15 write fayl)

| Endpoint | Tur | Real/Fake/Stub | Maqsad jadval (bor?) | Validatsiya | Kutilgan status | Muammo |
|---|---|---|---|---|---|---|
| POST /crm/leads, /quick | POST | REAL | crm_leads (✅) | Zod | 201 | — |
| PATCH /crm/leads/:id/stage, /qualify | PATCH | REAL | crm_leads (✅) | Zod | 200 | — |
| **POST /crm/leads/:id/emails** | POST | **💀 FAKE** | (email log jadval yo'q) | Zod | 201 lekin saqlamaydi | `id: Date.now()`, sent: true — email yuborilmaydi, log yozilmaydi |
| convert (lead→deal) | POST | REAL | crm_deals (✅) | Zod | 201 | memory: assigned_by_id fix bor |

## 8-MODUL: pp / qc / mm / mes / sd (real-write yadro)

| Endpoint | Tur | Real/Fake/Stub | Maqsad jadval (bor?) | Validatsiya | Kutilgan status | Muammo |
|---|---|---|---|---|---|---|
| sd: order create + fan-out (5 dept) | POST | REAL | sd_sales_orders/sd_order_departments/ow_* (✅) | Zod | 201 | memory: Phase 4 jonli isbot |
| pp: production orders, routing | mix | REAL | pp_* (✅, 9 fayl INSERT) | Zod | 200/201 | — |
| POST /pp/technology/cards/generate | POST | STUB | — | — | 501 | notImplemented |
| POST /pp/technology/cards/:id/optimize | POST | STUB | — | — | 501 | notImplemented |
| POST /pp/technology/orders/:id/reject | POST | STUB | — | — | 501 | notImplemented |
| qc: defects, reclamations | mix | REAL | qc_* (✅, 13 fayl INSERT) | Zod | 200/201 | — |
| PATCH /qc/defects/:id/resolve | PATCH | STUB | — | — | 501 | notImplemented |
| POST /qc/lab-tests | POST | STUB | — | — | 501 | notImplemented |
| mm: purchase orders, vendor invoices | mix | REAL+STUB | mm_* (✅, 6 fayl INSERT) | Zod | 200/201/501 | 3way-match, fleet/deliveries, vendor-invoices match/payment/approve = STUB |
| mes: sessions, telemetry | mix | REAL | mes_* (✅, 7 fayl INSERT) | Zod | 200/201 | — |

## 9-MODUL: boshqa (lms, kanban, pos, communication-center, security, ai, integration, org-structure)

| Endpoint | Tur | Real/Fake/Stub | Maqsad jadval | Validatsiya | Kutilgan status | Muammo |
|---|---|---|---|---|---|---|
| **POST /cc/notification-prefs** | POST | **💀 FAKE** | — | yo'q | 201 lekin saqlamaydi | `return { success: true }` svc yo'q |
| **POST /ideal-rasm** | POST | **💀 FAKE** | — | yo'q | 201 lekin saqlamaydi | `return { success: true }` svc yo'q |
| kanban: boards/cards CRUD | mix | REAL | kanban_* (✅) | Zod | 200/201 | `return {}` real svc'dan keyin |
| POST /pos/sales (pos-stub) | POST | STUB | — | — | 501 | notImplemented |
| POST /pos/stock/adjust | POST | STUB | — | — | 501 | notImplemented |
| lms: lessons, misc | mix | REAL+STUB | lms_* (✅, 12 fayl INSERT) | Zod | 200/201/501 | DELETE /lms/lessons/:id, POST /lms-misc, PATCH :id/view = STUB |
| security: visitors/:id/exit | POST | STUB | — | — | 501 | notImplemented |
| ai: call, rush-orders approve/reject | POST | STUB | — | — | 501 | notImplemented |
| integration: expense, invoice | POST | STUB | — | — | 501 | notImplemented |
| ai-agents/:agentId/trigger | POST | STUB | — | — | 501 | notImplemented |
| org-structure: nodes/:id/folder/:itemId DELETE | DELETE | STUB | — | — | 501 | notImplemented |
| kanban cards/:id/chat, chat-messages/:id/files | POST | STUB | — | — | 501 | notImplemented |
| mm fleet/fuel-logs, remaining/material-balance negative-stock-check | POST | STUB | — | — | 501 | notImplemented |

---

# YAKUN

## Umumiy raqamlar
- **Jami write endpoint (dekorator):** **1340** (Post 830 / Patch 275 / Delete 143 / Put 92), 301 fayl.
- **REAL (DB ga yozadi):** taxminan **1290+** (asosiy massa — servis qatlamida INSERT/UPDATE/DELETE mavjud; 13 modulda 200+ INSERT-li fayl tasdiqlandi).
- **💀 FAKE-CREATE (200/201 qaytaradi, lekin saqlamaydi):** **18 ta** (quyida).
- **STUB (501 notImplemented write):** **~48 ta** (eng zich: iot ×14, hr-dashboard ×~6, mm ×6, wms-barcode/integration ×7, compatibility/saas ×5, pp ×3, lms ×3).
- **DRIFT (chaqirilsa 5xx):** write yo'lida **0 ta jiddiy** topildi (eski drift'lar tuzatilgan). Faqat 1 ta READ-drift qoldi (`erp-extra.repo` `mc.name`); `design_order_messages` jadval yo'q lekin u FAKE (yozmaydi, shuning uchun 500 bermaydi).

## QOLGAN FAKE-CREATE endpointlar (18 ta — saqlamasdan muvaffaqiyat qaytaradi)
1. `POST /asset-management/insurance` → `id: Date.now()` (asset_insurance JADVAL BOR, yozilmaydi)
2. `PUT/POST /asset-management/assets/:id/depreciate` (echo, ×2)
3. `PUT+PATCH /asset-management/maintenance/:id/complete` (echo, ×2)
4. `POST /design/orders` → `id: Date.now()` (design_orders BOR)
5. `POST /design/orders/:id/messages` → `id: Date.now()` (design_order_messages YO'Q)
6. `POST /finance-extended/inventory-counts` → `id: Date.now()` (inventory_counts BOR)
7. `POST /finance-extended/asset-inventory` → `id: Date.now()` (asset_inventory BOR)
8. `POST /finance/cfo-config` → `{ success: true }` (svc yo'q)
9. `POST /iot-sensors` → `id: Date.now()` (iot_sensors BOR)
10. `POST /warehouse/goods-receipts/:id/lines` → `id: Date.now()` (goods_receipt_lines BOR)
11. `GET /warehouse/transfers/:id` → hardcoded `{ status: 'pending' }`
12. `PATCH /warehouse/transfers/:id/status` → body echo (DB update yo'q)
13. `POST /wms-inventory` (adjustment) → `{ success: true }` (svc yo'q)
14. `POST /wms-stock` (createStock) → `{ success: true }` (svc yo'q)
15. `POST /hr/.../attendance` (general-legacy-b) → `id: Date.now()` (attendance BOR)
16. `POST /crm/leads/:id/emails` → `id: Date.now(), sent: true` (email yuborilmaydi)
17. `POST /cc/notification-prefs` → `{ success: true }` (svc yo'q)
18. `POST /ideal-rasm` → `{ success: true }` (svc yo'q)

> ⚠️ Eng achchiq holat: **#1, #4, #6, #7, #9, #10, #15** — maqsad jadval JONLI DB'da MAVJUD, lekin
> endpoint unga yozmaydi (faqat `Date.now()` echo qaytaradi). Bu eng oson tuzatiladigan fake-create'lar.

> ℹ️ general-legacy-a `machine-tasks`/`planning/operations` POST'lari fake EMAS — ular real
> `svc.create*()` ni chaqiradi va FAQAT `.catch()` ichida `id: Date.now()` fallback beradi (xato bo'lsa).

## DRIFT-WRITE endpointlar (chaqirilsa 5xx)
- **JIDDIY write-drift: 0 ta.** Eski drift-blokerlari tuzatilgan: `domain_events.id`=gen_random_uuid, `sd_sales_orders.version` def=0, `work_centers.efficiency_rate` BOR, `positions.id` BOR.
- Qolgan kichik drift'lar **write yo'lida emas**:
  - `erp-extra.repository.ts:59` — `material_cards mc.name` SELECT (ustun YO'Q, `xom_ashyo` bor) → bu READ (STATUS-1 doirasida).
  - `org_departments.name_uz` YO'Q → hr-map departments READ 503 (write emas).
  - `design_order_messages` jadval YO'Q, lekin endpoint FAKE (yozmaydi) → 500 bermaydi.

## Eng yomon modullar (write sifati bo'yicha)
1. **iot** — 14 ta write 501-stub (production-sessions oqimi butunlay stub) + 1 fake (`POST /iot-sensors`).
2. **compatibility** — 5 fake-create echo (asset-management) + 5 saas/orders-registry stub.
3. **wms** — 5 fake-create (`/wms-inventory`, `/wms-stock`, goods-receipt lines, transfer status/get) + 7 barcode/integration stub.
4. **hr-dashboard / hrc-tests** — ~10 yozish stub (pip, birthdays, daily-reports, sessions, questions).
5. **finance** — 3 fake-create (cfo-config, inventory-counts, asset-inventory) — qolgan GL/payroll yadrosi REAL.

## Qamrov bayonoti (halol)
- 1340 endpointning **HAMMASI** signal-skan bilan ko'rib chiqildi (Date.now / {success:true} / notImplemented global grep).
- ~25 controller TO'LIQ o'qildi (barcha fake/stub manbalari + namuna real-write).
- Qolgan ~276 fayl servis-qatlam INSERT mavjudligi bilan "REAL" deb tasniflandi (bittalab o'qilmadi — agar servis ichida yashirin fake bo'lsa, u bu skan'da ko'rinmaydi).
- Maqsad jadvallar 40+ tasi jonli `information_schema` orqali tasdiqlandi.
