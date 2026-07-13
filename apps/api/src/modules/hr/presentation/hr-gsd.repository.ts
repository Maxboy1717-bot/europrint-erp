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
          // Q9-follow-up (2026-07-04): was reading the legacy `position`/`department` text
          // columns (always NULL) under a misleading position_id/department_id alias — the
          // real FK columns (written by updateEmployee() above) were never read here, so a
          // GSD employee updated via Q9's fix would still show null in every GET/list call.
          position_id: sql<string>`"employees"."position_id"`,
          department_id: sql<string>`"employees"."department_id"`,
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

  // NOTE: this method name is retained for the PAYROLL history sub-tab (salary
  // periods) — it is a distinct feature from the card-GSD weekly graph below.
  // See findGsdDefinition()/findGsdFactHistory()/recordGsdActual() for the
  // real GSD (ckp_fact_values) card-linked read/write path (SB0300 fix).
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

  // SB0300 fix: GSD (card weighted-score) definition for an employee — sourced
  // from the employee's card (org_departments, joined via employees.department_id)
  // ЦКП/tskp columns. Real card-linkage read (was previously absent — GsdGraph.tsx
  // called /gsd/employees/:id/history but the repo had no card-aware query at all).
  async findGsdDefinition(employeeId: number): Promise<Result<Row | null>> {
    try {
      const rows = await typedExecute<Row>(sql`
        SELECT
          od.id                        AS card_id,
          COALESCE(od.tskp, '')        AS gsd_name,
          od.tskp_target               AS target_value,
          od.tskp_measurement_unit     AS unit,
          COALESCE(od.ckp_frequency, 'weekly')     AS frequency,
          COALESCE(od.ckp_formula_type, od.tskp_formula_type) AS gsd_formula
        FROM employees e
        JOIN org_departments od ON od.id = e.department_id
        WHERE e.id = ${employeeId}
        LIMIT 1
      `);
      const row = Array.isArray(rows) ? rows[0] : undefined;
      return Ok((row ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  // SB0300 fix: real per-week GSD fact history — reads ckp_fact_values by the
  // employee's card_id (org_departments.id via employees.department_id) +
  // employee_id, bucketed into ISO weeks to match GsdGraph.tsx's
  // { week_date, week_label, actual, target, variance, note } shape. No
  // fabricated rows — 0 rows in ckp_fact_values simply yields an empty history
  // (owner/MES has not fed data yet; see recordGsdActual() for manual entry).
  async findGsdFactHistory(employeeId: number, months: number): Promise<Result<Row[]>> {
    try {
      const rows = await typedExecute<Row>(sql`
        SELECT
          date_trunc('week', f.fact_date)::date AS week_date,
          to_char(date_trunc('week', f.fact_date), 'DD.MM')  AS week_label,
          AVG(f.actual_value)::numeric      AS actual,
          AVG(f.target_value)::numeric      AS target,
          AVG(f.achievement_pct)::numeric   AS variance,
          MAX(f.notes)                      AS note
        FROM ckp_fact_values f
        JOIN employees e ON e.id = ${employeeId}
        WHERE f.employee_id = ${employeeId}
          AND f.card_id = e.department_id
          AND f.fact_date >= (CURRENT_DATE - (${months}::int * INTERVAL '1 month'))
        GROUP BY date_trunc('week', f.fact_date)
        ORDER BY week_date DESC
        LIMIT 52
      `);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  // SB0300 fix: real GSD weekly-actual write — was previously routed (by FE)
  // to updateEmployee()'s position/department/status editor, which silently
  // rejected every submission with NO_FIELDS_TO_UPDATE (week_date/actual/note
  // don't match that DTO). Upserts into ckp_fact_values keyed on
  // (card_id, fact_date, employee_id, product=NULL) — same idempotent key as
  // CkpFactRepository.upsertFact() — source='MANUAL' (owner/HR-entered, not MES).
  async recordGsdActual(employeeId: number, dto: {
    weekDate: string;
    actual: number;
    note?: string;
  }): Promise<Result<Row>> {
    try {
      const cardRows = await typedExecute<Row>(sql`
        SELECT e.department_id AS card_id, od.tskp_target AS target_value
        FROM employees e
        LEFT JOIN org_departments od ON od.id = e.department_id
        WHERE e.id = ${employeeId}
        LIMIT 1
      `);
      const card = cardRows[0];
      const cardId = card?.['card_id'] != null ? Number(card['card_id']) : null;
      if (cardId == null) return Err('EMPLOYEE_HAS_NO_CARD');
      const targetValue = card?.['target_value'] != null ? Number(card['target_value']) : null;
      const achievementPct = targetValue && targetValue > 0
        ? Math.round((dto.actual / targetValue) * 10000) / 100
        : 0;
      const rows = await typedExecute<Row>(sql`
        INSERT INTO ckp_fact_values
          (card_id, employee_id, product_id, fact_date, target_value, actual_value, achievement_pct, source, status, submitted_at, notes, created_at)
        VALUES
          (${cardId}, ${employeeId}, NULL, ${dto.weekDate}::date, ${targetValue}, ${dto.actual}, ${achievementPct}, 'MANUAL', 'submitted', NOW(), ${dto.note ?? null}, NOW())
        ON CONFLICT (card_id, fact_date, COALESCE(employee_id,0), COALESCE(product_id,0))
        DO UPDATE SET
          actual_value = EXCLUDED.actual_value,
          target_value = EXCLUDED.target_value,
          achievement_pct = EXCLUDED.achievement_pct,
          source = EXCLUDED.source,
          status = 'submitted',
          submitted_at = NOW(),
          notes = EXCLUDED.notes
        RETURNING *
      `);
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row) return Err('INSERT_FAILED');
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  // P1.26.1: query hr_referrals table — column names match FE ReferralPage.tsx interface
  // 2026-07-13: + candidate_id/hired_employee_id (Referral Tizimi completion linkage).
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
          candidate_id:        hr_referrals.candidate_id,
          hired_employee_id:   hr_referrals.hired_employee_id,
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
  // 2026-07-13 fix: `referrer_id` FK -> employees(id) is NOT NULL-effective in
  // practice (live CHECK/FK requires a real employees.id) — the previous
  // `dto.referrerId ? Number(...) : 0` fallback inserted the fabricated id `0`,
  // which always violates the FK (Q-40: "ishlaydi ≠ to'g'ri" — this silently
  // failed every referral submitted without a resolvable referrerId). Now a
  // missing/invalid referrerId is a real validation error instead of a guessed id.
  // + optional candidateId (links to the real recruiting-pipeline candidate row).
  async createReferral(dto: {
    referrerId?: number | string | null;
    candidateName?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    positionTitle?: string;
    hrNotes?: string;
    candidateId?: number | null;
  }): Promise<Result<Row>> {
    try {
      const referrerId = dto.referrerId != null ? Number(dto.referrerId) : NaN;
      if (!Number.isInteger(referrerId) || referrerId <= 0) {
        return Err('REFERRER_ID_REQUIRED');
      }
      const rows = await db
        .insert(hr_referrals)
        .values({
          referrer_id:         referrerId,
          candidate_full_name: dto.candidateName ?? 'Unknown',
          candidate_email:     dto.candidateEmail ?? null,
          candidate_phone:     dto.candidatePhone ?? null,
          position_title:      dto.positionTitle ?? null,
          hr_notes:            dto.hrNotes ?? null,
          candidate_id:        dto.candidateId ?? null,
        })
        .returning();
      if (!Array.isArray(rows) || !rows[0]) return Err('INSERT_FAILED');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  // 2026-07-13 — Referral Tizimi completion (item #5, vizyon 02-hr#12/20/21):
  // boomerang-alumni suggestion list. Was previously a placeholder that just
  // returned the last 20 CREATED employees regardless of employment status
  // (Q-40 violation — nonsensical "boomerang" candidates). Now real: terminated
  // employees only, with anyone dismissed "jarima bilan" (for cause — a serious/
  // critical discipline record or an actual fine) auto-filtered OUT per vision.
  // Raw SQL (not typed `employees` import) — same live-integer-PK-vs-compat-stub
  // workaround already used by findEmployee()/findBoomerangs() elsewhere in this
  // file (@shared/db resolves `employees` to a UUID-PK compat stub).
  async findBoomerangs(): Promise<Result<Row[]>> {
    try {
      const rows = await typedExecute<Row>(sql`
        SELECT
          e.id,
          COALESCE(e.full_name, '')      AS full_name,
          od.name                        AS department_name,
          COALESCE(p.name, p.title, p.official_title, '') AS position_name,
          e.termination_date             AS last_day,
          e.status,
          TRUE                           AS rehire_eligible
        FROM employees e
        LEFT JOIN org_departments od ON od.id = e.department_id
        LEFT JOIN positions p        ON p.id = e.position_id
        WHERE e.status = 'terminated'
          AND NOT EXISTS (
            SELECT 1 FROM discipline_records dr
            WHERE dr.employee_id = e.id
              AND dr.status = 'issued'
              AND (
                dr.severity IN ('serious', 'critical')
                OR dr.fine_amount > 0
              )
          )
        ORDER BY e.termination_date DESC NULLS LAST, e.updated_at DESC
        LIMIT 20
      `);
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
  // 2026-07-13: + candidateId (manual link to a recruiting-pipeline candidate)
  // and hiredEmployeeId (manual link to the resulting employees row — HR sets
  // this once the candidate is actually hired and the employees row exists;
  // the referral-bonus listener keys off it when that employee's probation
  // completes). Kept as explicit HR-driven fields rather than guessed/derived,
  // because the recruiting-pipeline's funnel.hire() currently uses a
  // placeholder employeeId (Q-40: no fabricated linkage).
  async updateReferral(id: number, dto: {
    status?: string;
    bonusAmount?: number;
    bonusPaid?: boolean;
    hrNotes?: string;
    candidateId?: number | null;
    hiredEmployeeId?: number | null;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(hr_referrals)
        .set({
          ...(dto.status          != null ? { status:             dto.status }              : {}),
          ...(dto.bonusAmount     != null ? { bonus_amount:       String(dto.bonusAmount) }  : {}),
          ...(dto.bonusPaid       != null ? { bonus_paid:         dto.bonusPaid }             : {}),
          ...(dto.hrNotes         != null ? { hr_notes:           dto.hrNotes }               : {}),
          ...(dto.candidateId     != null ? { candidate_id:       dto.candidateId }           : {}),
          ...(dto.hiredEmployeeId != null ? { hired_employee_id:  dto.hiredEmployeeId }        : {}),
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

  /** 2026-07-13 — internal helper for ReferralStageSyncListener/ReferralBonusListener
   * (event-driven auto-sync); not exposed via HTTP. Raw SQL — same live-shape
   * workaround as the rest of this file. */
  async updateReferralStatusByCandidateId(candidateId: number, status: string): Promise<Result<number>> {
    try {
      const rows = await typedExecute<Row>(sql`
        UPDATE hr_referrals
        SET status = ${status}, updated_at = NOW()
        WHERE candidate_id = ${candidateId}
          AND status != 'bonus_paid'
        RETURNING id
      `);
      return Ok(Array.isArray(rows) ? rows.length : 0);
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
          // Q9-follow-up (2026-07-04): was reading the legacy `position`/`department` text
          // columns (always NULL) under a misleading position_id/department_id alias — the
          // real FK columns (written by updateEmployee() above) were never read here, so a
          // GSD employee updated via Q9's fix would still show null in every GET/list call.
          position_id: sql<string>`"employees"."position_id"`,
          department_id: sql<string>`"employees"."department_id"`,
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
