/**
 * @module weekly-plan.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors
 *   *out* of the class — internally, business-rule rejections are thrown as NestJS HttpExceptions so
 *   `safeCall` (see below) turns them into a top-level `Err(...)`; see the "Result double-wrap" note.
 */

import { TZDate } from '@date-fns/tz';
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Result, safeCall } from '@common/result';
import { WeeklyPlanRepository } from './weekly-plan.repository';

export const MANAGER_ROLES = ['director', 'super_admin', 'department_head', 'manager', 'admin'];

// Business timezone for this module — every deadline/week boundary below is computed
// explicitly in Asia/Tashkent via `TZDate`, never via the host process's local timezone.
// WHY EXPLICIT TZDate (root-cause of the 5h deadline bug — see isApprovalDeadlinePassed):
// plain `new Date(...)` + `.setHours()`/`.setDate()` resolve calendar fields in whatever
// timezone the *Node process* happens to run in. That silently changes behaviour between
// machines (dev laptop vs. container) without a single line of code changing. TZDate pins
// the calculation to Tashkent regardless of the host's TZ.
const TASHKENT_TZ = 'Asia/Tashkent';

export function getMondayOfWeek(dateStr?: string): string {
  const d = dateStr ? new TZDate(dateStr, TASHKENT_TZ) : _time.now();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  // Root-cause fix: `new Date(d)` on a TZDate instance degrades it back into a plain,
  // host-timezone Date (TZDate's tz-aware getters/setters are lost on copy via the base
  // Date constructor). Re-wrap explicitly in TZDate so `.setDate()` below still resolves
  // in Tashkent, not in whatever zone the host OS/process happens to be configured for.
  const monday = new TZDate(d, TASHKENT_TZ);
  monday.setDate(diff);
  return _time.formatDate(monday);
}

/**
 * Friday-18:00-Tashkent approval deadline for the week starting `weekStart` (YYYY-MM-DD).
 *
 * ROOT-CAUSE FIX (was off by 5 hours): the previous implementation built the boundary with
 * plain `new Date(weekStart + 'T00:00:00')` + `.setHours(18,0,0,0)` — both of which resolve
 * in the *host process's* local timezone, not explicitly Tashkent — and then manually
 * subtracted `5 * MS_PER_HOUR` "to convert to Tashkent". On a host whose OS/process
 * timezone is already Asia/Tashkent (true in this deployment — verified via
 * `Intl.DateTimeFormat().resolvedOptions().timeZone`), the plain Date arithmetic already
 * landed on the correct Tashkent instant (Fri 18:00 Tashkent = 13:00 UTC), so the extra
 * "-5h" was a *double conversion* that moved the effective deadline to 13:00 Tashkent
 * (08:00 UTC) — five hours too early. Building the boundary with `TZDate` (Tashkent
 * pinned explicitly) makes the result correct and, unlike the old code, independent of
 * whatever timezone the host process happens to be running in.
 */
function isApprovalDeadlinePassed(weekStart: string): boolean {
  const monday = new TZDate(`${weekStart}T00:00:00`, TASHKENT_TZ);
  const friday = new TZDate(monday, TASHKENT_TZ);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(18, 0, 0, 0);
  return Date.now() > friday.getTime();
}

/** snake_case DB row → camelCase shape the FE's `WeeklyPlan` type expects (P1.28.1). */
function normalisePlan(p: Record<string, unknown>): Record<string, unknown> {
  return {
    id:              p['id'],
    employeeId:      p['employee_id'] ?? p['employeeId'],
    weekStart:       p['week_start']  ?? p['weekStart'],
    weekEnd:         p['week_end']    ?? p['weekEnd'],
    gsdTarget:       p['gsd_target']  ?? p['gsdTarget'],
    top5Tasks:       Array.isArray(p['top5_tasks'])  ? p['top5_tasks']  :
                     Array.isArray(p['top5Tasks'])   ? p['top5Tasks']   : [],
    successFactors:  p['success_factors'] ?? p['successFactors'],
    resourcesNeeded: p['resources_needed'] ?? p['resourcesNeeded'],
    status:          p['status'],
    approvedBy:      p['approved_by']  ?? p['approvedBy'],
    approvedAt:      p['approved_at']  ?? p['approvedAt'],
    createdAt:       p['created_at']   ?? p['createdAt'],
  };
}

@Injectable()
export class WeeklyPlanService {
  constructor(private readonly repo: WeeklyPlanRepository) {}

