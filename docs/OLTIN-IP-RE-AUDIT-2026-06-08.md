# OLTIN IP (#03) — Faza-0 RE-AUDIT (read-only): SD→PP→MES→QC→WMS→FIN

> **Bajaruvchi 🟢 MASSIV | READ-ONLY | 2026-06-13 | 7-o'lchovli Workflow + grounding, hammasi jonli DB-proof (Q-29)**
> ⭐ Eski transmission map TUZATILDI: ko'p listener AYNAN MAVJUD (CQRS @EventsHandler), MES→QC endi no-op EMAS.
> Kanonik: orders=`sales_orders` (`orders` base **YO'Q** = ikki-dunyo allaqachon hal), stock=`warehouse_stock`, GL=`entries` (`gl_entries`=VIEW; `gl_journal_entries`=SAP #76 TEGMA).

## 0. XULOSA — zanjir ~85% ULANGAN, lekin HECH QACHON jonli oqmagan
Jonli DB: sales_orders=**12 (hammasi seed EP-2024-\*)**, sales_order_items=**0**, production_orders=0, mes=0, qc_inspections=0, warehouse_stock=25, entries=**1 (manual POS-GL-2)**, domain_events=**0**. Plumbing bor, lekin bironta HAQIQIY buyurtma uchidan-uchiga o'tmagan. 6 ta aniq uzilish bor (pastda) + DDL deyarli kerak emas (CONNECT).

| Hop | Event | Listener | Keyingi jadval yoziladimi | UZILISH |
|-----|-------|----------|---------------------------|---------|
| **0 SD create** | OrderCreated + outbox `sd.order.created` | — (start) | ✅ sales_orders(VIEW)+items+domain_events (atomik tx) | ⚠️ **customer_id TASHLANADI** (controller `customerId=undefined`, DTO'da yo'q) → har order customer_id=NULL |
| **1 SD→PP** | AdvanceApprovedEvent (avans≥70%) | ✅ 2 CQRS (SD fan-out + PP) | ✅ SD fan-out→`production_orders` (items'dan) + ow_material_requirements | items=0 + sd_order_departments=0 → fan-out no-op; **PP Trigger-7 `unlockPlanning` NOTO'G'RI kalit** (`id=${orderId}` → 0 row) |
| **2 PP→MES** | ❌ PP→MES event **YO'Q** | ❌ MESda PP listener YO'Q | ❌ session yaratilmaydi | (a) trigger yo'q; (b) 3 rival jadval (mes_production_sessions int / mes_sessions uuid / production_sessions); (c) **CQRS saveSession yo'q ustun (pp_id, certification_required) → throw**; (d) routing yoyilmaydi; (e) IoT tablet ishlaydi lekin production_order_id=0 |
| **3 MES→QC** | ✅ MesCompletedEvent | ✅ MesCompletedListener (real INSERT qc_inspections) | ✅ qc_inspections (counts 0,0,0) | ⚠️ Eski "no-op" da'vo STALE. Pending-only; REWORK API'dan yetib bo'lmaydi (submit binary); brak (qc_braks) ulanmagan; order_id=session id (identity) |
| **4 QC→WMS** | ✅ QcPassedEvent | ✅ QcPassedListener→receiveFg | ❌ **`stocks` (NOTO'G'RI) ga yozadi, `warehouse_stock` (kanonik) EMAS** | receiveFg → `stocks` (conflict #8, 0 row, bin yo'q); kanonik warehouse_stock (25, bin-aware) FG ko'rmaydi |
| **5 WMS→FIN** | inline `completed` + @OnEvent `approved` | ✅ but → `pos_gl_postings` / `gl_posting_log` | ❌ **kanonik `entries` ga AVTOMATIK yozilmaydi** | (1) inline `gl_posting_log` jadval **YO'Q** (throw); (2) approved→`pos_gl_postings` (parallel); (3) kanonik `entries` yozuvchi (`postMovementToLedger`) faqat MANUAL approve orqali |
| **6 Event infra** | outbox insertBatch (faqat SD create) | OutboxPublisher @Interval 10s | ❌ domain_events=0 | (1) hech kim outbox'ni ishlatmagan (seed data); (2) **publisher EE2 string emit qiladi, kanonik listenerlar CQRS @EventsHandler → bridge bir tomonlama (CQRS→EE2)** → outbox replay CQRS listenerga yetmaydi; (3) OrderCreatedDeliveryListener payload-starved; (4) manager_id 0/30 NULL |

## 1. ULANGAN (CONNECT, qayta qurish EMAS — C6)
- Order-create atomik (tx: header+items+outbox). AdvanceApproved→production_orders REAL. MES→QC REAL. QcPassed→receiveFg REAL. Movement→entries yozuvchi REAL (manual). Outbox cron ishlaydi. **Hammasi mavjud — faqat ulanmagan/noto'g'ri yo'naltirilgan.**
- `production_orders.sales_order_id` → FK → sales_orders ✅. pp-mps drift TUZATILGAN (COALESCE product_id/material_id, ::date cast). gl_account_mappings 8 qator. warehouse_stock unique idx (warehouse_id, material_id) MAVJUD → ON CONFLICT ishlaydi.

## 2. QURISH REJASI (hop-ba-hop CONNECT; DDL deyarli yo'q)
1. **HOP 0:** customer_id'ni create'ga ulash (DTO + controller + queries-sd INSERT). DDL yo'q (ustun bor). + ixtiyoriy credit-limit gate.
2. **HOP 1:** PP Trigger-7 `unlockPlanning` kalitini tuzat (`sales_order_id`). (items+dept acceptance-testda beriladi → fan-out→production_orders ishlaydi.)
3. **HOP 2:** @EventsHandler(PpReleasedEvent) MESga qo'sh → `mes_production_sessions` (int) yoz; saveSession ustunlarini tuzat (mavjud ustunlar). DDL yo'q (parametrized INSERT). FK = keyin (ixtiyoriy DDL).
4. **HOP 4:** `execReceiveFg`'ni `warehouse_stock` ga qayta yo'naltir (ON CONFLICT upsert, idx bor). DDL yo'q.
5. **HOP 5:** @OnEvent('pos.movement.data.completed') → mavjud `postMovementToLedger` (kanonik entries). gl_posting_log insert'ni guard/drop. DDL yo'q.
6. **HOP 6 (ixtiyoriy/keyin):** outbox publisher CQRS replay (EE2→CQRS) + payload boyit + manager_id backfill. Thread in-process bus orqali oqadi (bu hop durability uchun, oqim uchun shart emas).
7. **HOP 7:** acceptance-test — 1 order → har hopda DB-proof row (sales_orders→production_orders→mes_session→qc_inspections→warehouse_stock→entries). Vitest+Supertest+real PG.

## 3. DDL (faqat agar kerak bo'lsa — egasi SQL ko'rib "ha")
- Asosiy oqim **DDL'siz** (CONNECT). Ixtiyoriy keyingi: mes_production_sessions.production_order_id FK; routing explode; gl_posting_log jadval (yoki drop). Bularni alohida, egasi-ruxsati bilan.

## 4. STOP — Faza-0 tugadi (read-only). MASSIV: ruxsat so'ramayman, lekin DDL chiqsa SQL ko'rsataman, modul oxirida isbot beraman.
*Manba: 7-o'lchovli read-only Workflow (637k token) + grounding. [[project_transmission_map_2026_06_05]] (TUZATILDI) · [[project_two_worlds_phase12_2026_06_04]] · [[reference_live_db_location]].*
