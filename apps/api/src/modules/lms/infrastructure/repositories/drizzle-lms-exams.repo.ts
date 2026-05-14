/**
 * @module drizzle-lms-exams.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
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

  async submitExam(examId: string, userId: string, answers: unknown[]): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO lms_exam_attempts (exam_id, employee_id, answers, submitted_at, status, created_at) VALUES (${parseInt(examId, 10)}, ${parseInt(userId, 10)}, ${JSON.stringify(answers)}, NOW(), 'submitted', NOW()) RETURNING *`);
      const row = (r[0] ?? { exam_id: examId, employee_id: userId }) as Row;
      return Ok({ ...row, message: 'Imtihon topshirildi' });
    } catch (error) {
      this.logger.error(`submitExam: ${(error as Error).message}`);
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
      const rows = await exec(sql`SELECT COUNT(*) FILTER (WHERE status = 'completed') AS completed, COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress, COUNT(*) AS total, ROUND(AVG(progress_percent)) AS avg_progress FROM enrollments WHERE employee_id = ${parseInt(userId, 10)}`);
      return Ok((rows[0] ?? {}) as Row);
    } catch (error) {
      this.logger.error(`findMyProgress: ${(error as Error).message}`);
      return Ok({});
    }
  }
}
