/**
 * @module company-state-acl
 * @description ACL translator: legacy company-state payload (from
 * `company-state.service.ts:getCurrent`) ↔ canonical `CompanyStateDto`
 * consumed by new BC-9 (Director / Strategy) code.
 *
 * The legacy result is an envelope with nested `kpis`/`summary`/`label`/
 * `thresholds` and a free-form `state` string. The translator narrows
 * the wrapper, constrains `state` to the documented transitions, and
 * coerces money-style KPI fields to `number`.
 *
 * TODO PA2-14: drop once a typed `CompanyStateRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export type CompanyStateKey =
  | 'osish'
  | 'normal'
  | 'ehtiyot'
  | 'xavf'
  | 'inqiroz'
  | 'unknown';

export interface LegacyCompanyStateRow {
  state?: unknown;
  label?: unknown;
  kpis?: unknown;
  summary?: unknown;
  thresholds?: unknown;
  generatedAt?: unknown;
}

export interface CompanyStateLabel {
  uz: string;
  ru: string;
  emoji: string;
}

export interface CompanyStateKpis {
  profit: number;
  revenue: number;
  expenses: number;
  retentionPct: number;
  totalEmployees: number;
  activeEmployees: number;
  activeOrders: number;
}

export interface CompanyStateDto {
  state: CompanyStateKey;
  label: CompanyStateLabel;
  kpis: CompanyStateKpis;
  generatedAt: Date | null;
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

function toStateKey(v: unknown): CompanyStateKey {
  const s = toStr(v);
  if (s === 'osish' || s === 'normal' || s === 'ehtiyot' || s === 'xavf' || s === 'inqiroz') return s;
  return 'unknown';
}

function toLabel(raw: unknown): CompanyStateLabel {
  if (raw == null || typeof raw !== 'object') return { uz: '', ru: '', emoji: '' };
  const r = raw as Record<string, unknown>;
  return {
    uz: toStr(r['uz']) ?? '',
    ru: toStr(r['ru']) ?? '',
    emoji: toStr(r['emoji']) ?? '',
  };
}

function toKpis(raw: unknown): CompanyStateKpis {
  if (raw == null || typeof raw !== 'object') {
    return {
      profit: 0, revenue: 0, expenses: 0, retentionPct: 0,
      totalEmployees: 0, activeEmployees: 0, activeOrders: 0,
    };
  }
  const r = raw as Record<string, unknown>;
  return {
    profit: toNum(r['profit']),
    revenue: toNum(r['revenue']),
    expenses: toNum(r['expenses']),
    retentionPct: toNum(r['retentionPct']),
    totalEmployees: toNum(r['totalEmployees']),
    activeEmployees: toNum(r['activeEmployees']),
    activeOrders: toNum(r['activeOrders']),
  };
}

export class CompanyStateAclTranslator
  implements IAclTranslator<LegacyCompanyStateRow, CompanyStateDto>
{
  toDomain(legacy: LegacyCompanyStateRow): Result<CompanyStateDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'CompanyStateAcl: legacy row is null/non-object'));
    }
    return Ok({
      state: toStateKey(legacy.state),
      label: toLabel(legacy.label),
      kpis: toKpis(legacy.kpis),
      generatedAt: toDate(legacy.generatedAt),
    });
  }

  toLegacy(domain: CompanyStateDto): LegacyCompanyStateRow {
    return {
      state: domain.state,
      label: { uz: domain.label.uz, ru: domain.label.ru, emoji: domain.label.emoji },
      kpis: {
        profit: domain.kpis.profit,
        revenue: domain.kpis.revenue,
        expenses: domain.kpis.expenses,
        retentionPct: domain.kpis.retentionPct,
        totalEmployees: domain.kpis.totalEmployees,
        activeEmployees: domain.kpis.activeEmployees,
        activeOrders: domain.kpis.activeOrders,
      },
      generatedAt: domain.generatedAt ? domain.generatedAt.toISOString() : null,
    };
  }
}
