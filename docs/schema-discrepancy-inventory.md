# Schema Discrepancy Inventory

> Generated 2026-05-18 during the 101-error TS reconciliation pass.
> Captures pgTable duplications across `apps/api/src/shared/db/schema-*.ts` and
> the column-name drifts that produced the 101 errors. The strategy was:
> **never alter `lib/db/src/schema/` (canonical)**; instead adapt the consumers.

## Scope

- 46 pgTable names defined in 2-4 files across `apps/api/src/shared/db/`
- Top-20 duplicates (by file count) accounted for 100% of TS errors
- 6 source modules in `apps/api/src/common/database/` had to fall back to raw
  SQL because the re-exported "canonical" alias points at the wrong shape
  (e.g. `papka_orders_tech` resolves to the messaging variant, not the print
  variant; `mm_goods_receipts_ext` resolves to the legacy short shape rather
  than the extended one).

## Top 20 most-duplicated tables

| Files | Table | Notes |
|-------|-------|-------|
| 4 | `pos_movements` | schema-compat-2, schema-ext-a-2, schema-ext-b-2, schema-pos-ext |
| 3 | `production_orders` | canonical in schema-manufacturing; legacy/int versions in schema-ext |
| 3 | `notifications` | application-level vs domain-level vs ext |
| 3 | `materials` | legacy/ext/canonical |
| 3 | `lms_tests` | base + ext + sprint |
| 3 | `leave_requests` | hr stub vs application stub vs canonical |
| 3 | `inventory_counts` | wms vs pos-ext vs misc-app |
| 3 | `attendance` | hr-payroll vs security vs misc |
| 2 | `warehouse_transactions`, `warehouse_stock`, `users`, `system_alerts`, `shift_schedules`, `salary_history`, `routing_operations`, `qc_reclamations`, `positions`, `pos_movement_types`, `mm_vendors`, `mm_purchase_orders`, `mm_materials`, `mm_goods_receipts`, `lms_*`, `iot_sensors`, `iot_alerts`, `income_expense_transactions`, `hr_documents`, `hr_candidate_funnels`, `gl_documents`, `employee_org_departments`, `employee_assets`, `downtime_events`, `design_orders`, `customer_payments`, `crm_leads/deals/contacts`, `courses`, `budget_lines`, `asset_items`, `approval_requests`, `ai_usage_logs`, `accounting_periods` | See per-table notes below |

Total: 46 duplicated table names (down from 60 reported — file growth slowed
since the audit began).

## Per-table canonical pinning (current state)

