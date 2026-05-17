import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { pip_plans, pip_progress_updates, hrEmployees, hrDepartments } from '@shared/db';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { safeCall, Result } from '@common/result';
type Row = Record<string, unknown>;

@Injectable()
export class PipRepository {
  async createPip(dto: { employeeId: number; createdBy: number; supervisorId?: number; durationDays: number; startDate: string; endDate: string; goals: string; successCriteria?: string }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(pip_plans).values({
        employee_id:      dto.employeeId,
        created_by:       dto.createdBy,
        supervisor_id:    dto.supervisorId ?? null,
        duration_days:    dto.durationDays,
        start_date:       dto.startDate,
        end_date:         dto.endDate,
        goals:            dto.goals,
        success_criteria: dto.successCriteria ?? null,
        status:           'active',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async addProgressUpdate(pipId: number, updatedBy: number, notes: string, status: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(pip_progress_updates).values({
        pip_id:     pipId,
        updated_by: updatedBy,
        notes:      notes,
        status:     status,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getPip(pipId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(pip_plans).where(eq(pip_plans.id, pipId)).limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async markCompleted(pipId: number): Promise<void> {
    await db.update(pip_plans).set({
      status:       'completed',
      completed_at: _time.now(),
      outcome:      'PASSED',
    }).where(eq(pip_plans.id, pipId));
  }

  async markFailed(pipId: number): Promise<void> {
    await db.update(pip_plans).set({
      status:       'failed',
      completed_at: _time.now(),
      outcome:      'FAILED',
    }).where(eq(pip_plans.id, pipId));
  }

  async cancel(pipId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(pip_plans)
        .set({ status: 'cancelled', completed_at: _time.now() })
        .where(eq(pip_plans.id, pipId))
        .returning();
      return castTo<Row>((rows[0] ?? {}));
    }, 'DB_ERROR');
  }

  async updateEndDate(pipId: number, newEndDate: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(pip_plans)
        .set({ end_date: newEndDate })
        .where(eq(pip_plans.id, pipId))
        .returning();
      return castTo<Row>((rows[0] ?? {}));
    }, 'DB_ERROR');
  }

  async acknowledge(pipId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(pip_plans)
        .set({ acknowledged_at: _time.now() })
        .where(eq(pip_plans.id, pipId))
        .returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async getByIdWithEmployee(pipId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT pp.*, e.first_name || ' ' || e.last_name AS employee_name,
               s.first_name || ' ' || s.last_name AS supervisor_name
        FROM pip_plans pp
        JOIN employees e ON e.id = pp.employee_id
        LEFT JOIN employees s ON s.id = pp.supervisor_id
        WHERE pp.id = ${pipId}
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async getProgressUpdates(pipId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(pip_progress_updates)
        .where(eq(pip_progress_updates.pip_id, pipId))
        .orderBy(pip_progress_updates.created_at);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getByEmployee(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT pp.*, s.first_name || ' ' || s.last_name AS supervisor_name
        FROM pip_plans pp
        LEFT JOIN employees s ON s.id = pp.supervisor_id
        WHERE pp.employee_id = ${employeeId}
        ORDER BY pp.created_at DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getActivePips(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT pp.*, e.first_name || ' ' || e.last_name AS employee_name, d.name AS department_name
        FROM pip_plans pp
        JOIN employees e ON e.id = pp.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE pp.status = 'active'
        ORDER BY pp.end_date ASC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async listAll(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT pp.*, e.first_name || ' ' || e.last_name AS employee_name, d.name AS department_name
        FROM pip_plans pp
        JOIN employees e ON e.id = pp.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        ORDER BY pp.created_at DESC
        LIMIT ${MAX_QUERY_LIMIT}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getOverduePips(today: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:          pip_plans.id,
        employee_id: pip_plans.employee_id,
        supervisor_id: pip_plans.supervisor_id,
        end_date:    pip_plans.end_date,
      })
        .from(pip_plans)
        .where(sql`${pip_plans.status} = 'active' AND ${pip_plans.end_date}::date < ${today}::date`);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }
}
