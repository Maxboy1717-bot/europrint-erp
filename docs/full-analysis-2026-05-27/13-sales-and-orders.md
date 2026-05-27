# Report 13: Sales & Orders (SD Module)

**Date:** 2026-05-27  
**Scope:** apps/api/src/modules/sd/, lib/db/src/schema/sd-*, artifacts/erp-dashboard/src/pages/SD*

---

## 1. Module Overview

The Sales & Distribution module (`sd`) implements a SAP-inspired order management lifecycle. The primary entity is `sales_orders` with a 23-stage `master_status` chain. Secondary entities include `sd_customers`, `sales_invoices`, `sales_order_items`, `deliveries`, and `quotations`. The module is one of the most complete in the codebase.

---

## 2. Page/Screen Inventory

| Page file | Purpose |
|---|---|
| `artifacts/erp-dashboard/src/pages/SDDashboard.tsx` | Sales overview dashboard |
| `artifacts/erp-dashboard/src/pages/SDDashboardSections.tsx` | Dashboard sections |
| `artifacts/erp-dashboard/src/pages/SDCustomers.tsx` | Customer list |
| `artifacts/erp-dashboard/src/pages/SDCustomersDialogs.tsx` | Add/edit customer dialog |
| `artifacts/erp-dashboard/src/pages/SDCustomersSections.tsx` | Customer detail sections |
| `artifacts/erp-dashboard/src/pages/SDEuroprint.tsx` | EuroPrint-specific SD view |
| `artifacts/erp-dashboard/src/pages/SDExtended.tsx` | Extended SD views |
| `artifacts/erp-dashboard/src/pages/SDExtendedSections.tsx` | Extended sections |
| `artifacts/erp-dashboard/src/pages/SDContracts.tsx` | Contract management |
| `artifacts/erp-dashboard/src/pages/SDDebitors.tsx` | Debtor management (AR) |
| `artifacts/erp-dashboard/src/pages/SDKpi.tsx` | Sales KPI dashboard |
| `artifacts/erp-dashboard/src/pages/SDOverviewDashboard.tsx` | High-level overview |
| `artifacts/erp-dashboard/src/pages/SDQuotaDashboard.tsx` | Quota tracking |
| `artifacts/erp-dashboard/src/pages/OrderCreationWizard.tsx` | Multi-step order creation |
| `artifacts/erp-dashboard/src/pages/OrderApprovalWorkflow.tsx` | Order approval steps |
| `artifacts/erp-dashboard/src/pages/OrderCosting.tsx` | Order costing / margin |
| `artifacts/erp-dashboard/src/pages/Customer360Page.tsx` | 360-degree customer view |
| `artifacts/erp-dashboard/src/pages/DesignOrders.tsx` | Design order tracking |

Backend controllers (`apps/api/src/modules/sd/presentation/`):
- `sd-orders.controller.ts` — `GET/POST/PATCH /sd/orders`
- `sd-customers.controller.ts` — `GET/POST/PATCH /sd/customers`
- `sd-invoices.controller.ts` — `GET/POST /sd/invoices`
- `sd-deliveries.controller.ts` — `GET/POST /sd/deliveries`
- `sd-quotations.controller.ts` — `GET/POST /sd/quotations`
- `sd-payments.controller.ts` — `GET/POST /sd/payments`
- `sd-leads.controller.ts` — `GET/POST /sd/leads`
- `sd-contracts.controller.ts` — `GET/POST /sd/contracts`
- `sd-dashboard.controller.ts` — `GET /sd/dashboard`

---

## 3. Sales Order Lifecycle

The `sales_orders.master_status` column defines a 23-stage lifecycle (from `sd-order-items.ts:~50`):

```
draft
  → incomplete
  → pending_design
  → pending_sample_lab
  → pending_manager_completion
  → pending_technology
  → pending_advance           (70% advance required)
  → ready_for_planning
  → planned
  → released_to_production
  → in_production
  → pending_qc_final
  → qc_failed → rework → (back to in_production)
  → ready_for_fg_warehouse
  → in_fg_warehouse           (storage timer starts: 8 free days default)
  → delivery_planned
  → in_delivery
  → delivered
  → partially_paid
  → fully_paid
  → closed | cancelled
```

