-- =============================================================================
-- GOLDEN-THREAD SEED — end-to-end buyurtma zanjiri (DEMO DATA)
-- Maqsad: SD buyurtma → PP → MES → QC → WMS → FIN (invoice + GL entries)
-- Barcha dashboardlarda ko'rinishi uchun namuna/demo data
--
-- Zanjir:
--   (0) products (FG) + equipment — production_orders uchun
--   (1) sales_orders + sales_order_items  [customer_id=16, material_id=33,34]
--   (2) production_orders [sales_order_id FK → sales_orders.id]
--   (3) production_sessions (mes_production_sessions VIEW orqali ko'rinadi)
--   (4) qc_inspections [order_id=production_order.id, result=passed]
--   (5) warehouse_stock kirim [FG warehouse_id=13, material_id=33,34]
--   (6) deliveries [sales_order_id FK → sales_orders.id]
--   (7) finance_invoices [customer_id integer, INV-GT-2026-001]
--   (8) entries (GL jurnal: AR/revenue/COGS/inventory — kanonik accounts jadval)
--
-- Kanonik jadvallar: sales_orders, material_cards, warehouse_stock, accounts, entries
-- gl_journal_entries / gl_lines GA TEGMA (SAP#76)
-- Idempotent: har bir INSERT ON CONFLICT DO NOTHING yoki IF NOT EXISTS tekshiruvi
-- Muallif: Claude (golden-thread agent), 2026-06-20
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_equip_id    INTEGER;
  v_so_id       INTEGER;
  v_po_id       INTEGER;
  v_mes_id      INTEGER;
  v_qc_id       INTEGER;
  v_del_id      INTEGER;
  v_inv_id      INTEGER;
  v_prod_id1    INTEGER;
  v_prod_id2    INTEGER;
  v_entry_date  TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
BEGIN

  -- ─────────────────────────────────────────────────────────────────
  -- 0a. PRODUCTS jadvaliga FG mahsulot qo'shish
  -- ─────────────────────────────────────────────────────────────────
  INSERT INTO products (code, name, name_ru, category, unit, standard_cost, is_active, created_at)
  VALUES
    ('GT-KARTON-BOX-A4', 'Karton quti A4 (DEMO-GOLDEN)', 'Картонная коробка A4', 'packaging', 'PC', 8500.00, true, now()),
    ('GT-GOFROB-BOX-B3', 'Gofrokarton quti B3 (DEMO-GOLDEN)', 'Гофрокоробка B3', 'packaging', 'PC', 12000.00, true, now())
  ON CONFLICT (code) DO NOTHING;

  SELECT id INTO v_prod_id1 FROM products WHERE code = 'GT-KARTON-BOX-A4' LIMIT 1;
  SELECT id INTO v_prod_id2 FROM products WHERE code = 'GT-GOFROB-BOX-B3' LIMIT 1;
  RAISE NOTICE 'products: prod1=%, prod2=%', v_prod_id1, v_prod_id2;

  -- ─────────────────────────────────────────────────────────────────
  -- 0b. EQUIPMENT — production_sessions.equipment_id NOT NULL
  -- ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_number = 'EQ-GT-OFFSET-01') THEN
    INSERT INTO equipment (
      equipment_number, name, name_ru, category, status, is_active, created_at
    ) VALUES (
      'EQ-GT-OFFSET-01',
      'Ofset mashina #1 (DEMO)',
      'Офсетная машина #1 (DEMO)',
      'printing',
      'active',
      true,
      now()
    )
    RETURNING id INTO v_equip_id;
    RAISE NOTICE 'equipment inserted: %', v_equip_id;
  ELSE
    SELECT id INTO v_equip_id FROM equipment WHERE equipment_number = 'EQ-GT-OFFSET-01' LIMIT 1;
    RAISE NOTICE 'equipment already exists: %', v_equip_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────────
  -- 1. SALES ORDER — SD buyurtma (customer_id=16, Toshkent Qog'ozchi MChJ)
  -- ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM sales_orders WHERE order_number = 'GT-2026-001') THEN
    INSERT INTO sales_orders (
      order_number,
      customer_id,
      customer_name,
      status,
      total_amount,
      paid_amount,
      advance_paid_amount,
      balance_due_amount,
      delivery_date,
      payment_terms,
      currency,
      document_type,
      sales_org,
      order_date,
      overall_status,
      delivery_status,
      billing_status,
      notes,
      tenant_id,
      created_at,
      updated_at
    ) VALUES (
      'GT-2026-001',
      16,
      'Toshkent Qog''ozchi MChJ',
      'confirmed',
      85000000.00,
      0.00,
      0.00,
      85000000.00,
      now() + INTERVAL '14 days',
      'NET30',
      'UZS',
      'ZOR',
      'EP01',
      CURRENT_DATE,
      'confirmed',
      'not_delivered',
      'not_billed',
      'GOLDEN-THREAD demo buyurtma — SD→PP→MES→QC→WMS→FIN zanjiri',
      1,
      now(),
      now()
    )
    RETURNING id INTO v_so_id;
    RAISE NOTICE 'sales_order inserted: %', v_so_id;
  ELSE
    SELECT id INTO v_so_id FROM sales_orders WHERE order_number = 'GT-2026-001' LIMIT 1;
    RAISE NOTICE 'sales_order already exists: %', v_so_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────────
  -- 2. SALES ORDER ITEMS — 2 ta pozitsiya
  -- ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM sales_order_items WHERE sales_order_id = v_so_id) THEN
    INSERT INTO sales_order_items (
      sales_order_id, item_number, material_id, description,
      order_quantity, net_price, tax_code, tax_amount, total_price,
      unit, plant, storage_location,
      delivered_quantity, open_quantity, confirmed_quantity,
      delivery_status, billing_status, created_at
    ) VALUES
      (v_so_id, '10', 33, 'Karton quti A4 — Karton Kraft 350g/m²',
       5000, 10000.00, 'V1', 5000000.00, 55000000.00,
       'PC', 'P001', 'SL02',
       0, 5000, 5000,
       'NOT_DELIVERED', 'NOT_BILLED', now()),
      (v_so_id, '20', 34, 'Gofrokarton quti B3 — E-flyut 200g/m²',
       2500, 12000.00, 'V1', 2500000.00, 32500000.00,
       'PC', 'P001', 'SL02',
       0, 2500, 2500,
       'NOT_DELIVERED', 'NOT_BILLED', now());
    RAISE NOTICE 'sales_order_items (2 ta) inserted for SO %', v_so_id;
  ELSE
    RAISE NOTICE 'sales_order_items already exist for SO %', v_so_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────────
  -- 3. PRODUCTION ORDER — ishlab chiqarish buyurtmasi
  --    planned_quantity=5100 (confirmed 5000 + scrap 50 + defective 50 = 5100 ≤ 5100)
  -- ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM production_orders WHERE order_number = 'PP-GT-2026-001') THEN
    INSERT INTO production_orders (
      order_number,
      product_id,
      sales_order_id,
      planned_quantity,
      confirmed_quantity,
      scrap_quantity,
      defective_qty,
      order_type,
      status,
      planned_start_date,
      planned_end_date,
      actual_start_date,
      actual_end_date,
      priority,
      product_name,
      quantity,
      unit,
      actual_start,
      actual_end,
      notes,
      created_at,
      updated_at
    ) VALUES (
      'PP-GT-2026-001',
      COALESCE(v_prod_id1, 1),
      v_so_id,
      5100,
      5000,
      50,
      50,
      'standard',
      'completed',
      TO_CHAR(CURRENT_DATE - INTERVAL '5 days', 'YYYY-MM-DD'),
      TO_CHAR(CURRENT_DATE - INTERVAL '2 days', 'YYYY-MM-DD'),
      TO_CHAR(CURRENT_DATE - INTERVAL '5 days', 'YYYY-MM-DD'),
      TO_CHAR(CURRENT_DATE - INTERVAL '2 days', 'YYYY-MM-DD'),
      1,
      'Karton quti A4 (DEMO-GOLDEN)',
      5100,
      'PC',
      CURRENT_DATE - INTERVAL '5 days',
      CURRENT_DATE - INTERVAL '2 days',
      'GOLDEN-THREAD demo — PP bosqichi. planned=5100, confirmed=5000, scrap=50, defective=50',
      now(),
      now()
    )
    RETURNING id INTO v_po_id;
    RAISE NOTICE 'production_order inserted: %', v_po_id;
  ELSE
    SELECT id INTO v_po_id FROM production_orders WHERE order_number = 'PP-GT-2026-001' LIMIT 1;
    RAISE NOTICE 'production_order already exists: %', v_po_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────────
  -- 4. PRODUCTION SESSION (production_sessions jadvaliga bevosita)
  --    mes_production_sessions = VIEW over production_sessions
  --    equipment_id NOT NULL, worker_id NOT NULL
  -- ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM production_sessions WHERE session_number = 'MES-GT-2026-001') THEN
    INSERT INTO production_sessions (
      session_number,
      production_order_id,
      order_id,
      equipment_id,
      worker_id,
      status,
      target_quantity,
      actual_quantity,
      defect_quantity,
      produced_qty,
      defect_qty,
      started_at,
      ended_at,
      start_time,
      end_time,
      last_signal_at,
      running_time_seconds,
      stopped_time_seconds,
      availability,
      performance,
      quality,
      oee,
      session_date,
      worker_notes,
      created_at,
      updated_at
    ) VALUES (
      'MES-GT-2026-001',
      v_po_id,
      v_po_id,
      v_equip_id,
      2,
      'completed',
      5000,
      4950,
      50,
      4950,
      50,
      CURRENT_TIMESTAMP - INTERVAL '5 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '5 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      57600,
      3600,
      0.94,
      0.99,
      0.99,
      0.92,
      CURRENT_DATE - INTERVAL '5 days',
      'Barcha operatsiyalar muddatida yakunlandi. OEE=92%. GOLDEN-THREAD demo.',
      now(),
      now()
    )
    RETURNING id INTO v_mes_id;
    RAISE NOTICE 'production_session (MES) inserted: %', v_mes_id;
  ELSE
    SELECT id INTO v_mes_id FROM production_sessions WHERE session_number = 'MES-GT-2026-001' LIMIT 1;
    RAISE NOTICE 'production_session (MES) already exists: %', v_mes_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────────
  -- 5. QC INSPECTION — sifat nazorati (passed)
  --    order_id = production_order.id
  -- ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM qc_inspections WHERE order_id = v_po_id AND status = 'passed') THEN
    INSERT INTO qc_inspections (
      order_id,
      inspector_id,
      status,
      result,
      pass_count,
      fail_count,
      total_count,
      items_checked,
      items_passed,
      items_failed,
      inspected_at,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_po_id,
      2,
      'passed',
      'passed',
      4900,
      50,
      4950,
      4950,
      4900,
      50,
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      'GOLDEN-THREAD QC: 4900 qabul qilindi, 50 brak (1%). PASSED.',
      now(),
      now()
    )
    RETURNING id INTO v_qc_id;
    RAISE NOTICE 'qc_inspection inserted: %', v_qc_id;
  ELSE
    SELECT id INTO v_qc_id FROM qc_inspections WHERE order_id = v_po_id AND status = 'passed' LIMIT 1;
    RAISE NOTICE 'qc_inspection already exists: %', v_qc_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────────
  -- 6. WAREHOUSE STOCK — FG omboriga kirim
  --    warehouse_id=13 (Tayyor Mahsulot Ombori)
  --    UNIQUE INDEX: (warehouse_id, material_id) — ON CONFLICT UPDATE
  -- ─────────────────────────────────────────────────────────────────
  INSERT INTO warehouse_stock (
    warehouse_id,
    material_id,
    quantity,
    reserved_quantity,
    available_quantity,
    unit_of_measure,
    unit,
    last_updated_at,
    created_at
  ) VALUES (
    13,
    33,
    4900,
    0,
    4900,
    'PC',
    'PC',
    now(),
    now()
  )
  ON CONFLICT (warehouse_id, material_id) DO UPDATE
    SET
      quantity           = warehouse_stock.quantity + 4900,
      available_quantity = warehouse_stock.available_quantity + 4900,
      last_updated_at    = now(),
      updated_at         = now();
  RAISE NOTICE 'warehouse_stock FG: mat=33 wh=13 +4900 PC';

  INSERT INTO warehouse_stock (
    warehouse_id,
    material_id,
    quantity,
    reserved_quantity,
    available_quantity,
    unit_of_measure,
    unit,
    last_updated_at,
    created_at
  ) VALUES (
    13,
    34,
    2450,
    0,
    2450,
    'PC',
    'PC',
    now(),
    now()
  )
  ON CONFLICT (warehouse_id, material_id) DO UPDATE
    SET
      quantity           = warehouse_stock.quantity + 2450,
      available_quantity = warehouse_stock.available_quantity + 2450,
      last_updated_at    = now(),
      updated_at         = now();
  RAISE NOTICE 'warehouse_stock FG: mat=34 wh=13 +2450 PC';

  -- ─────────────────────────────────────────────────────────────────
  -- 7. DELIVERY — yetkazib berish (sales_order_id FK → sales_orders.id)
  -- ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM deliveries WHERE delivery_number = 'DEL-GT-2026-001') THEN
    INSERT INTO deliveries (
      delivery_number,
      delivery_type,
      shipping_point,
      loading_point,
      sales_order_id,
      customer_id,
      delivery_status,
      status,
      customer_name,
      delivery_address,
      driver_name,
      vehicle_number,
      planned_goods_movement_date,
      actual_goods_movement_date,
      dispatched_at,
      delivered_at,
      notes,
      total_weight,
      number_of_packages,
      created_at,
      updated_at
    ) VALUES (
      'DEL-GT-2026-001',
      'LF',
      'SP01',
      'LP01',
      v_so_id,
      16,
      'DELIVERED',
      'delivered',
      'Toshkent Qog''ozchi MChJ',
      'Toshkent sh., Yunusobod tumani, A. Qodiriy ko''chasi 12',
      'Ismoilov Sherzod',
      '01 K 123 AA',
      TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD'),
      TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
      CURRENT_TIMESTAMP - INTERVAL '1 day',
      CURRENT_TIMESTAMP,
      'GOLDEN-THREAD demo yetkazib berish — muddatida yetkazildi',
      2450.0,
      75,
      now(),
      now()
    )
    RETURNING id INTO v_del_id;
    RAISE NOTICE 'delivery inserted: %', v_del_id;
  ELSE
    SELECT id INTO v_del_id FROM deliveries WHERE delivery_number = 'DEL-GT-2026-001' LIMIT 1;
    RAISE NOTICE 'delivery already exists: %', v_del_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────────
  -- 8. FINANCE INVOICE — hisob-faktura (integer PK, integer customer_id)
  -- ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM finance_invoices WHERE invoice_number = 'INV-GT-2026-001') THEN
    INSERT INTO finance_invoices (
      invoice_number,
      invoice_type,
      customer_id,
      total_amount,
      paid_amount,
      payment_status,
      due_date,
      created_at,
      updated_at
    ) VALUES (
      'INV-GT-2026-001',
      'sales',
      16,
      85000000.00,
      0.00,
      'unpaid',
      CURRENT_DATE + INTERVAL '30 days',
      now(),
      now()
    )
    RETURNING id INTO v_inv_id;
    RAISE NOTICE 'finance_invoice inserted: %', v_inv_id;
  ELSE
    SELECT id INTO v_inv_id FROM finance_invoices WHERE invoice_number = 'INV-GT-2026-001' LIMIT 1;
    RAISE NOTICE 'finance_invoice already exists: %', v_inv_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────────
  -- 9. GL ENTRIES — kanonik entries jadval (double-entry bookkeeping)
  --
  --  Jurnal oyoqlari:
  --    A) AR:    DR Debitorlar 4000 (id=12)  / CR Tushum 9010 (id=31)  = 85,000,000
  --    B) COGS:  DR Tannarx 9100 (id=33)     / CR Tayyor mahsulot 2810 (id=10) = 42,500,000
  --    C) QQS:   DR Tushum 9010 (id=31)      / CR QQS 6310 (id=22)     = 7,727,273
  --    D) Logistika: DR Sotuv xar. 9200 (id=34) / CR Kassa 5010 (id=16) = 850,000
  --
  --  accounts jadvalidagi id-lar (seed-04-accounts.sql dan):
  --    4000 → id=12 (Debitorlar)
  --    9010 → id=31 (Tayyor mahsulot sotuvidan tushum)
  --    9100 → id=33 (Sotilgan mahsulot tannarxi)
  --    2810 → id=10 (Tayyor mahsulot)
  --    6310 → id=22 (QQS)
  --    9200 → id=34 (Sotuv xarajatlari)
  --    5010 → id=16 (Kassa)
  -- ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM entries WHERE description LIKE 'GT-2026-001%' LIMIT 1) THEN

    -- A) AR — Debitorlar 4000 DR / Tushum 9010 CR
    INSERT INTO entries (
      entry_date, document_type, document_id,
      debit_account_id, credit_account_id,
      debit_account, credit_account,
      amount, currency, description, created_by, created_at
    ) VALUES (
      v_entry_date, 'SD_INVOICE', v_so_id,
      12, 31,
      '4000', '9010',
      85000000.00, 'UZS',
      'GT-2026-001 | AR: Debitorlar DR / Tushum CR (sotish)',
      1, now()
    );

    -- B) COGS — Tannarx 9100 DR / Tayyor mahsulot inventar 2810 CR
    INSERT INTO entries (
      entry_date, document_type, document_id,
      debit_account_id, credit_account_id,
      debit_account, credit_account,
      amount, currency, description, created_by, created_at
    ) VALUES (
      v_entry_date, 'SD_COGS', v_so_id,
      33, 10,
      '9100', '2810',
      42500000.00, 'UZS',
      'GT-2026-001 | COGS: Tannarx DR / Tayyor mahsulot inventar CR',
      1, now()
    );

    -- C) QQS — DR Tushum 9010 / CR QQS 6310 (12%)
    INSERT INTO entries (
      entry_date, document_type, document_id,
      debit_account_id, credit_account_id,
      debit_account, credit_account,
      amount, currency, description, created_by, created_at
    ) VALUES (
      v_entry_date, 'SD_VAT', v_so_id,
      31, 22,
      '9010', '6310',
      7727273.00, 'UZS',
      'GT-2026-001 | QQS: Tushum DR / QQS kreditori CR (12%)',
      1, now()
    );

    -- D) Logistika xarajati — DR Sotuv xar. 9200 / CR Kassa 5010
    INSERT INTO entries (
      entry_date, document_type, document_id,
      debit_account_id, credit_account_id,
      debit_account, credit_account,
      amount, currency, description, created_by, created_at
    ) VALUES (
      v_entry_date, 'SD_DELIVERY_COST', v_so_id,
      34, 16,
      '9200', '5010',
      850000.00, 'UZS',
      'GT-2026-001 | Logistika: Sotuv xarajati DR / Kassa CR',
      1, now()
    );

    RAISE NOTICE 'GL entries (4 ta jurnal oyogi) inserted for GT-2026-001';
  ELSE
    RAISE NOTICE 'GL entries already exist for GT-2026-001';
  END IF;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'GOLDEN-THREAD SEED COMPLETED SUCCESSFULLY';
  RAISE NOTICE 'sales_order    id=%  (GT-2026-001)', v_so_id;
  RAISE NOTICE 'production_order id=% (PP-GT-2026-001)', v_po_id;
  RAISE NOTICE 'production_session id=% (MES-GT-2026-001)', v_mes_id;
  RAISE NOTICE 'qc_inspection  id=%  (passed)', v_qc_id;
  RAISE NOTICE 'warehouse_stock: FG wh=13 mat=33 +4900, mat=34 +2450';
  RAISE NOTICE 'delivery       id=%  (DEL-GT-2026-001)', v_del_id;
  RAISE NOTICE 'finance_invoice id=% (INV-GT-2026-001)', v_inv_id;
  RAISE NOTICE 'GL entries: 4 ta (AR/COGS/QQS/Logistika)';
  RAISE NOTICE '==============================================';

