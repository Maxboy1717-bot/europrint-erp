/**
 * @module export.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

function escapeCsv(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCsv(headers: string[], rows: Row[]): string {
  return [headers.join(','), (Array.isArray(rows) ? rows : []).map(r => headers.map(h => escapeCsv(r[h])).join(','))].join('\n');
}

export interface HrStatsRow { total: string; active: string; present: string; depts: { name: string; cnt: string }[] }

@Injectable()
export class ExportRepository {
  async queryEmployeesCsv(): Promise<Result<string>> {
    
    return safeCall(async () => {
      const r = await exec(sql`SELECT e.employee_code, TRIM(COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')) AS full_name, COALESCE(e.email_work, e.email_personal, '') AS email, COALESCE(primary_org.dept_name, '') AS department, COALESCE(primary_org.pos_name, '') AS position, e.hire_date::text, e.status FROM employees e LEFT JOIN users u_org ON u_org.employee_id = e.id AND u_org.deleted_at IS NULL LEFT JOIN LATERAL (SELECT od.name AS dept_name, COALESCE(of2.position_name, '') AS pos_name FROM employee_org_departments eod JOIN org_departments od ON od.id = eod.org_department_id LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id WHERE eod.user_id = u_org.id AND eod.is_primary = true ORDER BY eod.assigned_at DESC LIMIT 1) primary_org ON true ORDER BY primary_org.dept_name NULLS LAST, full_name`);
      return toCsv(['employee_code','full_name','email','department','position','hire_date','status'], r);
    }, 'DB_ERROR');
  }

  async queryAttendanceCsv(): Promise<Result<string>> {
    
    return safeCall(async () => {
      const r = await exec(sql`SELECT TRIM(COALESCE(emp.first_name, '') || ' ' || COALESCE(emp.last_name, '')) AS full_name, COALESCE(a_org.dept_name, '') AS department, DATE(a.check_in)::text AS date, a.check_in::text, a.check_out::text, a.status, a.work_hours::text FROM attendance a LEFT JOIN employees emp ON emp.id = a.employee_id LEFT JOIN users u_org ON u_org.employee_id = emp.id AND u_org.deleted_at IS NULL LEFT JOIN LATERAL (SELECT od.name AS dept_name FROM employee_org_departments eod JOIN org_departments od ON od.id = eod.org_department_id WHERE eod.user_id = u_org.id AND eod.is_primary = true ORDER BY eod.assigned_at DESC LIMIT 1) a_org ON true WHERE a.check_in >= NOW() - INTERVAL '30 days' ORDER BY date DESC, full_name`);
      return toCsv(['full_name','department','date','check_in','check_out','status','work_hours'], r);
    }, 'DB_ERROR');
  }

  async queryDisciplineCsv(): Promise<Result<string>> {
    
    return safeCall(async () => {
      const r = await exec(sql`SELECT (u.first_name || ' ' || u.last_name) AS full_name, d.name AS department, di.type, di.reason, di.date::text, di.status, di.resolved_at::text FROM disciplinary_actions di LEFT JOIN employees emp ON emp.id = di.employee_id LEFT JOIN users u ON u.id = emp.user_id LEFT JOIN departments d ON d.id = emp.department_id ORDER BY di.date DESC`);
      return toCsv(['full_name','department','type','reason','date','status','resolved_at'], r);
    }, 'DB_ERROR');
  }

  async queryHrStats(): Promise<Result<HrStatsRow>> {
    
    return safeCall(async () => {
      const [empR, attR, depR] = await Promise.all([
        exec(sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active=true) AS active FROM employees`),
        exec(sql`SELECT COUNT(DISTINCT employee_id) AS present FROM attendance WHERE DATE(check_in) = CURRENT_DATE`),
        exec(sql`SELECT od.name AS name, COUNT(eod.user_id) AS cnt FROM org_departments od LEFT JOIN employee_org_departments eod ON eod.org_department_id = od.id AND eod.is_primary = true GROUP BY od.id, od.name ORDER BY cnt DESC LIMIT 8`),
      ]);
      const emp = empR[0] ?? {};
      const att = attR[0] ?? {};
      return { total: String(emp.total ?? '0'), active: String(emp.active ?? '0'), present: String(att.present ?? '0'), depts: (Array.isArray(depR) ? depR : []).map(r => ({ name: String(r.name ?? ''), cnt: String(r.cnt ?? '0') })) };
    }, 'DB_ERROR');
  }

  async queryHrExcel(): Promise<Result<string>> {
    
    return safeCall(async () => {
      const r = await exec(sql`SELECT od.name AS department, COUNT(DISTINCT eod.user_id) AS total_employees, COUNT(DISTINCT eod.user_id) FILTER (WHERE e.status = 'active') AS active, AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)))::numeric AS avg_tenure_years FROM org_departments od LEFT JOIN employee_org_departments eod ON eod.org_department_id = od.id AND eod.is_primary = true LEFT JOIN users u ON u.id = eod.user_id AND u.deleted_at IS NULL LEFT JOIN employees e ON e.id = u.employee_id GROUP BY od.id, od.name ORDER BY total_employees DESC`);
      return toCsv(['department','total_employees','active','avg_tenure_years'], r);
    }, 'DB_ERROR');
  }
}
