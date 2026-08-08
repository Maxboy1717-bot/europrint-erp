/**
 * @module hr-map-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

import { MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
import { HR_MAP_FACTORY_LAT, HR_MAP_FACTORY_LNG, EARTH_RADIUS_KM } from '@common/constants/business.constants';
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class HrMapCompatService {

  async getMapEmployees(departmentId?: string, status?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const deptFilter = departmentId ? sql`AND primary_org.dept_id = ${String(si(departmentId))}` : sql``;
    const statusFilter = status ? sql`AND e.status = ${status}` : sql``;
    const r = await rawSql(sql`
      SELECT e.id, e.first_name || ' ' || e.last_name AS full_name, e.status,
             e.employee_code,
             e.lat, e.lng,
             primary_org.dept_name AS org_department_name,
             primary_org.pos_name  AS org_position_name,
             primary_org.dept_id   AS org_department_id
      FROM employees e
      LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
      LEFT JOIN LATERAL (
        SELECT
          eod.org_department_id::text        AS dept_id,
          od.name                         AS dept_name,
          COALESCE(of2.position_name, '')    AS pos_name
        FROM employee_org_departments eod
        JOIN org_departments od ON od.id = eod.org_department_id
        LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id
        WHERE eod.user_id = u.id AND eod.is_primary = true
        ORDER BY eod.assigned_at DESC
        LIMIT 1
      ) primary_org ON true
      WHERE e.status != 'terminated'
        AND e.geo_consent = true
        ${deptFilter} ${statusFilter}
      ORDER BY primary_org.dept_name, e.first_name LIMIT ${MAX_LARGE_QUERY_LIMIT}
    `);
    return dbRows(r);

    });}

  async getMapStats(){
    return safeCall(async () => {
    const [r1, r2] = await Promise.all([
      rawSql(sql`
        SELECT COUNT(*) AS total_employees,
               COUNT(*) FILTER (WHERE e.status = 'active') AS active_employees,
               (SELECT COUNT(DISTINCT eod2.org_department_id) FROM employee_org_departments eod2)::int AS total_departments
        FROM employees e WHERE e.status != 'terminated'
      `),
      rawSql(sql`
        SELECT od.id::text AS id, od.name AS org_department_name, COUNT(DISTINCT e.id) AS employee_count
        FROM org_departments od
        LEFT JOIN employee_org_departments eod ON eod.org_department_id = od.id AND eod.is_primary = true
        LEFT JOIN users u2 ON u2.id = eod.user_id AND u2.deleted_at IS NULL
        LEFT JOIN employees e ON e.id = u2.employee_id AND e.status = 'active'
        GROUP BY od.id, od.name ORDER BY employee_count DESC
      `),
    ]);
    const statsRow = dbRows(r1)[0] ?? {};
    // Audit 2026-08-08 (docs/audit/HR-MODUL-PRODUCTION-TAYYORLIK-2026-08-08.md): bu avval
    // flat {totalEmployees,...} qaytarardi, FE (HRMapTypes.ts MapStats) esa `total.employees`
    // shaklini kutadi — "Jami xodimlar" KPI kartasi doim 0 ko'rsatardi. Endi FE tipiga mos.
    // byShift/byDistrict FE'da hech qayerda render qilinmaydi (tekshirildi) — bu so'rov
    // ularni hisoblamaydi, shuning uchun qo'shilmadi (Q-40, soxta bo'sh massiv emas).
    return {
      total: {
        employees: Number(statsRow['total_employees'] ?? 0),
      },
      activeEmployees: Number(statsRow['active_employees'] ?? 0),
      totalDepartments: Number(statsRow['total_departments'] ?? 0),
      byDepartment: dbRows(r2).map((row) => ({
        orgDepartmentName: row['org_department_name'],
        count: Number(row['employee_count'] ?? 0),
      })),
    };

    });}

  /**
   * Audit 2026-08-08: "AI marshrutlar" tugmasi avval STRUCTURALLY buzuq edi — controller
   * `{items, total}` qaytarardi, FE esa javobning o'zini `TransportResult{groups,...}` deb
   * o'qirdi (`groups` maydoni hech qachon mavjud emas edi), ustiga `employees` ustuni
   * `STRING_AGG` bilan vergul-qo'shilgan MATN edi, FE strukturali massiv kutadi — ikki
   * qavatli nomuvofiqlik, natijada butun "marshrut" ko'rinishi hech qachon render bo'lmagan.
   * Haqiqiy tuzatish: (1) FE kutgan shaklda qaytariladi, (2) har xodim uchun zavoddan
   * masofa (`distance_km`) haversine formulasi bilan HAQIQIY `lat`/`lng` ustunlaridan
   * hisoblanadi (bu geometriya, fabrikatsiya emas). `departureTime`/`route`/`driverNote`/
   * `travelMinutes` KIRITILMAYDI — bular haqiqiy transport-jadval/marshrut biznes-qoidasini
   * talab qiladi (nechta avtobus, sig'im, jo'nash vaqti — egasi qarori, Q-34), soxta raqam
   * ko'rsatish Q-40 buzilishi bo'lardi.
   */
  async getTransportGroups(){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT od.id::text AS id, od.name AS group_name,
             json_agg(
               json_build_object(
                 'id', e.id::text,
                 'fullName', e.first_name || ' ' || e.last_name,
                 'lat', e.lat, 'lng', e.lng, 'address', COALESCE(e.address_actual, e.address_registered),
                 'distanceKm', ROUND(
                   (${EARTH_RADIUS_KM} * acos(LEAST(1, GREATEST(-1,
                     cos(radians(${HR_MAP_FACTORY_LAT})) * cos(radians(e.lat)) *
                     cos(radians(e.lng) - radians(${HR_MAP_FACTORY_LNG})) +
                     sin(radians(${HR_MAP_FACTORY_LAT})) * sin(radians(e.lat))
                   ))))::numeric, 1
                 )
               ) ORDER BY e.first_name
             ) FILTER (WHERE e.id IS NOT NULL AND e.lat IS NOT NULL AND e.lng IS NOT NULL) AS employees
      FROM org_departments od
      LEFT JOIN employee_org_departments eod ON eod.org_department_id = od.id AND eod.is_primary = true
      LEFT JOIN users u ON u.id = eod.user_id AND u.deleted_at IS NULL
      LEFT JOIN employees e ON e.id = u.employee_id AND e.status = 'active' AND e.geo_consent = true
      GROUP BY od.id, od.name
      HAVING COUNT(e.id) > 0
      ORDER BY od.name LIMIT 50
    `);
    const rows = dbRows(r);
    const groups = rows.map((row) => ({
      id: String(row['id']),
      name: String(row['group_name']),
      employees: (Array.isArray(row['employees']) ? row['employees'] : []) as unknown[],
    }));
    return {
      groups,
      summary: `${groups.length} ta bo'lim guruhi, zavoddan masofa bo'yicha`,
      factoryLat: HR_MAP_FACTORY_LAT,
      factoryLng: HR_MAP_FACTORY_LNG,
      generatedAt: new Date().toISOString(),
    };

    });}

  // Removed 2026-05-31 (dup #4 convergence): getCourses / createCourse / getHrCapitalStats
  // were dead code over the FROZEN hr_capital_courses table — no controller/FE caller
  // (grep-verified). HR-Capital course/quiz cluster is an orphaned LMS duplicate; the
  // HRCapitalCourses page was already removed (1c9ed02c). LMS (courses/tests) is canonical.

  async getSwapRequests(status?: string, limit = '50'){
    return safeCall(async () => {
    const lim = Math.min(si(limit, 50), MAX_QUERY_LIMIT);
    const statusFilter = status ? sql`AND ss.status = ${status}` : sql``;
    const r = await rawSql(sql`
      SELECT ss.id, ss.employee_id, ss.shift_date, ss.shift_type,
             ss.start_time, ss.end_time, ss.status,
             e.first_name || ' ' || e.last_name AS employee_name,
             primary_org.dept_name AS org_department_name
      FROM shift_schedules ss
      JOIN employees e ON e.id = ss.employee_id
      LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
      LEFT JOIN LATERAL (
        SELECT
          eod.org_department_id::text        AS dept_id,
          od.name                         AS dept_name,
          COALESCE(of2.position_name, '')    AS pos_name
        FROM employee_org_departments eod
        JOIN org_departments od ON od.id = eod.org_department_id
        LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id
        WHERE eod.user_id = u.id AND eod.is_primary = true
        ORDER BY eod.assigned_at DESC
        LIMIT 1
      ) primary_org ON true
      WHERE ss.shift_date >= NOW()::date - INTERVAL '7 days' ${statusFilter}
      ORDER BY ss.shift_date DESC LIMIT ${lim}
    `);
    return dbRows(r);

    });}

  async getDepartments(){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT od.id::text AS id, od.name AS name, COUNT(DISTINCT e.id) AS employee_count
      FROM org_departments od
      LEFT JOIN employee_org_departments eod ON eod.org_department_id = od.id AND eod.is_primary = true
      LEFT JOIN users u ON u.id = eod.user_id AND u.deleted_at IS NULL
      LEFT JOIN employees e ON e.id = u.employee_id AND e.status = 'active'
      GROUP BY od.id, od.name ORDER BY od.name
    `);
    return dbRows(r);

    });}

  async getHeatmap(metric?: string){
    return safeCall(async () => {
    const col = metric === 'salary' ? sql`COALESCE(AVG(e.salary), 0)` : sql`COUNT(DISTINCT e.id)`;
    const r = await rawSql(sql`
      SELECT od.id::text AS id, od.name AS org_department_name, ${col} AS value
      FROM org_departments od
      LEFT JOIN employee_org_departments eod ON eod.org_department_id = od.id AND eod.is_primary = true
      LEFT JOIN users u ON u.id = eod.user_id AND u.deleted_at IS NULL
      LEFT JOIN employees e ON e.id = u.employee_id AND e.status = 'active'
      GROUP BY od.id, od.name ORDER BY value DESC
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
    const { departmentId, status } = body;
    const deptFilter = departmentId ? sql`AND primary_org.dept_id = ${String(si(departmentId))}` : sql``;
    const statusFilter = status ? sql`AND e.status = ${status}` : sql``;
    const r = await rawSql(sql`
      SELECT e.id, e.first_name || ' ' || e.last_name AS full_name, e.status,
             e.lat, e.lng,
             primary_org.dept_name AS org_department_name,
             primary_org.pos_name  AS org_position_name
      FROM employees e
      LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
      LEFT JOIN LATERAL (
        SELECT
          eod.org_department_id::text        AS dept_id,
          od.name                         AS dept_name,
          COALESCE(of2.position_name, '')    AS pos_name
        FROM employee_org_departments eod
        JOIN org_departments od ON od.id = eod.org_department_id
        LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id
        WHERE eod.user_id = u.id AND eod.is_primary = true
        ORDER BY eod.assigned_at DESC
        LIMIT 1
      ) primary_org ON true
      WHERE e.status != 'terminated'
        AND e.geo_consent = true
        ${deptFilter} ${statusFilter}
      ORDER BY primary_org.dept_name, e.first_name LIMIT ${MAX_LARGE_QUERY_LIMIT}
    `);
    return dbRows(r);

    });}
}
