/**
 * @module invariants/migrations-triggers
 * @description Trigger function + trigger migrations.
 */

import type { MigrationDef } from './migrations-schema';

export const TRIGGER_MIGRATIONS: Array<MigrationDef> = [
  {
    name: 'fn_invoice_total_check trigger function',
    sql: `
      CREATE OR REPLACE FUNCTION fn_invoice_total_check()
      RETURNS TRIGGER AS $$
      DECLARE
        v_lines_sum NUMERIC;
      BEGIN
        SELECT COALESCE(SUM(total::numeric), 0)
          INTO v_lines_sum
          FROM finance_invoice_lines
         WHERE invoice_id = NEW.id;
        IF v_lines_sum > 0 AND ABS(NEW.total_amount::numeric - v_lines_sum) > 0.01 THEN
          RAISE EXCEPTION 'Hisob-faktura: total_amount (%) qatorlar yig''indisi (%) ga mos kelmaydi',
            NEW.total_amount, v_lines_sum;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
  },
  {
    name: 'fn_invoice_total_check constraint trigger on fi_invoices',
    sql: `
      DROP TRIGGER IF EXISTS trg_invoice_total_check ON fi_invoices;
      CREATE CONSTRAINT TRIGGER trg_invoice_total_check
      AFTER INSERT OR UPDATE ON fi_invoices
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW EXECUTE FUNCTION fn_invoice_total_check();
    `,
  },
  {
    name: 'fn_inventory_nonneg trigger function',
    sql: `
      CREATE OR REPLACE FUNCTION fn_inventory_nonneg()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.quantity IS NOT NULL AND NEW.quantity::numeric < 0 THEN
          RAISE EXCEPTION 'Inventar: quantity manfiy bo''la olmaydi (%)' , NEW.quantity;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
  },
  {
    name: 'fn_inventory_nonneg trigger on stock_items',
    sql: `
      DROP TRIGGER IF EXISTS trg_inventory_nonneg ON stock_items;
      CREATE TRIGGER trg_inventory_nonneg
      BEFORE INSERT OR UPDATE ON stock_items
      FOR EACH ROW EXECUTE FUNCTION fn_inventory_nonneg();
    `,
  },
  {
    name: 'fn_bom_cycle_check trigger function',
    sql: `
      CREATE OR REPLACE FUNCTION fn_bom_cycle_check()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.quantity IS NOT NULL AND NEW.quantity::numeric <= 0 THEN
          RAISE EXCEPTION 'BOM: quantity (%) > 0 bo''lishi kerak', NEW.quantity;
        END IF;
        IF NEW.bom_id IS NOT NULL AND NEW.material_id IS NOT NULL THEN
          IF EXISTS (
            WITH RECURSIVE reach AS (
              SELECT NEW.material_id AS mat
              UNION ALL
              SELECT bi.material_id
              FROM reach r
              JOIN bom_headers bh ON bh.product_id = r.mat
              JOIN bom_items   bi ON bi.bom_id      = bh.id
              WHERE bi.id != COALESCE(NEW.id, -1)
            )
            SELECT 1 FROM reach r
            JOIN bom_headers bh ON bh.product_id = r.mat
            WHERE bh.id = NEW.bom_id
            LIMIT 1
          ) THEN
            RAISE EXCEPTION 'BOM: rekursiv siklik havola aniqlandi — bom_id=% material_id=%',
              NEW.bom_id, NEW.material_id;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
  },
  {
    name: 'fn_bom_cycle_check trigger on bom_items',
    sql: `
      DROP TRIGGER IF EXISTS trg_bom_cycle_check ON bom_items;
      CREATE TRIGGER trg_bom_cycle_check
      BEFORE INSERT OR UPDATE ON bom_items
      FOR EACH ROW EXECUTE FUNCTION fn_bom_cycle_check();
    `,
  },
  {
    name: 'fn_payroll_net_check trigger function',
    sql: `
      CREATE OR REPLACE FUNCTION fn_payroll_net_check()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.net_pay IS NOT NULL AND NEW.net_pay::numeric <= 0 THEN
          RAISE EXCEPTION 'Maosh: net_pay (%) > 0 bo''lishi kerak', NEW.net_pay;
        END IF;
        IF NEW.net_pay IS NOT NULL AND NEW.base_salary IS NOT NULL
           AND NEW.net_pay::numeric > NEW.base_salary::numeric THEN
          RAISE EXCEPTION 'Maosh: net_pay (%) base_salary (%) dan oshib ketdi',
            NEW.net_pay, NEW.base_salary;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
  },
  {
    name: 'fn_payroll_net_check trigger on payroll_entries',
    sql: `
      DROP TRIGGER IF EXISTS trg_payroll_net_check ON payroll_entries;
      CREATE TRIGGER trg_payroll_net_check
      BEFORE INSERT OR UPDATE ON payroll_entries
      FOR EACH ROW EXECUTE FUNCTION fn_payroll_net_check();
    `,
  },
  {
    name: 'fn_advance_payment_cap trigger function',
    sql: `
      CREATE OR REPLACE FUNCTION fn_advance_payment_cap()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.advance_paid IS NOT NULL AND NEW.total_amount IS NOT NULL
           AND NEW.advance_paid::numeric > NEW.total_amount::numeric THEN
          RAISE EXCEPTION 'Buyurtma: advance_paid (%) > total_amount (%) — ruxsat etilmaydi',
            NEW.advance_paid, NEW.total_amount;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
  },
  {
    name: 'fn_advance_payment_cap trigger on sd_orders',
    sql: `
      DROP TRIGGER IF EXISTS trg_advance_payment_cap ON sd_orders;
      CREATE TRIGGER trg_advance_payment_cap
      BEFORE INSERT OR UPDATE ON sd_orders
      FOR EACH ROW EXECUTE FUNCTION fn_advance_payment_cap();
    `,
  },
  {
    name: 'fn_advance_payment_cap trigger on sd_sales_orders',
    sql: `
      DROP TRIGGER IF EXISTS trg_advance_payment_cap ON sd_sales_orders;
      CREATE TRIGGER trg_advance_payment_cap
      BEFORE INSERT OR UPDATE ON sd_sales_orders
      FOR EACH ROW EXECUTE FUNCTION fn_advance_payment_cap();
    `,
  },
  {
    name: 'fn_production_qty_check trigger function',
    sql: `
      CREATE OR REPLACE FUNCTION fn_production_qty_check()
      RETURNS TRIGGER AS $$
      DECLARE
        v_good     NUMERIC;
        v_scrap    NUMERIC;
        v_planned  NUMERIC;
      BEGIN
        IF NEW.planned_quantity IS NOT NULL AND NEW.planned_quantity::numeric <= 0 THEN
          RAISE EXCEPTION 'Ishlab chiqarish: planned_quantity (%) > 0 bo''lishi kerak', NEW.planned_quantity;
        END IF;
        IF NEW.confirmed_quantity IS NOT NULL AND NEW.confirmed_quantity::numeric < 0 THEN
          RAISE EXCEPTION 'Ishlab chiqarish: confirmed_quantity (%) manfiy bo''la olmaydi', NEW.confirmed_quantity;
        END IF;
        IF NEW.scrap_quantity IS NOT NULL AND NEW.scrap_quantity::numeric < 0 THEN
          RAISE EXCEPTION 'Ishlab chiqarish: scrap_quantity (%) manfiy bo''la olmaydi', NEW.scrap_quantity;
        END IF;
        v_good    := COALESCE(NEW.confirmed_quantity, 0)::numeric;
        v_scrap   := COALESCE(NEW.scrap_quantity, 0)::numeric;
        v_planned := COALESCE(NEW.planned_quantity, 0)::numeric;
        IF v_planned > 0 AND (v_good + v_scrap) > v_planned THEN
          RAISE EXCEPTION 'Ishlab chiqarish: good+scrap (%) planned (%) dan oshib ketdi',
            v_good + v_scrap, v_planned;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
  },
  {
    name: 'fn_production_qty_check trigger on production_orders',
    sql: `
      DROP TRIGGER IF EXISTS trg_production_qty_check ON production_orders;
      CREATE TRIGGER trg_production_qty_check
      BEFORE INSERT OR UPDATE ON production_orders
      FOR EACH ROW EXECUTE FUNCTION fn_production_qty_check();
    `,
  },
];
