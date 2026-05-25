/**
 * @module label-batch-acl
 * @description ACL translator: legacy warehouse-label batch rows (from
 * `warehouse-label.service.ts:getLabelBatches`) ↔ canonical
 * `LabelBatchDto` consumed by new BC-5 (Warehouse / WMS) code.
 *
 * The legacy SELECT joins `warehouse_batches` with `material_cards`/
 * `warehouses` and emits snake_case columns plus a `material_name` join
 * alias. The translator normalises to camelCase, coerces `quantity` to a
 * finite number, and converts `production_date`/`expiry_date` strings to
 * typed `Date | null`.
 *
 * TODO PA2-14: drop once a typed `LabelBatchRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyLabelBatchRow {
  id: string | number;
  batch_number?: unknown;
  quantity?: unknown;
  status?: unknown;
  production_date?: unknown;
  expiry_date?: unknown;
  created_at?: unknown;
  material_name?: unknown;
  barcode?: unknown;
  warehouse_name?: unknown;
}

export interface LabelBatchDto {
  id: string;
  batchNumber: string | null;
  quantity: number;
  status: string;
  productionDate: Date | null;
  expiryDate: Date | null;
  materialName: string | null;
  barcode: string | null;
  warehouseName: string | null;
  createdAt: Date | null;
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

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export class LabelBatchAclTranslator
  implements IAclTranslator<LegacyLabelBatchRow, LabelBatchDto>
{
  toDomain(legacy: LegacyLabelBatchRow): Result<LabelBatchDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'LabelBatchAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'LabelBatchAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      batchNumber: toStr(legacy.batch_number),
      quantity: toNum(legacy.quantity),
      status: toStr(legacy.status) ?? 'active',
      productionDate: toDate(legacy.production_date),
      expiryDate: toDate(legacy.expiry_date),
      materialName: toStr(legacy.material_name),
      barcode: toStr(legacy.barcode),
      warehouseName: toStr(legacy.warehouse_name),
      createdAt: toDate(legacy.created_at),
    });
  }

  toLegacy(domain: LabelBatchDto): LegacyLabelBatchRow {
    return {
      id: domain.id,
      batch_number: domain.batchNumber,
      quantity: domain.quantity,
      status: domain.status,
      production_date: domain.productionDate ? domain.productionDate.toISOString() : null,
      expiry_date: domain.expiryDate ? domain.expiryDate.toISOString() : null,
      material_name: domain.materialName,
      barcode: domain.barcode,
      warehouse_name: domain.warehouseName,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
    };
  }
}
