import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { employees, employee_skills, adaptation_milestones, salary_history } from '@shared/db';
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

  async findEmployeeHistory(id: number): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: salary_history.id,
          employee_id: salary_history.employee_id,
          salary_period_start: salary_history.salary_period_start,
          salary_period_end: salary_history.salary_period_end,
          base_salary: salary_history.base_salary,
          salary_earned: salary_history.salary_earned,
        })
        .from(salary_history)
        .where(eq(salary_history.employee_id, id))
        .orderBy(desc(salary_history.salary_period_start))
        .limit(50);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findReferrals(): Promise<Result<Row[]>> {
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
        .where(eq(employees.status, 'active'))
        .orderBy(desc(employees.hire_date))
        .limit(50);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
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
          employee_id: employee_skills.employee_id,
          skill_name: employee_skills.skill_name,
          proficiency_level: employee_skills.proficiency_level,
          proficiency_score: employee_skills.proficiency_score,
          certified_date: employee_skills.certified_date,
          created_at: employee_skills.created_at,
        })
        .from(employee_skills)
        .orderBy(desc(employee_skills.created_at))
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
