/**
 * @module i-inventory-freeze.repo
 * @description Domain repository interface for W3-COUNT inventarizatsiya muzlatish
 *   (inventory freeze zones) va og'ish sabablari (deviation reasons) katalogi.
 *   Konkret implementatsiya:
 *   `infrastructure/repositories/inventory-freeze.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface FreezeZoneInput {
  warehouseId: number;
  /** NULL = butun zona muzlaydi; aks holda faqat shu material. */
  materialId: number | null;
  countId: number | null;
  reason: string | null;
  frozenBy: number | null;
}

export interface IInventoryFreezeRepo {
  /**
   * Berilgan ombor + (ixtiyoriy) material uchun AKTIV muzlatish bormi?
   * Butun-zona muzlatishi (material_id IS NULL) har qanday materialni qamrab oladi.
   */
  findActiveFreeze(warehouseId: number, materialId: number): Promise<Result<Row | null>>;
  createFreeze(input: FreezeZoneInput): Promise<Result<Row>>;
  releaseFreeze(id: number, releasedBy: number | null): Promise<Result<Row | null>>;
  listFreezes(status?: string, warehouseId?: number): Promise<Result<Row[]>>;
  /** Og'ish sabablari katalogi (faqat aktiv). */
  listDeviationReasons(): Promise<Result<Row[]>>;
  /** Kod katalogda mavjud va aktivmi (majburiy izoh validatsiyasi). */
  deviationReasonExists(code: string): Promise<Result<boolean>>;
}

export const INVENTORY_FREEZE_REPO = Symbol('INVENTORY_FREEZE_REPO');
