/**
 * @module drizzle-hr-onboarding.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { hrOnboardingPlans, hrEmployeeOnboardings, users } from '@europrint/schemas';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { Ok, Err } from '@common/result';
import { IHrOnboardingRepository } from './i-hr-onboarding.repo';

type OnboardingPlanRow = typeof hrOnboardingPlans.$inferSelect;
type EmployeeOnboardingRow = typeof hrEmployeeOnboardings.$inferSelect;
type UserBasicRow = { id: number; fullName: string | null };

@Injectable()
export class DrizzleHrOnboardingRepository implements IHrOnboardingRepository {
  async createPlan(dto: unknown, createdById: number) {
    try {
      const d = dto as Record<string, unknown>;
      const row: Omit<typeof hrOnboardingPlans.$inferInsert, 'id'> = {
        title: (d['title'] as string | undefined) ?? '',
        tasks: d['tasks'] ? JSON.stringify(d['tasks']) : '[]',
        durationDays: (d['durationDays'] as number | undefined) ?? 30,
        isActive: true,
        departmentId: d['departmentId'] as string | undefined,
        positionId: d['positionId'] as number | undefined,
        createdById,
      };
      const [plan] = await db.insert(hrOnboardingPlans).values(row as typeof hrOnboardingPlans.$inferInsert).returning();
      return Ok(plan as OnboardingPlanRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Reja yaratishda xatolik'); }
  }

  async listPlans(positionId?: number, departmentId?: number) {
    try {
      const filters = [eq(hrOnboardingPlans.isActive, true)];
      if (positionId) filters.push(eq(hrOnboardingPlans.positionId, positionId));
      if (departmentId) filters.push(eq(hrOnboardingPlans.departmentId, String(departmentId)));
      const where = filters.length > 1 ? and(...filters) : filters[0];
      const rows = await db.select().from(hrOnboardingPlans).where(where).orderBy(desc(hrOnboardingPlans.createdAt));
      return Ok(rows as OnboardingPlanRow[]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Rejalar topilmadi'); }
  }

  async getPlanById(id: number) {
    try {
      const [plan] = await db.select().from(hrOnboardingPlans).where(eq(hrOnboardingPlans.id, id));
      return Ok((plan as OnboardingPlanRow) || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Reja #${id} topilmadi`); }
  }

  async findEmployeeById(employeeId: number) {
    try {
      const [emp] = await db.select({ id: users.id, fullName: users.fullName }).from(users).where(and(eq(users.id, employeeId), isNull(users.deletedAt)));
      return Ok((emp as UserBasicRow) || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Xodim #${employeeId} topilmadi`); }
  }

  async startOnboarding(dto: { employeeId: number; planId: number; mentorId?: number; startDate: Date; expectedEndDate: Date }) {
    try {
      const row: Omit<typeof hrEmployeeOnboardings.$inferInsert, 'id'> = {
        employeeId: dto.employeeId,
        planId: String(dto.planId),
        status: 'IN_PROGRESS',
        startDate: dto.startDate,
        expectedEndDate: dto.expectedEndDate,
        mentorId: dto.mentorId,
        weeklyProgress: '[]',
      };
      const [onboarding] = await db.insert(hrEmployeeOnboardings).values(row as typeof hrEmployeeOnboardings.$inferInsert).returning();
      return Ok(onboarding as EmployeeOnboardingRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Onboarding boshlashda xatolik'); }
  }

  async getOnboardingById(id: number) {
    try {
      const [row] = await db.select().from(hrEmployeeOnboardings).where(eq(hrEmployeeOnboardings.id, id));
      return Ok((row as EmployeeOnboardingRow) || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Onboarding #${id} topilmadi`); }
  }

  async updateProgress(id: number, weeklyProgress: unknown[], updatedAt: Date) {
    try {
      const patch: Partial<typeof hrEmployeeOnboardings.$inferInsert> = {
        weeklyProgress: JSON.stringify(weeklyProgress),
        updatedAt,
      };
      const [updated] = await db.update(hrEmployeeOnboardings).set(patch).where(eq(hrEmployeeOnboardings.id, id)).returning();
      return Ok(updated as EmployeeOnboardingRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Jarayon yangilashda xatolik'); }
  }

  async completeProbation(id: number, dto: { status: string; probationScore?: number; probationNotes?: string; isProbationPassed: boolean; actualEndDate: Date; updatedAt: Date }) {
    try {
      const patch: Partial<typeof hrEmployeeOnboardings.$inferInsert> = {
        status: dto.status,
        probationScore: dto.probationScore !== undefined ? String(dto.probationScore) : undefined,
        probationNotes: dto.probationNotes,
        isProbationPassed: dto.isProbationPassed,
        actualEndDate: dto.actualEndDate,
        updatedAt: dto.updatedAt,
      };
      const [updated] = await db.update(hrEmployeeOnboardings).set(patch).where(eq(hrEmployeeOnboardings.id, id)).returning();
      return Ok(updated as EmployeeOnboardingRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Probatsiya yakunlashda xatolik'); }
  }

  async getEmployeeOnboarding(employeeId: number) {
    try {
      const rows = await db.select().from(hrEmployeeOnboardings).where(eq(hrEmployeeOnboardings.employeeId, employeeId)).orderBy(desc(hrEmployeeOnboardings.startDate));
      return Ok(rows as EmployeeOnboardingRow[]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Xodim onboardingi topilmadi'); }
  }
}
