/**
 * @module asset-acl
 * @description ACL translator: legacy `assets` rows ↔ canonical `AssetDto`
 * for new BC-7 (Finance / Asset Management) consumers.
 *
 * The legacy table mixes monetary fields as strings (Drizzle `numeric`) with
 * snake_case foreign keys (`department_id`) and untyped `notes`. This
 * translator narrows the shape, coerces dates, and exposes the monetary
 * fields as `number | null`.
 *
 * TODO PA2-14: replace once a proper `AssetRepository` ships with typed rows.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyAssetRow {
  id: string | number;
  name?: unknown;
  assetCode?: unknown;
  category?: unknown;
  status?: unknown;
  location?: unknown;
  assignedTo?: unknown;
  departmentId?: unknown;
  serialNumber?: unknown;
  purchaseDate?: unknown;
  purchaseValue?: unknown;
  currentValue?: unknown;
  notes?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AssetDto {
  id: string;
  name: string;
  assetCode: string | null;
  category: string;
  status: string;
  location: string | null;
  assignedTo: string | null;
  departmentId: number | null;
  serialNumber: string | null;
  purchaseDate: Date | null;
  purchaseValue: number | null;
  currentValue: number | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toMoney(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}

export class AssetAclTranslator implements IAclTranslator<LegacyAssetRow, AssetDto> {
  toDomain(legacy: LegacyAssetRow): Result<AssetDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'AssetAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'AssetAcl: legacy.id missing'));
    }
    const name = toStr(legacy.name);
    if (!name) {
      return Err(AppErr('VALIDATION', 'AssetAcl: name missing'));
    }
    const deptRaw = legacy.departmentId;
    const departmentId = deptRaw == null ? null : Number(deptRaw);

    return Ok({
      id: String(legacy.id),
      name,
      assetCode: toStr(legacy.assetCode),
      category: toStr(legacy.category) ?? 'equipment',
      status: toStr(legacy.status) ?? 'active',
      location: toStr(legacy.location),
      assignedTo: toStr(legacy.assignedTo),
      departmentId: Number.isFinite(departmentId) ? (departmentId as number) : null,
      serialNumber: toStr(legacy.serialNumber),
      purchaseDate: toDate(legacy.purchaseDate),
      purchaseValue: toMoney(legacy.purchaseValue),
      currentValue: toMoney(legacy.currentValue),
      notes: toStr(legacy.notes),
      createdAt: toDate(legacy.createdAt),
      updatedAt: toDate(legacy.updatedAt),
    });
  }

  toLegacy(domain: AssetDto): LegacyAssetRow {
    return {
      id: domain.id,
      name: domain.name,
      assetCode: domain.assetCode,
      category: domain.category,
      status: domain.status,
      location: domain.location,
      assignedTo: domain.assignedTo,
      departmentId: domain.departmentId,
      serialNumber: domain.serialNumber,
      purchaseDate: domain.purchaseDate ? domain.purchaseDate.toISOString() : null,
      purchaseValue: domain.purchaseValue != null ? String(domain.purchaseValue) : null,
      currentValue: domain.currentValue != null ? String(domain.currentValue) : null,
      notes: domain.notes,
      createdAt: domain.createdAt ? domain.createdAt.toISOString() : null,
      updatedAt: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
