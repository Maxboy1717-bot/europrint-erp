/**
 * @module sd-legacy-order.service
 * @description Business-logic service for the optional legacy 1C (Zakaz 1S) order number.
 *   Returns Result<T> (Qoida 1); NOT_FOUND when the order id is unknown / soft-deleted.
 *   vision 06-sd#154.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, AppErr, Result } from '@common/result';
import { SdLegacyOrderRepository } from '../orders/sd-legacy-order.repository';

export interface LegacyOrderView {
  id: number;
  legacyOrderNumber: string | null;
}

@Injectable()
export class SdLegacyOrderService {
  constructor(private readonly repo: SdLegacyOrderRepository) {}

  async getLegacyNumber(id: number): Promise<Result<LegacyOrderView>> {
    const res = await this.repo.getLegacyNumber(id);
    if (!res.ok) return res as Result<LegacyOrderView>;
    if (!res.data) return Err(AppErr('NOT_FOUND', `Buyurtma #${id} topilmadi`));
    return Ok({ id: res.data.id, legacyOrderNumber: res.data.legacy_order_number });
  }

  async setLegacyNumber(id: number, legacyOrderNumber: string | null): Promise<Result<LegacyOrderView>> {
    // Free-text migration-bridge id — trim; an empty string clears it back to NULL.
    const trimmed = typeof legacyOrderNumber === 'string' ? legacyOrderNumber.trim() : null;
    const value = trimmed ? trimmed : null;
    const res = await this.repo.updateLegacyNumber(id, value);
    if (!res.ok) return res as Result<LegacyOrderView>;
    if (!res.data) return Err(AppErr('NOT_FOUND', `Buyurtma #${id} topilmadi`));
    return Ok({ id: res.data.id, legacyOrderNumber: res.data.legacy_order_number });
  }
}
