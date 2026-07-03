/**
 * @module hr-dashboard-extra.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (HR)
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { HR_SALARY_MEDIUM_UZS } from '@common/constants/app.constants';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import {
  safety_incidents, offboarding_cases, employee_contracts, hrEmployees,
  ppe_compliance, safety_training_records,
} from '@shared/db';
import type { IHrDashboardExtraRepo, SafetyKpis } from '../../domain/repositories/i-hr-dashboard-extra.repo';

type Row = Record<string, unknown>;

@Injectable()
export class HrDashboardExtraRepository implements IHrDashboardExtraRepo {
  async getResignationStats(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT COALESCE(dismissal_type, 'other') AS reason, COUNT(*) AS count
        FROM offboarding_cases
        GROUP BY dismissal_type
        ORDER BY count DESC
        LIMIT 10
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getRiskScores(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
               COALESCE(primary_org.dept_name, '') AS org_department_name,
               COALESCE(primary_org.pos_name, '')  AS org_position_name,
               e.base_salary,
               CASE WHEN e.base_salary IS NULL THEN 'high'
                    WHEN e.base_salary::numeric < ${HR_SALARY_MEDIUM_UZS} THEN 'medium'
                    ELSE 'low' END AS risk_level,
               CASE WHEN e.base_salary IS NULL THEN 30
                    WHEN e.base_salary::numeric < ${HR_SALARY_MEDIUM_UZS} THEN 50
                    ELSE 80 END AS overall_score
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT od.name AS dept_name, COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC LIMIT 1
        ) primary_org ON true
        WHERE e.status = 'active'
        LIMIT 100
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getSafetySummary(): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await db.select({
        this_month: sql<number>`COUNT(*) FILTER (WHERE ${safety_incidents.created_at} >= DATE_TRUNC('month', NOW()))`,
        open_count: sql<number>`COUNT(*) FILTER (WHERE ${safety_incidents.status} = 'open')`,
      }).from(safety_incidents);
      return (r[0] ?? { this_month: 0, open_count: 0 }) as Row;
      }, 'DB_ERROR');
  }

  async getSafetyIncidents(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(safety_incidents)
        .orderBy(sql`${safety_incidents.created_at} DESC`)
        .limit(50);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getOffboardingStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await db.select({
        active:    sql<number>`COUNT(*) FILTER (WHERE ${offboarding_cases.status} = 'active')`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${offboarding_cases.status} = 'completed')`,
        cancelled: sql<number>`COUNT(*) FILTER (WHERE ${offboarding_cases.status} = 'cancelled')`,
        total:     sql<number>`COUNT(*)`,
      }).from(offboarding_cases);
      return (r[0] ?? { active: 0, completed: 0, cancelled: 0, total: 0 }) as Row;
      }, 'DB_ERROR');
  }

  async getContractsExpiring(days: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT ec.id, ec.employee_id,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
               COALESCE(ec.contract_number, 'KON-' || ec.id::text) AS contract_number,
               ec.end_date, ec.contract_type,
               (ec.end_date::date - CURRENT_DATE) AS days_left
        FROM employee_contracts ec
        JOIN employees e ON e.id = ec.employee_id
        WHERE ec.end_date BETWEEN NOW()::date AND (NOW() + (${days} || ' days')::interval)::date
        ORDER BY ec.end_date
        LIMIT 50
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getContracts(page: number, limit: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const offset = (page - 1) * limit;
      const rows = await runQuery<Row>(sql`
        SELECT ec.id, ec.employee_id,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
               COALESCE(ec.contract_number, 'KON-' || ec.id::text) AS contract_number,
               ec.contract_type, ec.start_date, ec.end_date, ec.status,
               (ec.end_date::date - CURRENT_DATE) AS days_left
        FROM employee_contracts ec
        JOIN employees e ON e.id = ec.employee_id
        ORDER BY ec.end_date DESC NULLS LAST
        LIMIT ${limit} OFFSET ${offset}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getSafetyKpis(): Promise<Result<SafetyKpis>> {
    return safeCall(async () => {
      const [ppeResult, trainingResult] = await Promise.all([
        db.select({
          ppeCompliancePercent: sql<number>`
            ROUND(
              COUNT(*) FILTER (WHERE ${ppe_compliance.is_compliant} = true)::numeric
              / NULLIF(COUNT(*), 0) * 100,
              1
            )
          `,
        }).from(ppe_compliance),
        db.select({
          expiringTrainings: sql<number>`
            COUNT(*) FILTER (
              WHERE ${safety_training_records.expiry_date} BETWEEN CURRENT_DATE
                AND CURRENT_DATE + INTERVAL '30 days'
            )
          `,
        }).from(safety_training_records),
      ]);
      return {
        ppeCompliancePercent: Number(ppeResult[0]?.ppeCompliancePercent ?? 0),
        expiringTrainings:    Number(trainingResult[0]?.expiringTrainings ?? 0),
      };
    }, 'DB_ERROR');
  }
}
