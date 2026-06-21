/**
 * @module approval-steps.repository
 * @description Data-access for approval_request_steps — the persisted, resolved
 *   GORIZONTAL approval chain for a single approval_request. One row per step.
 *   The chain is resolved from workflow_rules at request-creation time
 *   (WorkflowRulesService.resolve) and frozen here as ordered pending steps.
 *   Raw SQL via typedExecute — table is created by the gated
 *   approval-request-steps migration and is not in the Drizzle barrel.
 *   Vision: docs/migration/02-vysotskiy-7-tree.md (GORIZONTAL routing).
 * @layer Infrastructure (Director / Coordination)
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Ok, Result } from '@common/result';

type Row = Record<string, unknown>;

/** One resolved step to persist into approval_request_steps. */
export interface ApprovalStepInput {
  workflow_rule_id?: number | null;
  step_order: number;
  source_department_id?: number | null;
  approver_department_id?: number | null;
  approver_function_id?: number | null;
}

@Injectable()
export class ApprovalStepsRepository {
  /**
   * Persist the ordered resolved chain for one approval request.
   * Empty `steps` → no-op, returns Ok([]) (graceful empty-chain case).
   * All rows are inserted as status='pending' in one multi-row INSERT.
   */
  insertSteps(
    approvalRequestId: number,
    steps: ApprovalStepInput[],
  ): Promise<Result<Row[]>> {
    const ordered = Array.isArray(steps) ? steps : [];
    if (ordered.length === 0) {
      return Promise.resolve(Ok<Row[]>([]));
    }
    return safeCall(async () => {
      const values = ordered.map(
        (s) => sql`(
          ${approvalRequestId},
          ${s.workflow_rule_id ?? null},
          ${s.step_order},
          ${s.source_department_id ?? null},
          ${s.approver_department_id ?? null},
          ${s.approver_function_id ?? null},
          'pending'
        )`,
      );
      const rows = await typedExecute<Row>(sql`
        INSERT INTO approval_request_steps
          (approval_request_id, workflow_rule_id, step_order,
           source_department_id, approver_department_id, approver_function_id, status)
        VALUES ${sql.join(values, sql`, `)}
        ON CONFLICT (approval_request_id, step_order) DO NOTHING
        RETURNING *
      `);
      return Array.isArray(rows) ? rows : [];
    }, 'DB_ERROR');
  }

  /**
   * Look up the creating user's org_department_id (the chain's source dept).
   * Returns Ok(null) when the user has no org department assigned (→ empty chain).
   */
  getUserOrgDepartmentId(userId: number): Promise<Result<number | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ org_department_id: number | null }>(sql`
        SELECT org_department_id FROM users WHERE id = ${userId} LIMIT 1
      `);
      const dept = rows[0]?.org_department_id;
      return dept == null ? null : Number(dept);
    }, 'DB_ERROR');
  }

  /** List the persisted steps for an approval request, ordered by step_order. */
  listByRequest(approvalRequestId: number): Promise<Result<Row[]>> {
    return safeCall(
      async () =>
        typedExecute<Row>(sql`
          SELECT s.id, s.approval_request_id, s.workflow_rule_id, s.step_order,
            s.source_department_id, sd.name AS source_department_name,
            s.approver_department_id, ad.name AS approver_department_name,
            s.approver_function_id, af.position_name AS approver_function_name,
            s.status, s.acted_by_user_id, s.acted_at, s.notes,
            s.created_at, s.updated_at
          FROM approval_request_steps s
          LEFT JOIN org_departments sd ON sd.id = s.source_department_id
          LEFT JOIN org_departments ad ON ad.id = s.approver_department_id
          LEFT JOIN org_functions  af ON af.id = s.approver_function_id
          WHERE s.approval_request_id = ${approvalRequestId}
          ORDER BY s.step_order ASC
        `),
      'DB_ERROR',
    );
  }
}
