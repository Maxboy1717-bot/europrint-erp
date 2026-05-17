/**
 * @module bank-account-acl
 * @description ACL translator: legacy `employee_bank_accounts` rows (from
 * `employees-compat-financials.service.ts:getBankAccounts`) ↔ canonical
 * `BankAccountDto` consumed by new BC-3 (HR / People — Financials) code.
 *
 * The legacy SELECT mixes snake_case columns and emits booleans as 0/1 or
 * 't'/'f'. The translator narrows the shape into camelCase and coerces
 * `isPrimary` into a real boolean.
 *
 * TODO PA2-14: drop once a typed `BankAccountRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyBankAccountRow {
  id: string | number;
  employee_id?: unknown;
  bank_name?: unknown;
  account_number?: unknown;
  card_number?: unknown;
  card_type?: unknown;
  is_primary?: unknown;
  notes?: unknown;
  created_at?: unknown;
}

export interface BankAccountDto {
  id: string;
  employeeId: string | null;
  bankName: string;
  accountNumber: string | null;
  cardNumber: string | null;
  cardType: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: Date | null;
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

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export class BankAccountAclTranslator
  implements IAclTranslator<LegacyBankAccountRow, BankAccountDto>
{
  toDomain(legacy: LegacyBankAccountRow): Result<BankAccountDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'BankAccountAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'BankAccountAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      employeeId: toStr(legacy.employee_id),
      bankName: toStr(legacy.bank_name) ?? '',
      accountNumber: toStr(legacy.account_number),
      cardNumber: toStr(legacy.card_number),
      cardType: toStr(legacy.card_type),
      isPrimary: toBool(legacy.is_primary),
      notes: toStr(legacy.notes),
      createdAt: toDate(legacy.created_at),
    });
  }

  toLegacy(domain: BankAccountDto): LegacyBankAccountRow {
    return {
      id: domain.id,
      employee_id: domain.employeeId,
      bank_name: domain.bankName,
      account_number: domain.accountNumber,
      card_number: domain.cardNumber,
      card_type: domain.cardType,
      is_primary: domain.isPrimary,
      notes: domain.notes,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
    };
  }
}
