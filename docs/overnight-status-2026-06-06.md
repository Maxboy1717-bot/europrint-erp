# EuroPrint ERP — Overnight Batch Status Report
**Date:** 2026-06-06 | **Branch:** chore/schema-convergence | **Role:** 🟢 Bajaruvchi (owner pre-approved)

---

## Commits made this session

| Hash | Batch | Description |
|------|-------|-------------|
| `26490996` | A.1 | `feat(gl): seed INTERNAL_TRANSFER + INVENTORY_ADJ_MINUS gl_account_mappings` |
| `ba428f1c` | A.3 | `chore(pos): remove dead PosMovementCompletedEvent duplicate listeners` |
| `091a07fb` | C.1 | `fix(fe): ForecastAnalytics POST /api/forecasts/run → /api/sales/forecast/generate` |
| `27ce1ab1` | C.1 | `fix(fe): SDSalesManagement POST /api/sd/forecast/generate → /api/sales/forecast/generate` |

---

## BATCH A — POS golden thread

### A.1 — gl_account_mappings seed ✅ DONE
- Added 2 missing rows to `gl_account_mappings`: `INTERNAL_TRANSFER` (Dr 1010/Cr 1010) + `INVENTORY_ADJ_MINUS` (Dr 9500/Cr 1010)
- Table: 6 rows → 8 rows. Idempotent (skips if already exists).
- Script: `_audit/seed-gl-mappings.cjs` (committed `26490996`)

### A.2 — 4-hop golden thread live proof ✅ CONFIRMED
All 4 hops verified via live HTTP against :3030 (host node `dist/main`):

| Hop | What | Proof |
|-----|------|-------|
| HOP 1 | `warehouse_stock.quantity` 10→20 (EXTERNAL_IN +10 units, material_id=18, warehouse_id=16) | DB: `SELECT quantity FROM warehouse_stock WHERE...` → 20 |
| HOP 2 | `pos_gl_posting_log` id=2, status=`AWAITING_REVIEW`, gl_entries JSON populated | DB: `SELECT status FROM pos_gl_posting_log WHERE id=2` → AWAITING_REVIEW |
| HOP 3 | `POST /api/pos/gl/approve/2 {}` → status=`POSTED`, approved_by=1 | HTTP 200, DB confirmed |
| HOP 4 | `entries` id=7, entry_number=`POS-GL-2`, Dr=1010, Cr=6000, amount=25000 | DB: `SELECT * FROM entries WHERE id=7` → confirmed |

**Inline path confirmed canonical.** `_processCompletedMovement()` in `PosMovementStatusService` (lines 153-226) is the live writer.

**GL correction (vs prior reports):** `gl_account_mappings` already had 6 rows before A.1 (prior audit said "empty"). The gap was only 2 missing types (now seeded). `postMovementToLedger()` was blocked by missing INTERNAL_TRANSFER + INVENTORY_ADJ_MINUS lookups, not by a code bug.

### A.3 — Delete dead event path ✅ DONE
**Deleted (3 files):**
- `pos/domain/events/pos-movement-completed.event.ts`
- `pos/event-handlers/pos-gl-auto.listener.ts` (`PosGlAutoListener`)
- `pos/event-handlers/pos-wms-sync-completed.listener.ts` (`PosWmsSyncCompletedListener`)

**Cleaned (6 files):**
- `pos.module.ts` — providers + imports list (both dead listeners removed)
- `pos.module-imports.ts` — re-exports (kept `PosWmsSyncCreatedListener`)
- `event-bridge.service.ts` — `PosMovementCompletedEvent` bridge entry removed
- `pos-wms-sync.service.ts` — `onMovementCompleted` method removed; unused imports (`broadcastPosEvent`, `upsertWarehouseStock`) removed; docstring updated
- `pos-wms-sync.helpers.ts` — `PosMovementCompletedEvent` interface removed
- `docs/deleted-routes.md` — permanent removal record added

**Why safe:** `PosMovementCompletedEvent` had **0 `eventBus.publish()` call sites** in the entire codebase. Both `@EventsHandler` listeners were dead code that would have written duplicate `pos_gl_posting_log` rows identical to the live inline path if the event had ever been emitted.

