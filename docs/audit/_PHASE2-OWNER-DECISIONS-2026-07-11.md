# Phase-2 Consolidated OWNER-DECISIONS — 2026-07-11 (workflow-verified)

369 items need new schema (Q-35 sign-off); 276 need a threshold/policy/data value; 297 chain-unlock as their dependencies get built. Answer these and the items convert to buildable.

## 08-mes

**Schema sign-off (Q-35) — 25:**
- #1 Operator sees only orders matching machine-matrix; wrong machine blocked -> New machine-type × operator permission table/column (distinct from course-based operator_certifications); also owner machine-taxonomy master data (item 89).
- #4 Session-start norma version is applied (no retro-break) -> ALTER/CREATE adding version + effective_date columns to a production-norm table (material_norms/technology_cards lack effective_date). Explicitly 'needs a schema change'.
- #24 Format/gramm compared vs WMS batch parameters -> New format/gramm columns on production_sessions (or a consumption table) + a WMS-comparison job.
- #25 Rework product = 'corrected-net'; separate GL cost line -> New 'corrected-net' quantity column distinct from defect_quantity; also owner must pick the GL rework cost account and GL two-world resolution is required downstream.
- #28 Sensorless energy = passport kVt × run-hours -> New passport-power (kVt) column on equipment; also owner kVt ratings per machine (item 89).
- #33 Academy/training work synced with LMS; excluded from OEE -> New training/academy boolean column on production_sessions, filtered out of get-oee.handler.ts.
- #34 Gofra layer count compared vs WMS intake -> New layer-count/gofra columns + WMS-intake comparison job; also owner gofra-profile master data.
- #36 OEE target editable only by НО/director; versioned -> New OEE-target settings table with effective-date versioning to replace hardcoded 85 at MESExtended.tsx:146; also owner target values.
- #49 Akt 2-signature gate blocks WMS material issue + MES session-start -> New two-signature material-issue Akt table/data model; also owner must define who the two required signers are.
- #83 1 operator + N named assistants + contribution % -> New machine_crew_members child table (session_id, employee_id, role_label, share_percent) replacing the 4 fixed-role columns; owner-sign-off restructure per Q-35.
- #84 Norma in hourly + 12-hour dual base -> New per-station production-rate norm table (station_id, unit, hourly_rate, twelve_hour_rate, effective_date) distinct from material_norms; also owner rate data + item 89 machine catalog.
- #85 Norma unit-of-measure per station (m²/лист/штук/удар) -> New station×unit junction table OR default_unit_id FK on equipment referencing unit_of_measures (19 rows); also item 89 catalog.
- #86 'ish yo'q' (no-work) counted separately from downtime -> New DT-NOWORK code in mes_downtime_reasons (additive seed = owner-gated migration per Q-35) + OEE penalty-exclusion logic. Blocks items 5/87.
- #92 One machine split across two departments (Флексо vs Упаковка) -> New equipment_department_assignments junction table (equipment currently has single work_center_id FK); also owner confirms which machines are shared + item 89.
- #94 One operator on several machines (share % / time) -> New multi-machine assignment table (operator_id, machine_id, date, share_percent); significant session-model redesign requiring owner sign-off (Q-34).
- #95 Final packaging as separate stage/norma -> New GsdStage enum value PACKAGING (new enum value = owner-gated) + a per-stage norm entry (depends on item 84 norm table); owner packaging-norm figure.
- #97 Mold-not-ready downtime code (KB signal) -> New DT-MOLD code in mes_downtime_reasons (additive seed migration) + repeat-occurrence counter; owner must define KB signal destination.
- #100 3-shift lunch waves (1/2/3) so machines never all stop -> New lunch-wave scheduling table (machine_id/shift_id → wave); owner must define wave-assignment rule.
- #104 Operator × machine skill matrix -> New operator_machine_matrix table (operator_id, machine_type, certified_at) distinct from course-based operator_certifications; owner defines cert level per machine type + item 89.
- #106 Store norma version + effective-date -> New effective_date + version columns on the norm table (same root schema as item 4/17).
- #108 Separate 'Академия'/training work classification -> New is_training_session boolean column on production_sessions (ALTER ADD COLUMN, owner-gated) excluded from OEE/GSD aggregates.
- #115 Link paper zayavka (заявка) to MES consumption -> New paper-request table (no %zayavka%/paper-request table exists) + comparison job vs mes_material_consumption; owner confirms paper-requisition workflow (likely WMS/MM).
- #116 Paper format (A×B) + gramm on session -> New format_a, format_b, gramm, kg columns on production_sessions (mes_papka_orders has them but is a different PP table, 0 rows).
- #123 Per-station brak% norming + over-threshold signal -> New per-station brak%-threshold table + session-close check; owner supplies acceptable brak% ceiling per station + item 89.
- #132 Approved unit-of-measure master-data (station × unit) -> Same as item 85: new station×unit junction table OR default_unit_id FK on equipment referencing unit_of_measures; owner unit-per-machine mapping + item 89.

**Decision / data — 7:**
- #11 Operator corrects qty; reason mandatory; deviation → WMS real-time event -> Approve the MES→WMS material-consumption norma-link design and populate material_norms (currently 0 rows) — the 'og'ish' (deviation) has no baseline to compute against until the norm source is decided/filled.
- #45 AI camera detects 20-min stop but MES has no downtime → anomaly -> Supply/approve the camera-based IoT stop-event data source (currently sparse/absent) — the cross-check job is codeable but has no camera data to compare downtime_events against.
- #68 Time-based stopped-machine escalation (15 min → НО, 30 min → director) -> Confirm the exact escalation thresholds (15/30 min?) and who receives each tier — the cron reuses the proven mes-sos-escalation.cron.ts template and status_started_at (no schema change), only the threshold values/recipients are undefined.
- #81 Bring 'А смена План' shift-plan form to a screen -> Supply/approve the exact fields and layout of the physical 'А смена План' Excel form (only referenced as 'Zavod 5-yil Excel'); mes_papka_orders table already exists (0 rows) to receive it.
- #89 Exact ~30-machine master-data -> Supply the complete accurate ~30-machine factory inventory (names, types, capacities, work centers) — pure data entry into existing equipment table (currently 7 demo rows); single largest root blocker for machine-specific MES features.
- #90 Tigel 1-10 as separate units -> Confirm the Tigel 1-10 naming/count and their distinguishing type (oddiy vs тиснение) — pure data entry once item 89's list is supplied, no schema change.
- #111 Save shift with A/B/C letter-name -> Decide whether to rename/replace MORNING/EVENING/NIGHT with A/B/C or add A/B/C alongside, and confirm 12h duration (current shift_types rows are 9h) — a seed/naming decision that blocks items 100/112.

## 09-qc

**Schema sign-off (Q-35) — 12:**
- #8 Kuchaytirilgan nazorat (ISO 2859): 2 partiya ketma-ket rad -> per-supplier+per-mahsulot -> New inspection-regime enum (normal/tightened/reduced) + a per-(supplier,material) consecutive-rejection counter store; also gated by item 2's absent aql_standards table. New enum value = Q-35 owner approval.
- #11 Har rulon tabletda scan -> qc_material_scan_log (order/lot/stanok/smena/ts) -> New table qc_material_scan_log (order_id, lot, work_center, shift, timestamp, tablet_id+local_seq_no). Doc itself flags 'needs only Q-35 migration approval'. CREATE TABLE = owner-gated.
- #22 Davriy ichki sifat auditi qc_internal_audits (cron) -> New table qc_internal_audits. Cron infra + calendar_events table already exist, but the table is the gate (CREATE TABLE = Q-35).
- #26 Yakuniy sifat xulosasi PP Yopildi da; qisman yetkazishda har dispatch+yakuniy -> New per-dispatch quality-conclusion record type (new table, or a dispatch_id column on qc_final_inspections). No conclusion-per-shipment record type exists among the 25 qc_* tables.
- #31 GSD formulada har operatsiya turi og'irlikda (Pechat og'ir) -> New operation-type weight column on technology-card/operation master data (ALTER ADD COLUMN = Q-35); also needs owner weight values and item 25 live wiring.
- #34 Yakuniy xulosada har bosqich holati; eng past FTQ% = eng zaif halqa auto-belgi -> A per-stage dimension: qc_inspections has NO stage column (verified: only reference_type in {production_order,null}), so global FTQ exists but per-stage weakest-link needs a new stage column on qc_inspections (ALTER) or the empty qc_checkpoints per-stage pass/fail flow to be established.
- #35 Tekshiruv o'tkazib yuborish = qc:override RBAC; kunlik 3 (oylik 15) -> New qc_override_log store to persist and count overrides for the daily(3)/monthly(15) limit + director escalation; no override-tracking table exists today.
- #39 Snapshot versioning: qc_norm_versions (valid_from/to/json) -> New table qc_norm_versions (valid_from, valid_to, json snapshot). CREATE TABLE = Q-35.
- #48 QC brak statistika Director paneliga real-time event stream (outbox) -> New durable outbox table (verified: information_schema has zero %outbox% tables; doc confirms no outbox pattern in QC). The vision explicitly names outbox durability.
- #62 Birinchi namuna (first article) tirajni to'xtatadi -> New first-article stage/approval record: qc_inspections stage enum is {incoming,in_process,final,dispatch} with no first_article value, and no first-article approval record type exists. New enum value/record = Q-35.
- #67 Arxiv namuna (etalon) 6 oy+joylashuv -> New reference-sample archive table (sample metadata + storage location + retention). Verified: no %etalon%/%reference_sample% table exists.
- #96 Priladka (sozlash) brakini alohida hisoblash -> New setup/priladka defect-stage category (new enum value or column on qc_defects/qc_braks) to separate setup brak from production brak.

**Decision / data — 14:**
- #9 Pre-production checklist qolip tayyor Dizayn qolip reestri cross-check -> Where is mold/qolip status tracked? No qolip reestri (mold registry) exists in Design or QC; owner must define the data source before a cross-check gate can be built.
- #10 Oziq-ovqat yaroqlilik bloki texkarta tayinlashda -> What are the kimyoviy norma (chemical-safety) rules per material category that define a makulatura->food-contact block? These master-data thresholds are un-fabricatable owner data.
- #14 COQ rework ish vaqti = MES fakt soat; farq entries'ga zarar -> Which GL account debit/credit pair maps to 'zavod zarari' (factory loss) for the rework-time variance? Owner must supply the account mapping (also depends on item 6 rework linkage).
- #17 Reklamatsiya SLA timer mijoz topshirgan vaqtdan; ish kunlari (bayram kalendar) -> Which holiday/working-day (bayram) calendar table should the SLA timer consult? Verified no dedicated holiday table exists (only shift/marketing/content calendars); owner must supply the holiday calendar source.
- #21 CAPA auto -> Sovershenstvovanie Kanban Yangi; bo'lim rahbari kartasi; 3 rollover->direktor -> Which Kanban board/column IDs are the target 'Sovershenstvovanie' destination (does the board exist?), and how is the 'bo'lim rahbari' card assignee resolved? Kanban card-create + escalation-cron infra exist, but the target board/column and dept-head routing are unconfirmed.
- #27 Reklamatsiya Rad etildi sababni sifat boshlig'i tasdiqlaydi; Telegram+email mijozga -> What katta/strategik threshold routes rejection approval to the director instead of the quality-head? Owner must define the threshold (approval step itself is RBAC-buildable).
- #33 OTK yo'q bo'lsa smena supervizori o'rinbosar inspeksiya -> Which organizational role qualifies as 'smena supervizori' (shift supervisor) for the deputy-inspector fallback? Owner must name the role.
- #38 COQ rework material isrofi FIFO; entries 2 legs -> Which GL account pair maps to the 'material isrofi' (material waste) legs? Owner must supply the account mapping (duplicate GL concern of item 14; also depends on item 6).
- #49 Makulatura omborga qaytishda kirim event; GL farq zavod zarari; FIFO qoldiq -> Which GL account pair maps the makulatura-return 'zavod zarari' debit / 'tovar' credit? Owner must supply the account mapping.
- #59 Kafolat oynasi (14/7 kun) muddatdan keyin auto-rad -> What are the exact warranty-window day-counts per product category (doc cites 14/7)? Owner must confirm the per-category values (also needs a warranty-window field).
- #60 Mijoz maket tasdiqi (podpisnoy list) fayl+sana saqlanadi -> Does the customer maket sign-off record live in QC or in the Design module's order/proof record? Doc flags 'Dizaynda bo'lishi mumkin'; owner must decide placement.
- #65 Namuna nuqtalari (bosh+o'rta+oxir/har N-rulon) -> What is N (the per-Nth-roll sampling-point rule) and the sampling-point pattern? Doc explicitly flags owner must define N.
- #75 Qaytgan mahsulot qabul maydonlari -> Which module owns the returned-goods intake form/table (QC vs WMS vs POS)? Owner must decide ownership before the table can be designed.
- #84 Retest (chegara zonasi 2 namuna, o'rtacha hal) -> What is the boundary-zone width (how close to the threshold triggers a 2-sample retest)? Owner data (duplicate of item 45).

## Module 10 — WMS/Ombor

**Schema sign-off (Q-35) — 6:**
- #4 Ochiq PR miqdori ogohlantirish bayrog'i -> New flag/warning column on a PR-line table — but purchase_request_lines does NOT exist (to_regclass=null) and no MM purchase-request service exists in apps/api/src/modules/mm or /procurement (only inventory-agent reads purchase_requests). Needs PR-line schema + a warning flag column (ALTER ADD COLUMN, owner-gated per Q-35).
- #5 Manzilsiz kirim akti tasdiqlanmaydi -> New zone/bin FK column on the receipt flow. mm_goods_receipts and mm_goods_receipt_items carry no zone/bin/locator column (only warehouse_id, batch_number); batch_lots.bin_location_id is not linked to the receipt. The 'manzil majburiy' gate needs a new NOT-NULL zone/bin column (ALTER ADD COLUMN).
- #6 IoT signalda zonadagi barcha zaxira 'xavf ostida' -> New 'at_risk' flag column on warehouse_stock AND/OR a qc_review_queue table — neither exists (no risk/flag column on warehouse_stock; no qc_review/review_queue table found). Also depends on IoT sensor→zone mapping (item 111, Qisman).
- #10 GTD yo'q bo'lsa ogohlantirish + bayroq -> New gtd_number/gtd_missing column on mm_goods_receipts (currently only invoice_number; no GTD/customs field). Secondary owner gate: the 14-day escalation window needs owner confirmation.
- #17 Bir paletda 2 partiya ogohlantirish -> New pallet_id / pallet-linkage column on batch_lots (only bin_location_id exists; no pallet concept). Without a pallet key you cannot detect 'a second distinct batch on the same pallet'. Depends on pallet-unit tracking (item 55).
- #39 Lead-time o'zgarsa reorder qayta-hisob + auto-PR -> New inventory_policy table (safety-stock/lead-time/lot-sizing) — MRP defaults are hardcoded in-memory in run-mrp.handler.ts:133-139, nothing is persisted. Secondary owner gate: auto-PR-drafting authority (procurement spend) needs owner approval.

**Decision / data — 8:**
- #8 Tasdiqlash matritsasi summaga qarab darajali -> What are the exact approval-amount thresholds per level (warehouse-head / purchasing-head / director)? Recipient routing itself is NOT blocked — RBAC resolveUserIds exists — but the tier amounts are an owner-set policy.
- #20 Muddati oshgan FG penya AI-bildirishnoma -> Confirm the FIN-062 overdue-FG penalty formula/rate (cross-module Finance; the notification+sign-off flow can be built once the formula is fixed). Also chains on item 44's in-transit GL.
- #25 Xavfli material saqlashdan oldin zona-tekshiruv -> Define the hazard_class ↔ hazard_zone mapping (which hazard classes may be stored in which zones)? Owner-supplied rule; a DB CHECK/trigger + a zone hazard-capability flag would then be built on top.
- #29 Namuna/probnik chiqimi 'namuna' kod bilan hisobotda -> Confirm the '10kg/oy' sample-issue monthly signal threshold. (The reason field on material_movements is free-text varchar, so tagging a SAMPLE reason + excluding it from shrinkage needs no enum change — only the signal threshold is owner input.)
- #35 Zona to'lganlik gating 95%/100% import PO blok -> Supply the zone-capacity trigger specification — the code itself (wms-overflow.service.ts) explicitly flags 'P21 §2.9-B ... egasi spetsifikatsiyasi kerak'. What capacity% warns vs hard-blocks, and per which unit (weight/volume/slots)?
- #44 Yo'ldagi mol alohida GL (in-transit) -> What is the chart-of-accounts GL account code for 'Jo'natilgan tovar / goods-in-transit'? Also the 72h→SD / 120h→Director escalation windows. Delivery-confirmation reversal can hook the existing DELIVERED status (item 83).
- #48 Reorder email RFQ + N kun timeout → keyingi yetkazuvchi -> What is the default supplier response-window (N business days) before auto-fallback to the next-ranked supplier? The rating engine (item 22) already exists to pick the next supplier.
- #104 Reorderda ko'p-beruvchi tender -> Decide the tender/RFQ workflow rules: how many vendors to solicit, response deadline, and auto-select vs manual-approve threshold. Builds on the existing SupplierRatingService + supplier_price_tiers.

