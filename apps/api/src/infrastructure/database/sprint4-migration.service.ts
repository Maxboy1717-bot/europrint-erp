import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

async function ddlRun(query: ReturnType<typeof sql>): Promise<void> {
  await db.execute(query);
}

/**
 * Sprint 4 — Order-to-Cash idempotent DDL migrations.
 * Adds columns to ow_orders that are required by business guard logic.
 * All statements use ADD COLUMN IF NOT EXISTS so they are safe to re-run.
 */
@Injectable()
export class Sprint4MigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Sprint4MigrationService.name);

  onApplicationBootstrap(): void {
    this.ensureOrderWorkflowColumns().catch((e: unknown) =>
      this.logger.warn(`Sprint4Migration background failed: ${String(e)}`),
    );
  }

  private async ensureOrderWorkflowColumns(): Promise<void> {
    await ddlRun(sql`
      ALTER TABLE ow_orders
        ADD COLUMN IF NOT EXISTS tech_card_confirmed_at    TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS customer_signature_url    TEXT
    `).catch((e: Error) =>
      this.logger.error(`ow_orders column migration failed: ${e.message}`),
    );

    this.logger.log('Sprint-4 ow_orders columns ensured');
  }
}