**Typecheck:** `pnpm --filter @europrint/api exec tsc --noEmit` = 0 errors before and after.

---

## BATCH C — FE URL drift fixes

### C.1 — 2 forecast URL drifts ✅ DONE

| File | Before | After | Reason |
|------|--------|-------|--------|
| `ForecastAnalytics.tsx:95` | `POST /api/forecasts/run` | `POST /api/sales/forecast/generate` | No `/api/forecasts/*` controller exists in BE |
| `SDSalesManagement.tsx:108` | `POST /api/sd/forecast/generate` | `POST /api/sales/forecast/generate` | No `/api/sd/forecast/*` controller; canonical is `@Controller('sales')` + `@Post('forecast/generate')` in `sd/sales/sales.controller.ts` |

Also fixed stale `invalidateQueries` keys: `/api/forecasts` → `/api/sales/forecast` and `/api/sd/forecast` → `/api/sales/forecast`.

**Pre-commit URL mismatch count:** 9 → 7 (2 fixed). Remaining 7 are pre-existing camera/CRM-AI-extended endpoints, outside batch scope.

---

## BATCH D — SAP 4-phase read-only audit ✅ DONE (pre-compaction session)

**Output:** `docs/audit/SAP-AUDIT-2026-06-06.md` (5,322 lines, untracked — read-only, no commit needed per protocol)

**Key findings:**
| Metric | Count |
|--------|-------|
| REAL (haqiqiy INSERT/UPDATE/SELECT) | 479 |
| 501-STUB (halol NOT_IMPLEMENTED) | 57 |
| GREEN-LIE (200 qaytaradi, yozmaydi) | 60 |
| DUPLICATE (parallel jadval/route/olam) | 56 |
| ORPHAN (o'lik — yozuvchi/chaqiruvchi yo'q) | 55 |
| FAKE-DATA (hardcoded son/matn) | 40 |

**SAP score:** ~25-30% of SAP functionality. Foundation B (🟢), working ERP D+ (🔴).
- Backend internals: ~85% (DDD/CQRS/Result/4 global guard — professional)
- Screens: ~57% (132+ FE pages visible)
- Cross-module integration: ~15% (10 backbone links, ~1 working)
- Operational data: ~0-2% (build stage — tables mostly empty)

**Top 3 blockers to SAP:**
1. `manager_id` 0/30 NULL — no manager routing possible
2. Canonical order table not chosen — 2-worlds (sd_sales_orders ╳ orders) still coexist
3. GL auto-posting listener — POS golden thread requires manual approve step (no auto-listener)

---

## Hard boundaries NOT crossed

| Boundary | Status |
|----------|--------|
| GL #76: `gl_lines → entries` migration (costCenterId/profitCenterId mismatch) | ✅ Not touched |
| 12 uuid→int FK migration | ✅ Not touched |
| `manager_id` backfill | ✅ Not touched |
| Outbox extension | ✅ Not touched |
| Camera/CRM FE URLs | ✅ Not touched |
| New tables/migrations | ✅ None created |
| `stocks` table | ✅ Not touched (cardboard warehouse) |
| `gl_journal_entries` / `gl_lines` | ✅ Not touched |
| JWT minting | ✅ None |
| `git add -A` | ✅ Never used — all adds by explicit file path |

---

## Known-state after this session

- `pos_gl_posting_log` rows: 2 (id=1 manual test from earlier, id=2 from A.2 demo — both POSTED)
- `entries` rows: 7 (includes POS-GL-1, POS-GL-2 from demo)
- `warehouse_stock` id=1: quantity=20, material_id=18, warehouse_id=16 (from A.2 demo)
- `gl_account_mappings`: 8 rows (was 6; added INTERNAL_TRANSFER + INVENTORY_ADJ_MINUS)
- Pre-commit URL mismatches: 7 (was 9; cameras×3 + crm/ai/extended×4 are pre-existing, out of scope)
- TypeScript: 0 errors (both BE and FE)
- Schema-dup ratchet: 166 (unchanged)

---

*Report generated: 2026-06-06 overnight batch. Bajaruvchi roli (code changes only within pre-approved scope).*
