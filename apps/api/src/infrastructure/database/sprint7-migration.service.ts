/**
 * @module sprint7-migration.service
 * Sprint 7 — GL canonicalization: extend `entries` table (currency column +
 * sequence-based entry_number default) so both GL writers and all readers use
 * `entries` as the single canonical GL ledger instead of `gl_journal_entries`.
 *
 * All DDL is idempotent (IF NOT EXISTS / idempotent ALTER) — safe on every boot.
 */
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ddlRun } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class Sprint7MigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Sprint7MigrationService.name);

  onApplicationBootstrap(): void {
    this.ensureGlCanonical().catch((e: unknown) =>
      this.logger.warn(`Sprint7Migration background failed: ${String(e)}`),
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

  private async ensureGlCanonical(): Promise<void> {
    const ddls = this.buildDdls();
    const applied = await this.applyDdlList(ddls);
    this.logger.log(`Sprint7Migration: ${applied}/${ddls.length} DDL statements applied`);
  }
}
