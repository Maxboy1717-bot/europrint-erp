/**
 * @module legacy-attendance.helpers
 * @description Raw SQL helpers for legacy attendance/face/zone tables — split from legacy.service.ts (Rule 16: <300 lines).
 * See legacy.service.ts header for SQL-retention rationale.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Legacy tables (admins, face_embeddings, attendance_records, zone_tracking_logs,
 *     camera_safety_violations, discipline_records, certificates) which have no
 *     Drizzle schema definitions (legacy module bridges pre-ORM tables)
 *   - Dynamic SQL fragment composition (empId ? sql`WHERE employee_id = ${empId}` : sql``)
 *     for optional filtering — Drizzle's where-builder is not available without schema
 *   - COUNT(CASE WHEN status = 'present' THEN 1 END) conditional aggregation
 *   - DATE(check_in) = CURRENT_DATE function-based predicate
 *   - Inline ::text cast on dynamic empId parameter
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

export async function findAdminByUsernameRaw(username: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await db.execute(sql`SELECT * FROM admins WHERE username = ${username} LIMIT 1`);
    return (r.rows[0] as Record<string, unknown>) ?? null;
  } catch { return null; }
}

export async function findAdminByIdRaw(id: number | string): Promise<Record<string, unknown> | null> {
  try {
    const r = await db.execute(sql`SELECT * FROM admins WHERE id = ${id}`);
    return (r.rows[0] as Record<string, unknown>) ?? null;
  } catch { return null; }
}

export async function getFaceEmbeddingsRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`SELECT * FROM face_embeddings ORDER BY created_at DESC LIMIT 100`);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function deleteFaceEmbeddingRaw(id: string): Promise<void> {
  await db.execute(sql`DELETE FROM face_embeddings WHERE id = ${id}`);
}

export async function getAttendanceRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`SELECT * FROM attendance_records ORDER BY check_in DESC LIMIT 200`);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getMyAttendanceRaw(empId?: string): Promise<Record<string, unknown>[]> {
  try {
    const empFilter = empId ? sql`WHERE employee_id = ${empId}` : sql``;
    const r = await db.execute(sql`
      SELECT * FROM attendance_records ${empFilter} ORDER BY check_in DESC LIMIT 50
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getZoneLogsRaw(): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`SELECT * FROM zone_tracking_logs ORDER BY created_at DESC LIMIT 100`);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getAttendanceStatsRaw(): Promise<Record<string, unknown>> {
  try {
    const r = await db.execute(sql`
      SELECT COUNT(*) AS total,
        COUNT(CASE WHEN status = 'present' THEN 1 END) AS present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent
      FROM attendance_records WHERE DATE(check_in) = CURRENT_DATE
    `);
    return (r.rows[0] as Record<string, unknown>) ?? { total: 0, present: 0, absent: 0 };
  } catch { return { total: 0, present: 0, absent: 0 }; }
}

export async function getSafetyViolationsUserRaw(empId?: string): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`
      SELECT sv.id, sv.violation_type, sv.detected_at, sv.status, sv.description
      FROM camera_safety_violations sv
      WHERE sv.employee_id = ${empId ?? '0'}::text
      ORDER BY sv.detected_at DESC
      LIMIT 50
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getDisciplineUserRaw(empId?: string): Promise<Record<string, unknown>[]> {
  try {
    const empIdInt = empId ? parseInt(empId, 10) : 0;
    const r = await db.execute(sql`
      SELECT dr.id, dr.catalog_code, dr.issued_date, dr.status, dr.description
      FROM discipline_records dr
      WHERE dr.employee_id = ${empIdInt}
      ORDER BY dr.issued_date DESC
      LIMIT 50
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getCertificatesUserRaw(empId?: string): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`
      SELECT * FROM certificates WHERE employee_id = ${empId ?? 0} ORDER BY issued_date DESC
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}
