/**
 * @module erp-camera.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ErpCameraRepository {
  async cameraEmployeeReports(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT cr.*, (u.first_name || ' ' || u.last_name) AS full_name, u.department_id, d.name AS department_name FROM camera_employee_reports cr LEFT JOIN users u ON u.id = cr.user_id LEFT JOIN departments d ON d.id = u.department_id ORDER BY cr.captured_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async cameraFallbackReports(limit: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT cl.id, cl.camera_id, cl.log_type, cl.message, cl.created_at AS captured_at FROM camera_logs cl ORDER BY cl.created_at DESC LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async cameraEmployeeReport(userId: number, limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT cr.*, (u.first_name || ' ' || u.last_name) AS full_name, d.name AS department_name FROM camera_employee_reports cr LEFT JOIN users u ON u.id = cr.user_id LEFT JOIN departments d ON d.id = u.department_id WHERE cr.user_id = ${userId} ORDER BY cr.captured_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async cameraEmployeeFallback(userId: number, limit: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT ce.*, (u.first_name || ' ' || u.last_name) AS full_name FROM camera_events ce LEFT JOIN users u ON u.id::text = ce.description WHERE u.id = ${userId} ORDER BY ce.created_at DESC LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async liveDetections(cameraId?: number): Promise<Result<Row[]>>  {
  try {  
      return cameraId
        ? exec(sql`SELECT ce.*, (u.first_name || ' ' || u.last_name) AS full_name FROM camera_events ce LEFT JOIN users u ON u.id::text = ce.description WHERE ce.created_at > NOW() - INTERVAL '5 minutes' AND ce.camera_id = ${String(cameraId)} ORDER BY ce.created_at DESC LIMIT 50`)
        : exec(sql`SELECT ce.*, (u.first_name || ' ' || u.last_name) AS full_name FROM camera_events ce LEFT JOIN users u ON u.id::text = ce.description WHERE ce.created_at > NOW() - INTERVAL '5 minutes' ORDER BY ce.created_at DESC LIMIT 50`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async groupedDetections(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT cz.zone_name, COUNT(*) AS detection_count, MAX(ce.created_at) AS last_seen FROM camera_events ce LEFT JOIN cameras c ON c.id::text = ce.camera_id LEFT JOIN camera_zones cz ON cz.camera_id = c.id WHERE ce.created_at > NOW() - INTERVAL '1 hour' AND ce.event_type = 'face_recognition' GROUP BY cz.zone_name ORDER BY detection_count DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async teamAnalyticsDepartments(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT d.id, d.name, COUNT(DISTINCT e.id) AS employee_count, COUNT(DISTINCT ce.id) FILTER (WHERE ce.created_at > NOW() - INTERVAL '1 day') AS detections_24h FROM org_departments d LEFT JOIN employees e ON e.org_department_id = d.id LEFT JOIN camera_events ce ON ce.description = e.id::text AND ce.event_type = 'face_recognition' GROUP BY d.id, d.name ORDER BY d.name`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async teamAnalyticsZoneActivity(departmentId?: number, interval = '7 days'): Promise<Result<Row[]>>  {
  try {  
      const safeInterval = interval.replace(/[^0-9a-zA-Z ]/g, '');
      const ivl = sql`${safeInterval}::interval`;
      return departmentId
        ? exec(sql`SELECT cz.zone_name, COUNT(DISTINCT ce.description) AS unique_users, COUNT(*) AS total_detections, DATE_TRUNC('day', ce.created_at) AS day FROM camera_events ce LEFT JOIN cameras c ON c.id::text = ce.camera_id LEFT JOIN camera_zones cz ON cz.camera_id = c.id LEFT JOIN users u ON u.id::text = ce.description WHERE ce.created_at > NOW() - ${ivl} AND u.department_id = ${departmentId} GROUP BY cz.zone_name, day ORDER BY day DESC, total_detections DESC`)
        : exec(sql`SELECT cz.zone_name, COUNT(DISTINCT ce.description) AS unique_users, COUNT(*) AS total_detections, DATE_TRUNC('day', ce.created_at) AS day FROM camera_events ce LEFT JOIN cameras c ON c.id::text = ce.camera_id LEFT JOIN camera_zones cz ON cz.camera_id = c.id WHERE ce.created_at > NOW() - ${ivl} GROUP BY cz.zone_name, day ORDER BY day DESC, total_detections DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getEmployeeMetrics(userId: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT u.id, (u.first_name || ' ' || u.last_name) AS full_name, u.department_id, COUNT(DISTINCT ce.id) AS total_detections, COUNT(DISTINCT DATE(ce.created_at)) AS active_days, MAX(ce.created_at) AS last_seen FROM users u LEFT JOIN camera_events ce ON ce.description = u.id::text WHERE u.id = ${userId} GROUP BY u.id, u.first_name, u.last_name, u.department_id`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getEmployeeTransferHistory(userId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT et.*, d_from.name AS from_dept, d_to.name AS to_dept FROM employee_transfers et LEFT JOIN departments d_from ON d_from.id = et.from_department_id LEFT JOIN departments d_to ON d_to.id = et.to_department_id WHERE et.employee_id = ${userId} ORDER BY et.transfer_date DESC LIMIT 50`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
