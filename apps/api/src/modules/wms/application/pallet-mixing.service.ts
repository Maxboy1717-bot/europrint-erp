/**
 * @module pallet-mixing.service
 * @description 10-wms #17 — "bir paletda 2 partiya" biznes-logikasi. Result<T> qaytaradi;
 *   raw throw/null YO'Q. Service db.* chaqirmaydi (repo orqali — Qoida 15).
 *
 * Vizyon (vision-1000-answers/10-warehouse.md #17): bitta jismoniy paletga 2-chi DISTINCT
 *   partiya tushsa "Aralash" ogohlantirish — BLOK EMAS (operator davom etadi). Chegara/master-data
 *   kerak emas: aniqlash sof duplikat-so'rov (>=2 distinct batch_number bitta pallet_id ostida).
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppError, AppErr } from '@common/result';
import { PALLET_MIXING_REPO, type IPalletMixingRepo } from '../domain/repositories/i-pallet-mixing.repo';

export interface PalletAssignResult {
  lot: Record<string, unknown>;
  palletId: string;
  distinctBatches: number;
  /** true = paletda >=2 distinct partiya (Aralash). */
  mixed: boolean;
  /** Aralash bo'lsa ogohlantirish matni; aks holda null (blok EMAS). */
  warning: string | null;
}

@Injectable()
export class PalletMixingService {
  private readonly logger = new Logger(PalletMixingService.name);

  constructor(
    @Inject(PALLET_MIXING_REPO) private readonly repo: IPalletMixingRepo,
  ) {}

  /**
   * Partiyaga pallet_id biriktiradi va biriktirishdan KEYIN paletdagi distinct-partiya
   * sonini tekshiradi. >=2 bo'lsa mixed=true + warning (blok EMAS — satr baribir saqlanadi).
   */
  async assignPallet(lotId: number, warehouseId: number, palletId: string): Promise<Result<PalletAssignResult>> {
    const trimmed = (palletId ?? '').trim();
    if (!trimmed) return Err(AppErr('VALIDATION', "pallet_id bo'sh bo'lishi mumkin emas"));

    const assigned = await this.repo.assignPalletToLot(lotId, warehouseId, trimmed);
    if (!assigned.ok) return Err(assigned.error);
    if (!assigned.data) {
      return Err(AppErr('NOT_FOUND', `Faol partiya topilmadi (lot #${lotId}, ombor #${warehouseId})`));
    }

    const cnt = await this.repo.countDistinctBatchesOnPallet(warehouseId, trimmed);
    if (!cnt.ok) return Err(cnt.error);

    const distinctBatches = cnt.data;
    const mixed = distinctBatches >= 2;
    const warning = mixed
      ? `Aralash paddon: #${trimmed} paletida ${distinctBatches} xil partiya bor (blok emas — ogohlantirish)`
      : null;

    if (mixed) {
      this.logger.warn(
        { code: 'EP-WMS-PALLET-MIXED', warehouseId, palletId: trimmed, distinctBatches },
        warning ?? '',
      );
    }

    return Ok({ lot: assigned.data, palletId: trimmed, distinctBatches, mixed, warning });
  }

  /** Ombordagi barcha aralash-palet ogohlantirishlari (blok emas). */
  async listWarnings(warehouseId: number): Promise<Result<object, AppError>> {
    return this.repo.listMixedPallets(warehouseId);
  }
}
