/**
 * @module campaigns.repository
 * @description Repository / data-access layer for marketing campaigns (CANONICAL = marketing_campaigns,
 *   owner 2026-06-05). Raw SQL against the LIVE columns on purpose: the @europrint/schemas
 *   `marketingCampaigns` stub is drifted (id typed number/serial, but the live id is varchar(36) uuid
 *   with no default; the stub also omits description/platform). The ORM path therefore could never
 *   create (id NULL violation) or look up by the real uuid. Columns are aliased to camelCase so the
 *   result shape matches what the FE + the previous Drizzle mapping returned.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { randomUUID } from 'crypto';
import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

// Live columns -> camelCase aliases (FE reads startDate/createdAt/etc.).
const COLS = sql`
  id, name, description, type, platform, status, budget,
  spent_amount AS "spentAmount", start_date AS "startDate", end_date AS "endDate",
  target_audience AS "targetAudience", created_by AS "createdBy",
  created_at AS "createdAt", updated_at AS "updatedAt", deleted_at AS "deletedAt"`;

@Injectable()
export class CampaignsRepository {
  async findAll(): Promise<Result<Row[]>> {
    try {
      const rows = await typedExecute<Row>(sql`
        SELECT ${COLS} FROM marketing_campaigns WHERE deleted_at IS NULL ORDER BY created_at DESC`);
      return Ok(rows);
    } catch (_e) { return Err(String(_e)); }
  }

  async findOne(id: string): Promise<Result<Row | null>> {
    try {
      const rows = await typedExecute<Row>(sql`
        SELECT ${COLS} FROM marketing_campaigns WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`);
      return Ok(rows[0] ?? null);
    } catch (_e) { return Err(String(_e)); }
  }

  async create(values: Row): Promise<Result<Row>> {
    try {
      const id = (values.id as string | undefined) ?? randomUUID();
      const rows = await typedExecute<Row>(sql`
        INSERT INTO marketing_campaigns
          (id, name, description, type, platform, status, budget, start_date, end_date, target_audience, created_by, created_at, updated_at)
        VALUES (
          ${id}, ${(values.name as string) ?? ''}, ${(values.description as string) ?? null}, ${(values.type as string) ?? 'digital'},
          ${(values.platform as string) ?? null}, ${(values.status as string) ?? 'draft'}, ${(values.budget as string) ?? null}::numeric,
          ${(values.startDate as string) ?? null}::timestamp, ${(values.endDate as string) ?? null}::timestamp,
          ${(values.targetAudience as string) ?? null}, ${(values.createdBy as number) ?? null}::integer, NOW(), NOW())
        RETURNING ${COLS}`);
      return Ok(rows[0] as Row);
    } catch (_e) { return Err(String(_e)); }
  }

  async update(id: string, values: Row): Promise<Result<Row>> {
    try {
      const rows = await typedExecute<Row>(sql`
        UPDATE marketing_campaigns SET
          name            = COALESCE(${(values.name as string) ?? null}, name),
          description     = COALESCE(${(values.description as string) ?? null}, description),
          type            = COALESCE(${(values.type as string) ?? null}, type),
          platform        = COALESCE(${(values.platform as string) ?? null}, platform),
          status          = COALESCE(${(values.status as string) ?? null}, status),
          budget          = COALESCE(${(values.budget as string) ?? null}::numeric, budget),
          start_date      = COALESCE(${(values.startDate as string) ?? null}::timestamp, start_date),
          end_date        = COALESCE(${(values.endDate as string) ?? null}::timestamp, end_date),
          target_audience = COALESCE(${(values.targetAudience as string) ?? null}, target_audience),
          updated_at      = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING ${COLS}`);
      return Ok(rows[0] as Row);
    } catch (_e) { return Err(String(_e)); }
  }

  async softDelete(id: string): Promise<Result<void>> {
    try {
      await db.execute(sql`UPDATE marketing_campaigns SET deleted_at = ${_time.now()} WHERE id = ${id}`);
      return Ok();
    } catch (_e) { return Err(String(_e)); }
  }
}
