/**
 * @module employee-kpi-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class EmployeeKpiCompatService {

  async getKpis(employeeId?: string, month?: string, limit = '50'): Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
    const lim = Math.min(si(limit, 50), MAX_QUERY_LIMIT);
    const empFilter = employeeId ? sql`AND dk.employee_id = ${si(employeeId)}` : sql``;
    const monthFilter = month ? sql`AND TO_CHAR(dk.kpi_date, 'YYYY-MM') = ${month}` : sql``;
    const r = await rawSql(sql`
      SELECT dk.id, dk.employee_id, dk.kpi_date, dk.attendance_score,
             dk.quality_score, dk.task_completion_score, dk.total_score,
             dk.attendance_status, dk.notes,
             e.first_name || ' ' || e.last_name AS employee_name,
             d.name AS department_name
      FROM employee_daily_kpi dk
      LEFT JOIN employees e ON e.id = dk.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE true ${empFilter} ${monthFilter}
      ORDER BY dk.kpi_date DESC, dk.total_score DESC LIMIT ${lim}
    `);
    return dbRows(r);
  
    });}

  async createKpi(body: Record<string, unknown>){
    return safeCall(async () => {
    const { employee_id, kpi_date, attendance_score, quality_score, task_completion_score, total_score, notes } = body;
    if (!employee_id || !kpi_date) throw new BadRequestException('employee_id va kpi_date majburiy');
    const r = await rawSql(sql`
      INSERT INTO employee_daily_kpi
        (employee_id, kpi_date, attendance_score, quality_score, task_completion_score, total_score, notes)
      VALUES (${employee_id ?? null}, ${kpi_date ?? null},
              ${attendance_score ?? 0}, ${quality_score ?? 0},
              ${task_completion_score ?? 0}, ${total_score ?? 0}, ${notes ?? null})
      ON CONFLICT (employee_id, kpi_date) DO UPDATE SET
        attendance_score = EXCLUDED.attendance_score,
        quality_score = EXCLUDED.quality_score,
        task_completion_score = EXCLUDED.task_completion_score,
        total_score = EXCLUDED.total_score, notes = EXCLUDED.notes
      RETURNING *
    `);
    const created = dbRows(r)[0];
    return created;
  
    });}

  async getTopPerformers(limit = '10', period?: string){
    return safeCall(async () => {
    const lim = Math.min(si(limit, 10), 50);
    const periodFilter = period ? sql`AND TO_CHAR(dk.kpi_date, 'YYYY-MM') = ${period}` : sql``;
    const r = await rawSql(sql`
      SELECT e.id, e.first_name || ' ' || e.last_name AS employee_name,
             d.name AS department_name, COALESCE(p.name, p.name_uz) AS position_name,
             ROUND(AVG(dk.total_score)::numeric, 2) AS avg_score,
             COUNT(dk.id) AS kpi_count
      FROM employee_daily_kpi dk
      JOIN employees e ON e.id = dk.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN positions p ON p.id = e.position_id
      WHERE true ${periodFilter}
      GROUP BY e.id, e.first_name, e.last_name, d.name, p.name, p.name_uz
      ORDER BY avg_score DESC LIMIT ${lim}
    `);
    return dbRows(r);
  
    });}

  async getDepartmentSummary(departmentId?: string){
    return safeCall(async () => {
    const deptFilter = departmentId ? sql`AND d.id = ${si(departmentId)}` : sql``;
    const r = await rawSql(sql`
      SELECT d.id AS department_id, d.name AS department_name,
             ROUND(AVG(dk.total_score)::numeric, 2) AS avg_score,
             COUNT(DISTINCT dk.employee_id) AS employee_count, COUNT(dk.id) AS record_count
      FROM employee_daily_kpi dk
      JOIN employees e ON e.id = dk.employee_id
      JOIN departments d ON d.id = e.department_id
      WHERE dk.kpi_date >= NOW() - INTERVAL '30 days' ${deptFilter}
      GROUP BY d.id, d.name ORDER BY avg_score DESC
    `);
    return dbRows(r);
  
    });}

  async getKpi(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT dk.*, e.first_name || ' ' || e.last_name AS employee_name
      FROM employee_daily_kpi dk
      LEFT JOIN employees e ON e.id = dk.employee_id
      WHERE dk.id = ${si(id)}
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async updateKpi(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const { attendance_score, quality_score, task_completion_score, total_score, notes } = body;
    const r = await rawSql(sql`
      UPDATE employee_daily_kpi
      SET attendance_score = COALESCE(${attendance_score ?? null}, attendance_score),
          quality_score = COALESCE(${quality_score ?? null}, quality_score),
          task_completion_score = COALESCE(${task_completion_score ?? null}, task_completion_score),
          total_score = COALESCE(${total_score ?? null}, total_score),
          notes = COALESCE(${notes ?? null}, notes)
      WHERE id = ${si(id)} RETURNING *
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async deleteKpi(id: string){
    return safeCall(async () => {
    await rawSql(sql`DELETE FROM employee_daily_kpi WHERE id = ${si(id)}`);
    return { ok: true, deleted: true };
  
    });}

  async getZoneHistory(employeeId: string, from?: string, to?: string){
    return safeCall(async () => {
    const empId = si(employeeId);
    const fromFilter = from ? sql`AND dk.kpi_date >= ${from}::date` : sql``;
    const toFilter = to ? sql`AND dk.kpi_date <= ${to}::date` : sql``;
    const r = await rawSql(sql`
      SELECT dk.kpi_date AS date, dk.attendance_status, dk.work_start, dk.work_end,
             dk.hours_worked, dk.kpi_score, e.first_name || ' ' || e.last_name AS employee_name
      FROM employee_daily_kpi dk
      JOIN employees e ON e.id = dk.employee_id
      WHERE dk.employee_id = ${empId} ${fromFilter} ${toFilter}
      ORDER BY dk.kpi_date DESC LIMIT 100
    `);
    return dbRows(r);
  
    });}

  async getDailyAttendance(date?: string, departmentId?: string){
    return safeCall(async () => {
    const dateFilter = date ? sql`AND dk.kpi_date = ${date}::date` : sql``;
    const deptFilter = departmentId ? sql`AND e.department_id = ${si(departmentId)}` : sql``;
    const r = await rawSql(sql`
      SELECT dk.id, dk.employee_id, dk.kpi_date, dk.attendance_status,
             dk.work_start, dk.work_end, dk.hours_worked, dk.total_score,
             e.first_name || ' ' || e.last_name AS employee_name, d.name AS department_name
      FROM employee_daily_kpi dk
      JOIN employees e ON e.id = dk.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE true ${dateFilter} ${deptFilter}
      ORDER BY dk.kpi_date DESC, e.first_name LIMIT ${MAX_QUERY_LIMIT}
    `);
    return dbRows(r);
  
    });}

  async recordAttendance(body: Record<string, unknown>){
    return safeCall(async () => {
    const { employee_id, kpi_date, attendance_status, work_start, work_end, hours_worked } = body;
    if (!employee_id || !kpi_date) throw new BadRequestException('employee_id va kpi_date majburiy');
    const r = await rawSql(sql`
      INSERT INTO employee_daily_kpi
        (employee_id, kpi_date, attendance_status, work_start, work_end, hours_worked)
      VALUES (${employee_id ?? null}, ${kpi_date ?? null},
              ${attendance_status ?? 'present'}, ${work_start ?? null},
              ${work_end ?? null}, ${hours_worked ?? null})
      ON CONFLICT (employee_id, kpi_date) DO UPDATE SET
        attendance_status = EXCLUDED.attendance_status,
        work_start = EXCLUDED.work_start, work_end = EXCLUDED.work_end,
        hours_worked = EXCLUDED.hours_worked
      RETURNING *
    `);
    const created = dbRows(r)[0];
    return created;
  
    });}
}