## 06 SD/Sotuv

**Schema sign-off (Q-35) — 43:**
- #2 MaterialRequiredEvent + MM reject/24h escalation -> New 'material-wait' order status (new enum value) to trigger emission; event infra (domain_events/outbox) already exists
- #4 FIFO unit_cost_snapshot frozen at confirm + inventory_variance GL -> sales_order_items/sd_quotation_items.unit_cost_snapshot column + an inventory_variance GL account mapping
- #8 Stage-based cancellation penalty % + GL -> CREATE TABLE order_cancellation_rules (stage→%) — confirmed absent live
- #14 Klishe ~3yr retention cron + write-off act -> ow_molds.owner_type + retention/expiry columns — confirmed absent live (ow_molds has none)
- #16 Per-line partial hold (one line waits, others continue) -> partial_hold_policy enum + per-line hold status column (order status machine is order-level only)
- #18 Shared forma auto-detect + warning -> A die/mold identity field — ow_molds.order_id is 1:1, so no way to detect the SAME physical die across orders on current schema
- #19 CRP-derived delay_risk_days + urgent flag + AI risk -> sales_orders.delay_risk_days column — confirmed absent live (also needs AI heuristic + CRP exposure)
- #25 Notification fallback Telegram→SMS→email→manager -> notification_channel column/enum — confirmed absent live (also SMS provider credential)
- #27 Nightly inactive-customer cron (A=90/B=60/C=30) -> CREATE TABLE crm_inactivity_rules — confirmed absent live
- #29 Per-line deadline scheduling -> sales_order_items/sales_orders.per_line_scheduling boolean + per-line deadline column
- #31 EXTERNAL_OUT vehicle/pallet capacity check -> A vehicle-capacity reference (table/columns) — vehicle_number is free text, no capacity master exists
- #35 Davalcheskoe QC quarantine → QC_HOLD -> New QC_HOLD order status (new enum value); also depends on #6 client-material wiring
- #40 Kashirovka offset+gofra sync (predecessor) -> sales_orders/production_orders.predecessor_order_id column — confirmed absent live
- #45 Roll↔piece unit_conversion_rules -> CREATE TABLE unit_conversion_rules — confirmed absent live
- #52 Hard ~15 product-type list (FK) -> ALTER sd_quotation_items.product_type → FK to product_categories (table exists but empty; free-text now)
- #64 Discount-type list, each with % cap -> CREATE TABLE discount_types (type→cap%) — confirmed absent live
- #78 Structured contract terms (payment/penalty/penya) -> sd_contracts payment-terms/penalty/currency columns (or JSONB terms) — none exist
- #100 Ojd.Syryo → material signal to supply -> New pending_material order status (new enum) + material-signal event; core status is English machine code
- #101 Printing method Offset/Flexo (+AI rec) -> sd_quotation_items.printing_method enum column — confirmed absent live
- #102 Machine format (72/52SM/KVA) rec+price -> machine-format columns on sd_quotation_items + a format→price table
- #104 Material owner (davalcheskoe) flag -> sd_quotation_items/sales_order_items.material_owner enum column — confirmed absent live
- #107 Load capacity (kg) → flute-layer AI rec -> sd_quotation_items.load_capacity_kg column — confirmed absent live
- #116 Product catalog fit to ~15 categories -> Seed product_categories (empty) + ALTER FK from sd_quotation_items.product_type
- #117 Cup/pizza special-dimension template -> sd_quotation_items.diameter_mm/volume_ml columns + per-type geometry branch
- #118 Roll self-adhesive roll parameters -> sd_quotation_items roll/gilza columns (core/gilza diameter, roll length)
- #122 Packaging type → time+material -> sd_quotation_items.packaging_type column (only exists on MES ow_packaging_records)
- #123 Pallet piece-count + pallet size -> sd_quotation_items.pallet_qty/pallet_dimensions columns
- #124 Klishe/forma ownership + 3yr archive -> ow_molds.owner_type + retention_until/archived_at columns (dup schema of #14)
- #138 Kongrev vs tisnenie separate operation -> Split special_coating boolean into embossing_type + per-type rate columns
- #139 Foil color zoloto/serebro → stock -> sd_quotation_items.foil_color column
- #140 Lamination type (glyants/mat/metal) -> Replace sd_quotation_items.lamination boolean with lamination_type enum + rate-per-type
- #141 Varnish type (sploshnoy/trafaret/VD)+coverage% -> sd_quotation_items.varnish_type enum + coverage_percent numeric
- #142 Kashirovka separate operation+price -> sd_quotation_items.kashirovka flag/column + routing marker
- #143 Die-cut method (avtotigel/rotatsion/plotter) -> sd_quotation_items.die_cut_method enum (only is_new_die boolean exists)
- #144 Gluing method (avtomat/ruchnaya/FSM) -> sd_quotation_items.gluing_method enum + labour-rate lookup
- #145 One/two-sided print (2x) -> sd_quotation_items.print_sides column — confirmed absent live
- #146 Flute type 3-makro/3-mikro (dictionary) -> sd_quotation_items.flute_type field distinct from thickness_mm
- #147 Gofra layer count (2/3/5-sloy) + AI load -> sd_quotation_items.layer_count column (only thickness_mm exists); also dep #107
- #149 Latok standard SKU catalog -> CREATE named-SKU catalog table + owner SKU data
- #151 Marka T22/profil S central dictionary -> CREATE material_grade/profile lookup table + FK from sd_quotation_items
- #152 Film thickness (30/100 mkr) from list -> sd_quotation_items.film_thickness_mkr enum/lookup field
- #154 'Zakaz 1S' optional legacy number -> sales_orders.legacy_order_number column — confirmed absent live
- #157 Stage-based cancel penalty (dup of #89/#8) -> CREATE TABLE order_cancellation_rules (stage→%) + GL — same schema as #8

**Decision / data — 15:**
- #5 Quotation 14-day expiry + price re-calc + >5% approval -> Exact re-approval threshold (>5%?) and workflow: who approves the recalculated quote, and what happens to the old quote? (valid_until column already exists; cron is buildable once policy is set)
- #7 ±10% overage allowed, 15%+ manager approve -> Final tolerance % (10%/15% or configurable) and who approves overages beyond 15%? (order_quantity/delivered_quantity columns already exist)
- #10 EmployeeDeactivated → customers reassigned -> Who picks the reassigned manager and is it automatic or a manual queue? NOTE stale-doc: HR ALREADY emits OFFBOARDING_COMPLETED (hr-offboarding.service.ts:134) — only the SD listener + reassignment policy are missing
- #11 Advance awaits bank confirm (PaymentConfirmedEvent) -> Bank-confirmation source: manual entry vs a bank API integration? (markPaymentPaid/sd_payments already exist to hang the event on)
- #13 Overall discount cap ≈15% (checkDiscountCap) -> Confirm 15% is the final discount ceiling (vision says '≈15%')
- #15 Pre-season 8-week cron, AI qty recommendation -> Which product categories count as 'seasonal', and what AI/heuristic computes the suggested quantity?
- #28 AI Offset vs Flexo recommendation (non-blocking) -> What are the offset-vs-flexo recommendation thresholds/heuristic (rule-based on qty/colors/load)?
- #30 1C number INN/phone match import service -> Supply the 1C export format/feed (no sample data or integration point exists to build against)
- #44 Shipment+N days → balance due + warning -> Confirm N (days) after shipment for balance_due_date (column + deliveries.dispatched_at already exist — only N is missing)
- #56 MOQ + small-batch surcharge -> MOQ minimums per product-type and the small-batch surcharge amount (add check to calculatePrice once values given)
- #69 ABC tier → auto benefit-package -> The A/B/C standard-package values (discount%, credit limit, payment terms) to auto-apply when abc_class changes
- #88 Over/under ICh (±N%), invoice from real qty -> The tolerance % (production standard) for over/under delivery (confirmedQuantity vs orderQuantity columns already exist)
- #113 Manager leaves → customer auto-reassign -> Reassignment target policy (auto rule vs manual queue). NOTE stale-doc: HR OFFBOARDING_COMPLETED event already exists — doc's 'HR emits nothing' premise is wrong
- #129 100% advance → 5% discount auto -> Confirm the 5% figure and whether it is a hard rule or manager-overridable (advance_percent column already exists)
- #134 New vs repeat customer different flow -> Which order-creation steps differ between a new and a returning customer (contract re-sign, requisite re-collection)?

## 07-pp

**Schema sign-off (Q-35) — 19:**
- #20 AI last-year-fact median/top20%/last-5 recommendation -> new pp_plan_fact_entries table (order/date/planned/actual columns) — table absent
- #24 Alternative stanok fail-over on IoT downtime + CRP recompute -> new pp_routing_operations.alternative_work_center_id column (confirmed absent via Item 52 check)
- #27 Gofra profile mismatch (5 vs 3 qavat) auto-block -> new flute-layer-count/profile field on material_cards or work_centers — no comparison data source exists (gofra_config is generic key/value KV; pp_flute_types has no layer-count column; material_cards has no flute/profile field)
- #30 Material reserve priority + FIFO tie-break + director override -> new pp_material_reservations table (priority + FIFO allocation) — table absent (same as Items 5/23)
- #32 Machine color-capacity check (6 vs 4 rang) + queue -> new work_centers.max_colors column — confirmed absent in work_centers column sweep
- #36 Estimated-price fallback + FIN delta on tech-card approval -> new is_estimated_price column on SD quote/order (+ FIN-delta write) — new column; also owner algorithm-type undefined
- #37 Gang-run per-order acceptance act + lot-split brak -> new gang-run grouping table/model — no gang* table exists
- #46 Queue-time excluded from OEE denominator -> new queue-time tracking field/concept — no waiting-for-next-stage time source exists (production_order_operations empty; not modeled as a distinct quantity)
- #49 Director status-formula PP plan% shift/daily snapshot -> new pp_plan_fact_entries table (same as Item 20) — table absent
- #63 Norm varies by material/color/lamination combination -> new norm parameter-variation dimension/lookup table keyed by material/color/lamination — no such structure on pp_routing_operations
- #69 Machine format/size limit check -> new work_centers.width/length/max_format columns — confirmed absent
- #90 Order merge (gang run) = single print job -> new gang-run grouping table linking multiple production_orders to one print job — absent
- #118 Oynakcha (PVC window) = material + labor separate stage -> new routing-operation subtype/material field on tech_card_routes (PVX window op with own labor norm) — not modeled
- #119 Finishing type (laminate/varnish/UV) + norm table -> new pp_finishing_types master table (each with per-m2 norm) — absent; owner taxonomy also needed
- #120 Packaging type 10+ variants each with norm -> new pp_packaging_types master table (10+ variants + norms) — absent (only design_orders.product_type enum exists); owner list also needed
- #124 Multi-line order (each position own route) -> new production_order_lines child table replacing scalar production_orders.product_id FK — structural change; Q-35 owner sign-off given SD/PP blast radius
- #125 External stages (material prep/delivery) in route -> new external operation-type flag/enum on tech_card_routes (lead-time op not occupying a work center) — not modeled
- #131 Maket status cycle + auto deadline shift -> new maket status enum (draft/sent/revision-requested/approved) replacing single boolean technology_cards.maket_approved
- #132 Constructor/drawing+mold phase in route -> new construction-phase routing-operation type on tech_card_routes (drawing/mold duration+status ahead of production ops) — not modeled

**Decision / data — 5:**
- #18 Small-order warning ack + manager approval + audit -> What is the minimum tiraj (order-quantity) threshold that triggers the small-order/low-margin warning? (same open value as Item 102, EP-PP-096)
- #22 Urgent order overrides scheduled PM/repair window -> Should the USKUNA-360 equipment master-data phase be scoped/started so the owner/director-only PM-override endpoint can be built? Owner explicitly deferred this equipment area (equipment_maintenance table exists, roles exist — only the phase scoping is missing).
- #92 Algorithm-type (2-8 bo'lim) auto-classification -> Define the algorithm-type tier boundaries: which distinct operation/department-group counts map to which complexity tier (2-8 bo'lim)?
- #102 Min tiraj -> small-order + margin warning to sales -> Set the minimum-tiraj threshold value per product and the low-margin warning rule (chegara egasi-data).
- #115 Code dictionary master (KT/PT/E/GL) -> Define what the KT/PT/E/GL code prefixes actually mean — semantics/data-definition needed before the lookup table can be designed (also requires a new pp_code_dictionary table).

## 20 CC

**Schema sign-off (Q-35) — 19:**
- #5 AI asl (tahrirlanmagan) varianti ai_draft ustunida alohida saqlansin -> ALTER TABLE cc_documents ADD COLUMN ai_draft text (write-once/immutable snapshot). Verified absent: cc_documents has ai_body but no ai_draft.
- #9 Gorizontal vakolat matritsasini faqat super-admin belgilaydi -> CREATE TABLE cc_horizontal_authority_matrix (from_position_code, to_position_code). No such table/code exists.
- #14 'Tanishdim' tasdig'i BE middleware + cc_policy_acknowledgments jadvali -> CREATE TABLE cc_policy_acknowledgments (user_id, document_id, pin_signature, acknowledged_at). Verified: to_regclass=null.
- #16 PIN-imzo idempotent unique(document+step+approver), dublikatda 409 -> ALTER TABLE cc_approvals ADD CONSTRAINT ... UNIQUE(document_id, step_order, approver_user_id). Verified only PK/FK/NOT-NULL exist. Item's own note: schema migration = Q-35 owner-gated.
- #23 Sifat ishchi jurnali append-only, tuzatish faqat correction entry -> CREATE TABLE cc_quality_journal (insert-only, correction_of_id self-FK, no UPDATE/DELETE grants) + QC endpoint.
- #25 Tashkiliy xato avto-qayd faqat statistika, KPI'ga inson tasdig'i (E1) -> CREATE TABLE cc_org_error_stats (write-only stats) + separate manual-confirm gate before KPI feed.
- #31 Rahbar xulosasi asl hujjat maydonida immutable saqlanadi -> ALTER TABLE cc_documents ADD COLUMN manager_summary jsonb (append-only per level). Only sender_comment exists.
- #47 'Ko'rildi' statusi faqat ERP'da beriladi (viewed_at/viewed_via) -> ALTER TABLE cc_documents ADD COLUMN viewed_at timestamptz, viewed_via varchar (set only by ERP GET, never Telegram). Verified viewed_at absent.
- #50 Outbox+retry cc_outbox jadvali, worker 30s, exponential backoff, dead_letter -> CREATE TABLE cc_outbox (event_type, payload, status, attempts, next_retry_at) + worker. Verified to_regclass('cc_outbox')=null. (Owner also: build CC outbox vs reuse domain_events.)
- #78 Tasdiq matritsasi summa bo'yicha (≤500ming→boshliq...) -> ALTER TABLE cc_documents ADD COLUMN amount + cc_workflow_steps ADD threshold columns for amount-conditional step selection. Neither exists today.
- #84 Har shablonga kommunikatsiya-turi tegi (5 tur) -> ALTER TABLE cc_document_templates ADD COLUMN communication_type varchar + 5-value check. Verified column absent.
- #87 Gorizontal vakolat matritsasi (kim kimga tur yubora oladi) -> Same as Item 9: CREATE TABLE cc_horizontal_authority_matrix.
- #89 Qaror oynasida 'asos hujjat raqami' majburiy maydon -> ADD COLUMN reference_document_number on cc_approvals (or cc_audit_trail) to properly persist the mandatory reference; cc_audit_trail has only a shared free-text comment column (not a queryable reference field). DTO required-field is code, but proper storage = schema.
- #90 Maydon bo'lim-vakolatiga ko'ra tahrirlanadi (field-level RBAC storage) -> Decompose ai_answers JSONB blob into a per-field-tagged structure ({field,value,ownerRole}) — structural schema change (also owner field×role mapping).
- #101 Orgpolitika 'tanishdim' PIN → ish-bloklash gate -> Same as Item 14: CREATE TABLE cc_policy_acknowledgments + MES check-in gate.
- #102 НАЗОРАТ ВАРАҚАСИ (mavzu×PIN+progress checklist, LMS↔CC) -> CREATE TABLE cc_checklists (topic × per-item PIN × progress%) referencing LMS course/module IDs.
- #117 Har darajada rahbar xulosasini qo'shib yuqoriga uzatadi -> Same as Item 31: ADD COLUMN cc_documents.manager_summary (append-only structured).
- #119 'Сифат ишчи журнали' append-only registr (QC↔CC) -> Same as Item 23: CREATE TABLE cc_quality_journal.
- #124 'Bo'limlararo qaror protokoli' ko'p-imzo bilan -> CREATE TABLE cc_document_signatures (N required signers per step, replacing single-approver-per-step) + protocol template.

