/**
 * @module invariants
 * @description Source module. See exports for details.
 *
 * NOTE: Implementation split into multiple sub-files in `./invariants/` for
 * Rule 16 (file size). External imports remain unchanged — this file re-exports
 * the public functions.
 */

import { sql } from 'drizzle-orm';
import { Logger } from '@nestjs/common';
import { db } from './schema';
import { DB_CONSTRAINTS } from './invariants/constraints-data';
import { SCHEMA_MIGRATIONS } from './invariants/migrations-schema';
import { TRIGGER_MIGRATIONS } from './invariants/migrations-triggers';
import { CRM_MIGRATIONS } from './invariants/migrations-crm';

const logger = new Logger('DbInvariants');

/**
 * TZ-D16: DB Invariant CHECK constraintlar (20+).
 *
 * Dastur ishga tushganda (main.ts bootstrap) bir marta chaqiriladi.
 * IF NOT EXISTS bilan — idempotent, xavfsiz qayta ishlash.
 */
export async function ensureDbInvariants(): Promise<void> {
  let applied = 0;
  let skipped = 0;

  for (const c of DB_CONSTRAINTS) {
    try {
      // RULE4_EXCEPTION: DDL-only — ALTER TABLE / ADD CONSTRAINT cannot be
      // expressed via Drizzle builders. Constraint name + table name are
      // looked up from a static, hard-coded constants list (DB_CONSTRAINTS),
      // never user input.
      await db.execute(sql.raw(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = '${c.name}'
            AND table_name = '${c.table}'
          ) THEN
            ALTER TABLE IF EXISTS ${c.table}
            ADD CONSTRAINT ${c.name} CHECK (${c.check});
          END IF;
        END;
        $$;
      `));
      applied++;
      logger.log(`Invariant OK: ${c.name}`);
    } catch (err) {
      skipped++;
      const knownMissing = ['chk_invoices_', 'chk_purchase_orders_qty_'];
      if (knownMissing.some((prefix) => c.name.startsWith(prefix))) {
        logger.debug(`Invariant o'tkazildi (jadval/ustun yo'q — kutilgan): ${c.name}`);
      } else {
        logger.warn(`Invariant o'tkazildi (jadval yo'q?): ${c.name} — ${String(err)}`);
      }
    }
  }

  logger.log(`DB invariantlar: ${applied} ta qo'llandi, ${skipped} ta o'tkazildi`);
}

export async function ensureSchemaAdditions(): Promise<void> {
  const migrations = [...SCHEMA_MIGRATIONS, ...TRIGGER_MIGRATIONS, ...CRM_MIGRATIONS];
  for (const m of migrations) {
    try {
      // RULE4_EXCEPTION: idempotent DDL/trigger/function migrations.
      // `m.sql` is sourced from hard-coded constant arrays in
      // `./invariants/migrations-*.ts`, never user input — these are
      // CREATE TABLE / CREATE INDEX / CREATE OR REPLACE FUNCTION /
      // CREATE TRIGGER statements that Drizzle builders cannot express.
      await db.execute(sql.raw(m.sql));
      logger.log(`Schema addition OK: ${m.name}`);
    } catch (err) {
      logger.warn(`Schema addition o'tkazildi: ${m.name} — ${String(err)}`);
    }
  }
}
