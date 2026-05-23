/**
 * @module career-path.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { career_paths, career_path_steps, hrEmployees, hrPositions, hrDepartments } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CareerPathRepository {
  async createPath(dto: { employeeId: number; currentPositionId: number; targetPositionId: number; createdBy: number; estimatedMonths: number }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(career_paths).values({
        employeeId:        dto.employeeId,
        currentPositionId: dto.currentPositionId,
        targetPositionId:  dto.targetPositionId,
        createdBy:         dto.createdBy,
        estimatedMonths:   dto.estimatedMonths,
        status:            'active',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async updateStep(stepId: number, pathId: number, isCompleted: boolean): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(career_path_steps).set({
        isCompleted: isCompleted,
        completedAt: isCompleted ? _time.now() : null,
      }).where(sql`${career_path_steps.id} = ${stepId} AND ${career_path_steps.careerPathId} = ${pathId}`).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getPathProgress(pathId: number): Promise<Result<{ total: number; completed: number }>> {
    return safeCall(async () => {
      const r = await db.select({
        total:     sql<string>`COUNT(*)`,
        completed: sql<string>`COUNT(*) FILTER (WHERE ${career_path_steps.isCompleted} = true)`,
      })
        .from(career_path_steps)
        .where(eq(career_path_steps.careerPathId, pathId));
      return {
        total:     parseInt(String(r[0]?.total ?? '0')),
        completed: parseInt(String(r[0]?.completed ?? '0')),
      };
      }, 'DB_ERROR');
  }

  async getPath(pathId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(career_paths).where(eq(career_paths.id, pathId)).limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async updatePathProgress(pathId: number, progress: number): Promise<void> {
    await db.update(career_paths).set({ progressPercent: progress }).where(eq(career_paths.id, pathId));
  }

  async markPathCompleted(pathId: number): Promise<void> {
    await db.update(career_paths).set({ status: 'completed' }).where(eq(career_paths.id, pathId));
  }

  async getByEmployee(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT cp.*, p1.name AS current_position_name, p2.name AS target_position_name
        FROM career_paths cp
        LEFT JOIN positions p1 ON p1.id = cp.current_position_id
        LEFT JOIN positions p2 ON p2.id = cp.target_position_id
        WHERE cp.employee_id = ${employeeId}
        ORDER BY cp.created_at DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getStepsByPath(pathId: unknown): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(career_path_steps)
        .where(eq(career_path_steps.careerPathId, Number(pathId)))
        .orderBy(career_path_steps.stepOrder);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async addStep(pathId: number, dto: { stepOrder: number; positionTitle: string | null; skills: string | null; requiredMonths: number }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(career_path_steps).values({
        careerPathId:   pathId,
        stepOrder:      dto.stepOrder,
        positionTitle:  dto.positionTitle,
        requiredSkills: dto.skills,
        requiredMonths: dto.requiredMonths,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getAll(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT cp.*, e.first_name || ' ' || e.last_name AS employee_name,
               p1.name AS current_position_name, p2.name AS target_position_name
        FROM career_paths cp
        JOIN employees e ON e.id = cp.employee_id
        LEFT JOIN positions p1 ON p1.id = cp.current_position_id
        LEFT JOIN positions p2 ON p2.id = cp.target_position_id
        ORDER BY cp.created_at DESC
        LIMIT 100
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getDepartmentLadder(departmentId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT p.id, p.name,
               COUNT(e.id) AS employee_count,
               COUNT(cp.id) AS employees_with_career_path
        FROM positions p
        LEFT JOIN employees e ON e.position_id = p.id AND e.department_id = ${departmentId}
        LEFT JOIN career_paths cp ON cp.current_position_id = p.id AND cp.status = 'active'
        WHERE p.department_id = ${departmentId}
        GROUP BY p.id, p.name
        ORDER BY employee_count DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getActivePathsForMonthlyCheck(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:              career_paths.id,
        employeeId:      career_paths.employeeId,
        progressPercent: career_paths.progressPercent,
        estimatedMonths: career_paths.estimatedMonths,
        monthsElapsed:   sql<number>`EXTRACT(MONTH FROM AGE(NOW(), ${career_paths.createdAt}))`,
      })
        .from(career_paths)
        .where(sql`${career_paths.status} = 'active'`);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }
}