  async getStatsSummary(week?: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const weekStart = getMondayOfWeek(week);
      const stats = await this.repo.getStatsSummary(weekStart);
      return { weekStart, stats };
    });
  }

  async getAll(user: { id: number; role: string }, week?: string, employeeId?: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const isManager = MANAGER_ROLES.includes(user.role);
      const weekStart = getMondayOfWeek(week);
      const empId = employeeId ? parseInt(employeeId, 10) : null;
      let plans: Record<string, unknown>[];
      if (isManager) {
        const plansR = empId
          ? await this.repo.getAllForManagerByEmployee(empId, weekStart)
          : await this.repo.getAllForManager(weekStart);
        plans = (plansR.ok ? plansR.data : []) as Record<string, unknown>[];
      } else {
        const plansR = await this.repo.getAllForEmployee(user.id, weekStart);
        plans = (plansR.ok ? plansR.data : []) as Record<string, unknown>[];
      }
      const normalised = (Array.isArray(plans) ? plans : []).map(normalisePlan);
      return { plans: normalised, weekStart };
    });
  }

  async create(user: { id: number; role: string }, body: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const isManager = MANAGER_ROLES.includes(user.role);
      let employeeId: number;
      if (isManager && body['employee_id'] != null) {
        employeeId = Number(body['employee_id']);
      } else {
        if (body['employee_id'] != null && Number(body['employee_id']) !== user.id) {
          throw new ForbiddenException('Boshqa xodim uchun reja topshira olmaysiz');
        }
        employeeId = user.id;
      }
      if (!employeeId || isNaN(employeeId)) throw new BadRequestException('employee_id talab qilinadi');
      // P1.28.1: accept both snake_case (FE sends) and camelCase
      const gsdTarget  = body['gsd_target']  ?? body['gsdTarget'];
      const top5Tasks  = body['top5_tasks']  ?? body['top5Tasks'];
      if (!gsdTarget) throw new BadRequestException('gsd_target talab qilinadi');
      if (!Array.isArray(top5Tasks) || top5Tasks.length === 0) throw new BadRequestException('top5_tasks array talab qilinadi');
      const weekStart = getMondayOfWeek(String(body['week'] ?? ''));
      const existing = await this.repo.findExisting(employeeId, weekStart);
      if (!existing.ok) throw new Error(existing.error.message);
      if (existing.data.length > 0) {
        const existingId = existing.data[0]['id'];
        const planR = await this.repo.updatePlan(existingId, gsdTarget, top5Tasks as Record<string, unknown>[], body);
        if (!planR.ok) throw new Error(planR.error.message);
        return { plan: normalisePlan(planR.data ?? {}), updated: true };
      }
      const planR = await this.repo.createPlan(employeeId, weekStart, gsdTarget, top5Tasks as Record<string, unknown>[], body);
      if (!planR.ok) throw new Error(planR.error.message);
      return { plan: normalisePlan(planR.data ?? {}), updated: false };
    });
  }

  async getOne(id: string, user: { id: number; role: string }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const planId = parseInt(id, 10);
      if (isNaN(planId)) throw new BadRequestException("Noto'g'ri ID");
      const planR = await this.repo.getOne(planId);
      if (!planR.ok) throw new Error(planR.error.message);
      if (!planR.data) throw new NotFoundException('Reja topilmadi');
      const isManager = MANAGER_ROLES.includes(user.role);
      if (!isManager && Number(planR.data['employee_id']) !== user.id) throw new ForbiddenException("Ruxsat yo'q");
      return { plan: normalisePlan(planR.data) };
    });
  }

  async update(id: string, user: { id: number; role: string }, body: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const planId = parseInt(id, 10);
      if (isNaN(planId)) throw new BadRequestException("Noto'g'ri ID");
      const planR = await this.repo.getOne(planId);
      if (!planR.ok) throw new Error(planR.error.message);
      if (!planR.data) throw new NotFoundException('Reja topilmadi');
      const isManager = MANAGER_ROLES.includes(user.role);
      if (!isManager && Number(planR.data['employee_id']) !== user.id) throw new ForbiddenException("Ruxsat yo'q");
      const updated = await this.repo.updatePlanById(planId, body);
      if (!updated.ok) throw new Error(updated.error.message);
      return { plan: normalisePlan(updated.data ?? {}) };
    });
  }

  async deletePlan(id: string, user: { id: number; role: string }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const planId = parseInt(id, 10);
      if (isNaN(planId)) throw new BadRequestException("Noto'g'ri ID");
      const planR = await this.repo.getOne(planId);
      if (!planR.ok) throw new Error(planR.error.message);
      if (!planR.data) throw new NotFoundException('Reja topilmadi');
      const isManager = MANAGER_ROLES.includes(user.role);
      if (!isManager) throw new ForbiddenException("Faqat menejer reja o'chira oladi");
      const deleted = await this.repo.deletePlan(planId);
      if (!deleted.ok || !deleted.data) throw new NotFoundException("Reja topilmadi yoki o'chirib bo'lmadi");
      return { deleted: true, id: planId };
    });
  }

  /**
   * Whole-plan approve. Vision decision #18 (docs/vision/_parts/02-hr.md #18) describes a
   * *per-task* review flow ("manager approves 3 tasks, 2 rejected — not auto-transferred;
   * rating counts only the approved ones"). That per-task data model does not exist yet
   * (top5Tasks is a plain string array with no per-item review state) — this method only
   * flips the whole plan submitted→approved. Documented here rather than silently
   * building a new per-task schema (owner sign-off required for new data shapes — see
   * CLAUDE.md Q-34/Q-35): today there is no auto-transfer of any kind on this path, and
   * nothing in this module computes rating from weekly plans, so neither failure mode the
   * vision item warns about can currently be triggered — the gap is the missing per-task
   * feature itself, not a regression in this method.
   */
  async approve(id: string, user: { id: number; role: string }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const planId = parseInt(id, 10);
      if (isNaN(planId)) throw new BadRequestException("Noto'g'ri ID");
      if (!MANAGER_ROLES.includes(user.role)) throw new ForbiddenException('Faqat menejer reja tasdiqlay oladi');
      const planR = await this.repo.getOne(planId);
      if (!planR.ok) throw new Error(planR.error.message);
      if (!planR.data) throw new NotFoundException('Reja topilmadi');
      if (planR.data['status'] === 'approved') throw new ConflictException('Reja allaqachon tasdiqlangan');
      if (isApprovalDeadlinePassed(String(planR.data['week_start']))) {
        throw new ConflictException(`Haftalik reja tasdiqlash muddati (${planR.data['week_start']} haftasi uchun Juma 18:00) o'tib ketdi.`);
      }
      const updated = await this.repo.approve(planId, user.id);
      if (!updated.ok) throw new Error(updated.error.message);
      return { plan: normalisePlan(updated.data ?? {}) };
    });
  }
}