**Decision / data — 32:**
- #2 I.o. imzosida audit ikkala manzilni (i.o.+asosiy karta) yozsin -> How is 'i.o.' (acting officer) assigned in the org model — a delegation, a temp position override, or a new org_functions flag? Schema/columns cannot be designed until owner defines this.
- #7 Tungi smena rad → 'ziddiyatli ijro' yozuvi, reversal yo'q -> What timing window defines 'tungi smena', and which MES/production signal marks execution as already-started (to detect conflicted_execution)?
- #12 ZVS tasdiqlansa outbox orqali Finance event -> On ZVS approval should Finance auto-queue the payment, or notification-only (matching the deliberate 'kassir enters manually' pattern already chosen for ADVANCE/FINANCIAL_AID)?
- #15 Fayllar UUID+hujjat-raqam bilan immutable saqlanadi (upload) -> Storage backend (local disk vs S3-compatible) + max_file_size_mb/allowed_file_types policy values? (cc_attachments table already exists but empty; no upload endpoint.)
- #18 Hujjat bekor qilinsa org-sxema tasdiqidan o'tadi -> Should cancellation route through the FULL approval chain or just a single director/super-admin-level sign-off?
- #27 Ikki bo'lim tahrir qilsa optimistik locking + maydon-darajali RBAC -> Field-level RBAC policy: which department/role may edit which fields? (The optimistic-lock half is pure code — add AND version=<expected> to updateBody UPDATE + 409 on rowCount 0 — but field-RBAC needs owner mapping, so the full item is owner-gated.)
- #28 'Ma'lumot talabi' chiqsa asosiy hujjat 'kutish' holatiga o'tadi -> Exact 'Ma'lumot talabi' template format/fields (deadline + mandatory-response)? (workflow_state is varchar so waiting_info needs no enum migration.)
- #29 Xom-ashyo zayavkasi 2s SLA, KPI faqat inson tasdig'i (E1) -> Owner-approved raw-material request template text/fields (inbox_sla_hours=2 already supported as integer)?
- #30 Direktor 48s javob bermasa 'muddati o'tgan'+HR, 24s eslatma -> Confirm removing the current auto-reject-at-48h (autoRejectOverdue48h forcibly sets workflow_state='rejected', which CONTRADICTS the vision's 'avto-qaror yo'q') and replacing with flag+HR-notify+24h reminder loop?
- #39 RBAC filtri WHERE darajasida (getById), composite GIN, <300ms -> Who counts as a 'participant' allowed to view a document (sender / any current-past approver / whole department)? Needed to write the getById WHERE clause. (Real hole: getById has ZERO access filter today.)
- #40 Og'zaki topshiriq 4s eslatma, 24s 'hujjatsiz' belgisi -> Where does 'og'zaki topshiriq' originate in the UI (chat-message flag / standalone button) before a data model (cc_verbal_pending) can be designed?
- #41 Tasdiqdan oldin AI tahlil (faza 2, 100 hujjatdan keyin) -> Has the phase-2 '100 approved documents' trigger been reached, and is the approval-analysis AI rollout/cost approved? (AI infra already exists in module via cc-ai-interview.)
- #44 Arxiv muddati yaratilgan vaqtdagi lavozim bo'yicha qotib qoladi -> Actual retention-years table per position tier (rahbar 10y / ishchi 3y are only vision examples, not confirmed exhaustive)? archive_after_days is NULL for all 17 templates.
- #49 GL yozuvi hujjat tasdiqda trigger, reference_document=ZVS raqami -> Should CC-approval AUTO-post to GL (contradicts the deliberate 'kassir enters manually' design already chosen for ADVANCE/FINANCIAL_AID), or remain manual? These two vision requirements currently conflict — owner must resolve.
- #72 Tasdiqdan oldin AI tahlil (moslik/risk, faza 2) -> Same as Item 41: is the phase-2 AI approval-analysis trigger reached and rollout approved?
- #77 ZVS tasdiqlansa Finance to'lov navbatiga tushadi -> Same as Item 12: ZVS auto-queue payment vs manual-entry for Finance?
- #85 'Yozma majburiy' 6 tur uchun shablon -> Which exact 6 document types are mandatory-written (тех карта/reja/sifat + 3 others)? Seed cannot be built until owner specifies.
- #88 Analitik hujjat faqat Совершенствование (5-bo'lim) orqali -> Which department is 'Совершенствование' (id 5) in the current org schema, and the analytics document's exact format?
- #90 Maydon bo'lim-vakolatiga ko'ra tahrirlanadi (field-RBAC policy) -> Owner-defined field×role editing mapping per template (which role may edit which field)? (Also schema restructure of ai_answers.)
- #91 Maydonlar rolga bog'liq (texnik maydon faqat texnolog) -> Owner-defined role×question mapping per template (which role may answer which AiQuestion)?
- #92 'Ma'lumot talabi' shabloni (muddat + majburiy javob) -> Same as Item 28: exact 'Ma'lumot talabi' template format/fields?
- #93 'Reja o'zgartirish' shabloni (tashabbuskor/sabab/natija 3 maydon) -> Owner-approved exact wording/format for the PLAN_CHANGE template (this template is the root blocker for Items 22/94/95/113/115).
- #96 Har smenada majburiy 'smena yakuni xulosasi' hujjati -> 'Smena yakuni xulosasi' template content/questions + recurring cron config? (spawnRecurringDocuments is a live no-op placeholder; implementing it is code, but the template content needs owner.)
- #97 'Tungi smena qarori' maxsus hujjati -> NIGHT_SHIFT_DECISION template content and escalation-to-next-day-manager timing rule?
- #103 тех karta 'Лаборатория→Одобрена' maxsus imzo bosqichi -> Owner-approved lab-approval position/role (POSITION:LAB_HEAD?) and 'Одобрена' step/checklist criteria for the тех karta template?
- #106 'Смена хом-ашё заявкаси' 2 soatlik SLA bilan -> Same as Item 29: owner-approved raw-material request template text/fields?
- #107 'Режа қоғози' (rulon-hujjat) → buxgalteriyaga avto-uzatish -> Exact 'fakt-vazn' (actual-weight) capture workflow and which Finance/Ombor entity receives the auto-transfer on approval?
- #109 Ko'p 'maqsad lavozim' tanlansa har biriga parallel yuboriladi -> Multi-target delivery semantics: must ALL targets acknowledge (AND) or does ANY one suffice (OR) for delivery?
- #116 Og'zaki kelishuv uchun 'keyin rasmiylashtir' tugmasi + eslatma -> Same as Item 40: where does the 'keyin rasmiylashtir' action originate in the UI?
- #118 'Sifat ogohlantirishi' ОТК→СОЗ qisqa SLA (QC↔CC) -> Owner-approved ОТК→СОЗ QUALITY_WARNING workflow definition + short SLA (minute granularity not representable in current integer inbox_sla_hours)?
- #127 'Orgpolitika' 4-bo'lim shablon strukturasi -> Exact 4-section 'Orgpolitika' template structure/format? (Root blocker for Items 13/99/100/111.)
- #129 'Smena biriktirish' hujjati (dastgoh+operator, KPI ulanish) -> SHIFT_ASSIGNMENT template fields (machine ID + operator user ID) and which KPI formula consumes this data?

## 04-coordination

**Schema sign-off (Q-35) — 10:**
- ##12 External customer signature: mandatory scan + signed_by_external -> ALTER protocol/prikaz ADD COLUMN signed_by_external boolean + signed_document_url text (NOT NULL on external-signed docs).
- ##16 Execution proof file with proof_status:missing -> New proof_status enum (missing/present/rejected) column on the Kanban completion record. File-upload infra already exists (kanban-card-files.controller.ts); only the enum+banner are new schema.
- ##20 Off-hours Telegram approval, absolute deadline (EP-COR-092) -> ALTER ADD a hard/absolute deadline timestamp column on the approval/rasporyazhenie off-hours-approval record (records lateness, no auto-block).
- ##26 attendance_reason field (manager fills within 2 days) -> ALTER attendance table ADD COLUMN attendance_reason text + a manager-within-2-days role gate.
- ##56 Conflict-of-interest member exclusion from vote -> ALTER council_members ADD COLUMN conflict_of_interest boolean/reason (or a per-session table); countVotingMembers currently excludes only role='guest'.
- ##59 ЗВС session report auto-generation -> New zvs_sessions wrapper table (open/close per weekly cycle) so a GET /hr/zvs/sessions/:id/report can aggregate approved/rejected/total. ЗВС create/approve/reject already works on flat `zvs`.
- ##67 Buyurtma/Papka № yagona kalit (coordination docs) -> ALTER dokla + rasporyazhenie ADD COLUMN papka_order_id FK (mirroring design_orders.papka_order_id, confirmed to exist) + thread through create DTOs.
- ##76 Ichki transport reestri (Rohler/poddon) -> New internal_transport_registry table (equipment id, status soz/ta'mir/band, scheduling calendar) + CRUD; ow_pallet_recoveries serves a different purpose.
- ##106 Operator+yordamchi juftlik signal -> ALTER MES production-session table/DTO ADD COLUMN assistant_operator_id (session currently has single operator_id) + duplicate signal logic to cover both.
- ##107 Razmer optimizatsiya koordinatsiya qaror -> New HitlDocumentType.SIZE_OPTIMIZATION enum value (hitl-document-type.enum.ts) wired through the real ApprovalRequest aggregate/approvals.controller.ts (4 live rows).

**Decision / data — 14:**
- ##8 3-hour 50% quorum shortfall → emergency meeting -> Define the council meeting/session entity model — is a 'session' an instance of an existing council, and what are its fields/lifecycle/start-timer? No meeting/session entity exists (councils exist but have no per-meeting instance). This model decision also unblocks #1/#2/#9/#21/#34/#42/#57.
- ##22 HR prikaz effective-date cron (00:05), holiday-aware -> What is the authoritative Uzbekistan working-day/holiday calendar data source (manual UZ holiday list vs external calendar) and its values? No holiday-calendar table exists anywhere in the repo.
- ##30 STOP category excluded from readiness-% denominator -> Which order/production state counts as 'STOP' for exclusion from the readiness-% denominator? readiness_pct is already computed (getOrderProgress, COUNT(po.id)); production_orders statuses are only completed/paused/in_progress — is STOP = status='paused' or a separate MES downtime-STOP signal?
- ##36 Holiday-aware cron reschedule (sana o'zgardi notice) -> Same as #22: the source of Uzbekistan holiday dates (manual list vs external calendar). Shared working-day-calendar need with #22.
- ##74 Podpisnoy list gate (blocks ИЧП/production) -> Which roles/documents constitute a valid 'podpisnoy' (sign-off) record before the podpisnoy_lists schema + gate in update-design-status.handler.ts can be finalized?
- ##77 Chiqindi to'ldi yopiq tsikl (signal→topshiriq→tasdiq) -> What is the 'full' fill-level threshold value per waste-container type? waste_records table + rasporyazhenie-creation path already exist; only the owner threshold is missing.
- ##89 Harakatsiz topshiriq signal (X soat harakatsiz) -> What is the 'X hours' inactivity threshold for the last-touched escalation? rasporyazhenie.updated_at already exists as the last-touched timestamp — no new schema, only the owner threshold value blocks it.
- ##90 Xato bo'lim rahbari KPI (brak/rework → rahbar KPI) -> What is the brak-attribution rule — the operator's manager, the department that produced the defect, or the QC reviewer's manager — for the responsible-manager column + KPI rollup on qc_braks? (Duplicate of #104.)
- ##95 Dizayn↔konstruktor handoff (o'lcham/begovka/vysechka) -> Is 'konstruktor' a new distinct role/karta or an existing designer sub-permission? Needed before inserting the handoff-confirmation stage into the real DesignStatus state machine.
- ##98 Energiya tejash karta KPI (suv/gaz/svet) -> What are the energy-saving targets/thresholds per karta type? KPI would use the existing kpi_definitions/kpi_values pattern + IoT sensor data, but the target values are owner master-data.
- ##103 Plan-fakt og'ish real-vaqt signal -> What is the plan-fact deviation threshold percentage(s) per operation/order type, above which a signal fires against MES quantity-recording writes?
- ##105 Real norma-bajarilish % past signal (uchastka) -> What is the 'low' norm-fulfillment % threshold per uchastka below which the operational signal fires?
- ##108 Yo'nalish turi bo'lim-marshrut avto (ofs-kar/ofs-gof/flx-gof) -> Provide the canonical route-type list (ofs-kar/ofs-gof/flx-gof/…) and each type's department chain — business master-data for the mes_operations route-type classification + auto-routing lookup. (Duplicate of #78.)
- ##112 Smena tayyorlik cheklisti gate -> What is the shift-readiness checklist item list per shift/work-center type? downtime_events (the gated action) already exists; the checklist content is owner master-data.

## 13-crm

**Schema sign-off (Q-35) — 27:**
- #5 KP viewed: email pixel + Telegram flag -> crm_proposals.viewed_at (+ viewed_source) column — verified absent (crm_proposals has no view/seen/open column).
- #19 Format-change per-line consent dialog -> Per-line consent record (new table or per-line-item consent columns) to persist affected-line lock + consent.
- #20 'Size confirmed' flag gate (Dizayn) -> size_confirmed_by / size_confirmed_at columns on the design/deal record (verified absent across backend).
- #21 ГП 3-signature electronic waybill (PIN F5) -> New waybill table with 3 PIN-signature slots (warehouseman/driver/manager) + 'yuk chiqdi' gate; PIN/e-signature mechanism spec also owner-gated.
- #22 Reorder diff view + per-field confirm -> Prior-spec snapshot store + per-field consent record (+ constraint blocking silent stale-spec reuse). Basic clone is buildable (Item 93); the diff/consent layer needs schema.
- #29 Discount-abuse flag (90d, 3+/10%+) -> Discount-event/abuse-flag persistence + director-approval gate state (crm_proposals has discount_percent but 0 rows and no per-request gate). Thresholds already specified in vision, so only schema is the gate.
- #30 Sample order: PP low-priority + excl. revenue -> order_type='sample' enum/field on sales_orders/deals (sales_orders has document_type, not sample order_type).
- #35 ГП-kod QC brak/rad defect flag -> defect_flag / last_reject_reason column on the product-code record (crm_products is a 2-row generic catalog); also needs a QC reject event to populate (Item 15).
- #38 Next-order reminder AI (default 30d) -> next_order_reminder_at column per customer (verified absent).
- #39 Currency 5%+ jump → 'qayta hisob kerak' -> Rate-at-quote snapshot column on the deal to compare against the live exchange_rates feed (exchange_rates table exists in Finance; deal has no baseline rate).
- #40 Warehouse-entry reqs auto from sales_orders -> warehouse-entry-requirements field on customer/delivery record (near-duplicate of Item 132).
- #81 НО-2 corporate-number on manager card -> New corporate_number table (number↔manager/card binding + transfer-on-departure). No %corporate% table exists.
- #85 Corporate TG/business account ownership -> New account-ownership table (bot/account id → karta, not → individual employee). Telegram ingest exists but no ownership record.
- #95 Customer artwork/logo versioned library -> Versioned artwork table (parent_document_id / version chain); crm_documents (0 rows) has no version columns.
- #99 Razmer plan↔actual lock+flag -> Planned-vs-actual size columns + lock flag on the deal/design record.
- #100 Format-change electronic consent -> Consent-capture field/table (manager-recorded electronic rozilik) tied to a format-change event.
- #105 Customer kg-trend + decline signal -> kg/weight source column on order line — sales_order_items has only quantity columns, no weight/kg; the 360 growth block would need a kg source to aggregate.
- #108 Customer×format price matrix -> New crm_customer_format_prices matrix table (customer × format → price); crm_products is a flat 2-row catalog.
- #119 Advance flag+% gate before PP -> advance_percent / advance-paid flag column on the deal + PP-handoff gate; minimum-advance % threshold is an owner policy value.
- #120 Default payment type on customer -> sd_customers.default_payment_type enum column (naqd/o'tkazma/bartar) — verified absent. Values already given in vision.
- #121 USD-pegged price + rate warning -> Currency-peg column on the price field + CRON vs exchange_rates (related to Item 39).
- #124 Compensation/discount history + abuse flag -> New discount-history table with per-customer discount events + abuse flag.
- #125 Monthly cohort by kg -> kg/weight source column on order line — cohort.service supports count/revenue flavors only; a kg flavor needs a weight source that does not exist.
- #128 Customer product-lines (price/volume/defect) -> New crm_customer_product_lines table (per-customer-per-product with nested price/volume/defect) replacing the flat crm_products catalog.
- #132 Customer warehouse-entry reqs save -> Customer-scoped warehouse-entry-requirements field surfaced to Logistics (near-duplicate of Item 40).
- #133 Agreed packaging method on card -> packaging_method / packing_preference field on customer/product-line record.
- #134 Sample/Академия separation from sales -> order_type field distinguishing 'namuna' orders to exclude from revenue stats (same field family as Item 30).

