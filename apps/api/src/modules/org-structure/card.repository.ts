/**
 * @module card.repository
 * @description Data-access for the canonical ORG CARD (`org_functions`). Parametrized SQL
 *   (the org_functions Drizzle schema does not yet carry the Phase-1 card columns; the
 *   org-structure module already mixes raw SQL). All reads filter `deleted_at IS NULL`.
 *   Returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface CardInput {
  positionName?: string;
  positionNameRu?: string | null;
  departmentId?: number | null;
  code?: string | null;
  level?: number | null;
  razryadLevelId?: number | null;
  salaryType?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  rbacTier?: string | null;
  status?: string | null;
  tskp?: string | null;
  tskpTarget?: string | null;
  tskpMeasurementUnit?: string | null;
  statisticsType?: string | null;
  aiExamEnabled?: boolean | null;
}

@Injectable()
export class CardRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  async list(departmentId: number | null, status: string | null): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT f.*, d.name AS department_name
      FROM org_functions f
      LEFT JOIN org_departments d ON d.id = f.department_id
      WHERE f.deleted_at IS NULL
        AND (${departmentId}::int IS NULL OR f.department_id = ${departmentId})
        AND (${status}::text IS NULL OR f.status = ${status})
      ORDER BY f.department_id, f.position_name
    `);
  }

  async findById(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      SELECT f.*, d.name AS department_name
      FROM org_functions f
      LEFT JOIN org_departments d ON d.id = f.department_id
      WHERE f.id = ${id} AND f.deleted_at IS NULL
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async create(dto: CardInput): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      INSERT INTO org_functions
        (position_name, position_name_ru, department_id, code, level, razryad_level_id,
         salary_type, min_salary, max_salary, rbac_tier, status, tskp, tskp_target,
         tskp_measurement_unit, statistics_type, ai_exam_enabled, is_active, created_at, updated_at)
      VALUES
        (${dto.positionName ?? ''}, ${dto.positionNameRu ?? null}, ${dto.departmentId ?? null},
         ${dto.code ?? null}, ${dto.level ?? null}, ${dto.razryadLevelId ?? null},
         ${dto.salaryType ?? null}, ${dto.minSalary ?? null}, ${dto.maxSalary ?? null},
         ${dto.rbacTier ?? null}, ${dto.status ?? 'active'}, ${dto.tskp ?? null},
         ${dto.tskpTarget ?? null}, ${dto.tskpMeasurementUnit ?? null}, ${dto.statisticsType ?? null},
         ${dto.aiExamEnabled ?? false}, true, NOW(), NOW())
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async update(id: number, dto: CardInput): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE org_functions SET
        position_name         = COALESCE(${dto.positionName ?? null}, position_name),
        position_name_ru      = COALESCE(${dto.positionNameRu ?? null}, position_name_ru),
        department_id         = COALESCE(${dto.departmentId ?? null}, department_id),
        code                  = COALESCE(${dto.code ?? null}, code),
        level                 = COALESCE(${dto.level ?? null}, level),
        razryad_level_id      = COALESCE(${dto.razryadLevelId ?? null}, razryad_level_id),
        salary_type           = COALESCE(${dto.salaryType ?? null}, salary_type),
        min_salary            = COALESCE(${dto.minSalary ?? null}, min_salary),
        max_salary            = COALESCE(${dto.maxSalary ?? null}, max_salary),
        rbac_tier             = COALESCE(${dto.rbacTier ?? null}, rbac_tier),
        status                = COALESCE(${dto.status ?? null}, status),
        tskp                  = COALESCE(${dto.tskp ?? null}, tskp),
        tskp_target           = COALESCE(${dto.tskpTarget ?? null}, tskp_target),
        tskp_measurement_unit = COALESCE(${dto.tskpMeasurementUnit ?? null}, tskp_measurement_unit),
        statistics_type       = COALESCE(${dto.statisticsType ?? null}, statistics_type),
        ai_exam_enabled       = COALESCE(${dto.aiExamEnabled ?? null}, ai_exam_enabled),
        updated_at            = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** Soft-delete (EP-ORG-005): set deleted_at + status='archived'. Never hard-DELETE — preserves the 29 FK refs. */
  async softDelete(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE org_functions SET deleted_at = NOW(), status = 'archived', updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, status, deleted_at
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** EP-ORG-002 atomic guard input: how many active employees already occupy this card. */
  async activeOccupantCount(cardId: number): Promise<Result<number>> {
    const r = await this.exec(sql`
      SELECT COUNT(*)::int AS c FROM employees WHERE org_function_id = ${cardId} AND status = 'active'
    `);
    return r.ok ? Ok(Number(r.data[0]?.c ?? 0)) : Err(r.error);
  }
}
