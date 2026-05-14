/**
 * @module sprint5-migration.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ddlRun } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class Sprint5MigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Sprint5MigrationService.name);

  onApplicationBootstrap(): void {
    this.ensureAiDecisionLog().catch((e: unknown) =>
      this.logger.warn(`Sprint5Migration background failed: ${String(e)}`),
    );
  }

  private async ensureAiDecisionLog(): Promise<void> {
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS ai_decision_log (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_code     TEXT NOT NULL,
        entity_type    TEXT NOT NULL,
        entity_id      UUID NOT NULL,
        input_hash     TEXT NOT NULL,
        bucket_hour    TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now()),
        decision       JSONB NOT NULL,
        confidence     NUMERIC(4, 3) NOT NULL,
        model_version  TEXT NOT NULL,
        auto_executed  BOOLEAN NOT NULL DEFAULT false,
        human_override JSONB,
        latency_ms     INTEGER NOT NULL,
        cost_usd       NUMERIC(10, 6),
        created_at     TIMESTAMPTZ DEFAULT now()
      )
    `);

    /* Restore entity_id to UUID if a previous migration had changed it to TEXT.
       Delete any rows that cannot be coerced (non-UUID text values) to keep the
       NOT NULL + UUID constraints satisfiable. */
    await ddlRun(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'ai_decision_log'
            AND column_name = 'entity_id'
            AND data_type = 'text'
        ) THEN
          DELETE FROM ai_decision_log
          WHERE entity_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
          ALTER TABLE ai_decision_log
            ALTER COLUMN entity_id TYPE UUID USING entity_id::uuid;
        END IF;
      END;
      $$
    `).catch((e: unknown) =>
      this.logger.warn({ msg: 'entity_id UUID restore skipped', err: (e as Error).message }),
    );

    await ddlRun(sql`
      ALTER TABLE ai_decision_log
        ADD COLUMN IF NOT EXISTS bucket_hour TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now())
    `).catch((e: unknown) =>
      this.logger.debug({ msg: 'bucket_hour column already exists', err: (e as Error).message }),
    );

    await ddlRun(sql`
      CREATE INDEX IF NOT EXISTS ai_decision_log_agent_idx
        ON ai_decision_log (agent_code, created_at DESC)
    `).catch((e: unknown) =>
      this.logger.warn({ msg: 'ai_decision_log agent index creation skipped', err: e }),
    );

    await ddlRun(sql`
      CREATE INDEX IF NOT EXISTS ai_decision_log_entity_idx
        ON ai_decision_log (entity_type, entity_id)
    `).catch((e: unknown) =>
      this.logger.warn({ msg: 'ai_decision_log entity index creation skipped', err: e }),
    );

    await ddlRun(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS ai_decision_log_idempotency_idx
        ON ai_decision_log (agent_code, input_hash, bucket_hour)
    `).catch((e: unknown) =>
      this.logger.warn({ msg: 'ai_decision_log idempotency index creation skipped', err: e }),
    );

    this.logger.log('Sprint-5 ai_decision_log table ensured');
  }
}