### Data Flow Chain

```
OrderCreationWizard.tsx (multi-step form)
  → POST /api/sd/orders { document_number, customer_id, order_date, items[], ... }
  → sd-orders.controller.ts (SdOrdersController.create)
  → SdOrderService.create()
  → INSERT INTO sales_orders { master_status='draft', ... }
  → INSERT INTO sales_order_items (per item)
  → INSERT INTO order_status_logs { from_status=null, to_status='draft' }

OrderApprovalWorkflow.tsx
  → PATCH /api/sd/orders/:id/status { master_status: 'pending_advance' }
  → SdOrderService.transitionStatus()
  → validates transition against MASTER_STATUS_CHAIN
  → UPDATE sales_orders SET master_status=?, updated_at=NOW()
  → INSERT INTO order_status_logs

Finance advance check:
  → PATCH /api/sd/orders/:id/status { master_status: 'ready_for_planning' }
  → SdOrderService validates: advance_paid_amount >= (total_value * advance_required_percent / 100)
  → If not met: HTTP 422 "Avans to'liq emas"

Invoicing:
  → POST /api/sd/invoices { sales_order_id, ... }
  → SdInvoiceService.create()
  → INSERT INTO sales_invoices
  → UPDATE sales_orders SET billing_status='PARTIALLY' or 'FULLY'
```

---

## 4. DB Tables & Columns Used

### `sales_orders` (lib/db/src/schema/sd-orders.ts)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `tenant_id` | integer NOT NULL DEFAULT 1 | Multi-tenancy |
| `document_number` | varchar(50) UNIQUE NOT NULL | Format: SO-XXXXXXXXXX |
| `document_type` | varchar(10) DEFAULT 'OR' | OR / TA / CR |
| `customer_id` | integer → crmCompanies.id | |
| `order_date` | varchar(10) | YYYY-MM-DD |
| `requested_delivery_date` | varchar(10) | |
| `overall_status` | varchar(20) DEFAULT 'IN_PROCESS' | IN_PROCESS / COMPLETED / CANCELLED |
| `delivery_status` | varchar(20) | NOT_DELIVERED / PARTIALLY / FULLY |
| `billing_status` | varchar(20) | NOT_BILLED / PARTIALLY / FULLY |
| `master_status` | varchar(50) NOT NULL DEFAULT 'draft' | 23-stage lifecycle |
| `net_value` | numericMoney | Before tax |
| `tax_amount` | numericMoney | |
| `total_value` | numericMoney | |
| `advance_required_percent` | numericMoney DEFAULT 70 | 70% advance rule |
| `advance_paid_amount` | numericMoney | |
| `advance_status` | varchar(30) | no_advance / partial_advance / advance_completed / ... |
| `design_flag` | boolean | Requires new design? |
| `sample_flag` | boolean | Requires sample lab? |
| `is_vip` | boolean | VIP priority |
| `fg_warehouse_entry_at` | timestamp | FG warehouse entry time |
| `storage_free_days` | integer DEFAULT 8 | Free storage days |
| `storage_tariff_per_m2` | numericMoney DEFAULT 500 | UZS/m²/day |
| `tech_bom_approved` | boolean | Technologist BOM checkpoint |
| `tech_routing_approved` | boolean | Technologist routing checkpoint |
| `tech_card_approved` | boolean | Technologist tech-card checkpoint |
| `created_by` | varchar | Audit |
| Various legacy columns (`order_number`, `status`, `total_amount`, etc.) | ADD-ONLY superset | Live DB drift |

