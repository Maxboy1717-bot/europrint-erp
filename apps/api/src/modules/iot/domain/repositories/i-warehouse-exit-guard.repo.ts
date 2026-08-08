/**
 * @module i-warehouse-exit-guard.repo
 * @description Domain repository interface — FAZA Q (Ombor AI-kamera nazorati).
 *   Cross-checks a claimed employee identity at a warehouse-exit camera against
 *   HR face-recognition (reused, not duplicated) and — when a WMS goods-issue is
 *   referenced — against the recorded issuer of that document. Persists the
 *   result in the (previously unwired) `ai_camera_cross_check` table.
 * @layer Domain (IoT)
 */

import type { Result } from '@common/result';

export interface CrossCheckRow {
  id: number;
  employee_id: number;
  shift_id: number | null;
  expected_location: string | null;
  detected_location: string | null;
  match_score: string | null;
  anomaly_detected: boolean;
  camera_source: string | null;
  checked_at: Date;
  created_at: Date;
}

export interface InsertCrossCheckInput {
  employeeId: number;
  shiftId: number | null;
  expectedLocation: string | null;
  detectedLocation: string | null;
  matchScore: number | null;
  anomalyDetected: boolean;
  cameraSource: string | null;
}

export interface GoodsIssueForGuard {
  id: number;
  material_id: number;
  warehouse_id: number;
  quantity: string;
  issued_by: number | null;
  issued_at: Date | null;
  warehouse_name: string | null;
}

export interface IWarehouseExitGuardRepo {
  insertCrossCheck(input: InsertCrossCheckInput): Promise<Result<CrossCheckRow>>;
  listCrossChecks(anomalyOnly: boolean, limit: number): Promise<Result<CrossCheckRow[]>>;
  /** Raw lookup (no Drizzle table exists for wms_goods_issues anywhere — WMS module convention). */
  getGoodsIssueForGuard(goodsIssueId: number): Promise<Result<GoodsIssueForGuard | null>>;
}

export const WAREHOUSE_EXIT_GUARD_REPO = Symbol('WAREHOUSE_EXIT_GUARD_REPO');
