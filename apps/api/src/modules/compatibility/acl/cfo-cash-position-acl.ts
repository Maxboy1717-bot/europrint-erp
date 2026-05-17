/**
 * @module cfo-cash-position-acl
 * @description ACL translator: legacy CFO cash-position payload (from
 * `cfo.service.ts:getCashPosition`) ↔ canonical `CfoCashPositionDto`
 * consumed by new BC-7 (Finance / CFO) code.
 *
 * The legacy SELECT returns a `Record<string, unknown>` with snake-/camel-mix
 * keys (`total_cash`, `accounts`, `currency`). The translator narrows the
 * shape into camelCase, coerces money fields to `number`, and produces an
 * always-array `accounts` payload.
 *
 * TODO PA2-14: drop once a typed `CashPositionRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyCfoCashPositionRow {
  totalCash?: unknown;
  total_cash?: unknown;
  currency?: unknown;
  accounts?: unknown;
  generatedAt?: unknown;
  generated_at?: unknown;
}

export interface CfoCashAccount {
  id: string | null;
  name: string | null;
  balance: number;
  currency: string;
}

export interface CfoCashPositionDto {
  totalCash: number;
  currency: string;
  accounts: CfoCashAccount[];
  generatedAt: Date | null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toMoney(v: unknown): number {
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

function toAccount(raw: unknown, defaultCurrency: string): CfoCashAccount {
  if (raw == null || typeof raw !== 'object') {
    return { id: null, name: null, balance: 0, currency: defaultCurrency };
  }
  const r = raw as Record<string, unknown>;
  return {
    id: toStr(r['id'] ?? r['account_id']),
    name: toStr(r['name'] ?? r['account_name']),
    balance: toMoney(r['balance'] ?? r['amount']),
    currency: toStr(r['currency']) ?? defaultCurrency,
  };
}

export class CfoCashPositionAclTranslator
  implements IAclTranslator<LegacyCfoCashPositionRow, CfoCashPositionDto>
{
  toDomain(legacy: LegacyCfoCashPositionRow): Result<CfoCashPositionDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'CfoCashPositionAcl: legacy row is null/non-object'));
    }
    const currency = toStr(legacy.currency) ?? 'UZS';
    const accountsRaw = Array.isArray(legacy.accounts) ? legacy.accounts : [];
    return Ok({
      totalCash: toMoney(legacy.totalCash ?? legacy.total_cash),
      currency,
      accounts: accountsRaw.map((a) => toAccount(a, currency)),
      generatedAt: toDate(legacy.generatedAt ?? legacy.generated_at),
    });
  }

  toLegacy(domain: CfoCashPositionDto): LegacyCfoCashPositionRow {
    return {
      totalCash: domain.totalCash,
      currency: domain.currency,
      accounts: domain.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        balance: a.balance,
        currency: a.currency,
      })),
      generatedAt: domain.generatedAt ? domain.generatedAt.toISOString() : null,
    };
  }
}
