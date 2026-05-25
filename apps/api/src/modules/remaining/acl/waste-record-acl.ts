/**
 * @module waste-record-acl
 * @description ACL translator: legacy `waste_records` JOIN `users` rows
 * (from `waste.repository.ts:getRecords`) ↔ canonical `WasteRecordDto`
 * consumed by new BC-2 (Manufacturing / Quality) code.
 *
 * The legacy SELECT mixes snake_case columns (`waste_type`, `total_cost`)
 * with a concat-string `operator_name`. New consumers want camelCase,
 * typed Date/numbers, and a clear `isRecyclable` boolean.
 *
 * TODO PA2-14: drop once `WasteRepository` exposes a domain-shaped row
 * directly.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 * @see docs/ddd-deep-audit-strategic.md Step 4 — ACL gap finding
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyWasteRecordRow {
  id: string | number;
  production_order_id: string | number | null;
  order_id: string | number | null;
  machine_id: string | number | null;
  operator_id: string | number | null;
  operator_name?: string | null;
  waste_type: string | null;
  material_type: string | null;
  quantity: number | string | null;
  unit: string | null;
  cost_per_unit: number | string | null;
  total_cost: number | string | null;
  cause: string | null;
  correction_action: string | null;
  shift_number: number | string | null;
  date: string | Date | null;
  notes: string | null;
  is_recyclable: boolean | string | number | null;
  recycled_quantity: number | string | null;
  created_at: string | Date | null;
}

export interface WasteRecordDto {
  id: string;
  productionOrderId: string | null;
  orderId: string | null;
  machineId: string | null;
  operatorId: string | null;
  operatorName: string | null;
  wasteType: string;
  materialType: string | null;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  cause: string | null;
  correctionAction: string | null;
  shiftNumber: number | null;
  date: Date | null;
  notes: string | null;
  isRecyclable: boolean;
  recycledQuantity: number;
  createdAt: Date | null;
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNum(v: number | string | null | undefined, fallback = 0): number {
  if (v == null) return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toStrOrNull(v: string | number | null | undefined): string | null {
  return v == null ? null : String(v);
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (v == null) return false;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === 't' || s === '1' || s === 'yes';
}

export class WasteRecordAclTranslator
  implements IAclTranslator<LegacyWasteRecordRow, WasteRecordDto>
{
  toDomain(legacy: LegacyWasteRecordRow): Result<WasteRecordDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'WasteRecordAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'WasteRecordAcl: legacy.id missing'));
    }
    if (!legacy.waste_type) {
      return Err(AppErr('VALIDATION', 'WasteRecordAcl: waste_type missing'));
    }
    return Ok({
      id: String(legacy.id),
      productionOrderId: toStrOrNull(legacy.production_order_id),
      orderId: toStrOrNull(legacy.order_id),
      machineId: toStrOrNull(legacy.machine_id),
      operatorId: toStrOrNull(legacy.operator_id),
      operatorName: legacy.operator_name ?? null,
      wasteType: legacy.waste_type,
      materialType: legacy.material_type ?? null,
      quantity: toNum(legacy.quantity, 0),
      unit: legacy.unit ?? 'kg',
      costPerUnit: toNum(legacy.cost_per_unit, 0),
      totalCost: toNum(legacy.total_cost, 0),
      cause: legacy.cause ?? null,
      correctionAction: legacy.correction_action ?? null,
      shiftNumber: legacy.shift_number == null ? null : toNum(legacy.shift_number, 0),
      date: toDate(legacy.date),
      notes: legacy.notes ?? null,
      isRecyclable: toBool(legacy.is_recyclable),
      recycledQuantity: toNum(legacy.recycled_quantity, 0),
      createdAt: toDate(legacy.created_at),
    });
  }

  toLegacy(domain: WasteRecordDto): LegacyWasteRecordRow {
    return {
      id: domain.id,
      production_order_id: domain.productionOrderId,
      order_id: domain.orderId,
      machine_id: domain.machineId,
      operator_id: domain.operatorId,
      operator_name: domain.operatorName,
      waste_type: domain.wasteType,
      material_type: domain.materialType,
      quantity: domain.quantity,
      unit: domain.unit,
      cost_per_unit: domain.costPerUnit,
      total_cost: domain.totalCost,
      cause: domain.cause,
      correction_action: domain.correctionAction,
      shift_number: domain.shiftNumber,
      date: domain.date ? domain.date.toISOString() : null,
      notes: domain.notes,
      is_recyclable: domain.isRecyclable,
      recycled_quantity: domain.recycledQuantity,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
    };
  }
}
