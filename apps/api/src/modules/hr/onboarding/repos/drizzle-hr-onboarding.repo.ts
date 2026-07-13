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
import { IHrOnboardingRepository, OnboardingDocTaskRow } from './i-hr-onboarding.repo';

type OnboardingPlanRow = typeof hrOnboardingPlans.$inferSelect;
type EmployeeOnboardingRow = typeof hrEmployeeOnboardings.$inferSelect;
type UserBasicRow = { id: number; fullName: string | null };

@Injectable()
export class DrizzleHrOnboardingRepository implements IHrOnboardingRepository {
  async createPlan(dto: unknown, createdById: number) {
    try {
      const d = dto as Record<string, unknown>;
      const name = (d['name'] as string | undefined) ?? (d['title'] as string | undefined) ?? '';
      const row: Omit<typeof hrOnboardingPlans.$inferInsert, 'id'> = {
        // DTO sends `name` (Zod schema); compat column is `title` — map both
        title: name,
        tasks: d['weeklyPlan'] ? JSON.stringify(d['weeklyPlan']) : (d['tasks'] ? JSON.stringify(d['tasks']) : '[]'),
        durationDays: (d['probationDays'] as number | undefined) ?? (d['durationDays'] as number | undefined) ?? 90,
        isActive: true,
        departmentId: d['departmentId'] as string | undefined,
        positionId: d['positionId'] as number | undefined,
        createdById,
        // FIX 2026-07-13 (onboarding→karta wiring audit): these were previously dropped
        // (nameRu/successCriteria) or double-written into the legacy tasks/duration_days
        // columns only (weeklyPlan/probationDays) — now ALSO persisted to their real, dedicated
        // columns (additive; the legacy writes above are unchanged so nothing regresses).
        // `cardId` (or `orgDepartmentId`) is the NEW card-centric plan binding — without it
        // there was no way, even manually, to attach a plan to a karta (org_departments.id).
        updatedAt: new Date(),
        orgDepartmentId: (d['cardId'] as number | undefined) ?? (d['orgDepartmentId'] as number | undefined) ?? undefined,
        name,
        nameRu: d['nameRu'] as string | undefined,
        weeklyPlan: d['weeklyPlan'] ?? undefined,
        probationDays: d['probationDays'] as number | undefined,
        successCriteria: d['successCriteria'] ?? undefined,
      };
      const [plan] = await db.insert(hrOnboardingPlans).values(row as typeof hrOnboardingPlans.$inferInsert).returning();
      return Ok(plan as OnboardingPlanRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Reja yaratishda xatolik'); }
  }

  /**
   * 2026-07-13: resolve the CARD's onboarding plan (card-centric per vision — the plan derives
   * from the karta, not the employee). `org_department_id` FKs org_departments(id), the current
   * canonical karta table (fk_hr_onboard_org_dept). Newest active plan wins when >1 is bound.
   */
  async findActivePlanByCard(cardId: number) {
    try {
      const [plan] = await db
        .select()
        .from(hrOnboardingPlans)
        .where(and(eq(hrOnboardingPlans.orgDepartmentId, cardId), eq(hrOnboardingPlans.isActive, true)))
        .orderBy(desc(hrOnboardingPlans.id))
        .limit(1);
      return Ok((plan as OnboardingPlanRow) || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Karta #${cardId} uchun reja topilmadi`); }
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

  /**
   * 2026-07-13 onboarding→karta wiring: the REVERSE bridge (employees.id → users.id).
   * `CARD_EMPLOYEE_ASSIGNED_EVENT` carries `employees.id`; `hr_employee_onboardings.employee_id`
   * and `user_onboarding_progress.user_id` both need `users.id`. Raw SQL for the same
   * schema-barrel-precedence reason as findEmployeesIdByUserId above. Returns null (not
   * fabricated) when employees.user_id is unset.
   */
  async findUserIdByEmployeeId(employeeId: number) {
    try {
      const rows = await typedExecute<{ user_id: number | null }>(sql`SELECT user_id FROM employees WHERE id = ${employeeId} LIMIT 1`);
      const row = Array.isArray(rows) ? rows[0] : undefined;
      return Ok(row && row.user_id != null ? Number(row.user_id) : null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Xodim (employees) #${employeeId} uchun user_id topilmadi`); }
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

  // ─── Onboarding-task template materialization (2026-07-13) ───────────────
  // Raw SQL throughout this section (Rule 4): `onboarding_tasks`/`user_onboarding_progress`
  // are NOT re-exported through `@europrint/schemas` (the compat barrel this file otherwise
  // uses) and the `@workspace/db` Drizzle def for `user_onboarding_progress.task_id` is typed
  // `varchar` while the LIVE column is `integer` (confirmed via information_schema) — another
  // pre-existing schema drift. Raw parametrized SQL sidesteps both issues cleanly (same
  // precedent as findEmployeesIdByUserId/findUserIdByEmployeeId above).

  async findTemplateTasksForCard(cardId: number) {
    try {
      const rows = await typedExecute<OnboardingDocTaskRow>(sql`
        SELECT id, title FROM onboarding_tasks
        WHERE org_function_id = ${cardId} AND deleted_at IS NULL
        ORDER BY "order" ASC, id ASC
      `);
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e: unknown) { return Err((e as Error)?.message || `Karta #${cardId} uchun onboarding-vazifa shabloni topilmadi`); }
  }

  async findRequiredDocumentTasksByCard(cardId: number) {
    try {
      const rows = await typedExecute<OnboardingDocTaskRow>(sql`
        SELECT id, title FROM onboarding_tasks
        WHERE org_function_id = ${cardId} AND type = 'document' AND is_required = true AND deleted_at IS NULL
        ORDER BY "order" ASC, id ASC
      `);
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e: unknown) { return Err((e as Error)?.message || `Karta #${cardId} uchun majburiy hujjat-vazifalari topilmadi`); }
  }

  async ensureTaskProgress(userId: number, taskId: number) {
    try {
      const existing = await typedExecute<{ id: number }>(sql`
        SELECT id FROM user_onboarding_progress WHERE user_id = ${userId} AND task_id = ${taskId} LIMIT 1
      `);
      if (Array.isArray(existing) && existing.length > 0) return Ok({ created: false });
      await typedExecute<{ id: number }>(sql`
        INSERT INTO user_onboarding_progress (user_id, task_id, completed, created_at)
        VALUES (${userId}, ${taskId}, false, NOW())
        RETURNING id
      `);
      return Ok({ created: true });
    } catch (e: unknown) { return Err((e as Error)?.message || `Vazifa #${taskId} progress-yozuvi yaratilmadi (user #${userId})`); }
  }

  async findCompletedTaskIds(userId: number, taskIds: number[]) {
    try {
      if (!Array.isArray(taskIds) || taskIds.length === 0) return Ok(new Set<number>());
      const rows = await typedExecute<{ task_id: number }>(sql`
        SELECT task_id FROM user_onboarding_progress
        WHERE user_id = ${userId} AND completed = true AND task_id = ANY(${taskIds}::int[])
      `);
      const ids = Array.isArray(rows) ? rows.map((r) => Number(r.task_id)) : [];
      return Ok(new Set(ids));
    } catch (e: unknown) { return Err((e as Error)?.message || `Xodim (user) #${userId} vazifa-holati topilmadi`); }
  }
}
