-- ============================================================================
-- Business Invariants — DB-level safety triggers
-- ============================================================================
-- These functions/triggers enforce critical business rules at the database
-- level as a defensive backup to service-layer validation. They prevent
-- corrupt data from being persisted even if the application logic has a bug.
-- ============================================================================

-- ─── 1. fn_stock_negative_prevent ────────────────────────────────────────────
-- Negative stock (current_stock < 0) ni oldini oladi
CREATE OR REPLACE FUNCTION fn_stock_negative_prevent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative: material_id=%, attempted=%',
      NEW.id, NEW.current_stock
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'material_cards') THEN
    DROP TRIGGER IF EXISTS trg_material_cards_stock_check ON material_cards;
    CREATE TRIGGER trg_material_cards_stock_check
      BEFORE INSERT OR UPDATE OF current_stock ON material_cards
      FOR EACH ROW EXECUTE FUNCTION fn_stock_negative_prevent();
  END IF;
END $$;

-- ─── 2. fn_invoice_total_check ───────────────────────────────────────────────
-- Invoice total non-negative bo'lishi shart, paid_amount > total bo'lmasligi shart
CREATE OR REPLACE FUNCTION fn_invoice_total_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_amount IS NOT NULL AND NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Invoice total cannot be negative: %', NEW.total_amount
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.paid_amount IS NOT NULL AND NEW.total_amount IS NOT NULL
     AND NEW.paid_amount > NEW.total_amount * 1.01 THEN
    RAISE EXCEPTION 'Paid amount (%) cannot exceed invoice total (%)',
      NEW.paid_amount, NEW.total_amount
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'invoices') THEN
    DROP TRIGGER IF EXISTS trg_invoices_total_check ON invoices;
    CREATE TRIGGER trg_invoices_total_check
      BEFORE INSERT OR UPDATE ON invoices
      FOR EACH ROW EXECUTE FUNCTION fn_invoice_total_check();
  END IF;
END $$;

-- ─── 3. fn_order_quantity_positive ───────────────────────────────────────────
-- Order miqdorlari (quantity) musbat bo'lishi shart
CREATE OR REPLACE FUNCTION fn_order_quantity_positive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity IS NOT NULL AND NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be positive: %', NEW.quantity
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'orders'
               AND EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_name = 'orders' AND column_name = 'quantity')) THEN
    DROP TRIGGER IF EXISTS trg_orders_qty_check ON orders;
    CREATE TRIGGER trg_orders_qty_check
      BEFORE INSERT OR UPDATE OF quantity ON orders
      FOR EACH ROW EXECUTE FUNCTION fn_order_quantity_positive();
  END IF;
END $$;

-- ─── 4. fn_employee_hire_date_check ──────────────────────────────────────────
-- Xodim ishga olingan sana — kelajakdagi sanalar oldini oladi
CREATE OR REPLACE FUNCTION fn_employee_hire_date_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hire_date IS NOT NULL AND NEW.hire_date > CURRENT_DATE + INTERVAL '7 days' THEN
    RAISE EXCEPTION 'Hire date cannot be more than 7 days in the future: %',
      NEW.hire_date
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'employees'
               AND EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_name = 'employees' AND column_name = 'hire_date')) THEN
    DROP TRIGGER IF EXISTS trg_employees_hire_date_check ON employees;
    CREATE TRIGGER trg_employees_hire_date_check
      BEFORE INSERT OR UPDATE OF hire_date ON employees
      FOR EACH ROW EXECUTE FUNCTION fn_employee_hire_date_check();
  END IF;
END $$;

-- ─── 5. fn_payment_amount_positive ───────────────────────────────────────────
-- To'lov summasi musbat bo'lishi shart
CREATE OR REPLACE FUNCTION fn_payment_amount_positive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount IS NOT NULL AND NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive: %', NEW.amount
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'sd_payments') THEN
    DROP TRIGGER IF EXISTS trg_sd_payments_amount_check ON sd_payments;
    CREATE TRIGGER trg_sd_payments_amount_check
      BEFORE INSERT OR UPDATE OF amount ON sd_payments
      FOR EACH ROW EXECUTE FUNCTION fn_payment_amount_positive();
  END IF;
END $$;

-- ============================================================================
-- Business invariants migration completed
-- ============================================================================
