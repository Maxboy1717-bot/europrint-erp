/**
 * @module crm-invoice-acl
 * @description ACL translator: legacy `crm_invoices` rows (from
 * `crm-extended.service.ts:getCrmInvoices`, served inside a `{data, total,
 * page}` envelope) ↔ canonical `CrmInvoiceDto` consumed by new BC-8 (Sales
 * / CRM) code.
 *
 * The legacy SELECT mixes snake_case columns with monetary fields stored
 * as `numeric` (string). The translator normalises everything to
 * camelCase, coerces money fields to `number | null`, and converts date
 * columns to typed `Date | null`.
 *
 * TODO PA2-14: drop once a typed `CrmInvoiceRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyCrmInvoiceRow {
  id: string | number;
  number?: unknown;
  title?: unknown;
  deal_id?: unknown;
  company_id?: unknown;
  contact_id?: unknown;
  status?: unknown;
  total_amount?: unknown;
  paid_amount?: unknown;
  currency?: unknown;
  issue_date?: unknown;
  due_date?: unknown;
  paid_date?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface CrmInvoiceDto {
  id: string;
  number: string | null;
  title: string | null;
  dealId: string | null;
  companyId: string | null;
  contactId: string | null;
  status: string;
  totalAmount: number | null;
  paidAmount: number | null;
  currency: string;
  issueDate: Date | null;
  dueDate: Date | null;
  paidDate: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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

export class CrmInvoiceAclTranslator
  implements IAclTranslator<LegacyCrmInvoiceRow, CrmInvoiceDto>
{
  toDomain(legacy: LegacyCrmInvoiceRow): Result<CrmInvoiceDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'CrmInvoiceAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'CrmInvoiceAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      number: toStr(legacy.number),
      title: toStr(legacy.title),
      dealId: toStr(legacy.deal_id),
      companyId: toStr(legacy.company_id),
      contactId: toStr(legacy.contact_id),
      status: toStr(legacy.status) ?? 'draft',
      totalAmount: toMoney(legacy.total_amount),
      paidAmount: toMoney(legacy.paid_amount),
      currency: toStr(legacy.currency) ?? 'UZS',
      issueDate: toDate(legacy.issue_date),
      dueDate: toDate(legacy.due_date),
      paidDate: toDate(legacy.paid_date),
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
    });
  }

  toLegacy(domain: CrmInvoiceDto): LegacyCrmInvoiceRow {
    return {
      id: domain.id,
      number: domain.number,
      title: domain.title,
      deal_id: domain.dealId,
      company_id: domain.companyId,
      contact_id: domain.contactId,
      status: domain.status,
      total_amount: domain.totalAmount != null ? String(domain.totalAmount) : null,
      paid_amount: domain.paidAmount != null ? String(domain.paidAmount) : null,
      currency: domain.currency,
      issue_date: domain.issueDate ? domain.issueDate.toISOString() : null,
      due_date: domain.dueDate ? domain.dueDate.toISOString() : null,
      paid_date: domain.paidDate ? domain.paidDate.toISOString() : null,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