**Decision / data — 19:**
- #7 Debt cache 5min TTL + SD real-time gate -> What debt level/policy blocks deal/order creation — block on any open debt, or only above a credit limit — and is the debt figure sourced from Finance or the existing SD openDebt computation? (Caching infra is buildable; the block policy is undefined.)
- #24 Other-customer search field-RBAC + audit -> Which fields may a non-owning user see (name+type only?) and what is the customer-ownership model that decides 'owning'? (sd_customers has no assigned_to; doc flags card_id/karta decision.)
- #26 Dizayn/STP day-limit escalation (E5) -> What is the Dizayn/STP day-limit threshold before escalating to the Dizayn head + seller? (Recipient routing can use the existing role-based targetRole path; only the threshold is missing.)
- #27 Paper-application profile prefill + snapshot -> Which fields constitute the factory paper-profile ('zavod-spets') to store and pre-fill? Owner/Dizayn must define the field set before the table can be designed.
- #42 Structured manager notes + AI onboarding -> What category taxonomy for 'menejer fikri/hohishi' (the enum values)? Needed before the category column can be created.
- #44 Corporate-channel bypass mitigation (НО-2) -> HR employment-contract bypass-prohibition clause + Inspeksiya policy wording — pure owner/legal decision (vision itself states full technical prevention is impossible).
- #46 Mas'ul operator/usta PP recommendation -> Which operator/usta 'belongs' to which customer — the recommendation rule is explicitly owner-open (QISM C #85 'vision OCHIQ').
- #48 CRM audit module='CRM' filter + 7yr retention -> Sign-off on the 7-year retention policy (and confirmation that CRM mutations should be tagged module='CRM' in audit_logs — the module column exists but is 100% NULL, so nothing is written there yet).
- #52 Who defines funnel stages (factory process) -> The actual factory-process stage names (e.g. Namuna→STP→Narx→Shartnoma) to seed crm_stages — the settings CRUD already exists (crm-settings.controller.ts) and the table is empty; owner-data only.
- #78 Phone-call recording to card -> Which telephony/ATS provider (webhook format, recording storage) will EuroPrint use? Provider choice gates the call-log table + ingest design.
- #89 Папка№ order-folder on card -> Folder numbering convention — format and scope (per order vs per customer)? Owner process decision that determines the schema.
- #91 Customer paper profile save+prefill -> The paper form's exact field set (owner/Dizayn) — same undefined-schema blocker as Item 27.
- #96 ГП delivery 3-signature electronic form -> Does the 3-signature waybill belong to the SD module (EP-SD-138) or CRM? Ownership/scope decision (also needs the waybill table, Item 21).
- #101 Design/size approval as a funnel stage -> The pipeline stage taxonomy — define the design/size-approval stage (+ owner/time-limit). Same root as Item 52 (empty crm_stages).
- #107 Paper-price change → reprice task -> The trigger % threshold and the raw-material price-feed source (Ta'minot/procurement) — both flagged 'egasidan' in the vision.
- #116 Mass-export block + permission + log -> What bulk row-count triggers the block, and what is the approval workflow? (Audit infra reusable; threshold/approval policy is owner.)
- #117 Contact-view field-level limit -> Which fields (phone/email/price) are masked for which roles — the field-visibility policy is undefined.
- #129 STP/format version history -> The versioning model — what constitutes a new version vs a revision (owner/Dizayn)? Model not defined anywhere.
- #135 Customer↔responsible operator/usta history -> The rule for which operator 'belongs' to which customer (owner/PP) — flagged 'Reja-qoidasi egasidan'.

## 14-marketing

**Schema sign-off (Q-35) — 33:**
- #14-4 Byudjet tugaganda soft ogohlantirish + kampaniya tasdiq + 24s eskalatsiya -> ALTER marketing_campaigns ADD approval_status + pending_since (submitted_at) + approved_by columns — status is the lifecycle field; a reliable 24h escalation timer needs a dedicated pending-since timestamp.
- #14-13 90 kun oynada ikki kampaniya ROI oxirgi kampaniyaga to'liq -> New lead↔campaign touch-tracking table + a 'participation' flag column; verified NO campaign_touch/lead_campaign/attribution table exists. MKT_ATTRIBUTION_WINDOW_DAYS constant already present.
- #14-14 Namuna materiali yetmasa 'material kutilmoqda' + MM avto-signal -> ALTER ow_order_samples ADD material_id + status columns (current cols: id,order_id,iteration,requested_at,produced_at,customer_decision,feedback,rejection_reason — no material/status).
- #14-15 Sodiqlik imtiyozi toifa (faqat yangi buyurtmalarga) -> New loyalty_tiers + loyalty_tier_rules tables (no loyalty concept in schema). Also owner thresholds, but the table structure is the hard gate.
- #14-16 Sifatli lid 30 kun sotilmasa sotuvchi KPI'ga tushadi -> New manager/sales KPI (rating/penalty) storage table — EloRatingService is a stateless calculator with NO persistence and no elo_ratings/manager_kpi table exists.
- #14-19 Marketing KPI 'sifatli lid' event'ida real-time yangilanadi -> New event-driven marketing KPI counter table (+ a 'qualified lead' domain event); no such counter store exists.
- #14-20 Promo-kod 1 mijoz/1 kampaniya default -> New promo_codes table with per-customer/per-campaign usage-limit column (verified: no promo table/column anywhere).
- #14-21 Mavsumiy talab kalendari PP/MPS ga 'orientir' -> New marketing seasonal-demand calendar table (PP's seasonal logic is self-contained and one-directional).
- #14-23 'Oprosny list' draft holatda; to'liq bo'lmaguncha SD blok -> New oprosny_list (brief) table with draft/complete status. Owner also sets required-field list, but the table is prerequisite.
- #14-26 Tavsiya bonusi CRM kartaga; alohida Moliya chiqimi -> ALTER lead/customer ADD referrer column + a new Finance referral-bonus expense-line model (no referrer column exists; HR employee_referrals is a different domain).
- #14-31 Ko'rgazma follow-up 48s HR ish-kunlariga ko'ra -> ALTER exhibitions/exhibition_leads ADD next_follow_up_at column (repo comment confirms column absent).
- #14-32 Lid to'lov intizomi belgisi AR'dan kunlik cron -> ALTER lead/customer ADD payment_discipline flag column (openDebt read exists via getChurnRisk, but no flag column to write daily).
- #14-34 Upsell AI tavsiyasi real-time; 90 kun saqlanadi -> New upsell_recommendations table with a 90-day expiry/TTL column.
- #14-36 Mijoz yillik forecast PP/MPS ga 'orientir'; ±30% ogoh -> New customer_forecast table (no forecast-capture entity in marketing).
- #14-41 Yangi Pantone kodi → dizaynga avto-bildirishnoma -> New pantone_codes table (grep pantone = 0 anywhere including lib/db/src/schema).
- #14-42 Menejer ogohlantirishni ko'rib davom ettirsa audit-log (7 yil) -> New marketing/CRM audit-log table with 7-year retention; also there is no 'proceed-despite-warning' action instrumented today (warnings are passive read queries).
- #14-45 Ko'rgazma komandirovka xarajati HR'dan ROI'ga -> ALTER business_trips ADD exhibition_id linkage (or a trip↔exhibition join table); business_trips exists but has no exhibition link and exhibitions has only 'budget'.
- #14-48 Kontakt o'zgarish Kanban vazifasi joriy menejerga, 48s -> New multi-person contact model (or is_primary + primary-changed flag); marketing_lead_contacts is an activity/attempt log, not distinct contact persons.
- #14-56 Mijoz brend pasporti (logo/Pantone/CMYK/shrift/taqiq) -> New brand_passport table (brand_templates=0 rows, no brand_passport; pantone grep=0).
- #14-58 Опросный лист lid'dan avto old-to'ldirish (dup of #23) -> New oprosny_list table (dup of #23) — build once.
- #14-59 Lid mahsulot turi (ofset/gofra/etiketka/flekso) majburiy -> ALTER leads/crm_leads ADD product_type enum column (verified: absent on all three lead tables). Enum value list = owner confirm.
- #14-64 Har mijoz BREND pasporti (dup of #56) -> New brand_passport table (dup of #56) — build once.
- #14-66 Lid talabi опросный лист ga old-to'ldirilib (dup of #58) -> New oprosny_list table (dup of #58) — build once.
- #14-67 Lid mahsulot turi (+blanka) majburiy (dup of #59) -> ALTER leads ADD product_type enum (dup of #59) — build once.
- #14-70 Mavsumiy talab kalendari ('shu oyda qo'ng'iroq') (dup of #21) -> New marketing seasonal-calendar table (dup of #21) — build once.
- #14-73 Yirik mijoz yillik prognoz→ishlab chiqarish/material (dup of #36) -> New customer_forecast table (dup of #36) — build once.
- #14-76 Mijoz 'wallet share'—upsell AI tavsiyasi -> New wallet_share/upsell recommendation table; also requires an external total-spend data value the estimator can't derive internally.
- #14-79 Yangi menejer uchun savdo skripti+FAQ (lavozim darsligi) -> New sales-script/FAQ knowledge-base table (email_templates is a quick-reply store, not an LMS-linked KB).
- #14-80 Mijoz/lid hudud+eksport belgisi+savdo xaritasi -> ALTER leads ADD region + is_export columns (verified: neither exists on any lead table).
- #14-85 Mijozga buyurtma holati (%) ko'rinadigan link/bot -> ALTER sales_orders ADD a non-guessable customer-facing share_token column for the public link (progressPct already computed by get-order-saga.handler.ts; internal data ready, but public exposure needs a token).
- #14-86 Sodiqlik imtiyozi (yillik hajm)→avto chegirma qoidasi (dup of #15) -> New loyalty tier/discount tables (dup of #15); discount %/thresholds are owner policy.
- #14-92 Mijoz aksiya kalendari+'shu sanadan oldin quti kerak' -> New per-customer promotional-events calendar table with a lead-time reminder.
- #14-95 Lid'da 'kim tavsiya qildi'+tavsiya zanjiri+bonus (dup of #26) -> ALTER leads ADD referrer_lead_id/chain column + bonus-rule engine (dup of #26); no referrer column exists.

**Decision / data — 11:**
- #14-9 'Reklama xarajati' GL sub-kodi -> Which GL sub-code (under 9200 or a new parent) should 'reklama xarajati' use? Only one combined account 9200 'Sotuv xarajatlari (logistika, marketing)' exists — owner must approve the chart-of-accounts addition.
- #14-24 Egaga '5 raqam' Director dashboard widget -> Which exactly 5 metrics should the owner '5 raqam' widget display (qaysi 5 — egasidan)?
- #14-28 'Bo'sh davr aksiyasi' ega+savdo boshlig'i Kanban tasdiq, 48s -> What machine-utilization threshold defines 'bo'sh quvvat/idle' that triggers the promo, and who are the two approvers on the dual-approval card?
- #14-35 Ijtimoiy statistika webhook real-time sync -> Which social-media provider(s) and which API credentials should be connected? social_api_configs = 0 rows (none configured).
- #14-40 Iliq lid SD 15 daq 'qabul' bermasa savdo boshlig'iga eskalatsiya -> Confirm the escalation policy: 15-min timer, escalate to sales head, never route back to marketing — is this the exact rule? (flagged 'Policy savol ham').
- #14-61 Bitrix24 o'rnini ERP bosadi (EP-MKT-083) -> Approve the Bitrix24→ERP migration plan and timing (owner-data, 🔵 OCHIQ) before any export/import bridge is built.
- #14-69 Mijoz/lid to'lov intizomi belgisi (AR qarz) marketingga -> Confirm the exact display + threshold rules for the AR 'to'lov kechikmoqda' badge on the lead/customer card (decision:656 OCHIQ). openDebt data already available.
- #14-71 Voronkaga 'Namuna→tasdiqda→Tasdiqlandi (подписной)' bosqichlari -> Confirm the exact B2B funnel stage names and order to seed into crm_lead_stages (decision:670 not yet actioned).
- #14-88 Ishlab chiqarish bo'sh quvvati→'bo'sh davr aksiyasi' (dup of #28) -> Same as #28 — what utilization threshold defines idle capacity and who approves the promo? (decision:789).
- #14-94 Egaga aniq 5 raqam+'diqqat talab' widget (dup of #24) -> Which exactly 5 metrics for the owner widget (decision:831 OCHIQ, 'qaysi 5 — egasidan')?
- #14-96 Lid→SD dan oldin rekvizit (STIR/shartnoma/manzil) darvozasi -> Which requisite fields (STIR/shartnoma/manzil …) are mandatory before SD hand-off? This is a finance/legal-compliance decision.

## 15 Kanban

