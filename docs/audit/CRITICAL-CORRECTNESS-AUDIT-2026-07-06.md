# EuroPrint ERP — Critical Correctness & Concurrency Audit (read-only, whole project)

**Date:** 2026-07-06
**Scope:** Nine severe correctness/safety failure classes across the entire codebase — race conditions, timezone/date-boundary, financial rounding, SQL injection, transaction boundaries, soft/hard-delete consistency, token expiry, barcode collision, upload security.
**Method:** 4 code-path investigators (9 categories) + direct live schema/constraint/timezone queries by the lead against `postgres@localhost:5432/europrint` (1063 tables, read-only `_audit/q.cjs`). Every finding carries a file:line; anything checkable live (timezone, column type, constraint existence) was confirmed live.
**Cross-referenced:** CLAUDE.md Qoida A/B, `docs/security-pentest-2026-06-01.md`, `FINANCE-FULL-AUDIT-2026-07-06.md`.

> **Lead finding (Category 4 is the designated top priority): SQL injection is CLEAN.** All three CLAUDE.md-flagged sites are verified fixed, dynamic identifiers are allowlisted, and parameterization is pervasive — **no genuine user-input SQL injection exists** (details in Category 4). The report therefore leads with the real top-severity items: a **payment double-spend/lost-update path with no idempotency and no transaction**, and an **IoT tablet token that silently fails all writes for up to 4 hours per shift**.

> **Live-data caveat (applies throughout).** The DB is near-empty (build phase: 31 `material_cards`, 42 `accounts`, 0 payments, 0 soft-deleted rows). Many findings are **latent** — genuine code defects that will corrupt data at real volume/concurrency but are not producing bad rows today. These are marked "latent". They are still real defects (the already-found 62.8B garbage GL row shows what an unguarded path produces once exercised).

---

## Category 1 — Race conditions (check-then-act without locking)

| # | Location (file:line) | Issue | Sev | Live evidence | Notes |
|---|---------------------|-------|:---:|---------------|-------|
| 1.1 | `finance/…/record-payment.handler.ts:83-152` + `drizzle-finance-ops.repo.ts:77-83` | No idempotency: reads invoice `paid_amount`, checks overpay guard, INSERTs `finance_payments`, then `updateInvoicePaidAmount` writes an **absolute** value. Two concurrent payments both pass the guard, both insert, second UPDATE clobbers first → **double payment + lost-update on balance**. | **CRITICAL** | `finance_payments` has no idempotency key/unique (only `pos_movements`+`sd_advance_idempotency_keys` do) | GL post is idempotent so ledger won't double, but payment+invoice rows will |
| 1.2 | `sd/…/sd-payments.repository.ts:110` (`sd-payments.controller.ts:70`) | `INSERT INTO sd_payments` on every POST, no idempotency/unique/ON CONFLICT → duplicate customer payments on double-submit | HIGH | `sd_payments` not in idempotency allowlist | Contained to SD ledger |
| 1.3 | `finance/…/finance-actions.repository.ts:134,164` | `invoice_number = AP-${Date.now()}` / `AR-${Date.now()}`; **no unique constraint** on `finance_invoices.invoice_number` → two creates in the same ms get the **same number, silently** | HIGH | Confirmed live: `finance_invoices.invoice_number` NOT unique | Same for `drizzle-finance-invoice.repo.ts:88` |
| 1.4 | `wms/…/drizzle-wms.repo.ts:159-220` → `queries-wms.ts:137-160` | `reserveMaterial`/`issueGoods` do **SELECT-then-UPDATE**: read FEFO qty, compute new absolute qty in JS, `UPDATE … SET quantity=${newQty} WHERE id=${id}` — **no `WHERE quantity>=x`**. Concurrent issues both read 10, both write 2 → 8 units lost/oversell | HIGH | Reached via `GoodsIssueCommand` (`wms-goods-issue.controller.ts:81`) | **Atomic sibling `execIssueFromWarehouseStock` exists** — this path just doesn't use it |
| 1.5 | `compatibility/pos-warehouse-integration-movement.service.ts:124-131` | TOCTOU: availability read from a view **before** `db.transaction`, decrement `SET quantity=quantity-X` has **no `available>=X` guard** → drive stock negative/oversell an asset | HIGH | Tx wraps the write (good) but guard is outside; view read not `FOR UPDATE` | Fix = guard in the UPDATE like `issueStock` |
| 1.6 | `pos/…/quarantine-workflow.repository.ts:90-99` | `SET quantity=GREATEST(quantity-qty,0)` — silently **clamps** a deficit, masking oversell instead of rejecting | MEDIUM | Clamp pattern | Integrity smell |
| 1.7 | `sd/…/create-order.handler.ts:172-182` | `seqNum=count()+1; padStart(6)` read-max sequence | MEDIUM | Backed by `sales_orders.order_number` UNIQUE → collision **errors** (no silent dup) but spurious create failure under load | Should use `nextval` |
| 1.8 | `wms/…/wms-gateway-warehouses.controller.ts:142-147` | Duplicate-name guard is **SELECT-then-INSERT**; `warehouses.name` has no unique (only `code`) → concurrent same-name both insert | MEDIUM | Confirms `d75898a2`/`9eba25a6` guard exists but is **non-atomic** | Low-frequency admin action |
| 1.9 | `finance/…/gl-posting.service.ts:138-146` | App-level `findEntryIdByReference`-then-insert; true concurrent double-post of same `reference` can both miss | MEDIUM | `entry_number` UNIQUE but keyed on GL number not `reference` | Sequential double-click IS safe |
| 1.10 | `cron/kanban-recurring.cron.ts:75` | `MAX(sort_order)+1` read-max in cron | LOW | Single-writer cron, not money | Acceptable |

