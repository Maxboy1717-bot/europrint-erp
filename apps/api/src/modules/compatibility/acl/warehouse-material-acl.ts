/**
 * @module warehouse-material-acl
 * @description ACL translator: legacy `material_cards` rows (from
 * `warehouse-catalog.service.ts:getMaterials`) ↔ canonical
 * `WarehouseMaterialDto` consumed by new BC-5 (Warehouse / WMS) code.
 *
 * The legacy raw SQL already aliases most columns to camelCase via SQL
 * `AS` but emits `kod`/`category`/`xomAshyo` as `unknown`. The translator
 * narrows the shape, normalises `currentStock` to a finite number, and
 * guarantees a non-empty `xomAshyo`.
 *
 * TODO PA2-14: drop once a typed `MaterialRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyWarehouseMaterialRow {
  id: string | number;
  xomAshyo?: unknown;
  xomAshyoRu?: unknown;
  kod?: unknown;
  unitOfMeasure?: unknown;
  materialType?: unknown;
  category?: unknown;
  currentStock?: unknown;
}

export interface WarehouseMaterialDto {
  id: string;
  xomAshyo: string;
  xomAshyoRu: string | null;
  kod: string | null;
  unitOfMeasure: string | null;
  materialType: string | null;
  category: string | null;
  currentStock: number;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : 0;
}

export class WarehouseMaterialAclTranslator
  implements IAclTranslator<LegacyWarehouseMaterialRow, WarehouseMaterialDto>
{
  toDomain(legacy: LegacyWarehouseMaterialRow): Result<WarehouseMaterialDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'WarehouseMaterialAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'WarehouseMaterialAcl: legacy.id missing'));
    }
    const xomAshyo = toStr(legacy.xomAshyo);
    if (!xomAshyo) {
      return Err(AppErr('VALIDATION', 'WarehouseMaterialAcl: xomAshyo missing'));
    }
    return Ok({
      id: String(legacy.id),
      xomAshyo,
      xomAshyoRu: toStr(legacy.xomAshyoRu),
      kod: toStr(legacy.kod),
      unitOfMeasure: toStr(legacy.unitOfMeasure),
      materialType: toStr(legacy.materialType),
      category: toStr(legacy.category),
      currentStock: toNum(legacy.currentStock),
    });
  }

  toLegacy(domain: WarehouseMaterialDto): LegacyWarehouseMaterialRow {
    return {
      id: domain.id,
      xomAshyo: domain.xomAshyo,
      xomAshyoRu: domain.xomAshyoRu,
      kod: domain.kod,
      unitOfMeasure: domain.unitOfMeasure,
      materialType: domain.materialType,
      category: domain.category,
      currentStock: domain.currentStock,
    };
  }
}
