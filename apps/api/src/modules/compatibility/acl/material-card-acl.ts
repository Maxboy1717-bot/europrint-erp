/**
 * @module material-card-acl
 * @description ACL translator: legacy `material_cards` rows (from
 * `resources.service.ts:getMaterialCards`) ↔ canonical `MaterialCardDto`
 * consumed by new BC-4 (Warehouse / WMS) and BC-6 (Procurement) code.
 *
 * The legacy SELECT projects renamed columns (`xom_ashyo AS name`,
 * `kod AS sku`, `unit_of_measure AS unit`) with mixed camelCase
 * (`"currentStock"`). The translator narrows the dynamic types into a
 * fully camelCase DTO with `currentStock` as `number | null`.
 *
 * TODO PA2-14: drop once `ResourcesCompatService` is replaced by a
 * Drizzle-backed `MaterialCardRepository` with native typed rows.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyMaterialCardRow {
  id: string | number;
  name?: unknown;
  sku?: unknown;
  unit?: unknown;
  category?: unknown;
  currentStock?: unknown;
}

export interface MaterialCardDto {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  category: string | null;
  currentStock: number;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toNum(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export class MaterialCardAclTranslator
  implements IAclTranslator<LegacyMaterialCardRow, MaterialCardDto>
{
  toDomain(legacy: LegacyMaterialCardRow): Result<MaterialCardDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'MaterialCardAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'MaterialCardAcl: legacy.id missing'));
    }
    const name = toStr(legacy.name);
    if (!name) {
      return Err(AppErr('VALIDATION', 'MaterialCardAcl: name missing'));
    }
    return Ok({
      id: String(legacy.id),
      name,
      sku: toStr(legacy.sku),
      unit: toStr(legacy.unit) ?? 'dona',
      category: toStr(legacy.category),
      currentStock: toNum(legacy.currentStock),
    });
  }

  toLegacy(domain: MaterialCardDto): LegacyMaterialCardRow {
    return {
      id: domain.id,
      name: domain.name,
      sku: domain.sku,
      unit: domain.unit,
      category: domain.category,
      currentStock: domain.currentStock,
    };
  }
}
