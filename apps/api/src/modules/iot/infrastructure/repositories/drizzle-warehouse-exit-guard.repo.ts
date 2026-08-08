/**
 * @module drizzle-warehouse-exit-guard.repo
 * @description Repository / data-access layer — FAZA Q (Ombor AI-kamera nazorati).
 * @layer Infrastructure (IoT)
 */

import { Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { db, runQuery, ai_camera_cross_check } from '@shared/db';
import { Ok, Err, Result } from '@common/result';
import type {
  IWarehouseExitGuardRepo,
  CrossCheckRow,
  InsertCrossCheckInput,
  GoodsIssueForGuard,
} from '../../domain/repositories/i-warehouse-exit-guard.repo';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleWarehouseExitGuardRepo implements IWarehouseExitGuardRepo {
  async insertCrossCheck(input: InsertCrossCheckInput): Promise<Result<CrossCheckRow>> {
    try {
      const [row] = await db.insert(ai_camera_cross_check).values({
        employee_id: input.employeeId,
        shift_id: input.shiftId,
        expected_location: input.expectedLocation,
        detected_location: input.detectedLocation,
        match_score: input.matchScore != null ? String(input.matchScore) : null,
        anomaly_detected: input.anomalyDetected,
        camera_source: input.cameraSource,
      }).returning();
      if (!row) return Err('ai_camera_cross_check yozib bo\'lmadi');
      return Ok(row as CrossCheckRow);
    } catch (e) {
      return Err((e as Error).message);
    }
  }

  async listCrossChecks(anomalyOnly: boolean, limit: number): Promise<Result<CrossCheckRow[]>> {
    try {
      const rows = await db.select()
        .from(ai_camera_cross_check)
        .where(anomalyOnly ? eq(ai_camera_cross_check.anomaly_detected, true) : undefined)
        .orderBy(desc(ai_camera_cross_check.checked_at))
        .limit(limit);
      return Ok(rows as CrossCheckRow[]);
    } catch (e) {
      return Err((e as Error).message);
    }
  }

  /**
   * `wms_goods_issues` has NO Drizzle table anywhere in the codebase (WMS module
   * itself only ever accesses it via raw parametrized SQL — see
   * modules/wms/infrastructure/repositories/wms-crud.repository.ts#getGoodsIssueById).
   * This mirrors that established convention rather than introducing a second,
   * possibly-drifting Drizzle mapping for a table this module does not own.
   */
  async getGoodsIssueForGuard(goodsIssueId: number): Promise<Result<GoodsIssueForGuard | null>> {
    try {
      const res = await runQuery<Row>(sql`
        SELECT gi.id, gi.material_id, gi.warehouse_id, gi.quantity, gi.issued_by, gi.issued_at,
               w.name AS warehouse_name
        FROM wms_goods_issues gi
        LEFT JOIN warehouses w ON gi.warehouse_id = w.id
        WHERE gi.id = ${goodsIssueId} AND gi.deleted_at IS NULL
      `);
      const rows = Array.isArray(res?.rows) ? res.rows : [];
      const row = rows[0];
      if (!row) return Ok(null);
      return Ok({
        id: Number(row.id),
        material_id: Number(row.material_id),
        warehouse_id: Number(row.warehouse_id),
        quantity: String(row.quantity),
        issued_by: row.issued_by != null ? Number(row.issued_by) : null,
        issued_at: row.issued_at ? new Date(String(row.issued_at)) : null,
        warehouse_name: row.warehouse_name != null ? String(row.warehouse_name) : null,
      });
    } catch (e) {
      return Err((e as Error).message);
    }
  }
}