## Category 2 — Timezone / date-boundary errors

**Live baseline:** DB timezone = **Asia/Tashkent (UTC+5) — correct**. No `TZ` env in `apps/api/.env` → Node runs OS-local (UTC on this host). Column types: **2040 `timestamp` (naive) vs 490 `timestamptz`**; **282 date columns stored as `varchar`/`text`** (incl. `accounting_periods.start_date/end_date`, `entries.entry_date`).

| # | Location (file:line) | Issue | Sev | Live evidence | Notes |
|---|---------------------|-------|:---:|---------------|-------|
| 2.1 | `finance/…/gl-posting.service.ts:158` | `entryDate = new Date().toISOString().slice(0,10)` = **UTC** calendar day. A GL post 00:00–05:00 Tashkent is stamped to the **previous** day; feeds both the ledger date AND the period-lock (`findClosedPeriodForDate(entryDate)` :166) | **HIGH** | DB tz Tashkent, no `TZ` env, `new Date()`=UTC | Every money leg routes here; should use `TashkentTimeService` |
| 2.2 | `drizzle-gl-posting.repo.ts:148-149` | Period lock compares `${entryDate} >= start_date AND <= end_date` as **raw text** against varchar `accounting_periods.start_date/end_date`, **no `TO_CHAR`/`::date` normalization** (unlike every other finance repo). Any non-`YYYY-MM-DD` stored value makes the lock **silently miss** → GL posts into a closed period | **HIGH** | 282 varchar dates live; successor to the `9919dc92` cast-crash class | Doubly fragile combined with 2.1's UTC date |
| 2.3 | `hr/payroll/ckp-gate.ts:93-95` + `org-structure/ckp-fact.service.ts:131-137` | ЦКП 16h deadline anchored at **UTC** midnight (`${factDate}T00:00:00.000Z` + deadlineHours) → effectively 21:00 Tashkent instead of 16:00 (5h **too lenient**); binary 0/full gate wrongly pays a report filed 16:00–21:00 D+1 | MEDIUM | Both files agree with each other (UTC) but disagree with Tashkent convention | The "16h ЦКП deadline" |
| 2.4 | `cashier-daily-zreport.cron.ts:50-53` vs 2.1/2.3 | **Two "today" conventions coexist:** the Z-report cron correctly uses `@Cron(…, {timeZone:'Asia/Tashkent'})` + `TashkentTimeService`, while gl-posting and the ЦКП gate compute the same day-boundary in UTC | MEDIUM | Cashier=Tashkent day, payroll GL entry_date=UTC day | Same pay-day, two answers |
| 2.5 | `sd/…/sd-quotations.service.ts:131-133` | Current-month KPI fallback uses `new Date().getMonth()` (OS-local=UTC) → wrong month 00:00–05:00 Tashkent at month boundary | LOW-MED | Report scoping only | |
| 2.6 | `common/time/tashkent-time.service.ts:107-111` | `addDays()` uses raw `new Date().setDate` — the one method not wrapped in `TZDate` (unlike `addBusinessDays` :117) | LOW | No DST in UZ limits impact | |

