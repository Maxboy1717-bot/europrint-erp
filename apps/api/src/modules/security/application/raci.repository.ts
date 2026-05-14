/**
 * @module raci.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql, eq } from 'drizzle-orm';
import { raci_assignments } from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class RaciRepository {
  async listTasks(status: string | null): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT rt.*, e.full_name AS responsible_name
        FROM raci_tasks rt
        LEFT JOIN employees e ON e.id = rt.responsible_id
        WHERE (${status}::text IS NULL OR rt.status = ${status})
        ORDER BY rt.created_at DESC LIMIT 100
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createTask(title: string, description: string | null, responsibleId: number | null, accountableId: number | null, createdBy: number, deadline: string | null): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO raci_tasks (title, description, responsible_id, accountable_id, created_by, deadline, status)
        VALUES (${title}, ${description}, ${responsibleId}, ${accountableId}, ${createdBy}, ${deadline}, 'pending')
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getTaskAssignments(taskId: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT ra.*, e.full_name AS employee_name
        FROM raci_assignments ra
        LEFT JOIN employees e ON e.id = ra.employee_id
        WHERE ra.task_id = ${taskId}
        ORDER BY ra.role ASC
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createAssignment(taskId: number, employeeId: number, role: string): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO raci_assignments (task_id, employee_id, role)
        VALUES (${taskId}, ${employeeId}, ${role})
        ON CONFLICT (task_id, employee_id) DO UPDATE SET role = EXCLUDED.role
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async deleteAssignment(id: number): Promise<Result<void>>  {
  try {  
      await db.delete(raci_assignments).where(eq(raci_assignments.id, id));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getStages(): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`SELECT * FROM raci_stages ORDER BY order_index ASC`);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listCrises(status: string | null): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT cr.*, e.full_name AS reported_by_name
        FROM crisis_records cr
        LEFT JOIN employees e ON e.id = cr.reported_by
        WHERE (${status}::text IS NULL OR cr.status = ${status})
        ORDER BY cr.created_at DESC LIMIT 50
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listAssessments(): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT ra.*, e.full_name AS assessor_name
        FROM risk_assessments ra
        LEFT JOIN employees e ON e.id = ra.assessor_id
        ORDER BY ra.created_at DESC LIMIT 50
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createAssessment(title: string, riskLevel: string, description: string | null, likelihood: number, impact: number, assessorId: number): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO risk_assessments (title, risk_level, description, likelihood, impact, assessor_id, status)
        VALUES (${title}, ${riskLevel}, ${description}, ${likelihood}, ${impact}, ${assessorId}, 'open')
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
