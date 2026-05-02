import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import {
  hr_tz2_territory_logs,
  hr_tz2_attendance_photos,
  hr_tz2_daily_attendance,
  hr_tz2_security_alerts,
  hrEmployees,
  hrDepartments,
} from '@shared/db';
import { eq, gte, lte, and, desc, sql } from 'drizzle-orm';
import { safeCall, Result, AppError } from '@common/result';
import { TashkentTimeService } from '@common/time';

export interface EnrichedTerritoryLog {
  id:              string;
  employee_id:     number | null;
  employee_name:   string | null;
  department_name: string | null;
  event_type:      string;
  camera_id:       string | null;
  ts:              Date;
  face_confidence: string | null;
  room_code:       string | null;
}

const time = new TashkentTimeService();

export interface InsertTerritoryLogDto {
  employee_id: number | null;
  event_type: 'enter' | 'exit' | 'detected' | 'absent_check';
  camera_id?: string;
  ts: Date;
  face_confidence?: number;
  room_code?: string;
}

export interface InsertAttendancePhotoDto {
  employee_id: number;
  photo_url: string;
  taken_at: Date;
  room_code?: string;
  analysis_result?: {
    emotion: string;
    fatigue_score: number;
    posture_score: number;
    anomaly: boolean;
    anomaly_reason?: string;
  };
}

@Injectable()
export class TerritoryLogRepository {
  async insertLog(dto: InsertTerritoryLogDto): Promise<Result<{ id: string }, AppError>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(hr_tz2_territory_logs)
        .values({
          employee_id: dto.employee_id,
          event_type: dto.event_type,
          camera_id: dto.camera_id ?? null,
          ts: dto.ts,
          face_confidence: dto.face_confidence != null ? String(dto.face_confidence) : null,
          room_code: dto.room_code ?? null,
        })
        .returning({ id: hr_tz2_territory_logs.id });