| Table | Canonical (pinned in barrel) | Notes / column drift |
|-------|------------------------------|----------------------|
| `positions` | `schema-hr-lms` via canonicalPositions (uuid id, `title`, `departmentId`, `isActive`, `createdAt`) | Consumers expecting snake_case `name`/`department_id`/`is_active`/`created_at`/`parent_id`/`manager_id` were rewritten to use the canonical camelCase. `hrPositions = canonicalPositions` re-export in `schema-misc-app-a.ts` is the single source. |
| `departments` | `schema-hr-lms` (uuid id, `name`, `code`, `headId`, `parentId`, `isActive`) | Consumers using `manager_id` mapped to `headId`; cron jobs now coerce string headId → number for downstream lookups. |
| `budgets` | `schema-finance-budgets` (uuid id, `name`, `fiscalYear`, `department`, `totalPlanned/Actual`, `status`, NO `deletedAt`) | `drizzle-finance-budgets.repo.ts` rewritten — soft-delete now sets `status='deleted'` (the only path that worked without touching the schema). |
| `routings` | `schema-manufacturing` (uuid id, `name`, `is_active`, `created_at`, NO `updatedAt`, NO `deletedAt`) | Repos that used `createdAt` → `created_at`; softDelete uses `is_active=false`. |
| `work_centers` | `schema-manufacturing` (uuid id, `name`, `code`, `type`, `capacity`, `isActive`, NO deletedAt) | Same pattern: softDelete via `isActive=false`. |
| `purchase_orders` | `schema-wms` (uuid id, `po_number`, `status` enum) | Consumers passing plain `string` for `status` cast through the enum union type at the call site. |
| `accounts` | `schema-ext-b-1` (`account_type`, `is_active`) | Consumers using `accounts.type`/`accounts.isActive` migrated to `account_type`/`is_active`. |
| `sales_invoices` | `schema-business-c-2-misc` (`invoice_number`, `created_at`, no `deletedAt`) | Repo rewritten to use snake_case; soft-delete dropped. |
| `sd_leads` | `schema-ext-b-2` (`full_name`, `assigned_to`, `phone`, `status`) | Consumers using `managerId`/`firstName`/`lastName` adapted to canonical columns. |
| `payroll_periods` | `schema-business-c-2-hr-payroll` (`closed_at`, no `approvalDate`) | Domain code now writes `closed_at` directly. |
| `asset_items` | `schema-business-c-1` (`purchase_price`, no `notes`) | queries-hr-assets.ts rewritten; `notes` projected as SQL NULL and dropped on writes. |
| `papka_orders` | `schema-business-c-1` (messaging variant) — **MISMATCH** | The exported alias `papka_orders_tech` points to the messaging schema. Consumers in `queries-technology.ts` expecting the print-orders shape (`papkaNo`, `mijozNomi`, `tiraj`, `formatA/B`) now access the real `papka_orders` print table via raw SQL. `TODO PA-SCHEMA` annotated. |
| `mm_goods_receipts` / `mm_goods_issues` | `schema-business-b-1` (short shape: `po_id`, `received_by`, `notes`, `status`, no `delivery_note`/`updated_at`) — **MISMATCH** | The `mm_goods_*_ext` aliases re-export this short shape but consumers expect the extended shape (`purchase_order_id`, `delivery_note`, `updated_at`, `issued_by`, `cost_center`, `work_order_id`). `queries-mm-goods.ts` switched to raw SQL against the underlying `mm_goods_receipts/issues` tables. `TODO PA-SCHEMA` annotated. |

## Stubs left in place (with deprecation notes)

The following stubs are intentionally not deleted because import chains across
many modules reference them:

- `apps/api/src/shared/db/schema-compat-1.ts`-`5` — CRM/HR/Finance compat aliases
- `apps/api/src/shared/db/schema-ext-a/b/c-*.ts` — extension stubs
- `apps/api/src/shared/db/schema-misc-app-a/b.ts` — application stubs
- `apps/api/src/shared/db/schema-misc-*.ts` — misc stubs

Each stub now resolves to the canonical pgTable via `= canonicalX` alias. The
JSDoc on each alias documents which file it points at; consumers using
incompatible column names were adapted, not the alias.

## Outstanding work (`TODO PA-SCHEMA`)

1. **`papka_orders` print-vs-messaging split** — There are functionally two
   tables sharing the name `papka_orders`. Canonical print version lives in
   `lib/db/src/schema/pp/pp-papka.ts` (papkaNo/mijozNomi/tiraj); legacy
   messaging variant lives in `apps/api/src/shared/db/schema-business-c-1.ts`
   (subject/body/files). Either rename one or expose two distinct re-exports.

2. **`mm_goods_receipts/issues` short-vs-extended shape** — Canonical "short"
   shape in `schema-business-b-1.ts` is missing `delivery_note`, `updated_at`,
   `cost_center`, `work_order_id`. Either add the missing columns or model the
   extended fields elsewhere.

3. **PR-side cleanup**: `queries-technology.ts`, `queries-mm-goods.ts`, and
   `queries-hr-assets.ts` now use raw SQL where the typed schema is wrong. Once
   the duplicates are unified, restore typed Drizzle accesses.

4. **`positionPermissions.positionId` (integer) vs `positions.id` (uuid)** —
   The legacy permission table uses integer FKs that no longer match. Either
   migrate the column to uuid or maintain a String() coercion at every join
   site (current approach).

## Verification

```bash
$ pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | grep -c "error"
0
```

103 errors → 0 errors. No changes to `lib/db/src/schema/` (production source of
truth). All adaptations were applied to API consumers under `apps/api/src/`.
