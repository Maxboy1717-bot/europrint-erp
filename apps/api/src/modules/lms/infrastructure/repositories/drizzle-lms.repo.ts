/**
 * @module drizzle-lms.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql, eq, count } from 'drizzle-orm';
import { courses_table } from '@shared/db';
import { Result, Err, Ok, AppErr } from '@common/types/result.type';
import { ILmsRepo, Course, Enrollment, CourseApproval } from '../../domain/repositories/i-lms.repo';
import { LmsCertRepo } from './drizzle-lms-cert.repo';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

function mapCourse(row: Row): Course {
  return {
    id: String(row.id),
    title: String(row.title_uz ?? row.title ?? ''),
    description: row.description != null ? String(row.description) : undefined,
    category: row.category != null ? String(row.category) : undefined,
    is_mandatory: Boolean(row.is_mandatory ?? false),
    passing_score: Number(row.passing_score ?? row.passingScore ?? 70),
    created_by: String(row.author_id ?? row.created_by ?? ''),
    created_at: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
    card_id: row.card_id != null ? Number(row.card_id) : null,
  };
}

function mapApproval(row: Row): CourseApproval {
  return {
    id: String(row.id),
    approval_status: (String(row.approval_status ?? 'draft') as CourseApproval['approval_status']),
    submitted_by: row.submitted_by != null ? Number(row.submitted_by) : null,
    submitted_at: row.submitted_at ? new Date(String(row.submitted_at)) : null,
    approved_by: row.approved_by != null ? Number(row.approved_by) : null,
    approved_at: row.approved_at ? new Date(String(row.approved_at)) : null,
  };
}

function mapEnrollment(row: Row): Enrollment {
  return {
    id: String(row.id),
    course_id: String(row.course_id ?? row.courseId),
    user_id: String(row.employee_id ?? row.user_id),
    status: String(row.status ?? 'enrolled'),
    score: row.score !== null && row.score !== undefined ? Number(row.score) : undefined,
    completed_at: row.completed_at ? new Date(String(row.completed_at)) : undefined,
    certificate_expires_at: row.certificate_expires_at ? new Date(String(row.certificate_expires_at)) : undefined,
    created_at: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
    // SB0144: card_id present on the row when selected (saveEnrollment RETURNING * includes it).
    card_id: row.card_id !== null && row.card_id !== undefined ? Number(row.card_id) : null,
  };
}

@Injectable()
export class LmsRepository implements ILmsRepo {
  private readonly logger = new Logger(LmsRepository.name);

  constructor(private readonly certRepo: LmsCertRepo) {}

  async findCourseById(id: string): Promise<Result<Course>> {
    try {
      const r = await exec(sql`SELECT * FROM courses WHERE id = ${parseInt(id, 10)} LIMIT 1`);
      if (!r[0]) return Err('Course not found');
      return Ok(mapCourse(r[0]));
    } catch (error: unknown) {
      this.logger.error(`findCourseById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAllCourses(filters?: { isMandatory?: boolean; category?: string; page?: number; limit?: number }): Promise<Result<{ items: Course[]; total: number }>> {
    try {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = (page - 1) * limit;
      const [rows, countRows] = await Promise.all([
        filters?.isMandatory !== undefined && filters?.category
          ? exec(sql`SELECT * FROM courses WHERE is_active = true AND is_mandatory = ${filters.isMandatory} AND category = ${filters.category} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters?.isMandatory !== undefined
          ? exec(sql`SELECT * FROM courses WHERE is_active = true AND is_mandatory = ${filters.isMandatory} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters?.category
          ? exec(sql`SELECT * FROM courses WHERE is_active = true AND category = ${filters.category} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT * FROM courses WHERE is_active = true ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`),
        db.select({ cnt: count() }).from(courses_table).where(eq(courses_table.is_active, true)),
      ]);
      return Ok({ items: (Array.isArray(rows) ? rows : []).map(mapCourse), total: Number(countRows[0]?.cnt ?? 0) });
    } catch (error: unknown) {
      this.logger.error(`findAllCourses: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveCourse(course: Course): Promise<Result<Course>> {
    try {
      // courses.code + title are NOT NULL (no default); old insert wrote only title_uz -> 23502.
      // card_id (EP-LMS-001): logical ref to org_functions.id — darslik binds to an org-CARD.
      const r = await exec(sql`INSERT INTO courses (title_uz, title, code, description, category, is_mandatory, passing_score, card_id, is_active, created_at) VALUES (${course.title}, ${course.title}, ${'CRS-' + Date.now()}, ${course.description ?? null}, ${course.category ?? null}, ${course.is_mandatory}, ${course.passing_score}, ${course.card_id ?? null}, true, NOW()) RETURNING *`);
      return Ok(mapCourse(r[0]));
    } catch (error: unknown) {
      this.logger.error(`saveCourse: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  // EP-LMS-001 (card-centric): list active courses (darsliklar) bound to a given org-CARD (org_functions.id).
  // A74 (card<->course view): each course carries a REAL enrollment-progress aggregate
  // (enrolled/completed counts + avg progress_percent) via LEFT JOIN enrollments — no fabricated values.
  async findCoursesByCard(cardId: number): Promise<Result<{ items: Course[]; total: number }>> {
    try {
      const [rows, countRows] = await Promise.all([
        exec(sql`
          SELECT c.*,
                 COUNT(e.id)::int                                       AS enrolled_count,
                 COUNT(*) FILTER (WHERE e.status = 'completed')::int    AS completed_count,
                 COALESCE(ROUND(AVG(e.progress_percent)), 0)::int       AS avg_progress
          FROM courses c
          LEFT JOIN enrollments e ON e.course_id = c.id
          WHERE c.card_id = ${cardId} AND (c.is_active IS NULL OR c.is_active = true)
          GROUP BY c.id
          ORDER BY c.created_at DESC`),
        runQuery<{ cnt: number }>(sql`SELECT COUNT(*) AS cnt FROM courses WHERE card_id = ${cardId} AND (is_active IS NULL OR is_active = true)`),
      ]);
      const items = (Array.isArray(rows) ? rows : []).map((row) => ({
        ...mapCourse(row),
        enrolled_count: Number(row.enrolled_count ?? 0),
        completed_count: Number(row.completed_count ?? 0),
        avg_progress: Number(row.avg_progress ?? 0),
      }));
      return Ok({ items, total: Number(countRows.rows[0]?.cnt ?? 0) });
    } catch (error: unknown) {
      this.logger.error(`findCoursesByCard: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  // EP-LMS-001 (card-centric): bind/unbind a darslik to an org-CARD (org_functions.id). null = unbind.
  async setCourseCard(id: string, cardId: number | null): Promise<Result<Course>> {
    try {
      const r = await exec(sql`UPDATE courses SET card_id = ${cardId}, updated_at = NOW() WHERE id = ${parseInt(id, 10)} RETURNING *`);
      if (!r[0]) return Err('Course not found');
      return Ok(mapCourse(r[0]));
    } catch (error: unknown) {
      this.logger.error(`setCourseCard: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  // ===========================================================================
  // T11-04 — 3-bosqich kurs-tasdiq workflow (draft -> review -> approved), 2-imzo.
  // submitCourseForReview = 1-imzo (yuboruvchi): draft -> review (atomik WHERE-guard).
  // approveCourse         = 2-imzo (boshqa tasdiqlovchi): review -> approved.
  //   2-IMZO SHARTI: approver != submitter (bir kishi o'zi yuborib o'zi tasdiqlay olmaydi).
  // Status-o'tish guard SQL WHERE'da (race-safe): noto'g'ri holatdan o'tish 0 qator qaytaradi.
  // FABRIKATSIYA YO'Q: o'tish bo'lmasa Err qaytadi, soxta "muvaffaqiyat" emas.
  // ===========================================================================

  /**
   * T11-04 1-imzo: kurslarni ko'rib chiqishga yuborish (draft -> review).
   * Faqat `approval_status = 'draft'` kursdan o'tadi (atomik WHERE). submitted_by/at yoziladi.
   */
  async submitCourseForReview(id: string, submittedBy: number): Promise<Result<CourseApproval>> {
    try {
      const courseId = parseInt(id, 10);
      if (!Number.isInteger(courseId) || courseId <= 0) return Err(AppErr('VALIDATION', 'course id must be a positive integer'));
      if (!Number.isInteger(submittedBy) || submittedBy <= 0) return Err(AppErr('VALIDATION', 'submittedBy must be a positive integer'));
      const exists = await exec(sql`SELECT approval_status FROM courses WHERE id = ${courseId} LIMIT 1`);
      if (!exists[0]) return Err(AppErr('NOT_FOUND', `Kurs #${courseId} topilmadi`));
      if (String(exists[0].approval_status) !== 'draft') {
        return Err(AppErr('INVALID_TRANSITION', `Faqat 'draft' kursni ko'rib chiqishga yuborish mumkin (joriy: ${exists[0].approval_status})`));
      }
      const r = await exec(sql`
        UPDATE courses
        SET approval_status = 'review', submitted_by = ${submittedBy}, submitted_at = NOW(), updated_at = NOW()
        WHERE id = ${courseId} AND approval_status = 'draft'
        RETURNING id, approval_status, submitted_by, submitted_at, approved_by, approved_at`);
      if (!r[0]) return Err(AppErr('INVALID_TRANSITION', 'Kurs holati o\'zgartirilmadi (draft emas yoki topilmadi)'));
      return Ok(mapApproval(r[0]));
    } catch (error: unknown) {
      this.logger.error(`submitCourseForReview: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * T11-04 2-imzo: kursni tasdiqlash (review -> approved).
   * Faqat `approval_status = 'review'` kursdan o'tadi. 2-IMZO: approvedBy != submitted_by.
   * Bir kishi o'zi yuborib o'zi tasdiqlasa RAD (Err) — ikki alohida imzo majburiy.
   */
  async approveCourse(id: string, approvedBy: number): Promise<Result<CourseApproval>> {
    try {
      const courseId = parseInt(id, 10);
      if (!Number.isInteger(courseId) || courseId <= 0) return Err(AppErr('VALIDATION', 'course id must be a positive integer'));
      if (!Number.isInteger(approvedBy) || approvedBy <= 0) return Err(AppErr('VALIDATION', 'approvedBy must be a positive integer'));
      const cur = await exec(sql`SELECT approval_status, submitted_by FROM courses WHERE id = ${courseId} LIMIT 1`);
      if (!cur[0]) return Err(AppErr('NOT_FOUND', `Kurs #${courseId} topilmadi`));
      if (String(cur[0].approval_status) !== 'review') {
        return Err(AppErr('INVALID_TRANSITION', `Faqat 'review' holatdagi kursni tasdiqlash mumkin (joriy: ${cur[0].approval_status})`));
      }
      // 2-imzo qoidasi: tasdiqlovchi yuboruvchidan boshqa shaxs bo'lishi shart.
      if (cur[0].submitted_by != null && Number(cur[0].submitted_by) === approvedBy) {
        return Err(AppErr('VALIDATION', '2-imzo sharti: tasdiqlovchi yuboruvchidan boshqa shaxs bo\'lishi kerak'));
      }
      const r = await exec(sql`
        UPDATE courses
        SET approval_status = 'approved', approved_by = ${approvedBy}, approved_at = NOW(), updated_at = NOW()
        WHERE id = ${courseId} AND approval_status = 'review'
        RETURNING id, approval_status, submitted_by, submitted_at, approved_by, approved_at`);
      if (!r[0]) return Err(AppErr('INVALID_TRANSITION', 'Kurs holati o\'zgartirilmadi (review emas yoki topilmadi)'));
      return Ok(mapApproval(r[0]));
    } catch (error: unknown) {
      this.logger.error(`approveCourse: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  // ===========================================================================
  // A72 (To'lqin-4 / EP-ORG-028/088) — LMS avto-enroll read+write paths.
  // Xodim KARTAGA (employee_cards) ulanganda CardEmployeeAssignedHandler shu ikki
  // metodni chaqiradi: kartaning faol kurslarini o'qib (findActiveCoursesByCard),
  // har biriga idempotent yozadi (autoEnroll). FABRIKATSIYA YO'Q.
  // NB: A73 ning findMandatoryCoursesByCard'i = oylik-GATE manbasi (faqat majburiy);
  //   avto-enroll esa kartaning BARCHA faol kurslarini ko'rsatadi (EP-ORG-088), shu
  //   bois alohida (majburiy-filtr emas) reader.
  // ===========================================================================

  /**
   * A72: a card's active courses (id + passing_score) — the auto-enroll source.
   * Light shape (no full mapCourse): the listener only iterates ids to enroll.
   * Empty result when no course is bound to the card (card_id NULL=0/5 hozir) — honest, NOT fabricated.
   */
  async findActiveCoursesByCard(cardId: number): Promise<Result<{ id: number; passing_score: number }[]>> {
    try {
      if (!Number.isInteger(cardId) || cardId <= 0) return Err('cardId must be a positive integer');
      const rows = await exec(sql`
        SELECT id, passing_score
        FROM courses
        WHERE card_id = ${cardId} AND (is_active IS NULL OR is_active = true)`);
      return Ok((Array.isArray(rows) ? rows : []).map((r) => ({ id: Number(r.id), passing_score: Number(r.passing_score ?? 70) })));
    } catch (error: unknown) {
      this.logger.error(`findActiveCoursesByCard: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * A72 (EP-ORG-028/088): idempotent auto-enroll when an employee is assigned to a card.
   * card_id = which card drove it; auto_enrolled = true. ON CONFLICT (employee_id, course_id)
   * (uq_enrollments_emp_course) — a re-fired assignment never duplicates. A pre-existing
   * (manual) enrollment is preserved: status is NOT touched (progress kept), only the card
   * trail is backfilled when it was NULL. `enabled` flags a fresh insert (xmax=0) vs no-op update.
   */
  async autoEnroll(employeeId: number, courseId: number, cardId: number): Promise<Result<{ enrolled: boolean }>> {
    try {
      if (!Number.isInteger(employeeId) || employeeId <= 0) return Err('employeeId must be a positive integer');
      if (!Number.isInteger(courseId) || courseId <= 0) return Err('courseId must be a positive integer');
      if (!Number.isInteger(cardId) || cardId <= 0) return Err('cardId must be a positive integer');
      const r = await exec(sql`
        INSERT INTO enrollments (employee_id, course_id, card_id, auto_enrolled, status, enrolled_at, created_at, updated_at)
        VALUES (${employeeId}, ${courseId}, ${cardId}, true, 'enrolled', NOW(), NOW(), NOW())
        ON CONFLICT (employee_id, course_id)
        DO UPDATE SET card_id = COALESCE(enrollments.card_id, EXCLUDED.card_id), updated_at = NOW()
        RETURNING (xmax = 0) AS inserted`);
      return Ok({ enrolled: Boolean(r[0]?.inserted) });
    } catch (error: unknown) {
      this.logger.error(`autoEnroll: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  // ===========================================================================
  // EP-ORG-027 / EP-LMS-070 — LMS oylik-gate read paths (A73, additive).
  // Read-only snapshots that feed LmsCardGateService. Real columns only — when a
  // signal is absent the value is the honest "not done" (0 / false), NEVER fabricated.
  // ===========================================================================

  /**
   * EP-ORG-027/028: mandatory, active courses bound to a given org-CARD.
   * These are the courses whose completion gates the card's salary/razryad growth.
   * Empty result (no course bound to the card) => no block — this is correct, not
   * a fabricated "pass". courses.card_id stays NULL until owner binds courses to cards.
   */
  async findMandatoryCoursesByCard(
    cardId: number,
  ): Promise<Result<{ id: number; passing_score: number }[]>> {
    try {
      if (!Number.isInteger(cardId) || cardId <= 0) return Err('cardId must be a positive integer');
      const rows = await exec(sql`
        SELECT id, passing_score
        FROM courses
        WHERE card_id = ${cardId}
          AND (is_active IS NULL OR is_active = true)
          AND is_mandatory = true`);
      const list = (Array.isArray(rows) ? rows : []).map((r) => ({
        id: Number(r.id),
        passing_score: Number(r.passing_score ?? 70),
      }));
      return Ok(list);
    } catch (error: unknown) {
      this.logger.error(`findMandatoryCoursesByCard: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * EP-LMS-070: per-enrollment 3-condition snapshot consumed by the PURE
   * LmsCompletionService.evaluate(). Sources (live columns only):
   *   C1 theory  = MAX(lms_test_attempts.score WHERE passed) for (user, course) — 0 when no attempt.
   *   C2 practical = enrollments.status = 'completed' (authoritative completion / mentor sign-off).
   *   C3 topics  = course_progress completed/total — when no progress rows exist the
   *                varaqa is treated as a single unconfirmed topic (1 total / 0 done),
   *                so the gate stays HONESTLY closed (not a fabricated pass).
   * passThresholdPct comes from courses.passing_score (per-course, EP-LMS-009).
   * lms_test_attempts.user_id / course_id are TEXT in live DB — cast for the join.
   */
  async getCompletionSnapshot(
    employeeId: number,
    courseId: number,
  ): Promise<Result<{
    theoryScorePct: number;
    passThresholdPct: number;
    practicalPassed: boolean;
    totalTopics: number;
    confirmedTopics: number;
  }>> {
    try {
      if (!Number.isInteger(employeeId) || employeeId <= 0) return Err('employeeId must be a positive integer');
      if (!Number.isInteger(courseId) || courseId <= 0) return Err('courseId must be a positive integer');

      const courseR = await exec(sql`SELECT passing_score FROM courses WHERE id = ${courseId} LIMIT 1`);
      if (!courseR[0]) return Err('Course not found');
      const passThresholdPct = Number(courseR[0].passing_score ?? 70);

      const bestR = await exec(sql`
        SELECT COALESCE(MAX(score), 0) AS best
        FROM lms_test_attempts
        WHERE user_id = ${String(employeeId)} AND course_id = ${String(courseId)} AND passed = true`);
      const theoryScorePct = Number(bestR[0]?.best ?? 0);

      const enrR = await exec(sql`
        SELECT status FROM enrollments
        WHERE employee_id = ${employeeId} AND course_id = ${courseId}
        ORDER BY updated_at DESC NULLS LAST LIMIT 1`);
      const practicalPassed = String(enrR[0]?.status ?? '') === 'completed';

      const topicsR = await exec(sql`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE completed = true) AS done
        FROM course_progress
        WHERE user_id = ${employeeId} AND course_id = ${courseId}`);
      const rawTotal = Number(topicsR[0]?.total ?? 0);
      const totalTopics = rawTotal > 0 ? rawTotal : 1;
      const confirmedTopics = rawTotal > 0 ? Number(topicsR[0]?.done ?? 0) : 0;

      return Ok({ theoryScorePct, passThresholdPct, practicalPassed, totalTopics, confirmedTopics });
    } catch (error: unknown) {
      this.logger.error(`getCompletionSnapshot: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * Q562: a universal course completed on ANOTHER card credits this employee.
   * lms_cross_card_credits is the canonical credit ledger (built MASSIV-100 FAZA-07).
   * A credit row means the course counts as passed for gate purposes.
   */
  async hasCrossCardCredit(employeeId: number, courseId: number): Promise<Result<boolean>> {
    try {
      if (!Number.isInteger(employeeId) || employeeId <= 0) return Err('employeeId must be a positive integer');
      if (!Number.isInteger(courseId) || courseId <= 0) return Err('courseId must be a positive integer');
      const r = await exec(sql`
        SELECT 1 FROM lms_cross_card_credits
        WHERE employee_id = ${employeeId} AND course_id = ${courseId} LIMIT 1`);
      return Ok((Array.isArray(r) ? r : []).length > 0);
    } catch (error: unknown) {
      this.logger.error(`hasCrossCardCredit: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * Q562 WRITE side (T10-10): a UNIVERSAL course completed on `sourceCardId` credits the SAME
   * course on the employee's OTHER active cards. This is the data-path the
   * {@link CourseCompletedCreditHandler} (`lms.course.completed` listener) drives.
   *
   * Gate (Q562 SHART): only courses flagged `courses.is_universal = true` replicate. A non-universal
   * course returns `{ universal: false, credited: 0 }` — NO credit, NO fabrication (Q-40). The flag
   * itself is owner-data; until the owner marks a course universal nothing replicates (honest open).
   *
   * Target cards = the employee's OTHER active cards from `employee_cards` (is_active, card_id <> source).
   * One credit row per target card, idempotent via `ON CONFLICT (course_id, employee_id, target_card_id)
   * DO NOTHING` (uq_lms_credit) — re-fired completion never duplicates. When the employee holds only the
   * one (source) card, there is nothing to credit → `{ credited: 0 }` (honest, not a fabricated row).
   *
   * NEVER touches enrollment/payroll; pure credit-ledger INSERT. `credited` counts freshly inserted rows.
   */
  async recordCrossCardCredits(
    employeeId: number,
    courseId: number,
    sourceCardId: number,
    creditedBy?: number,
  ): Promise<Result<{ universal: boolean; credited: number; targetCardIds: number[] }>> {
    try {
      if (!Number.isInteger(employeeId) || employeeId <= 0) return Err('employeeId must be a positive integer');
      if (!Number.isInteger(courseId) || courseId <= 0) return Err('courseId must be a positive integer');
      if (!Number.isInteger(sourceCardId) || sourceCardId <= 0) return Err('sourceCardId must be a positive integer');

      // Q562 SHART: only a universal course replicates its completion across cards.
      const courseR = await exec(sql`SELECT is_universal FROM courses WHERE id = ${courseId} LIMIT 1`);
      if (!courseR[0]) return Err('Course not found');
      if (courseR[0].is_universal !== true) {
        return Ok({ universal: false, credited: 0, targetCardIds: [] });
      }

      // The employee's OTHER active cards = credit targets (source card is where it was actually completed).
      const targets = await exec(sql`
        SELECT DISTINCT card_id
        FROM employee_cards
        WHERE employee_id = ${employeeId}
          AND (is_active IS NULL OR is_active = true)
          AND card_id IS NOT NULL
          AND card_id <> ${sourceCardId}`);
      const targetCardIds = (Array.isArray(targets) ? targets : [])
        .map((t) => Number(t.card_id))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (targetCardIds.length === 0) {
        // Employee holds only the source card — nothing to replicate to (honest, not fabricated).
        return Ok({ universal: true, credited: 0, targetCardIds: [] });
      }

      const creditedByVal = Number.isInteger(creditedBy) && (creditedBy as number) > 0 ? creditedBy : null;
      let credited = 0;
      for (const targetCardId of targetCardIds) {
        const r = await exec(sql`
          INSERT INTO lms_cross_card_credits
            (course_id, employee_id, source_card_id, target_card_id, credited_by, credited_at, created_at)
          VALUES (${courseId}, ${employeeId}, ${sourceCardId}, ${targetCardId}, ${creditedByVal}, NOW(), NOW())
          ON CONFLICT (course_id, employee_id, target_card_id) DO NOTHING
          RETURNING id`);
        if ((Array.isArray(r) ? r : []).length > 0) credited += 1;
      }

      return Ok({ universal: true, credited, targetCardIds });
    } catch (error: unknown) {
      this.logger.error(`recordCrossCardCredits: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findEnrollmentByUserAndCourse(userId: string, courseId: string): Promise<Result<Enrollment>> {
    try {
      const r = await exec(sql`SELECT e.*, c.title_uz AS course_title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.employee_id = ${parseInt(userId, 10)} AND e.course_id = ${parseInt(courseId, 10)} LIMIT 1`);
      if (!r[0]) return Err('Enrollment not found');
      return Ok(mapEnrollment(r[0]));
    } catch (error: unknown) {
      this.logger.error(`findEnrollmentByUserAndCourse: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findEnrollmentsByUser(userId: string, filters?: { status?: string; page?: number; limit?: number }): Promise<Result<{ items: Enrollment[]; total: number }>> {
    try {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = (page - 1) * limit;
      const [rows, countRows] = await Promise.all([
        filters?.status
          ? exec(sql`SELECT e.*, c.title_uz AS course_title, c.category, cert.expiry_date AS certificate_expires_at, cert.is_active AS cert_active FROM enrollments e JOIN courses c ON c.id = e.course_id LEFT JOIN certificates cert ON cert.employee_id = e.employee_id AND cert.course_id = e.course_id WHERE e.employee_id = ${parseInt(userId, 10)} AND e.status = ${filters.status} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT e.*, c.title_uz AS course_title, c.category, cert.expiry_date AS certificate_expires_at, cert.is_active AS cert_active FROM enrollments e JOIN courses c ON c.id = e.course_id LEFT JOIN certificates cert ON cert.employee_id = e.employee_id AND cert.course_id = e.course_id WHERE e.employee_id = ${parseInt(userId, 10)} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`),
        runQuery<{ cnt: number }>(sql`SELECT COUNT(*) AS cnt FROM enrollments WHERE employee_id = ${parseInt(userId, 10)}`),
      ]);
      return { ok: true, data: { items: (Array.isArray(rows) ? rows : []).map((row) => ({ ...mapEnrollment(row), course_title: row.course_title as string | undefined, certificate_expires_at: row.certificate_expires_at ? new Date(String(row.certificate_expires_at)) : undefined })) as Enrollment[], total: Number(countRows.rows[0]?.cnt ?? 0) } };
    } catch (error: unknown) {
      this.logger.error(`findEnrollmentsByUser: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveEnrollment(enrollment: Enrollment): Promise<Result<Enrollment>> {
    try {
      // SB0144 (03-lms-darslik): enrollments.card_id was never populated (100% NULL) — backfill it
      // from the course's card_id at enroll-time (the source-card trail cross-card credit needs,
      // see resolveEnrollmentCardTuple below). Courses with no card (universal kurs) -> stays NULL,
      // honestly (no fabricated card assignment, Q-40).
      const courseCardR = await exec(sql`SELECT card_id FROM courses WHERE id = ${parseInt(enrollment.course_id, 10)} LIMIT 1`);
      const courseCardId = courseCardR[0]?.card_id != null ? Number(courseCardR[0].card_id) : null;
      const r = await exec(sql`INSERT INTO enrollments (employee_id, course_id, status, card_id, enrolled_at, created_at, updated_at) VALUES (${parseInt(enrollment.user_id, 10)}, ${parseInt(enrollment.course_id, 10)}, ${enrollment.status ?? 'enrolled'}, ${courseCardId}, NOW(), NOW(), NOW()) ON CONFLICT (employee_id, course_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW() RETURNING *`);
      return Ok(mapEnrollment(r[0]));
    } catch (error: unknown) {
      this.logger.error(`saveEnrollment: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateEnrollment(id: string, data: Partial<Enrollment>): Promise<Result<Enrollment>> {
    try {
      const r = await exec(sql`UPDATE enrollments SET status = COALESCE(${data.status ?? null}, status), progress_percent = COALESCE(${data.score !== undefined ? Math.min(100, data.score) : null}, progress_percent), completed_at = COALESCE(${data.completed_at ?? null}, completed_at), updated_at = NOW() WHERE id = ${parseInt(id, 10)} RETURNING *`);
      if (!r[0]) return Err('Enrollment not found');
      return Ok(mapEnrollment(r[0]));
    } catch (error: unknown) {
      this.logger.error(`updateEnrollment: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * T10-10: resolve the (employeeId, courseId, cardId) tuple of one enrollment — the payload the
   * `lms.course.completed` emitter needs to drive cross-card credit. `cardId` is the source card
   * (enrollments.card_id) the universal course was completed on; null when the enrollment carries
   * no card trail (legacy/manual enrollment) — the listener then honestly no-ops.
   */
  async getEnrollmentCardContext(
    id: string,
  ): Promise<Result<{ employeeId: number; courseId: number; cardId: number | null }>> {
    try {
      const enrollmentId = parseInt(id, 10);
      if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) return Err('enrollment id must be a positive integer');
      const r = await exec(sql`
        SELECT employee_id, course_id, card_id
        FROM enrollments
        WHERE id = ${enrollmentId} LIMIT 1`);
      if (!r[0]) return Err('Enrollment not found');
      return Ok({
        employeeId: Number(r[0].employee_id),
        courseId: Number(r[0].course_id),
        cardId: r[0].card_id != null ? Number(r[0].card_id) : null,
      });
    } catch (error: unknown) {
      this.logger.error(`getEnrollmentCardContext: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async deleteCourse(id: string): Promise<Result<{ deleted: boolean }>> {
    try {
      const existing = await exec(sql`SELECT id FROM courses WHERE id = ${parseInt(id, 10)} AND (is_active IS NULL OR is_active = true) LIMIT 1`);
      if (!existing[0]) return Err('Course not found');
      await exec(sql`UPDATE courses SET is_active = false, updated_at = NOW() WHERE id = ${parseInt(id, 10)}`);
      return Ok({ deleted: true });
    } catch (error: unknown) {
      this.logger.error(`deleteCourse: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  findExpiringCertificates(d: number) { return this.certRepo.findExpiringCertificates(d) as Promise<Result<Enrollment[]>>; }
  findExpiredToFlag() { return this.certRepo.findExpiredToFlag(); }
  saveCertificate(cert: Record<string, unknown>, issuedBy?: number) { return this.certRepo.saveCertificate(cert, issuedBy); }
  findCertificatesByEmployee(empId: number) { return this.certRepo.findCertificatesByEmployee(empId); }
  checkOperatorCertForMes(empId: number, courseId: number) { return this.certRepo.checkOperatorCertForMes(empId, courseId); }
  findByOperatorAndCourse(opId: number, courseId: number) { return this.certRepo.findByOperatorAndCourse(opId, courseId); }
  findByOperatorId(opId: number) { return this.certRepo.findByOperatorId(opId); }
  findEnrollment(empId: number, courseId: number) { return this.certRepo.findEnrollment(empId, courseId); }
  saveEnrollmentLegacy(e: Record<string, unknown>) { return this.certRepo.saveEnrollmentLegacy(e as Parameters<typeof this.certRepo.saveEnrollmentLegacy>[0]); }
  saveCertificateLegacy(cert: Record<string, unknown>, issuedBy: number) { return this.certRepo.saveCertificateLegacy(cert, issuedBy); }
  updateCertificateStatus(certId: number, status: string) { return this.certRepo.updateCertificateStatus(certId, status); }
}