## Category 3 — Financial rounding / floating-point

**Live baseline:** money columns are almost all `numeric` (only `production_orders.defective_qty` is `double precision`). No float money **storage**; all risk is JS `Number()` arithmetic. GL tolerance = `Math.abs(ΣDr-ΣCr) > 0.01`.

| # | Location (file:line) | Issue | Sev | Live evidence | Notes |
|---|---------------------|-------|:---:|---------------|-------|
| 3.1 | `gl-posting.service.ts:151-154` vs `:190` | Balance check runs on **unrounded** input legs, but persisted rows use per-row `Math.round(alloc*100)/100`; the rounded rows are never re-reconciled → ΣDr(persisted) can differ from ΣCr(persisted) by ~nLegs×0.005 while the input check passed | MEDIUM | **Latent**: UZS amounts are integer-valued today so never triggered | A last-leg residual adjustment would make it exact |
| 3.2 | `finance/…/delivery-completed.listener.ts:128-151` | `Number(total)` then float math (`tax=Math.round(total*vat*100)/100`, `cogs=…`) posted to GL | MEDIUM (decomp exact) | `amount=total-tax` reuses rounded tax → revenue+tax=total exactly | See 3.6 |
| 3.3 | `hr/payroll/payroll.service.ts:500-505,788` | Multi-step float: `dayBase=proratedGross/totalDays` (repeating), re-summed per day, then reduced across cards → `base_salary` → GL | MEDIUM | Debit & credit derive from same summed number so 0.01 tolerance holds | No intermediate rounding in day loop |
| 3.4 | `hr/payroll/payroll-closure.service.ts:77-80,141-147` | `aggregate()` sums `Number(...)` floats then 0.01 balance check | LOW-MED | Tolerance deliberately aligned to engine (comment H2) | Correct guard |
| 3.5 | `sd/…/sd-quotations.service.ts:111-121` | `unitPrice` and `totalPrice` each `round2`'d **independently** → `unitPrice*qty ≠ totalPrice` | LOW | Quotation display only, not GL | |
| 3.6 | `gl-posting.service.ts:112-135` (`postDeliveryCompleted`) | **Assessment (C3.11):** decomposition is **exact** — ΣDr=total+cogs, ΣCr=(total−tax)+tax+cogs; the 0.01 tolerance is safe here | ALREADY CORRECT | Balance proof at :105-107 | |

## Category 4 — SQL injection / unsafe raw query — **CLEAN (lead priority)**