      return { id: row.id };
    });
  }

  async insertPhoto(dto: InsertAttendancePhotoDto): Promise<Result<{ id: string }, AppError>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(hr_tz2_attendance_photos)
        .values({
          employee_id: dto.employee_id,
          photo_url: dto.photo_url,
          taken_at: dto.taken_at,
          room_code: dto.room_code ?? null,
          analysis_result: dto.analysis_result ?? null,
          processed: dto.analysis_result != null,
        })
        .returning({ id: hr_tz2_attendance_photos.id });

      return { id: row.id };
    });
  }

  async getLogsForDate(
    date: string,
    employeeId?: number,
  ): Promise<Result<typeof hr_tz2_territory_logs.$inferSelect[], AppError>> {
    return safeCall(async () => {
      const dayStart = time.startOfDay(new Date(date));
      const nextDay  = new Date(new Date(date).getTime() + 86_400_000);
      const dayEnd   = time.startOfDay(nextDay);

      const conds = [
        gte(hr_tz2_territory_logs.ts, dayStart),
        lte(hr_tz2_territory_logs.ts, dayEnd),
      ];
      if (employeeId != null) {
        conds.push(eq(hr_tz2_territory_logs.employee_id, employeeId));
      }

      return db
        .select()
        .from(hr_tz2_territory_logs)
        .where(and(...conds))
        .orderBy(desc(hr_tz2_territory_logs.ts))
        .limit(500);
    });
  }

  async getLogsEnriched(
    date: string,
    employeeId?: number,
  ): Promise<Result<EnrichedTerritoryLog[], AppError>> {
    return safeCall(async () => {
      const dayStart = time.startOfDay(new Date(date));
      const nextDay  = new Date(new Date(date).getTime() + 86_400_000);
      const dayEnd   = time.startOfDay(nextDay);

      const conds = [
        gte(hr_tz2_territory_logs.ts, dayStart),
        lte(hr_tz2_territory_logs.ts, dayEnd),
      ];
      if (employeeId != null) {
        conds.push(eq(hr_tz2_territory_logs.employee_id, employeeId));
      }

      const rows = await db
        .select({
          id:              hr_tz2_territory_logs.id,
          employee_id:     hr_tz2_territory_logs.employee_id,
          employee_name:   sql<string | null>`NULLIF(TRIM(COALESCE(${hrEmployees.first_name},'') || ' ' || COALESCE(${hrEmployees.last_name},'')), '')`,
          department_name: hrDepartments.name,
          event_type:      hr_tz2_territory_logs.event_type,
          camera_id:       hr_tz2_territory_logs.camera_id,
          ts:              hr_tz2_territory_logs.ts,
          face_confidence: hr_tz2_territory_logs.face_confidence,
          room_code:       hr_tz2_territory_logs.room_code,
        })
        .from(hr_tz2_territory_logs)
        .leftJoin(hrEmployees,   eq(hrEmployees.id, hr_tz2_territory_logs.employee_id))
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .where(and(...conds))
        .orderBy(desc(hr_tz2_territory_logs.ts))
        .limit(500);

      return (rows ?? []).map((r) => ({
        id:              r.id,
        employee_id:     r.employee_id ?? null,
        employee_name:   r.employee_name ?? null,
        department_name: r.department_name ? String(r.department_name) : null,
        event_type:      r.event_type,
        camera_id:       r.camera_id ?? null,
        ts:              r.ts,
        face_confidence: r.face_confidence ?? null,
        room_code:       r.room_code ?? null,
      }));
    });
  }

  async getUnprocessedPhotos(): Promise<
    Result<typeof hr_tz2_attendance_photos.$inferSelect[], AppError>
  > {
    return safeCall(async () =>
      db
        .select()
        .from(hr_tz2_attendance_photos)
        .where(eq(hr_tz2_attendance_photos.processed, false))
        .orderBy(hr_tz2_attendance_photos.taken_at)
        .limit(200),
    );
  }

  async markPhotoProcessed(
    id: string,
    analysis: InsertAttendancePhotoDto['analysis_result'],
  ): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      await db
        .update(hr_tz2_attendance_photos)
        .set({
          processed: true,
          analysis_result: analysis ?? null,
          updated_at: time.now(),
        })
        .where(eq(hr_tz2_attendance_photos.id, id));
    });
  }

  async upsertDailyAttendance(
    employeeId: number,
    date: string,
    eventType: 'enter' | 'exit' | 'detected' | 'absent_check',
    ts: Date,
  ): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const existing = await db
        .select({ id: hr_tz2_daily_attendance.id })
        .from(hr_tz2_daily_attendance)
        .where(
          and(
            eq(hr_tz2_daily_attendance.employee_id, employeeId),
            eq(hr_tz2_daily_attendance.date, date),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(hr_tz2_daily_attendance).values({
          employee_id:         employeeId,
          date,
          check_in_territory:  eventType === 'enter' ? ts : null,
          check_out_territory: eventType === 'exit'  ? ts : null,
          status:              'present',
        });
      } else if (eventType === 'enter') {
        await db
          .update(hr_tz2_daily_attendance)
          .set({ check_in_territory: ts, updated_at: time.now() })
          .where(
            and(
              eq(hr_tz2_daily_attendance.employee_id, employeeId),
              eq(hr_tz2_daily_attendance.date, date),
              sql`${hr_tz2_daily_attendance.check_in_territory} IS NULL`,
            ),
          );
      } else if (eventType === 'exit') {
        await db
          .update(hr_tz2_daily_attendance)
          .set({ check_out_territory: ts, updated_at: time.now() })
          .where(
            and(
              eq(hr_tz2_daily_attendance.employee_id, employeeId),
              eq(hr_tz2_daily_attendance.date, date),
            ),
          );
      }
    });
  }

  async insertSecurityAlert(data: {
    camera_id?:  string;
    room_code?:  string;
    event_type?: string;
    confidence?: number;
    ts:          Date;
  }): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      await db.insert(hr_tz2_security_alerts).values({
        camera_id:  data.camera_id ?? null,
        room_code:  data.room_code ?? null,
        event_type: data.event_type ?? null,
        confidence: data.confidence != null ? String(data.confidence) : null,
        ts:         data.ts,
        resolved:   false,
      });
    });
  }
}
