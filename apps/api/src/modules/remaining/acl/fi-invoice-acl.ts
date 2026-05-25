/**
 * @module fi-invoice-acl
 * @description ACL translator: legacy `fi_invoices` rows (from
 * `fi.repository.ts:getInvoices`) ↔ canonical `FiInvoiceDto` consumed
 * by new BC-7 (Finance) code.
 *
 * The legacy SELECT emits snake_case columns + a `numeric` amount
 * Drizzle returns as `string`. The translator narrows into camelCase,
 * coerces `amount` to `number | null`, and converts date columns into
 * real `Date` values.
 *
 * TODO PA2-14: drop once a typed `FiInvoiceRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyFiInvoiceRow {
  id: string | number;
  invoice_number?: unknown;
  invoice_date?: unknown;
  due_date?: unknown;
  customer_name?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  created_at?: unknown;
}

export interface FiInvoiceDto {
  id: string;
  invoiceNumber: string | null;
  invoiceDate: Date | null;
  dueDate: Date | null;
  customerName: string | null;
  amount: number | null;
  currency: string;
  status: string;
  createdAt: Date | null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
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

function toMoney(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}

export class FiInvoiceAclTranslator
  implements IAclTranslator<LegacyFiInvoiceRow, FiInvoiceDto>
{
  toDomain(legacy: LegacyFiInvoiceRow): Result<FiInvoiceDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'FiInvoiceAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'FiInvoiceAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      invoiceNumber: toStr(legacy.invoice_number),
      invoiceDate: toDate(legacy.invoice_date),
      dueDate: toDate(legacy.due_date),
      customerName: toStr(legacy.customer_name),
      amount: toMoney(legacy.amount),
      currency: toStr(legacy.currency) ?? 'UZS',
      status: toStr(legacy.status) ?? 'draft',
      createdAt: toDate(legacy.created_at),
    });
  }

  toLegacy(domain: FiInvoiceDto): LegacyFiInvoiceRow {
    return {
      id: domain.id,
      invoice_number: domain.invoiceNumber,
      invoice_date: domain.invoiceDate ? domain.invoiceDate.toISOString() : null,
      due_date: domain.dueDate ? domain.dueDate.toISOString() : null,
      customer_name: domain.customerName,
      amount: domain.amount != null ? String(domain.amount) : null,
      currency: domain.currency,
      status: domain.status,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
    };
  }
}