| # | Location (file:line) | Issue | Sev | Live evidence | Notes |
|---|---------------------|-------|:---:|---------------|-------|
| 4.1 | `general/services/legacy.service.ts:27` | CLAUDE.md-flagged `sql.raw(rawQuery)` | ✅ FIXED | Facade refactor (PA-S4a); no method takes a raw SQL string | Was the top prior risk |
| 4.2 | `shared/db/schema.ts:114-122` (`ddlRun`) | CLAUDE.md-flagged `sql.raw(q)` | ✅ FIXED | `DDL_PREFIX_RE` guard throws PA-S4b on any non-DDL string; callers pass literal migration strings | Verified live |
| 4.3 | `shared/db/invariants.ts:86,38` | CLAUDE.md-flagged `sql.raw(m.sql)` | ✅ FIXED | `m.sql` from static migration arrays + PA-S4c prefix guard; no `@Body/@Query/@Param` reaches it | |
| 4.4 | `aisha/…/compare-periods.tool.ts:76,78` | `sql.raw(meta.column/table)` (LLM-facing tool) | ✅ SAFE | `meta` from closed `ALLOWED` dict gated by `if(!meta) return Err`; dates regex-guarded + parameterized `${p1[0]}::date` | Correct allowlist |
| 4.5 | `doc-sequences.helper.ts:90` | `CREATE SEQUENCE … ${seqName}` | ✅ SAFE | `seqName` stripped to `[A-Z0-9]` then `^[a-z0-9_]{1,63}$` allowlist test, null on mismatch | |
| 4.6 | `wms/…/supplier-rating.repository.ts:210` | `INTERVAL '${windowMonths} months'` | ✅ SAFE | Wrapped in `Math.max(1, Math.trunc(...))` → integer coercion | |
| 4.7 | `admin/…/admin-extra.repo.ts:83-108` | Dynamic audit-log WHERE (action/table/user/dates/search) | ✅ SAFE | Every fragment parameterized `${}` + LIKE-escaped `esc()`; combined as SQL objects not strings | Model dynamic-WHERE |
| 4.8 | ORDER BY / sortBy sites (`queries-hr-assets.ts:47`, `queries-pp.ts:79`, …) | Dynamic sort | ✅ SAFE | All use hard-coded Drizzle column refs, not request strings | No user-input identifiers |

## Category 5 — Missing transaction boundaries on multi-write ops

| # | Location (file:line) | Issue | Sev | Live evidence | Notes |
|---|---------------------|-------|:---:|---------------|-------|
| 5.1 | `finance/…/record-payment.handler.ts:83-152` | Three consistency-critical writes — INSERT `finance_payments` → UPDATE `finance_invoices` → INSERT `entries` — as **separate awaits, no `db.transaction`**. GL failure at :99/:149 returns Err but payment+invoice are **already committed** → invoice paid with no ledger entry | **CRITICAL** | No tx wrapper in handler | Compounds 1.1; wrap all three in one tx |
| 5.2 | `iot/…/iot-tablet.controller.ts:579-593` | `UPDATE production_sessions … +X` + INSERT `downtime_events` + QC-bridge = **3 separate `db.execute`, no tx** | MEDIUM | `@Public` tablet endpoint | Increment atomic; cross-table not |
| 5.3 | `iot/…/iot-tablet.controller.ts:682-796` | INSERT `material_movements` then best-effort UPDATE `warehouse_stock`+`material_cards`, no tx, UPDATE-else-INSERT race → concurrent insert hits unique, credit silently dropped | MEDIUM | Best-effort by design | Audit row survives, stock may not move |
| 5.4 | `pos/…/warehouse-config.service.ts:112-196` | `warehouse_stock`+`material_cards.current_stock`+`material_movements` as 3 separate raw calls, no tx | MEDIUM | The stock decrement itself IS atomic-guarded (good); `current_stock` uses GREATEST so self-heals | |
| 5.5 | `pos/…/pos-inventory-count-query.service.ts:64-71` | `for(line of lines){ await recordActualQty }` no all-or-nothing tx | MEDIUM | Bulk endpoint | Per-line overwrite-idempotent |
| 5.6 | `compatibility/approval-workflow.service.ts:108-115` | `Promise.allSettled(ids.map(approve))` — partial success by design, no tx | LOW | Returns {succeeded,failed} | Acceptable given contract |

## Category 6 — Soft-delete / hard-delete inconsistency