**Schema sign-off (Q-35) — 36:**
- #A5 Rollover cron smena-bog'liq + race-condition -> kanban_cards.rolled_over boolean column (ALTER ADD COLUMN, Q-35)
- #A6 WIP limit SERVICE qatlamida + boshliq override log -> New WIP override-log table (CREATE TABLE, Q-35); WIP check itself is buildable
- #A9 Tiraj o'zgarsa progress qayta hisob -> kanban_cards tiraj/progress columns (ALTER ADD COLUMN); also owner two-worlds qty-source decision
- #A12 Maxfiy intizom-tergov — avto-kuzatuvchi qo'shilmaydi -> kanban_cards.confidential boolean + type columns (ALTER ADD COLUMN)
- #A21 Eskalatsiya CEO oshsa — immutable qayd -> kanban_task_escalations immutable table (CREATE TABLE); also Owner Telegram chat-id + CEO routing via head_user_id
- #A34 Летучка rejimi materialized view (5 daq refresh) -> CREATE MATERIALIZED VIEW over kanban_cards (new DB object via migration, Q-35)
- #A41 Stansiya ta'mirda — blocked_maintenance + PP qayta rejalash -> New blocked_maintenance card-state column/value (ALTER); also needs non-existent MES StationDownEvent
- #A42 Ichki (Академия) buyurtma AI da PAST ustuvorlik -> kanban_cards.internal_flag boolean column (ALTER ADD COLUMN)
- #A43 Примечание badge tasdiq operatorga, o'tish BLOK -> kanban_cards.special_note/badge column (ALTER ADD COLUMN)
- #A47 Inspeksiya reestr — InspectionAddedEvent outbox -> New outbox table (event_id + processed flag) (CREATE TABLE, Q-35)
- #A48 Fayl chegara 10MB, virus-scan, QC 8D/CAPA link -> kanban_files.linked_qc_id FK column (ALTER ADD COLUMN); also owner limit(10 vs 25MB) + virus-scan vendor
- #C3 Orqaga qaytarish: sabab majburiy, tarixga yoziladi -> New transition-history table (CREATE TABLE, Q-35)
- #C4 Bajarildi'dan qayta ochish faqat boshliq, sabab, belgi -> kanban_cards.reopened_at + reopened_count columns (ALTER ADD COLUMN)
- #C15 Oylik hisobotda 'eskalatsiya soni' ko'rsatkichi -> kanban_cards.escalation_count column (ALTER ADD COLUMN)
- #C18 Shaxsiy kunlik dastur (Personal Program) moduli -> New PersonalProgram hourly-grid table + module (CREATE TABLE, Q-35); root module for C19-C25/C58-C59/#88
- #C26 7 kategoriya master -> kanban_cards.category column + 7-value enum/master (ALTER + new enum, Q-35)
- #C28 Ustuvorlik: yaratuvchi taklif, boshliq tasdiqlaydi -> kanban_cards priority_proposed/priority_approved two-state columns (ALTER ADD COLUMN)
- #C33 Bajarilmagan vazifa avtomat ertangiga, 'ko'chirilgan' -> kanban_cards.rolled_over boolean column (ALTER); same root as A5
- #C34 '3 marta ko'chirilgan'; 3 dan oshsa signal -> kanban_cards.rolled_over_count column (ALTER); also depends on C33
- #C45 Maxfiy vazifaga faqat tasdiqlangan kuzatuvchi -> kanban_cards.confidential column (ALTER ADD COLUMN)
- #C61 O'rinbosarga o'tgan vazifa qaytganda asl egaga qaytadi -> New kanban_delegations table (original_owner/delegate/return_date) (CREATE TABLE, Q-35)
- #C69 Kartada tiraj + progress-bar (7000/10000) -> kanban_cards total_qty/completed_qty columns (ALTER ADD COLUMN)
- ##75 Maxfiy vazifaga faqat tasdiqlangan kuzatuvchi -> kanban_cards.confidential boolean column (ALTER ADD COLUMN)
- ##88 Tushlik/namoz shaxsiy dasturda 'band' (fixed-slot) -> PersonalProgram module table (CREATE TABLE, Q-35); same as C18
- ##91 O'rinbosarga o'tgan vazifa qaytganda asl egaga qaytadi -> New kanban_delegations table (CREATE TABLE, Q-35)
- ##92 Jarayon shabloni → НО-1/РД-4/ТХ avtomat biriktiruv -> New НО-role master table + role-code→holder mapping (CREATE TABLE); also owner role codes + karta model #108
- ##93 Vazifa-turiga norma-vaqt (30/20 daq) -> New kanban_task_type_norms master table (CREATE TABLE); also owner norm-minute data
- ##99 Тираж + progress-bar kartada -> kanban_cards total_qty/completed_qty columns (ALTER ADD COLUMN)
- ##100 'Сумма осталось' (qoldiq to'lov) kartada -> kanban_cards.payment_balance numeric column (ALTER); also owner block-vs-warn policy (A29)
- ##106 'Примечание' karta yuzida badge -> kanban_cards.special_note column (ALTER ADD COLUMN); dup of A43
- ##109 Vazifa toifasi seriya bo'yicha -> kanban_cards.task_series enum column + 3 seed values (ALTER + new enum, Q-35)
- ##111 Vazifaga 'kutilgan natija' maydoni -> kanban_cards.expected_outcome text column (ALTER ADD COLUMN)
- ##115 Ichki/tashqi belgi, tashqi to'lovli ustuvor -> kanban_cards.is_internal boolean column (ALTER ADD COLUMN)
- ##120 Maxfiy vazifa faqat beruvchi+ijrochi+boshliq ko'radi -> kanban_cards.confidential column (ALTER); then extends existing kanbanCardVisibilityPredicate (#84)
- ##122 Bosqich bog'liqligi ('X tugamaguncha bloklangan') -> kanban_cards.blocked_by FK column (ALTER ADD COLUMN)
- ##129 Karta rangi mahsulot turi bo'yicha (гофра/картон) -> New product_type master table + color mapping (CREATE TABLE); also owner taxonomy

**Decision / data — 20:**
- #A2 Rasporyajenie → avtomat vazifa -> Which module emits the Rasporyajenie/CC-prikaz event and what is its payload contract? (No RasporyajenieIssuedEvent exists anywhere.)
- #A4 Topshiruvchi inaktiv — HR handover o'rinbosar avtotasdiq -> What is the authoritative source of the HR 'o'rinbosar' (substitute)? LeaveApprovedEvent exists but carries no substitute field and no substitute master-data exists.
- #A13 Brak vazifasi — dedup, jarima QC kanalidan -> Which module owns the jarima (fine) ledger so the QC fine is not double-counted when kanban auto-creates the rework task?
- #A23 Telegram-yopish checklist to'lmasa BLOK + fayl xavfsiz -> Provision the inbound Telegram bot webhook/token scope and choose a virus-scan vendor (e.g. ClamAV)?
- #A26 Buyurtma bekor — bajarilgan bosqich material GL chiqit -> Which GL account code for production→scrap on order-cancel, and who co-signs (QC+FIN) the scrap journal?
- #A40 '3 ish-kuni' = smena jadval (MES) + bayram (HR) -> Which HR holiday/bayram calendar is the source for business-day math? No holidays table exists; shift_* tables exist but no holiday master.
- #A50 Hamma cron BullMQ (persistent), offline drain -> Approve adding BullMQ dependency + provisioning Redis for a persistent queue (infra/dependency decision)?
- #C11 24h faqat ish vaqti (smena jadvaliga ko'ra) -> Which of the ~10 shift_* tables (shift_schedules/erp_shift_calendars/shift_calendars…) is the canonical MES shift-calendar for business-hours escalation math?
- #C55 Telegramdan ochish/yopish/izoh, ERP sinxron -> Provision the Telegram bot webhook/token and confirm the inbound command syntax/UX?
- #C56 Har ish kuni 17:30 НО-3 kun-yakuni vazifasi -> What is the НО-3 daily-close checklist/template content and which board/column does it target? (cron infra exists.)
- #C60 Ta'til: o'rinbosar tanlanmaguncha tasdiqlanmaydi -> Confirm the HR vacation-approval workflow must require a substitute selection, and where that substitute field lives (none exists today).
- #C68 Taxta ustunlari = real texnologik bosqichlar -> What is the canonical technological-stage list/order (Флексо/Высечка/…) per production board? Live columns are test garbage.
- ##85 Telegramdan yaratish/yopish, ERP sinxron -> Confirm inbound Telegram bot command syntax/confirmation UX and provision the webhook/token.
- ##86 Har ish kuni 17:30 НО-3 kun-yakuni vazifasi -> Exact НО-3 checklist/template content + target board/column (dup of C56).
- ##90 Ta'til: o'rinbosar tanlanmaguncha tasdiqlanmaydi (guard) -> Confirm HR vacation-approval must block until a kanban delegate is chosen, and the substitute/delegate data source (none exists).
- ##98 Taxta ustunlari = real bosqichlar (Флексо/Высечка) -> Canonical production-stage list/order per product line (dup of C68); also cleanup of test-junk columns.
- ##107 'Korporativ raqam berish' (НО-2) jarayon-shablon -> What are the exact НО-2 corporate-numbering process steps/checklist to seed as a kanban_templates row?
- ##117 Deadline cho'zish boshliq tasdig'i bilan -> Does deadline extension require prior manager approval vs post-hoc notification? (process/policy decision)
- ##125 @xabar (o'qish) vs @so'rov (vazifa) farqi -> What is the exact syntax distinguishing a passive @xabar from an actionable @so'rov that auto-creates a sub-task? (UX/product decision)
- ##135 ТХ yo'riqnoma davriy takrorlanuvchi vazifa -> What is the ТХ (safety-briefing) instruction content and its required recurrence interval? (recurring-cron infra exists.)

## 16-IoT

**Schema sign-off (Q-35) — 12:**
- #13 Brak% escalation log + 10min cron -> New table iot_alert_escalation_log (verified absent: information_schema has no %escalat% table). Q-35 owner-gated.
- #33 FSM jam threshold (dynamic/manual) -> New manual-override threshold field on the machine card (equipment has no threshold column; equipment.type is all NULL). Also needs texnolog-supplied threshold value.
- #41 Color-count change -> paint approval/PR -> New column production_sessions.color_count (verified absent in 40-col listing).
- #52 Per-machine norm/hour + norm/12h -> New columns equipment.norma_per_hour / norma_per_12h (only work_centers.norma_kg/m2_per_shift exist, shift-level).
- #54 Unit of measure per machine -> New column production_sessions.unit/uom (absent; equipment.type is NULL so cannot resolve from it).
- #56 1M-stroke TO reminder on molds -> New columns ow_molds.stroke_count/resource_remaining (verified: ow_molds has only id,order_id,vendor,order_sent_at,expected_at,received_at,status,reject_reason,photo_proof_url). Also stroke sensor (Item 55).
- #57 SM/KBA color count (4+0/4+4) -> New column production_sessions.color_count/section (absent; same gap as Item 41).
- #71 Configurable shift length 8/10/12h -> New per-machine shift_length_hours config column/field (none found).
- #74 Per-machine-type brak threshold -> New brak_threshold_by_machine_type config (current config is per-work_center work_centers.brak_limit_pct only). Also owner thresholds.
- #75 Auto vs manual lamination efficiency -> New equipment lamination-type field to distinguish auto/manual (equipment.type all NULL). Also owner CAPEX criteria.
- #85 Autopunch karton vs gofra split -> New equipment mode field for die-cutting + per-mode norm columns. Also owner-supplied per-mode norms.
- #123 Standard TO-work catalog (master-data) -> New standard-maintenance-work-by-machine-type catalog table, separate from the task-log mes_maintenance_tasks (0 rows). Also owner-supplied procedures/frequencies.

**Decision / data — 19:**
- #4 Retro OEE/GSD calibration-error fix -> Who is the mandatory 2nd signature and what is the retroactive OEE-correction approval workflow for a 'tekshirilmagan davr'? (ai_calibration_runs=0; also depends on physical sensor calibration existing.)
- #6 Papka half-done: mold-change vs stop -> Define the decision UX: who is prompted (production boss?), what options are shown, and confirm no auto-stop fires.
- #17 Sex energy kVt-h coefficient split (ROOT) -> Approve CAPEX to physically install per-machine energy/kVt meters (EP-IOT-018-PENDING). Endpoint is an owner-mandated honest 501 until then. Root blocker for 27/87/136/124-126.
- #22 Ideal-state photo upload/archive (RD) -> Assign the RD role that uploads ideal-state images and approve AI-camera install so the comparison is meaningful (ideal_rasm_targets=0).
- #24 Meeting-room camera in IoT scope -> Approve physically installing a meeting-room camera and confirm the director/admin-only access + 1-year retention policy.
- #26 Historical Excel import (partial+error report) -> Supply the actual historical Excel files and the exact template/column format to import against.
- #30 Telemetry retention/downsampling -> Confirm the exact raw-retention window (vision says 3-6 months) and whether daily averages are kept in-place or in a rollup before the downsampling cron is built (mes_telemetry=876 rows, no retention cron).
- #32 Legal delay excluded from OEE -> Define which delays count as 'qonuniy/excused' (distinct from existing is_planned) and confirm the OEE-exclusion policy. OEE query currently joins no downtime reasons at all.
- #35 Brak material 30-day loss to GL -> Confirm the exact GL account mapping for the 30-day unresolved-defect-material write-off (waste_records=0).
- #39 UV/lak consumption formula (interim) -> Supply the per-sheet coefficient values (varaq x koeff) for the interim computed-field formula.
- #40 Late material request -> operator-caused wait -> Define the rule/threshold for classifying a wait as 'operatorga bogliq' (how late a material request must be relative to shift start).
- #42 Inter-operation wait (okoshka) category -> Confirm the new distinct downtime category/reason-code taxonomy for 'operatsiyalararo-kutish' (mes_downtime_reasons has 16 rows, none for it).
- #59 Kolib tayyor emas stop reason + owner -> Confirm the DT-MOLD-NOTREADY reason-code wording and the responsible-party (mas'ul) rule for seeding it (not among the 16 existing codes).
- #67 Lamination film consumption/waste -> Decide manual-entry policy (tablet form) vs waiting for a film-consumption sensor; supply the tracking rule.
- #73 Brak% threshold alert (screen+Telegram) -> Supply the per-work_center brak_limit_pct threshold values (currently NULL). The on-screen notifications + discipline_records mechanism already exists in checkBrakLimit (iot-tablet.controller.ts:821); only the owner threshold and Telegram add remain.
- #102 Night-shift (C) tightened thresholds -> Supply the night-shift threshold values (vision says ~20% lower) to layer a multiplier onto IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO (=1.5) in anomaly-detected.handler.ts.
- #107 Sensor rollout plan (ROOT CAPEX) -> Choose the 3-5 priority machines (Gofra/KBA/FSM) and approve physical sensor purchase/install (sensor_devices=0, iot_sensors=0). Root blocker for 5/9/18/45/55/65/78/83/84/91/99 and more.
- #117 Camera-AI inspection criteria (5-7 master) -> Define the exact 5-7 inspection criteria (tozalik/himoya/yo'lak/tartib/xavfsizlik). Also requires camera-AI infra.
- #134 Telegram IoT alerts (ShVB bot) -> Define which event types are 'muhim' and supply the Telegram bot/channel config, before adding a dispatch to anomaly-detected.handler.ts (which has no Telegram call today).

## 12-lms

**Schema sign-off (Q-35) — 15:**
- #5 Yo'riqnoma diff-mavzular qayta-o'qish -> ALTER courses ADD version INT + changed_topics JSONB (course-versioning; confirmed absent — %version% col query empty)
- #8 AI xavfli savol bayrog'i (keyword) -> ALTER lms_questions/lms_exam_questions ADD flag_type column + a NO-14 approval-state field
- #10 PDCA Check salbiy -> Reja (kaizen) -> ALTER kaizen_suggestions ADD pdca_stage enum column (plan/do/check/act) — table currently has no PDCA columns
- #11 Sick leave -> o'qish timer PAUSE -> ALTER enrollments ADD paused_until (leave-aware deadline) column
- #15 Murabbiy 3 kun baholamasa eskalatsiya -> NEW grading-submission object + graded_by_deadline field (today mentor confirm is binary practicalPassed, no per-submission grading queue to attach a deadline to)
- #16 Tashqi sertifikat HR tasdiqi bilan hisob -> NEW external_certificates table (upload + HR-approve -> marks internal course gate satisfied)
- #20 Reglament matritsa karta+razryad+dept -> NEW reglament_matrix table keyed (card,razryad,dept) + history/versioning table for retroactive preservation
- #22 Kaizen bonus Act; ko'p-karta atribut -> ALTER kaizen_suggestions ADD bonus_amount + card_id FK (also needs owner bonus-formula and touches payroll writer)
- #34 Tablet offline o'qish, BullMQ idempotent sync -> NEW sync-ledger table w/ sync_id dedup + BullMQ/Redis queue infra (none present in LMS); FE IndexedDB/service-worker cache
- #35 Onboarding bosqich 0-4/4-8/8+ soat eskalatsiya -> ALTER hr_onboarding_milestones ADD escalation-tier/last_escalated tracking column (has target_date/status but no per-tier idempotency field to fire each hour-bucket once)
- #42 Reglament test 7-kun uzr (matn+fayl) +7 kun -> NEW excuse_requests table (text + file via storage module, manager-approve, one-time +7d flag)
- #47 Jihoz yo'qolsa review_required, NO-14 xabar -> ALTER card_required_knowledge ADD review_required boolean (CRUD exists) — also needs assets/equipment status-change event to fire it
- #60 Yakuniy topshiriqlar bo'lim yig'ma test -> ALTER lms_modules ADD section_final_test_id ref + unlock-gate (only order/order_index/sort_order exist, no gate col)
- #62 Amaliy imtihon baholash varaqasi (rubrika) -> NEW lms_practical_exam_rubrics table (criteria/score-per-criteria/comments) — today practicalPassed is a raw boolean, no rubric
- #75 Tashqi malaka ichki kurs o'rniga (dup of #16) -> NEW external_certificates table (same schema as #16 — duplicate ask)

