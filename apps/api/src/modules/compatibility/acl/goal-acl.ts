/**
 * @module goal-acl
 * @description ACL translator: legacy `goals` rows ↔ canonical `GoalDto`
 * for new BC-3 (HR / Performance) consumers.
 *
 * The legacy SELECT in `goals-compat.service.ts` keeps snake_case columns
 * (`target_type`, `current_value`, `target_value`) plus permissive nulls.
 * This translator promotes them to camelCase, coerces numeric metrics, and
 * computes a `progressPercent` derived field.
 *
 * TODO PA2-14: retire once `compatibility/goals-compat.service` is replaced
 * by a Drizzle-typed `GoalsRepository`.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyGoalRow {
  id: string | number;
  title: string | null;
  description: string | null;
  category: string | null;
  target_type: string | null;
  target_id: string | number | null;
  metric: string | null;
  current_value: number | string | null;
  target_value: number | string | null;
  start_date: string | Date | null;
  end_date: string | Date | null;
  status: string | null;
  priority: string | null;
  created_by: string | number | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
}

export interface GoalDto {
  id: string;
  title: string;
  description: string | null;
  category: string;
  targetType: string;
  targetId: string | null;
  metric: string | null;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  priority: string;
  createdById: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNum(v: number | string | null | undefined, fallback = 0): number {
  if (v == null) return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export class GoalAclTranslator implements IAclTranslator<LegacyGoalRow, GoalDto> {
  toDomain(legacy: LegacyGoalRow): Result<GoalDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'GoalAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'GoalAcl: legacy.id missing'));
    }
    if (!legacy.title) {
      return Err(AppErr('VALIDATION', 'GoalAcl: title missing'));
    }
    const currentValue = toNum(legacy.current_value, 0);
    const targetValue = toNum(legacy.target_value, 0);
    const progressPercent = targetValue > 0
      ? Math.round((currentValue / targetValue) * 1000) / 10
      : 0;
    return Ok({
      id: String(legacy.id),
      title: legacy.title,
      description: legacy.description ?? null,
      category: legacy.category ?? 'department',
      targetType: legacy.target_type ?? 'department',
      targetId: legacy.target_id != null ? String(legacy.target_id) : null,
      metric: legacy.metric ?? null,
      currentValue,
      targetValue,
      progressPercent,
      startDate: toDate(legacy.start_date),
      endDate: toDate(legacy.end_date),
      status: legacy.status ?? 'active',
      priority: legacy.priority ?? 'medium',
      createdById: legacy.created_by != null ? String(legacy.created_by) : null,
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
    });
  }

  toLegacy(domain: GoalDto): LegacyGoalRow {
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      category: domain.category,
      target_type: domain.targetType,
      target_id: domain.targetId,
      metric: domain.metric,
      current_value: domain.currentValue,
      target_value: domain.targetValue,
      start_date: domain.startDate ? domain.startDate.toISOString() : null,
      end_date: domain.endDate ? domain.endDate.toISOString() : null,
      status: domain.status,
      priority: domain.priority,
      created_by: domain.createdById,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
