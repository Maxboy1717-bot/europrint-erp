# TUZATISH PROGRESS — Transmissiya ulash (leverage tartibi)
> Boshlandi: 2026-06-05 | Rol: EDITOR (bitta agent, inline, subagent yo'q) | DB: europrint

## BOSQICH 0 — kanonik qarorlar (egasi, 2026-06-05)
**sales_orders** (buyurtma) · **entries** (GL) · **warehouse_stock** (stock).
→ to'liq: `docs/transmissiya-bosqich0-qarorlar-2026-06-05.md`

## BOSQICH 1 — ijro jurnali (har biri: verify→fix→DB-proof→commit)
| # | Leverage | Nima qilindi | DB-proof | Commit |
|---|---|---|---|---|
| 1 | **#5 PO HITL** | STRING `'PO_REQUIRES_DIRECTOR_APPROVAL'` (poId=0, save-oldidan, CQRS route qilolmaydi) → `PoRequiresDirectorApprovalEvent` klass + `@EventsHandler` → `hitl_approvals` insert (direktor dashboard o'qiydi). + owner-approved DDL: hitl_approvals.id'ga identity (sequence drift). | direktor pending PO ko'radi; auto-id; cleanup 0 | `68d3cb56` |
| 2 | **#5b 3-way-match** | STRING `'THREE_WAY_MATCH_FAILED'` → `ThreeWayMatchFailedEvent` klass + listener → hitl_approvals (entity_type='three_way_match'). | menejer pending match-fail ko'radi; cleanup 0 | `c0ffa9c5` |
| 3 | **#6 Security** | report-incident FAKE-CREATE (repo yo'q → saqlamaydi) → INCIDENT_REPO inject + save; ⭐ drifted repo.save (string-id→integer, type/location/reported_by yo'q) raw-SQL bilan live ustunlarga tuzatildi. | security_incidents real persist; cleanup 0 | `f41c984c` |
| 4 | **#6 Sensor** | record-sensor-reading FAKE-CREATE (repo yo'q) → SENSOR_REPO inject + saveReading; ⭐ drifted saveReading (iot_sensor_readings=VIEW over sensor_readings, device_id NOT NULL yo'q edi) tuzatildi. | iot_sensor_readings real persist; cleanup 0 | `60f441fb` |
| 5 | **MES→QC no-op** | mes-completed.listener HECH NARSA qilmasdi (faqat log) → real qc_inspection insert (status=pending, order_id=sessionId, reference_type='mes_session'). ⭐ qc save drift (string-id→int, reference_id=uuid, inspector_id=int) → direct drift-proof insert. | QC pending inspeksiya ko'radi; cleanup 0 | `a82cfd82` |
| 6 | **#4 POS movement→GL** | ⭐ verify-don't-trust master-plan tuzatildi: stock ALLAQACHON yoziladi (inline `_processCompletedMovement`); o'lik narsa = GL leg. `PosMovementCompletedEvent`ni publish qilsam WMS-sync listener stock'ni QAYTA yozardi (deferred FIX4 ikki-yozuv). **Variant C** (egasi tasdiqi): event YO'Q — faqat yetishmagan GL leg inline qo'shildi (GL_PAIRS → `pos_gl_posting_log` stage=POST, status=AWAITING_REVIEW; Moliya qo'lda tasdiqlaydi). ⭐ table real nomi=`pos_gl_posting_log` (Drizzle `gl_posting_log` emas); id sequence+enum'lar toza (drift yo'q). | EXTERNAL_IN total=56000→4 balansli entry (debit==credit=112000); ikki-yozuv yo'q; cleanup 0 | `05dcd49b` |
| 7 | **#6 Campaign two-worlds** | create-campaign SOXTA-CREATE + controller bo'lingan-miya (list/delete→marketing_campaigns ╳ create/get-one/patch→CQRS campaigns/uuid). Egasi qarori: **marketing_campaigns kanonik**. ⭐ verify-don't-trust kaskad drift: stub `marketingCampaigns.id`=number/serial, lekin jonli id=varchar(36) uuid default-siz → create id NULL, findOne/update varchar╳integer; stub description/platform yo'q; 3-vokabulyar type zid. To'liq fix: `campaigns.repository`ni RAW SQL (string id, jonli ustunlar, ::numeric/::timestamp/::integer cast, camelCase alias) qildim; controller 5 route campaignsSvc'ga (uuid id). CQRS slice o'lik kod. | to'liq lifecycle: create(camelCase, created_by 30 int)→update(COALESCE saqlaydi)→list ko'radi→softdelete yashiradi→cleanup 0 | `0eb419b4` |

## BOSQICH 2 — katta build (kanonik ulash)
| # | Ish | Nima qilindi | DB-proof | Commit |
|---|---|---|---|---|
| 2.1 | **POS GL → `entries` (kanonik daftar)** | POS GL log tasdiqlanганда status faqat `POSTED` bo'lardi, lekin kanonik `entries` daftariga YOZMASDI (Q-40 yolg'on POSTED). Engine: `postMovementToLedger` — `gl_account_mappings` (transaction_type) → `accounts.id` → bitta balansli `entries` yozuvi (amount=Σqty×price). Idempotent. Mapping yo'q bo'lsa → graceful skip (hisob TO'QIMAS). ⭐ drift: GL_PAIRS kodlari (1410/2110...) jonli CoA (1000/1010/2010...) bilan MOS EMAS; gl_account_mappings bo'sh edi. | engine: INTERNAL_ISSUE temp→entries; idempotent; skip; cleanup 0 | `be60bd35` |
| 2.2 | **GL mapping seed** (egasi tasdiqi) | 6 mapping (EXTERNAL_IN/OUT, INTERNAL_ISSUE/RETURN, DAMAGE, INVENTORY_ADJ_PLUS) → real CoA debit/kredit. INTERNAL_TRANSFER skip (GL ta'siri yo'q). Jonli seed (idempotent). | 6/6 CoA'ga bog'landi; jonli EXTERNAL_IN→entries Dr1010/Cr6000 amount=60000 | `b45a6576` |
| 2.3 | **davomat → payroll** | payroll aiCalculate `attendanceWorkDays`=DEFAULT_WORK_DAYS (qattiq 22) ishlatardi, real `attendance`ni o'qimasdi. Yangi `getAttendanceWorkDays`: present/late=1, half_day=0.5, overtime SUM(overtime_minutes); ma'lumot yo'q→fallback 22 (0 emas). ⭐ Ma'no: maosh MATEMATIKASI o'zgarmadi (compute() workDays ishlatmaydi=fixed maosh shartnoma summasi); faqat ko'rsatilgan/saqlangan ish-kun + AI evidence aniq bo'ldi. Proration (yo'qlama uchun maosh ushlash) = alohida biznes-qaror, deferred. | 20 present+1 late+1 half+1 absent+120min OT → 21.5 kun, 2h OT, hasData=true; ma'lumotsiz→fallback 22 | `071aa9c4` |