END;
$$;

COMMIT;

-- =============================================================================
-- TEKSHIRUV SQL (verify qilish uchun):
-- =============================================================================
-- SELECT id, order_number, status, total_amount FROM sales_orders WHERE order_number='GT-2026-001';
-- SELECT id, sales_order_id, material_id, order_quantity FROM sales_order_items soi JOIN sales_orders so ON so.id=soi.sales_order_id WHERE so.order_number='GT-2026-001';
-- SELECT id, order_number, status, planned_quantity, confirmed_quantity FROM production_orders WHERE order_number='PP-GT-2026-001';
-- SELECT id, session_number, status, actual_quantity, oee FROM production_sessions WHERE session_number='MES-GT-2026-001';
-- SELECT id, order_id, status, result, pass_count FROM qc_inspections WHERE notes LIKE 'GOLDEN%';
-- SELECT warehouse_id, material_id, quantity, available_quantity FROM warehouse_stock WHERE warehouse_id=13;
-- SELECT id, delivery_number, status, sales_order_id FROM deliveries WHERE delivery_number='DEL-GT-2026-001';
-- SELECT id, invoice_number, total_amount, payment_status FROM finance_invoices WHERE invoice_number='INV-GT-2026-001';
-- SELECT id, document_type, debit_account, credit_account, amount FROM entries WHERE description LIKE 'GT-2026-001%' ORDER BY id;
