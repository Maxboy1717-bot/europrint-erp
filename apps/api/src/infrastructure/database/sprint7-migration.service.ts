/**
 * @module sprint7-migration.service
 * Sprint 7 — Two-phase DDL:
 *   Phase A (GL): extend `entries` table (currency + sequence-based entry_number default)
 *   Phase B (FK): wire integer sales_order_id columns in papka_orders / production_orders /
 *                 deliveries / billing_documents → sales_orders(id) ON DELETE NO ACTION
 *
 * All DDL is idempotent (IF NOT EXISTS / DO $$ guard) — safe on every boot.
 */
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ddlRun } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class Sprint7MigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Sprint7MigrationService.name);

  onApplicationBootstrap(): void {
    this.ensureGlCanonical().catch((e: unknown) =>
      this.logger.warn(`Sprint7Migration GL failed: ${String(e)}`),
    );
    this.ensureOrderFks().catch((e: unknown) =>
      this.logger.warn(`Sprint7Migration FK failed: ${String(e)}`),
    );
  }

  private buildDdls(): string[] {
    return [
      // Step 1: currency column — required by payroll writer and for multi-currency future
      `ALTER TABLE entries ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'UZS'`,
      // Step 2: sequence for auto-generating human-readable entry numbers
      `CREATE SEQUENCE IF NOT EXISTS entries_entry_seq START 1 INCREMENT BY 1`,
      // Step 3: wire sequence as column default (idempotent — SET DEFAULT replaces existing default)
      `ALTER TABLE entries ALTER COLUMN entry_number SET DEFAULT 'GL-' || LPAD(nextval('entries_entry_seq')::text, 9, '0')`,
    ];
  }

  private async applyDdlList(ddls: string[]): Promise<number> {
    let applied = 0;
    for (const ddl of ddls) {
      try {
        // NOTE: `ddl` is a literal string from buildDdls() — no user input, safe for sql.raw.
        await ddlRun(sql.raw(ddl));
        applied++;
      } catch (e: unknown) {
        this.logger.warn(`Sprint7Migration DDL skipped: ${String(e)}`);
      }
    }
    return applied;
  }

  private buildOrderFkDdls(): string[] {
    return [
      // papka_orders.sales_order_id → sales_orders(id): connects PP production folder to SD order
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = 'papka_orders_sales_order_id_fkey'
         ) THEN
           ALTER TABLE papka_orders
             ADD CONSTRAINT papka_orders_sales_order_id_fkey
             FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
         END IF;
       END $$`,
      // production_orders.sales_order_id → sales_orders(id): MES production tracks SD order
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = 'production_orders_sales_order_id_fkey'
         ) THEN
           ALTER TABLE production_orders
             ADD CONSTRAINT production_orders_sales_order_id_fkey
             FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
         END IF;
       END $$`,
      // deliveries.sales_order_id → sales_orders(id): logistics delivery tracks SD order
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = 'deliveries_sales_order_id_fkey'
         ) THEN
           ALTER TABLE deliveries
             ADD CONSTRAINT deliveries_sales_order_id_fkey
             FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
         END IF;
       END $$`,
      // billing_documents.sales_order_id → sales_orders(id): finance billing tracks SD order
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = 'billing_documents_sales_order_id_fkey'
         ) THEN
           ALTER TABLE billing_documents
             ADD CONSTRAINT billing_documents_sales_order_id_fkey
             FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
         END IF;
       END $$`,
    ];
  }

  private async ensureGlCanonical(): Promise<void> {
    const ddls = this.buildDdls();
    const applied = await this.applyDdlList(ddls);
    this.logger.log(`Sprint7Migration GL: ${applied}/${ddls.length} DDL statements applied`);
  }

  private async ensureOrderFks(): Promise<void> {
    const ddls = this.buildOrderFkDdls();
    const applied = await this.applyDdlList(ddls);
    this.logger.log(`Sprint7Migration FK: ${applied}/${ddls.length} FK constraints applied`);
  }
}
