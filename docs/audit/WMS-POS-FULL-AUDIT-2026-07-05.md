# EuroPrint ERP — WMS + POS Full Audit: Why ~60 Warehouses Exist

**Date:** 2026-07-05
**Type:** Read-only investigation (live DB + code). Nothing modified.
**Live DB:** native postgres `localhost:5432` (the populated dev DB).

---

# PART A — Warehouse count root cause (the owner's primary question)

## The answer in one line

The owner sees **59 warehouse rows**. **47 of them are auto-generated "one internal warehouse per department" rows** created by a nightly cron on **2026-07-02 18:18** — and **22 of those 47 are duplicate-named**, because the duplication is inherited from the **`org_departments` table, which has 145 rows but only 119 distinct names**. The cron itself is idempotent (won't keep growing); the pollution originates upstream in the org structure. The remaining **12 rows are legitimate hand-seeded "main" warehouses** (May) that map to the vision's warehouse types.

## Exact live counts (A1)
- `warehouses` = **59 rows** (all `is_active=true`, **0 soft-deleted**, **0 have a manager_id**).
- `warehouse_types` = **9 rows** (config table; vision expects ~13).
- Breakdown by `type`: **department_warehouse = 47**, raw_material = 2, then 1 each of: PRODUCTION_FLEXO, PRODUCTION_OFFSET, tools, finished_goods, household, MAIN, quarantine, mro, scrap, wip.

## Creation-source trace (A3) — proven
- **The 47 `department_warehouse` rows**: created by `apps/api/src/modules/wms/infrastructure/cron/department-warehouse-sync.service.ts:61` — `@Cron('10 3 * * *')` daily. It runs `INSERT INTO warehouses (...) SELECT 'DEPT-'||d.id, d.name||' ichki ombori', ... FROM org_departments d WHERE is_active AND deleted_at IS NULL AND node_type <> 'position' ON CONFLICT (code) DO NOTHING`. Keyed by `DEPT-<org_department_id>` → **idempotent, will not create more** on re-run. All 47 share `created_at = 2026-07-02 18:18` (single batch).
- **Root of the duplicate names:** `org_departments` = **145 rows / 119 distinct names** live → 26 duplicate department rows upstream. Of the ~47 non-`position` departments the sync selects, **25 distinct names span 47 rows → 22 duplicate-named warehouses**. The warehouse sync is faithful; the org table is polluted.
- **The 12 "main" rows**: hand-seeded in two May batches (2026-05-05 15:35 and 2026-05-11 17:44), distinct curated codes (WH-MAIN, FG-MAIN, RM-MAIN, …). Legitimate.

## Full row classification (A2)

### The 12 typed "main" warehouses — all LEGITIMATE (May seed)
| Code | Name | Type | Verdict |
|------|------|------|---------|
| WH-MAIN | Asosiy ombor | MAIN | LEGITIMATE (but `MAIN` not a config type) |
| RM-MAIN | Xom Ashyo Ombori | raw_material | LEGITIMATE |
| RM-ROLLS | Rulon Ombori | raw_material | LEGITIMATE (should be type `paper_rolls`, mis-tagged) |
| FG-MAIN | Tayyor Mahsulot Ombori | finished_goods | LEGITIMATE |
| WIP-MAIN | Yarim Tayyor Mahsulot | wip | LEGITIMATE (`wip` not a config type) |
| MRO-MAIN | Xo'jalik Ombori | household | LEGITIMATE (config code is `household_mro`) |
| MRO-STORE | MRO Ombori | mro | LEGITIMATE (near-dup of MRO-MAIN; `mro` not a config type) |
| TOOL-MAIN | Asbob-Uskuna Ombori | tools | LEGITIMATE (config code is `tools_equipment`) |
| QC-HOLD | Karantin Ombori | quarantine | LEGITIMATE (`quarantine` not a config type) |
| SCRAP-MAIN | Brak Ombori | scrap | LEGITIMATE (config codes are `waste_paper`/`defective`) |
| WH-PROD-FLEXO | Flekso sex ombori | PRODUCTION_FLEXO | LEGITIMATE (not a config type) |
| WH-PROD-OFFSET | Ofset sex ombori | PRODUCTION_OFFSET | LEGITIMATE (not a config type) |

### The 47 `department_warehouse` rows — 25 distinct, 22 DUPLICATE (grouped by name)
| Department name (+" ichki ombori") | DEPT codes | Verdict |
|---|---|---|
| Ishlab chiqarish | DEPT-28, DEPT-52, DEPT-157 | 1 LEGITIMATE + **2 DUPLICATE** |
| Ma'muriyat | DEPT-19, DEPT-44 | 1 LEGIT + **1 DUP** |
| Bosh Direktor ofisi | DEPT-20, DEPT-49 | 1 LEGIT + **1 DUP** |
| Kadrlar bo'limi | DEPT-21, DEPT-56 | 1 LEGIT + **1 DUP** |
| Yollash sektsiyasi | DEPT-22, DEPT-59 | 1 LEGIT + **1 DUP** |
| O'qitish bo'limi | DEPT-23, DEPT-55 | 1 LEGIT + **1 DUP** |
| Marketing | DEPT-24, DEPT-50 | 1 LEGIT + **1 DUP** |
| Sotuvlar | DEPT-25, DEPT-45 | 1 LEGIT + **1 DUP** |
| Moliya | DEPT-26, DEPT-51 | 1 LEGIT + **1 DUP** |
| Buxgalteriya | DEPT-27, DEPT-60 | 1 LEGIT + **1 DUP** |
| Flekso sexi | DEPT-29, DEPT-57 | 1 LEGIT + **1 DUP** |
| Ofset sexi | DEPT-30, DEPT-58 | 1 LEGIT + **1 DUP** |
| Preprint bo'limi | DEPT-31, DEPT-61 | 1 LEGIT + **1 DUP** |
| Ombor | DEPT-32, DEPT-46 | 1 LEGIT + **1 DUP** |
| Yetkazib berish | DEPT-33, DEPT-53 | 1 LEGIT + **1 DUP** |
| Sifat nazorati | DEPT-34, DEPT-47 | 1 LEGIT + **1 DUP** |
| PR va aloqalar | DEPT-35, DEPT-48 | 1 LEGIT + **1 DUP** |
| Hamkorlar | DEPT-36, DEPT-54 | 1 LEGIT + **1 DUP** |
| Rivojlanish bo'linmasi | DEPT-37, DEPT-160 | 1 LEGIT + **1 DUP** |
| Texnik ta'minot | DEPT-40, DEPT-158 | 1 LEGIT + **1 DUP** |
| Qurilish bo'linmasi | DEPT-41, DEPT-155 | 1 LEGIT + **1 DUP** |
| Ishlab chiqarish bo'linmasi | DEPT-38 | LEGITIMATE (near-dup variant of "Ishlab chiqarish") |
| Ma'muriy bo'lim | DEPT-39 | LEGITIMATE (near-dup variant of "Ma'muriyat") |
| Moliya bo'linmasi | DEPT-42 | LEGITIMATE (near-dup variant of "Moliya") |
| Tarqatish bo'linmasi | DEPT-43 | LEGITIMATE (unique) |

**Tally:** 21 names ×2 + "Ishlab chiqarish" ×3 = **22 exact-duplicate rows**; plus ~4 "…bo'linmasi/…bo'lim" **near-duplicate variants** of the same real departments (DEPT-38/39/42 and the two "Rivojlanish/Qurilish bo'linmasi" pairs).

## warehouse_types: 9 rows vs the 13-type vision (A4)
Live 9 config types (code): `defective`, `department_warehouse`, `finished_goods`, `household_mro`, `paper_rolls`, `production`, `raw_material`, `tools_equipment`, `waste_paper`.
- **Present & mapped to vision:** paper_rolls(#1), finished_goods(#2), raw_material(#3), household_mro(#4), tools_equipment(#7), waste_paper+defective(#6 — split into TWO where vision wants ONE), + `production` + `department_warehouse` (extra, not in the 13).
- **MISSING from config:** Karantin(#8), Sifat nazorati QC-hold(#9), Flekso sex(#10), Ofset sex(#11), Mexaniklar(#12), Tayyor mahsulot IJARA/rental(#13). (The `warehouses` table has ad-hoc `quarantine`, `PRODUCTION_FLEXO/OFFSET` rows and `is_free_storage/free_storage_days/monthly_rate` columns for rental, but no matching config-type rows.)
- **Taxonomy mismatch:** warehouse rows use type strings **not in the config** — `MAIN`, `wip`, `mro`, `scrap`, `quarantine`, `tools`, `household`, `PRODUCTION_FLEXO`, `PRODUCTION_OFFSET`. Only `department_warehouse`, `raw_material`, `finished_goods` map cleanly. (Unchanged since SAP-CONFORMANCE-CHECK.md principle 6.)

## Duplicate-prevention & competing create paths (A5, A6)
- **All three create endpoints write to the SAME `warehouses` table:** `POST /api/wms/warehouses` (`wms-warehouses.controller.ts:90` raw INSERT), `POST /api/warehouse/warehouses` (`wms-gateway-warehouses.controller.ts:139` raw INSERT), `POST /api/warehouses` (`compatibility/resources.service.ts:251` INSERT). Plus `drizzle-wms-warehouses.repo.ts:55` `db.insert(warehouses)`.
- **No uniqueness guard on the manual inserts** — none use `ON CONFLICT` or a pre-check. Only the cron is idempotent. So manual creation (or the same warehouse entered twice) will duplicate freely. This is a standing future-duplication risk independent of the org-data issue.

---

# PART B — Full WMS module state

| # | Question | Status | Evidence (file:line / rows) | Notes |
|---|----------|--------|------------------------------|-------|
| B7 | FE /wms/* page inventory | PARTIAL | Router = `WarehouseRoutes.tsx:51-109` (39 routes). WMSDashboard `/wms/dashboard`:69 REAL; MMExtended :98-100 REAL (1 page/3 routes); WMSMaterials `/inventory/materials`:84 REAL; MaterialBalance `/wms/material-balance`:82 REAL; WarehouseRental `/wms/rental`:68 → `warehouse-rental.controller.ts:32` REAL | **DUPLICATE:** WarehouseReports `/warehouse/reports`:63 vs newer WarehouseReportsAll `/wms/reports`:71. **DEAD:** WmsAnalytics, BarcodeWarehouse, WarehouseDirectory, WarehouseIntegrations de-routed (`WarehouseRoutes.tsx:4-5`) — files+`wms-analytics.controller.ts:24` still exist, unreachable. |
| B8 | BE warehouse/wms controller inventory | PARTIAL (collision grew) | 28 controllers in `wms/`. **Bare `@Controller('warehouse')` = 11** (prior ~7): `wms-warehouse-gateway:67`, `wms-barcode:69`, `wms-catalog:27`, `wms-gateway-warehouse-lots:53`, `wms-gateway-inventory:65`, `wms-gateway-warehouses:56`, `wms-gateway-binszone:77`, `wms-integration:44`, compat `warehouse-barcode-ops:24`/`warehouse-catalog:45`/`warehouse-label:24`. `@Controller('warehouses')` ×2: `compatibility/resources.controller.ts:26` + `wms/wms-warehouses.controller.ts:36` | Collision-prone concentration of one prefix; **grew since prior audit**. Distinct sub-paths avoid a hard boot crash, but the surface is fragmented. |
| B9 | Stock-flow integrity | PARTIAL (two base tables, reads unified) | `warehouse_stock` = BASE (canonical, 39 rows); `current_stock` = VIEW over it; `pos_stock_ledger` = VIEW over separate BASE `stock_ledger` (5 rows). **PosWmsSyncService is WIRED/LIVE** now: `@Injectable pos-wms-sync.service.ts:33`, registered `pos.module.ts:193`, fired by `@EventsHandler(PosMovementCreatedEvent)` `pos-wms-sync-created.listener.ts:43` → upserts `warehouse_stock` `:92` | **Changed since prior audit:** PosWmsSync no longer dead. Legacy POS ledger world persists as `stock_ledger`, but POS movements now bridge to `warehouse_stock`. |
| B10 | Quarantine/QC 5-stage gate | PARTIAL (WMS enforces, MM bypasses) | `WmsQuarantineGateService` (`wms-quarantine-gate.service.ts:26`) enforces DRAFT→KARANTIN→QC_PASS→MAIN; `releaseToMain` blocks non-QC_PASS `:88-105`; exposed `wms-warehouse-gateway.controller.ts` /quarantine:235 /qc-decision:248. Live `goods_receipts` 1 row DRAFT | **Gap:** MM path `mm/.../goods-receipt.handler.ts:31-68` does 3-way-match + status only — **no quarantine, no stock write**; `receive-fg.handler.ts:97` lands FG straight to `warehouse_stock`. Gate covers WMS-gateway receipts, not MM/FG. |
| B11 | Dead-letter services | PARTIAL | PosWmsSyncService = **FIXED/live** (see B9). PosGlAutoService = **no-op stub**: `pos-gl-auto.service.ts:76-89` empty `@Injectable`, comment cites `pos-gl-auto.listener.ts` which **does not exist**; auto-post line removed from `pos.events.ts:186-193` | GL now requires manual approve (`/api/pos/gl/entry/:id/approve`) — **by design, not a bug**, but the stub service is still registered `pos.module.ts:175`. |

---

# PART C — Full POS module state

| # | Question | Status | Evidence (file:line / rows) | Notes |
|---|----------|--------|------------------------------|-------|
| C12 | POS Monitor identity (omborchi, not cashier) | REAL (cleaned) | FE `pos-monitor/pages/` = receive/issue only (PosMovementKirim/Chiqim, PosGoodsReceipts, PosInventory, PosQuarantine, PosQCReview, PosLotTraceability). Grep `cashier|retail|cash.drawer|receipt.print` over pos-monitor = **0**. Retail retired: `pos/presentation/pos-stub.controller.ts:10-15` (2026-07-01) "CashRegisterService butunlay retiring" | **Changed since prior audit:** dormant retail-cash UI cleaned. `cashier_movements`(0)/`cashier_shifts`(1) belong to finance/cashier-hub podotchet, not POS retail. |
| C13 | Supply-chain link check | PARTIAL (most wired, 2 broken) | WIRED: ta'minotchi→CC (`procurement-request.service.ts:146`→`cc-event.listener.ts:42`), CC→Kanban (`cc-kanban-bridge.service.ts`), logistika→FIN/Marketing (`complete-delivery.handler.ts:22`→`nps-auto-request.listener.ts:18`), omborchi→karantin→QC (`quarantine-workflow.service.ts:150`), QC→ombor (`qc-passed.listener.ts:34`), WMS→FIN GL (`wms-goods-issued.listener.ts:51`) | **BROKEN:** savdo→AI (AI listens only to crm.lead/hr.candidate/finance.invoice — `ai-automation-events.service.ts:37`; no SalesOrderCreated→AI). **DISCONNECTED:** kassir(POS)→logistika (no POS→logistics emit; `pos-movement.service.ts:375` stays intra-POS). |
| C14 | Barcode parent-child | STUB (schema-only) | `material_barcodes` HAS `parent_barcode_id` (integer, nullable) — parent-child at column level. BUT **0 live rows, NO FK** on the self-ref; `inventory_barcode_assignments`=0, no parent column | Order-QR + per-paddon child = designed, unpopulated, unenforced. |
| C15 | Podotchet/expense flow | REAL (now wired) | `ObligationsTab` imported `pages/EmployeeProfile.tsx:60`, rendered `:391` → `GET /api/finance/cashier/employees/:id/debt` → `CashierPodotchetService.getEmployeeDebt` (`cashier-payroll.controller.ts:132`). AI-reads-receipt+human-confirm: `cashier-podotchet.service.ts:7-9` | **Changed since prior audit:** no longer orphaned. `mm_driver_expenses` etc = 0 rows; live flow uses `employee_debt`/`advance_reports`. |
| C16 | Config-driven warehouse types in POS layer | REAL (same tables, predicate skew) | POS `warehouse-config.service.ts:31,44-49` reads canonical `warehouse_types` + `warehouses`. WMS reads the same `warehouses` (`drizzle-wms-warehouses.repo.ts:22`, `wms-gateway-warehouses.controller.ts:96`). Live warehouses=59, types=9 | **Count-skew risk:** POS filters `WHERE is_active=true` (`:33,47`) while WMS gateway filters `deleted_at IS NULL` (`:211,303`) — different predicates → screens can show different counts from the *same* table. |

---

# Verdicts & recommendations

## Plain verdict on the ~60 count
**It is a MIX, mostly pollution in one cluster.** Of 59 rows: **~37 legitimate** (12 hand-seeded "main" warehouses + 25 distinct department internal warehouses) and **22 exact-duplicate** department rows (+ ~4 near-duplicate "…bo'linmasi" variants of the same real departments). **The duplication is not a warehouse bug** — the department-warehouse cron is idempotent (`ON CONFLICT (code) DO NOTHING`) and will not grow. **The root cause is upstream:** `org_departments` holds 145 rows for only 119 distinct departments, and the sync mirrors each into a warehouse. The `warehouse_types` config (9) is also under the 13-type vision and its codes don't match many `warehouses.type` strings.

## Safe-to-deactivate list (do NOT perform — investigation only)
- **Safe to deactivate (`is_active=false`):** the 22 exact-duplicate `DEPT-*` rows (the second/third instance of each duplicated name — e.g. DEPT-44/49/56/59/55/50/45/51/60/57/58/61/46/53/47/48/54/160/158/155 and DEPT-52+157 for "Ishlab chiqarish"). They have **0 manager and (verify) 0 stock**; the cron's `ON CONFLICT` will not re-create them.
- **PRE-CHECK REQUIRED before any deactivation:** confirm each target `DEPT-*` warehouse has **no `warehouse_stock` rows** and no `department_warehouse_map`/`wms-overflow.service` dependency holding live balance — `wms-overflow.service.ts` routes overflow (+kg) into department internal warehouses, so a DEPT warehouse could legitimately hold stock. Do not deactivate one that does.
- **Do NOT deactivate:** the 12 "main" warehouses, the 25 distinct department warehouses, or hard-DELETE anything (FKs in `department_warehouse_map`). **The real fix is upstream: dedupe `org_departments` (145→119).**

## Top 5 highest-leverage fixes (WMS+POS)
1. **Dedupe `org_departments` (145→119 distinct).** ROOT cause — fixes the 22 duplicate department warehouses at source and stops the cron re-mirroring duplicates. Everything downstream (org chart, approval chain, warehouses) inherits this pollution.
2. **Add a uniqueness guard to the 3 manual warehouse-create endpoints** (`wms-warehouses:90`, `wms-gateway-warehouses:139`, `resources.service:251`) — none have `ON CONFLICT`/pre-check today; this is a standing duplication hole regardless of the org fix.
3. **Reconcile `warehouses.type` ↔ `warehouse_types.code`** — ~9 warehouse rows use type strings (`MAIN`, `wip`, `mro`, `scrap`, `quarantine`, `tools`, `household`, `PRODUCTION_FLEXO/OFFSET`) absent from the config, so config-driven behavior (quarantine/QC flags, label templates) never applies to them. Add the 4-6 missing vision types (flexo, offset, QC-hold, rental) as config rows.
4. **Unify the warehouse-list query + consolidate controllers** — POS (`is_active`) vs WMS (`deleted_at IS NULL`) predicates make screens disagree on the count; the 11 `@Controller('warehouse')` controllers are a fragmentation/collision risk that grew since the last audit.
5. **Route MM goods-receipt through the quarantine/QC gate** — today only the WMS-gateway path enforces DRAFT→KARANTIN→QC→MAIN; MM receipt + FG-receive bypass it, so the 5-stage vision is only half-enforced.

*Investigation only — no rows deactivated, no code changed. Awaiting owner decision.*