| # | Location (file:line) | Issue | Sev | Live evidence | Notes |
|---|---------------------|-------|:---:|---------------|-------|
| 6.1 | `erp/erp.repository.ts:144-149` (`deleteBomHeader`) | Hard `DELETE FROM bom_headers`; `bom_items` has **no FK to bom_headers**, no CASCADE, no app cleanup → orphaned BOM lines | HIGH | Live: `bom_items` only FK is `component_id→material_cards` (NO ACTION) | `deleteBomItem` never called on header delete |
| 6.2 | `director/…/okr.repository.ts:212` (`deleteObjective`) | Hard delete `okr_objectives`; `okr_key_results` has **no `objective_id` FK** → orphaned key results | HIGH | Live: `okr_key_results.owner_card_id→org_functions` (SET NULL); no KR→objective FK | Self-FK `parent_goal_id` SET NULL → child objectives dangle |
| 6.3 | `compatibility/warehouse-barcode-ops.service.ts:53-63` | `scanBarcode` on `material_cards.barcode` with **no `deleted_at IS NULL`/`is_active`** → soft-deleted material returned as live | MEDIUM | `material_cards` HAS `deleted_at`+`is_active`; only ~3 of 95 referencing files filter it | Systemic |
| 6.4 | `pos/…/pos-barcode.service.ts:145` (`findByBarcode`) | POS scan resolves material without soft-delete filter; cached 1h | MEDIUM | Same | See 8.6 |
| 6.5 | `pos/…/auto-barcode.repository.ts:52-65` | `LEFT JOIN material_cards` no `deleted_at` → prints barcodes for deleted materials | LOW | Same | Print path |
| 6.6 | `sd/…/customer-360.builder.ts:29,52-53` | 360 joins `sales_orders` **without** `deleted_at IS NULL` (sibling `getRecentOrders` :103 DOES) → deleted orders inflate totals | MEDIUM | `sales_orders` HAS `deleted_at`; inconsistent within module | |
| 6.7 | `finance/…/drizzle-gl-posting.repo.ts:18,88` | Account CODE→id resolve with no `is_active`/`deleted_at` → journal can post to a deactivated account | MEDIUM | `accounts` HAS both; only 1 file filters `accounts.deleted_at` (latent: 0 deleted now) | Ledger integrity risk |
| 6.8 | **Systemic** (95 files ref `material_cards`, 3 filter; `accounts` 1 filter) | Soft-delete is written but **read-side unenforced** across most joins; no shared active-only view/helper | HIGH (systemic) | Live counts above | **Latent** (0 soft-deleted rows now); real corruption once rows are deleted |

## Category 7 — Session/token expiry mid-operation

| # | Location (file:line) | Issue | Sev | Live evidence | Notes |
|---|---------------------|-------|:---:|---------------|-------|
| 7.1 | `iot/…/iot-tablet.service.ts:208` **vs** FE `useIoTTabletTypes.ts:47` | **TTL mismatch**: BE tablet token `expiresIn:'8h'` vs FE `SESSION_12H_MS=12h`. For h8–h12 the UI shows "logged in" while every `x-tablet-token` write returns 401 | **CRITICAL** | Both constants grep-confirmed | Worker keeps scanning; all persistence silently fails up to 4h/shift |
| 7.2 | FE `iot/useIoTTabletData.ts:23-38` (`makeTabletFetch`) | Tablet raw-`fetch` has **no 401 handling, no refresh, no retry**; no `/iot/tablet/refresh` endpoint exists at all → in-flight session start/finish + scans lose unsaved work on expiry | **CRITICAL** | Grep-confirmed no refresh path | Main ERP `apiRequest` refreshes+retries; tablet doesn't |
| 7.3 | `auth/…/login.service.ts:94` | Comment "Sign access (8h)" but code signs `…TTL ?? '15m'` | LOW | :220 uses 15m | Doc drift |
| 7.4 | `chat/chat.module.ts:39` vs `auth.module.ts:46` | Chat JWT default TTL `'24h'` vs auth `'15m'` — same user's token "expired" at different times across surfaces | MEDIUM | Grep-confirmed differing defaults | Risk when env unset |
| 7.5 | Main ERP long POST wizards via `api-request.ts:137-140,262-268` | 15m access token; multi-step forms rely on refresh-retry, but a refresh **failure** → `scheduleLoginRedirect` discards the page → unsaved wizard lost | MEDIUM | | OK for GETs, risky for long unsaved POSTs |
| 7.6 | `auth/…/auth.controller.ts:154-208` (refresh) | Old token blacklisted **after** minting (:196); two concurrent refreshes with same old token both pass the not-blacklisted check (:174) → **two live token pairs** (single-use not atomic) | MEDIUM | FE `refreshTokenOnce` singleton dedups per-tab; cross-tab/device can multiply | Atomic fix = check-and-revoke in one statement |

## Category 8 — Barcode / sequence-number collision

