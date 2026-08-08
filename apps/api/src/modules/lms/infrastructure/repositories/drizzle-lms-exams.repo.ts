/**
 * @module drizzle-lms-exams.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { LMS_GENERAL_PASS_THRESHOLD_PCT } from '../../application/constants/lms-completion.constants';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

/** EP-LMS #3 — shape of a single auto re-teach notification row (built in the service,
 *  written by {@link LmsExamsRepository.insertReTeachNotifications}). */
export interface ReTeachNotificationRow {
  userId: number;
  type: string;
  title: string;
  body: string;
  referenceId: number | null;
  referenceType: string;
  priority: string;
}

@Injectable()
export class LmsExamsRepository {
  private readonly logger = new Logger(LmsExamsRepository.name);

  async findLesson(id: string): Promise<Result<Row>> {
    try {
      const r = await exec(sql`SELECT l.*, c.title_uz AS course_title FROM lessons l LEFT JOIN courses c ON c.id = l.course_id WHERE l.id = ${parseInt(id, 10)} LIMIT 1`);
      if (!r.length) return Err('Dars topilmadi');
      return Ok(r[0]);
    } catch (error) {
      this.logger.error(`findLesson: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAllExams(_userId?: string): Promise<Result<object[]>> {
    try {
      const r = await exec(sql`SELECT e.*, c.title_uz AS course_title FROM lms_exams e LEFT JOIN courses c ON c.id = e.course_id WHERE e.is_active = true ORDER BY e.created_at DESC`);
      return Ok(r);
    } catch (error) {
      this.logger.error(`findAllExams: ${(error as Error).message}`);
      return Ok([]);
    }
  }

  async saveExam(data: Row): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO lms_exams (title, course_id, duration_minutes, passing_score, is_active, created_at) VALUES (${String(data.title)}, ${data.courseId ? parseInt(String(data.courseId), 10) : null}, ${data.durationMinutes ? parseInt(String(data.durationMinutes), 10) : 60}, ${data.passingScore ? parseInt(String(data.passingScore), 10) : 70}, true, NOW()) RETURNING *`);
      return Ok((r[0] ?? data) as Row);
    } catch (error) {
      this.logger.error(`saveExam: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * A5: record lesson progress on the user's course enrollment (REAL write — was a
   * {success:true} green-lie). Touches the enrollment (current lesson + activity, status
   * kept >= in_progress); enrolls the user if no row exists yet. No certificate is
   * auto-issued (no fake cert) — certificateIssued=false until real completion logic exists.
   */
  async recordLessonProgress(userId: string, courseId: number, lessonId: number | null): Promise<Result<{ certificateIssued: boolean; saved: boolean }>> {
    try {
      const empId = parseInt(userId, 10);
      const upd = await exec(sql`
        UPDATE enrollments
        SET current_lesson_id = ${lessonId},
            last_accessed_at  = NOW(),
            started_at        = COALESCE(started_at, NOW()),
            status            = CASE WHEN status = 'completed' THEN 'completed' ELSE 'in_progress' END,
            updated_at        = NOW()
        WHERE employee_id = ${empId} AND course_id = ${courseId}
        RETURNING id`);
      if (!upd.length) {
        await exec(sql`
          INSERT INTO enrollments (employee_id, course_id, current_lesson_id, status, last_accessed_at, started_at)
          VALUES (${empId}, ${courseId}, ${lessonId}, 'in_progress', NOW(), NOW())`);
      }
      return Ok({ certificateIssued: false, saved: true });
    } catch (error) {
      this.logger.error(`recordLessonProgress: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * submitExam — persists the exam attempt with:
   *  - user_id (INTEGER NOT NULL — was missing, caused 23502 every call)
   *  - score   (computed from answers vs correct_option)
   *  - passed  (score >= exam.passing_score)
   * Columns confirmed in DB: lms_exam_attempts.user_id, .score, .passed,
   *   lms_exam_questions.correct_option, lms_exams.passing_score.
   */
  async submitExam(
    examId: string,
    userId: string,
    answers: Array<{ questionId: number; selectedOption: number }>,
  ): Promise<Result<Row>> {
    try {
      const examIdInt = parseInt(examId, 10);
      const userIdInt = parseInt(userId, 10);

      // 1. Fetch exam to get passing_score
      const exams = await exec(sql`SELECT id, passing_score FROM lms_exams WHERE id = ${examIdInt} LIMIT 1`);
      if (!exams.length) return Err('Imtihon topilmadi');
      const passingScore = Number(exams[0].passing_score ?? LMS_GENERAL_PASS_THRESHOLD_PCT);

      // 2. Fetch questions to grade answers
      const questions = await exec(sql`
        SELECT id, correct_option FROM lms_exam_questions
        WHERE exam_id = ${examIdInt}
        ORDER BY order_index
      `);

      // 3. Compute score (0–100) and passed flag
      let scoreVal = 0;
      let passedVal = false;
      if (questions.length > 0 && Array.isArray(answers) && answers.length > 0) {
        const correctCount = answers.filter(a =>
          questions.find(q => Number(q.id) === a.questionId)
            ?.correct_option === a.selectedOption
        ).length;
        scoreVal = Math.round((correctCount / questions.length) * 100);
        passedVal = scoreVal >= passingScore;
      }

      // 4. INSERT with all required columns (user_id, score, passed)
      const r = await exec(sql`
        INSERT INTO lms_exam_attempts
          (exam_id, user_id, employee_id, answers, submitted_at, status, score, passed, created_at)
        VALUES
          (${examIdInt}, ${userIdInt}, ${String(userIdInt)},
           ${JSON.stringify(answers)},
           NOW(), 'submitted',
           ${scoreVal}, ${passedVal},
           NOW())
        RETURNING *
      `);
      const row = (r[0] ?? { exam_id: examIdInt, user_id: userIdInt }) as Row;
      return Ok({ ...row, message: 'Imtihon topshirildi' });
    } catch (error) {
      this.logger.error(`submitExam: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * submitAttemptById — grades and persists an existing in-progress attempt.
   * Called by LmsExamsService.submitExam(attemptId, userId):
   *  1. Looks up exam_id from lms_exam_attempts WHERE id = attemptId
   *  2. Grades answers vs lms_exam_questions.correct_option
   *  3. UPDATEs the existing row: score, passed, submitted_at, status='submitted'
   * Columns confirmed in DB: lms_exam_attempts(exam_id,user_id,score,passed,submitted_at,status,answers),
   *   lms_exam_questions(correct_option,exam_id), lms_exams(passing_score).
   */
  async submitAttemptById(
    attemptId: number,
    userId: number,
    answers: Array<{ questionId: number; selectedOption: number }>,
  ): Promise<Result<Row>> {
    try {
      // 1. Find existing attempt and its exam_id
      const attempts = await exec(sql`
        SELECT id, exam_id, status FROM lms_exam_attempts
        WHERE id = ${attemptId} AND user_id = ${userId}
        LIMIT 1
      `);
      if (!attempts.length) return Err('Urinish topilmadi');
      const attempt = attempts[0];
      if (attempt.status === 'submitted') return Err('Urinish allaqachon topshirilgan');
      const examIdInt = Number(attempt.exam_id);

      // 2. Fetch exam to get passing_score
      const exams = await exec(sql`
        SELECT id, passing_score FROM lms_exams WHERE id = ${examIdInt} LIMIT 1
      `);
      if (!exams.length) return Err('Imtihon topilmadi');
      const passingScore = Number(exams[0].passing_score ?? LMS_GENERAL_PASS_THRESHOLD_PCT);

      // 3. Fetch questions to grade
      const questions = await exec(sql`
        SELECT id, correct_option FROM lms_exam_questions
        WHERE exam_id = ${examIdInt}
        ORDER BY order_index
      `);

      // 4. Compute score (0–100) and passed flag
      let scoreVal = 0;
      let passedVal = false;
      if (questions.length > 0 && Array.isArray(answers) && answers.length > 0) {
        const correctCount = answers.filter(a =>
          questions.find(q => Number(q.id) === a.questionId)
            ?.correct_option === a.selectedOption
        ).length;
        scoreVal = Math.round((correctCount / questions.length) * 100);
        passedVal = scoreVal >= passingScore;
      }

      // 5. UPDATE existing attempt row (do NOT insert a duplicate)
      const r = await exec(sql`
        UPDATE lms_exam_attempts
        SET answers       = ${JSON.stringify(answers)}::jsonb,
            score         = ${scoreVal},
            passed        = ${passedVal},
            submitted_at  = NOW(),
            status        = 'submitted'
        WHERE id = ${attemptId}
        RETURNING *
      `);
      const row = (r[0] ?? { id: attemptId, exam_id: examIdInt, user_id: userId }) as Row;
      return Ok({ ...row, message: 'Imtihon topshirildi' });
    } catch (error) {
      this.logger.error(`submitAttemptById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /** Returns questions (without correct_option) for a given exam — used by FE exam UI. */
  async findExamQuestions(examId: string): Promise<Result<object[]>> {
    try {
      const r = await exec(sql`
        SELECT id, question_text, options, order_index
        FROM lms_exam_questions
        WHERE exam_id = ${parseInt(examId, 10)}
        ORDER BY order_index
      `);
      return Ok(r);
    } catch (error) {
      this.logger.error(`findExamQuestions: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findRecentActivity(userId: string): Promise<Result<object[]>> {
    try {
      const r = await exec(sql`SELECT e.id, c.title_uz AS course_title, e.status, e.progress_percent, e.updated_at AS last_activity FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.employee_id = ${parseInt(userId, 10)} ORDER BY e.updated_at DESC LIMIT 10`);
      return Ok(r);
    } catch (error) {
      this.logger.error(`findRecentActivity: ${(error as Error).message}`);
      return Ok([]);
    }
  }

  /**
   * findLeaderboard — top performers ranked by completed courses then avg score.
   * Tables: enrollments (employee_id, status, score), employees (id, full_name, first_name, last_name),
   *         certificates (employee_id, id).
   * No DDL required — all columns confirmed in information_schema.
   */
  async findLeaderboard(): Promise<Result<object[]>> {
    try {
      const r = await exec(sql`
        SELECT
          e.employee_id                                                                         AS "userId",
          COALESCE(emp.full_name, emp.first_name || ' ' || emp.last_name)                      AS "fullName",
          COUNT(*)           FILTER (WHERE e.status = 'completed')::integer                    AS "completedCourses",
          COUNT(*)::integer                                                                     AS "totalCourses",
          COALESCE(ROUND(AVG(e.score) FILTER (WHERE e.score IS NOT NULL)), 0)::integer         AS "avgScore",
          COUNT(DISTINCT cert.id)::integer                                                     AS "certificatesEarned"
        FROM enrollments e
        JOIN employees emp ON emp.id = e.employee_id
        LEFT JOIN certificates cert ON cert.employee_id = e.employee_id
        GROUP BY e.employee_id, emp.full_name, emp.first_name, emp.last_name
        ORDER BY "completedCourses" DESC, "avgScore" DESC
        LIMIT 20
      `);
      return Ok(r);
    } catch (error) {
      this.logger.error(`findLeaderboard: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findMyProgress(userId: string): Promise<Result<Row>> {
    try {
      // LEFT JOIN lms_exam_attempts so exam stats (passed/failed) are included.
      // lms_exam_attempts.employee_id is TEXT, enrollments.employee_id is INT — cast required.
      // Field names match LmsProgress interface expected by LMSDashboard.tsx (line 30).
      const rows = await exec(sql`
        SELECT
          COUNT(*)              FILTER (WHERE e.status = 'completed')                    AS "completedCourses",
          COUNT(*)                                                                        AS "totalCourses",
          COALESCE(ROUND(AVG(e.progress_percent)), 0)                                   AS "averageScore",
          COUNT(a.id)           FILTER (WHERE a.passed = true)                           AS "examsPassed",
          COUNT(a.id)           FILTER (WHERE a.passed = false AND a.status = 'submitted') AS "examsFailed"
        FROM enrollments e
        LEFT JOIN lms_exam_attempts a ON a.employee_id::integer = e.employee_id
        WHERE e.employee_id = ${parseInt(userId, 10)}
      `);
      return Ok((rows[0] ?? {}) as Row);
    } catch (error) {
      this.logger.error(`findMyProgress: ${(error as Error).message}`);
      return Ok({});
    }
  }

  /**
   * EP-LMS #3 — count FAILED (graded + submitted) attempts on one exam by one user.
   * user_id = users.id (JWT), matching lms_exam_attempts.user_id. Triggers auto
   * re-teach once the count reaches LMS_AUTO_RETEACH_FAIL_THRESHOLD.
   */
  async countFailedSubmittedAttempts(examId: number, userId: number): Promise<Result<number>> {
    try {
      const r = await exec(sql`
        SELECT COUNT(*)::int AS n
        FROM lms_exam_attempts
        WHERE exam_id = ${examId}
          AND user_id = ${userId}
          AND status = 'submitted'
          AND passed = false
      `);
      return Ok(Number(r[0]?.n ?? 0));
    } catch (error) {
      this.logger.error(`countFailedSubmittedAttempts: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * EP-LMS #3 — reopen the exam's-course enrollment for auto re-study (status -> in_progress).
   * enrollments.employee_id is an employees.id, NOT a users.id, so map users.id -> employees.id
   * via employees.user_id. Idempotent: only rows not already in_progress are touched (RETURNING
   * then signals a real reopen). Reopens even a 'completed' enrollment — a repeated exam failure
   * means certification is lost and the course must be re-studied.
   */
  async reopenEnrollmentForExam(
    examId: number,
    userId: number,
  ): Promise<Result<{ courseId: number | null; reopened: boolean }>> {
    try {
      const courseRows = await exec(sql`SELECT course_id FROM lms_exams WHERE id = ${examId} LIMIT 1`);
      const courseId = courseRows.length ? Number(courseRows[0].course_id) : null;
      if (courseId === null || !Number.isInteger(courseId)) return Ok({ courseId: null, reopened: false });
      const upd = await exec(sql`
        UPDATE enrollments
        SET status = 'in_progress', updated_at = NOW()
        WHERE course_id = ${courseId}
          AND employee_id = (SELECT id FROM employees WHERE user_id = ${userId} LIMIT 1)
          AND status IS DISTINCT FROM 'in_progress'
        RETURNING id
      `);
      return Ok({ courseId, reopened: upd.length > 0 });
    } catch (error) {
      this.logger.error(`reopenEnrollmentForExam: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * EP-LMS #3 — resolve auto re-teach alert recipients: the failing user's active card
   * mentors (lms_card_mentors via users.card_id; course-scoped OR global) plus every HR
   * manager (users.role = 'HR_MANAGER', matched case-insensitively — role is stored lowercase).
   */
  async findReTeachRecipients(
    examId: number,
    userId: number,
  ): Promise<Result<{ mentorIds: number[]; hrIds: number[] }>> {
    try {
      const mentors = await exec(sql`
        SELECT DISTINCT m.mentor_user_id AS uid
        FROM lms_card_mentors m
        JOIN users u ON u.card_id = m.card_id
        WHERE u.id = ${userId}
          AND m.is_active = true
          AND (m.course_id IS NULL OR m.course_id = (SELECT course_id FROM lms_exams WHERE id = ${examId}))
      `);
      const hr = await exec(sql`SELECT id AS uid FROM users WHERE UPPER(role) = 'HR_MANAGER'`);
      const mentorIds = mentors.map(x => Number(x.uid)).filter(n => Number.isInteger(n) && n > 0);
      const hrIds = hr.map(x => Number(x.uid)).filter(n => Number.isInteger(n) && n > 0);
      return Ok({ mentorIds, hrIds });
    } catch (error) {
      this.logger.error(`findReTeachRecipients: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * EP-LMS #3 — single multi-row INSERT of auto re-teach notifications. Mirrors the
   * rasporyazhenie-escalation.cron column set (user_id/type/title/body/is_read NOT NULL,
   * reference_id/reference_type/priority optional). No-op on empty input.
   */
  async insertReTeachNotifications(rows: ReTeachNotificationRow[]): Promise<Result<number>> {
    try {
      if (!Array.isArray(rows) || rows.length === 0) return Ok(0);
      const values = rows.map(r => sql`(${r.userId}, ${r.type}, ${r.title}, ${r.body}, false, ${r.referenceId}, ${r.referenceType}, ${r.priority}, NOW())`);
      await exec(sql`
        INSERT INTO notifications
          (user_id, type, title, body, is_read, reference_id, reference_type, priority, created_at)
        VALUES ${sql.join(values, sql`, `)}
      `);
      return Ok(rows.length);
    } catch (error) {
      this.logger.error(`insertReTeachNotifications: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }
}
