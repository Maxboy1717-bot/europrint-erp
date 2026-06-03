/**
 * @module legacy-attendance.helpers
 * @description Helpers for legacy attendance/face/zone tables — split from legacy.service.ts (Rule 16: <300 lines).
 * See legacy.service.ts header for SQL-retention rationale.
 *
 * P3-30 migration: face_embeddings / attendance_records / zone_tracking_logs /
 * camera_safety_violations / discipline_records moved to Drizzle query builder.
 * Remaining raw SQL annotated with `// NOTE: P3-30 — <reason>`. Specifically:
 *   - `admins` pgTable is a 3-column stub (no password_hash / role)
 *   - `certificates_table` pgTable is a 3-column stub (no employee_id / issued_date)
 *   - COUNT(CASE WHEN status='present' THEN 1 END) + DATE(check_in)=CURRENT_DATE
 *     in getAttendanceStatsRaw — no Drizzle CASE-aggregate / DATE() builder.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { db } from '@shared/db';
import { sql, desc, eq } from 'drizzle-orm';
import {
  face_embeddings, zone_tracking_logs, attendance_records,
  camera_safety_violations, discipline_records,
} from '@shared/db';

// NOTE: P3-30 — `admins` pgTable in schema-misc-app-b is a 3-column stub
// (id, username, created_at) and lacks password_hash / role / etc. that the
// raw SELECT * relies on; keep raw until a full Drizzle definition exists.
export async function findAdminByUsernameRaw(username: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await db.execute(sql`SELECT * FROM admins WHERE username = ${username} LIMIT 1`);
    return (r.rows[0] as Record<string, unknown>) ?? null;
  } catch { return null; }
}

// NOTE: P3-30 — see findAdminByUsernameRaw; same `admins` stub limitation.
export async function findAdminByIdRaw(id: number | string): Promise<Record<string, unknown> | null> {
  try {
    const r = await db.execute(sql`SELECT * FROM admins WHERE id = ${id}`);
    return (r.rows[0] as Record<string, unknown>) ?? null;
  } catch { return null; }
}

export async function getFaceEmbeddingsRaw(): Promise<Record<string, unknown>[]> {
  try {
    const rows = await db.select().from(face_embeddings).orderBy(desc(face_embeddings.createdAt)).limit(100);
    return rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function deleteFaceEmbeddingRaw(id: string): Promise<void> {
  // face_embeddings.id is serial(integer); cast incoming string id.
  const numericId = Number(id);
  if (Number.isFinite(numericId)) {
    await db.delete(face_embeddings).where(eq(face_embeddings.id, numericId));
  }
}

export async function getAttendanceRaw(): Promise<Record<string, unknown>[]> {
  try {
    const rows = await db.select().from(attendance_records).orderBy(desc(attendance_records.eventTime)).limit(200);
    return rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getMyAttendanceRaw(empId?: string): Promise<Record<string, unknown>[]> {
  try {
    const base = db.select().from(attendance_records).$dynamic();
    const filtered = empId ? base.where(eq(attendance_records.employeeId, parseInt(empId, 10))) : base;
    const rows = await filtered.orderBy(desc(attendance_records.eventTime)).limit(50);
    return rows as Record<string, unknown>[];
  } catch { return []; }
}

function buildAttendanceTs(date: string | null, time: unknown): string | null {
  if (time == null) return null;
  const t = String(time).trim();
  if (!t) return null;
  // A bare "HH:MM[:SS]" time is combined with the date; a full ISO datetime is used as-is.
  if (t.includes('T') || t.length > 8) return t;
  return date ? `${date}T${t}` : null;
}

/**
 * Real INSERT for the legacy POST /api/attendance form (AddAttendanceDialog) — this was a
 * `{ id: Date.now(), ... }` echo. Writes attendance_records, the SAME table getAttendanceRaw
 * reads, so a saved record shows up on reload. event_type is NOT NULL → 'manual'; event_time is
 * set so the new row sorts to the top of the getAttendanceRaw list. Parametrized (Qoida B).
 */
export async function insertAttendanceRecordRaw(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const rawUser = body['userId'] ?? body['employeeId'];
  const userId =
    rawUser != null && String(rawUser).trim() !== '' && !Number.isNaN(Number(rawUser)) ? Number(rawUser) : null;
  const date = body['date'] != null && String(body['date']).trim() !== '' ? String(body['date']) : null;
  const checkIn = buildAttendanceTs(date, body['checkIn']);
  const checkOut = buildAttendanceTs(date, body['checkOut']);
  const status = body['status'] != null ? String(body['status']) : null;
  const notes = body['notes'] != null ? String(body['notes']) : null;
  const r = await db.execute(sql`
    INSERT INTO attendance_records
      (user_id, employee_id, date, check_in, check_out, status, notes, event_type, source, event_time)
    VALUES
      (${userId}, ${userId}, ${date}::date, ${checkIn}::timestamp, ${checkOut}::timestamp,
       ${status}, ${notes}, 'manual', 'manual', NOW())
    RETURNING *
  `);
  const row = r.rows[0] as Record<string, unknown> | undefined;
  if (!row) throw new Error('attendance_records insert returned no row');
  return row;
}

export async function getZoneLogsRaw(): Promise<Record<string, unknown>[]> {
  try {
    const rows = await db.select().from(zone_tracking_logs).orderBy(desc(zone_tracking_logs.created_at)).limit(100);
    return rows as Record<string, unknown>[];
  } catch { return []; }
}

// NOTE: P3-30 — COUNT(CASE WHEN ...) conditional aggregation in one pass +
// DATE(check_in) function predicate; Drizzle has no native CASE-aggregate
// nor DATE() builder. Splitting would change semantics; keep raw.
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
    const rows = await db
      .select({
        id: camera_safety_violations.id,
        violation_type: camera_safety_violations.violation_type,
        detected_at: camera_safety_violations.detected_at,
        status: camera_safety_violations.status,
        description: camera_safety_violations.description,
      })
      .from(camera_safety_violations)
      .where(eq(camera_safety_violations.employee_id, empId ?? '0'))
      .orderBy(desc(camera_safety_violations.detected_at))
      .limit(50);
    return rows as Record<string, unknown>[];
  } catch { return []; }
}

export async function getDisciplineUserRaw(empId?: string): Promise<Record<string, unknown>[]> {
  try {
    const empIdInt = empId ? parseInt(empId, 10) : 0;
    const rows = await db
      .select({
        id: discipline_records.id,
        catalog_code: discipline_records.catalogCode,
        issued_date: discipline_records.issuedDate,
        status: discipline_records.status,
        description: discipline_records.description,
      })
      .from(discipline_records)
      .where(eq(discipline_records.employeeId, empIdInt))
      .orderBy(desc(discipline_records.issuedDate))
      .limit(50);
    return rows as Record<string, unknown>[];
  } catch { return []; }
}

// NOTE: P3-30 — `certificates_table` Drizzle pgTable is a 3-column stub
// (id, is_active, updated_at) missing `employee_id` and `issued_date` that
// this query reads; needs schema work before ORM conversion.
export async function getCertificatesUserRaw(empId?: string): Promise<Record<string, unknown>[]> {
  try {
    const r = await db.execute(sql`
      SELECT * FROM certificates WHERE employee_id = ${empId ?? 0} ORDER BY issued_date DESC
    `);
    return r.rows as Record<string, unknown>[];
  } catch { return []; }
}