| # | Location (file:line) | Issue | Sev | Live evidence | Notes |
|---|---------------------|-------|:---:|---------------|-------|
| 8.1 | `pos/…/auto-barcode.service.ts:25-66` | Barcode `{KOD}-{YYYYMMDD}-{Math.random 6}` into `pos_barcode_print_queue` which has **NO UNIQUE on `barcode`**; parallel `Promise.all` inserts, no read-back → silent dup barcodes | HIGH | Live: `pos_barcode_print_queue` has no UNIQUE on barcode | Random suffix lowers odds, nothing prevents |
| 8.2 | `pos/…/pos-stock-issuable.repository.ts:114-121` + service `_allocateUniqueBarcode:160-173` | `COUNT(*)+1 … WHERE barcode LIKE prefix%` then exists-loop — **TOCTOU**: two allocations read same count, both pass, both insert same code (no DB unique to catch) | HIGH | Same table, no unique | "Uniqueness guarantee" comment is false |
| 8.3 | `pos/…/procurement-request.service.ts:98-100` | `COUNT(*)+1 → PR-YYYY-NNNNN`, no lock, `procurement_requests.request_number` **no UNIQUE** → dup PR numbers silently | HIGH | Live: not in UNIQUE set | CC service does this right with advisory lock |
| 8.4 | `compatibility/employees-compat-sub.service.ts:119` | `'CR-'||LPAD(COUNT(*)+1)` inline in INSERT, no lock/constraint | MEDIUM | `hr_conflict_reports` no UNIQUE | Low volume |
| 8.5 | `ecommerce/ecommerce.repository.ts:163-179` | Order number read-`lastNumber`+1, no lock | MEDIUM | Depends on `ecommerce_orders` constraint (not confirmed) | Verify constraint |
| 8.6 | `pos/…/pos-barcode.service.ts:127-223` + `warehouse-barcode-ops.service.ts:53` | Scan matches barcode **without `is_active`/status** → a reissued/deactivated barcode resolves to wrong/stale material | MEDIUM | `pos_barcode_map.barcode` UNIQUE (no dup rows) but no is_active gate on read | `clearPrimaryBarcode` unsets flag but rows still matchable |
| 8.7 | `compatibility/barcode-warehouse.service.ts:56-72` | `movement_number = 'RCV-'+TO_CHAR(NOW(),'…HH24MISS')` **second-resolution**; two receipts same second → `pos_movements.movement_number` UNIQUE throws 500 | MEDIUM | UNIQUE confirmed | Constraint converts silent-dup into a hard failure (availability bug, not corruption) |
| 8.8 | `mm/…/mm-purchase-orders.controller.ts:80` etc. | `po_number='PO-'+id` derived from serial id at read time | LOW | Unique via serial | Display-only |

## Category 9 — File upload security

