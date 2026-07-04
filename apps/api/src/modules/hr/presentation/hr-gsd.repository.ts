/**
 * @module hr-gsd.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { employees, employee_skills, adaptation_milestones, payroll_period_record, hr_referrals, hr_mentorship_pairings } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import { eq, desc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class HrGsdRepository {
  async findEmployee(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select({
          id: employees.id,
          full_name: sql<string>`COALESCE("employees"."full_name", '')`,
          position_id: sql<string>`"employees"."position"`,
          department_id: sql<string>`"employees"."department"`,
          status: employees.status,
          hire_date: employees.hire_date,
          created_at: employees.created_at,
        })
        .from(employees)
        .where(sql`${employees.id}::text = ${String(id)}`)
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  // Q9: real UPDATE — was validate-only stub returning {id, updated:true} with no DB write.
  // Raw `sql` (not typed `employees` import) — @shared/db resolves `employees` to a
  // UUID-PK compat stub (schema-hr-lms.ts) that does not match the live integer-PK
  // table; same workaround already used by findEmployee()/findBoomerangs() above.
  async updateEmployee(id: number, dto: {
    positionId?: number | string;
    departmentId?: number | string;
    status?: string;
    notes?: string;
  }): Promise<Result<Row>> {
    try {
      if (dto.positionId == null && dto.departmentId == null && dto.status == null && dto.notes == null) {
        return Err('NO_FIELDS_TO_UPDATE');
      }
      const positionId = dto.positionId != null ? Number(dto.positionId) : null;
      const departmentId = dto.departmentId != null ? Number(dto.departmentId) : null;
      const rows = await typedExecute<Row>(sql`
        UPDATE employees SET
          position_id   = COALESCE(${positionId}::int, position_id),
          department_id = COALESCE(${departmentId}::int, department_id),
          status        = COALESCE(${dto.status ?? null}, status),
          notes         = COALESCE(${dto.notes ?? null}, notes),
          updated_at    = NOW()
        WHERE id = ${id}
        RETURNING id, status, position_id, department_id, notes, updated_at
      `);
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row) return Err('NOT_FOUND');
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findEmployeeHistory(id: number): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: payroll_period_record.id,
          employee_id: payroll_period_record.employee_id,
          salary_period_start: payroll_period_record.salary_period_start,
          salary_period_end: payroll_period_record.salary_period_end,
          base_salary: payroll_period_record.base_salary,
          salary_earned: payroll_period_record.salary_earned,
        })
        .from(payroll_period_record)
        .where(eq(payroll_period_record.employee_id, id))
        .orderBy(desc(payroll_period_record.salary_period_start))
        .limit(50);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  // P1.26.1: query hr_referrals table — column names match FE ReferralPage.tsx interface
  async findReferrals(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id:                  hr_referrals.id,
          referrer_id:         hr_referrals.referrer_id,
          candidate_full_name: hr_referrals.candidate_full_name,
          candidate_email:     hr_referrals.candidate_email,
          candidate_phone:     hr_referrals.candidate_phone,
          position_title:      hr_referrals.position_title,
          status:              hr_referrals.status,
          bonus_type:          hr_referrals.bonus_type,
          bonus_amount:        hr_referrals.bonus_amount,
          bonus_paid:          hr_referrals.bonus_paid,
          hr_notes:            hr_referrals.hr_notes,
          created_at:          hr_referrals.created_at,
        })
        .from(hr_referrals)
        .orderBy(desc(hr_referrals.created_at))
        .limit(100);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  // P1.26.1: real insert into hr_referrals — column names match updated schema
  async createReferral(dto: {
    referrerId?: number | string | null;
    candidateName?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    positionTitle?: string;
    hrNotes?: string;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .insert(hr_referrals)
        .values({
          referrer_id:         dto.referrerId ? Number(dto.referrerId) : 0,
          candidate_full_name: dto.candidateName ?? 'Unknown',
          candidate_email:     dto.candidateEmail ?? null,
          candidate_phone:     dto.candidatePhone ?? null,
          position_title:      dto.positionTitle ?? null,
          hr_notes:            dto.hrNotes ?? null,
        })
        .returning();
      if (!Array.isArray(rows) || !rows[0]) return Err('INSERT_FAILED');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findBoomerangs(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: employees.id,
          full_name: sql<string>`COALESCE("employees"."full_name", '')`,
          position_id: sql<string>`"employees"."position"`,
          department_id: sql<string>`"employees"."department"`,
          hire_date: employees.hire_date,
        })
        .from(employees)
        .orderBy(desc(employees.created_at))
        .limit(20);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findSkills(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: employee_skills.id,
          employee_id: employee_skills.employeeId,
          skill_name: employee_skills.skillName,
          proficiency_level: employee_skills.proficiencyLevel,
          proficiency_score: employee_skills.proficiencyScore,
          certified_date: employee_skills.certifiedDate,
          created_at: employee_skills.createdAt,
        })
        .from(employee_skills)
        .orderBy(desc(employee_skills.createdAt))
        .limit(100);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findMilestone(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(adaptation_milestones)
        .where(eq(adaptation_milestones.id, id))
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async completeMilestone(id: number): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(adaptation_milestones)
        .set({ status: 'completed' })
        .where(eq(adaptation_milestones.id, id))
        .returning();
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  // P1.26.1: update hr_referrals row — column names match updated schema
  async updateReferral(id: number, dto: {
    status?: string;
    bonusAmount?: number;
    bonusPaid?: boolean;
    hrNotes?: string;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(hr_referrals)
        .set({
          ...(dto.status      != null ? { status:       dto.status }              : {}),
          ...(dto.bonusAmount != null ? { bonus_amount: String(dto.bonusAmount) } : {}),
          ...(dto.bonusPaid   != null ? { bonus_paid:   dto.bonusPaid }           : {}),
          ...(dto.hrNotes     != null ? { hr_notes:     dto.hrNotes }             : {}),
          updated_at: new Date(),
        })
        .where(eq(hr_referrals.id, id))
        .returning();
      if (!Array.isArray(rows) || !rows[0]) return Err('NOT_FOUND');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  // P1.15.1: hr_mentorship_pairings CRUD
  async findMentorshipPairings(mentorId?: number, status?: string): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id:           hr_mentorship_pairings.id,
          mentor_id:    hr_mentorship_pairings.mentor_id,
          mentee_id:    hr_mentorship_pairings.mentee_id,
          course_id:    hr_mentorship_pairings.course_id,
          status:       hr_mentorship_pairings.status,
          started_at:   hr_mentorship_pairings.started_at,
          completed_at: hr_mentorship_pairings.completed_at,
          notes:        hr_mentorship_pairings.notes,
          created_at:   hr_mentorship_pairings.created_at,
        })
        .from(hr_mentorship_pairings)
        .where(
          mentorId != null && status
            ? sql`${hr_mentorship_pairings.mentor_id} = ${mentorId} AND ${hr_mentorship_pairings.status} = ${status}`
            : mentorId != null
              ? sql`${hr_mentorship_pairings.mentor_id} = ${mentorId}`
              : status
                ? sql`${hr_mentorship_pairings.status} = ${status}`
                : sql`1=1`,
        )
        .orderBy(desc(hr_mentorship_pairings.created_at))
        .limit(100);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async createMentorshipPairing(dto: {
    mentorId: number;
    menteeId: number;
    courseId?: number | null;
    notes?: string;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .insert(hr_mentorship_pairings)
        .values({
          mentor_id:  dto.mentorId,
          mentee_id:  dto.menteeId,
          course_id:  dto.courseId ?? null,
          status:     'active',
          started_at: new Date(),
          notes:      dto.notes ?? null,
        })
        .returning();
      if (!Array.isArray(rows) || !rows[0]) return Err('INSERT_FAILED');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updateMentorshipPairing(id: number, dto: {
    status?: string;
    notes?: string;
    completedAt?: Date;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(hr_mentorship_pairings)
        .set({
          ...(dto.status      != null ? { status:       dto.status }      : {}),
          ...(dto.notes       != null ? { notes:        dto.notes }       : {}),
          ...(dto.completedAt != null ? { completed_at: dto.completedAt } : {}),
        })
        .where(eq(hr_mentorship_pairings.id, id))
        .returning();
      if (!Array.isArray(rows) || !rows[0]) return Err('NOT_FOUND');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findEmployeesList(limit = 100, offset = 0): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: employees.id,
          full_name: sql<string>`COALESCE("employees"."full_name", '')`,
          position_id: sql<string>`"employees"."position"`,
          department_id: sql<string>`"employees"."department"`,
          status: employees.status,
          hire_date: employees.hire_date,
        })
        .from(employees)
        .orderBy(sql`"employees"."full_name"`)
        .limit(limit)
        .offset(offset);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }
}
