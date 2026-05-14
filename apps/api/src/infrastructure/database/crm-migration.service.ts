/**
 * @module crm-migration.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ddlRun } from '@shared/db';
import { sql } from 'drizzle-orm';

/**
 * CRM schema alignment migration
 *
 * The `crm_deals` table was created from an old schema that doesn't match
 * the current Drizzle schema in lib/db/src/schema/crm-pipelines.ts.
 * This service adds all missing columns (idempotently) so Drizzle queries work.
 *
 * Existing columns in DB:   id, lead_id, stage_semantic_id, opportunity,
 *                           value, customer_id, manager_id, status,
 *                           closed_at, created_at, updated_at
 *
 * All new columns are nullable or have defaults so no data is lost.
 */
@Injectable()
export class CrmMigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CrmMigrationService.name);

  onApplicationBootstrap(): void {
    this.alignCrmDeals().catch((e: unknown) =>
      this.logger.warn(`CrmMigration background failed: ${String(e)}`),
    );
  }

  private async alignCrmDeals(): Promise<void> {
    const ddls: string[] = [
      // ── Add columns the Drizzle schema expects but the old table lacks ───────
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS title TEXT DEFAULT ''`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS category_id INTEGER DEFAULT 0`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS stage_id VARCHAR(50) DEFAULT 'C0:NEW'`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT true`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS is_return_customer BOOLEAN DEFAULT false`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS is_repeated_approach BOOLEAN DEFAULT false`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 0`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS currency_id VARCHAR(3) DEFAULT 'UZS'`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS is_manual_opportunity BOOLEAN DEFAULT false`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS tax_value NUMERIC(18, 2)`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS company_id INTEGER`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS contact_ids JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS begin_date VARCHAR(10)`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS close_date VARCHAR(10)`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS assigned_by_id INTEGER`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS created_by_id INTEGER`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS modify_by_id INTEGER`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS date_create TIMESTAMPTZ DEFAULT NOW()`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS date_modify TIMESTAMPTZ DEFAULT NOW()`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS opened BOOLEAN DEFAULT true`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS closed BOOLEAN DEFAULT false`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS comments TEXT`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS additional_info TEXT`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS originator_id VARCHAR(50)`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS origin_id VARCHAR(255)`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS sales_order_id VARCHAR`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS forecast_amount NUMERIC`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS is_repeating BOOLEAN DEFAULT false`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS next_activity_at TIMESTAMPTZ`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
      `ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS metadata JSONB`,

      // ── Backfill from old columns ─────────────────────────────────────────
      // title: derive from id if blank
      `UPDATE crm_deals SET title = 'Deal #' || id::text WHERE title IS NULL OR title = ''`,
      // date_create / date_modify: copy from created_at / updated_at
      `UPDATE crm_deals SET date_create = COALESCE(created_at, NOW()) WHERE date_create IS NULL`,
      `UPDATE crm_deals SET date_modify = COALESCE(updated_at, NOW()) WHERE date_modify IS NULL`,
      // assigned_by_id: copy from old manager_id
      `UPDATE crm_deals SET assigned_by_id = manager_id WHERE assigned_by_id IS NULL AND manager_id IS NOT NULL`,
      // company_id: copy from old customer_id
      `UPDATE crm_deals SET company_id = customer_id WHERE company_id IS NULL AND customer_id IS NOT NULL`,
    ];

    let applied = 0;
    for (const ddl of ddls) {
      try {
        await ddlRun(sql.raw(ddl));
        applied++;
      } catch (e: unknown) {
        this.logger.warn(`CrmMigration DDL skipped: ${String(e)}`);
      }
    }
    this.logger.log(`CrmMigration: ${applied}/${ddls.length} statements applied`);
  }
}
