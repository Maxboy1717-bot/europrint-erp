-- ARCHITECTURE.md FK migration — Bo'lim D
-- 12 ta varchar→int FK ni additiv tarzda tuzatish (eski ustunni saqlab).
-- Strategiya:
--   1. Yangi `*_int` ustun qo'shish (NULLABLE)
--   2. Mavjud yozuvlarni cast bilan backfill
--   3. Trigger orqali yangi yozuvlarni avtomatik to'ldirish (ikki ustun parallel)
--   4. Repository keyin yangi ustundan read, ikkalasiga write
--   5. Soak: 1 hafta
--   6. Migration 0009 (alohida) — eski ustunni DROP, yangi rename
--
-- Bu migration BUZG'UNCHI EMAS: eski kod eski ustundan ishlay beradi.
-- Idempotent: IF NOT EXISTS / safe casts.
-- 2026-04-29

BEGIN;

-- ─── Helper: text→int safe cast (raqam bo'lmagan qiymatlarda NULL) ───────────
CREATE OR REPLACE FUNCTION _safe_text_to_int(t TEXT) RETURNS INT AS $$
BEGIN
  IF t IS NULL OR t = '' THEN RETURN NULL; END IF;
  RETURN t::int;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─── 1. customer_orders.customer_id ──────────────────────────────────────────
-- varchar → integer (customer_accounts.id serial int)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_orders') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_orders' AND column_name = 'customer_id_int') THEN
      ALTER TABLE customer_orders ADD COLUMN customer_id_int INTEGER;
      UPDATE customer_orders SET customer_id_int = _safe_text_to_int(customer_id) WHERE customer_id_int IS NULL;
      CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_id_int ON customer_orders(customer_id_int);
    END IF;
  END IF;
END $$;

-- ─── 2. public_products.category_id ──────────────────────────────────────────
-- varchar → integer (product_categories.id serial int)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_products' AND column_name = 'category_id_int') THEN
      ALTER TABLE public_products ADD COLUMN category_id_int INTEGER;
      UPDATE public_products SET category_id_int = _safe_text_to_int(category_id) WHERE category_id_int IS NULL;
      CREATE INDEX IF NOT EXISTS idx_public_products_category_id_int ON public_products(category_id_int);
    END IF;
  END IF;
END $$;

-- ─── 3. public_products.erp_product_id ───────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_products' AND column_name = 'erp_product_id_int') THEN
      ALTER TABLE public_products ADD COLUMN erp_product_id_int INTEGER;
      UPDATE public_products SET erp_product_id_int = _safe_text_to_int(erp_product_id) WHERE erp_product_id_int IS NULL;
      CREATE INDEX IF NOT EXISTS idx_public_products_erp_product_id_int ON public_products(erp_product_id_int);
    END IF;
  END IF;
END $$;

-- ─── 4. sd_leads.manager_id (allaqachon int — agar varchar bo'lsa) ───────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sd_leads' AND column_name = 'manager_id'
      AND data_type = 'character varying'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sd_leads' AND column_name = 'manager_id_int') THEN
      ALTER TABLE sd_leads ADD COLUMN manager_id_int INTEGER;
      UPDATE sd_leads SET manager_id_int = _safe_text_to_int(manager_id) WHERE manager_id_int IS NULL;
      CREATE INDEX IF NOT EXISTS idx_sd_leads_manager_id_int ON sd_leads(manager_id_int);
    END IF;
  END IF;
END $$;

-- ─── 5. sd_payments.customer_id ──────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sd_payments') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sd_payments' AND column_name = 'customer_id'
        AND data_type = 'character varying'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sd_payments' AND column_name = 'customer_id_int') THEN
        ALTER TABLE sd_payments ADD COLUMN customer_id_int INTEGER;
        UPDATE sd_payments SET customer_id_int = _safe_text_to_int(customer_id) WHERE customer_id_int IS NULL;
        CREATE INDEX IF NOT EXISTS idx_sd_payments_customer_id_int ON sd_payments(customer_id_int);
      END IF;
    END IF;
  END IF;
END $$;

-- ─── 6. sales_invoices.order_id ──────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_invoices') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_invoices' AND column_name = 'order_id_int') THEN
      ALTER TABLE sales_invoices ADD COLUMN order_id_int INTEGER;
      UPDATE sales_invoices SET order_id_int = _safe_text_to_int(order_id) WHERE order_id_int IS NULL;
      CREATE INDEX IF NOT EXISTS idx_sales_invoices_order_id_int ON sales_invoices(order_id_int);
    END IF;
  END IF;
END $$;

