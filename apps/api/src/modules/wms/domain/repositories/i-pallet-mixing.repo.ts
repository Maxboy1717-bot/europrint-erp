/**
 * @module i-pallet-mixing.repo
 * @description Domain repository interface — 10-wms #17 "bir paletda 2 partiya"
 *   (two-batches-on-one-pallet) ogohlantirish. Konkret implementatsiya:
 *   `infrastructure/repositories/pallet-mixing.repository.ts`. Jadval: batch_lots
 *   (pallet_id ustuni; migration: shared/db/migrations/w-wms-17-batch-lots-pallet-id-2026-07-11.sql).
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IPalletMixingRepo {
  /**
   * Faol partiyaga (batch_lots) pallet_id biriktiradi. Faqat is_active=true satr.
   * Satr topilmasa null (service NOT_FOUND ga aylantiradi).
   */
  assignPalletToLot(lotId: number, warehouseId: number, palletId: string): Promise<Result<Row | null>>;
  /** Berilgan paletdagi DISTINCT partiya (batch_number) soni (faqat faol). */
  countDistinctBatchesOnPallet(warehouseId: number, palletId: string): Promise<Result<number>>;
  /** Ombordagi ARALASH paletlar: bitta pallet_id ostida >=2 distinct partiya. */
  listMixedPallets(warehouseId: number): Promise<Result<Row[]>>;
}

export const PALLET_MIXING_REPO = Symbol('PALLET_MIXING_REPO');
