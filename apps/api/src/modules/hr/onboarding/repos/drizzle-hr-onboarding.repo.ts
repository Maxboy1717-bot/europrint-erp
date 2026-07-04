/**
 * @module drizzle-hr-onboarding.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { hrOnboardingPlans, hrEmployeeOnboardings, users } from '@europrint/schemas';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
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
        // DTO sends `name` (Zod schema); compat column is `title` — map both
        title: (d['name'] as string | undefined) ?? (d['title'] as string | undefined) ?? '',
        tasks: d['weeklyPlan'] ? JSON.stringify(d['weeklyPlan']) : (d['tasks'] ? JSON.stringify(d['tasks']) : '[]'),
        durationDays: (d['probationDays'] as number | undefined) ?? (d['durationDays'] as number | undefined) ?? 90,
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

  /**
   * SB0072/SB0101: users.id → employees.id bridge (employees.user_id, UNIQUE). Raw SQL (Rule 4):
   * `@europrint/schemas` resolves a STALE `employees` pgTable (schema-hr-lms.ts, uuid id — does
   * NOT match the live integer-id `employees` table) ahead of the canonical `lib/db` definition —
   * a pre-existing schema-barrel precedence drift (see reference_schema_barrel_precedence memory).
   * Raw SQL sidesteps that ambiguity entirely; parametrized, no injection surface.
   */
  async findEmployeesIdByUserId(userId: number) {
    try {
      const rows = await typedExecute<{ id: number }>(sql`SELECT id FROM employees WHERE user_id = ${userId} LIMIT 1`);
      const row = Array.isArray(rows) ? rows[0] : undefined;
      return Ok(row ? Number(row.id) : null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Xodim (employees) userId=#${userId} uchun topilmadi`); }
  }

  async startOnboarding(dto: { employeeId: number; planId: number; mentorId?: number; startDate: Date; expectedEndDate: Date; cardId?: number }) {
    try {
      const row: Omit<typeof hrEmployeeOnboardings.$inferInsert, 'id'> = {
        employeeId: dto.employeeId,
        planId: String(dto.planId),
        status: 'IN_PROGRESS',
        startDate: dto.startDate,
        expectedEndDate: dto.expectedEndDate,
        mentorId: dto.mentorId,
        // SB0072/SB0101: onboarding nishon-kartasi — completeProbation shu kartani faollashtiradi.
        cardId: dto.cardId,
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

  async assignBuddy(onboardingId: number, buddyId: number) {
    try {
      const [updated] = await db
        .update(hrEmployeeOnboardings)
        .set({ mentorId: buddyId, updatedAt: new Date() })
        .where(eq(hrEmployeeOnboardings.id, onboardingId))
        .returning();
      return Ok(updated as EmployeeOnboardingRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Buddy biriktirishda xatolik'); }
  }

  async listAllOnboardings() {
    try {
      const rows = await db.select().from(hrEmployeeOnboardings).orderBy(desc(hrEmployeeOnboardings.startDate));
      return Ok(rows as EmployeeOnboardingRow[]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Onboardinglar topilmadi'); }
  }
}
