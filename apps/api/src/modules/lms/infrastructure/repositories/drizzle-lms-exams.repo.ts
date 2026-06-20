/**
 * @module drizzle-lms-exams.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

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
      const passingScore = Number(exams[0].passing_score ?? 70);

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
}
