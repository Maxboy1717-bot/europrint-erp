/**
 * @module integration-extended-hr.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { EMPLOYEE_RATING_EXCELLENT, EMPLOYEE_RATING_AVERAGE } from '@common/constants/business.constants';
type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class IntegrationExtendedHrRepository {
  findHrLmsPositionSkills(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT * FROM position_skill_requirements ORDER BY position_name ASC LIMIT ${MAX_QUERY_LIMIT}`));
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
      const rows = await exec(sql`SELECT (SELECT COUNT(DISTINCT employee_id) FROM employee_skills) AS employees_with_skills, (SELECT COUNT(*) FROM employee_skills) AS total_skills, (SELECT COUNT(*) FROM lms_certificates WHERE expires_at <= NOW() + interval '90 days') AS expiring_certs, (SELECT COUNT(*) FROM position_skill_requirements) AS position_skill_requirements`);
      return (rows[0] ?? {}) as Row;
    });
  }

  // NOTE (drift): employee_ratings carries two parallel column families —
  // legacy period_year/period_month (actually populated, see hr-full-seed.sql)
  // and a newer rating_year/rating_month pair added later via drift-fix
  // migration but never written by any INSERT path. COALESCE reads whichever
  // is populated so the filter keeps working regardless of which world wrote
  // the row.
  findEmployeeRatings(periodYear?: number, periodMonth?: number): Promise<Result<Row[]>> {
    return safeCall(async () =>
      periodYear && periodMonth
        ? exec(sql`SELECT er.*, e.full_name AS employee_name FROM employee_ratings er LEFT JOIN employees e ON e.id = er.employee_id WHERE COALESCE(er.period_year, er.rating_year) = ${periodYear} AND COALESCE(er.period_month, er.rating_month) = ${periodMonth} ORDER BY er.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : periodYear
        ? exec(sql`SELECT er.*, e.full_name AS employee_name FROM employee_ratings er LEFT JOIN employees e ON e.id = er.employee_id WHERE COALESCE(er.period_year, er.rating_year) = ${periodYear} ORDER BY er.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
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
      // FIX (verified live 2026-07-13): query referenced a 3rd, nonexistent
      // column `overall_score` (matches neither the legacy `composite_score`
      // 0-100 world nor the never-written `overall_rating` 0-5 world) —
      // confirmed via direct SQL: 'column "overall_score" does not exist'.
      // safeCall swallowed the error so this endpoint silently always
      // returned {} (all-zero stat cards on the Xodim Baholash page) even
      // when rating rows existed. composite_score is the actually-populated
      // field (0-100 scale, same scale as EMPLOYEE_RATING_* thresholds).
      const rows = await exec(sql`
        SELECT
          COUNT(*) AS total_ratings,
          ROUND(AVG(COALESCE(overall_rating, composite_score)), 2) AS average_score,
          COUNT(CASE WHEN COALESCE(overall_rating, composite_score) >= ${EMPLOYEE_RATING_EXCELLENT} THEN 1 END) AS high_performers,
          COUNT(CASE WHEN COALESCE(overall_rating, composite_score) < ${EMPLOYEE_RATING_AVERAGE} THEN 1 END) AS needs_improvement
        FROM employee_ratings
        WHERE COALESCE(rating_year, period_year) = EXTRACT(YEAR FROM NOW())::int
      `);
      return (rows[0] ?? {}) as Row;
    });
  }

  findVendorPerformance(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`
      SELECT
        vr.id::text                          AS id,
        mv.name                              AS vendor_name,
        EXTRACT(YEAR  FROM vr.rated_at)::int AS period_year,
        EXTRACT(MONTH FROM vr.rated_at)::int AS period_month,
        (SELECT COUNT(*)::int FROM mm_purchase_orders po
           WHERE po.vendor_id = vr.vendor_id AND po.deleted_at IS NULL) AS total_orders,
        ROUND(
          (vr.delivery_score / 100.0) *
          COALESCE((SELECT COUNT(*) FROM mm_purchase_orders po
                     WHERE po.vendor_id = vr.vendor_id AND po.deleted_at IS NULL), 0)
        )::int                               AS on_time_deliveries,
        0::int                               AS late_deliveries,
        vr.quality_score::numeric            AS quality_score,
        ROUND((vr.quality_score * 0.4 + vr.delivery_score * 0.3 + vr.price_score * 0.2), 2)
                                             AS overall_rating
      FROM mm_vendor_ratings vr
      LEFT JOIN mm_vendors mv ON mv.id = vr.vendor_id
      ORDER BY vr.rated_at DESC
      LIMIT 100
    `));
  }

  findVendorSpendAnalysis(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`
      SELECT
        mv.id::text          AS id,
        mv.name              AS "vendorName",
        COUNT(po.id)::int    AS "totalOrders",
        COALESCE(SUM(po.total_amount), 0)::numeric(15,2) AS "totalSpend",
        ROUND(COALESCE(AVG(
          mvr.quality_score  * 0.4 +
          mvr.delivery_score * 0.3 +
          mvr.price_score    * 0.2
        ), 0), 2)            AS "avgRating"
      FROM mm_vendors mv
      LEFT JOIN purchase_orders po
             ON po.vendor_id = mv.id AND po.deleted_at IS NULL
      LEFT JOIN mm_vendor_ratings mvr
             ON mvr.vendor_id = mv.id
      WHERE mv.is_active = true
      GROUP BY mv.id, mv.name
      ORDER BY "totalSpend" DESC
      LIMIT 100
    `));
  }
}
