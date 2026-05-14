/**
 * @module integration-extended-hr.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class IntegrationExtendedHrRepository {
  findHrLmsPositionSkills(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT * FROM position_skills ORDER BY position_title ASC LIMIT ${MAX_QUERY_LIMIT}`));
  }

  findHrLmsEmployeeSkills(): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`SELECT es.*, e.full_name AS employee_name FROM employee_skills es LEFT JOIN employees e ON e.id = es.employee_id ORDER BY es.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
    );
  }

  findHrLmsExpiringCertifications(): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`SELECT lc.*, e.full_name AS employee_name FROM lms_certificates lc LEFT JOIN employees e ON e.id = lc.employee_id WHERE lc.expires_at IS NOT NULL AND lc.expires_at <= NOW() + interval '90 days' ORDER BY lc.expires_at ASC LIMIT 100`)
    );
  }

  getHrLmsStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT (SELECT COUNT(DISTINCT employee_id) FROM employee_skills) AS employees_with_skills, (SELECT COUNT(*) FROM employee_skills) AS total_skills, (SELECT COUNT(*) FROM lms_certificates WHERE expires_at <= NOW() + interval '90 days') AS expiring_certs, (SELECT COUNT(*) FROM position_skills) AS position_skill_requirements`);
      return (rows[0] ?? {}) as Row;
    });
  }

  findEmployeeRatings(periodYear?: number, periodMonth?: number): Promise<Result<Row[]>> {
    return safeCall(async () =>
      periodYear && periodMonth
        ? exec(sql`SELECT er.*, e.full_name AS employee_name FROM employee_ratings er LEFT JOIN employees e ON e.id = er.employee_id WHERE period_year = ${periodYear} AND period_month = ${periodMonth} ORDER BY er.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : periodYear
        ? exec(sql`SELECT er.*, e.full_name AS employee_name FROM employee_ratings er LEFT JOIN employees e ON e.id = er.employee_id WHERE period_year = ${periodYear} ORDER BY er.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT er.*, e.full_name AS employee_name FROM employee_ratings er LEFT JOIN employees e ON e.id = er.employee_id ORDER BY er.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
    );
  }

  findEmployeeRatingGoals(): Promise<Result<Row[]>> {
    return safeCall(async () =>
      exec(sql`SELECT erg.*, e.full_name AS employee_name FROM employee_rating_goals erg LEFT JOIN employees e ON e.id = erg.employee_id ORDER BY erg.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
    );
  }

  getEmployeeRatingStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT COUNT(*) AS total_ratings, ROUND(AVG(overall_score), 2) AS average_score, COUNT(CASE WHEN overall_score >= 4 THEN 1 END) AS high_performers, COUNT(CASE WHEN overall_score < 2.5 THEN 1 END) AS needs_improvement FROM employee_ratings WHERE period_year = EXTRACT(YEAR FROM NOW())::int`);
      return (rows[0] ?? {}) as Row;
    });
  }

  findVendorPerformance(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT * FROM vendor_performance ORDER BY overall_score DESC LIMIT 100`));
  }

  findVendorSpendAnalysis(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT * FROM vendor_spend_analysis ORDER BY total_spend DESC LIMIT 100`));
  }
}
