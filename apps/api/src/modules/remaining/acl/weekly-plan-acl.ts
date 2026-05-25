/**
 * @module weekly-plan-acl
 * @description ACL translator: legacy `weekly_plans` rows (from
 * `weekly-plan.repository.ts:getAllForEmployee/getAllForManager`) ↔
 * canonical `WeeklyPlanDto` consumed by new BC-3 (HR / People — Performance)
 * and BC-9 (Director Dashboards) code.
 *
 * The legacy `SELECT *` projection emits snake_case columns + JSON
 * `top5_tasks` array with unknown element shape. The translator narrows
 * the row into camelCase, defends against malformed `top5_tasks`, and
 * coerces `week_start`/`created_at` to typed `Date` values.
 *
 * TODO PA2-14: drop once a typed `WeeklyPlanRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyWeeklyPlanRow {
  id: string | number;
  employee_id?: unknown;
  week_start?: unknown;
  gsd_target?: unknown;
  top5_tasks?: unknown;
  status?: unknown;
  approved_by?: unknown;
  approved_at?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface WeeklyPlanDto {
  id: string;
  employeeId: string;
  weekStart: Date;
  gsdTarget: string;
  top5Tasks: unknown[];
  status: string;
  approvedById: string | null;
  approvedAt: Date | null;
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

function toArr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const parsed: unknown = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export class WeeklyPlanAclTranslator
  implements IAclTranslator<LegacyWeeklyPlanRow, WeeklyPlanDto>
{
  toDomain(legacy: LegacyWeeklyPlanRow): Result<WeeklyPlanDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'WeeklyPlanAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'WeeklyPlanAcl: legacy.id missing'));
    }
    const employeeId = toStr(legacy.employee_id);
    if (!employeeId) {
      return Err(AppErr('VALIDATION', 'WeeklyPlanAcl: employee_id missing'));
    }
    const weekStart = toDate(legacy.week_start);
    if (!weekStart) {
      return Err(AppErr('VALIDATION', 'WeeklyPlanAcl: week_start invalid'));
    }
    return Ok({
      id: String(legacy.id),
      employeeId,
      weekStart,
      gsdTarget: toStr(legacy.gsd_target) ?? '',
      top5Tasks: toArr(legacy.top5_tasks),
      status: toStr(legacy.status) ?? 'submitted',
      approvedById: toStr(legacy.approved_by),
      approvedAt: toDate(legacy.approved_at),
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
    });
  }

  toLegacy(domain: WeeklyPlanDto): LegacyWeeklyPlanRow {
    return {
      id: domain.id,
      employee_id: domain.employeeId,
      week_start: domain.weekStart.toISOString(),
      gsd_target: domain.gsdTarget,
      top5_tasks: domain.top5Tasks,
      status: domain.status,
      approved_by: domain.approvedById,
      approved_at: domain.approvedAt ? domain.approvedAt.toISOString() : null,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
