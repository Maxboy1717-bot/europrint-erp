# SAVOLLAR VA MUAMMOLAR — Owner input kerak (2026-07-11)

> Egangiz **schema-approval** berdi (`SCHEMA-APPROVAL-2026-07-11.md`). Yangi jadval/ustun/enum endi ruxsat.
> Quyidagilar hali **egangiz DATA/qarorini** kutadi — fabrication TAQIQ (MENEJER mandati: faqat un-fabricatable DATA so'raladi).
> Triage (19-modul workflow `wf_79de48f6-ebb`): **buildNow 315** (hozir quriladi → `_SCHEMA-BUILD-QUEUE-2026-07-11.md`) · **dataGated 277** (DATA kerak, quyida) · **blocked 52**.

---

## ⭐ A. ENG KATTA UNLOCK'LAR — birinchi shu javoblarni bering

Bitta javob eng ko'p itemni ochadi. Kamayish tartibida:

### Threshold / policy qiymatlari (vaqt, %, summa, kun) — **59 item** ochiladi
Ta'sir qiladigan itemlar: 08-mes #68, 09-qc #10, 09-qc #27, 09-qc #59, 09-qc #84, 10-wms 8, 10-wms 35, 10-wms 48, 10-wms 104, 06-sd #64, 06-sd #56, 07-pp 69, 07-pp 18, 07-pp 102, 20-cc #78, 20-cc #7, 04-coordination ##77, 04-coordination ##89, 04-coordination ##98, 04-coordination ##103, 04-coordination ##105, 13-crm 119, 13-crm 26, 13-crm 101, 13-crm 107, 13-crm 116, 13-crm 117, 14-marketing #14-15, 14-marketing #14-86, 14-marketing #14-28, 14-marketing #14-69, 14-marketing #14-88, 15-kanban ##93, 15-kanban #C56, 15-kanban ##86, 16-iot #33, 16-iot #56, 16-iot #75, 16-iot #30, 16-iot #40, 16-iot #73, 12-lms 44, 12-lms 57, 18-notifications #19, 18-notifications #57, 18-notifications #5, 18-notifications #36, 18-notifications #100, 18-notifications #132, 05-director 27, 05-director 115, 19-pos 14, 19-pos 79, 19-pos 106, 19-pos 94, 11-mm ##43, 11-mm #11.55, 03-finance #17, 03-finance #84

### GL hisob-raqam mapping (Finance) — **26 item** ochiladi
Ta'sir qiladigan itemlar: 08-mes #25, 09-qc #14, 09-qc #38, 09-qc #49, 10-wms 20, 10-wms 44, 06-sd #4, 06-sd #8, 06-sd #69, 07-pp 115, 20-cc #49, 13-crm 7, 14-marketing #14-26, 14-marketing #14-95, 14-marketing #14-9, 15-kanban #A26, 16-iot #35, 05-director 47, 19-pos 24, 19-pos 26, 11-mm ##37, 11-mm ##16, 11-mm ##36, 03-finance #25, 03-finance #88, 03-finance #92

### ⭐ 30-mashina master-data (item 89) — **20 item** ochiladi
Ta'sir qiladigan itemlar: 08-mes #1, 08-mes #28, 08-mes #84, 08-mes #85, 08-mes #92, 08-mes #94, 08-mes #100, 08-mes #104, 08-mes #123, 08-mes #132, 08-mes #89, 08-mes #90, 06-sd #157, 07-pp 32, 20-cc #129, 16-iot #52, 16-iot #74, 11-mm ##40, 01-org #39, 03-finance #101

### Master-data qiymatlari (norma, target, koeff, rate) — **20 item** ochiladi
Ta'sir qiladigan itemlar: 08-mes #34, 08-mes #95, 08-mes #11, 06-sd #31, 07-pp 27, 07-pp 63, 04-coordination ##108, 04-coordination ##112, 15-kanban #A4, 16-iot #54, 16-iot #85, 16-iot #123, 16-iot #17, 16-iot #39, 12-lms 20, 05-director 83, 05-director 109, 05-director 111, 02-hr #52, 03-finance #94

### Kim/qaysi rol (signer, assignee, owner) — **14 item** ochiladi
Ta'sir qiladigan itemlar: 08-mes #49, 08-mes #97, 09-qc #33, 20-cc #90, 20-cc #44, 20-cc #91, 20-cc #103, 04-coordination ##74, 04-coordination ##90, 15-kanban ##92, 16-iot #6, 16-iot #59, 11-mm ##17, 01-org #67

### Kalendar / oyna (bayram, kafolat, SLA) — **7 item** ochiladi
Ta'sir qiladigan itemlar: 09-qc #17, 04-coordination ##22, 04-coordination ##36, 15-kanban #A40, 15-kanban #C11, 05-director 26, 03-finance #5

### Boshqa (klasterlanmagan) — 131 item
Modul bo'yicha B bo'limida.

---

## B. Schema tayyor, DATA kerak — modul bo'yicha (277)

Har item: schema (approved) tayyor; qavs ichida — aynan qanday DATA yetishmaydi.

### 08-mes (23)
- **#1** Operator sees only machine-matrix orders; wrong machine blocked
  - DATA: Owner machine-type taxonomy (item 89 ~30-machine list) AND which operators are permitted on which machine type — without both the permission table is empty and blocks nothing.
  - schema: CREATE machine_operator_permission (operator_id, machine_type, allowed) distinct from course-based operator_certifications.
- **#25** Rework product = 'corrected-net'; separate GL cost line
  - DATA: The GL rework cost account code the separate cost line posts to (a GL account mapping), plus confirmation of the GL two-world posting path. Column is designable but the 'separate GL cost line' is inert until the account is chosen.
  - schema: ALTER production_sessions ADD corrected_net_quantity numeric distinct from defect_quantity.
- **#28** Sensorless energy = passport kVt × run-hours
  - DATA: The kVt power rating per machine (part of item 89 catalog); with passport_power_kvt NULL the energy = NULL × run-hours yields nothing.
  - schema: ALTER equipment ADD passport_power_kvt numeric (equipment has no power-rating column today).
- **#34** Gofra layer count compared vs WMS intake
  - DATA: Owner gofra-profile master-data (expected layer specs per profile) to compare against; without it there is no reference layer count for the WMS-intake check.
  - schema: ALTER production_sessions ADD layer_count/gofra columns + a WMS-intake comparison job.
- **#49** Akt 2-signature gate blocks WMS issue + MES session-start
  - DATA: Which two roles/positions are the required signers — the enforcement policy cannot default sensibly ('any two users' contradicts the vision).
  - schema: CREATE material_issue_akt + akt_signatures (akt_id, signer_user_id, role, signed_at); gate WMS material issue and MES session-start on two signatures.
- **#84** Norma in hourly + 12-hour dual base
  - DATA: Owner hourly + 12-hour production-rate values per station AND the ~30-machine catalog (item 89) the station_id references; empty rates make the norm table useless.
  - schema: CREATE station_production_rate (station_id, unit, hourly_rate, twelve_hour_rate, effective_date) distinct from material_norms.
- **#85** Norma unit-of-measure per station (m²/лист/штук/удар)
  - DATA: Owner mapping of which unit-of-measure applies to each machine/station, plus item 89 catalog; the unit list exists but the station→unit assignment is owner data.
  - schema: CREATE station_unit junction OR ALTER equipment ADD default_unit_id FK -> unit_of_measures (19 rows exist).
- **#92** One machine split across two departments (Флексо vs Упаковка)
  - DATA: Owner confirmation of which specific machines are shared across Флексо/Упаковка, plus item 89 catalog; the junction is empty until those machines are named.
  - schema: CREATE equipment_department_assignments junction (equipment currently has single work_center_id FK).
- **#94** One operator on several machines (share % / time)
  - DATA: The ~30-machine catalog (item 89) that machine_id must reference; with only 7 demo machines the multi-machine assignment cannot reflect the real floor. (Also flagged Q-34 redesign sign-off.)
  - schema: CREATE operator_machine_assignment (operator_id, machine_id, date, share_percent) — session-model redesign.
- **#95** Final packaging as separate stage/norma
  - DATA: The owner packaging-norm figure (rate/target for the packaging stage); the enum value is addable but the stage is useless without its norm value, and it depends on item 84's rate table.
  - schema: Add GsdStage enum value PACKAGING (now permitted) + a per-stage norm entry on the #84 norm table.
- **#97** Mold-not-ready downtime code (KB signal)
  - DATA: Owner must define the KB (konstruktor-byuro) signal destination — which role/channel receives the mold-not-ready alert; the downtime code works but the distinguishing 'KB signal' has nowhere to route.
  - schema: Additive seed mes_downtime_reasons code='DT-MOLD' + a repeat-occurrence counter store.
- **#100** 3-shift lunch waves (1/2/3) so machines never all stop
  - DATA: Owner wave-assignment rule (which machines/operators belong to lunch wave 1/2/3); also depends on item 89 machines and the A/B/C shift decision (item 111).
  - schema: CREATE lunch_wave_schedule (machine_id/shift_id -> wave).
- **#104** Operator × machine skill matrix
  - DATA: Owner-defined certification level per machine type per operator + the machine-type list (item 89); same family as #1.
  - schema: CREATE operator_machine_matrix (operator_id, machine_type, certified_at) distinct from course-based operator_certifications.
- **#115** Link paper zayavka (заявка) to MES consumption
  - DATA: Owner confirmation of the paper-requisition workflow — which module owns the paper zayavka (likely WMS/MM) and its fields; the ownership/workflow decision (Q-34) gates where the table lives.
  - schema: CREATE paper_request table (none exists) + a comparison job vs mes_material_consumption.
- **#123** Per-station brak% norming + over-threshold signal
  - DATA: Owner's acceptable brak% ceiling per station (the threshold values) + item 89 catalog; without a ceiling there is nothing to signal over.
  - schema: CREATE station_brak_threshold (station_id, max_brak_percent) + a session-close check.
- **#132** Approved unit-of-measure master-data (station × unit)
  - DATA: Owner unit-per-machine mapping + item 89 catalog; duplicate of #85 — resolve together.
  - schema: CREATE station_unit junction OR ALTER equipment ADD default_unit_id FK -> unit_of_measures (same as #85).
- **#11** Operator corrects qty; reason mandatory; deviation → WMS event
  - DATA: Populate material_norms (currently 0 rows) with the per-material consumption baseline AND owner approval of the MES→WMS norma-link design; 'og'ish' (deviation) has no baseline to compute until the norm source is filled.
  - schema: No new table (mes_material_consumption + material_norms exist); wire a norma-link + deviation event.
- **#45** AI camera detects 20-min stop but MES has no downtime → anomaly
  - DATA: The camera-based IoT stop-event data source itself (currently sparse/absent) — the cross-check is codeable but has no camera data to compare against.
  - schema: No schema change on MES side; cross-check job compares a camera stop-event feed against downtime_events.
- **#68** Time-based stopped-machine escalation (15→НО, 30→director)
  - DATA: Confirm the exact escalation thresholds (15/30 min?) and the precise recipient per tier (which user/role is НО, which is director); only these policy values are undefined.
  - schema: None — reuses mes-sos-escalation.cron.ts template + status_started_at (no schema change).
- **#81** Bring 'А смена План' shift-plan form to a screen
  - DATA: The exact fields and layout of the physical 'А смена План' Excel form (only referenced as 'Zavod 5-yil Excel'); the screen cannot be built without the form spec.
  - schema: None — mes_papka_orders table already exists (0 rows) to receive the form.
- **#89** Exact ~30-machine master-data
  - DATA: The complete accurate ~30-machine factory inventory (names, types, capacities, work centers); this is the single largest root blocker feeding #1/#28/#84/#85/#92/#94/#104/#123/#132.
  - schema: None — pure data entry into the existing equipment table (currently 7 demo rows).
- **#90** Tigel 1-10 as separate units
  - DATA: Confirmation of the Tigel 1-10 naming/count and their distinguishing type (oddiy vs тиснение); subset of item 89.
  - schema: None — data entry once item 89 list is supplied.
- **#111** Save shift with A/B/C letter-name
  - DATA: Owner decision whether to rename/replace MORNING/EVENING/NIGHT with A/B/C or add A/B/C alongside, plus confirm 12h duration (current rows are 9h); a seed/naming decision that blocks items 100/112.
  - schema: Update shift_types seed (rename or add A/B/C rows; current rows are MORNING/EVENING/NIGHT at 9h).

### 09-qc (14)
- **#31** GSD formulada har operatsiya turi og'irlikda (Pechat og'ir)
  - DATA: The numeric GSD weight per operation type (e.g. Pechat/printing weighted heavier). Defaulting to equal weights makes the weighted formula a no-op (== current plain average), so owner-supplied weight values are required; also needs item 25 live wiring.
  - schema: ALTER technology-card/operation master-data ADD COLUMN operation_weight numeric.
- **#9** Pre-production checklist qolip tayyor - Dizayn qolip reestri cross-check
  - DATA: Owner must define where mold/qolip readiness status is tracked (Design vs QC) and its readiness fields - no qolip reestri (mold registry) exists anywhere in Design or QC today, so the cross-check has no data source until owner specifies it.
  - schema: New qolip/mold-registry table (mold_id, order_id, status, ready_at) to cross-check against.
- **#10** Oziq-ovqat yaroqlilik bloki texkarta tayinlashda
  - DATA: The kimyoviy norma (chemical-safety) threshold rules per material category that define a makulatura->food-contact block. These are un-fabricatable owner master-data.
  - schema: New food-safety-rule table (material_category, chemical_norm, food_contact_allowed).
- **#14** COQ rework ish vaqti = MES fakt soat; farq entries'ga zarar
  - DATA: The GL debit/credit account pair mapping 'zavod zarari' (factory loss) for the rework-time variance. Owner must supply the account mapping; also chains on item 6 rework linkage.
  - schema: COQ GL-mapping config for the rework-time variance posting.
- **#17** Reklamatsiya SLA timer ish kunlari (bayram kalendar)
  - DATA: The factory's holiday/working-day (bayram) dates the SLA timer must exclude. Verified no dedicated holiday table exists (only shift/marketing/content calendars); owner must supply the holiday-calendar entries before business-day SLA can compute.
  - schema: CREATE TABLE holiday_calendar (date, name, is_working_day).
- **#27** Reklamatsiya Rad etildi - sifat boshlig'i vs direktor tasdiqi
  - DATA: The katta/strategik threshold value that routes rejection approval to the director instead of the quality-head. The approval step itself is RBAC-buildable; only the threshold is owner policy.
  - schema: Rejection-approval routing config + escalation-threshold field.
- **#33** OTK yo'q bo'lsa smena supervizori o'rinbosar inspeksiya
  - DATA: Which organizational role/position qualifies as 'smena supervizori' (shift supervisor) for the deputy-inspector fallback. Owner must name the role before RBAC fallback can resolve it.
  - schema: Deputy-inspector fallback role config (role_key for shift-supervisor).
- **#38** COQ rework material isrofi FIFO; entries 2 legs
  - DATA: The GL account pair mapping the 'material isrofi' (material waste) legs. Owner must supply the account mapping (duplicate GL concern of item 14; depends on item 6).
  - schema: COQ GL-mapping config for the material-waste FIFO 2-leg posting.
- **#49** Makulatura omborga qaytish; GL farq zavod zarari; FIFO qoldiq
  - DATA: The GL account pair mapping the makulatura-return 'zavod zarari' debit / 'tovar' credit. Owner must supply the account mapping.
  - schema: Makulatura-return kirim-event handler + GL-mapping config.
- **#59** Kafolat oynasi (14/7 kun) muddatdan keyin auto-rad
  - DATA: The exact warranty-window day-counts per product category. Doc cites 14/7 but owner must confirm the per-category mapping (which categories get which window, and any others).
  - schema: warranty_window_days field per product category + an auto-reject job.
- **#60** Mijoz maket tasdiqi (podpisnoy list) fayl+sana saqlanadi
  - DATA: Owner decision - does the customer maket sign-off record live in QC or in the Design module's order/proof record ('Dizaynda bo'lishi mumkin'). Placement must be decided before the table can be sited.
  - schema: Maket sign-off record (podpisnoy-list file + date) in the chosen owning module.
- **#65** Namuna nuqtalari (bosh+o'rta+oxir/har N-rulon)
  - DATA: The value of N (the per-Nth-roll sampling-point rule) and the sampling-point pattern. Doc explicitly flags owner must define N.
  - schema: Sampling-plan config (sampling points per roll: head/mid/end, plus the every-N-th-roll rule).
- **#75** Qaytgan mahsulot qabul maydonlari
  - DATA: Owner decision on which module owns the returned-goods intake (QC vs WMS vs POS). Ownership must be decided before the table/form can be designed.
  - schema: Returned-goods intake form/table in the chosen owning module.
- **#84** Retest (chegara zonasi 2 namuna, o'rtacha hal)
  - DATA: The boundary-zone width (how close to the threshold triggers a 2-sample retest). Owner data (duplicate of item 45).
  - schema: Retest config (boundary-zone width + 2-sample retest, average-decides logic).

### 10-wms (7)
- **8** Tasdiqlash matritsasi summaga qarab darajali (amount-tiered approval matrix)
  - DATA: Exact approval-amount thresholds per level (warehouse-head / purchasing-head / director). Recipient routing itself is unblocked (RBAC resolveUserIds exists), but the tier boundary amounts are un-fabricatable owner policy.
  - schema: CREATE TABLE approval_matrix (min_amount numeric, max_amount numeric, approver_role varchar, level int).
- **20** Muddati oshgan FG penya AI-bildirishnoma (overdue-FG penalty notification)
  - DATA: The FIN-062 overdue-FG penalty formula/rate (owner-set). The notification + sign-off flow is buildable once the rate is fixed; also chains on item 44's in-transit GL account.
  - schema: Add a penalty-rate config value + an overdue-FG detector + notification/sign-off hook (cross-module Finance).
- **25** Xavfli material saqlashdan oldin zona-tekshiruv (hazard-class zone check)
  - DATA: The hazard_class <-> hazard_zone compatibility mapping — which hazard classes may be stored in which zones. This rule is un-fabricatable owner input; the trigger/flag is built on top of it.
  - schema: ALTER material_cards ADD COLUMN hazard_class + a zone hazard-capability flag / DB CHECK-trigger. hazard_zones table already exists (hazard_type/hazard_level/risk_level present).
- **35** Zona to'lganlik gating 95%/100% import PO blok (zone-fullness gating)
  - DATA: The zone-capacity trigger spec: per-zone capacity VALUES, the capacity unit basis (weight vs volume vs slots), and confirmation of what % warns (cited 95%) vs hard-blocks (cited 100%). The unit basis + populated capacities are owner data.
  - schema: warehouse_zones.capacity column ALREADY exists; add fill-% gating in wms-overflow.service.ts + optional warn/block threshold config. wms-overflow.service.ts itself flags 'egasi spetsifikatsiyasi kerak'.
- **44** Yo'ldagi mol alohida GL (goods-in-transit)
  - DATA: The chart-of-accounts GL account code for 'Jo'natilgan tovar / goods-in-transit' (owner-supplied GL mapping). Also confirm the 72h->SD / 120h->Director escalation windows.
  - schema: Add in-transit GL posting logic + a status/timer tracking column; reversal can hook the existing DELIVERED status (item 83).
- **48** Reorder email RFQ + N kun timeout -> keyingi yetkazuvchi
  - DATA: The default supplier response-window N (business days) before auto-fallback to the next supplier. N directly controls a consequential automated supplier-switch and has no cited default, so it is owner policy.
  - schema: Add an RFQ record + timeout timer; SupplierRatingService (item 22) already exists to pick the next-ranked supplier.
- **104** Reorderda ko'p-beruvchi tender (multi-vendor tender at reorder)
  - DATA: The tender/RFQ workflow rules: how many vendors to solicit, the response deadline, and the auto-select vs manual-approve threshold amount. All three are owner-set policy decisions.
  - schema: CREATE TABLE tender/rfq workflow on top of the existing SupplierRatingService + supplier_price_tiers.

### 06-sd (14)
- **#4** FIFO unit_cost_snapshot frozen at confirm + inventory_variance GL
  - DATA: The chart-of-accounts GL account (pair) for inventory_variance — posting code cannot default an account without corrupting the ledger (the snapshot half is buildable, but the item bundles the GL posting)
  - schema: Add sales_order_items/sd_quotation_items.unit_cost_snapshot column + variance GL posting
- **#8** Stage-based cancellation penalty % + GL
  - DATA: The stage→penalty-% schedule (owner policy) AND the GL account for cancellation-penalty income
  - schema: CREATE TABLE order_cancellation_rules (stage→%) (verified absent) + penalty GL posting
- **#25** Notification fallback Telegram→SMS→email→manager
  - DATA: SMS provider credentials/sender account — the SMS leg of the fallback chain cannot function without it (not an AI credential, so not blocked, but un-fabricatable)
  - schema: Add notification_channel column/enum + fallback-order config (confirmed absent)
- **#31** EXTERNAL_OUT vehicle/pallet capacity check
  - DATA: The vehicle/pallet capacity master-data — each vehicle's weight/volume/pallet-slot capacity (no capacity master exists)
  - schema: CREATE vehicle_capacity reference (per-vehicle kg/volume/pallet-slots); vehicle_number is free text today
- **#45** Roll↔piece unit_conversion_rules
  - DATA: The conversion factors themselves (pieces-per-standard-roll / roll lengths; grammage for weight↔area) — the table has no function until populated with owner factors
  - schema: CREATE TABLE unit_conversion_rules (verified absent)
- **#52** Hard ~15 product-type list (FK)
  - DATA: The owner's ~15 product-type names/taxonomy — product_categories is empty and the business taxonomy cannot be fabricated
  - schema: ALTER sd_quotation_items.product_type → FK to product_categories (exists but verified 0 rows) + seed
- **#64** Discount-type list, each with % cap
  - DATA: The discount-type names and the % cap for each — the table's entire purpose is holding these owner-defined caps
  - schema: CREATE TABLE discount_types (type→cap%) (verified absent)
- **#116** Product catalog fit to ~15 categories (dup #52)
  - DATA: The ~15 product category names (same owner taxonomy as #52)
  - schema: Seed product_categories (verified 0 rows) + ALTER FK from sd_quotation_items.product_type
- **#149** Latok standard SKU catalog
  - DATA: The owner's standard latok SKU list/data — SKU codes, dimensions, prices; the catalog is empty and useless without it
  - schema: CREATE named-SKU catalog table
- **#157** Stage-based cancel penalty (dup of #89/#8)
  - DATA: Same as #8: the stage→penalty-% schedule + the penalty GL account
  - schema: CREATE TABLE order_cancellation_rules (stage→%) + GL — same schema as #8
- **#15** Pre-season 8-week cron, AI qty recommendation
  - DATA: Which product categories count as 'seasonal' (owner designation, on the still-empty product taxonomy) + the qty-recommendation basis
  - schema: Add product_categories.is_seasonal flag + seasonal-recommendation cron (8-week window is fixed)
- **#30** 1C number INN/phone match import service
  - DATA: The 1C export file format/spec + a sample export + the feed/integration access point — no data or integration surface exists to build against
  - schema: Add import staging table + INN/phone matcher (INN/phone columns exist on customers)
- **#56** MOQ + small-batch surcharge
  - DATA: MOQ minimums per product-type and the small-batch surcharge amount (owner pricing/policy; also chained on the unknown product taxonomy)
  - schema: Add per-product-type MOQ + surcharge config table (calculatePrice check)
- **#69** ABC tier → auto benefit-package
  - DATA: The A/B/C standard-package values: discount%, credit limit, and payment terms for each tier
  - schema: Add abc_benefit_packages table (abc_class → discount%/credit_limit/payment_terms) applied on abc_class change

### 07-pp (11)
- **27** Gofra profile mismatch (5 vs 3 qavat) auto-block
  - DATA: Flute-layer count per material card (which are 5-qavat vs 3-qavat) AND each machine's supported flute-profile capability — physical master-data only owner/technologist can supply; auto-block is impossible with empty values.
  - schema: ALTER TABLE material_cards ADD COLUMN flute_layers int; ALTER TABLE work_centers ADD COLUMN supported_flute_profiles
- **32** Machine color-capacity check (6 vs 4 rang) + queue
  - DATA: The color capacity (max_colors, e.g. 6 vs 4) for each printing machine — per-machine master-data across the machine list; NULL yields no capacity check, so the feature is inert until supplied.
  - schema: ALTER TABLE work_centers ADD COLUMN max_colors int NULL
- **36** Estimated-price fallback + FIN delta on tech-card approval
  - DATA: The owner-defined price-estimation algorithm/basis for the fallback estimate (algorithm-type still undefined, same open item as #92); without it neither the estimated price nor its FIN delta can be computed.
  - schema: ADD is_estimated_price boolean on SD quote/order + FIN-delta write path
- **63** Norm varies by material/color/lamination combination
  - DATA: The actual norm value for each material/color/lamination combination — technologist/owner master-data; an empty lookup is useless.
  - schema: CREATE TABLE pp_norm_variations (material_id, color, lamination, norm_value) lookup
- **69** Machine format/size limit check
  - DATA: Each machine's max width/length/format limits — per-machine master-data; NULL yields no format check.
  - schema: ALTER TABLE work_centers ADD COLUMN max_width numeric, max_length numeric, max_format varchar
- **119** Finishing type (laminate/varnish/UV) + norm table
  - DATA: The owner finishing-type taxonomy (which laminate/varnish/UV types exist) plus the per-m2 norm for each — both owner-supplied.
  - schema: CREATE TABLE pp_finishing_types (code, name, per_m2_norm)
- **120** Packaging type 10+ variants each with norm
  - DATA: The owner list of 10+ packaging variants and the norm for each.
  - schema: CREATE TABLE pp_packaging_types (code, name, norm)
- **18** Small-order warning ack + manager approval + audit
  - DATA: The minimum tiraj (order-quantity) threshold that triggers the small-order/low-margin warning (same open value as #102).
  - schema: CREATE TABLE pp_small_order_acks (production_order_id, user_id, acknowledged_at, manager_approval, audit cols) + small-order threshold config
- **92** Algorithm-type (2-8 bo'lim) auto-classification
  - DATA: The tier boundaries: which distinct operation/department-group counts map to which complexity tier (2-8 bo'lim).
  - schema: ALTER TABLE production_orders ADD COLUMN algorithm_type + a tier-boundary lookup/config
- **102** Min tiraj -> small-order + margin warning to sales
  - DATA: The minimum-tiraj threshold value per product and the low-margin warning rule (chegara egasi-data).
  - schema: ADD products.min_tiraj (per product) + low-margin warning threshold config
- **115** Code dictionary master (KT/PT/E/GL)
  - DATA: The semantic definition of the KT/PT/E/GL code prefixes — owner must define what each prefix means before the lookup table can be designed.
  - schema: CREATE TABLE pp_code_dictionary (code_prefix, meaning, ...)

### 20-cc (24)
- **#78** Amount-conditional approval matrix
  - DATA: The full amount-band → required-approver-level tier table. '≤500ming→boshliq' is only a partial example ('...'); owner must supply every band and its approver level.
  - schema: ALTER cc_documents ADD COLUMN amount; ALTER cc_workflow_steps ADD threshold columns
- **#84** Communication-type tag per template (5 types)
  - DATA: The exact 5 communication-type values (owner comms taxonomy) + which of the 17 templates maps to which type.
  - schema: ALTER cc_document_templates ADD COLUMN communication_type varchar + 5-value check
- **#90** Field-level RBAC storage / ai_answers restructure
  - DATA: Owner-defined field×role editing mapping per template (which role may edit which field). Listed in BOTH Schema and Decision groups; same blocker.
  - schema: Decompose ai_answers JSONB into per-field {field,value,ownerRole} tagged structure
- **#7** Night-shift rejection → 'ziddiyatli ijro' record
  - DATA: The exact 'tungi smena' time window (start/end hours) AND which MES/production signal marks execution as already-started.
  - schema: ADD conflicted_execution marker (column/record); reversal disabled
- **#27** Concurrent edit: optimistic lock + field-RBAC
  - DATA: Field×role editing mapping (which department/role may edit which fields). Lock half buildable, but full item gated on the RBAC mapping.
  - schema: ADD version column to cc_documents (optimistic-lock half is pure code: AND version=<expected> + 409)
- **#28** 'Ma'lumot talabi' template
  - DATA: Exact 'Ma'lumot talabi' template format/fields (deadline + mandatory-response) — owner document content.
  - schema: None for state (workflow_state confirmed varchar → waiting_info needs no enum migration)
- **#29** Raw-material request 2h-SLA template
  - DATA: Owner-approved raw-material request template text/fields.
  - schema: None (inbox_sla_hours=2 already supported as integer)
- **#41** Pre-approval AI analysis (phase-2)
  - DATA: Owner confirmation the phase-2 '100 approved documents' trigger is reached + approval of AI approval-analysis rollout/cost.
  - schema: None (reuse existing cc-ai-interview AI infra)
- **#44** Position-tier archive retention
  - DATA: The actual retention-years-per-position-tier table (rahbar 10y / ishchi 3y are only vision examples, not confirmed exhaustive).
  - schema: Set cc_document_templates.archive_after_days (NULL for all 17 today)
- **#49** GL posting on CC approval
  - DATA: Owner ruling resolving the vision conflict (auto-post to GL vs stay manual like ADVANCE/FINANCIAL_AID); if auto, the GL account-pair mapping.
  - schema: GL trigger with reference_document=ZVS number
- **#72** Pre-approval AI analysis (moslik/risk, phase-2)
  - DATA: Duplicate of #41: owner confirmation phase-2 trigger reached + AI rollout/cost approval.
  - schema: None (reuse existing AI infra)
- **#85** 6 mandatory-written document types
  - DATA: The exact 6 mandatory-written document types (тех карта/reja/sifat + 3 others). Seed cannot be built until owner specifies.
  - schema: Seed cc_document_templates mandatory-written flag
- **#88** Analytics doc via Совершенствование (dept 5)
  - DATA: Which org department is 'Совершенствование'/id 5 in the current schema + the analytics document's exact format.
  - schema: Restrict analytics doc origin to dept id 5
- **#91** Role-bound question fields per template
  - DATA: Owner-defined role×question mapping per template (which role may answer which AiQuestion, e.g. technical field only by texnolog).
  - schema: Per-question ownerRole tag (ties to #90 restructure)
- **#92** 'Ma'lumot talabi' template (dup)
  - DATA: Duplicate of #28: exact 'Ma'lumot talabi' template format/fields.
  - schema: Same as #28
- **#93** 'Reja o'zgartirish' (PLAN_CHANGE) template
  - DATA: Owner-approved exact wording/format for PLAN_CHANGE — root blocker for items 22/94/95/113/115.
  - schema: Seed PLAN_CHANGE template (initiator/reason/result 3 fields)
- **#96** Per-shift 'smena yakuni xulosasi' doc
  - DATA: Shift-end-summary template content/questions (cron wiring is code, but template content needs owner).
  - schema: Recurring-doc config (spawnRecurringDocuments is a live no-op today)
- **#97** 'Tungi smena qarori' doc
  - DATA: Template content + escalation-to-next-day-manager timing rule.
  - schema: Seed NIGHT_SHIFT_DECISION template
- **#103** Тех karta 'Лаборатория→Одобрена' signature step
  - DATA: Owner-approved lab-approval position/role (POSITION:LAB_HEAD?) + 'Одобрена' step/checklist criteria.
  - schema: Add lab-approval step to тех karta template
- **#106** 'Смена хом-ашё заявкаси' 2h-SLA (dup)
  - DATA: Duplicate of #29: owner-approved raw-material request template text/fields.
  - schema: Same as #29
- **#107** 'Режа қоғози' roll-doc → buxgalteriya auto-transfer
  - DATA: Exact 'fakt-vazn' (actual-weight) capture workflow + which Finance/Ombor entity receives the auto-transfer.
  - schema: Auto-transfer on approval
- **#118** ОТК→СОЗ QUALITY_WARNING short-SLA (QC↔CC)
  - DATA: Owner-approved ОТК→СОЗ QUALITY_WARNING workflow definition + the short SLA value in minutes.
  - schema: ADD inbox_sla_minutes (current inbox_sla_hours integer can't express minute granularity)
- **#127** 'Orgpolitika' 4-section template
  - DATA: Exact 4-section 'Orgpolitika' template structure/format — root blocker for items 13/99/100/111.
  - schema: Seed Orgpolitika template
- **#129** 'Smena biriktirish' (machine+operator) doc
  - DATA: The equipment/machine master-data list (deferred ~30-machine equipment area) + which KPI formula consumes this assignment.
  - schema: Seed SHIFT_ASSIGNMENT template (machine_id + operator_user_id)

### 04-coordination (11)
- **##22** HR prikaz effective-date cron (00:05), holiday-aware
  - DATA: The authoritative Uzbekistan working-day/holiday calendar: the source decision (manual UZ holiday list vs external calendar) AND the actual holiday/working-day date values, including factory-specific working Saturdays. No holiday-calendar data exists anywhere in the repo.
  - schema: New holiday_calendar table (calendar_date, name, is_working_day)
- **##36** Holiday-aware cron reschedule (sana o'zgardi notice)
  - DATA: Same as #22 — the source and values of Uzbekistan holiday dates (shared working-day-calendar). Useless until the owner supplies the actual dates.
  - schema: Shares the holiday_calendar table from #22
- **##74** Podpisnoy list gate (blocks ИЧП/production)
  - DATA: Which roles/documents constitute a valid podpisnoy (the required-signer composition) that must be complete before ИЧП/production unlocks. Factory-specific sign-off policy — cannot be fabricated.
  - schema: New podpisnoy_lists table + gate in update-design-status.handler.ts
- **##77** Chiqindi to'ldi yopiq tsikl (signal->topshiriq->tasdiq)
  - DATA: The 'full' fill-level threshold value per waste-container type. Item states the path exists and only the owner threshold is missing.
  - schema: ALTER waste-container-type ADD COLUMN full_threshold (or a per-type threshold config); waste_records + rasporyazhenie-creation path already exist
- **##89** Harakatsiz topshiriq signal (X soat harakatsiz)
  - DATA: The 'X hours' inactivity threshold for the last-touched escalation. Item states no new schema is needed — only the owner threshold value blocks it.
  - schema: None — rasporyazhenie.updated_at already exists as the last-touched timestamp (optional escalation-config row)
- **##90** Xato bo'lim rahbari KPI (brak/rework -> rahbar KPI)
  - DATA: The brak-attribution rule — operator's manager vs the department that produced the defect vs the QC reviewer's manager. Owner policy decision; a manager-based rollup also depends on org manager data being populated.
  - schema: ALTER qc_braks ADD COLUMN responsible_manager_id/responsible_department_id + KPI rollup (duplicate of #104)
- **##98** Energiya tejash karta KPI (suv/gaz/svet)
  - DATA: The energy-saving target/threshold values per karta type for water/gas/electricity. Item states the target values are owner master-data.
  - schema: Uses existing kpi_definitions/kpi_values pattern (seed target rows per karta type) + IoT sensor feed
- **##103** Plan-fakt og'ish real-vaqt signal
  - DATA: The plan-fact deviation threshold percentage(s) per operation/order type above which the signal fires.
  - schema: New deviation-threshold config (per operation/order type); signal fires against MES quantity-recording writes
- **##105** Real norma-bajarilish % past signal (uchastka)
  - DATA: The 'low' norm-fulfillment % threshold per uchastka below which the operational signal fires.
  - schema: Per-uchastka low-threshold config column/table
- **##108** Yo'nalish turi bo'lim-marshrut avto (ofs-kar/ofs-gof/flx-gof)
  - DATA: The canonical route-type list (ofs-kar/ofs-gof/flx-gof/...) and each type's ordered department chain — business master-data for the auto-routing lookup.
  - schema: New route_types table + route_type->department-chain mapping/seed for mes_operations route-type classification (duplicate of #78)
- **##112** Smena tayyorlik cheklisti gate
  - DATA: The shift-readiness checklist item list per shift/work-center type. Item states the checklist content is owner master-data.
  - schema: New shift_readiness_checklist table (items per shift/work-center type); downtime_events (the gated action) already exists

### 13-crm (19)
- **21** ГП 3-signature electronic waybill (PIN F5)
  - DATA: The PIN/e-signature mechanism spec (how a PIN is captured & verified as a signature) — explicitly owner-gated; plus the module-scope decision (SD vs CRM, see #96).
  - schema: New waybill table with 3 PIN-signature slots (warehouseman/driver/manager) + 'yuk chiqdi' gate
- **119** Advance flag+% gate before PP
  - DATA: The minimum-advance % threshold that unblocks PP handoff (owner policy value). 70% is a candidate from the existing order->dept fan-out rule but is unconfirmed for the CRM deal->PP gate.
  - schema: ADD advance_percent + advance_paid flag on deal + PP-handoff gate-state
- **7** Debt cache 5min TTL + SD real-time gate
  - DATA: The block policy — block on ANY open debt vs only above a credit limit — and whether the debt figure is sourced from Finance or the existing SD openDebt computation. Caching infra is buildable; the policy is undefined.
  - schema: Debt-cache table/TTL + deal/order block gate-state (+ possible credit_limit column)
- **24** Other-customer search field-RBAC + audit
  - DATA: The customer-ownership model (assigned_to user vs karta binding) and which fields a non-owning user may see (name+type only?). Confirmed sd_customers has no assigned_to/owner/card column.
  - schema: Customer-ownership column (assigned_to user FK or card binding) + field-visibility config
- **26** Dizayn/STP day-limit escalation (E5)
  - DATA: The Dizayn/STP day-limit threshold (number of days) before escalating to the Dizayn head + seller. Routing is buildable; only the threshold is missing.
  - schema: Escalation config (day-limit threshold) reusing the existing role-based targetRole routing
- **27** Paper-application profile prefill + snapshot
  - DATA: The factory paper-profile ('zavod-spets') field set — owner/Dizayn must define the fields before the table can be finalized. Same blocker as #91.
  - schema: New crm_paper_profiles table (fields TBD by owner) + per-deal snapshot
- **42** Structured manager notes + AI onboarding
  - DATA: The category taxonomy (enum values) for 'menejer fikri/hohishi' — needed before the category column can be created.
  - schema: New crm_manager_notes table + category enum column
- **46** Mas'ul operator/usta PP recommendation
  - DATA: The rule for which operator/usta 'belongs' to which customer — explicitly owner-open (QISM C #85 'vision OCHIQ'). Same as #135.
  - schema: customer↔operator mapping table
- **52** Who defines funnel stages (factory process)
  - DATA: The actual factory-process stage names (e.g. Namuna->STP->Narx->Shartnoma) to seed. Owner-data only.
  - schema: Seed crm_stages (table + settings CRUD already exist; confirmed empty, 0 rows)
- **78** Phone-call recording to card
  - DATA: The telephony/ATS provider choice (webhook format + recording storage) plus integration credentials — provider choice gates the table + ingest design.
  - schema: call-log table + ingest (design depends on provider)
- **89** Папка№ order-folder on card
  - DATA: The folder numbering convention — format and scope (per-order vs per-customer) — an owner process decision that determines the schema.
  - schema: folder_number column/table (format TBD)
- **91** Customer paper profile save+prefill
  - DATA: The paper form's exact field set (owner/Dizayn) — same undefined-schema blocker as #27.
  - schema: Same crm_paper_profiles table (fields TBD)
- **96** ГП delivery 3-signature electronic form
  - DATA: Ownership/scope decision — does the 3-signature waybill belong to the SD module (EP-SD-138) or CRM — plus the PIN/e-signature mechanism from #21.
  - schema: Waybill table shared with #21
- **101** Design/size approval as a funnel stage
  - DATA: The pipeline stage taxonomy including the design/size-approval stage and its owner-set time-limit. Same root as #52 (empty crm_stages).
  - schema: Seed crm_stages incl. a design/size-approval stage + time-limit column
- **107** Paper-price change → reprice task
  - DATA: The trigger % threshold AND the raw-material price-feed source (Ta'minot/procurement) — both flagged 'egasidan' in the vision.
  - schema: Price-change trigger + reprice-task table
- **116** Mass-export block + permission + log
  - DATA: The bulk row-count that triggers the block AND the approval workflow. Log/permission is buildable; threshold + approval policy is owner.
  - schema: Export-log + permission + block gate-state (audit infra reusable)
- **117** Contact-view field-level limit
  - DATA: The field-visibility policy — which fields (phone/email/price) are masked for which roles. Related to #24.
  - schema: role→field mask config table
- **129** STP/format version history
  - DATA: The versioning model — what constitutes a new version vs a revision (owner/Dizayn). Model not defined anywhere.
  - schema: Version-chain columns on the STP/format record
- **135** Customer↔responsible operator/usta history
  - DATA: The rule for which operator 'belongs' to which customer (owner/PP, 'Reja-qoidasi egasidan'). Same as #46.
  - schema: customer↔operator history table

### 14-marketing (13)
- **#14-15** Loyalty tier discount (new orders only)
  - DATA: Annual-volume thresholds per tier AND discount % per tier (+ confirm 'applies to new orders only'). These are revenue-affecting financial policy that cannot be sensibly defaulted/fabricated; empty tiers grant no discount so the feature is inert until owner supplies them.
  - schema: New loyalty_tiers + loyalty_tier_rules tables
- **#14-26** Referral bonus to CRM card + separate Finance expense
  - DATA: Referral-bonus amount/rule AND the GL expense account the referral bonus posts to (no referrer column exists; HR employee_referrals is a different domain). The referrer column alone is buildable, but the Finance/GL posting side is gated.
  - schema: ALTER lead/customer ADD referrer column + new Finance referral-bonus expense-line model
- **#14-76** Customer 'wallet share' upsell recommendation
  - DATA: Each customer's external/total spend (the share-of-wallet denominator) which the ERP cannot derive internally — the estimator is useless without this owner-supplied external value.
  - schema: New wallet_share/upsell recommendation table
- **#14-86** Loyalty tier auto-discount by annual volume (dup of #15)
  - DATA: Discount % and annual-volume thresholds per tier (owner policy) — same gate as #14-15.
  - schema: Same loyalty_tiers + loyalty_tier_rules tables — build once
- **#14-95** Lead 'who referred' + referral chain + bonus (dup of #26)
  - DATA: Referral bonus rule/amount + GL expense account — same gate as #14-26. The chain column itself is buildable; the bonus engine + Finance posting is the gated part.
  - schema: ALTER leads ADD referrer_lead_id/chain column (buildable) + bonus-rule engine
- **#14-9** 'Advertising expense' GL sub-code
  - DATA: Which GL sub-code the owner approves for 'reklama xarajati' — only the combined account 9200 'Sotuv xarajatlari (logistika, marketing)' exists; this is an owner-approved chart-of-accounts addition.
  - schema: Additive CoA seed: new GL account (child under 9200 or a new parent)
- **#14-24** Owner '5 numbers' Director dashboard widget
  - DATA: The exact 5 metrics the owner wants displayed ('qaysi 5 — egasidan') — picking them ourselves fabricates owner preference.
  - schema: Optional director_widget_config seed/table
- **#14-28** 'Idle-period promo' dual-approval Kanban, 48h
  - DATA: The machine-utilization % threshold that defines 'bo'sh quvvat/idle' (gates the auto-trigger) AND the two approver roles/persons on the dual-approval card.
  - schema: New idle-capacity promo config + dual-approval Kanban card
- **#14-69** Lead AR payment-discipline badge (AR debt)
  - DATA: Exact overdue-days threshold + display rules for the 'to'lov kechikmoqda' badge (decision:656). openDebt data is available; only the threshold/display policy is missing.
  - schema: Uses the #14-32 flag column; add threshold/display config
- **#14-71** Funnel stages 'Namuna->tasdiqda->Tasdiqlandi (podpisnoy)'
  - DATA: The exact B2B funnel stage names + order to seed (decision:670) — owner vocabulary; the example order in the item still needs owner confirmation before seeding.
  - schema: Additive seed rows into crm_lead_stages
- **#14-88** Idle production capacity -> 'idle-period promo' (dup of #28)
  - DATA: Same as #14-28: idle-capacity utilization threshold + the two approvers (decision:789).
  - schema: Same idle-capacity config + dual-approval card — build once
- **#14-94** Owner exact 5 numbers + 'needs attention' widget (dup of #24)
  - DATA: The exact 5 metrics for the owner widget (decision:831, 'qaysi 5 — egasidan') — same gate as #14-24.
  - schema: Same director_widget_config — build once
- **#14-96** Requisite gate (STIR/contract/address) before SD hand-off
  - DATA: Which requisite fields (STIR/shartnoma/manzil/...) are mandatory before SD hand-off — an owner finance/legal-compliance decision that cannot be fabricated.
  - schema: Required-field gate config on the lead->SD hand-off

### 15-kanban (18)
- **##92** Process template -> НО-1/РД-4/ТХ auto-assign
  - DATA: The exact НО-role code list (НО-1/РД-4/ТХ...) and which karta/position/person holds each role — un-fabricatable owner mapping; also depends on karta model #108.
  - schema: CREATE TABLE kanban_process_roles (id, role_code, holder_user_id NULL, holder_card_id NULL)
- **##93** Norm-time per task type (30/20 min)
  - DATA: The norm-minute value for every task type. Over-norm alerting is useless with an empty norms table; owner must supply the minute standards.
  - schema: CREATE TABLE kanban_task_type_norms (id, task_type, norm_minutes int)
- **#A4** HR handover auto-confirm to substitute
  - DATA: Authoritative o'rinbosar (substitute) source and the actual who-substitutes-whom mapping — no substitute master-data exists today and LeaveApprovedEvent carries no substitute field.
  - schema: substitutes master OR leave_requests.substitute_user_id (designable)
- **#A23** Telegram-close checklist BLOK + file safety
  - DATA: Inbound Telegram bot token + webhook URL/scope, plus a virus-scan vendor choice (e.g. ClamAV). The checklist-complete close-guard alone is buildable, but the Telegram close command needs the credential.
  - schema: reuses existing checklist tables for the close-guard
- **#A26** Order-cancel production->scrap GL
  - DATA: The GL account code for production->scrap on cancel, and the QC+FIN co-sign approvers (GL account mapping + Finance SoD).
  - schema: scrap-journal writer + QC/FIN co-sign flags
- **#A40** '3 business days' = shift + holiday calc
  - DATA: The bayram/holiday calendar dates, plus confirmation of which shift_* table is canonical for business-day math (shift tables exist, no holiday master).
  - schema: CREATE TABLE holidays (id, date, name) — verified none exists
- **#A50** All cron on BullMQ (persistent) + offline drain
  - DATA: Owner approval to add the BullMQ dependency and a provisioned Redis instance/connection — infra resource that cannot be defaulted.
  - schema: none (queue infra)
- **#C11** 24h business-hours-only escalation
  - DATA: Designation of the canonical shift-calendar table among the ~10 shift_* tables, plus real shift working-hours data for the escalation math.
  - schema: none new (reads a shift table)
- **#C55** Telegram open/close/comment ERP sync
  - DATA: Inbound Telegram bot token/webhook provisioning (command syntax/UX we design). Duplicate of ##85.
  - schema: none new (kanban_cards has telegram_message_id/telegram_chat_id)
- **#C56** Daily 17:30 НО-3 day-close task
  - DATA: The НО-3 daily-close checklist/template content and the target board/column — specific procedure only the owner can supply. Duplicate of ##86.
  - schema: kanban_templates row (table exists) + recurring cron (exists)
- **#C60** Vacation approval requires substitute
  - DATA: The substitute (o'rinbosar) data source — none exists today; owner must confirm where the substitute field lives and who substitutes whom. Duplicate of ##90; related A4.
  - schema: substitute field on the vacation-approval flow
- **#C68** Board columns = real tech stages
  - DATA: The canonical technological-stage list and order (Флексо/Высечка/...) per production board/line; current live columns are test garbage. Duplicate of ##98.
  - schema: replace kanban_columns test rows with real stage rows
- **##85** Telegram create/close ERP sync
  - DATA: Inbound Telegram bot token/webhook provisioning (confirm command syntax/confirmation UX). Duplicate of C55.
  - schema: none new
- **##86** Daily 17:30 НО-3 day-close
  - DATA: Exact НО-3 checklist/template content + target board/column. Duplicate of C56.
  - schema: kanban_templates row (exists)
- **##90** Vacation blocks until delegate chosen
  - DATA: The substitute/delegate data source — none exists; owner must confirm the vacation-approval block and where the delegate value comes from. Duplicate of C60.
  - schema: substitute/delegate field on the vacation flow
- **##98** Board columns = real stages (Флексо/Высечка)
  - DATA: Canonical production-stage list/order per product line. Duplicate of C68.
  - schema: replace test-junk columns in kanban_columns
- **##107** 'Corporate numbering' (НО-2) process template
  - DATA: The exact НО-2 corporate-numbering process steps/checklist to seed as a template row.
  - schema: kanban_templates row (exists)
- **##135** ТХ safety-briefing recurring task
  - DATA: The ТХ safety-briefing instruction content and its required recurrence interval (recurring-cron infra already exists).
  - schema: reuses existing recurrence columns (recurrence_pattern/interval on kanban_cards)

### 16-iot (25)
- **#33** FSM jam threshold (dynamic/manual)
  - DATA: No FSM jam sensor exists (sensor_devices=0 / iot_sensors=0), so there is no telemetry stream to compare a threshold against; additionally texnolog must supply the actual jam threshold value per FSM machine. Gated on #107 sensor rollout + texnolog threshold.
  - schema: ALTER equipment ADD COLUMN jam_threshold_manual numeric NULL
- **#52** Per-machine norm/hour + norm/12h
  - DATA: Actual per-machine (~30 machines) hourly/12h production norm figures from texnolog. No sensible default exists (norms differ ~10x by machine); only work_centers.norma_kg/m2_per_shift (work-center, shift-level) exists today, so defaulting produces garbage OEE.
  - schema: ALTER equipment ADD COLUMN norma_per_hour numeric, norma_per_12h numeric
- **#54** Unit of measure per machine
  - DATA: Owner/texnolog mapping of which unit each machine measures output in (sheets/m2/kg/pieces). equipment.type is all NULL so it cannot be derived, and no single default is correct across machine types.
  - schema: ALTER production_sessions ADD COLUMN uom varchar (ref unit_of_measures) OR equipment.default_uom
- **#56** 1M-stroke TO reminder on molds
  - DATA: A stroke-count data source: the physical stroke sensor (Item 55, part of #107 rollout) OR an owner decision to derive strokes from production output. Threshold (1M) is known and ow_molds exists, but the reminder never fires without a stroke source.
  - schema: ALTER ow_molds ADD COLUMN stroke_count bigint DEFAULT 0, resource_remaining bigint
- **#74** Per-machine-type brak threshold
  - DATA: Owner-supplied brak % limit per machine type. Existing work_centers.brak_limit_pct is NULL and there is no sensible default, so alerting stays inert until the owner sets the policy values.
  - schema: New brak_threshold_by_machine_type config (new table, or ADD threshold column on equipment/work_centers)
- **#75** Auto vs manual lamination efficiency
  - DATA: Owner mapping of which lamination machines are auto vs manual, plus the CAPEX efficiency criteria/thresholds that drive the auto-vs-manual recommendation.
  - schema: ALTER equipment ADD COLUMN lamination_mode enum('auto','manual')
- **#85** Autopunch karton vs gofra split
  - DATA: Owner-supplied per-mode (karton vs gofra) die-cutting norm values; the mode split is meaningless without the two norm figures.
  - schema: ALTER equipment ADD COLUMN diecut_mode field + norma_karton, norma_gofra columns
- **#123** Standard TO-work catalog (master-data)
  - DATA: Owner/texnolog-supplied standard maintenance procedures and their frequencies per machine type; the catalog is empty master-data with nothing to seed until supplied.
  - schema: CREATE TABLE standard_maintenance_catalog (id, machine_type, work_description, frequency_interval, ...) separate from mes_maintenance_tasks (0 rows, task-log)
- **#4** Retro OEE/GSD calibration-error fix
  - DATA: Owner must define the mandatory 2nd-signature approver (role) and the retroactive OEE-correction approval workflow; also depends on physical sensor calibration existing (ai_calibration_runs=0).
  - schema: Optional oee_correction_log (period, old_value, new_value, corrected_by, second_signer, reason)
- **#6** Papka half-done: mold-change vs stop
  - DATA: Owner decision on the decision UX: who is prompted (production boss?), which options are shown, and confirmation that no auto-stop fires.
  - schema: Possibly a decision/downtime-reason field; primarily a product decision
- **#17** Sex energy kVt-h coefficient split (ROOT)
  - DATA: Owner CAPEX approval to physically install per-machine energy/kVt meters (EP-IOT-018). No per-machine energy data exists until then. Root blocker for 27/87/136/124-126.
  - schema: None new to design; endpoint stays an honest 501 until data exists
- **#22** Ideal-state photo upload/archive (RD)
  - DATA: Owner assigns the RD role that uploads ideal-state images, approves the AI-camera install, and supplies the actual reference images; without them the comparison is empty. Also depends on AI-camera infra.
  - schema: Upload/archive table for ideal_rasm_targets (currently 0 rows) - designable
- **#24** Meeting-room camera in IoT scope
  - DATA: Owner approval to physically install the meeting-room camera + confirmation of director/admin-only access policy + the 1-year retention policy value.
  - schema: Camera-config + retention-policy fields - designable
- **#26** Historical Excel import (partial+error report)
  - DATA: The actual historical Excel files and their exact template/column format; the parser/importer cannot be written against an unknown schema.
  - schema: Optional import-staging table
- **#30** Telemetry retention/downsampling
  - DATA: Owner-confirmed exact raw-retention window (vision says 3-6mo -> a specific value) and whether daily averages are kept in-place or in a rollup. Destructive op, so must not guess (mes_telemetry=876 rows, no retention cron).
  - schema: Optional telemetry_rollup_daily table + retention/downsample cron
- **#32** Legal delay excluded from OEE
  - DATA: Owner-defined list of which downtime reasons count as legal/excused and confirmation of the OEE-exclusion policy. The OEE query currently joins no downtime reasons at all.
  - schema: ALTER mes_downtime_reasons ADD COLUMN is_excused boolean DEFAULT false (distinct from is_planned)
- **#35** Brak material 30-day loss to GL
  - DATA: Exact GL account pair (debit/credit) for the 30-day unresolved-defect-material write-off. waste_records=0; the posting cannot be wired without the account mapping.
  - schema: Write-off posting/flag on waste_records + GL posting
- **#39** UV/lak consumption formula (interim)
  - DATA: Owner/texnolog-supplied per-sheet UV/lak coefficient values (varaq x koeff); the interim computed-field formula produces nothing without the coefficients.
  - schema: Computed field / coefficient config column
- **#40** Late material request -> operator-caused wait
  - DATA: Owner-defined threshold: how late a material request must be relative to shift start to classify the wait as operator-caused ('operatorga bogliq').
  - schema: Downtime classification flag/field on the wait record
- **#59** Kolib tayyor emas stop reason + owner
  - DATA: Owner-confirmed responsible-party (mas'ul) rule for the mold-not-ready stop (who is held accountable). The accountability rule is the un-fabricatable part; the reason-code wording alone is insufficient. Not among the 16 existing codes.
  - schema: Additive seed mes_downtime_reasons row DT-MOLD-NOTREADY + responsible_party field
- **#67** Lamination film consumption/waste
  - DATA: Owner decision: manual-entry (tablet form) vs waiting for a film-consumption sensor, plus the consumption/waste tracking rule.
  - schema: Manual-entry tablet-form fields or sensor-fed columns
- **#73** Brak% threshold alert (screen+Telegram)
  - DATA: Per-work_center brak_limit_pct threshold values (currently NULL) + Telegram bot/channel config. On-screen notifications + discipline_records path already works; only owner thresholds and Telegram remain.
  - schema: None (work_centers.brak_limit_pct already exists, currently NULL); mechanism exists in checkBrakLimit (iot-tablet.controller.ts:821)
- **#107** Sensor rollout plan (ROOT CAPEX)
  - DATA: Owner selection of 3-5 priority machines (Gofra/KBA/FSM) + CAPEX approval for physical sensor purchase/install. Root blocker for 5/9/18/45/55/65/78/83/84/91/99 and more.
  - schema: None (sensor_devices/iot_sensors tables exist, both 0 rows)
- **#117** Camera-AI inspection criteria (5-7 master)
  - DATA: Owner-defined exact 5-7 inspection criteria (tozalik/himoya/yo'lak/tartib/xavfsizlik) AND camera-AI infrastructure (camera install + AI vision/credentials) to evaluate them.
  - schema: inspection_criteria master table (id, criterion, weight) - designable
- **#134** Telegram IoT alerts (ShVB bot)
  - DATA: Owner-defined list of which event types are 'muhim' + Telegram bot token/channel config. anomaly-detected.handler.ts has no Telegram call today and cannot dispatch without the credentials + event selection.
  - schema: Optional alert-dispatch config table

### 12-lms (10)
- **20** Reglament matritsa (karta+razryad+dept)
  - DATA: The actual (card, razryad, dept) → required-reglament mapping rows — owner master-data. The table/lookup does nothing until the owner populates the matrix.
  - schema: NEW reglament_matrix keyed (card_id, razryad, dept_id) + reglament_matrix_history versioning table
- **13** Ko'p uchraydigan QC/MES xatolar → qayta-o'qish
  - DATA: The defect→LMS-topic taxonomy — owner must define which QC/MES defect signals map to which training topics. No mapping table exists.
  - schema: NEW defect_topic_map (defect_code → course_id/topic)
- **30** Yuridik minimal SHA-256 imzo + IP sertifikatda
  - DATA: The exact legal-minimal field set / legal-validity requirements a signed certificate must carry — owner/legal must specify (the code comment itself flags this owner-gated).
  - schema: ALTER certificates ADD signature_sha256 text, signed_ip inet + legal-field columns
- **44** Qisqartirilgan test 30-50% (AI tanlaydi)
  - DATA: The shortening percentage value (30-50%) HR must configure — owner master-data. The AI-selection variant additionally needs an AI provider key (that part is blocked); the % variant is data-gated.
  - schema: ALTER lms_tests/test-config ADD shortened_percent smallint + shortening config
- **46** Yangi gofra turi → MaterialAdded → LMS mavzu
  - DATA: The material-type → LMS-topic mapping taxonomy — owner-defined; no mapping table exists. Also depends on the material-catalog MaterialAdded event being emitted.
  - schema: NEW material_topic_map (material_type → course_id/topic)
- **55** 7 departament tuzilmasi umumiy kursi
  - DATA: The actual owner-authored training content for the 7-department (Vysotskiy) orientation course — this course row does not exist among the 5 seeded.
  - schema: Seed a course row (+ modules/lessons) in existing courses table
- **57** Murabbiy o'zi malakali ekanini tekshirish
  - DATA: The minimum razryad/cert threshold that qualifies someone to mentor — owner master-data (doc: 'malaka-tekshiruv OCHIQ').
  - schema: NEW mentor_qualification config (min_razryad smallint, required_cert) or column on positions
- **73** ORGPOLITIKA siyosat testga bog'lash
  - DATA: Owner must author/upload the ORGPOLITIKA policy documents and create the policy test first — lms_tests is currently 0 rows. Mechanism reuses the existing mandatory-test pattern.
  - schema: Reuse existing lms_tests + storage module; link policy-doc → test
- **74** Tijorat siri/maxfiylik moduli + yozma tasdiq (NDA)
  - DATA: The NDA/confidentiality legal text/content — owner/legal artifact must be supplied before there is anything to acknowledge.
  - schema: NEW nda_acknowledgements reusing is_mandatory/cert pattern (employee_id, nda_version, signed_at)
- **82** Imtihon natijasi murabbiy reytingiga ta'sir
  - DATA: The owner-defined weighting formula governing how much one exam result moves a mentor's rating (doc: 'reyting<->natija bog'lash OCHIQ').
  - schema: ALTER mentor_ratings / NEW rating-config ADD exam_weight numeric

### 18-notifications (19)
- **#19** Per-status SLA (kanban_column_sla)
  - DATA: The per-status/per-column SLA threshold_minutes values (owner policy). No universal default exists — the SLA-breach cron is inert until the owner supplies each column's allowed time.
  - schema: CREATE TABLE kanban_column_sla(column_name, threshold_minutes, module_code) — confirmed null
- **#57** Owner-set alert thresholds
  - DATA: The per-module metric threshold values (owner policy per metric). Consumer is inert with no rows and there is no sensible universal default per metric.
  - schema: CREATE TABLE alert_thresholds(module_code, metric, threshold, config) — confirmed null
- **#5** Inline ACK 2× resend → escalation
  - DATA: The resend interval + final escalation timeout, AND the escalation-target chain (walks up the org manager hierarchy, currently manager_id NULL/blocked) — cannot fabricate who receives the escalated message.
  - schema: Reuse alert_thresholds / notification config columns
- **#16** Dept-dependency workflow_rules + 10+ throttle
  - DATA: The actual department-dependency rows (which dept depends on which — org-structural knowledge) plus the throttle rate for 10+ recipients.
  - schema: workflow_rules table already exists (0 rows, verified)
- **#30** Top-3/past-3 personal vs group ranking
  - DATA: The ranking KPI/metric that defines the top-3 / past-3 split — no ranking code or metric is defined anywhere.
  - schema: CREATE leaderboard ranking view/table
- **#36** Dynamic shift-schedule table
  - DATA: The canonical shift-time master data (shift start/end windows) — factory-specific with no sensible default.
  - schema: CREATE TABLE mes_shift_schedules (does not exist — to_regclass null, verified)
- **#42** TT completeness required fields (24h escalation)
  - DATA: Which TT fields are 'required' to define completeness before the 24h escalation fires (owner business rule).
  - schema: Reuse existing TT (texnik topshiriq) table + TtValidationService
- **#62** Digest leaderboard top-3/past-3
  - DATA: The ranking KPI for the digest leaderboard (same gap as #30 — no metric defined).
  - schema: Leaderboard view over KPI source
- **#81** 6 mandatory formal message categories
  - DATA: The exact six message categories that must be formalized into a numbered ERP record (owner-defined taxonomy).
- **#89** Customer-problem auto-route to sales manager
  - DATA: Which QC field/value marks a defect as customer-caused vs technical, for routing to the sales manager (owner mapping).
  - schema: ALTER qc_defects ADD cause_type (or reuse existing field)
- **#91** 'Temporary halt' broadcast to chain
  - DATA: The broadcast recipient scope (who the halt is announced to) — an org-scope decision. The recording table is designable, but the scope is owner input.
  - schema: CREATE TABLE halt_decisions(...)
- **#92** New orgpolicy (НО-3) announce & track
  - DATA: The НО-3 orgpolicy source table/records — owner-authored orgpolicy artifacts (like ORGPOLITIKA), not yet an identified live table.
- **#94** НО-3 end-of-day report reminder
  - DATA: Where the НО-3 end-of-day report is filed (source table/definition) so the cron can check whether it was submitted.
- **#100** 'Late reporting' deficiency weight
  - DATA: The KPI weight/threshold that defines 'late reporting' for the business.constants entry (owner policy; no sensible default).
  - schema: business.constants entry
- **#106** Verbal-plan 'not formal' warning
  - DATA: The owner's definition of what counts as a 'formal' written plan record (the absence of which triggers the warning).
- **#108** Совершенствование analytics channel
  - DATA: The target Telegram chat_id for the dedicated Совершенствование improvement-analytics channel (a specific un-fabricatable identifier).
- **#115** Dept-level rolled-up report
  - DATA: Which metric(s) roll up in the vertical (dept-level) aggregation — ЦКП / KPI / production. ЦКП source (ckp_fact_values) exists, but the metric selection is an owner decision.
- **#118** Monthly responsibility-analysis digest
  - DATA: Which table stores the qaror→masъul→natija triples the monthly digest aggregates (source-table decision; candidates responsibility_transfers/coordination rasporyazhenie are not confirmed canonical, and 'natija'/outcome tracking is not clearly present).
  - schema: Aggregation over a decision→responsible→result triples source
- **#132** Resend unread priority messages
  - DATA: The resend interval (N min) + escalation threshold for unread high/urgent messages, AND escalation-target routing via the org manager chain (blocked/NULL). Duplicate of #5.

### 05-director (24)
- **26** Bayram/smena kunlar outlier -> grafikda kulrang
  - DATA: The actual holiday / non-working / shift-anomaly dates for the year — an empty calendar greys out nothing, so the owner's real date list is required.
  - schema: CREATE TABLE holiday_calendar (date, kind, is_anomaly boolean) consumed by getStatTrends
- **83** '1-4 продукт' kartaga to'ldirilsin
  - DATA: The 1-4 products assigned to each org_functions card — per-card master data only the owner has.
  - schema: ALTER TABLE org_functions ADD COLUMN product_1..product_4 text (or products jsonb) (table exists)
- **91** 'Ko'p uchraydigan xatolar' AI risk-reyestriga
  - DATA: Owner decision on the data source (which error records/fields feed the registry) + the AI aggregation rubric; the column is inert without that source definition even before AI runs.
  - schema: ALTER TABLE org_functions ADD COLUMN risk_registry jsonb (table exists)
- **93** 'Javobgarliklari' (moddiy/ma'naviy) saqlansin
  - DATA: The material/moral responsibility text authored per card — content only the owner can write.
  - schema: ALTER TABLE org_functions ADD COLUMN responsibility jsonb/text (table exists)
- **97** 'Nazorat varaqasi' har karta o'quv-ob'ekt
  - DATA: The control-sheet content structure/taxonomy AND per-card sheet content; an empty control sheet has no value.
  - schema: CREATE TABLE control_sheet (id, card_id FK org_functions, items jsonb) (table absent - confirmed)
- **101** 'Malaka talablari' kartaga + AI nomzod baho
  - DATA: The qualification requirements per card + the AI candidate-scoring rubric — both owner-supplied.
  - schema: ALTER TABLE org_functions ADD COLUMN qualification_requirements jsonb (table exists)
- **102** 'Lavozim vositalari' (A-System/hisobot/tex-karta) kartaga
  - DATA: The tool-list taxonomy the owner defines + the per-card tool assignments.
  - schema: ALTER TABLE org_functions ADD COLUMN tools jsonb/array (table exists)
- **109** Operatsiya turlari norma (avtoklev/GTO/kley/rezka 13 tur)
  - DATA: The 13 norm values themselves (avtoklev/GTO/kley/rezka ...) — pure master data, explicitly owner-supplied.
  - schema: CREATE TABLE operation_norm (operation_type, norm_value, unit) seeded with 13 operation-type rows (table absent - confirmed)
- **24** PP oy-boshidan kesim kanonik; MES kunlik fakt -> oylik kvota (EP-DIR-036)
  - DATA: Owner must pick the canonical MTD source: PP production_orders vs MES mes_production_sessions (two-world reconciliation decision the agent cannot fabricate).
  - schema: Reconciliation view / config flag over the chosen source (no new base table)
- **27** Setup >30% -> AI 'format optimizatsiya' tavsiya, 3x->eskalatsiya
  - DATA: The format-optimization recommendation rules/examples the AI should emit; thresholds (30% / 3x) are already given, only the recommendation content is missing.
  - schema: None new (setup_seconds already captured); optional recommendation-log table
- **35** Energiya IoT bo'lsa avto, bo'lmasa qo'lda + moliya tasdiq
  - DATA: Owner strategy decision: adopt manual-entry + finance-approval permanently, or procure physical energy IoT sensors (none installed) — un-fabricatable direction.
  - schema: energy_readings table (source enum manual/iot) + finance_approval status
- **38** 5S: QC/IoT kamera -> AI -> sifat rahbar tasdiq -> dashboard
  - DATA: Procurement of physical 5S cameras (none installed) + AI-vision vendor/model choice + confirmation of the quality-lead approval workflow.
  - schema: fivees_inspections table (camera_ref, ai_result, quality_lead_approval status)
- **40** Bir buyurtma ko'p yo'nalish -> ASOSIY yo'nalishga to'liq
  - DATA: The print-direction (yo'nalish) taxonomy values and which one is 'asosiy' (main) — attribution logic is meaningless without the owner's taxonomy.
  - schema: ALTER TABLE sales_orders ADD COLUMN yonalish/direction (enum or FK to a directions table) — confirmed no direction column exists (only division/distribution_channel)
- **43** Yangi versiya -> o'zgargan bo'limga 'tanishdim' imzo + diff
  - DATA: Owner definition of what constitutes a document 'section' for diff-based re-acknowledgement (granularity that decides who re-signs).
  - schema: CREATE TABLE instruction_versions + section_acknowledgements (org_functions.last_reviewed_at exists but no diff/versioning)
- **47** Chiqindi qayta-ishlash % <-> Moliya 'makulatura kirim' -> GL
  - DATA: The canonical GL table (gl_entries vs gl_journal_entries) AND the debit/credit account pair for makulatura-kirim postings; waste_records/targets are also empty (GL account mapping cannot be fabricated).
  - schema: Monthly waste-recycling variance posting into the canonical GL table + account-mapping seed
- **89** A-System bilan ERP bog'lanishi (to'liq almashtirish?)
  - DATA: Owner must choose the A-System migration strategy — full replace vs parallel-run vs one-way import — before any integration schema/code exists.
  - schema: Deferred until strategy chosen (e.g. a_system_import staging table only if one-way import is picked)
- **90** '1 sutkalik ishlab-chiqarish rejasi' 24-soatlik ob'ekt
  - DATA: Owner must confirm exactly which fields belong on the formal 24-hour daily_plan object vs the existing getPlanFact daily cut.
  - schema: CREATE TABLE daily_plan (table absent - confirmed) with the owner-confirmed field set
- **92** 'Muvaffaqiyatli harakatlar' ideal-model + AI baho
  - DATA: Owner definition of what 'muvaffaqiyatli harakat' (successful action) means per card/role (the ideal-model) before any AI scoring is meaningful.
  - schema: successful_action_model table linked per card/role + score column
- **107** 'Den/Noch' (kunduz/tun smena) statistika
  - DATA: The exact day/night shift-boundary hours (e.g. day 08:00-20:00) — owner-set policy; a wrong boundary mislabels every session.
  - schema: shift_boundary config (or query constants) over mes_production_sessions.started_at (shift_id/started_at already present)
- **111** Bandlik.xlsx pragon (min/soat/kun yuklama) CRP
  - DATA: The original Bandlik.xlsx source data + loading formula (min/soat/kun) to replicate the CRP calculation exactly, plus the per-work-center efficiency_rate values.
  - schema: crp_loading table + work_centers.efficiency_rate backfill (efficiency_rate gap noted)
- **115** Kichik buyurtmalar tahlili (kichiklashish%/dona-kg foyda)
  - DATA: The 'small order' size threshold (business policy value) defining which orders count as small.
  - schema: None new (order-costing module already joins per-unit profit); optional threshold in business.constants
- **116** 'Razmer eski->yangi' format-opt AI tavsiya
  - DATA: Historical size-optimization rules/examples for the formatOptimization() recommendation — owner-supplied source content.
  - schema: None new (formatOptimization() exists in strategic-agent.service.ts); optional rules table
- **126** Xato 'tushunmaslik/e'tiborsizlik/qoidabuzarlik' AI tasnif+o'quv
  - DATA: Labeled training examples for the 3-way error classifier, OR owner sign-off on a rule-based (non-AI) substitute rubric.
  - schema: error_classification column/table (3-way enum: understanding/negligence/violation)
- **134** 'Algoritm turi' (2-8 bo'lim) murakkablik + vaqt prognozi
  - DATA: The '2-8 bo'lim' complexity-tier taxonomy and the associated time estimates per tier — owner-defined values.
  - schema: ADD COLUMN algorithm_type + CREATE TABLE complexity_tier (tiers 2-8, time_estimate)

### 19-pos (6)
- **24** Boshlang'ich qoldiq: opening balance GL direktor tasdig'i
  - DATA: (1) The actual opening-balance dataset — per-material opening stock quantities/values to load; and (2) the GL debit/credit ACCOUNT PAIR for opening-balance postings (calculateEntries currently has no case and would post zero-GL). Neither can be fabricated.
  - schema: New MovementTypeCode enum value OPENING_BALANCE + pos_movement_types seed row + a GL debit/credit case in auto-gl-posting.service.calculateEntries; director-approval reuses PosMovementStatusService
- **14** Reja%/kechikish/og'ish KPI hr_kpi_snapshots'ga, HR kartaga
  - DATA: The exact 3-indicator GSD/KPI weighting + normalization formula combining reja% (plan attainment), kechikish (lateness) and og'ish (deviation) — EP-POS-056 is OCHIQ (open) and the formula is specified nowhere in code, so it cannot be fabricated (Q-40). Also chained on the HR card-GSD write path existing.
  - schema: None new — hr_kpi_snapshots exists; cron/write is mechanical
- **79** Karta-model integratsiya (omborchi GSD)
  - DATA: Same as #14: the exact 3-indicator GSD formula (reja%/kechikish/og'ish weights, EP-POS-056 OCHIQ) plus the HR card-GSD write path. Un-fabricatable owner formula.
  - schema: None new — same write target as #14
- **106** Omborchi GSD 3-ko'rsatkich avto
  - DATA: Same as #14/#79: the exact 3-indicator formula (reja%/kechikish/og'ish) is owner data (EP-POS-056 OCHIQ). Cannot be fabricated.
  - schema: None new — same write target as #14/#79
- **26** Kredit-limit real-time, EXTERNAL_OUT blok, qisman to'lov ruxsati
  - DATA: (1) The AUTHORITATIVE source of a customer's outstanding balance to compare against credit_limit (which AR ledger/field is canonical); and (2) the partial-payment allowance POLICY — block the EXTERNAL_OUT outright vs allow a partial issue. Both are owner policy/semantics decisions.
  - schema: Optional: derive/add an outstanding_balance source (sd_customers.credit_limit already exists numeric; no outstanding/current_balance column exists)
- **94** Norma-fakt farqi (ortiqcha sarf) ogoh
  - DATA: (1) The over-norm TOLERANCE % (vision says only 'oshsa'/if-exceeded; a bare 'exceeds average' would flag ~half of all issues, so a tolerance is required to be meaningful); and (2) the AUTHORITATIVE norm SOURCE — pp_routing_operations standard norms (vision #30) vs the built MaterialNormsService AI-average over material_norms (0 rows). Which is canonical is an owner design decision.
  - schema: None new — INTERNAL_ISSUE path in pos-movement.service already has a variance-gate + notes column

### 11-mm (13)
- **##6** Sabab kategoriyadan + ixtiyoriy matn, BE Zod
  - DATA: The enumerated list of reject/cancel reason categories (owner's own taxonomy). The category dropdown is empty and useless without it; free-text alone doesn't meet the categorized-reason requirement.
  - schema: ALTER reject/cancel target table ADD reason_category column + enum type
- **##14** Toplanner vs makulator kross-tekshiruv
  - DATA: The paper-class taxonomy (which classes distinguish topliner vs makulator). The cross-check has nothing to compare against until owner defines the classes.
  - schema: ALTER material_cards ADD paper_class attribute column (+enum)
- **##37** Rohler/poddon equipment_assets'da, yaroqsiz->GL
  - DATA: Owner decision on WHICH module owns Aktivlar (assets: WMS vs new MM/org table) AND the GL write-off account for scrapped (yaroqsiz) assets. Both un-fabricatable.
  - schema: CREATE TABLE equipment_assets (+ disposal->GL write-off posting)
- **##40** Yoqilg'i talon mashina bo'yicha, +10%/+20% cron
  - DATA: Per-machine fuel-norm baseline values (the norma) and the machine list. The +10%/+20% overage cron has no baseline to compare against; the +10/+20 thresholds themselves are given but the norms are not.
  - schema: CREATE fuel-coupon-balance ledger + ALTER ADD fuel_norma column (per machine)
- **##43** Yangi vendor 3 sinov partiya + PO summa cheklovi
  - DATA: The trial-PO monetary sum cap (max amount per trial PO). 3-batch count is given, but the PO cap amount is an owner threshold and un-fabricatable.
  - schema: ALTER mm_vendors status enum ADD 'trial' + trial_batch_count column
- **#11.2** Yetkazuvchi turi 6 oldindan belgilangan turdan
  - DATA: The 6 predefined vendor-type values (owner's taxonomy). The enum cannot be created without the value list.
  - schema: ALTER mm_vendors ADD vendor_type enum (6 values)
- **#11.55** Rulon namligi chegaradan oshsa avto karantin + claim
  - DATA: The moisture threshold value (max %) above which auto-quarantine+claim fires. Also depends on #11.54 lab-gate. Without the threshold the auto-quarantine can't trigger.
  - schema: ALTER material_cards ADD moisture column + moisture_threshold
- **#11.57** Toplayner x mestny qog'oz sinfi kross-tekshiruv
  - DATA: The paper-class taxonomy (topliner vs mestny/local paper classes) - owner taxonomy, same gap as ##14.
  - schema: Same paper_class column on material_cards as ##14
- **##16** Muddati o'tgan lak/kley/bo'yoq avto karantin, GL zararga
  - DATA: Which material categories count as lak/kley/bo'yoq (owner tagging) AND the GL account that receives the expiry write-off (zararga). Neither is fabricatable.
  - schema: ADD category-to-quarantine tag/mapping (shelf_life_days already exists) + GL write-off posting
- **##17** Xavfli kimyo zonasi alohida RBAC + IoT anomaliya event
  - DATA: Which specific warehouse(s)/zone(s) are the hazardous-chemical zone, and which roles receive the warehouse:hazardous:write permission. RBAC mechanism exists; blocker is owner designation+role grant.
  - schema: ADD hazardous-zone designation + new warehouse:hazardous:write permission (hazard_class column already exists)
- **##26** Shoshilinch PO direktor Telegram webhook 'ha'
  - DATA: The director's Telegram bot token + chat-id (un-fabricatable credential). The urgent-PO approval webhook is dead without it.
  - schema: Config store for director Telegram webhook (bot token + chat_id) - no table strictly required
- **##36** Makulatura INTERNAL_TRANSFER + sotuv CoA alohida
  - DATA: The exact CoA revenue account code that should receive makulatura-resale revenue.
  - schema: Map makulatura-resale revenue to a CoA account (INTERNAL_TRANSFER type + makulatura warehouse already exist)
- **##46** 'Narx tejovi' KPI = byudjet vs fakt narx, oylik
  - DATA: The exact 'Narx tejovi' KPI formula weighting (byudjet vs fakt narx) and the default period (oy/chorak/yil). Formula is not specified anywhere in code.
  - schema: ADD price-saving KPI snapshot column/row (budget vs actual price)

### 01-org (6)
- **#39** Uch smenali dastgoh: karta smena IoT filtri (shift_id)
  - DATA: The shift-schedule master-data: the actual shift definitions (shift names + start/end times) AND which of the ~30 machines run 3 shifts (machine/card-to-shift assignments). The IoT-per-shift filter is useless until these owner-supplied shift rows and machine mappings exist.
  - schema: CREATE TABLE org_shift_schedules (shift master: id, name, start/end) + ALTER org_departments ADD COLUMN shift_id FK (confirmed absent, only work_schedule text exists); emit ShiftScheduleChangedEvent.
- **#37** 'Unvon' PDF + приказ format + immutable arxiv
  - DATA: The official приказ (order) document legal format/wording — an un-fabricatable legal template the owner must provide before the PDF template can be generated.
  - schema: New immutable приказ-archive table (card_id, unvon, приказ PDF/blob, issued_at, immutable flag); depends on the #118 unvon column.
- **#67** Shablonlar boshlang'ich to'plami (10-15 lavozim)
  - DATA: The 10-15 factory-position card-template definitions themselves (position name + its fields/ЦКП per template). Only the seed content is missing; the mechanism is fully built.
  - schema: None — card_templates table + apply-template code already exist and work (confirmed live); additive seed rows only.
- **#75** Kartalarni ommaviy import Excel
  - DATA: The Excel column -> CardInput field mapping (which spreadsheet headers map to which card fields). The import tool cannot be built until the owner specifies this un-fabricatable mapping.
  - schema: None new — a /org-structure/cards/import endpoint using the existing node-import partial-commit pattern as template.
- **#98** 'Muvaffaqiyatli harakatlar' AI ijobiy mezoni
  - DATA: The taxonomy of what counts as a 'successful action' per card-type. Not an AI-credential blocker — the scorer has nothing to evaluate against until the owner defines this taxonomy.
  - schema: Add a success_actions field to the AiFitService report shape (optionally a success_criteria lookup table keyed by card-type).
- **#117** Оргполитикalar 'СЕРИЯ' kartalarga biriktirish
  - DATA: The org-policy 'seriya' taxonomy — which policy series exist. Binding table is generic CRUD but has nothing to bind until the owner defines the policy-series list.
  - schema: CREATE TABLE card_policy_bindings (policy_series_id, card_id) — a generic policy-to-card binding table.

### 02-hr (2)
- **#52** Operation-types master catalog (lak/kley/rezka)
  - DATA: The actual operation-type catalog rows from owner/technolog: names + codes (lak/lamination, kley/glue, rezka/cutting, etc.) and any per-operation params. Un-fabricatable production master-data.
  - schema: None — mes_operations table already exists (confirmed 0 rows). Pure seed/data-entry, no code work.
- **#58** Contract types + 30-day-before-expiry alert
  - DATA: Real employment_contracts rows — contract_type + end_date per employee (owner/HR data entry). The alert cron is code-ready but meaningless until contract data exists.
  - schema: None — employment_contracts already exists with contract_type + end_date columns (confirmed 0 rows). Only additive code: a 30-day HR-alert cron on existing schema.

### 03-finance (18)
- **#5** Bank/bayram kuni keyingi ish kuniga suriladi (DB kalendar)
  - DATA: The actual UZ public/bank-holiday date list to seed. Next-business-day roll handles only weekends until owner supplies the holiday dates.
  - schema: CREATE TABLE holidays / business_calendar (calendar_date date PK, name text, is_working_day bool). VERIFIED both to_regclass = NULL.
- **#25** Gilza 90 kun qaytmasa loss akti, depozit→zarar GL
  - DATA: Per-gilza deposit value, confirmation of the 90-day non-return threshold, and the deposit→loss (zarar) GL account pair.
  - schema: CREATE TABLE gilza_deposits (customer_id, qty, deposit_value, issued_at, returned_at, status) + loss-act generation. VERIFIED to_regclass = NULL. Duplicate of #92.
- **#29** Sort (1/2/3) minimal narx chegarasi, pastga tushsa blok
  - DATA: The floor-price value for each sort grade (1/2/3). Auto-block on drop-below is codeable but meaningless without the numbers.
  - schema: CREATE TABLE min_price_by_sort (sort_grade, product/category ref, min_price, currency). VERIFIED to_regclass = NULL. Related #118 (the block/approve policy side of #118 is SoD → blocked; this data table is buildable).
- **#88** Schyot-faktura vazn farqi→yetkazuvchiga da'vo
  - DATA: The weight-difference tolerance threshold that triggers a claim + the claims-receivable GL account.
  - schema: CREATE TABLE claims_receivable (source, supplier_id, invoice_id, amount, reason, status, gl_account, created_at). VERIFIED to_regclass = NULL. ThreeWayMatchFailedEvent already fires (real) — add a listener to insert. Same table as #48.
- **#92** Гильза qaytariladigan tara depoziti alohida sub-ledger
  - DATA: Deposit value per gilza, the 90-day return window, and the returnable-deposit GL account (sub-ledger).
  - schema: CREATE TABLE gilza_deposits returnable-deposit sub-ledger. VERIFIED to_regclass = NULL. Duplicate of #25.
- **#100** Xarajat kategoriyalari master-ro'yxati
  - DATA: The actual expense-category taxonomy values (owner/finance-defined category list).
  - schema: CREATE TABLE expense_categories (code, name, parent_id, gl_account). VERIFIED none exists (accounts=42 is COA, cost_centers=1 — neither is an expense taxonomy).
- **#3** ZVS byudjet qoldig'i pessimistik lock bilan bloklanadi
  - DATA: Owner/Finance must seed department/card budget figures (all 3 tables = 0 rows). Lock is meaningless with no budget balance. Same gate as #C17/#C18/#69.
  - schema: No schema change — budgets/budget_lines/budget_controls tables exist; SELECT...FOR UPDATE reservation code is trivial.
- **#17** Kassa oylik+soliqqa yetsa xom-ashyo ZNO 'Kuting', ustuvorlik ro'yxati
  - DATA: The reserved-for-oylik/soliq 'yetadi' threshold definition + the exact ZNO priority-list ordering rule. Related #130.
  - schema: Add a hold-state/priority field on zno (table exists, 0 rows).
- **#18** Penya avto-hisob (kun×stavka), egasi tasdig'idan 'da'vo receivable'
  - DATA: The daily payment-penalty rate (stavka) and which AR aging bucket triggers it. Duplicate of #112.
  - schema: Reuse claims_receivable (#88) + penalty calc over AR aging.
- **#69** Byudjet davri haftalik + oylik/yillik jamlanma (rollup)
  - DATA: Owner must seed budget figures (0 rows) before any rollup is meaningful. Same data gate as #3/#C17.
  - schema: budgets/budget_lines exist; add period grain if needed; week→month→year rollup query is trivial.
- **#83** Reja qog'ozi ombor kirim/chiqimdan avto buxgalteriyaga
  - DATA: Owner must define the 'reja qog'ozi' document format/fields (which columns, which warehouse in/out events feed it) before the table can be built. EP-FIN-033.
  - schema: New reja_qogozi document table — fields cannot be designed until format defined. Generic approval_request_steps infra already exists to sign it.
- **#84** Kamomad (berilgan−ishlatilgan−qaytgan)×narx=zarar
  - DATA: The tolerance threshold separating 'kamomad' (shortage) from acceptable variance.
  - schema: GL engine (#72) real + consumption tracking (#85) partial; add kamomad calc + loss posting.
- **#94** Клей moddalari (сода/крахмал/бура) sarf-norma
  - DATA: The actual glue consumption-norm values (soda/starch/borax ratios) — EP-FIN-044 master data.
  - schema: Store norms in existing norm/master-data table; variance-analysis.service.ts engine is reusable/real.
- **#101** Energiya (elektr/gaz/suv) stanok-soatiga taqsim
  - DATA: The energy-bill→machine-hour allocation rate/formula (owner/engineering) PLUS IoT machine-hour data and the machine list.
  - schema: cost_center_id already on entries (pass-through); add allocation-rate config + machine-hour join. Same infra as #24.
- **#112** Пеня/jarima kechikkan to'lovga (kun×stavka) avto
  - DATA: The daily late-payment penalty rate / contract basis (EP-FIN-062). Duplicate of #18.
  - schema: Reuse penalty calc + claims_receivable; pattern mirrors HR extended-payroll penalty.
- **#130** ЗНО navbati/ustuvorligi (ish-haqi>soliq>xom-ashyo)
  - DATA: Owner must confirm the exact priority order + tie-breaking rules (EP-FIN-080). Related #17.
  - schema: zno table exists (0 rows); add priority/rank field; cash-limit awareness (#122) real.
- **#C17** Byudjet bo'lim/karta bo'yicha rejalashtiriladi
  - DATA: Owner/Finance must provide dept/card-level budget figures (budgets/budget_lines/budget_controls = 0 rows). Pure data-population, no engineering blocker.
  - schema: No schema change — tables (and per doc, FE) already exist.
- **#C18** ZVS so'rovi byudjetga avto-taqqoslanadi
  - DATA: Owner must seed budget data first (C17); budget_controls/budgets = 0 rows. Same gate as #3.
  - schema: No schema change — budget-remaining check inside createZvsWithValidation is trivial code.

---

## C. Blocked modullar / itemlar (52)

Schema-approval bularni OCHMAYDI — Org struktura/`head_user_id`, HR razryad/oylik, Finance SoD, AI kredensial, bilingual/Cyrillic. Alohida owner-qaror kerak.

### 09-qc (1)
- **#21** CAPA auto -> Sovershenstvovanie Kanban Yangi; bo'lim rahbari kartasi; 3 rollover->direktor — Belongs to a blocked area: the 'bo'lim rahbari' (dept-head) Kanban card assignee resolution depends on Org structural head_user_id / manager routing, which is a blocked module. Kanban card-create + escalation-cron infra already exist, but the dept-head routing cannot resolve until Org head_user_id is unblocked; additionally the target 'Sovershenstvovanie' board/column IDs are unconfirmed (owner data).

### 07-pp (1)
- **22** Urgent order overrides scheduled PM/repair window — Owner explicitly deferred the USKUNA-360 equipment master-data area. equipment_maintenance table + roles already exist, but the owner/director-only PM-override endpoint is out of scope until the owner scopes/starts that equipment phase — this is a deferred-phase go/no-go decision, not a schema-only unblock nor fabricatable data.

### 20-cc (1)
- **#2** I.o. (acting officer) dual-address audit — Blocked Org structural model: 'i.o.'/delegation must first be defined in org_functions (delegation vs temp position override vs new flag) before audit columns can be designed. Org structure is a blocked module.

### 04-coordination (1)
- **##95** Dizayn<->konstruktor handoff (o'lcham/begovka/vysechka) — Requires an owner Org-structural decision — whether 'konstruktor' is a new distinct role/karta or an existing designer sub-permission — before the handoff-confirmation stage can be inserted into the real DesignStatus state machine. Role/karta definition is Org-structural (blocked module), owner-gated.

### 13-crm (1)
- **44** Corporate-channel bypass mitigation (НО-2) — Pure owner/legal decision — an HR employment-contract bypass-prohibition clause + Inspeksiya policy wording. The vision itself states full technical prevention is impossible, so there is no buildable mechanism; belongs to the HR-contract/legal domain, not CRM code.

### 14-marketing (2)
- **#14-35** Social-media statistics webhook real-time sync — Requires the owner to choose the social-media provider(s) AND supply their external API credentials (social_api_configs = 0 rows). External-credential gate — same class as the AI-credentials blocked category; nothing functions until credentials are provisioned.
- **#14-61** ERP replaces Bitrix24 (EP-MKT-083) — Owner strategic go/no-go decision — the Bitrix24->ERP migration plan and timing must be approved before any export/import bridge is built (owner-data, OCHIQ). Not a schema-buildable feature and no single data value to supply; it is a plan-approval gate.

### 15-kanban (1)
- **#A21** Escalation to CEO immutable record — The kanban_task_escalations CREATE TABLE is buildable, but the item's core — routing an escalation up to the CEO — requires Org head_user_id, which is in the blocked Org-structural module, plus an owner Telegram chat-id. Blocked on head_user_id (+ Telegram chat-id) until the Org module is unblocked.

### 12-lms (4)
- **22** Kaizen bonus (Act) + ko'p-karta atribut — Schema (ALTER kaizen_suggestions ADD bonus_amount + card_id FK) is additive, but the feature writes into payroll (HR salary — blocked module) and needs an owner-defined bonus-formula. Belongs to the blocked salary/payroll domain.
- **18** Simulyatsiya AI xavfli qaror — AI simulation engine needs an AI provider key (blocked AI-credentials) and its scope is from-scratch owner-defined ('ko'lam OCHIQ').
- **58** Murabbiy bo'lmaganda zaxira tartib — Reserve-mentor fallback relies on the org manager chain (blocked Org structural / head_user_id) plus an owner-defined fallback priority rule ('fallback qoidasi OCHIQ').
- **78** Ishdagi vaziyat interaktiv simulyatsiya (dup #18) — Duplicate of #18 — from-scratch simulation engine needs an AI provider key (blocked AI-credentials) plus owner-defined scope/priority.

### 18-notifications (1)
- **#90** RD-2/RD-4/RD-5 3-party meeting — Maps the RD-2/RD-4/RD-5 codes to specific org roles in the Vysotskiy hierarchy — an org-structural role/head-chain mapping that belongs to the blocked Org-structure module (head_user_id/manager_id currently NULL). Cannot be resolved without the org structural data.

### 05-director (1)
- **84** Оргсхема joylashuv 5-Deprt/13-bo'lim/Sektsiya 3 maydon — Belongs to the blocked Org-structural area: the exact 5-Department/13-section Vysotskiy-7 numbering scheme is owner-defined org-structure data (a derived view over department_id needs no new column, but the numbering scheme itself is frozen Org-module owner input).

### 19-pos (2)
- **41** pos_movements/items yillik partitioning, 3y+ arxiv, UNION fetch — NOT covered by the additive schema grant. Converting the live pos_movements / pos_movement_lines (currently plain relkind='r' tables) to PARTITION BY RANGE(created_at) and migrating rows into pos_movements_archive (which already exists) is a structural, data-moving live-table rewrite — not a new CREATE TABLE / ADD COLUMN / enum value / additive seed. The doc itself flags it as explicitly Q-35 owner-gated; it needs a separate risky-migration sign-off, not the general additive approval. No owner data involved.
- **96** A-System bilan bog'liqlik (almashtir/parallel) — Blocked on an unresolved owner STRATEGIC decision — the entire A-System migration direction (full replace vs parallel-run vs one-way import), 'A-System taqdiri'. Schema is not even designable until the direction is chosen, so this fails the dataGated 'schema is designable' test. The marker itself says n/a until the migration/parallel-run decision is made; no code work is possible.

### 01-org (18)
- **#7** I.o. ЦКП alohida agregatlanadi (acting vs substantive) — Structural org: is_acting on ckp_fact_values (confirmed absent) tags acting-vs-substantive assignment, which is derived from the org card-assignment/acting model that this blocked module owns — depends on unresolved acting-in-position (head_user_id) structure.
- **#19** Vakant karta ЦКП 'qo'shimcha yuk' teg (is_extra_load) — Structural org: is_extra_load (confirmed absent) distinguishes own vs inherited-from-vacant-child achievement, which depends on the vacant-card inheritance mechanism (#136, itself undecided) plus a separate i.o. ustama % owner input.
- **#34** Mentor-karta scoped-read RBAC grant + auto-revoke cron — New card-scoped row-level RBAC access-grant primitive (mentor_access_grants keyed by card_id) — access-provisioning (SoD-adjacent) and card-structural in a blocked module; doc itself is 'Conservative (unsure existing RBAC can express card-scoped grants).'
- **#45** Maxfiy maydon filtri (role-aware projection) — Role-aware access-control projection that strips salary fields (min_salary/max_salary) for non-privileged roles — combines SoD/RBAC provisioning with HR salary fields, both blocked domains; needs owner sensitive-field + role-visibility policy.
- **#27** Ikki otdeleniye xizmat: primary_department_id routing — Structural org: dual-otdeleniye assignment model + new primary_department_id column (confirmed absent) for Coordination routing — doc explicitly flags this as an OPEN owner question (head_user_id/department-assignment structure).
- **#40** Yangi karta shtat-reja bog'lanish (soft check) — Structural org/budget model undecided: 'Egasi штат-reja modeli qarorini bermagan' — per-card budgeted seat vs aggregate dept headcount budget must be decided by owner before a headcount-vs-plan check exists.
- **#41** 'Majburiy tizim-qaydlari' (card_activity_logs) IoT defer — Owner explicitly deferred to the IoT phase; 'no action expected now.' Deferred/blocked pending owner lift of the deferral.
- **#72** Ikki kartani birlashtirish (merge) — Doc explicitly states 'merge is a structural org mutation'; card-merge conflict semantics (whose razryad/history/values win) are unspecified — structural decision belongs to the blocked org module.
- **#90** Kerakli jihozlar modeli+aktiv (card_equipment) — Architecture-ownership decision: which module owns the canonical equipment/asset table (WMS/assets vs a new org card_equipment) is undecided (Q-34 owner design decision) — cannot create the table until decided.
- **#101** 4 va 5-Departament ('Ишлаб чиқариш') chegarasi — Structural org decision marked 'OCHIQ qaror': the exact dividing line between the 4th and 5th departments (currently one generic node) is an owner hierarchy decision; encoding is trivial only once decided.
- **#105** Контрольный лист 'o'qildi-tasdiqladim'+имзо — Undecided owner decision on acknowledgment/signature format (simple timestamp+checkbox vs cryptographic e-signature — explicitly the same question as #126) before the card_acknowledgments table can be shaped.
- **#107** 'Иш жойи ва воситалари' jihoz ro'yxati — Duplicate build item of #90 ('EP-ORG-090 bilan bir') — same undecided architecture-ownership decision for the equipment/asset table.
- **#110** Karta 'ҳуқуқлари' ERP harakatiga bog'lansin — Card-rights -> ERP-action mapping is RBAC/permission-provisioning (SoD-adjacent) — the full rights-to-action taxonomy defines what each card may execute; access-control design in a blocked module, owner taxonomy required.
- **#126** Karta 2 raqamli imzo bilan kuchga kiradi — Undecided owner decision on what constitutes a valid digital signature (provider/method), plus the 2-signature card-activation gate is a structural org activation mechanism — blocked on both counts.
- **#133** 'Majburiy tizim-qaydlari' (boshlandi/bosqich/tugadi) — Owner explicitly deferred to the IoT phase and the checkpoint schema fields (boshlandi/bosqich/tugadi) are marked 'OCHIQ' — must be confirmed/defined by owner before any build.
- **#135** Bo'sh продукт slotlari signal (tugallanmagan) — Cron routes the Kanban task to the card's manager via head_user_id — the blocked structural field — and additionally needs owner master-data (expected product-slot count 1-4 per card-type) that is not yet defined.
- **#136** Vakant karta ЦКП'sini qo'shni karta bajaradi — Structural org: the 'qo'shni karta' adjacency/inheritance rule for a vacant card's ЦКП (same parent_id/level? which one?) is unspecified and depends on the acting/mentor mechanism being extended — unresolved hierarchy decision.
- **#139** Karta штат-reja birligiga bog'lanadi (byudjet) — Same OPEN owner decision as #40 (marked 'OCHIQ'): the staffing-plan model (1:1 card<->budgeted-seat vs aggregate dept headcount budget) must be decided before the staffing_plan table — structural/budget model blocked.

### 02-hr (11)
- **#5** AI-negative-score requires manager approval before posting — Depends on AI-generated KPI ratings (AI-credentials blocked) AND manager approval routing (who-manages-whom / head_user_id, org-structural blocked); also feeds the razryad/KPI rating pipeline. The approval_status/approved_by column is designable, but the mechanism can't function without AI scores + manager resolution.
- **#10** 30-min manager-response timeout -> 'unauthorized exit' — The hr_timeout_settings table is designable and the 30-min value is given, but the escalation routes to the employee's manager, requiring who-manages-whom / head_user_id (org-structural, blocked). Feature cannot function without manager resolution.
- **#18** Per-task approve/reject in weekly plan; rating counts only approved — Requires a manager to approve/reject each task (head_user_id, org-structural blocked) and feeds the razryad/KPI rating pipeline (blocked HR rating area). The weekly_plan_task_approvals store is designable but useless without both blocked dependencies.
- **#13** Rejected candidate re-applies; prior rejection = penalty factor — AI re-scoring dependent (AI-credentials blocked) and the exact penalty magnitude/weight is undefined by the owner. Not buildable until AI is live and the weight is set.
- **#19** 30-day probation; payroll blocked until mandatory docs complete — The gate sits in payroll (HR salary/payroll, blocked area) and the 'majburiy hujjat' mandatory-document checklist that gates the payroll row is undefined by the owner.
- **#20** WMS inventory-return blocks final pay; HR cannot manually unlock — Final-pay gate = payroll/salary (blocked area); the override/unlock authority is an open owner question (vision says HR cannot unlock); also needs a WMS inventory-return event to listen to.
- **#31** AI camera resolves which card by physical zone — AI-camera dependent (AI-credentials blocked) + requires a zone<->card binding (org-structural card, blocked) + owner must supply the physical zone->card map. Multiple blocked dependencies.
- **#39** Tie-break: manager picks between two side-by-side cards — Manager decision over org cards (org-structural, blocked) driven by owner-defined employee-selection criteria that produce the tie. Selection thresholds/criteria are owner-defined and the card layer is blocked.
- **#44** Boomerang auto-filters 'fired for cause/distrust' — Filter criteria include razryad exclusion (razryad, blocked area) plus an owner-defined dismissal-reason taxonomy; also rides on AI boomerang-embedding (AI-credentials blocked).
- **#57** Defect -> responsible-employee FK -> liability/fine — HR discipline fine (deducts from pay -> salary/payroll, blocked area) and EP-HR-057 is OCHIQ: whether/under-what-rule a responsible employee auto-triggers a fine is an undecided owner decision. (The nullable FK itself is built under #27; only the fine consequence is blocked here.)
- **#71** Inter-position AI-to-AI horizontal communication (workflow_rules) — AI-to-AI protocol (AI-credentials blocked) over workflow_rules horizontal org wiring (structural; confirmed 0 rows); the trigger/content of inter-department AI contact is undefined by the owner.

### 03-finance (7)
- **#9** POS-farq 24h tasdiqlamasa eskalatsiya, GL avto-yozilmaydi — pos_variance_approvals table is designable (to_regclass NULL), but the escalation RECIPIENT ROLE is owner-gated = SoD / org head_user_id assignment. Who receives the 24h escalation cannot be wired until the org hierarchy/roles (blocked Org structural + Finance SoD user-provisioning) exist.
- **#22** O'zaro hisob akti 2×QC tasdig'idan keyin atomik yopiladi (PIN=imzo) — взаимозачёт act table is designable, but atomic close is gated on a 2×QC approval + PIN=signature policy = owner-defined approval AUTHORITY / SoD user-provisioning (blocked). Duplicate of #120.
- **#48** Da'vo GL'da 'da'vo receivable', 90 kun 'bahsli', keyin moliya qarori — Same claims_receivable table as #88, but #48's distinguishing step — the final 'moliya qarori' dispute-resolution APPROVER — is owner-gated finance-decision authority = SoD user-provisioning (blocked). Approver cannot be assigned until org/SoD roles exist.
- **#120** O'zaro hisob (взаимозачёт/barter) akti atomik — Same взаимозачёт act table as #22; atomic AR/AP close is gated on an owner-defined QC-approval policy = approval AUTHORITY / SoD user-provisioning (blocked).
- **#16** Eslatma 4h→kassir rahbari, 8h→moliya rahbari, 3-marta→direktor — Graduated SLA escalates to org roles (kassir rahbari / moliya rahbari / direktor) that resolve via manager_id/head_user_id = blocked Org structural. Also the request-type/table it applies to is undefined.
- **#39** Har qator alohida vakolat tekshiruvi, chegirma GL daromad-ayirma satri — The GL discount daromad-ayirma line itself is buildable, but the blocker — per-line discount AUTHORITY thresholds (who can approve what discount %) — is SoD approval-authority / user-provisioning (blocked). Same open question as #119.
- **#118** Tannarxdan past narx SD da blok/egasi tasdig'i — order-costing engine is real, but the owner decision (below-cost hard-block vs require-approval AND who approves) is SoD approval-authority (blocked). standard_cost=0 rows too. The min-price data side is captured as dataGated under #29 (duplicate).