**Decision / data — 12:**
- #13 Ko'p uchraydigan xatolar QC/MES -> qayta-o'qish -> Which QC/MES defect signal maps to which LMS topic? (defect->topic taxonomy — no mapping table exists; owner must define)
- #18 Simulyatsiya AI xavfli qaror -> What is the scope/content of the AI simulation engine (doc: 'ko'lam OCHIQ') and what AI provider key is available? (base scenario engine is from-scratch)
- #30 Yuridik minimal SHA-256 imzo + IP -> What exact legal-minimal field set / legal-validity requirements must a signed certificate carry? (code comment itself flags this owner-gated)
- #44 Qisqartirilgan test 30-50% (AI tanlaydi) -> What shortening percentage should HR configure (30-50%), and is an AI provider key available for the AI-selection variant? (percentage is owner master-data)
- #46 Yangi gofra turi -> MaterialAdded -> LMS mavzu -> What is the mapping from a new material type to which LMS topic? (owner-defined taxonomy; no mapping table; also depends on material-catalog MaterialAdded event)
- #55 7 departament tuzilmasi umumiy kursi -> What is the actual course content for the 7-department (Vysotskiy) structure orientation? (owner-authored training material — course row does not exist in the 5 seeded)
- #57 Murabbiy o'zi malakali ekanini tekshirish -> What minimum razryad/cert threshold qualifies someone to mentor? (owner master-data; doc: 'malaka-tekshiruv OCHIQ')
- #58 Murabbiy bo'lmaganda zaxira tartib -> What is the exact reserve-mentor fallback rule / priority order? (owner-defined; doc: 'fallback qoidasi OCHIQ') — also relies on org manager chain
- #73 Tashkiliy siyosat ORGPOLITIKA testga bog'lash -> The organizational policy (ORGPOLITIKA) documents must be authored/uploaded by owner first; also lms_tests is 0 rows
- #74 Tijorat siri/maxfiylik moduli + yozma tasdiq -> What is the NDA/confidentiality legal text/content? (owner/legal artifact — mechanism can reuse is_mandatory/cert pattern)
- #78 Ishdagi vaziyat interaktiv simulyatsiya (dup #18) -> What is the simulation-mode scope/priority? (doc: 'ko'lam OCHIQ' — duplicate of #18, from-scratch engine + AI key)
- #82 Imtihon natijasi murabbiy reytingiga ta'sir -> What weighting formula governs how much one exam result moves a mentor's rating? (owner-defined; doc: 'reyting<->natija bog'lash OCHIQ')

## 18 Notifications

**Schema sign-off (Q-35) — 18:**
- #2 Bitta ntf_notifications jadval (module_code filter) -> ALTER notifications ADD COLUMN module_code, channel, payload_json, immutable (or rename to ntf_notifications) — new columns, Q-35 owner migration
- #7 Deep-link/OTP; telegram_id UNIQUE -> ADD UNIQUE constraint on users.telegram_id (migration) + a 24h token store — schema/constraint change
- #10 DB immutability DELETE trigger + immutable flag -> ALTER notifications ADD immutable BOOL + archived_at TIMESTAMP + BEFORE DELETE trigger (RAISE EXCEPTION)
- #14 Og'zaki topshiriq source='verbal' + 24h taymer -> ALTER kanban_cards ADD verbal_confirmed_at TIMESTAMP (new column; source varchar already exists)
- #15 ntf_doc_views (kim ochgan) + version signal -> CREATE TABLE ntf_doc_views(user_id, doc_id, doc_version, viewed_at) — confirmed to_regclass null
- #19 Har status SLA (kanban_column_sla) -> CREATE TABLE kanban_column_sla(column_name, threshold_minutes, module_code) — confirmed null
- #23 IoT EquipmentFaultEvent → ntf_outbox offline -> CREATE TABLE ntf_outbox(...) for offline retry (confirmed null) + new EquipmentFaultEvent class
- #41 NTF signal; blok KanbanBlockRequestedEvent -> ALTER kanban_cards/kanban_tasks ADD blocked_reason (no blocked* column found) + new KanbanBlockRequestedEvent
- #45 Tungi yakka qaror soft-cancel record -> CREATE TABLE night_solo_decisions(...) with soft-cancel-only semantics — confirmed null
- #46 Mas'uliyat o'tkazma formi -> CREATE TABLE responsibility_transfers(...) for the formal transfer form (BE endpoint + table)
- #50 Bot health ntf_bot_health 30s ping -> CREATE TABLE ntf_bot_health(bot, last_ping, status) — confirmed null
- #57 Alert chegaralarini egasi belgilaydi -> CREATE TABLE alert_thresholds(module_code, metric, threshold, config) — confirmed null (kanban_column_sla also null)
- #66 O'qilgan ACK tugma (ack_at) -> ALTER notifications ADD COLUMN ack_at TIMESTAMP (only read_at exists) + inline button (needs item 17)
- #73 Yangi xodim ulanishi (deep-link/OTP + UNIQUE) -> ADD UNIQUE constraint on users.telegram_id (verified no such constraint; telegram_id 0 populated) — migration
- #85 Tungi smena telefon-eskalatsiya call_log -> CREATE TABLE call_log(caller, callee, timestamp, response) — confirmed null
- #93 Takroriy xato defect_type_code -> ALTER qc_defects ADD COLUMN defect_type_code (only defect_type + defect_code exist separately)
- #105 Dizayner tasdiqsiz fayl signali (design_files) -> CREATE TABLE design_files(id, ..., approved_by nullable FK) — confirmed to_regclass null
- #116 Mas'uliyat lavozimga (kartaga) yo'naltirish -> ALTER notifications ADD COLUMN recipient_card_id (only user_id exists as recipient)

**Decision / data — 25:**
- #4 priority=CRITICAL bypass_quiet_hours yo'q -> What exact quiet-hours window (e.g. 22:00-07:00) does a priority='CRITICAL' send bypass? (quiet_hours storage exists on notification_preferences; only the value is missing.)
- #5 Inline ACK 2× resend → eskalatsiya -> What resend interval and final escalation timeout for an unacknowledged message before it walks the escalation chain?
- #16 Bog'liq bo'limlar workflow_rules; 10+ throttle -> What are the actual department-dependency rows to seed into the (currently 0-row) workflow_rules table, and the throttle rate for 10+ recipients?
- #30 Past-3 shaxsiy; guruhda Top-3 -> What ranking metric/KPI defines the top-3 / past-3 split? (No ranking/leaderboard code exists.)
- #36 Smena vaqtlari mes_shift_schedules dinamik -> What is the canonical shift-schedule table? mes_shift_schedules does not exist (to_regclass null).
- #38 Alert debounce 5daq/3signal -> What debounce window and signal-count threshold (doc suggests 5 min / 3 signals) should be configurable defaults?
- #42 TtValidationService + 24h TT to'ldirilmagan -> Which TT (texnik topshiriq) fields are 'required' to define completeness before the 24h escalation fires?
- #62 Leaderboard top-3/past-3 digestda -> What is the ranking KPI for the digest leaderboard?
- #68 Tinchlik vaqti (quiet_hours) -> What default quiet-hours window, and is it global or per-user editable? (notification_preferences.quiet_hours jsonb column already exists but is unread/unpopulated.)
- #75 Kechikish/muddat signali (ikki bosqich) -> What pre-deadline and post-deadline thresholds per notification type drive the two-stage reminder?
- #76 ЦКП bajarilishi haftalik xabar -> Which table stores ЦКП completion % per employee/card? (Not identified as an existing live table.)
- #81 6 turdagi yozma majburiy rasmiy yozuv -> Which exact six message categories require formalization into a numbered ERP record?
- #89 Mijoz muammosi savdo menejeriga avto -> Which QC field/value marks a defect as customer-caused (vs technical) for routing to the sales manager?
- #90 RD-2/RD-4/RD-5 uchlik yig'ilish -> Which org roles map to the RD-2 / RD-4 / RD-5 codes that form the 3-party meeting?
- #91 'Vaqtincha to'xtatish' zanjirga e'lon -> Where is a 'vaqtincha to'xtatish' (halt) decision recorded, and who is in the broadcast scope?
- #92 Yangi orgpolitika e'loni (НО-3) -> Where are НО-3 orgpolicy records stored (source table for the announce-and-track flow)?
- #94 Kun yakuni НО-3 hisoboti eslatma -> Where is the НО-3 end-of-day report filed, so the cron can check whether it was submitted?
- #100 'Vaqtida xabar bermaslik' kamchilik qaydi -> What KPI weight/threshold defines 'late reporting' for the business.constants entry?
- #106 Og'zaki reja 'rasmiy emas' ogohlantirishi -> What counts as a 'formal' written plan record (the absence of which triggers the warning)?
- #108 Analitik kanal (Совершенствование) -> What is the target Telegram chat_id for the dedicated Совершенствование improvement-analytics channel?
- #110 Shikast xom-ashyo xabar+karantin -> Which WMS table hosts the quarantine status/workflow that the damaged-material flag should set?
- #115 Departament-darajasida umumlashgan hisobot -> Which metric(s) roll up in the vertical aggregation (ЦКП / KPI / production)?
- #118 Oylik mas'uliyat tahlili digesti -> Which table stores the qaror→masъul→natija triples that the monthly digest aggregates?
- #121 Yig'ilish topshiriqlari eslatmasi -> Where are meeting-assigned tasks recorded (Kanban source value or a dedicated meetings table)?
- #132 Ko'rilmagan muhim xabar qayta-yuborish -> What resend interval (N minutes) and escalation threshold for unread priority IN ('high','urgent') messages?

## 05 Director

**Schema sign-off (Q-35) — 13:**
- #6 To'liqsiz kundalik 'to'liqsiz' teg bilan saqlanadi -> ALTER TABLE diary_entries ADD COLUMN is_incomplete boolean (derived from required-field completeness at save)
- #7 3 kun 'hal qilinmadi' → surunkali eskalatsiya, dir_chronic_days -> New counter column dir_chronic_days (vision names it) on diary_entries or a chronic-issue tracking table; carryOverIssues (item 60) already real
- #23 Downtime AGGREGATE + breakdown; director 'taniqladim' bayrog'i -> ALTER TABLE downtime_events/downtime_logs ADD COLUMN acknowledged_by_card_id integer (+ aggregate/breakdown query)
- #26 Bayram/smena kunlar outlier — grafikda kulrang -> New holiday/shift-anomaly calendar table + outlier flag consumed by getStatTrends (also needs owner-supplied holiday dates)
- #31 Director 'anormallik, trend hisoblama' → outlier flag -> ALTER TABLE kpi_values/company_state_log ADD COLUMN is_outlier boolean (director-settable manual flag)
- #46 Info-request javob muddat sozlanadigan (24s), EP-DIR-072 -> New configurable-deadline column on coordination dokla/rasporyazhenie table (+ escalation cron); dokla/rasporyazhenie flow already exists
- #83 '1-4 продукт' kartaga to'ldirilsin -> ALTER TABLE org_functions ADD COLUMN product_1..product_4 text (also owner must supply the per-card product master data)
- #91 'Ko'p uchraydigan xatolar' AI risk-reyestriga -> ALTER TABLE org_functions ADD COLUMN risk_registry jsonb (also needs owner data-source decision + AI aggregation job)
- #93 'Javobgarliklari' (moddiy/ma'naviy) saqlansin -> ALTER TABLE org_functions ADD COLUMN responsibility text/jsonb (also owner supplies per-card responsibility text)
- #97 'Nazorat varaqasi' har karta o'quv-ob'ekt -> CREATE TABLE control_sheet (nazorat_varaq) linked to org_functions (also owner supplies control-sheet content structure)
- #101 'Malaka talablari' kartaga + AI nomzod baho -> ALTER TABLE org_functions ADD COLUMN requirement/qualification text/jsonb (also owner supplies requirements + AI scoring rubric)
- #102 'Lavozim vositalari' (A-System/hisobot/tex-karta) kartaga -> ALTER TABLE org_functions ADD COLUMN tools jsonb/array (also owner defines tool-list taxonomy)
- #109 Operatsiya turlari norma (avtokley/GTO/kley/rezka 13 tur) -> CREATE TABLE operation_norm with 13 operation-type rows (also owner supplies the 13 norm values — pure master data)

**Decision / data — 18:**
- #24 PP oy-boshidan kesim kanonik; MES kunlik fakt → oylik kvota (EP-DIR-036) -> Which table is canonical for 'oy boshidan kesim' MTD — PP production_orders or MES mes_production_sessions? (both exist independently — two-world reconciliation)
- #27 Setup >30% → AI 'format optimizatsiya' tavsiya, 3x→eskalatsiya -> Supply the format-optimization recommendation rules/examples the AI should emit when setup ratio >30% (setup_seconds is already captured; the 30%/3x thresholds are given, only the recommendation content is owner/AI-supplied)
- #29 Eski yil buyurtmalari arxiv qatlamdan + yil filtri -> Which year boundary counts as 'archived/old' for sales_orders?
- #35 Energiya IoT bo'lsa avto, bo'lmasa qo'lda + moliya tasdiq -> Proceed with manual-entry + finance-approval for energy permanently, or procure physical energy IoT sensors? (company-state.repository.ts confirms no sensors installed)
- #38 5S: QC/IoT kamera → AI → sifat rahbar tasdiq → dashboard -> Procure physical 5S cameras + choose an AI-vision vendor/model, and confirm the quality-lead approval workflow? (no camera hardware installed)
- #40 Bir buyurtma ko'p yo'nalish → ASOSIY yo'nalishga to'liq -> Define the 'yo'nalish' (print-direction) taxonomy and which sales_orders field/enum encodes it — no direction column exists (only division/distribution_channel)
- #43 Yangi versiya → o'zgargan bo'limga 'tanishdim' imzo + diff -> Define what constitutes a 'section' of an instruction document for diff-based re-acknowledgement (org_functions.last_reviewed_at exists but no diff/versioning)
- #47 Chiqindi qayta-ishlash % ↔ Moliya 'makulatura kirim' → GL entries -> Confirm the canonical GL table (gl_entries vs gl_journal_entries) + account mapping for monthly waste-recycling variance postings (GL two-worlds; waste_records/targets also empty)
- #84 Оргсхема joylashuv 5-Deprt/13-bo'lim/Sektsiya 3 maydon -> Confirm the exact 5-Department/13-section Vysotskiy-7 numbering scheme to encode (derived view over department_id avoids new columns, but scheme must be owner-defined)
- #89 A-System bilan ERP bog'lanishi (to'liq almashtirish?) -> Decide the A-System migration strategy — full replace vs parallel-run vs one-way import — before any integration code can be written
- #90 '1 sutkalik ishlab-chiqarish rejasi' 24-soatlik ob'ekt -> Confirm exactly which fields belong on the formal 24-hour 'daily_plan' object vs the existing getPlanFact daily cut
- #92 'Muvaffaqiyatli harakatlar' ideal-model + AI baho -> Define what 'muvaffaqiyatli harakat' (successful action) means per card/role before AI scoring can be meaningful
- #107 'Den/Noch' (kunduz/tun smena) statistika -> Confirm the day/night shift-boundary hours for the den/noch breakdown (mes_production_sessions has shift_id/started_at but boundary policy is owner-set)
- #111 Bandlik.xlsx pragon (min/soat/kun yuklama) CRP -> Supply the original Bandlik.xlsx source data/formula to replicate the CRP loading calculation exactly (work_centers.efficiency_rate gap also noted)
- #115 Kichik buyurtmalar tahlili (kichiklashish%/dona-kg foyda) -> Define the 'small order' size threshold (order-costing module already exists to join per-unit profit)
- #116 'Razmer eski→yangi' format-opt AI tavsiya -> Supply historical size-optimization rules/examples for the formatOptimization() recommendation in strategic-agent.service.ts
- #126 Xato 'tushunmaslik/e'tiborsizlik/qoidabuzarlik' AI tasnif+o'quv -> Supply labeled training examples for the 3-way error classifier, OR sign off on a rule-based (non-AI) substitute
- #134 'Algoritm turi' (2-8 bo'lim) murakkablik + vaqt prognozi -> Define the '2-8 bo'lim' complexity-tier taxonomy and the associated time estimates (also needs a new algorithm_type column)

## 19 POS

