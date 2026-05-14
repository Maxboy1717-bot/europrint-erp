/**
 * @module export.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
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
      const r = await exec(sql`SELECT e.employee_code, (u.first_name || ' ' || u.last_name) AS full_name, u.email, d.name AS department, p.title AS position, e.hire_date::text, e.is_active, e.status FROM employees e LEFT JOIN users u ON u.id = e.user_id LEFT JOIN departments d ON d.id = e.department_id LEFT JOIN positions p ON p.id = e.position_id ORDER BY d.name, full_name`);
      return toCsv(['employee_code','full_name','email','department','position','hire_date','is_active','status'], r);
    }, 'DB_ERROR');
  }

  async queryAttendanceCsv(): Promise<Result<string>> {
    
    return safeCall(async () => {
      const r = await exec(sql`SELECT (u.first_name || ' ' || u.last_name) AS full_name, d.name AS department, DATE(a.check_in)::text AS date, a.check_in::text, a.check_out::text, a.status, a.work_hours::text FROM attendance a LEFT JOIN employees emp ON emp.id = a.employee_id LEFT JOIN users u ON u.id = emp.user_id LEFT JOIN departments d ON d.id = emp.department_id WHERE a.check_in >= NOW() - INTERVAL '30 days' ORDER BY date DESC, full_name`);
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
        exec(sql`SELECT d.name, COUNT(e.id) AS cnt FROM departments d LEFT JOIN employees e ON e.department_id = d.id GROUP BY d.name ORDER BY cnt DESC LIMIT 8`),
      ]);
      const emp = empR[0] ?? {};
      const att = attR[0] ?? {};
      return { total: String(emp.total ?? '0'), active: String(emp.active ?? '0'), present: String(att.present ?? '0'), depts: (Array.isArray(depR) ? depR : []).map(r => ({ name: String(r.name ?? ''), cnt: String(r.cnt ?? '0') })) };
    }, 'DB_ERROR');
  }

  async queryHrExcel(): Promise<Result<string>> {
    
    return safeCall(async () => {
      const r = await exec(sql`SELECT d.name AS department, COUNT(e.id) AS total_employees, COUNT(e.id) FILTER (WHERE e.is_active=true) AS active, AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)))::numeric AS avg_tenure_years FROM departments d LEFT JOIN employees e ON e.department_id = d.id GROUP BY d.name ORDER BY total_employees DESC`);
      return toCsv(['department','total_employees','active','avg_tenure_years'], r);
    }, 'DB_ERROR');
  }
}
