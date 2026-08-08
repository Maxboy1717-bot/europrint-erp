-- ============================================================================
-- seed-demo-03-director-dashboard.sql
-- DEMO / NAMUNA data so the Director/Owner top-level dashboard shows REAL
-- aggregates instead of zeros. Q-40: this is clearly-labelled DEMO data whose
-- only purpose is to demonstrate the dashboard vision end-to-end — NOT a claim
-- of real business activity. Q-46: no working code is changed; data-only INSERT.
--
-- Root cause of the zero KPIs (verified live against canonical DB `europrint`
-- @ localhost:5432) — the director module already queries these exact tables,
-- but they were EMPTY (other agents seeded sibling tables like finance_invoices,
-- warehouse_stock, products — which the director endpoints do not read):
--
--   KPI / widget                     reads table        was   ->  after
--   --------------------------------------------------------------------------
--   kpis.revenue                     invoices(paid)     0     ->  current-month paid SUM
--   finance.totalReceivable/overdue  invoices(by status,amount)  0 -> grouped sums
--   finance-summary.revenueVsLastMonth invoices(amount, cur/prev month) 0 -> %
--   finance-summary.topUnpaidInvoices  invoices(status!=paid, overdue) [] -> rows
--   finance-summary.advancePending   advances(status=pending)    0 -> count
--   kpis.lowStockCount               stock_items(quantity<10)    0 -> low rows
--   kpis.pendingApprovals + stats    approval_requests(pending)  0 -> pending rows
--
-- IDEMPOTENT: every block is guarded by a DEMO marker (invoice_number prefix
-- 'INV-DEMO-', sku prefix 'DEMO-', approval document_number prefix 'AP-DEMO-',
-- advance purpose prefix 'DEMO-') so re-running does not duplicate.
-- ============================================================================

-- ── 1. INVOICES (drives revenue, receivable, overdue, pending, unpaid list) ──
-- invoices.id = uuid (no default) -> gen_random_uuid(); created_by = uuid (no FK).
-- Director-data finance groups by `status` and sums `amount`.
-- KPI revenue sums `paid_amount` WHERE status='paid' AND created_at in this month.
-- dashboard-query repo sums `amount` WHERE status='paid' for current/last month %.
-- So: paid rows in BOTH current and last month (for the trend %), plus a pending
-- and an overdue row (for receivable / top-unpaid widgets).

INSERT INTO invoices
  (id, invoice_number, customer_name, items, subtotal, tax_amount, total_amount,
   amount, paid_amount, status, due_date, created_by, created_at, updated_at)
SELECT v.id, v.invoice_number, v.customer_name, '[]', v.subtotal, v.tax_amount,
       v.total_amount, v.amount, v.paid_amount, v.status, v.due_date,
       gen_random_uuid(), v.created_at, v.created_at
FROM (VALUES
  -- current-month PAID (revenue this month)
  (gen_random_uuid(), 'INV-DEMO-001', 'Tashkent Print Solutions',
     75000000::numeric, 9000000::numeric, 84000000::numeric, 84000000::numeric, 84000000::numeric,
     'paid',   (date_trunc('month', CURRENT_DATE) + INTERVAL '20 days')::timestamp,
     (date_trunc('month', CURRENT_DATE) + INTERVAL '2 days')::timestamp),
  (gen_random_uuid(), 'INV-DEMO-002', 'Samarqand Qogoz MChJ',
     42000000::numeric, 5040000::numeric, 47040000::numeric, 47040000::numeric, 47040000::numeric,
     'paid',   (date_trunc('month', CURRENT_DATE) + INTERVAL '25 days')::timestamp,
     (date_trunc('month', CURRENT_DATE) + INTERVAL '5 days')::timestamp),
  -- last-month PAID (so revenueVsLastMonth % is computable, not 0)
  (gen_random_uuid(), 'INV-DEMO-003', 'Buxoro Karton Zavodi',
     60000000::numeric, 7200000::numeric, 67200000::numeric, 67200000::numeric, 67200000::numeric,
     'paid',   (date_trunc('month', CURRENT_DATE) - INTERVAL '10 days')::timestamp,
     (date_trunc('month', CURRENT_DATE) - INTERVAL '20 days')::timestamp),
  -- PENDING (receivable + pendingAmount)
  (gen_random_uuid(), 'INV-DEMO-004', 'Andijon Bosmaxona',
     30000000::numeric, 3600000::numeric, 33600000::numeric, 33600000::numeric, 0::numeric,
     'pending', (CURRENT_DATE + INTERVAL '15 days')::timestamp,
     (date_trunc('month', CURRENT_DATE) + INTERVAL '1 day')::timestamp),
  -- OVERDUE (receivable + overdueAmount + top-unpaid widget; due_date in the past)
  (gen_random_uuid(), 'INV-DEMO-005', 'Namangan Etiketka',
     18000000::numeric, 2160000::numeric, 20160000::numeric, 20160000::numeric, 0::numeric,
     'overdue', (CURRENT_DATE - INTERVAL '12 days')::timestamp,
     (CURRENT_DATE - INTERVAL '42 days')::timestamp)
) AS v(id, invoice_number, customer_name, subtotal, tax_amount, total_amount,
       amount, paid_amount, status, due_date, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM invoices i WHERE i.invoice_number = v.invoice_number
);

-- ── 2. STOCK_ITEMS (drives kpis.lowStockCount = quantity < 10) ───────────────
-- Mix of low (<10) and healthy stock so the low-stock alert is a realistic count,
-- not "everything is low". product_id references products (49,50 exist) but no FK.