**Schema sign-off (Q-35) — 13:**
- ##17 Shoshilinch chiqim ruxsat, reason majburiy + is_unplanned, boshliq Telegram -> ALTER TABLE pos_movements ADD COLUMN is_unplanned boolean + variance_qty numeric. Verified absent via information_schema.columns. Telegram-to-dept-head part is fine (role-based PosTelegramService exists), but the two columns are a pure ADD COLUMN = Q-35 owner-gated.
- ##24 Boshlang'ich qoldiq: opening balance GL direktor tasdig'i -> New MovementTypeCode enum value OPENING_BALANCE + a pos_movement_types master row + a GL debit/credit account mapping in auto-gl-posting.service (calculateEntries currently has no case, would fall to zero-GL default). Director-approval gate can reuse PosMovementStatusService, but the new type/enum is owner-gated. (Opening-balance dataset itself is also owner data.)
- ##25 Prostoy vaqti pos_downtime_requests, omborchi+boshliq push, MES FK -> CREATE TABLE pos_downtime_requests (to_regclass = null). FK target mes_downtime_logs also does NOT exist (to_regclass = null). New table = Q-35 owner-gated.
- ##29 Storno GL teskari yozuv, original_movement_id, ikki storno 409 -> ALTER TABLE pos_movements ADD COLUMN original_movement_id (self-FK) + a UNIQUE constraint to reject a second storno with 409. Columns confirmed absent. The mirrored debit/credit posting can reuse AutoGlPostingService, but the FK column + unique constraint are owner-gated schema.
- ##31 MES session yopilganda avto FG-kirim DRAFT, QC_PENDING -> No FG-intake movement type exists — the 11 live pos_movement_types (and the 12-value MovementTypeCode enum) have EXTERNAL_IN/INTERNAL_RETURN/WASTE_IN/PARTIAL_RECEIPT/CUSTOMER_MATERIAL but nothing for finished-goods-from-production. Needs a new enum value (e.g. FG_RECEIPT) + pos_movement_types row + GL mapping. NOTE: the completion signal DOES exist (MES emits MesCompletedEvent via CQRS EventBus, already consumed by QC mes-completed.listener), so the event is NOT the blocker; the missing FG-intake type is.
- ##32 Rulon og'irlik+sertifikat pos_movement_rolls, QC lab FK, proporsional narx -> CREATE TABLE pos_movement_rolls (weight, certificate_ref, qc_lab_result_id FK) — to_regclass = null. New table = Q-35 owner-gated; QC lab-results schema is also a dependency.
- ##41 pos_movements/items yillik partitioning, 3y+ arxiv, UNION fetch -> Structural migration: convert pos_movements/pos_movement_lines to PARTITION BY RANGE(created_at) and migrate pos_movements_archive in. pos_movements is currently a plain table (relkind='r'). A live-table structural migration is explicitly owner-gated (Q-35), as the doc itself states.
- ##47 Bo'yoq IoT 'tugadi' signali, iot_job_ref unique -> ALTER TABLE pos_movements ADD COLUMN iot_job_ref (unique) for dedupe. Column confirmed absent. Also depends on the IoT module actually emitting a paint-finished event (not verified live). New column = Q-35 owner-gated.
- ##49 Bitta qurilmada MES brak + POS chiqim, mes_session_id FK -> ALTER TABLE pos_movements ADD COLUMN mes_session_id (FK to production_sessions). Column confirmed absent via full information_schema.columns read. New FK column = Q-35 owner-gated.
- ##50 Director dashboard pos_director_summary materialized view, 5min cron, drill-down GL -> CREATE MATERIALIZED VIEW pos_director_summary (to_regclass = null) — a new DB object created via migration = Q-35 owner-gated. Also chained on item #2's canonical-entries mirror being made fully reliable (currently best-effort warn-only).
- ##91 Bekor turish (prostoy) signali -> Duplicate of item #25 — needs CREATE TABLE pos_downtime_requests (+ FK to non-existent mes_downtime_logs). Owner-gated new table.
- ##117 Shoshilinch chiqim (rejasiz/ruxsatli) -> Duplicate of item #17 — needs ALTER TABLE pos_movements ADD is_unplanned boolean + variance_qty numeric. Owner-gated ADD COLUMN.
- ##131 Yuk topshirishda nomuvofiqlik (topshir↔qabul nizo) -> pos_movement_confirmations.decision is a USER-DEFINED enum → a new 'dispute'/nizo state = new enum value (Q-35 owner-gated). Additionally the table has NO quantity fields (columns: id, movement_id, step, user_id, decision, comment, signed_at, signature_hash, ip) — comparing handed-over vs received qty needs new columns. Routing to dept-head is fine (role-based Telegram routing via eventRepo.findByRoles already exists), so routing is NOT the blocker; the enum value + qty columns are.

**Decision / data — 6:**
- ##14 Reja%/kechikish/og'ish KPI hr_kpi_snapshots'ga, HR kartaga -> What is the exact GSD/KPI weighting formula combining reja% (plan attainment), kechikish (lateness), and og'ish (deviation)? It is not specified anywhere in code (EP-POS-056 OCHIQ). The cron/write is otherwise mechanical, but the formula cannot be fabricated (Q-40). Also chained on the HR card-GSD write path existing.
- ##26 Kredit-limit real-time, EXTERNAL_OUT blok, qisman to'lov ruxsati -> sd_customers.credit_limit exists (numeric), but there is NO outstanding_balance/current_balance column — what is the authoritative source of 'outstanding balance' to compare against the limit, and what is the partial-payment allowance policy (block outright vs allow partial)? Both are owner policy/semantics decisions.
- ##79 Karta-model integratsiya (omborchi GSD) -> Same as item #14 — needs the exact 3-indicator GSD formula (EP-POS-056 OCHIQ) plus the HR card-GSD write path.
- ##94 Norma-fakt farqi (ortiqcha sarf) ogoh -> Two owner inputs: (1) the over-norm TOLERANCE — vision says 'oshsa' (if exceeded), but the code's norm is an AVG of historical INTERNAL_ISSUE (material_norms, 0 rows), so a bare 'exceeds average' would flag ~half of all issues; a tolerance % is needed to be meaningful. (2) authoritative norm SOURCE — vision item #30 wants pp_routing_operations standard norms, but the built MaterialNormsService uses AI-avg material_norms; which is canonical is a design decision. Wiring point exists (pos-movement.service INTERNAL_ISSUE path already has a variance-gate + notes column), so it is purely the threshold/source that gates it.
- ##96 A-System bilan bog'liqlik (almashtir/parallel) -> The entire A-System migration strategy (replace vs parallel-run) is an explicit owner decision ('A-System taqdiri'). No code work is possible until decided; the marker itself says n/a until the migration/parallel-run decision is made.
- ##106 Omborchi GSD 3-ko'rsatkich avto -> Same as item #14/#79 — the exact 3-indicator formula (reja%/kechikish/og'ish) is owner data (EP-POS-056 OCHIQ).

## 11-MM/Ta'minot

**Schema sign-off (Q-35) — 41:**
- ##6 Sabab kategoriyadan + ixtiyoriy matn, BE Zod -> New reason_category column (+enum) on the reject/cancel target table; owner must also enumerate the category list.
- ##8 Avans qisman kelishida proporsional zachet -> New avans/prepayment ledger table (mm_advances = null) with purchase_order_id FK + proportional-zachet fields.
- ##13 Gramaj ±dopusk material kartasida + laborant override -> New gramaj_tolerance column on material_cards (grammage exists, tolerance does not).
- ##14 Toplanner vs makulator kross-tekshiruv -> New paper-class attribute column on material_cards + owner taxonomy.
- ##19 Klishe/trafaret MM asbob katalogi, 3-yil cron -> New tool-catalog table (klishe/trafaret) — absent.
- ##20 Rekvizit o'zgarishida SLA 2 kun, vendor_requisite_history -> New vendor_requisite_history table (absent).
- ##22 'Aloqador shaxs' bayrog'i ARIZA bosqichidan -> New related_party flag column on requisition (absent); HR auto-detection deferred by owner.
- ##32 Landed cost MIQDOR nisbatida taqsim, GL qabulda -> New landed-cost line columns/table on PO/goods-receipt (landed_cost absent).
- ##34 Vendor muloqot jurnali vendor_communications -> New vendor_communications table (to_regclass = null).
- ##35 Narx muzokara izi immutable + AI tavsiya -> New append-only negotiation-log table (absent); AI-suggestion half is credential-blocked.
- ##37 Rohler/poddon equipment_assets'da, yaroqsiz→GL -> New equipment_assets table (to_regclass = null); owner must also decide which module owns Aktivlar.
- ##38 'Qimmat partiya' >50mln/import → komissiya, SLA 4soat -> New import flag column on mm_purchase_orders + a 3-step approval-chain state store (absent).
- ##39 Vendor artikul→bir necha materialga, unique index -> New vendor_article column + vendor-article↔material cross-map table + unique index.
- ##40 Yoqilg'i talon mashina bo'yicha, +10%/+20% cron -> New fuel-coupon-balance ledger + fuel norma column (both absent).
- ##41 Boj/broker 'xizmat PO' (service-type), 3-way match yo'q -> New po_type enum column (goods/service) on mm_purchase_orders (absent).
- ##43 Yangi vendor 3 sinov partiya + PO summa cheklovi -> New 'trial' value in mm_vendors status enum + trial-batch counter column; owner sets the trial PO cap.
- ##44 Rulon qoldiqlari PP push + soft-lock 24soat bron -> New roll-reservation/soft-lock table with 24h expiry (warehouse_stock.reserved_quantity scalar is insufficient).
- ##47 Kechikish har PO qatori uchun, miqdor-og'irlikli -> New per-line delivery-date/on-time columns on mm_purchase_order_items.
- #11.2 Yetkazuvchi turi 6 oldindan belgilangan turdan -> New type enum column (6 values) on mm_vendors (absent); owner must define the 6-value taxonomy.
- #11.6 Shartnoma (raqam/sana/muddat/skan) + 30 kun ogohlantirish -> New vendor_contracts table (to_regclass = null).
- #11.20 Yetkazuvchi narx taqqoslash (tender, 3+ vendor) -> New RFQ/tender table (to_regclass('rfq') = null).
- #11.25 Yetkazib berish sharti (Incoterms) belgilanadi -> New incoterms/delivery_terms column on mm_purchase_orders (absent).
- #11.31 To'lov muddati kirim sanasidan -> New structured payment-term columns (predoplata%/kechikish-days) — payment_terms is an unstructured varchar.
- #11.32 Har avans PO ga bog'lanadi, mol kelganda yopiladi -> New avans/prepayment table with purchase_order_id FK (absent) — same table as #8.
- #11.37 1 asosiy + 1-2 zaxira vendor, auto-fallback -> New primary/backup vendor role columns on a material-vendor link (preferred_supplier_id is a DB-only/unused artifact).
- #11.38 Prays-list PO ga avto, muddat tugashida ogohlantirish -> New validity-period column on supplier_price_tiers (has only id/supplier/material/min_qty/max_qty/unit_price).
- #11.39 Import xarajatlar material miqdoriga taqsim (landed cost) -> New landed-cost input columns on PO — same as #32.
- #11.43 Hujjatlar skani (litsenziya/sertifikat/NDS) + muddat -> New vendor_documents table (file refs + expiry dates) — absent.
- #11.44 'NDS to'lovchi' belgisi + NDS-hisobga taqqoslash -> New is_vat_payer boolean column on mm_vendors (absent).
- #11.49 Vendor muloqot jurnali (sana/kim/mavzu/natija) -> New vendor_interactions journal table (absent) — same as #34.
- #11.54 Kirim qog'oz laboratoriya (РД-5) tasdiqsiz PP ga chiqmaydi -> New linkage/gate column tying qc_lab_tests (keyed by order_id) to mm_goods_receipts + a PP-block flag.
- #11.55 Rulon namligi chegaradan oshsa avto karantin + claim -> New moisture column + threshold on material_cards (absent); owner threshold value; also dep 11.54.
- #11.56 Граммаж texkartaga avto solishtirish, dopuskdan oshsa -> New gramaj/dopusk tolerance column on material_cards — same root as #13.
- #11.57 Топлайнер ╳ местный qog'oz sinfi kross-tekshiruv -> New paper-class attribute column — same as #14; owner taxonomy.
- #11.58 Gofra ECT + qavat material kartasi → texkartaga moslik -> New ECT/layer-count columns on material_cards (absent).
- #11.59 Shartli ruxsat (o'tdi/shartli/rad) 3 holatli kirim -> New 'conditional'/'shartli' value in mm_goods_receipts status enum (currently draft/pending/approved/rejected).
- #11.61 Brak sabab tahlili jurnali (sabab+qaror+vendor javob) -> New brak_reason_journal table — absent (QC-fail listener could write into it).
- #11.63 Texkarta kompozitsiyasi laborant tasdiqsiz PP ga o'tmaydi -> New laborant-approval gate column/table against technology_cards composition (PP domain).
- #11.64 Etalon namuna (foto/spetsifikatsiya) kirim solishtiriladi -> New reference_samples table (photo ref + spec) — absent.
- #11.65 Yangi vendor 'sinovda'→lab o'tsa 'tasdiqlangan' -> New 'trial'/'sinovda' value in mm_vendors status enum + auto-promotion — same enum gap as #43.
- #11.66 Manfaatlar to'qnashuvi — vendor xodim/qarindosh belgisi -> New related_party flag column on mm_vendors (absent) — same as #22.

**Decision / data — 5:**
- ##16 Muddati o'tgan lak/kley/bo'yoq avto karantin, GL zararga -> Which material categories count as lak/kley/bo'yoq (owner tagging), and which GL account receives the expiry write-off? (shelf_life_days exists but no category-to-quarantine mapping.)
- ##17 Xavfli kimyo zonasi alohida RBAC + IoT anomaliya event -> Which warehouse(s)/zone(s) are the hazardous-chemical zone, and which roles receive the new warehouse:hazardous:write permission? (RBAC is string-perm based; hazard_class exists — blocker is owner designation/role grant.)
- ##26 Shoshilinch PO direktor Telegram webhook 'ha' -> Provide the director's Telegram bot token + chat-id (un-fabricatable credential) for the urgent-PO approval webhook.
- ##36 Makulatura INTERNAL_TRANSFER + sotuv CoA alohida -> Which CoA revenue account code should receive makulatura-resale revenue? (INTERNAL_TRANSFER type + makulatura warehouse type already exist.)
- ##46 'Narx tejovi' KPI = byudjet vs fakt narx, oylik -> Exact 'Narx tejovi' KPI formula weighting and default period (oy/chorak/yil)?

## 01-org

**Schema sign-off (Q-35) — 8:**
- #7 I.o. ЦКП alohida agregatlanadi (acting vs substantive bucket) -> New is_acting boolean column on ckp_fact_values (confirmed live: table has id,card_id,employee_id,product_id,...,error_code — NO acting field). Needed to persist acting-status per fact so aggregation buckets survive later assignment changes; cannot be reliably derived at query time from mutable employee_cards.
- #19 Vakant karta ЦКП 'qo'shimcha yuk' teg (is_extra_load) -> New is_extra_load boolean column on ckp_fact_values (rollup write-path) to distinguish a parent's own vs inherited-from-vacant-child achievement. (i.o. ustama % formula is a separate owner input.)
- #34 Mentor-karta scoped-read RBAC grant + auto-revoke cron -> New row-scoped grant table/column (e.g. mentor_access_grants keyed by mentors.card_id + expiry). mentors/lms_card_mentors tables exist but the standard role-based RBAC has no per-card row-level read-grant mechanism, so a new scope structure is required. Conservative (unsure existing RBAC can express card-scoped grants).
- #39 Uch smenali dastgoh: karta smena IoT filtri (shift_id) -> New shift_id FK column on org_departments + a shift-schedule master table (org_departments today has work_schedule text only, no shift_id — confirmed absent). Plus ShiftScheduleChangedEvent emission.
- #50 Race himoya: 3-ustunli partial-unique + FOR UPDATE -> Index migration: rebuild uq_employee_cards_active_link (currently 2-col (employee_id,card_id) WHERE is_active) into the vision's 3-col (card_id,employee_id,is_primary) partial-unique. Index DDL migration = owner-gated (Q-35). (FOR UPDATE tx wrapping is pure code, but the requested fix includes the index.)
- #118 'Унвон' lavozimdan alohida maydon -> New unvon text column on org_departments + expose in CardCreateSchema/CardUpdateSchema (52-col live listing has no title/unvon). Doc flags no undecided business rule — pure ALTER ADD COLUMN, owner-gated per Q-35.
- #123 Karta korporativ raqam + abonent doirasi -> New corporate_phone + abonent_scope columns on org_departments + DTO (org_departments has telegram_group_id but no phone/abonent column). Actual numbers are owner data but the schema add itself is the gate.
- #129 Karta atamalar lug'ati (Глоссарий) tooltip -> New glossary table (term, definition, card_id/category) + lookup endpoint (grep glossary/Глоссарий = 0 files). Content is owner-supplied but the table creation is the gate.

