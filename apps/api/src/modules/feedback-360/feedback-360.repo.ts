/**
 * @module feedback-360.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class Feedback360Repository {
  private readonly logger = new Logger(Feedback360Repository.name);

  async findAssessments(employeeId?: number, year?: number, limit = 50, offset = 0) {
    return safeCall(async () =>
      employeeId && year
        ? exec(sql`SELECT * FROM employee_360_assessments WHERE employee_id = ${employeeId} AND assessment_year = ${year} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : employeeId
        ? exec(sql`SELECT * FROM employee_360_assessments WHERE employee_id = ${employeeId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : year
        ? exec(sql`SELECT * FROM employee_360_assessments WHERE assessment_year = ${year} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT * FROM employee_360_assessments ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    );
  }

  async findResponses(assessmentId?: number, limit = 50, offset = 0) {
    return safeCall(async () =>
      assessmentId
        ? exec(sql`SELECT * FROM employee_360_responses WHERE assessment_id = ${assessmentId} ORDER BY submitted_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT * FROM employee_360_responses ORDER BY submitted_at DESC LIMIT ${limit} OFFSET ${offset}`)
    );
  }

  async getDashboardStats() {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT (SELECT COUNT(*) FROM employee_360_assessments) AS total_assessments, (SELECT COUNT(*) FROM employee_360_assessments WHERE status = 'completed') AS completed, (SELECT COUNT(*) FROM employee_360_assessments WHERE status = 'draft') AS draft, (SELECT COALESCE(AVG(average_rating), 0) FROM employee_360_assessments WHERE status = 'completed') AS avg_rating, (SELECT COUNT(*) FROM employee_360_responses) AS total_responses`);
      return (rows[0] ?? {}) as Row;
    });
  }
}
