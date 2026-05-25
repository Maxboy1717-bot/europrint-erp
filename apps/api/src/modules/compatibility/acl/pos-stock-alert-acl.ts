/**
 * @module pos-stock-alert-acl
 * @description ACL translator: legacy `pos_warehouse_stock_view` rows (from
 * `pos-warehouse-integration-queries.service.ts:getStockAlerts`) ↔ canonical
 * `PosStockAlertDto` consumed by new BC-4 (Warehouse / WMS) and BC-5 (POS)
 * code.
 *
 * The legacy projection already emits camelCase aliases via the SQL view, but
 * values come back loosely-typed (`unknown`). This translator narrows the
 * shape into a strict DTO with `available`/`minStock`/`maxStock` as
 * `number | null` and `alertType` constrained to the known statuses.
 *
 * TODO PA2-14: drop once a typed `PosStockRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyPosStockAlertRow {
  id?: unknown;
  warehouseCode?: unknown;
  warehouseName?: unknown;
  materialCode?: unknown;
  materialName?: unknown;
  available?: unknown;
  minStock?: unknown;
  maxStock?: unknown;
  alertType?: unknown;
}

export type PosAlertType = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'OTHER';

export interface PosStockAlertDto {
  id: string;
  warehouseCode: string | null;
  warehouseName: string | null;
  materialCode: string | null;
  materialName: string | null;
  available: number | null;
  minStock: number | null;
  maxStock: number | null;
  alertType: PosAlertType;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toNumOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toAlertType(v: unknown): PosAlertType {
  const s = toStr(v);
  if (s === 'OUT_OF_STOCK' || s === 'LOW_STOCK') return s;
  return 'OTHER';
}

export class PosStockAlertAclTranslator
  implements IAclTranslator<LegacyPosStockAlertRow, PosStockAlertDto>
{
  toDomain(legacy: LegacyPosStockAlertRow): Result<PosStockAlertDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'PosStockAlertAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'PosStockAlertAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      warehouseCode: toStr(legacy.warehouseCode),
      warehouseName: toStr(legacy.warehouseName),
      materialCode: toStr(legacy.materialCode),
      materialName: toStr(legacy.materialName),
      available: toNumOrNull(legacy.available),
      minStock: toNumOrNull(legacy.minStock),
      maxStock: toNumOrNull(legacy.maxStock),
      alertType: toAlertType(legacy.alertType),
    });
  }

  toLegacy(domain: PosStockAlertDto): LegacyPosStockAlertRow {
    return {
      id: domain.id,
      warehouseCode: domain.warehouseCode,
      warehouseName: domain.warehouseName,
      materialCode: domain.materialCode,
      materialName: domain.materialName,
      available: domain.available,
      minStock: domain.minStock,
      maxStock: domain.maxStock,
      alertType: domain.alertType,
    };
  }
}
