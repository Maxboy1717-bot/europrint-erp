/**
 * @module drizzle-lms-tests.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql, eq } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { lms_tests, lms_questions } from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class LmsTestsRepository {
  private readonly logger = new Logger(LmsTestsRepository.name);

  async findAllTests(courseId?: string): Promise<Result<object[]>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT t.*, c.title_uz AS course_title FROM lms_tests t LEFT JOIN courses c ON c.id = t.course_id
        WHERE (${courseId ? parseInt(courseId, 10) : null}::int IS NULL OR t.course_id = ${courseId ? parseInt(courseId, 10) : null})
        ORDER BY t.created_at DESC
      `);
      return Ok(rows.rows as Row[]);
    } catch (error) {
      this.logger.error(`findAllTests: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findTestById(id: string): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT t.*, c.title_uz AS course_title FROM lms_tests t LEFT JOIN courses c ON c.id = t.course_id WHERE t.id = ${parseInt(id, 10)} LIMIT 1
      `);
      if (!rows.rows.length) return Err('Test topilmadi');
      return Ok(rows.rows[0] as Row);
    } catch (error) {
      this.logger.error(`findTestById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveTest(data: Row): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO lms_tests (title, course_id, passing_score, is_active, created_at)
        VALUES (${String(data.title)}, ${data.courseId ? parseInt(String(data.courseId), 10) : null}, ${data.passingScore ? parseInt(String(data.passingScore), 10) : 70}, true, NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? data) as Row);
    } catch (error) {
      this.logger.error(`saveTest: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateTest(id: string, data: Row): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE lms_tests
        SET title = COALESCE(${data.title ? String(data.title) : null}, title),
            passing_score = COALESCE(${data.passingScore ? parseInt(String(data.passingScore), 10) : null}, passing_score),
            updated_at = NOW()
        WHERE id = ${parseInt(id, 10)} RETURNING *
      `);
      if (!rows.rows.length) return Err('Test topilmadi');
      return Ok(rows.rows[0] as Row);
    } catch (error) {
      this.logger.error(`updateTest: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async deleteTest(id: string): Promise<Result<void>> {
    try {
      await db.delete(lms_tests).where(eq(lms_tests.id, parseInt(id, 10)));
      return Ok();
    } catch (error) {
      this.logger.error(`deleteTest: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAllQuestions(testId?: string): Promise<Result<object[]>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT q.* FROM lms_questions q WHERE (${testId ? parseInt(testId, 10) : null}::int IS NULL OR q.test_id = ${testId ? parseInt(testId, 10) : null}) ORDER BY q.created_at DESC
      `);
      return Ok(rows.rows as Row[]);
    } catch (error) {
      this.logger.error(`findAllQuestions: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findQuestionById(id: string): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`SELECT * FROM lms_questions WHERE id = ${parseInt(id, 10)} LIMIT 1`);
      if (!rows.rows.length) return Err('Savol topilmadi');
      return Ok(rows.rows[0] as Row);
    } catch (error) {
      this.logger.error(`findQuestionById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveQuestion(data: Row): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO lms_questions (test_id, question_text, options, correct_option, score, created_at)
        VALUES (${data.testId ? parseInt(String(data.testId), 10) : null}, ${String(data.questionText ?? data.text ?? '')}, ${JSON.stringify(data.options ?? [])}::jsonb, ${data.correctOption !== undefined ? parseInt(String(data.correctOption), 10) : 0}, ${data.score ? parseInt(String(data.score), 10) : 1}, NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? data) as Row);
    } catch (error) {
      this.logger.error(`saveQuestion: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateQuestion(id: string, data: Row): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE lms_questions
        SET question_text = COALESCE(${data.questionText ? String(data.questionText) : null}, question_text),
            options = COALESCE(${data.options ? JSON.stringify(data.options) : null}::jsonb, options),
            correct_option = COALESCE(${data.correctOption !== undefined ? parseInt(String(data.correctOption), 10) : null}, correct_option),
            updated_at = NOW()
        WHERE id = ${parseInt(id, 10)} RETURNING *
      `);
      if (!rows.rows.length) return Err('Savol topilmadi');
      return Ok(rows.rows[0] as Row);
    } catch (error) {
      this.logger.error(`updateQuestion: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async deleteQuestion(id: string): Promise<Result<void>> {
    try {
      await db.delete(lms_questions).where(eq(lms_questions.id, parseInt(id, 10)));
      return Ok();
    } catch (error) {
      this.logger.error(`deleteQuestion: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveAssignment(data: Row, userId: string): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO lms_assignments (title, course_id, description, due_date, assigned_by, created_at)
        VALUES (${String(data.title)}, ${data.courseId ? parseInt(String(data.courseId), 10) : null}, ${data.description ? String(data.description) : null}, ${data.dueDate ? String(data.dueDate) : null}, ${parseInt(userId, 10)}, NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? data) as Row);
    } catch (error) {
      this.logger.error(`saveAssignment: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAllAttempts(filters?: { status?: string; employeeId?: string; page?: number; limit?: number }): Promise<Result<{ items: unknown[]; total: number }>> {
    try {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = (page - 1) * limit;
      const statusVal = filters?.status ?? null;
      const empId = filters?.employeeId ? parseInt(filters.employeeId, 10) : null;
      const [itemsResult, countResult] = await Promise.all([
        runQuery<Row>(sql`
          SELECT a.*, c.title_uz AS course_title FROM lms_exam_attempts a
          LEFT JOIN lms_exams e ON e.id = a.exam_id LEFT JOIN courses c ON c.id = e.course_id
          WHERE (${statusVal}::text IS NULL OR a.status = ${statusVal}) AND (${empId}::int IS NULL OR a.employee_id = ${empId})
          ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}
        `),
        runQuery<{ cnt: number }>(sql`
          SELECT COUNT(*)::int AS cnt FROM lms_exam_attempts a
          WHERE (${statusVal}::text IS NULL OR a.status = ${statusVal}) AND (${empId}::int IS NULL OR a.employee_id = ${empId})
        `),
      ]);
      return Ok({ items: itemsResult.rows as Row[], total: Number(countResult.rows[0]?.cnt ?? 0) });
    } catch (error) {
      this.logger.error(`findAllAttempts: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findRetakeAttempts(): Promise<Result<object[]>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT a.*, e.title AS exam_title, emp.full_name AS employee_name
        FROM lms_exam_attempts a JOIN lms_exams e ON e.id = a.exam_id LEFT JOIN employees emp ON emp.id = a.employee_id
        WHERE a.attempt_number > 1 ORDER BY a.created_at DESC LIMIT 50
      `);
      return Ok(rows.rows as Row[]);
    } catch (error) {
      this.logger.error(`findRetakeAttempts: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }
}
