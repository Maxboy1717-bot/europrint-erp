/**
 * @module wake-config.repo
 * @description Persists the Porcupine wake-word sensitivity the Director sets
 * via `PATCH /api/aisha/wake/sensitivity`. Previously held only in an
 * in-memory field on the controller (lost on every restart) — this repo backs
 * it with the existing generic `settings` key-value table (no new table;
 * Qoida 35) under the fixed key `aisha_wake_sensitivity`.
 *
 * Data-access style mirrors `aisha-history.repo.ts` (RULE4_EXCEPTION): raw
 * parametrised SQL via `db.execute(sql\`…\`)` — `settings` has no Drizzle
 * table builder in this codebase and the query is a single scalar
 * read/upsert, so pulling one in adds no value. Every parameter is bound
 * (Qoida B).
 *
 * `settings.key` has no UNIQUE constraint, so upsert is done as
 * UPDATE-then-INSERT-if-absent rather than `ON CONFLICT`.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { Result, safeCall } from '@common/result';
import { rowsOf } from '../../application/tools/_helpers';

const SETTINGS_KEY = 'aisha_wake_sensitivity';

@Injectable()
export class WakeConfigRepository {
  /** Read the persisted sensitivity, or null if never set. */
  async getSensitivity(): Promise<Result<number | null>> {
    return safeCall<number | null>(async () => {
      const rows = rowsOf<{ value: string }>(await db.execute(sql`
        SELECT value FROM settings WHERE key = ${SETTINGS_KEY} LIMIT 1
      `));
      const raw = rows[0]?.value;
      if (raw === undefined) return null;
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : null;
    });
  }

  /** Persist the new sensitivity (upsert by key). */
  async setSensitivity(sensitivity: number, updatedByUserId: number | null): Promise<Result<void>> {
    return safeCall<void>(async () => {
      const updated = rowsOf<{ id: string }>(await db.execute(sql`
        UPDATE settings
        SET value = ${String(sensitivity)}, updated_at = now()
        WHERE key = ${SETTINGS_KEY}
        RETURNING id::text AS id
      `));
      if (updated.length > 0) return;
      // updated_by is `uuid` in this table while our auth user id is an
      // integer — the two id spaces don't line up, so we leave it NULL
      // (nullable column) rather than write a fabricated/mismatched value.
      void updatedByUserId;
      await db.execute(sql`
        INSERT INTO settings (id, key, value, updated_at)
        VALUES (gen_random_uuid(), ${SETTINGS_KEY}, ${String(sensitivity)}, now())
      `);
    });
  }
}