| # | Location (file:line) | Issue | Sev | Live evidence | Notes |
|---|---------------------|-------|:---:|---------------|-------|
| 9.1 | `employees-compat-sub.service.ts:27-48` + DTO `compat-body.dto.ts:55` (+ HR variant `hr.dto.ts:49`) | Bulk employee import iterates an **uncapped** array (`.min(1)`, no `.max()`) doing one INSERT per row → memory/DoS. Import is JSON `@Body`, so the global multipart cap doesn't apply | MEDIUM | Sibling DTOs cap (`ai-wms.dto.ts` `.max(10_000)`, `atp-check.dto.ts` `.max(200)`) | Add `.max(N)` |
| 9.2 | `storage.controller.ts:24` · `kanban-card-files.controller.ts:35` · `lms/knowledge-base.controller.ts:33` | `.svg` in the upload allowlist — SVG can carry `<script>` (stored XSS) if served as `image/svg+xml` | MEDIUM | **Mitigated today**: no `.svg` in `MIME_MAP` → served `application/octet-stream` (downloads, doesn't render); no `/uploads` static route | Latent; force `Content-Disposition: attachment`+`nosniff` |
| 9.3 | `storage.controller.ts:94-175` | Primary upload | ✅ CORRECT | `resolveWithinUploads()` path-confinement + ext allowlist + 25MB cap + global `@fastify/multipart {files:1,fileSize}` | Fixes prior pentest path-traversal |
| 9.4 | `kanban-card-files`, `general-legacy-a`, `lms/knowledge-base`, `aisha/voice` | Other uploads | ✅ CORRECT | All: ext allowlist + size cap + filename sanitize (`[^a-zA-Z0-9._-]`→`_`) + `Date.now()` prefix + dir confinement; voice streams to Whisper, never stored | |
| 9.5 | `kanban-reports`, `org-export` (ExcelJS) | Excel handling | ✅ CORRECT | These **write** xlsx for download; **no `xlsx`/`exceljs` parse of uploaded files exists** — the only bulk import is JSON (9.1) | |

---

## Totals by category and severity

| Category | CRITICAL | HIGH | MEDIUM | LOW | Correct/Fixed |
|----------|:---:|:---:|:---:|:---:|:---:|
| 1 — Race conditions | 1 | 4 | 4 | 1 | many |
| 2 — Timezone/date | — | 2 | 2 | 2 | tz correct, most varchar filters normalized |
| 3 — Rounding/float | — | — | 3 | 2 | money numeric, delivery decomp exact |
| 4 — SQL injection | 0 | 0 | 0 | 0 | **all 8 sites safe/fixed** |
| 5 — Tx boundaries | 1 | — | 4 | 1 | order+outbox tx, guarded decrements |
| 6 — Soft/hard delete | — | 3 | 4 | 1 | app-cascade in a few repos |
| 7 — Token expiry | 2 | — | 3 | 1 | ERP apiRequest refresh correct |
| 8 — Barcode/sequence | — | 3 | 4 | 1 | doc-sequences nextval, CC advisory lock |
| 9 — Upload security | — | — | 2 | — | all upload endpoints hardened |
| **Total** | **4** | **12** | **26** | **9** | — |

**51 findings** (4 CRITICAL, 12 HIGH, 26 MEDIUM, 9 LOW). **Category 4 (the designated top priority) is clean.**

---

## Top 10 most critical overall (damage × real-world trigger likelihood)

1. **Payment double-spend + lost-update + no transaction** (1.1 + 5.1) — CRITICAL. Two concurrent payment recordings both pass the overpay guard, both insert, and the absolute-value invoice UPDATE clobbers the first; a GL failure leaves an invoice "paid" with no ledger row. This is *the* money-write path; high concurrency once payments go live. Empty today (payments=0) but the single highest-damage defect.
2. **IoT tablet token silently fails all writes for up to 4h/shift** (7.1 + 7.2) — CRITICAL. BE 8h vs FE 12h TTL, and the tablet fetch has no 401/refresh handling and no refresh endpoint. **Highest trigger-likelihood** on the list: every shift longer than 8 hours loses scan/production-session data with the UI still showing "logged in".
3. **WMS reserve/issue SELECT-then-UPDATE oversell** (1.4) — HIGH. High-traffic goods-issue path reads qty then writes an absolute value with no `WHERE qty>=x`; concurrent issues lose stock. An atomic guarded sibling already exists to adopt.
4. **POS↔warehouse outbound TOCTOU decrement** (1.5) — HIGH. Availability checked before the transaction, decrement unguarded → negative stock / asset oversell on the POS floor path.
5. **GL entry_date is UTC + period-lock is a raw varchar text compare** (2.1 + 2.2) — HIGH. Every GL post 00:00–05:00 Tashkent is mis-dated to the prior day, and the period lock can silently miss (text comparison against varchar period bounds) → a posting lands in a closed period. Money/audit integrity, triggered daily at night-shift boundaries.
6. **`finance_invoices.invoice_number = Date.now()` with no unique constraint** (1.3) — HIGH. Two invoice creates in the same millisecond get the same number, silently, with no DB backstop.
7. **Barcode collision on `pos_barcode_print_queue`** (8.1 + 8.2) — HIGH. No UNIQUE on `barcode` + `COUNT(*)+1` TOCTOU + parallel inserts on the high-traffic POS barcode-printing path → duplicate barcodes that later scan to the wrong item.
8. **Systemic soft-delete read-side unenforced** (6.8, with 6.3/6.4/6.7) — HIGH (latent). Soft-delete is written but ~3 of 95 `material_cards` readers and 1 `accounts` reader filter it; a deleted material scans as live and journals can post to a deactivated account. Bites the moment real soft-deletes exist.
9. **Hard-delete orphans** (6.1 bom_headers, 6.2 okr_objectives) — HIGH. Parents hard-deleted with no child FK/CASCADE/cleanup → orphaned BOM lines and key results.
10. **Duplicate payment/PR numbers** (1.2 sd_payments, 8.3 procurement_requests) — HIGH. No idempotency/unique on either → duplicate customer payments and duplicate PR numbers under concurrency.

*Just below the line:* period-payment tx gaps on the IoT tablet defect/return flows (5.2/5.3), token-refresh multiplication race (7.6), ЦКП 16h deadline 5h too lenient (2.3), uncapped employee-import array (9.1).

---

## Already mitigated correctly (do not read the report as "all broken")

- **SQL injection: fully clean.** All 3 CLAUDE.md sites fixed (PA-S4a/b/c), dynamic identifiers allowlisted (`compare-periods` `ALLOWED` dict, `doc-sequences` regex), dynamic WHERE parameterized + LIKE-escaped, no user-input ORDER BY. Parameterization is pervasive.
- **File uploads: uniformly hardened** — every endpoint has an ext allowlist, 25MB cap, filename sanitization, path-confinement, and the global `@fastify/multipart {files:1,fileSize}` limit; the prior pentest path-traversal is fixed; no spreadsheet-parse-of-upload surface exists.
- **DB timezone is correct** (Asia/Tashkent); the TZ bugs are all JS-side `new Date()`, and `TashkentTimeService` already exists and is used correctly by the cashier crons.
- **Money is `numeric`** in the DB (no float storage); the delivery-GL decomposition is provably exact; the payroll-close balance guard is aligned to the engine tolerance.
- **Atomic guarded stock decrements exist and are used** on the main FG paths: `issueStock` (`WHERE available>=qty RETURNING`), `execIssueFromWarehouseStock`, `execDecrementBatchLot`, `wms-overflow` guarded decrement + `ON CONFLICT` in-tx.
- **Race-free sequence numbering exists** and is the pattern to copy: `doc-sequences.helper` (`nextval`), CC document number (`pg_advisory_xact_lock` + UNIQUE), prikaz seq, `entries.entry_number` (`nextval`+UNIQUE), purchase-requisition seq.
- **Idempotency on the highest-traffic money/stock paths is correct:** `pos_movements` (`movement_number` UNIQUE + `idempotency_key`), GL posting (`findEntryIdByReference`, sequential double-click safe), FG receipt dedup.
- **Multi-write transactions done right:** `create-order.handler` (header + lines + outbox in one tx, rollback-on-throw, events cleared only on commit) — the exemplar the payment handler (5.1) should follow.
- **Main-ERP token handling is correct:** `api-request.ts` does 401→single deduped refresh→retry, distinguishes 403, redirects only after refresh fails. (The gap is the **IoT tablet**, which bypasses this.)

---

## Structural takeaway

The dangerous defects cluster in **two places**: (1) the **finance payment write-chain** (no idempotency, no transaction, absolute-not-additive balance update, non-unique invoice numbers) — every ingredient of a double-spend, currently masked only by empty data; and (2) the **IoT tablet session**, which reinvents fetch/auth without the refresh-retry the main ERP already has, and disagrees with its own backend on token lifetime. Both are fixable by adopting patterns that **already exist elsewhere in this same codebase** (the `create-order` transaction, `doc-sequences` `nextval`, the guarded `issueStock` decrement, the `api-request` refresh flow). The remaining HIGH items — soft-delete read-enforcement, hard-delete cascades, barcode uniqueness — are systemic latent defects that the near-empty build-phase DB is currently hiding. The good news the report deliberately preserves: the single highest-severity *class* asked about (SQL injection) and the upload surface are genuinely clean, and the money **type** discipline (numeric, not float) is right.

---

*Investigation only. No code, migration, seed, or commit performed. Live figures are read-only queries against `europrint` on 2026-07-06; reproduce with `node _audit/q.cjs "…"`.*
