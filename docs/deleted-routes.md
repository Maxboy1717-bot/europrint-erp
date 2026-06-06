# Deleted routes / pages / modules — removal log

**Purpose:** a permanent record of everything removed root-and-branch (tomir kesish) during the
DARAJA 1 cleanup and beyond, so nothing silently reappears. If a deleted route/page/module shows
up again, this file is the evidence it was intentionally removed.

**Rule:** Q-39 (kod qotirish) — a removed thing is NOT recreated; a working function is not changed
without permission; no regression (after a change, what worked before must still work — verify).

**Root-and-branch (tomir kesish) checklist per removal:**
1. page/component file deleted
2. router entry removed
3. sidebar entry removed
4. imports cleaned (no dangling references)
5. removal-only helpers/types deleted (only if nothing else uses them)
6. tests deleted/updated
7. logged here

Before deleting a controller/route, confirm the frontend does NOT call it (grep). If it does —
STOP and ask the owner.

## Log

| Date | Removed | Kind | Files / refs removed | Reason | Replacement / canonical | Commit |
|------|---------|------|----------------------|--------|-------------------------|--------|
| 2026-06-03 | `bull`, `@nestjs/bull`, `bcryptjs` | npm deps | apps/api/package.json deps + pnpm-lock | `bull` + `@nestjs/bull` are a dead old-queue pair (live queue stack is `@nestjs/bullmq` + `bullmq`); `bcryptjs` unused (code uses native `bcrypt`). NB: `node-telegram-bot-api` was on the remove-list but is USED (telegram.service.ts:9) so it was KEPT. | `bullmq` / `@nestjs/bullmq` / `bcrypt` | 1.1 (chore(deps)) |
| 2026-06-03 | `/auth`, `/gpt`, `/v2/pos/printer-config` | FE stub routes | artifacts/erp-dashboard/src/routes/StubRoutes.tsx (3 entries) | Dead stub page-routes mapped to the shared `Stub` component (no dedicated page files, not in the sidebar). The APIs `/api/gpt/*` (Settings.tsx:136) and `/api/v2/pos/printer-config/*` (PrinterSettingsTab.tsx:99) are SEPARATE backend endpoints and were KEPT. | KEEP /ai/wms + /pos/printer-config (master plan); auth via auth system | 1.3 (chore(fe)) |
| 2026-06-06 | `PosMovementCompletedEvent` | Domain event + 2 listeners | `apps/api/src/modules/pos/domain/events/pos-movement-completed.event.ts` (deleted); `apps/api/src/modules/pos/application/event-handlers/pos-gl-auto.listener.ts` (deleted — was PosGlAutoListener, @EventsHandler(PosMovementCompletedEvent)); `apps/api/src/modules/pos/application/event-handlers/pos-wms-sync-completed.listener.ts` (deleted — was PosWmsSyncCompletedListener, @EventsHandler(PosMovementCompletedEvent)). Ref sites cleaned: pos.module.ts (providers + imports), pos.module-imports.ts, event-bridge.service.ts, pos-wms-sync.service.ts (import), pos-wms-sync.helpers.ts (interface). | `PosMovementCompletedEvent` had **0 publish() sites** in the codebase — `eventBus.publish(new PosMovementCompletedEvent(...))` was never called. Both listeners were dead duplicate paths: the canonical stock+GL write path is INLINE in `PosMovementStatusService._processCompletedMovement()`. Verified: 4-hop golden thread (warehouse_stock → pos_gl_posting_log → POSTED → entries) live without listeners. | INLINE path in `PosMovementStatusService._processCompletedMovement()` (lines 153-226) — `upsertStockIn/decrementStock` + `glRepo.insertLog()`. GL approval via `POST /api/pos/gl/approve/:movementId`. | overnight-batch A.3 |

## Verified LIVE — looked like duplicate controllers, are NOT (DO NOT DELETE)

The DARAJA-1 1.4 step proposed deleting 4 "duplicate" controllers in
`apps/api/src/modules/compatibility/`. A grep of the frontend (Q-29 verify-before-delete)
proved **all 4 are live-consumed**. They are NOT duplicates: they are *supplementary*
controllers that mount additional real routes under the shared `employees` / `warehouse`
prefixes (NestJS allows many controllers on one prefix). Deleting them = breaking the FE
pages listed below (Q-39 regression). **Step 1.4 was cancelled — these files were NOT touched.**
This row exists so a future "delete duplicate controllers" sweep does not re-attempt it.

| Controller (`modules/compatibility/`) | `@Controller` prefix | Representative routes | FE consumer (proof) |
|----------------------------------------|----------------------|-----------------------|----------------------|
| `employees-compat-sub.controller.ts` (+ `.service.ts`) | `employees` | `:id/{salary-history, bank-accounts, contracts, fines, cash-advances, career, leave-requests, business-trips, passport, ...}` (~40 routes) | `EmployeeProfile.tsx:171` → `/api/employees/${id}/salary-history` (employee-profile tabs) |
| `employees-extra.controller.ts` (+ `acl/employees-extra-acl.ts`) | `employees` | `extra/:id`, `:id` (PATCH), `:id/profile-image`, `:id/corporate-inventory/:itemId/{sign,return}` | `employee-profile/CorporateInventoryTab.tsx:25,36,49,59` → `/api/employees/${id}/corporate-inventory[/.../sign|return]` |
| `warehouse-catalog.controller.ts` (+ `.service.ts`) | `warehouse` | `materials`, `materials/v2`, `movements`, `batches`, `batches/stats`, `batches/:id` (PATCH) | `BarcodeSystem.tsx:61,72,77` + `components/wms/receiving/useGoodsReceivingHooks.ts:116` → `/api/warehouse/{materials, batches, batches/stats}` |
| `warehouse-label.controller.ts` (+ `.service.ts`) | `warehouse` | `label/{print, batches, batches/v2, history, batches/:id/status, print-job}` | `lib/api/wms.ts:52` + `pages/barcode/LabelPrintDialog.tsx:68,92` → `/api/warehouse/label/print` |

**Decision (owner, 2026-06-03):** keep all 4 — live, not duplicate. Lesson: even a deep
analysis mislabeled these as "duplicate"; re-verify in code+FE at execution time before any
delete (Q-29, deepest level).
