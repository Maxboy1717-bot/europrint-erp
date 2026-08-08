/**
 * @module workflow-rules.repository
 * @description Data-access for workflow_rules (Vysotskiy-7 GORIZONTAL routing config).
 *   One row per step in an approval chain; a chain = (request_type,
 *   source_department_id) ordered by step_order. Raw SQL via typedExecute —
 *   table is created by the gated workflow-rules-2026-06-20 migration and is not
 *   in the Drizzle barrel. Vision: docs/migration/02-vysotskiy-7-tree.md:151-156.
 * @layer Infrastructure (Director / Coordination)
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

export interface WorkflowRuleInput {
  request_type?: string;
  name?: string | null;
  source_department_id?: number | null;
  source_function_id?: number | null;
  step_order?: number | null;
  approver_department_id?: number | null;
  approver_function_id?: number | null;
  is_active?: boolean | null;
}

export interface WorkflowRuleFilters {
  request_type?: string | null;
  source_department_id?: number | null;
  is_active?: boolean | null;
}

@Injectable()
export class WorkflowRulesRepository {
  /** List rules (optional filters), ordered into chains then steps, with readable dept/function names. */
  list(f: WorkflowRuleFilters): Promise<Result<Row[]>> {
    return safeCall(
      async () =>
        typedExecute<Row>(sql`
          SELECT wr.*,
            sd.name AS source_department_name,
            ad.name AS approver_department_name,
            sf.position_name AS source_function_name,
            af.position_name AS approver_function_name
          FROM workflow_rules wr
          LEFT JOIN org_departments sd ON sd.id = wr.source_department_id
          LEFT JOIN org_departments ad ON ad.id = wr.approver_department_id
          LEFT JOIN org_functions  sf ON sf.id = wr.source_function_id
          LEFT JOIN org_functions  af ON af.id = wr.approver_function_id
          WHERE (${f.request_type ?? null}::text IS NULL OR wr.request_type = ${f.request_type ?? null})
            AND (${f.source_department_id ?? null}::int IS NULL OR wr.source_department_id = ${f.source_department_id ?? null}::int)
            AND (${f.is_active ?? null}::boolean IS NULL OR wr.is_active = ${f.is_active ?? null}::boolean)
          ORDER BY wr.request_type ASC, wr.source_department_id ASC NULLS FIRST, wr.step_order ASC
        `),
      'DB_ERROR',
    );
  }

  /** Resolve the ordered active approval chain for (request_type, source_department_id). */
  resolve(requestType: string, sourceDepartmentId: number): Promise<Result<Row[]>> {
    return safeCall(
      async () =>
        typedExecute<Row>(sql`
          SELECT wr.id, wr.request_type, wr.name, wr.step_order,
            wr.source_department_id, sd.name AS source_department_name,
            wr.source_function_id, sf.position_name AS source_function_name,
            wr.approver_department_id, ad.name AS approver_department_name,
            wr.approver_function_id, af.position_name AS approver_function_name
          FROM workflow_rules wr
          LEFT JOIN org_departments sd ON sd.id = wr.source_department_id
          LEFT JOIN org_functions  sf ON sf.id = wr.source_function_id
          LEFT JOIN org_departments ad ON ad.id = wr.approver_department_id
          LEFT JOIN org_functions  af ON af.id = wr.approver_function_id
          WHERE wr.request_type = ${requestType}
            AND wr.source_department_id = ${sourceDepartmentId}
            AND wr.is_active = TRUE
          ORDER BY wr.step_order ASC
        `),
      'DB_ERROR',
    );
  }

  getById(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<Row>(sql`SELECT * FROM workflow_rules WHERE id = ${id}`);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  create(dto: WorkflowRuleInput): Promise<Result<Row>> {
    return safeCall(async () => {
      if (!dto.request_type) throw new Error('request_type required');
      const rows = await typedExecute<Row>(sql`
        INSERT INTO workflow_rules
          (request_type, name, source_department_id, source_function_id,
           step_order, approver_department_id, approver_function_id, is_active)
        VALUES
          (${dto.request_type}, ${dto.name ?? null},
           ${dto.source_department_id ?? null}, ${dto.source_function_id ?? null},
           ${dto.step_order ?? 1},
           ${dto.approver_department_id ?? null}, ${dto.approver_function_id ?? null},
           ${dto.is_active ?? true})
        RETURNING *
      `);
      if (!rows[0]) throw new Error('INSERT_FAILED');
      return rows[0];
    }, 'DB_ERROR');
  }

  /** Partial update (COALESCE keeps unset fields; cannot null-out a column by design). */
  update(id: number, dto: WorkflowRuleInput): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<Row>(sql`
        UPDATE workflow_rules SET
          request_type           = COALESCE(${dto.request_type ?? null}, request_type),
          name                   = COALESCE(${dto.name ?? null}, name),
          source_department_id   = COALESCE(${dto.source_department_id ?? null}::int, source_department_id),
          source_function_id     = COALESCE(${dto.source_function_id ?? null}::int, source_function_id),
          step_order             = COALESCE(${dto.step_order ?? null}::int, step_order),
          approver_department_id = COALESCE(${dto.approver_department_id ?? null}::int, approver_department_id),
          approver_function_id   = COALESCE(${dto.approver_function_id ?? null}::int, approver_function_id),
          is_active              = COALESCE(${dto.is_active ?? null}::boolean, is_active),
          updated_at             = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  softDelete(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<Row>(sql`
        UPDATE workflow_rules SET is_active = FALSE, updated_at = NOW()
        WHERE id = ${id} RETURNING id
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }
}
