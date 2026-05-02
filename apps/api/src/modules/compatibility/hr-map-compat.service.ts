import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

import { MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class HrMapCompatService {

  async getMapEmployees(departmentId?: string, status?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const deptFilter = departmentId ? sql`AND e.department_id = ${si(departmentId)}` : sql``;
    const statusFilter = status ? sql`AND e.status = ${status}` : sql``;
    const r = await rawSql(sql`
      SELECT e.id, e.first_name || ' ' || e.last_name AS full_name, e.status,
             e.employee_code, d.name AS department_name,
             COALESCE(p.name, p.name_uz) AS position_name, d.id AS department_id
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN positions p ON p.id = e.position_id
      WHERE e.status != 'terminated' ${deptFilter} ${statusFilter}
      ORDER BY d.name, e.first_name LIMIT ${MAX_LARGE_QUERY_LIMIT}
    `);
    return dbRows(r);
  
    });}

  async getMapStats(){
    return safeCall(async () => {
    const [r1, r2] = await Promise.all([
      rawSql(sql`
        SELECT COUNT(*) AS total_employees,
               COUNT(*) FILTER (WHERE e.status = 'active') AS active_employees,
               COUNT(DISTINCT e.department_id) AS total_departments
        FROM employees e WHERE e.status != 'terminated'
      `),
      rawSql(sql`
        SELECT d.id, d.name AS department_name, COUNT(e.id) AS employee_count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
        GROUP BY d.id, d.name ORDER BY employee_count DESC
      `),
    ]);
    const statsRow = dbRows(r1)[0] ?? {};
    return {
      totalEmployees: statsRow['total_employees'] ?? 0,
      activeEmployees: statsRow['active_employees'] ?? 0,
      totalDepartments: statsRow['total_departments'] ?? 0,
      byDepartment: dbRows(r2),
    };
  
    });}

  async getTransportGroups(){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT d.id, d.name AS department_name, COUNT(e.id) AS employee_count,
             STRING_AGG(e.first_name || ' ' || e.last_name, ', ' ORDER BY e.first_name) AS employees
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      GROUP BY d.id, d.name ORDER BY d.name LIMIT 50
    `);
    return dbRows(r);
  
    });}

  async getCourses(status?: string, limit = '50'){
    return safeCall(async () => {
    const lim = Math.min(si(limit, 50), MAX_QUERY_LIMIT);
    const activeFilter = status === 'inactive' ? sql`AND hc.is_active = false` : sql`AND hc.is_active = true`;
    const r = await rawSql(sql`
      SELECT hc.id, hc.title, hc.content, hc.difficulty, hc.duration_minutes,
             hc.author, hc.session_number, hc.is_active, hc.created_at
      FROM hr_capital_courses hc
      WHERE true ${activeFilter}
      ORDER BY hc.created_at DESC LIMIT ${lim}
    `);
    return dbRows(r);
  
    });}

  async createCourse(body: Record<string, unknown>){
    return safeCall(async () => {
    const { title, content, difficulty, duration_minutes, author, session_number } = body;
    if (!title) throw new BadRequestException('title majburiy');
    const r = await rawSql(sql`
      INSERT INTO hr_capital_courses (title, content, difficulty, duration_minutes, author, session_number, is_active)
      VALUES (${title ?? ''}, ${content ?? null}, ${difficulty ?? 'intermediate'},
              ${duration_minutes ?? null}, ${author ?? null}, ${session_number ?? null}, true)
      RETURNING id, title, difficulty, is_active, created_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async getHrCapitalStats(){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT COUNT(*) AS total_courses,
             COUNT(*) FILTER (WHERE is_active = true) AS active_courses,
             COUNT(DISTINCT author) AS total_authors,
             ROUND(AVG(duration_minutes)::numeric, 0) AS avg_duration_minutes
      FROM hr_capital_courses
    `);
    const statsRow = dbRows(r)[0] ?? {};
    return {
      totalCourses: statsRow['total_courses'] ?? 0,
      activeCourses: statsRow['active_courses'] ?? 0,
      totalAuthors: statsRow['total_authors'] ?? 0,
      avgDurationMinutes: statsRow['avg_duration_minutes'] ?? 0,
    };
  
    });}

  async getSwapRequests(status?: string, limit = '50'){
    return safeCall(async () => {
    const lim = Math.min(si(limit, 50), MAX_QUERY_LIMIT);
    const statusFilter = status ? sql`AND ss.status = ${status}` : sql``;
    const r = await rawSql(sql`
      SELECT ss.id, ss.employee_id, ss.shift_date, ss.shift_type,
             ss.start_time, ss.end_time, ss.status,
             e.first_name || ' ' || e.last_name AS employee_name, d.name AS department_name
      FROM shift_schedules ss
      JOIN employees e ON e.id = ss.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE ss.shift_date >= NOW()::date - INTERVAL '7 days' ${statusFilter}
      ORDER BY ss.shift_date DESC LIMIT ${lim}
    `);
    return dbRows(r);
  
    });}

  async getDepartments(){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT d.id, d.name, COUNT(e.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      GROUP BY d.id, d.name ORDER BY d.name
    `);
    return dbRows(r);
  
    });}

  async getHeatmap(metric?: string){
    return safeCall(async () => {
    const col = metric === 'salary' ? sql`COALESCE(AVG(e.salary), 0)` : sql`COUNT(e.id)`;
    const r = await rawSql(sql`
      SELECT d.id, d.name AS department_name, ${col} AS value
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      GROUP BY d.id, d.name ORDER BY value DESC
    `);
    return dbRows(r);
  
    });}

  async getAttendanceToday(){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT COUNT(*) FILTER (WHERE check_in IS NOT NULL) AS present,
             COUNT(*) FILTER (WHERE check_in IS NULL) AS absent,
             COUNT(*) AS total
      FROM employees e
      LEFT JOIN attendance_logs al ON al.employee_id = e.id AND al.log_date = CURRENT_DATE
      WHERE e.status = 'active'
    `);
    return dbRows(r)[0] ?? { present: 0, absent: 0, total: 0 };
  
    });}

  async getZones(){
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT id, name, zone_type, description, created_at
        FROM camera_zones
        ORDER BY name LIMIT 100
      `);
      return dbRows(r);
    });
  }

  async filterMap(body: Record<string, unknown>){
    return safeCall(async () => {
    const { departmentId, status, positionId } = body;
    const deptFilter = departmentId ? sql`AND e.department_id = ${si(departmentId)}` : sql``;
    const statusFilter = status ? sql`AND e.status = ${status}` : sql``;
    const posFilter = positionId ? sql`AND e.position_id = ${si(positionId)}` : sql``;
    const r = await rawSql(sql`
      SELECT e.id, e.first_name || ' ' || e.last_name AS full_name, e.status,
             d.name AS department_name, p.name AS position_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN positions p ON p.id = e.position_id
      WHERE e.status != 'terminated' ${deptFilter} ${statusFilter} ${posFilter}
      ORDER BY d.name, e.first_name LIMIT ${MAX_LARGE_QUERY_LIMIT}
    `);
    return dbRows(r);
  
    });}
}
