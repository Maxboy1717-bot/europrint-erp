/**
 * @module inventory-freeze.service
 * @description W3-COUNT — inventarizatsiya muzlatish (freeze) + og'ish-sabab biznes-logikasi.
 *   Result<T> qaytaradi; raw throw/null YO'Q. Service db.* chaqirmaydi (repo orqali).
 *
 * Vizyon:
 *   - Inventarizatsiya vaqtida ombor-zona (yoki ayrim material) MUZLATILADI.
 *   - Muzlatilgan zonadan chiqim (goods-issue) BLOKLANADI — bu service'ning
 *     `checkExitAllowed()` metodi chiqim hard-gate'ida (GoodsIssueHandler) ADDITIVE
 *     chaqiriladi. Muzlatish yo'q → fail-open (chiqim o'tadi, regress YO'Q).
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  INVENTORY_FREEZE_REPO,
  type IInventoryFreezeRepo,
  type FreezeZoneInput,
} from '../domain/repositories/i-inventory-freeze.repo';

export interface ExitFreezeCheck {
  allowed: boolean;
  /** Muzlatish topilsa — bloklash kodi (chiqimda BUSINESS_RULE_VIOLATION sababi). */
  blockCode: 'BLOCK_ZONE_FROZEN' | null;
  message: string | null;
}

@Injectable()
export class InventoryFreezeService {
  private readonly logger = new Logger(InventoryFreezeService.name);

  constructor(
    @Inject(INVENTORY_FREEZE_REPO) private readonly repo: IInventoryFreezeRepo,
  ) {}

  /**
   * Chiqim hard-gate uchun: berilgan ombor + material AKTIV muzlatishda bo'lsa BLOK.
   * Muzlatish yo'q → allowed=true (fail-open, mavjud chiqim oqimi O'ZGARMAYDI).
   */
  async checkExitAllowed(warehouseId: number, materialId: number): Promise<Result<ExitFreezeCheck>> {
    const r = await this.repo.findActiveFreeze(warehouseId, materialId);
    if (!r.ok) {
      // Tekshiruv xatosi chiqimni TO'XTATMAYDI (fail-open) — lekin loglanadi.
      this.logger.error(
        { code: 'EP-WMS-FREEZE-ERR', warehouseId, materialId, error: r.error.message },
        'Freeze tekshiruvida xato — fail-open',
      );
      return Ok({ allowed: true, blockCode: null, message: null });
    }
    const freeze = r.data;
    if (!freeze) {
      return Ok({ allowed: true, blockCode: null, message: null });
    }
    const scope = freeze.material_id == null ? 'butun zona' : `material #${String(freeze.material_id)}`;
    const msg = `Inventarizatsiya muzlatishi faol (${scope}) — chiqim bloklandi (zona #${warehouseId})`;
    this.logger.warn(
      { code: 'EP-WMS-ZONE-FROZEN', warehouseId, materialId, freezeId: freeze.id },
      msg,
    );
    return Ok({ allowed: false, blockCode: 'BLOCK_ZONE_FROZEN', message: msg });
  }

  async freezeZone(input: FreezeZoneInput): Promise<Result<object, AppError>> {
    return this.repo.createFreeze(input);
  }

  async releaseZone(id: number, releasedBy: number | null): Promise<Result<object | null, AppError>> {
    return this.repo.releaseFreeze(id, releasedBy);
  }

  async listFreezes(status?: string, warehouseId?: number): Promise<Result<object, AppError>> {
    return this.repo.listFreezes(status, warehouseId);
  }

  async listDeviationReasons(): Promise<Result<object, AppError>> {
    return this.repo.listDeviationReasons();
  }

  /** Og'ish kodi katalogda mavjud va aktivmi (count-line saqlashda majburiy). */
  async validateDeviationReason(code: string): Promise<Result<boolean, AppError>> {
    return this.repo.deviationReasonExists(code);
  }
}
