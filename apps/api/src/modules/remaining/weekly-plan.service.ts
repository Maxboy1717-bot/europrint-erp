/**
 * @module weekly-plan.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Err, Ok, Result, safeCall } from '@common/result';
import { WeeklyPlanRepository } from './weekly-plan.repository';

import { MS_PER_HOUR } from '@common/constants/app.constants';
export const MANAGER_ROLES = ['director', 'super_admin', 'department_head', 'manager', 'admin'];

export function getMondayOfWeek(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : _time.now();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function isApprovalDeadlinePassed(weekStart: string): boolean {
  const monday = new Date(weekStart + 'T00:00:00');
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(18, 0, 0, 0);
  const tashkentOffsetMs = 5 * MS_PER_HOUR;
  return Date.now() > friday.getTime() - tashkentOffsetMs;
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
      // P1.28.1: translate snake_case DB rows to camelCase so FE types work
      const normalised = plans.map((p) => ({
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
      }));
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
          return Err('Boshqa xodim uchun reja topshira olmaysiz');
        }
        employeeId = user.id;
      }
      if (!employeeId || isNaN(employeeId)) return Err('employee_id talab qilinadi');
      // P1.28.1: accept both snake_case (FE sends) and camelCase
      const gsdTarget  = body['gsd_target']  ?? body['gsdTarget'];
      const top5Tasks  = body['top5_tasks']  ?? body['top5Tasks'];
      if (!gsdTarget) return Err('gsd_target talab qilinadi');
      if (!Array.isArray(top5Tasks) || top5Tasks.length === 0) return Err('top5_tasks array talab qilinadi');
      const weekStart = getMondayOfWeek(String(body['week'] ?? ''));
      const existing = await this.repo.findExisting(employeeId, weekStart);
      if (!existing.ok) return Err(existing.error.message);
      if (existing.data.length > 0) {
        const existingId = existing.data[0]['id'];
        const plan = await this.repo.updatePlan(existingId, gsdTarget, top5Tasks as Record<string, unknown>[], body);
        return { plan, updated: true };
      }
      const plan = await this.repo.createPlan(employeeId, weekStart, gsdTarget, top5Tasks as Record<string, unknown>[], body);
      return { plan, updated: false };
    });
  }

  async getOne(id: string, user: { id: number; role: string }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const planId = parseInt(id, 10);
      if (isNaN(planId)) return Err("Noto'g'ri ID");
      const plan = await this.repo.getOne(planId);
      if (!plan) return Err('Reja topilmadi');
      const isManager = MANAGER_ROLES.includes(user.role);
      const planData = (plan.data ?? {}) as Record<string, unknown>;
      if (!isManager && Number(planData['employee_id']) !== user.id) return Err("Ruxsat yo'q");
      return { plan };
    });
  }

  async update(id: string, user: { id: number; role: string }, body: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const planId = parseInt(id, 10);
      if (isNaN(planId)) return Err("Noto'g'ri ID");
      const planR = await this.repo.getOne(planId);
      if (!planR.ok) return Err(planR.error.message);
      const plan = planR.data as Record<string, unknown> | null;
      if (!plan) return Err('Reja topilmadi');
      const isManager = MANAGER_ROLES.includes(user.role);
      if (!isManager && Number(plan['employee_id']) !== user.id) return Err("Ruxsat yo'q");
      const updated = await this.repo.updatePlanById(planId, body);
      if (!updated.ok) return Err(updated.error.message);
      return { plan: updated.data };
    });
  }

  async deletePlan(id: string, user: { id: number; role: string }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const planId = parseInt(id, 10);
      if (isNaN(planId)) return Err("Noto'g'ri ID");
      const planR = await this.repo.getOne(planId);
      if (!planR.ok) return Err(planR.error.message);
      const plan = planR.data as Record<string, unknown> | null;
      if (!plan) return Err('Reja topilmadi');
      const isManager = MANAGER_ROLES.includes(user.role);
      if (!isManager) return Err("Faqat menejer reja o'chira oladi");
      const deleted = await this.repo.deletePlan(planId);
      if (!deleted.ok || !deleted.data) return Err('Reja topilmadi yoki o\'chirib bo\'lmadi');
      return { deleted: true, id: planId };
    });
  }

  async approve(id: string, user: { id: number; role: string }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const planId = parseInt(id, 10);
      if (isNaN(planId)) return Err("Noto'g'ri ID");
      const planR = await this.repo.getOne(planId);
      if (!planR.ok) return Err(planR.error.message);
      const plan = planR.data as Record<string, unknown> | null;
      if (!plan) return Err('Reja topilmadi');
      if (plan['status'] === 'approved') return Err('Reja allaqachon tasdiqlangan');
      if (isApprovalDeadlinePassed(String(plan['week_start']))) {
        return Err(`Haftalik reja tasdiqlash muddati (${plan['week_start']} haftasi uchun Juma 18:00) o'tib ketdi.`);
      }
      const updated = await this.repo.approve(planId, user.id);
      return { plan: updated };
    });
  }
}
