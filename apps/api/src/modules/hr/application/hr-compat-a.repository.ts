import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import {
  employee_360_assessments, hr_conflict_reports, employee_skills,
  hr_interview_sessions, hrc_iq_questions, hr_health_checkups,
  discipline_records, hrEmployees, hrDepartments,
} from '@shared/db';
import { safeInt } from '../common/db-rows';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class HrCompatARepository {
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
        employee_id:       (employeeId ?? null) as number,
        skill_name:        (skillName ?? '') as string,
        proficiency_level: (proficiencyLevel ?? 'beginner') as string,
        proficiency_score: proficiencyScore != null ? String(proficiencyScore) : null,
        certified_date:    (certifiedDate ?? null) as string,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getEmployeeSkillsById(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:               employee_skills.id,
        employee_id:      employee_skills.employee_id,
        skill_name:       employee_skills.skill_name,
        proficiency_level: employee_skills.proficiency_level,
        proficiency_score: employee_skills.proficiency_score,
        certified_date:   employee_skills.certified_date,
        expiry_date:      employee_skills.expiry_date,
        notes:            employee_skills.notes,
        created_at:       employee_skills.created_at,
      })
        .from(employee_skills)
        .where(eq(employee_skills.employee_id, employeeId))
        .orderBy(sql`${employee_skills.proficiency_score} DESC`)
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
        employee_id:    (employeeId ?? null) as number,
        violation_type: (violationType ?? null) as string,
        discipline_type: (disciplineType ?? null) as string,
        severity:       (severity ?? 'minor') as string,
        violation_date: (violationDate ?? null) as string,
        issued_date:    sql`NOW()::date`,
        description:    (description ?? null) as string,
        fine_amount:    fineAmount != null ? String(fineAmount) : null,
        status:         'issued',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }
}
