/**
 * @module director-kpi-acl
 * @description ACL translator: legacy `kpi_definitions` rows joined with
 * latest `kpi_values` (from `europrint-control-director.service.ts:
 * getDirectorKpis`) ↔ canonical `DirectorKpiDto` consumed by new BC-9
 * (Director / Strategic Dashboards) code.
 *
 * The legacy raw SQL aliases columns to camelCase via SQL `AS` but emits
 * numeric thresholds (`targetValue`, `currentValue`) as untyped strings
 * (Drizzle `numeric`). The translator normalises numbers and constrains
 * `thresholdDirection` to the known set.
 *
 * TODO PA2-14: drop once a typed `KpiRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export type KpiThresholdDirection = 'higher_is_better' | 'lower_is_better' | 'unknown';

export interface LegacyDirectorKpiRow {
  id: string | number;
  kpiCode?: unknown;
  kpiName?: unknown;
  category?: unknown;
  targetValue?: unknown;
  warningThreshold?: unknown;
  criticalThreshold?: unknown;
  thresholdDirection?: unknown;
  unit?: unknown;
  blockOnViolation?: unknown;
  currentValue?: unknown;
}

export interface DirectorKpiDto {
  id: string;
  kpiCode: string;
  kpiName: string;
  category: string | null;
  targetValue: number | null;
  warningThreshold: number | null;
  criticalThreshold: number | null;
  thresholdDirection: KpiThresholdDirection;
  unit: string | null;
  blockOnViolation: boolean;
  currentValue: number;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toNumOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}

function toNum(v: unknown): number {
  const n = toNumOrNull(v);
  return n ?? 0;
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true' || v === 't' || v === '1';
  if (typeof v === 'number') return v !== 0;
  return false;
}

function toDirection(v: unknown): KpiThresholdDirection {
  const s = toStr(v);
  if (s === 'higher_is_better' || s === 'lower_is_better') return s;
  return 'unknown';
}

export class DirectorKpiAclTranslator
  implements IAclTranslator<LegacyDirectorKpiRow, DirectorKpiDto>
{
  toDomain(legacy: LegacyDirectorKpiRow): Result<DirectorKpiDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'DirectorKpiAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'DirectorKpiAcl: legacy.id missing'));
    }
    const kpiCode = toStr(legacy.kpiCode);
    if (!kpiCode) {
      return Err(AppErr('VALIDATION', 'DirectorKpiAcl: kpiCode missing'));
    }
    const kpiName = toStr(legacy.kpiName);
    if (!kpiName) {
      return Err(AppErr('VALIDATION', 'DirectorKpiAcl: kpiName missing'));
    }
    return Ok({
      id: String(legacy.id),
      kpiCode,
      kpiName,
      category: toStr(legacy.category),
      targetValue: toNumOrNull(legacy.targetValue),
      warningThreshold: toNumOrNull(legacy.warningThreshold),
      criticalThreshold: toNumOrNull(legacy.criticalThreshold),
      thresholdDirection: toDirection(legacy.thresholdDirection),
      unit: toStr(legacy.unit),
      blockOnViolation: toBool(legacy.blockOnViolation),
      currentValue: toNum(legacy.currentValue),
    });
  }

  toLegacy(domain: DirectorKpiDto): LegacyDirectorKpiRow {
    return {
      id: domain.id,
      kpiCode: domain.kpiCode,
      kpiName: domain.kpiName,
      category: domain.category,
      targetValue: domain.targetValue,
      warningThreshold: domain.warningThreshold,
      criticalThreshold: domain.criticalThreshold,
      thresholdDirection: domain.thresholdDirection,
      unit: domain.unit,
      blockOnViolation: domain.blockOnViolation,
      currentValue: domain.currentValue,
    };
  }
}
