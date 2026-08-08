/**
 * @module promo-codes.repository
 * @description Repository / data-access layer for marketing promo codes (promo_codes table,
 *   vision-1000-answers/14-marketing.md #20 -- "Promo-kod 1 mijoz / 1 kampaniya bo'yicha
 *   cheklangan (default); cheklash qoidasini marketing boshliq kampaniya sozlamalarida
 *   belgilaydi"). Raw SQL via typedExecute -- promo_codes is a brand-new table, not yet in
 *   the @europrint/schemas Drizzle stubs (same reason campaigns.repository.ts in this same
 *   parent folder uses raw SQL for marketing_campaigns -- see that file's header).
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { typedExecute } from '@shared/db/typed-execute';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

const COLS = sql`
  id, code, campaign_id AS "campaignId", customer_id AS "customerId",
  usage_limit AS "usageLimit", used_count AS "usedCount", created_at AS "createdAt"`;

@Injectable()
export class PromoCodesRepository {
  async findAll(campaignId?: string): Promise<Result<Row[]>> {
    try {
      const rows = campaignId
        ? await typedExecute<Row>(sql`SELECT ${COLS} FROM promo_codes WHERE campaign_id = ${campaignId} ORDER BY created_at DESC`)
        : await typedExecute<Row>(sql`SELECT ${COLS} FROM promo_codes ORDER BY created_at DESC`);
      return Ok(rows);
    } catch (_e) { return Err(String(_e)); }
  }

  async findOne(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await typedExecute<Row>(sql`SELECT ${COLS} FROM promo_codes WHERE id = ${id} LIMIT 1`);
      return Ok(rows[0] ?? null);
    } catch (_e) { return Err(String(_e)); }
  }

  async create(values: Row): Promise<Result<Row>> {
    try {
      const rows = await typedExecute<Row>(sql`
        INSERT INTO promo_codes (code, campaign_id, customer_id, usage_limit, used_count, created_at)
        VALUES (
          ${values.code as string}, ${values.campaignId as string}, ${(values.customerId as number) ?? null}::integer,
          ${(values.usageLimit as number) ?? 1}::integer, 0, NOW())
        RETURNING ${COLS}`);
      return Ok(rows[0] as Row);
    } catch (_e) { return Err(String(_e)); }
  }

  /** Atomic redeem: increments used_count only if still under usage_limit (race-safe, single statement). */
  async redeem(id: number): Promise<Result<Row>> {
    try {
      const rows = await typedExecute<Row>(sql`
        UPDATE promo_codes SET used_count = used_count + 1
        WHERE id = ${id} AND used_count < usage_limit
        RETURNING ${COLS}`);
      if (!rows[0]) return Err('PROMO_CODE_LIMIT_REACHED');
      return Ok(rows[0] as Row);
    } catch (_e) { return Err(String(_e)); }
  }

  async remove(id: number): Promise<Result<void>> {
    try {
      await typedExecute<Row>(sql`DELETE FROM promo_codes WHERE id = ${id}`);
      return Ok();
    } catch (_e) { return Err(String(_e)); }
  }
}