**Decision / data — 20:**
- #27 Ikki otdeleniye xizmat: primary_department_id routing -> Define the dual-department assignment model: what does a card's 'second otdeleniye' mean operationally, and which counts as primary for Coordination routing? (Also needs a new primary_department_id column once decided.) Doc flags this as an open owner question.
- #37 'Unvon' PDF + приказ format + immutable arxiv -> Provide the official приказ (order) document legal format/wording for the unvon-in-PDF template before it can be built (also requires the new unvon column).
- #40 Yangi karta shtat-reja bog'lanish (soft check) -> Decide the shtat-reja (staffing-plan) data model — per-card budgeted seat vs aggregate department headcount budget — before a headcount-vs-plan warning can read it. Doc: 'Egasi штат-reja modeli qarorini bermagan.'
- #41 'Majburiy tizim-qaydlari' (card_activity_logs) IoT defer -> Owner has explicitly deferred this to the IoT phase (card_activity_logs). Confirm the deferral still stands / decide when to lift it — no action expected now.
- #45 Maxfiy maydon filtri (role-aware projection) -> Enumerate exactly which card fields are 'maxfiy' (e.g. min_salary/max_salary) so the role-aware column projection knows what to strip for non-privileged roles. Mechanism is pure code but the sensitive-field list is undefined.
- #67 Shablonlar boshlang'ich to'plami (10-15 lavozim) -> Supply the 10-15 factory-position card-template seed rows (card_templates table + apply-template code already exist and work; only the seed data is missing).
- #72 Ikki kartani birlashtirish (merge) -> Define card-merge conflict semantics — when the two merged cards differ (e.g. different razryad_level_id), whose history/values win? Endpoint reuses existing softDelete/archive but the merge rules are unspecified (and merge is a structural org mutation).
- #75 Kartalarni ommaviy import Excel -> Specify the Excel column -> CardInput field mapping (which spreadsheet headers map to which card fields) before the /org-structure/cards/import endpoint can be built (node-import partial-commit pattern is the template).
- #90 Kerakli jihozlar modeli+aktiv (card_equipment) -> Decide which module owns the canonical equipment/asset table (WMS/assets vs a new org-structure card_equipment table) before creating it.
- #98 'Muvaffaqiyatli harakatlar' AI ijobiy mezoni -> Define the taxonomy of what counts as a 'successful action' per card-type before adding a success_actions field to AiFitService's report shape.
- #101 4 va 5-Departament ('Ишлаб чиқариш') chegarasi -> Define the exact dividing line between 4-Departament and 5-Departament (both are currently one generic 'Ishlab chiqarish' node). Doc marks 'OCHIQ qaror'. Encoding is trivial seed data once decided.
- #105 Контрольный лист 'o'qildi-tasdiqladim'+imzo -> Decide the acknowledgment/signature format (simple timestamp+checkbox vs cryptographic e-signature — same question as #126) before the card_acknowledgments table.
- #107 'Иш жойи ва воситалари' jihoz ro'yxati -> Same as #90 (Izoh: 'EP-ORG-090 bilan bir') — decide which module owns the equipment/asset table. Duplicate build item of #90.
- #110 Karta 'ҳуқуқлари' ERP harakatiga bog'lansin -> Supply the full card-rights -> ERP-action taxonomy (which rights map to which ERP actions) before the rights-to-action mapping + request button can be built.
- #117 Оргполитикalar 'СЕРИЯ' kartalarga biriktirish -> Define the org-policy 'seriya' taxonomy before creating card_policy_bindings (policy-series + card_id).
- #126 Karta 2 raqamli imzo bilan kuchga kiradi -> Decide what constitutes a valid digital signature (provider/method) before the card_signatures table + 2-signature activation gate.
- #133 'Majburiy tizim-qaydlari' (boshlandi/bosqich/tugadi) -> Owner explicitly deferred this to the IoT phase and the checkpoint schema fields (boshlandi/bosqich/tugadi) are undecided ('OCHIQ'). Confirm/define before any build.
- #135 Bo'sh продукт slotlari signal (tugallanmagan) -> Define the expected product-slot count (1-4) per card-type that the empty-slot cron should flag against — owner master-data not yet defined. (Cron also routes a Kanban task to the card's manager via head_user_id.)
- #136 Vakant karta ЦКП'sini qo'shni karta bajaradi -> Define the adjacency rule for which 'qo'shni karta' inherits a vacant card's ЦКП (same parent_id/level? which one?). Rule unspecified; also depends on the acting/mentor mechanism being extended to ЦКП-transfer.
- #139 Karta штат-reja birligiga bog'lanadi (byudjet) -> Decide the staffing-plan model (1:1 card<->budgeted-seat vs aggregate dept headcount budget) — same open decision as #40 — before the staffing_plan table can be created. Doc marks 'OCHIQ'.

## 02 HR

**Schema sign-off (Q-35) — 8:**
- #5 AI-negative-score requires manager approval before posting -> New approval-status storage (an AiRatingFlag entity, or an approval_status/approved_by column on employee_daily_kpi). employee_daily_kpi has ai_generated/ai_confidence/net_score but NO approval-gate field; ai_disputes is post-hoc, not a pre-posting gate.
- #10 30-min manager-response timeout -> 'unauthorized exit' -> New hr_timeout_settings master-data table (the row explicitly rejects business.constants.ts). Q-35: new CREATE TABLE requires owner sign-off. No timeout master-data table exists today.
- #18 Per-task approve/reject in weekly plan; rating counts only approved -> Per-task approval storage. weekly_plans has only plan-level approved_by/approved_at/manager_review; tasks/top5_tasks/items are JSONB with no per-task approval and no stable task ids; a queryable weekly_plan_task_approvals table (or task-level status column) is needed so the rating pipeline can filter to approved tasks.
- #22 Pre-shift TB checklist gate on IoT tablet -> New TB/safety pre-shift checklist-confirmation table wired to the shift clock-in gate. Generic checklist tables (checklist_items/task_checklists/setup_checklists) and safety_incidents (post-hoc) exist but none is a per-shift TB confirmation store.
- #23 Offline photo local-queue + reconciliation + 2h stale alert -> A sync-state/upload-audit store to reconcile queued-vs-synced captures (hr_tz2_territory_logs has no upload/sync status). Primarily an IoT-client (frontend localStorage) resilience feature; only the 2h stale alert (role-based IT+HR) is trivially server-side.
- #28 Employee-caused vs no-employee idle split -> KPI -> New reason-category field on the MES idle/downtime event handler (lives in MES module, out of HR scope). No idle_reason/downtimeReason field exists.
- #32 Job-description version-bump -> re-familiarization checklist -> New re-familiarization acknowledgment table (employee + job_description version + signature + date). hr_job_descriptions has version/is_current_version but all 20 rows are v1; hr_nda_acknowledgments is NDA-specific, not reusable for JD re-acknowledgment.
- #43 Glossary 'Atamalar' section + tooltip + closed-book exam -> New glossary/terms table (+ a closed-book flag on LMS mini-tests). No glossary table exists anywhere (repo-wide grep zero).

**Decision / data — 11:**
- #13 Rejected candidate re-applies; prior rejection = penalty factor -> What is the exact penalty magnitude/weight a prior rejection applies to the AI re-scoring (a soft factor, not a block)? Not defined anywhere in code/schema. (Also AI-scoring-dependent.)
- #19 30-day probation; payroll blocked until mandatory docs complete -> Define the exact 'majburiy hujjat' checklist that gates a card's payroll row (which documents, and 'complete' criteria). Not specified in code or schema; also the gate itself sits in payroll (blocked area).
- #20 WMS inventory-return blocks final pay; HR cannot manually unlock -> Who may override the WMS-return -> final-pay block and via what workflow, given vision says HR cannot manually unlock? The override/unlock authority is an open owner question; also needs a WMS inventory-return event to listen to.
- #27 Optional 'responsible employee' on defect ('noma'lum' allowed) -> EP-HR-057 is explicitly OCHIQ: does the optional responsible-employee tie into discipline at all, and how? Owner has not confirmed. (Also needs a new nullable responsible_employee_id column on defect_reports — confirmed absent.)
- #31 AI camera resolves which card by physical zone -> Provide the physical zone->card map (which camera/room maps to which org card). Owner-supplied data; also needs a zone<->card binding field and is AI-camera-dependent.
- #39 Tie-break: manager picks between two side-by-side cards -> Configure the underlying employee-selection criteria that produce the tie (owner-config per the row). Selection thresholds/criteria are owner-defined.
- #44 Boomerang auto-filters 'fired for cause/distrust' -> Define the exact dismissal-reason taxonomy and the time/razryad exclusion criteria the boomerang pool must filter on. boomerang-embedding.service.ts only does vacancy-keyword matching; no dismissal-reason field/taxonomy exists.
- #52 Operation-types master catalog (lak/kley/rezka) -> Owner/technolog must supply the actual mes_operations catalog rows (table exists, 0 rows). Pure master-data population, no code work — data-entry decision.
- #57 Defect -> responsible-employee FK -> liability/fine -> EP-HR-057 OCHIQ: should a responsible employee auto-trigger a discipline fine, and under what rule? Owner left 'mas'ul' optional/undecided. (Also needs a new responsible_employee_id FK on defect_reports.)
- #58 Contract types + 30-day-before-expiry alert -> Owner/HR must create the employment_contracts records (contract_type + end_date columns already exist, but 0 rows). The 30-day HR-alert cron is otherwise code-ready on existing schema; it is meaningless until real contract data exists.
- #71 Inter-position AI-to-AI horizontal communication (workflow_rules) -> Owner must specify what 'aloqa-bo'limlar' inter-department AI contact should trigger and contain. workflow_rules=0 rows, no HR code, and the AI-to-AI protocol is undefined; also AI-dependent.

## 03 Finance/Moliya

**Schema sign-off (Q-35) — 11:**
- #2 O'zgargan taqsim foizi immutable versiyali (faqat keyingi davrlarga) -> income_split_config has NO versioning column (live cols: id,fund_key,share,is_active,updated_at,created_by,updated_by). Needs effective_from/effective_until (+version) columns OR a new income_split_config_history table = ALTER ADD COLUMN / CREATE TABLE (Q-35 owner-gated).
- #5 Bank/bayram kuni keyingi ish kuniga suriladi (DB kalendar) -> New business_calendar / holidays master table (to_regclass both NULL, no code found). Owner also supplies UZ holiday list to seed.
- #9 POS-farq 24h tasdiqlamasa eskalatsiya, GL avto-yozilmaydi -> New pos_variance_approvals pending-state table (to_regclass NULL). Recipient role also owner-gated.
- #22 O'zaro hisob akti 2×QC tasdig'idan keyin atomik yopiladi (PIN=imzo) -> New o'zaro-hisob (взаимозачёт) act header + lines table (grep found nothing but unrelated cc-pin.service.ts). Duplicate of #120.
- #25 Gilza 90 kun qaytmasa loss akti, depozit→zarar GL -> New gilza_deposits table (to_regclass NULL; grep 'gilza|гильза' finds nothing anywhere in apps/api/src). Deposit value/90-day threshold also owner-gated. Duplicate of #92.
- #29 Sort (1/2/3) minimal narx chegarasi, pastga tushsa blok -> New min_price_by_sort master table (to_regclass NULL). Floor-price values per sort grade also owner-gated. Duplicate of #118.
- #48 Da'vo GL'da 'da'vo receivable', 90 kun 'bahsli', keyin moliya qarori -> New claims_receivable table + GL account (to_regclass NULL). Final-decision approver also owner-gated. Same table as #88.
- #88 Schyot-faktura vazn farqi→yetkazuvchiga da'vo -> New claims_receivable table to record the claim (to_regclass NULL). ThreeWayMatchFailedEvent already fires (real), but no target table exists. Tolerance threshold also owner-gated.
- #92 Гильза qaytariladigan tara depoziti alohida sub-ledger -> New gilza returnable-deposit sub-ledger table (to_regclass NULL). Deposit value/90-day/GL account owner-gated. Duplicate of #25.
- #100 Xarajat kategoriyalari master-ro'yxati -> New expense_categories master table (information_schema shows none; accounts=42 is COA, cost_centers=1 — neither is an expense taxonomy). Taxonomy values also owner-gated.
- #120 O'zaro hisob (взаимозачёт/barter) akti atomik -> New взаимозачёт act table to atomically close matching AR/AP (grep only unrelated PP MRP-netting comment). QC-approval policy also owner-gated. Same table as #22.

**Decision / data — 15:**
- #3 ZVS byudjet qoldig'i pessimistik lock bilan bloklanadi -> budgets/budget_lines/budget_controls all = 0 rows live. Owner/Finance must seed department/card budget figures before the SELECT...FOR UPDATE reservation logic is meaningful (lock code itself is trivial).
- #16 Eslatma 4h→kassir rahbari, 8h→moliya rahbari, 3-marta→direktor -> Which request-type/table does this 4h/8h/3-strike graduated SLA apply to? Row doesn't specify beyond 'so'rov osilib qolmasligi'. Escalation-cron pattern (zno-zvs) is a reusable template.
- #17 Kassa oylik+soliqqa yetsa xom-ashyo ZNO 'Kuting', ustuvorlik ro'yxati -> What counts as reserved for oylik/soliq ('yetadi' threshold) and the exact ZNO priority-list ordering rule need owner sign-off. Related #130.
- #18 Penya avto-hisob (kun×stavka), egasi tasdig'idan 'da'vo receivable' -> Payment-penalty rate (stavka) and which AR aging bucket triggers it need owner input. Duplicate of #112.
- #39 Har qator alohida vakolat tekshiruvi, chegirma GL daromad-ayirma satri -> Per-line discount authority thresholds (who can approve what discount %) need owner input — same open question as #119 (chegirma vakolat foizlari). GL discount-line itself is buildable.
- #69 Byudjet davri haftalik + oylik/yillik jamlanma (rollup) -> budgets/budget_lines = 0 rows. Owner must seed budget figures before any week→month→year rollup query is meaningful.
- #83 Reja qog'ozi ombor kirim/chiqimdan avto buxgalteriyaga -> Owner must define the 'reja qog'ozi' document format/fields before the record/table can be designed (generic approval-chain infra approval_request_steps already exists to sign it). EP-FIN-033 marked done in old docs but no matching code.
- #84 Kamomad (berilgan−ishlatilgan−qaytgan)×narx=zarar -> Owner must set the tolerance threshold separating 'kamomad' from normal variance. GL engine (#72) real; consumption tracking (#85) Qisman.
- #94 Клей moddalari (сода/крахмал/бура) sarf-norma -> Owner must supply the actual glue consumption-norm values (soda/starch/borax ratios) as master data (EP-FIN-044). variance-analysis.service.ts engine is reusable/real.
- #101 Energiya (elektr/gaz/suv) stanok-soatiga taqsim -> Owner/engineering must define the energy-bill→machine-hour allocation rate formula. cost_center_id column exists on entries (bare pass-through); also needs IoT machine-hour data. Same infra as #24.
- #112 Пеня/jarima kechikkan to'lovga (kun×stavka) avto -> Owner must set the daily late-payment penalty rate / contract basis (EP-FIN-062). Pattern mirrors HR finance-extended-payroll penalty. Duplicate of #18.
- #118 Tannarxdan past narx SD da blok/egasi tasdig'i -> Owner must decide: below-cost sale hard-block vs require-approval, and who approves. order-costing.service.ts cost engine is real (compare against it, not tiered-pricing). standard_cost=0 rows. Duplicate of #29.
- #130 ЗНО navbati/ustuvorligi (ish-haqi>soliq>xom-ashyo) -> Owner must confirm exact priority order + tie-breaking rules (EP-FIN-080). Cash-limit awareness (#122) real; zno table exists (0 rows). Related #17.
- #C17 Byudjet bo'lim/karta bo'yicha rejalashtiriladi -> Schema/tables (and per doc, FE) exist but budgets/budget_lines/budget_controls = 0 rows. Pure data-population: owner/Finance must provide dept/card-level budget figures. No engineering blocker.
- #C18 ZVS so'rovi byudjetga avto-taqqoslanadi -> Budget-remaining check inside createZvsWithValidation is trivial code, but budget_controls/budgets = 0 rows — owner must seed budget data (C17) first. Same gate as #3.

