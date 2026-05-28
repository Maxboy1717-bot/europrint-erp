/**
 * @module hr-compat-a.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (HR)
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql, asc } from 'drizzle-orm';
import {
  employee_360_assessments, hr_conflict_reports, employee_skills,
  hr_interview_sessions, hrc_iq_questions, hr_health_checkups,
  discipline_records, hrEmployees, hrDepartments, hrPositions,
  vacancies, skill_catalog,
} from '@shared/db';
import { safeInt } from '../../common/db-rows';
import { safeCall, Result } from '@common/result';
import type { IHrCompatARepo } from '../../domain/repositories/i-hr-compat-a.repo';

type Row = Record<string, unknown>;

@Injectable()
export class HrCompatARepository implements IHrCompatARepo {
  async get360Reviews(employeeId?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const eid = employeeId ? safeInt(employeeId, 0) : 0;
      const rows = await runQuery<Row>(sql`
        SELECT a.id, a.employee_id, a.assessment_period, a.assessment_year,
               a.self_rating, a.manager_rating, a.peer_rating, a.average_rating,
               a.strengths, a.areas_for_improvement, a.status, a.created_at,
               e.first_name || ' ' || e.last_name AS employee_name
        FROM employee_360_assessments a
        LEFT JOIN employees e ON e.id = a.employee_id
        WHERE ${eid > 0 ? eid : null}::int IS NULL OR a.employee_id = ${eid > 0 ? eid : null}
        ORDER BY a.created_at DESC
        LIMIT 100
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async create360Review(employeeId: unknown, assessmentPeriod: unknown, assessmentYear: number, selfRating: unknown, managerRating: unknown, peerRating: unknown, avg: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(employee_360_assessments).values({
        employee_id:              (employeeId ?? null) as number,
        assessment_period:        (assessmentPeriod ?? 'Q1') as string,
        assessment_year:          assessmentYear,
        self_rating:              selfRating != null ? String(selfRating) : null,
        manager_rating:           managerRating != null ? String(managerRating) : null,
        peer_rating:              peerRating != null ? String(peerRating) : null,
        average_rating:           String(avg),
        status:                   'in_progress',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async get360DeptSummary(departmentId?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const did = departmentId ? safeInt(departmentId, 0) : 0;
      const rows = await runQuery<Row>(sql`
        SELECT d.id AS department_id, d.name AS department_name,
               ROUND(AVG(a.average_rating)::numeric, 2) AS avg_rating,
               COUNT(a.id) AS review_count
        FROM employee_360_assessments a
        JOIN employees e ON e.id = a.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE ${did > 0 ? did : null}::int IS NULL OR e.department_id = ${did > 0 ? did : null}
        GROUP BY d.id, d.name
        ORDER BY avg_rating DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getConflictReports(status?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:          hr_conflict_reports.id,
        party1:      hr_conflict_reports.party1,
        party2:      hr_conflict_reports.party2,
        description: hr_conflict_reports.description,
        severity:    hr_conflict_reports.severity,
        status:      hr_conflict_reports.status,
        created_at:  hr_conflict_reports.created_at,
      })
        .from(hr_conflict_reports)
        .where(sql`${status ?? null}::text IS NULL OR ${hr_conflict_reports.status} = ${status ?? null}`)
        .orderBy(sql`${hr_conflict_reports.created_at} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createConflictReport(party1: unknown, party2: unknown, description: unknown, severity: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(hr_conflict_reports).values({
        party1:      (party1 ?? '') as string,
        party2:      (party2 ?? '') as string,
        description: (description ?? null) as string,
        severity:    (severity ?? 'medium') as string,
        status:      'open',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getEmployeeSkills(employeeId?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const eid = employeeId ? safeInt(employeeId, 0) : 0;
      const rows = await runQuery<Row>(sql`
        SELECT es.id, es.employee_id, es.skill_name, es.proficiency_level, es.proficiency_score,
               es.certified_date, es.expiry_date, es.notes, es.created_at,
               e.first_name || ' ' || e.last_name AS employee_name
        FROM employee_skills es
        LEFT JOIN employees e ON e.id = es.employee_id
        WHERE ${eid > 0 ? eid : null}::int IS NULL OR es.employee_id = ${eid > 0 ? eid : null}
        ORDER BY es.created_at DESC
        LIMIT 100
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async createEmployeeSkill(employeeId: unknown, skillName: unknown, proficiencyLevel: unknown, proficiencyScore: unknown, certifiedDate: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(employee_skills).values({
        employeeId:       (employeeId ?? null) as number,
        skillName:        (skillName ?? '') as string,
        proficiencyLevel: (proficiencyLevel ?? 'beginner') as string,
        proficiencyScore: proficiencyScore != null ? String(proficiencyScore) : null,
        certifiedDate:    (certifiedDate ?? null) as string,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getEmployeeSkillsById(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:               employee_skills.id,
        employee_id:      employee_skills.employeeId,
        skill_name:       employee_skills.skillName,
        proficiency_level: employee_skills.proficiencyLevel,
        proficiency_score: employee_skills.proficiencyScore,
        certified_date:   employee_skills.certifiedDate,
        expiry_date:      employee_skills.expiryDate,
        notes:            employee_skills.notes,
        created_at:       employee_skills.createdAt,
      })
        .from(employee_skills)
        .where(eq(employee_skills.employeeId, employeeId))
        .orderBy(sql`${employee_skills.proficiencyScore} DESC`)
        .limit(50);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createHealthCheckup(departmentId: unknown, departmentName: unknown, totalEmployees: unknown, examinedCount: unknown, lastCheckupDate: unknown, nextCheckupDate: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(hr_health_checkups).values({
        department_id:     (departmentId ?? null) as number,
        department_name:   (departmentName ?? null) as string,
        total_employees:   (totalEmployees ?? 0) as number,
        examined_count:    (examinedCount ?? 0) as number,
        last_checkup_date: (lastCheckupDate ?? null) as string,
        next_checkup_date: (nextCheckupDate ?? null) as string,
        status:            'scheduled',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getHrcTestSessions(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:             hr_interview_sessions.id,
        token:          hr_interview_sessions.token,
        candidate_name: hr_interview_sessions.candidate_name,
        candidate_id:   hr_interview_sessions.candidate_id,
        vacancy_id:     hr_interview_sessions.vacancy_id,
        status:         hr_interview_sessions.status,
        expires_at:     hr_interview_sessions.expires_at,
      })
        .from(hr_interview_sessions)
        .orderBy(sql`${hr_interview_sessions.expires_at} DESC`)
        .limit(50);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getHrcTestQuestions(category?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:         hrc_iq_questions.id,
        text_uz:    hrc_iq_questions.text_uz,
        text_ru:    hrc_iq_questions.text_ru,
        options:    hrc_iq_questions.options,
        category:   hrc_iq_questions.category,
        created_at: hrc_iq_questions.created_at,
      })
        .from(hrc_iq_questions)
        .where(sql`${category ?? null}::text IS NULL OR ${hrc_iq_questions.category} = ${category ?? null}`)
        .orderBy(sql`${hrc_iq_questions.created_at} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createDisciplineRecord(employeeId: unknown, violationType: unknown, disciplineType: unknown, severity: unknown, violationDate: unknown, description: unknown, fineAmount: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(discipline_records).values({
        employeeId:    (employeeId ?? null) as number,
        violationType: (violationType ?? null) as string,
        disciplineType: (disciplineType ?? null) as string,
        severity:       (severity ?? 'minor') as string,
        violationDate: (violationDate ?? null) as string,
        issuedDate:    sql`NOW()::date`,
        description:    (description ?? null) as string,
        fineAmount:    fineAmount != null ? String(fineAmount) : null,
        status:         'issued',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getDepartments(isActive?: boolean): Promise<Result<Row[]>> {
    return safeCall(async () => {
      // Canonical hrDepartments uses camelCase: parentId, headId, isActive. Map to snake_case in output.
      const rows = await db
        .select({
          id:         hrDepartments.id,
          name:       hrDepartments.name,
          code:       hrDepartments.code,
          parent_id:  hrDepartments.parentId,
          manager_id: hrDepartments.headId,
          is_active:  hrDepartments.isActive,
        })
        .from(hrDepartments)
        .where(isActive !== undefined ? eq(hrDepartments.isActive, isActive) : sql`TRUE`)
        .orderBy(asc(hrDepartments.name));
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  async getPositions(departmentId?: number, isActive?: boolean): Promise<Result<Row[]>> {
    return safeCall(async () => {
      // Canonical positions uses: title (not name), departmentId, isActive, createdAt.
      const rows = await db
        .select({
          id:            hrPositions.id,
          name:          hrPositions.title,
          department_id: hrPositions.departmentId,
          is_active:     hrPositions.isActive,
          created_at:    hrPositions.createdAt,
        })
        .from(hrPositions)
        .where(
          sql`(${departmentId ?? null}::int IS NULL OR ${hrPositions.departmentId} = ${departmentId ?? null})
            AND (${isActive ?? null}::boolean IS NULL OR ${hrPositions.isActive} = ${isActive ?? null})`,
        )
        .orderBy(asc(hrPositions.title));
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  async getVacancies(status?: string, isActive?: boolean): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id:            vacancies.id,
          title:         vacancies.title,
          department:    vacancies.department,
          department_id: vacancies.department_id,
          status:        vacancies.status,
          is_active:     vacancies.isActive,
          requirements:  vacancies.requirements,
          closing_date:  vacancies.closing_date,
          description:   vacancies.description,
          created_at:    vacancies.createdAt,
        })
        .from(vacancies)
        .where(
          sql`(${status ?? null}::text IS NULL OR ${vacancies.status} = ${status ?? null})
            AND (${isActive ?? null}::boolean IS NULL OR ${vacancies.isActive} = ${isActive ?? null})`,
        )
        .orderBy(sql`${vacancies.createdAt} DESC`);
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  // ─── Skills Catalog (GET/POST/PATCH/DELETE /hr/skills) ───────────────────────

  async getSkillsCatalog(): Promise<Result<{ items: Row[]; total: number }>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id:          skill_catalog.id,
          code:        skill_catalog.code,
          name:        skill_catalog.name,
          nameRu:      skill_catalog.name_ru,
          category:    skill_catalog.category,
          is_active:   skill_catalog.is_active,
          created_at:  skill_catalog.created_at,
        })
        .from(skill_catalog)
        .where(eq(skill_catalog.is_active, true))
        .orderBy(asc(skill_catalog.name));
      return { items: castTo<Row[]>(rows), total: rows.length };
    }, 'DB_ERROR');
  }

  async createSkillCatalog(data: { code: string; name: string; nameRu?: string; category?: string; description?: string }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db
        .insert(skill_catalog)
        .values({
          code:     data.code,
          name:     data.name,
          name_ru:  data.nameRu ?? null,
          category: data.category ?? null,
        })
        .returning();
      return castTo<Row>(rows[0] ?? {});
    }, 'DB_ERROR');
  }

  async updateSkillCatalog(id: number, data: { name?: string; nameRu?: string; category?: string; description?: string }): Promise<Result<Row>> {
    return safeCall(async () => {
      const updateData: Record<string, unknown> = {};
      if (data.name     !== undefined) updateData['name']     = data.name;
      if (data.nameRu   !== undefined) updateData['name_ru']  = data.nameRu;
      if (data.category !== undefined) updateData['category'] = data.category;
      const rows = await db
        .update(skill_catalog)
        .set(updateData)
        .where(eq(skill_catalog.id, id))
        .returning();
      return castTo<Row>(rows[0] ?? {});
    }, 'DB_ERROR');
  }

  async deleteSkillCatalog(id: number): Promise<Result<{ deleted: number }>> {
    return safeCall(async () => {
      // Soft-delete: set is_active=false
      await db
        .update(skill_catalog)
        .set({ is_active: false })
        .where(eq(skill_catalog.id, id));
      return { deleted: id };
    }, 'DB_ERROR');
  }

  // ─── Delete Employee Skill Assignment ────────────────────────────────────────

  async deleteEmployeeSkill(id: number): Promise<Result<{ deleted: number }>> {
    return safeCall(async () => {
      await db
        .delete(employee_skills)
        .where(eq(employee_skills.id, id));
      return { deleted: id };
    }, 'DB_ERROR');
  }
}
