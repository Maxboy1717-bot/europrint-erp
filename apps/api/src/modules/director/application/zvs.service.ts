/**
 * @module zvs.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError, Err } from '@common/result';
import { ZvsRepository } from './zvs.repository';

const LEVEL1_ROLES = ['admin', 'super_admin', 'director', 'ceo', 'cfo', 'finance_manager', 'department_head', 'manager'];
const LEVEL2_ROLES = ['admin', 'super_admin', 'director', 'ceo', 'cfo', 'finance_manager'];
const LEVEL3_ROLES = ['admin', 'super_admin', 'director', 'ceo'];

function computeLevel(amount: number): number {
  if (amount <= 500_000) return 1;
  if (amount <= 5_000_000) return 2;
  return 3;
}

function canApproveLevel(role: string, level: number): boolean {
  if (level === 1) return LEVEL1_ROLES.includes(role);
  if (level === 2) return LEVEL2_ROLES.includes(role);
  return LEVEL3_ROLES.includes(role);
}

function getWeekStart(date?: string): string {
  const d = date ? new Date(date) : _time.now();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

@Injectable()
export class ZvsService {
  constructor(private readonly repo: ZvsRepository) {}

  async createZvsWithValidation(
    body: Record<string, unknown>,
    userId: number,
  ): Promise<Result<object, AppError>> {
    const { department_id, submitter_name, amount, purpose, priority, week_date } = body;
    if (!purpose || amount === undefined)
      return Err({ code: 'BAD_REQUEST', message: "purpose va amount majburiy" });
    const amt = safeNum(amount);
    if (isNaN(amt) || amt <= 0)
      return Err({ code: 'BAD_REQUEST', message: "amount musbat son bo'lishi kerak" });
    const level = computeLevel(amt);
    const weekDate = getWeekStart(week_date as string | undefined);
    return safeCall(() =>
      this.repo.createZvs(
        department_id ? Number(department_id) : null,
        userId,
        (submitter_name as string) ?? null,
        amt,
        purpose as string,
        (priority as string) ?? 'normal',
        weekDate,
        level,
      ),
    );
  }

  async listZvs(status: string | null, weekDate: string | null, departmentId: number | null) {
    return this.repo.listZvs(status, weekDate, departmentId);
  }

  async approveZvsWithAuth(
    id: number,
    userId: number,
    userRole: string,
    comment: string | null,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing.ok) return existing;
    const existingRows = existing.data as Record<string, unknown>[];
    if (!existingRows.length) return Err({ code: 'BAD_REQUEST', message: 'Topilmadi' });
    const zvs = existingRows[0] as Record<string, unknown>;
    const level = Number(zvs.level);
    if (String(zvs.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "SoD ihlol: ZVS yaratuvchi uni tasdiqlay olmaydi (code: ZVS_SOD_001)" });
    if (!canApproveLevel(userRole, level)) {
      const levelNames: Record<number, string> = {
        1: "Bo'lim boshlig'i yoki yuqori",
        2: "Direktsiya yoki moliya rahbariyati (≤5M)",
        3: "Direktor yoki CEO (>5M)",
      };
      return Err({ code: 'FORBIDDEN', message: `ZVS darajasi ${level}: ${levelNames[level] ?? 'yuqori vakolat'} talab qilinadi. Sizning rolingiz: ${userRole}` });
    }
    return this.repo.approveZvs(id, userId, comment);
  }

  async rejectZvsWithAuth(
    id: number,
    userId: number,
    userRole: string,
    comment: string | null,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing.ok) return existing;
    const existingRows = existing.data as Record<string, unknown>[];
    if (!existingRows.length) return Err({ code: 'BAD_REQUEST', message: 'Topilmadi' });
    const zvs = existingRows[0] as Record<string, unknown>;
    const level = Number(zvs.level);
    if (String(zvs.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "SoD ihlol: ZVS yaratuvchi uni rad eta olmaydi (code: ZVS_SOD_001)" });
    if (!canApproveLevel(userRole, level))
      return Err({ code: 'FORBIDDEN', message: `Sizning rolingiz (${userRole}) ushbu darajani rad etish uchun ruxsatga ega emas` });
    return this.repo.rejectZvs(id, userId, comment);
  }
}
