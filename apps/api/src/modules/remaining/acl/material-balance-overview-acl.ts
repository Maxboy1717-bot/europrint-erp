/**
 * @module material-balance-overview-acl
 * @description ACL translator: legacy material-balance overview payload
 * (from `material-balance.service.ts:getOverview`) ↔ canonical
 * `MaterialBalanceOverviewDto` consumed by new BC-5 (Warehouse / WMS) code.
 *
 * The legacy result wraps an aggregation row inside a `{ success, data }`
 * envelope and emits totals as either string-numeric or number. The
 * translator narrows the wrapper, unwraps `data`, and coerces every KPI
 * field to a finite `number` with a `0` floor.
 *
 * TODO PA2-14: drop once a typed `MaterialBalanceRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyMaterialBalanceOverviewRow {
  success?: unknown;
  data?: unknown;
}

export interface MaterialBalanceOverviewDto {
  totalMaterials: number;
  totalStockValue: number;
  lowStockAlerts: number;
  criticalStockCount: number;
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(String(v));
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n;
}

export class MaterialBalanceOverviewAclTranslator
  implements IAclTranslator<LegacyMaterialBalanceOverviewRow, MaterialBalanceOverviewDto>
{
  toDomain(legacy: LegacyMaterialBalanceOverviewRow): Result<MaterialBalanceOverviewDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'MaterialBalanceOverviewAcl: legacy row is null/non-object'));
    }
    const data = legacy.data;
    if (data == null || typeof data !== 'object') {
      return Err(AppErr('VALIDATION', 'MaterialBalanceOverviewAcl: data envelope missing'));
    }
    const d = data as Record<string, unknown>;
    return Ok({
      totalMaterials: toNum(d['totalMaterials'] ?? d['total_count']),
      totalStockValue: toNum(d['totalStockValue'] ?? d['total_stock_value']),
      lowStockAlerts: toNum(d['lowStockAlerts'] ?? d['low_stock_count']),
      criticalStockCount: toNum(d['criticalStockCount'] ?? d['critical_stock_count']),
    });
  }

  toLegacy(domain: MaterialBalanceOverviewDto): LegacyMaterialBalanceOverviewRow {
    return {
      success: true,
      data: {
        totalMaterials: domain.totalMaterials,
        totalStockValue: domain.totalStockValue,
        lowStockAlerts: domain.lowStockAlerts,
        criticalStockCount: domain.criticalStockCount,
      },
    };
  }
}
