/**
 * @module zvs.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import type { IZvsRepo, ZvsMatrixRow, ZvsOrgChainStep } from '../../domain/repositories/i-zvs.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ZvsRepository implements IZvsRepo {
  async createZvs(departmentId: number | null, submittedBy: number, submitterName: string | null, amount: number, purpose: string, priority: string, weekDate: string, level: number): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO zvs (department_id, submitted_by, submitter_name, amount, purpose, priority, week_date, level, status) VALUES (${departmentId}, ${submittedBy}, ${submitterName}, ${amount}, ${purpose}, ${priority}, ${weekDate}, ${level}, 'pending') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listZvs(status: string | null, weekDate: string | null, departmentId: number | null): Promise<Result<Row[]>>  {
  try {
      return status && weekDate && departmentId
        ? exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} AND z.week_date = ${weekDate}::date AND z.department_id = ${departmentId} ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : status && weekDate
        ? exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} AND z.week_date = ${weekDate}::date ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : status && departmentId
        ? exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} AND z.department_id = ${departmentId} ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : status
        ? exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findById(id: number): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT * FROM zvs WHERE id = ${id} LIMIT 1`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async approveZvs(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`UPDATE zvs SET status = 'approved', reviewed_by = ${reviewedBy}, reviewed_at = NOW(), comment = ${comment} WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? { message: 'Tasdiqlandi' }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async rejectZvs(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`UPDATE zvs SET status = 'rejected', reviewed_by = ${reviewedBy}, reviewed_at = NOW(), comment = ${comment} WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? { message: 'Rad etildi' }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  /** 2.15: sozlanadigan summa-chegaralar — approval_matrix_config, document_type='zvs', faqat faol qatorlar. */
  async getZvsApprovalMatrix(): Promise<Result<ZvsMatrixRow[]>> {
    try {
      const r = await exec(sql`
        SELECT min_amount, max_amount, approval_level, approver_role
        FROM approval_matrix_config
        WHERE document_type = 'zvs' AND is_active = true
        ORDER BY min_amount ASC
      `);
      if (!r.ok) return Err(r.error);
      const rows: ZvsMatrixRow[] = r.data.map((row) => ({
        minAmount: Number(row['min_amount']),
        maxAmount: row['max_amount'] == null ? null : Number(row['max_amount']),
        approvalLevel: Number(row['approval_level']),
        approverRole: String(row['approver_role'] ?? ''),
      }));
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  /** 2.15: so'rov beruvchining birlamchi org-bo'limi (employee_org_departments.user_id). */
  async findOrgDepartmentForSubmitter(submittedByUserId: number): Promise<Result<number | null>> {
    try {
      const r = await exec(sql`
        SELECT org_department_id
        FROM employee_org_departments
        WHERE user_id = ${submittedByUserId} AND org_department_id IS NOT NULL
        ORDER BY is_primary DESC NULLS LAST, assigned_at ASC
        LIMIT 1
      `);
      if (!r.ok) return Err(r.error);
      const row = r.data[0];
      return Ok(row ? Number(row['org_department_id']) : null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  /**
   * 2.15: org-sxema bo'yicha yuqoriga (root/direktorgacha) tasdiq zanjiri — bir modul ichida
   * o'z SQL'i bilan hisoblanadi (ProcurementApprovalChainService pos-modulida, modul-chegara
   * import qilinmaydi — docs/MODUL_SHARTNOMASI). Naqsh procurement-approval-chain.service.ts
   * bilan bir xil: org_departments.parent_id RECURSIVE, head_user_id = tasdiqlovchi,
   * ketma-ket dublikat approver bir marta qoldiriladi.
   */
  async resolveOrgChainForDepartment(orgDepartmentId: number, excludeUserId?: number): Promise<Result<ZvsOrgChainStep[]>> {
    try {
      const r = await exec(sql`
        WITH RECURSIVE chain AS (
          SELECT id, parent_id, head_user_id, 0 AS depth
          FROM org_departments
          WHERE id = ${orgDepartmentId}
          UNION ALL
          SELECT o.id, o.parent_id, o.head_user_id, c.depth + 1
          FROM org_departments o
          JOIN chain c ON o.id = c.parent_id
        )
        SELECT c.id::int AS org_department_id, c.head_user_id::int AS approver_user_id, c.depth::int AS depth
        FROM chain c
        WHERE c.head_user_id IS NOT NULL
        ORDER BY c.depth ASC
      `);
      if (!r.ok) return Err(r.error);
      const steps: ZvsOrgChainStep[] = r.data
        .map((row) => ({
          depth: Number(row['depth']),
          orgDepartmentId: Number(row['org_department_id']),
          approverUserId: Number(row['approver_user_id']),
        }))
        .filter((s) => s.approverUserId && s.approverUserId !== excludeUserId);
      const deduped: ZvsOrgChainStep[] = [];
      for (const s of steps) {
        if (deduped.length === 0 || deduped[deduped.length - 1].approverUserId !== s.approverUserId) {
          deduped.push(s);
        }
      }
      return Ok(deduped);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