-- ─── 7. sales_invoices.gl_document_id (varchar uuid — alohida o'zgarishi mumkin) ──
-- gl_documents.id PK varchar UUID — bu konversiya emas.
-- Lekin sales_invoices da agar gl_document_id raqam bo'lsa, parallel ustun:
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gl_documents') THEN
    -- gl_documents PK turini tekshir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'gl_documents' AND column_name = 'id'
        AND data_type = 'integer'
    ) THEN
      -- gl_documents.id INT bo'lsa, sales_invoices.gl_document_id ham int bo'lishi kerak
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_invoices')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_invoices' AND column_name = 'gl_document_id_int') THEN
        ALTER TABLE sales_invoices ADD COLUMN gl_document_id_int INTEGER;
        UPDATE sales_invoices SET gl_document_id_int = _safe_text_to_int(gl_document_id) WHERE gl_document_id_int IS NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- ─── 8. sales_orders.tech_approved_by ────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sales_orders' AND column_name = 'tech_approved_by'
        AND data_type = 'character varying'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'tech_approved_by_int') THEN
        ALTER TABLE sales_orders ADD COLUMN tech_approved_by_int INTEGER;
        UPDATE sales_orders SET tech_approved_by_int = _safe_text_to_int(tech_approved_by) WHERE tech_approved_by_int IS NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- ─── 9. sales_orders.created_by ──────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sales_orders' AND column_name = 'created_by'
        AND data_type = 'character varying'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'created_by_int') THEN
        ALTER TABLE sales_orders ADD COLUMN created_by_int INTEGER;
        UPDATE sales_orders SET created_by_int = _safe_text_to_int(created_by) WHERE created_by_int IS NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- ─── 10. sales_orders.changed_by ─────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sales_orders' AND column_name = 'changed_by'
        AND data_type = 'character varying'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'changed_by_int') THEN
        ALTER TABLE sales_orders ADD COLUMN changed_by_int INTEGER;
        UPDATE sales_orders SET changed_by_int = _safe_text_to_int(changed_by) WHERE changed_by_int IS NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- ─── 11. crm_deals.* (agar mavjud bo'lsa varchar FK) ─────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_deals') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'crm_deals' AND column_name = 'assigned_to'
        AND data_type = 'character varying'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_deals' AND column_name = 'assigned_to_int') THEN
        ALTER TABLE crm_deals ADD COLUMN assigned_to_int INTEGER;
        UPDATE crm_deals SET assigned_to_int = _safe_text_to_int(assigned_to) WHERE assigned_to_int IS NULL;
        CREATE INDEX IF NOT EXISTS idx_crm_deals_assigned_to_int ON crm_deals(assigned_to_int);
      END IF;
    END IF;
  END IF;
END $$;

-- ─── 12. crm_leads.assigned_to (agar varchar bo'lsa) ─────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'crm_leads' AND column_name = 'assigned_to'
        AND data_type = 'character varying'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'assigned_to_int') THEN
        ALTER TABLE crm_leads ADD COLUMN assigned_to_int INTEGER;
        UPDATE crm_leads SET assigned_to_int = _safe_text_to_int(assigned_to) WHERE assigned_to_int IS NULL;
        CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to_int ON crm_leads(assigned_to_int);
      END IF;
    END IF;
  END IF;
END $$;

-- ─── Sync trigger: yangi/o'zgartirilgan yozuvlarda _int ustunni avtomatik to'ldirish ───
-- Bu trigger eski kod eski ustunga yozsa, yangi ustunni avtomatik to'ldiradi.
CREATE OR REPLACE FUNCTION _sync_int_fk_trigger() RETURNS TRIGGER AS $$
BEGIN
  -- customer_orders
  IF TG_TABLE_NAME = 'customer_orders' THEN
    NEW.customer_id_int := _safe_text_to_int(NEW.customer_id);
  ELSIF TG_TABLE_NAME = 'public_products' THEN
    NEW.category_id_int := _safe_text_to_int(NEW.category_id);
    NEW.erp_product_id_int := _safe_text_to_int(NEW.erp_product_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_orders')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_customer_orders_sync_int') THEN
    CREATE TRIGGER tr_customer_orders_sync_int
      BEFORE INSERT OR UPDATE ON customer_orders
      FOR EACH ROW EXECUTE FUNCTION _sync_int_fk_trigger();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_products')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_public_products_sync_int') THEN
    CREATE TRIGGER tr_public_products_sync_int
      BEFORE INSERT OR UPDATE ON public_products
      FOR EACH ROW EXECUTE FUNCTION _sync_int_fk_trigger();
  END IF;
END $$;

COMMIT;

-- ─── Verification queries (manual run) ────────────────────────────────────────
-- SELECT 'customer_orders' AS tbl, COUNT(*) AS total,
--        COUNT(customer_id) AS varchar_filled,
--        COUNT(customer_id_int) AS int_filled,
--        COUNT(*) FILTER (WHERE customer_id IS NOT NULL AND customer_id_int IS NULL) AS unmapped
-- FROM customer_orders;
