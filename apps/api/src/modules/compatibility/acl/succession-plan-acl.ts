/**
 * @module succession-plan-acl
 * @description ACL translator: legacy `succession_plans` rows joined with
 * `employees`/`positions` (from `succession-compat.service.ts:getCareerPlans`)
 * ↔ canonical `SuccessionPlanDto` consumed by new BC-3 (HR / People — Talent)
 * code.
 *
 * The legacy SELECT mixes snake_case columns with concat-string holder/
 * candidate names. The translator narrows the shape to camelCase and
 * coerces date columns to typed `Date`.
 *
 * TODO PA2-14: drop once a typed `SuccessionRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacySuccessionPlanRow {
  id: string | number;
  position_id?: unknown;
  current_holder_id?: unknown;
  candidate_id?: unknown;
  readiness_level?: unknown;
  development_plan?: unknown;
  target_date?: unknown;
  priority?: unknown;
  status?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  current_holder_name?: unknown;
  candidate_name?: unknown;
  position_name?: unknown;
}

export interface SuccessionPlanDto {
  id: string;
  positionId: string | null;
  currentHolderId: string | null;
  candidateId: string | null;
  readinessLevel: string;
  developmentPlan: string | null;
  targetDate: Date | null;
  priority: number;
  status: string;
  currentHolderName: string | null;
  candidateName: string | null;
  positionName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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

function toNum(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
}

export class SuccessionPlanAclTranslator
  implements IAclTranslator<LegacySuccessionPlanRow, SuccessionPlanDto>
{
  toDomain(legacy: LegacySuccessionPlanRow): Result<SuccessionPlanDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'SuccessionPlanAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'SuccessionPlanAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      positionId: toStr(legacy.position_id),
      currentHolderId: toStr(legacy.current_holder_id),
      candidateId: toStr(legacy.candidate_id),
      readinessLevel: toStr(legacy.readiness_level) ?? 'low',
      developmentPlan: toStr(legacy.development_plan),
      targetDate: toDate(legacy.target_date),
      priority: toNum(legacy.priority, 1),
      status: toStr(legacy.status) ?? 'active',
      currentHolderName: toStr(legacy.current_holder_name),
      candidateName: toStr(legacy.candidate_name),
      positionName: toStr(legacy.position_name),
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
    });
  }

  toLegacy(domain: SuccessionPlanDto): LegacySuccessionPlanRow {
    return {
      id: domain.id,
      position_id: domain.positionId,
      current_holder_id: domain.currentHolderId,
      candidate_id: domain.candidateId,
      readiness_level: domain.readinessLevel,
      development_plan: domain.developmentPlan,
      target_date: domain.targetDate ? domain.targetDate.toISOString() : null,
      priority: domain.priority,
      status: domain.status,
      current_holder_name: domain.currentHolderName,
      candidate_name: domain.candidateName,
      position_name: domain.positionName,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
