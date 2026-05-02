import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { safety_incidents, hazard_zones } from '@shared/db';
import { eq, sql, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class HrSafetyRepository {
  async findDepartmentSummary(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          department_id: safety_incidents.department_id,
          total: sql<number>`count(*)`,
          open: sql<number>`sum(case when ${safety_incidents.status} = 'reported' then 1 else 0 end)`,
          closed: sql<number>`sum(case when ${safety_incidents.status} = 'closed' then 1 else 0 end)`,
        })
        .from(safety_incidents)
        .groupBy(safety_incidents.department_id)
        .limit(50);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findIncidentById(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(safety_incidents)
        .where(eq(safety_incidents.id, id))
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updateIncident(id: number, data: Row): Promise<Result<Row>> {
    try {
      const update: Partial<typeof safety_incidents.$inferInsert> = {};
      if (data['status'] != null) update.status = String(data['status']);
      if (data['investigation_status'] != null) update.investigation_status = String(data['investigation_status']);
      if (data['severity'] != null) update.severity = String(data['severity']);
      const rows = await db
        .update(safety_incidents)
        .set({ ...update, updated_at: _time.now() })
        .where(eq(safety_incidents.id, id))
        .returning();
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findHazardZoneById(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(hazard_zones)
        .where(eq(hazard_zones.id, id))
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updateHazardZone(id: number, data: Row): Promise<Result<Row>> {
    try {
      const update: Partial<typeof hazard_zones.$inferInsert> = {};
      if (data['hazard_level'] != null) update.hazard_level = String(data['hazard_level']);
      if (data['is_active'] != null) update.is_active = Boolean(data['is_active']);
      if (data['required_ppe'] != null) update.required_ppe = String(data['required_ppe']);
      const rows = await db
        .update(hazard_zones)
        .set({ ...update, created_at: _time.now() })
        .where(eq(hazard_zones.id, id))
        .returning();
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findAllIncidents(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select()
        .from(safety_incidents)
        .orderBy(desc(safety_incidents.created_at))
        .limit(100);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }
}
