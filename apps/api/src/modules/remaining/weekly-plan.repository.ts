/**
 * @module weekly-plan.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class WeeklyPlanRepository {
  async getStatsSummary(weekStart: string): Promise<Result<Row>>  {
  try {  
      const rowsR = await exec(sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'submitted') AS submitted, COUNT(*) FILTER (WHERE status = 'approved') AS approved, COUNT(*) FILTER (WHERE status = 'draft') AS draft FROM weekly_plans WHERE week_start = ${weekStart}`);
      const rows = rowsR.ok ? rowsR.data : [];
      return Ok((rows[0] ?? { total: 0, submitted: 0, approved: 0, draft: 0 }) as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getAllForManager(weekStart: string): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT * FROM weekly_plans WHERE week_start = ${weekStart} ORDER BY created_at DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getAllForManagerByEmployee(empId: number, weekStart: string): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT * FROM weekly_plans WHERE employee_id = ${empId} AND week_start = ${weekStart} ORDER BY created_at DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getAllForEmployee(userId: number, weekStart: string): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT * FROM weekly_plans WHERE employee_id = ${userId} AND week_start = ${weekStart} ORDER BY created_at DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findExisting(employeeId: number, weekStart: string): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT id FROM weekly_plans WHERE employee_id = ${employeeId} AND week_start = ${weekStart} LIMIT 1`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updatePlan(existingId: unknown, gsdTarget: unknown, top5Tasks: unknown[], body: Row): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE weekly_plans SET gsd_target = ${gsdTarget}, top5_tasks = ${JSON.stringify(top5Tasks)}::jsonb, success_factors = ${body['success_factors'] ?? null}, resources_needed = ${body['resources_needed'] ?? null}, status = 'submitted', updated_at = NOW() WHERE id = ${existingId} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createPlan(employeeId: number, weekStart: string, gsdTarget: unknown, top5Tasks: unknown[], body: Row): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO weekly_plans (employee_id, week_start, gsd_target, top5_tasks, success_factors, resources_needed, status, created_at, updated_at) VALUES (${employeeId}, ${weekStart}, ${gsdTarget}, ${JSON.stringify(top5Tasks)}::jsonb, ${body['success_factors'] ?? null}, ${body['resources_needed'] ?? null}, 'submitted', NOW(), NOW()) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getOne(planId: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT * FROM weekly_plans WHERE id = ${planId} LIMIT 1`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async approve(planId: number, userId: number): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`UPDATE weekly_plans SET status = 'approved', approved_by = ${userId}, approved_at = NOW(), updated_at = NOW() WHERE id = ${planId} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updatePlanById(planId: number, patch: Row): Promise<Result<Row | null>> {
    try {
      const { gsd_target, top5_tasks, success_factors, resources_needed, status } = patch;
      const r = await exec(sql`
        UPDATE weekly_plans
        SET gsd_target       = COALESCE(${gsd_target       ?? null}, gsd_target),
            top5_tasks       = COALESCE(${top5_tasks       != null ? JSON.stringify(top5_tasks) : null}::jsonb, top5_tasks),
            success_factors  = COALESCE(${success_factors  ?? null}, success_factors),
            resources_needed = COALESCE(${resources_needed ?? null}, resources_needed),
            status           = COALESCE(${status           ?? null}, status),
            updated_at       = NOW()
        WHERE id = ${planId}
        RETURNING *
      `);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
    } catch (_e) { return Err(String(_e)); }
  }

  async deletePlan(planId: number): Promise<Result<boolean>> {
    try {
      const check = await exec(sql`SELECT id FROM weekly_plans WHERE id = ${planId} LIMIT 1`);
      if (!check.ok || !check.data[0]) return Ok(false);
      await exec(sql`DELETE FROM weekly_plans WHERE id = ${planId}`);
      return Ok(true);
    } catch (_e) { return Err(String(_e)); }
  }
}
