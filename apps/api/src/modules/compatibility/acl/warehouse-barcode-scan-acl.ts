/**
 * @module warehouse-barcode-scan-acl
 * @description ACL translator: legacy barcode-scan results (from
 * `warehouse-barcode-ops.service.ts:scanBarcode`) ↔ canonical
 * `BarcodeScanResultDto` consumed by new BC-5 (Warehouse / WMS) code.
 *
 * The legacy SELECT emits a nested `materialCard` row plus a bilingual
 * `message` envelope. The translator narrows the wrapper, makes `found`
 * a strict boolean, and ensures `message` always has both locales.
 *
 * TODO PA2-14: drop once a typed `BarcodeRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyBarcodeScanResultRow {
  found?: unknown;
  materialCard?: unknown;
  message?: unknown;
}

export interface BarcodeScanMaterialCard {
  id: string | null;
  xomAshyo: string | null;
  barcode: string | null;
  unitOfMeasure: string | null;
}

export interface BarcodeScanResultDto {
  found: boolean;
  materialCard: BarcodeScanMaterialCard | null;
  message: { uz: string; ru: string };
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toBool(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    return s === 't' || s === 'true' || s === '1' || s === 'yes';
  }
  return false;
}

function toMaterialCard(raw: unknown): BarcodeScanMaterialCard | null {
  if (raw == null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    id: toStr(r['id']),
    xomAshyo: toStr(r['xomAshyo'] ?? r['xom_ashyo']),
    barcode: toStr(r['barcode']),
    unitOfMeasure: toStr(r['unitOfMeasure'] ?? r['unit_of_measure']),
  };
}

function toMessage(raw: unknown): { uz: string; ru: string } {
  if (raw == null || typeof raw !== 'object') return { uz: '', ru: '' };
  const r = raw as Record<string, unknown>;
  return { uz: toStr(r['uz']) ?? '', ru: toStr(r['ru']) ?? '' };
}

export class BarcodeScanResultAclTranslator
  implements IAclTranslator<LegacyBarcodeScanResultRow, BarcodeScanResultDto>
{
  toDomain(legacy: LegacyBarcodeScanResultRow): Result<BarcodeScanResultDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'BarcodeScanResultAcl: legacy row is null/non-object'));
    }
    return Ok({
      found: toBool(legacy.found),
      materialCard: toMaterialCard(legacy.materialCard),
      message: toMessage(legacy.message),
    });
  }

  toLegacy(domain: BarcodeScanResultDto): LegacyBarcodeScanResultRow {
    return {
      found: domain.found,
      materialCard: domain.materialCard
        ? {
            id: domain.materialCard.id,
            xomAshyo: domain.materialCard.xomAshyo,
            barcode: domain.materialCard.barcode,
            unitOfMeasure: domain.materialCard.unitOfMeasure,
          }
        : null,
      message: { uz: domain.message.uz, ru: domain.message.ru },
    };
  }
}
