/**
 * @module pallet-mixing.repository
 * @description 10-wms #17 data-access (Drizzle raw SQL, Result<T>). Jadval: batch_lots
 *   (pallet_id ustuni). Boshqa barcha batch_lots kirishlari kabi raw SQL (rawSql/runQuery) —
 *   bu jadval Drizzle pgTable sifatida ta'riflanmagan (14 fayl hammasi raw SQL bilan kiradi).
 * @layer Infrastructure (WMS)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import type { IPalletMixingRepo } from '../../domain/repositories/i-pallet-mixing.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> =>
  safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class PalletMixingRepository implements IPalletMixingRepo {
  async assignPalletToLot(lotId: number, warehouseId: number, palletId: string): Promise<Result<Row | null>> {
    const r = await exec(sql`
      UPDATE batch_lots
      SET pallet_id = ${palletId}
      WHERE id = ${lotId} AND warehouse_id = ${warehouseId} AND is_active = true
      RETURNING id, batch_number, warehouse_id, pallet_id
    `);
    if (!r.ok) return Err(r.error);
    return Ok(r.data[0] ?? null);
  }

  async countDistinctBatchesOnPallet(warehouseId: number, palletId: string): Promise<Result<number>> {
    const r = await exec(sql`
      SELECT COUNT(DISTINCT batch_number)::int AS distinct_batches
      FROM batch_lots
      WHERE warehouse_id = ${warehouseId} AND pallet_id = ${palletId} AND is_active = true
    `);
    if (!r.ok) return Err(r.error);
    return Ok(Number((r.data[0]?.distinct_batches as number | undefined) ?? 0));
  }

  async listMixedPallets(warehouseId: number): Promise<Result<Row[]>> {
    // >=2 distinct partiya (batch_number) bitta non-null pallet_id ostida = "Aralash".
    return exec(sql`
      SELECT bl.pallet_id AS "palletId",
             COUNT(DISTINCT bl.batch_number)::int AS "distinctBatches",
             array_agg(DISTINCT bl.batch_number) AS "batchNumbers",
             array_agg(bl.id ORDER BY bl.id) AS "lotIds"
      FROM batch_lots bl
      WHERE bl.warehouse_id = ${warehouseId} AND bl.is_active = true AND bl.pallet_id IS NOT NULL
      GROUP BY bl.pallet_id
      HAVING COUNT(DISTINCT bl.batch_number) >= 2
      ORDER BY bl.pallet_id
    `);
  }
}
