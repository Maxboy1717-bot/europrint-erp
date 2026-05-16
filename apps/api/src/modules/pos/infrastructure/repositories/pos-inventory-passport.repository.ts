/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Dynamic AND-list filter composition via sql.join(filters, sql` AND `)
 *     inlined into a `WHERE 1=1 ${whereClause}` skeleton — Drizzle's typed
 *     query builder requires up-front knowledge of every filter column and
 *     cannot interpolate a pre-built AND chain produced from optional inputs.
 *   - NOW() - INTERVAL '1 hour' * ${hours} expired-quarantine arithmetic in
 *     WHERE clause (interval-times-scalar expression has no Drizzle helper).
 *   - 'CURRENT_DATE' SQL literal default for arrival_date passed as a value
 *     parameter — Drizzle would bind it as a string instead of evaluating it.
 *   - ILIKE supplier_name '%' || ${param} || '%' fuzzy matching with the
 *     concatenated wildcards parameterized server-side.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module pos-inventory-passport.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface PassportRow {
  id: number;
  movementId: number;
  materialCode?: string;
  supplierName?: string;
  contractNumber?: string;
  waybillNumber?: string;
  arrivalDate: string;
  quantity: number;
  weightKg?: number;
  volumeM3?: number;
  certificateNumber?: string;
  quarantineStartedAt?: string;
  qcStartedAt?: string;
  qcResult?: string;
  qcNote?: string;
  transferredAt?: string;
  createdAt: string;
}

export interface CreatePassportDto {
  movementId: number;
  materialCode?: string;
  supplierName?: string;
  contractNumber?: string;
  waybillNumber?: string;
  arrivalDate?: string;
  quantity: number;
  weightKg?: number;
  volumeM3?: number;
  certificateNumber?: string;
}

@Injectable()
export class PosInventoryPassportRepository {
  async create(dto: CreatePassportDto): Promise<Result<PassportRow>> {
    try {
      const r = await runQuery<PassportRow>(sql`
        INSERT INTO pos_inventory_passport
          (movement_id, material_code, supplier_name, contract_number, waybill_number,
           arrival_date, quantity, weight_kg, volume_m3, certificate_number, quarantine_started_at)
        VALUES
          (${dto.movementId}, ${dto.materialCode ?? null}, ${dto.supplierName ?? null},
           ${dto.contractNumber ?? null}, ${dto.waybillNumber ?? null},
           ${dto.arrivalDate ?? 'CURRENT_DATE'}, ${dto.quantity},
           ${dto.weightKg ?? null}, ${dto.volumeM3 ?? null}, ${dto.certificateNumber ?? null}, NOW())
        RETURNING *
      `);
      return Ok(r.rows[0]);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async findByMovement(movementId: number): Promise<Result<PassportRow | null>> {
    try {
      const r = await runQuery<PassportRow>(sql`
        SELECT * FROM pos_inventory_passport WHERE movement_id = ${movementId} LIMIT 1
      `);
      return Ok(r.rows[0] ?? null);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async findAll(opts: { supplierId?: string; fromDate?: string; toDate?: string; qcResult?: string; limit?: number; offset?: number }): Promise<Result<{ rows: PassportRow[]; total: number }>> {
    try {
      // Fully parameterized filters — no sql.raw(), no string concatenation
      const filters: ReturnType<typeof sql>[] = [];
      if (opts.supplierId) filters.push(sql`supplier_name ILIKE ${'%' + opts.supplierId + '%'}`);
      if (opts.fromDate)   filters.push(sql`arrival_date >= ${opts.fromDate}`);
      if (opts.toDate)     filters.push(sql`arrival_date <= ${opts.toDate}`);
      if (opts.qcResult)   filters.push(sql`qc_result = ${opts.qcResult}`);
      const whereClause = filters.length > 0
        ? sql`AND ${sql.join(filters, sql` AND `)}`
        : sql``;
      const limit = opts.limit ?? 50;
      const offset = opts.offset ?? 0;

      const [dataR, countR] = await Promise.all([
        runQuery<PassportRow>(sql`SELECT * FROM pos_inventory_passport WHERE 1=1 ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`),
        runQuery<{ c: string }>(sql`SELECT COUNT(*)::text AS c FROM pos_inventory_passport WHERE 1=1 ${whereClause}`),
      ]);
      return Ok({ rows: dataR.rows, total: Number(countR.rows[0]?.c ?? 0) });
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async updateQcResult(movementId: number, qcResult: 'QABUL' | 'REWORK' | 'CHIQARISH', qcNote?: string): Promise<Result<PassportRow>> {
    try {
      const r = await runQuery<PassportRow>(sql`
        UPDATE pos_inventory_passport
        SET qc_result = ${qcResult}, qc_note = ${qcNote ?? null}, qc_started_at = NOW(), updated_at = NOW()
        WHERE movement_id = ${movementId}
        RETURNING *
      `);
      return Ok(r.rows[0]);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async markTransferred(movementId: number): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE pos_inventory_passport SET transferred_at = NOW(), updated_at = NOW()
        WHERE movement_id = ${movementId}
      `);
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async getQuarantineList(): Promise<Result<PassportRow[]>> {
    try {
      const r = await runQuery<PassportRow>(sql`
        SELECT p.*, m.movement_number, m.status
        FROM pos_inventory_passport p
        JOIN pos_movements m ON m.id = p.movement_id
        WHERE p.qc_result IS NULL AND p.transferred_at IS NULL
        ORDER BY p.quarantine_started_at ASC
      `);
      return Ok(r.rows);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async getExpiredQuarantine(hours: number): Promise<Result<PassportRow[]>> {
    try {
      const r = await runQuery<PassportRow>(sql`
        SELECT * FROM pos_inventory_passport
        WHERE qc_result IS NULL
          AND transferred_at IS NULL
          AND quarantine_started_at < NOW() - INTERVAL '1 hour' * ${hours}
      `);
      return Ok(r.rows);
    } catch (e: unknown) { return Err((e as Error).message); }
  }
}