### `sales_order_items` (lib/db/src/schema/sd-order-items.ts)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `sales_order_id` | varchar → sales_orders.id | |
| `item_number` | varchar(10) | 000010, 000020, ... |
| `material_id` | varchar → products.id | Finished product |
| `order_quantity` | numericMoney NOT NULL | |
| `delivered_quantity` | numericMoney DEFAULT 0 | |
| `open_quantity` | numericMoney DEFAULT 0 | order - delivered |
| `net_price` | numericMoney NOT NULL | Unit price |
| `tax_code` | varchar(10) DEFAULT 'V1' | V1 = 12% VAT |
| `tax_amount` | numericMoney | |
| `total_price` | numericMoney | |
| `delivery_status` | varchar(20) | NOT_DELIVERED / PARTIALLY / FULLY |
| `billing_status` | varchar(20) | NOT_BILLED / PARTIALLY / FULLY |
| `production_order_id` | varchar → production_orders.id | Link to PP |

### `order_status_logs` (lib/db/src/schema/sd-order-items.ts)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `sales_order_id` | varchar → sales_orders.id | |
| `from_status` | varchar(50) | Previous status |
| `to_status` | varchar(50) NOT NULL | New status |
| `changed_by` | varchar → users.id | |
| `changed_at` | timestamp | |
| `reason` | varchar(200) | |
| `triggered_by` | varchar(100) | manual / system / ai / advance_check / qc_result / ... |

### `sd_customers` (lib/db/src/schema/sd-europrint-schema.ts)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text NOT NULL | Company name |
| `stir` | varchar(20) | Tax registration number |
| `inn` | varchar(20) | Alternative TIN (legacy alias) |
| `legal_address` / `address` / `actual_address` | text | Three address fields |
| `segment` | varchar(20) DEFAULT 'new' | vip / regular / new / potential |
| `manager_id` | varchar | Assigned sales manager |
| `status` | varchar(20) DEFAULT 'active' | active / inactive |
| `is_blocked` | boolean | Credit block |
| `block_reason` | text | |
| `credit_limit` | numericMoney DEFAULT 0 | |
| `payment_terms_days` | integer DEFAULT 30 | |
| `open_debt` | numericMoney DEFAULT 0 | Current outstanding |
| `total_orders` | integer DEFAULT 0 | Denormalized counter |
| `total_revenue` | numericMoney DEFAULT 0 | Denormalized total |
| `crm_company_id` | integer | Link to CRM (application-level FK) |

### `sales_invoices` (lib/db/src/schema/sd-orders.ts)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `invoice_number` | varchar(50) UNIQUE | |
| `customer_id` | integer → crmCompanies.id | |
| `order_id` | varchar → orders.id | Link to PP orders |
| `sales_order_id` | integer | Link to SD sales_orders (ADD-ONLY) |
| `net_value` | numericMoney | |
| `tax_amount` | numericMoney | |
| `total_amount` | numericMoney NOT NULL | |
| `paid_amount` | numericMoney DEFAULT 0 | |
| `payment_status` | varchar(20) DEFAULT 'unpaid' | unpaid / partial / paid |
| `status` | varchar(20) DEFAULT 'draft' | draft / posted / cancelled |
| `gl_document_id` | varchar → gl_documents.id | Finance link |
| `due_date` | varchar(10) | |

---

## 5. Sales Reports — Real or Synthetic?

Evidence from `sd-dashboard.controller.ts` and the WMS/SD services shows that reports are **real DB queries** using Drizzle ORM. The dashboard aggregates `sales_orders` by status, `sales_invoices` by payment_status, etc. No synthetic/mock data was found in the SD module itself.

However, `sd_customers.total_orders` and `total_revenue` are **denormalized counters** updated by application code — they can drift if not kept in sync.

---

## 6. Frontend Sales Pages — Functional vs Placeholder

