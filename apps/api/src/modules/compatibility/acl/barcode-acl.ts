/**
 * @module barcode-acl
 * @description ACL translator: legacy `pos_movements` JOIN `pos_movement_lines`
 * JOIN `material_cards` rows (from
 * `barcode-warehouse-queries.service.ts:getBarcodes`) ↔ canonical
 * `BarcodeDto` consumed by new BC-4 (Warehouse / WMS) code.
 *
 * The legacy projection nests `barcode` and `materialName`/`materialCardId`
 * into a `{ barcode, materialName, materialCardId }` shape. The translator
 * narrows the dynamic types into a flat typed DTO and validates the few
 * required keys.
 *
 * TODO PA2-14: drop once `BarcodeWarehouseCompatService` is replaced by a
 * Drizzle-backed `BarcodeRepository` with native camelCase rows.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyBarcodeRow {
  barcode: {
    id: unknown;
    barcodeId?: unknown;
    status?: unknown;
    remainingQuantity?: unknown;
    uom?: unknown;
    lotNumber?: unknown;
  };
  materialName?: unknown;
  materialCardId?: unknown;
}

export interface BarcodeDto {
  id: string;
  barcodeId: string;
  status: string;
  remainingQuantity: number;
  uom: string;
  lotNumber: string | null;
  materialName: string | null;
  materialCardId: string | null;
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

export class BarcodeAclTranslator implements IAclTranslator<LegacyBarcodeRow, BarcodeDto> {
  toDomain(legacy: LegacyBarcodeRow): Result<BarcodeDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'BarcodeAcl: legacy row is null/non-object'));
    }
    const bc = legacy.barcode;
    if (bc == null || typeof bc !== 'object') {
      return Err(AppErr('VALIDATION', 'BarcodeAcl: legacy.barcode missing'));
    }
    if (bc.id == null) {
      return Err(AppErr('VALIDATION', 'BarcodeAcl: legacy.barcode.id missing'));
    }
    const idStr = String(bc.id);
    return Ok({
      id: idStr,
      barcodeId: toStr(bc.barcodeId) ?? idStr,
      status: toStr(bc.status) ?? 'unknown',
      remainingQuantity: toNum(bc.remainingQuantity),
      uom: toStr(bc.uom) ?? 'dona',
      lotNumber: toStr(bc.lotNumber),
      materialName: toStr(legacy.materialName),
      materialCardId: toStr(legacy.materialCardId),
    });
  }

  toLegacy(domain: BarcodeDto): LegacyBarcodeRow {
    return {
      barcode: {
        id: domain.id,
        barcodeId: domain.barcodeId,
        status: domain.status,
        remainingQuantity: domain.remainingQuantity,
        uom: domain.uom,
        lotNumber: domain.lotNumber,
      },
      materialName: domain.materialName,
      materialCardId: domain.materialCardId,
    };
  }
}