| 2.4 | **sales_orders line-items** (vizyon yadrosi: buyurtma→ishlab chiqarish) — 5 STEP, egasi qarori: line=**products** (tayyor mahsulot), material_id=ishlab chiqarish tomoni | **STEP1** shakl tahlil (faqat material_id, product_id yo'q) → **STEP2** DDL `product_id`→products FK (`e29400c9`) → **STEP3** BE: order create line-items saqlash (saveItems, tx-atomik, `4ea38f49`) → **STEP4** FE qator editori + ⭐ snake→camel contract drift fix (`c8407271`) → **STEP5** MPS `COALESCE(product_id,material_id)` o'qiydi (`f4bab1ec`) | STEP3: 2 qator product-bound saqlandi; STEP5: product line-item MPS'da ko'rindi (eski material_id NULL=topmasdi); har biri cleanup 0 | 5 commit |

| 2.5 | **Production fan-out** (Phase 4 oxirgi bo'lim — line-items bilan ochildi) | Advance-approved fan-out mold/design/cliche/logistics/warehouse ulagan, lekin **production DEFERRED** edi ("line-item+katalog yo'q"). Endi bor → wire qildim: `createProductionJob` har product line-item uchun `production_orders` yaratadi (order_number `PRO-<so>-<item>`, product_id, planned_quantity=order_quantity, sales_order_id link); bom_id NULL (explosion keyin); idempotent. Listener `dept==='production'` branch. | order 2 product-qator → 2 production_order (product/qty/so to'g'ri, bom NULL); re-fire 0; cleanup 0 | `c1b73d3a` |

✅ **Order → ishlab chiqarish zanjiri TO'LIQ**: order(line-items) → advance → fan-out → **6/6 bo'lim** (mold/design/cliche/logistics/warehouse/**production**).

⚠️ Keyingi (BOSQICH 2 davomi): **BOM material explosion** (production_order → bom_items → material requirements) — egasi BOM'larni aniqlagach (bom_* jadvallar bo'sh). products katalog (egasi). EXTERNAL_OUT tannarx legi (multi-leg). Payroll proration (biznes-qaror).

## ⭐ Naqsh (verify-don't-trust): har leverage-fix yashirin drift tutdi
Transmissiya ulaganda har repo.save/insert **buzuq** (drift) bo'lib chiqdi: string-id→integer ustun, VIEW→base-jadval NOT NULL, uuid╳integer, omitted-columns. Ya'ni "yashil skelet" nafaqat ulanmagan — DB-yozuv yo'llari ham drifted edi. Har biri DB-proof bilan tutildi va tuzatildi.

## Keyingi qadamlar (poydevor tayyor, tartibda)
- **#5c** — `iot.sos.raised` (grep: topilmadi — tekshir), `SecurityIncidentDetected` (allaqachon klass — listener ixtiyoriy).
- ~~**#6 fake-create sweep** — TUGADI: security/sensor (repo.save), campaign (marketing_campaigns repoint). Keng skan: boshqa CQRS soxta-create YO'Q; design (request-design) allaqachon real (DESIGN_REPO.save).~~
- **#1** — manager_id: daraxt-yurish (ancestor head) yoki org-head data (BLOKLANGAN — manba yo'q).
- ~~**#4** — DONE (Variant C, `05dcd49b`): inline GL leg, ikki-yozuvdan qochildi.~~
- **BOSQICH 2** (keyingi katta) — sales_orders line-items, entries post* ulash, davomat→payroll. Kanonik tayyor (qaror kerak emas).

## ⛔ DEFERRED — egasi qarori kerak (Q-34 ikki-dunyo / two-worlds)
- ✅ ~~**Campaign two-worlds — HAL QILINDI** (`0eb419b4`): egasi `marketing_campaigns`ni tanladi; repo RAW SQL'ga (varchar id) ko'chirildi, controller 5 route campaignsSvc'ga. To'liq lifecycle DB-proof PASS.~~
- **(arxiv) Campaign (marketing) ikki-dunyo** — `create-campaign.handler` SOXTA-CREATE (repo yo'q, saqlamaydi). Tuzatish **ikki-dunyo qaroriga** taqalgandi:
  - `marketing.controller` **bo'lingan-miya**: LIST `@Get()` + DELETE → `campaignsSvc` (legacy) → **`marketing_campaigns`** (id=varchar, created_by=**integer** nullable, soft-delete) — ⭐ FE shu jadvalni o'qiydi. CREATE/GET-ONE/PATCH/LAUNCH → CQRS → **`campaigns`** (id=uuid, created_by=**uuid NOT NULL**).
  - id turlari ham zid: DELETE `parseInt(id,10)` (integer) ╳ PATCH uuid-string.
  - `campaigns.created_by` uuid, lekin app user-id = **integer** (`users.id`=integer) → CQRS save "30"→uuid CRASH. Ikkala jadval ham 0 qator.
  - **Kanonik nomzod: `marketing_campaigns`** (FE-list+delete+ext-repos shuni o'qiydi, integer-mos). To'liq fix = CREATE/GET-ONE/PATCH/LAUNCH ni `marketing_campaigns`ga ko'chirish (4 handler) — egasi tasdiqi kerak (Q-34/Q-35 emas, faqat table-tanlash).
  - ⚠️ Yarim-fix TAQIQ (Q-33): faqat create'ni ko'chirsam, get-one/patch boshqa jadvaldan o'qiydi = nomuvofiq.

## Eslatma (verify-don't-trust topilmalari)
- hitl_approvals.id sequence-siz edi (drift) — DDL bilan tuzatildi.
- Leverage #1 (manager_id) 0/30 derive — manbasiz, daraxt-yurish/org-data kerak.
- pos: stock_alerts jadvali YO'Q (reja xato) — low-stock ledger balansidan hisoblandi.