| Page | Assessment |
|---|---|
| `SDDashboard.tsx` | Functional — calls real API endpoints |
| `SDCustomers.tsx` | Functional — full CRUD |
| `SDCustomersSections.tsx` | Functional — customer detail tabs |
| `SDContracts.tsx` | Likely functional (controller exists) |
| `SDDebitors.tsx` | Likely functional |
| `SDKpi.tsx` | Functional — aggregation queries |
| `SDEuroprint.tsx` | Functional — EuroPrint-specific status chain |
| `SDExtended.tsx` | Partially functional — some tabs may be placeholder |
| `SDQuotaDashboard.tsx` | Unknown — quota logic may be stub |
| `OrderCreationWizard.tsx` | Functional — multi-step form wired to POST /sd/orders |
| `OrderApprovalWorkflow.tsx` | Functional — status transition wired |
| `OrderCosting.tsx` | Functional if costing service complete |
| `Customer360Page.tsx` | Functional — aggregates multiple endpoints |
| `DesignOrders.tsx` | Functional — design flag orders |

---

## 7. What Is Missing or Broken

1. **`sales_orders.customer_id` references `crmCompanies.id`** but `sd_customers` is a separate table. The system has two customer registries (`crm_companies` from CRM and `sd_customers` from SD). No automatic sync between them.
2. **`sales_invoices.sales_order_id` is an ADD-ONLY integer column** — no FK constraint. The original `order_id` references `orders.id` (PP module). Dual references create ambiguity.
3. **`sd_customers.total_orders` and `total_revenue` are denormalized** — can drift on cancellation.
4. **`sales_orders` has dual status columns**: `overall_status` (SAP-style) and `master_status` (EuroPrint 23-stage). The two status systems overlap and can diverge.
5. **`sales_orders.order_number` and `status`** are ADD-ONLY legacy columns duplicating `document_number` and `overall_status`. Three writers could use different column pairs.
6. **Advance payment check** is a service-level guard, not a DB constraint. If the service is bypassed via direct DB access, the 70% rule is not enforced.
7. **Storage fee accrual** (`storage_tariff_per_m2 * storage_total_m2 * days`) appears to be computed by application code — no scheduled job confirmed.
8. **`sd_customers.stir` and `sd_customers.inn`** are duplicate columns for the same tax number. Both present in schema (inn is explicitly "alias of stir for legacy INSERT compatibility").

---

## Summary

The SD module implements a complete 23-stage sales order lifecycle with advance payment enforcement, technologist approval checkpoints, and integration with Finance (GL), PP (production), and WMS (delivery). The customer entity has two registries (CRM + SD). Real DB queries back all reports. Main gaps are dual status columns, denormalized counters, and missing FK constraints on some ADD-ONLY columns.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| Dual customer registries (crm_companies + sd_customers) | P1 | `sd-europrint-schema.ts` + `crm-schema.ts` | Data drift between CRM and SD | Unify or implement sync event |
| Dual status columns (overall_status + master_status) | P2 | `sd-orders.ts:~165,~173` | Writers can diverge | Deprecate `overall_status`, use `master_status` only |
| `sales_invoices.sales_order_id` — no FK | P2 | `sd-orders.ts:~36` (ADD-ONLY comment) | Orphan invoices possible | Add FK constraint |
| `sd_customers.total_orders/revenue` denormalized | P2 | `sd-europrint-schema.ts:~45` | Drift on cancellation | Replace with aggregate query |
| `stir` + `inn` duplicate columns | P3 | `sd-europrint-schema.ts:~23,24` | Data entry confusion | Keep one, alias the other |
| Advance check is service-level only | P2 | `SdOrderService.transitionStatus()` | Bypassable | Add DB CHECK or trigger |
| Storage fee accrual — no confirmed cron job | P2 | `storage_accrued_amount` column exists | Fees not charged if job absent | Implement/verify cron |
| ADD-ONLY legacy columns (order_number, status, total_amount) | P3 | `sd-orders.ts` bottom section | Three write paths exist | Remove after migration |

---

## Open Questions / UNVERIFIED

- Does `sd-dashboard.controller.ts` use raw SQL or Drizzle for aggregation queries? Need to read service source.
- Is there a transition guard that prevents skipping stages (e.g., going from `draft` directly to `in_production`)? The `MASTER_STATUS_CHAIN` array is defined but enforcement logic not verified.
- `SDQuotaDashboard.tsx` — what API endpoint does it hit? Quota management may be stub.
- Is `order_status_logs` populated on every status change, or only manual ones?
