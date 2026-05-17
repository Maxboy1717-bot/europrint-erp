/**
 * @module ideal-target-acl
 * @description ACL translator: legacy `ideal_targets` rows (from
 * `ideal-rasm.service.ts:getAll` after enrichment) ↔ canonical
 * `IdealTargetDto` consumed by new BC-9 (Director / Strategy) code.
 *
 * The legacy SELECT mixes snake_case columns with on-the-fly enrichment
 * (`actualValue`, `achievementPct` injected by the service). The translator
 * narrows the row to camelCase, coerces money fields to `number`, and
 * clamps `achievementPct` to 0-100+.
 *
 * TODO PA2-14: drop once a typed `IdealTargetRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyIdealTargetRow {
  id?: unknown;
  target_key?: unknown;
  target_value?: unknown;
  horizon_years?: unknown;
  description?: unknown;
  actualValue?: unknown;
  achievementPct?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface IdealTargetDto {
  id: string | null;
  targetKey: string;
  targetValue: number;
  horizonYears: number;
  description: string | null;
  actualValue: number;
  achievementPct: number;
  createdAt: Date | null;
  updatedAt: Date | null;
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

function toPercent(v: unknown): number {
  const n = toNum(v);
  if (n < 0) return 0;
  return n;
}

export class IdealTargetAclTranslator
  implements IAclTranslator<LegacyIdealTargetRow, IdealTargetDto>
{
  toDomain(legacy: LegacyIdealTargetRow): Result<IdealTargetDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'IdealTargetAcl: legacy row is null/non-object'));
    }
    const targetKey = toStr(legacy.target_key);
    if (!targetKey) {
      return Err(AppErr('VALIDATION', 'IdealTargetAcl: target_key missing'));
    }
    return Ok({
      id: toStr(legacy.id),
      targetKey,
      targetValue: toNum(legacy.target_value),
      horizonYears: toNum(legacy.horizon_years),
      description: toStr(legacy.description),
      actualValue: toNum(legacy.actualValue),
      achievementPct: toPercent(legacy.achievementPct),
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
    });
  }

  toLegacy(domain: IdealTargetDto): LegacyIdealTargetRow {
    return {
      id: domain.id,
      target_key: domain.targetKey,
      target_value: String(domain.targetValue),
      horizon_years: domain.horizonYears,
      description: domain.description,
      actualValue: domain.actualValue,
      achievementPct: domain.achievementPct,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