INSERT INTO stock_items
  (product_id, warehouse_id, quantity, cost_price, unit, sku, name, category,
   location, sell_price, is_active, created_at, updated_at)
SELECT v.product_id, v.warehouse_id, v.quantity, v.cost_price, v.unit, v.sku,
       v.name, v.category, v.location, v.sell_price, true, now(), now()
FROM (VALUES
  -- LOW stock (quantity < 10) — these light up the alert
  (49, 1, 4::numeric,    8500::numeric,  'dona', 'DEMO-FG-A4-001',  'Karton quti A4 (DEMO)',        'Tayyor mahsulot', 'A-01-01', 12000::numeric),
  (50, 1, 7::numeric,    15000::numeric, 'dona', 'DEMO-FG-B3-002',  'Gofrokarton quti B3 (DEMO)',   'Tayyor mahsulot', 'A-01-02', 21000::numeric),
  (49, 2, 2::numeric,    9000::numeric,  'kg',   'DEMO-RM-INK-003', 'Bosma siyohi qora (DEMO)',     'Xom ashyo',       'B-02-05', 14000::numeric),
  (50, 2, 9::numeric,    3200::numeric,  'rulon','DEMO-RM-FLM-004', 'Laminatsiya plyonkasi (DEMO)', 'Xom ashyo',       'B-02-06', 4800::numeric),
  -- OUT OF STOCK (quantity = 0) — drives the dashboard `alerts.minStock` widget
  -- (director-data composite uses quantity <= 0, distinct from low-stock < 10)
  (49, 2, 0::numeric,    7500::numeric,  'dona', 'DEMO-FG-EMPTY-007','Konvert C5 (DEMO, tugagan)',  'Tayyor mahsulot', 'A-03-01', 1500::numeric),
  -- HEALTHY stock (>= 10) — so low-stock count stays meaningful, not 100%
  (49, 1, 450::numeric,  8500::numeric,  'dona', 'DEMO-FG-A4-005',  'Karton quti A5 (DEMO)',        'Tayyor mahsulot', 'A-01-03', 9000::numeric),
  (50, 1, 1200::numeric, 2100::numeric,  'kg',   'DEMO-RM-PPR-006', 'Ofset qogoz 80gr (DEMO)',      'Xom ashyo',       'B-01-01', 3100::numeric)
) AS v(product_id, warehouse_id, quantity, cost_price, unit, sku, name, category, location, sell_price)
WHERE NOT EXISTS (
  SELECT 1 FROM stock_items s WHERE s.sku = v.sku
);

-- ── 3. ADVANCES (drives finance-summary.advancePending = status='pending') ───
-- Link to real employees where possible (employees exist; no FK on advances).

INSERT INTO advances (employee_id, amount, status, purpose, created_at, updated_at)
SELECT v.employee_id, v.amount, 'pending', v.purpose, now(), now()
FROM (VALUES
  ((SELECT id FROM employees WHERE deleted_at IS NULL ORDER BY id LIMIT 1),       2500000::numeric, 'DEMO-avans: oilaviy ehtiyoj'),
  ((SELECT id FROM employees WHERE deleted_at IS NULL ORDER BY id OFFSET 1 LIMIT 1), 1500000::numeric, 'DEMO-avans: tibbiy xarajat'),
  ((SELECT id FROM employees WHERE deleted_at IS NULL ORDER BY id OFFSET 2 LIMIT 1), 3000000::numeric, 'DEMO-avans: tahsil tolovi')
) AS v(employee_id, amount, purpose)
WHERE NOT EXISTS (
  SELECT 1 FROM advances a WHERE a.purpose = v.purpose
);

-- ── 4. APPROVAL_REQUESTS (drives kpis.pendingApprovals + stats.pending) ──────
-- status enum = 'pending' (lower-case, per ApprovalStatus.PENDING).
-- requested_at NOT NULL; amount NOT NULL; currency NOT NULL; document_id int NOT NULL.
-- These exceed HITL thresholds so they are plausible director-level approvals.

INSERT INTO approval_requests
  (document_type, document_id, document_number, amount, currency, status,
   requested_by, requested_at, created_at, updated_at)
SELECT v.document_type, v.document_id, v.document_number, v.amount, 'UZS', 'pending',
       (SELECT id FROM users ORDER BY id LIMIT 1), now(), now(), now()
FROM (VALUES
  ('purchase_order',  9001, 'AP-DEMO-PO-001',  72000000::numeric),  -- PO > 50 mln
  ('payment',         9002, 'AP-DEMO-PAY-002', 120000000::numeric), -- payment > 100 mln
  ('discount_override',9003,'AP-DEMO-DSC-003', 18000000::numeric),  -- discount > 15%
  ('inventory_writeoff',9004,'AP-DEMO-WO-004', 11500000::numeric)   -- write-off > 10 mln
) AS v(document_type, document_id, document_number, amount)
WHERE NOT EXISTS (
  SELECT 1 FROM approval_requests r WHERE r.document_number = v.document_number
);

-- ── verification (informational; safe to run) ────────────────────────────────
-- SELECT 'invoices' t, COUNT(*) FROM invoices
-- UNION ALL SELECT 'stock_items_low', COUNT(*) FROM stock_items WHERE quantity < 10
-- UNION ALL SELECT 'advances_pending', COUNT(*) FROM advances WHERE status='pending'
-- UNION ALL SELECT 'approvals_pending', COUNT(*) FROM approval_requests WHERE status='pending';
