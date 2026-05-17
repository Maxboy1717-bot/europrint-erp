/**
 * @module three-way-match-acl
 * @description ACL translator: legacy `three_way_match_results` rows (from
 * `three-way-match.repository.ts:getResults`) ↔ canonical
 * `ThreeWayMatchResultDto` consumed by new BC-6 (Procurement) and BC-7
 * (Finance) code.
 *
 * The legacy SELECT mixes snake_case columns, `numeric` money fields as
 * strings, and a free-form `status`. The translator narrows the shape
 * into camelCase, coerces money fields to `number | null`, and constrains
 * `status` to the known transitions.
 *
 * TODO PA2-14: drop once a typed `ThreeWayMatchRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyThreeWayMatchRow {
  id: string | number;
  po_id?: unknown;
  gr_id?: unknown;
  vendor_invoice_id?: unknown;
  po_amount?: unknown;
  gr_amount?: unknown;
  invoice_amount?: unknown;
  status?: unknown;
  matched_by?: unknown;
  matched_at?: unknown;
  created_at?: unknown;
}

export type ThreeWayMatchStatus = 'matched' | 'discrepancy' | 'pending' | 'other';

export interface ThreeWayMatchResultDto {
  id: string;
  poId: string | null;
  grId: string | null;
  vendorInvoiceId: string | null;
  poAmount: number | null;
  grAmount: number | null;
  invoiceAmount: number | null;
  status: ThreeWayMatchStatus;
  matchedById: string | null;
  matchedAt: Date | null;
  createdAt: Date | null;
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

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toStatus(v: unknown): ThreeWayMatchStatus {
  const s = toStr(v);
  if (s === 'matched' || s === 'discrepancy' || s === 'pending') return s;
  return 'other';
}

export class ThreeWayMatchAclTranslator
  implements IAclTranslator<LegacyThreeWayMatchRow, ThreeWayMatchResultDto>
{
  toDomain(legacy: LegacyThreeWayMatchRow): Result<ThreeWayMatchResultDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'ThreeWayMatchAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'ThreeWayMatchAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      poId: toStr(legacy.po_id),
      grId: toStr(legacy.gr_id),
      vendorInvoiceId: toStr(legacy.vendor_invoice_id),
      poAmount: toMoney(legacy.po_amount),
      grAmount: toMoney(legacy.gr_amount),
      invoiceAmount: toMoney(legacy.invoice_amount),
      status: toStatus(legacy.status),
      matchedById: toStr(legacy.matched_by),
      matchedAt: toDate(legacy.matched_at),
      createdAt: toDate(legacy.created_at),
    });
  }

  toLegacy(domain: ThreeWayMatchResultDto): LegacyThreeWayMatchRow {
    return {
      id: domain.id,
      po_id: domain.poId,
      gr_id: domain.grId,
      vendor_invoice_id: domain.vendorInvoiceId,
      po_amount: domain.poAmount != null ? String(domain.poAmount) : null,
      gr_amount: domain.grAmount != null ? String(domain.grAmount) : null,
      invoice_amount: domain.invoiceAmount != null ? String(domain.invoiceAmount) : null,
      status: domain.status,
      matched_by: domain.matchedById,
      matched_at: domain.matchedAt ? domain.matchedAt.toISOString() : null,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
    };
  }
}
