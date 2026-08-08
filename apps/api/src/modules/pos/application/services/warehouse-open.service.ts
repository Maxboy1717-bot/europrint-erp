/**
 * @module warehouse-open.service
 * @description POS Terminal — kirgach is_primary ombor AVTO-ochiladi; switcher uchun ro'yxat.
 * Spec: OMBOR-TERMINAL-INTERFEYS-SPEC-2026-06-27.md.
 *   - getMyWarehouses: { warehouses[], defaultWarehouseId } — is_primary default, bir nechta → switcher.
 *   - getLabelConfig:  per-warehouse-type etiket o'lcham (Q-40: config yo'q → DEFAULT_LABEL_CONFIG).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppError } from '@common/result';
import {
  WarehouseOpenRepository,
  DEFAULT_LABEL_CONFIG,
  type MyWarehouse,
  type LabelConfig,
} from '../../infrastructure/repositories/warehouse-open.repository';

export type { MyWarehouse, LabelConfig };

export interface MyWarehousesResult {
  warehouses:         MyWarehouse[];
  defaultWarehouseId: number | null;
  /** Bir nechta ombor bo'lsa TEPADA 'ombor almashtirish' tugmasi ko'rsatiladi. */
  canSwitch:          boolean;
}

@Injectable()
export class WarehouseOpenService {
  private readonly logger = new Logger(WarehouseOpenService.name);

  constructor(private readonly repo: WarehouseOpenRepository) {}

  /** Joriy user omborlari + avto-ochiladigan (is_primary) default. */
  async getMyWarehouses(userId: number): Promise<Result<MyWarehousesResult, AppError>> {
    const r = await this.repo.listMyWarehouses(userId);
    if (!r.ok) return Err(r.error);
    const warehouses = Array.isArray(r.data) ? r.data : [];
    // is_primary birinchi (repo ORDER BY is_primary DESC) → default = birinchi.
    const primary = warehouses.find(w => w.isPrimary) ?? warehouses[0] ?? null;
    return Ok({
      warehouses,
      defaultWarehouseId: primary ? primary.warehouseId : null,
      canSwitch: warehouses.length > 1,
    });
  }

  /** Ombor-turi uchun etiket config — yo'q bo'lsa default qaytaradi (Q-40 graceful). */
  async getLabelConfig(warehouseType: string): Promise<Result<LabelConfig, AppError>> {
    const r = await this.repo.findLabelConfig(warehouseType);
    if (!r.ok) return Err(r.error);
    if (r.data) return Ok(r.data);
    return Ok({
      id:            null,
      warehouseType,
      labelWidthMm:  DEFAULT_LABEL_CONFIG.labelWidthMm,
      labelHeightMm: DEFAULT_LABEL_CONFIG.labelHeightMm,
      template:      DEFAULT_LABEL_CONFIG.template,
      isDefault:     true,
    });
  }

  /** Ombor (id) bo'yicha etiket config — w.type ni topib, getLabelConfig'ga delegate. */
  async getLabelConfigByWarehouse(warehouseId: number): Promise<Result<LabelConfig, AppError>> {
    const typeR = await this.repo.findWarehouseType(warehouseId);
    if (!typeR.ok) return Err(typeR.error);
    return this.getLabelConfig(typeR.data ?? '');
  }

  async listLabelConfigs(): Promise<Result<LabelConfig[], AppError>> {
    return this.repo.listLabelConfigs();
  }

  async upsertLabelConfig(dto: {
    warehouseType:  string;
    labelWidthMm:   number;
    labelHeightMm:  number;
    template:       string;
    updatedBy:      number;
  }): Promise<Result<LabelConfig, AppError>> {
    const result = await this.repo.upsertLabelConfig(dto);
    if (result.ok) {
      this.logger.log(`Etiket config saqlandi: type=${dto.warehouseType} ${dto.labelWidthMm}x${dto.labelHeightMm}`);
    }
    return result;
  }
}
