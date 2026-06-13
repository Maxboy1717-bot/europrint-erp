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

  /**
   * EP-ORG-002 atomic guard input: how many ACTIVE employees occupy this card.
   * Phase 6: counts via the canonical M:N link `employee_cards` (not the org_function_id mirror),
   * so multi-card assignments are reflected. Variant C — the ≤1 rule is enforced here (app layer).
   */
  async activeOccupantCount(cardId: number): Promise<Result<number>> {
    const r = await this.exec(sql`
      SELECT COUNT(*)::int AS c FROM employee_cards WHERE card_id = ${cardId} AND is_active
    `);
    return r.ok ? Ok(Number(r.data[0]?.c ?? 0)) : Err(r.error);
  }

  // ─── Phase 5 card-detail tabs (read-only related data) ─────────────────────

  /**
   * Xodimlar tab: a card's active occupants (Phase 6 — via the canonical `employee_cards` M:N link)
   * plus each occupant's FORMULA-A total salary (SUM of all their active cards' max_salary, EP-ORG-142).
   */
  async listEmployees(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT e.id, e.first_name, e.last_name, COALESCE(e.status,'active') AS status, ec.is_primary,
             COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
             (SELECT COALESCE(SUM(COALESCE(f2.max_salary,0)),0)
                FROM employee_cards ec2 JOIN org_functions f2 ON f2.id = ec2.card_id
               WHERE ec2.employee_id = e.id AND ec2.is_active AND f2.deleted_at IS NULL) AS total_salary
      FROM employee_cards ec
      JOIN employees e ON e.id = ec.employee_id
      WHERE ec.card_id = ${cardId} AND ec.is_active
      ORDER BY ec.is_primary DESC, e.last_name, e.first_name
    `);
  }

  /** Farzandlar tab: child cards (manager_id = this card, EP-ORG-021). */
  async listChildren(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT id, position_name, code, level, status
      FROM org_functions WHERE manager_id = ${cardId} AND deleted_at IS NULL
      ORDER BY level NULLS LAST, position_name
    `);
  }

  /** Vakant tab: vacancies opened for this card. */
  async listVacancies(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT id, title, status, number_of_positions, open_positions, created_at
      FROM vacancies WHERE org_function_id = ${cardId} AND deleted_at IS NULL
      ORDER BY created_at DESC NULLS LAST
    `);
  }

  /** Tarix tab: card change history from the audit log (AuditInterceptor tags CardController as 'card'). */
  async listHistory(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT id, action, user_full_name, reason, changed_fields, created_at
      FROM audit_logs WHERE table_name = 'card' AND record_id = ${String(cardId)}
      ORDER BY created_at DESC NULLS LAST LIMIT 50
    `);
  }

  // ─── Phase 6: employee↔card M:N (employee_cards) + FORMULA A salary ─────────

  /** Assign an employee to a card (M:N). Service guards with canAssignEmployee first. Idempotent on active link. */
  async assignEmployee(cardId: number, employeeId: number, isPrimary: boolean): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      INSERT INTO employee_cards (employee_id, card_id, is_primary, is_active, assigned_at, created_at, updated_at)
      VALUES (${employeeId}, ${cardId}, ${isPrimary}, true, NOW(), NOW(), NOW())
      ON CONFLICT (employee_id, card_id) WHERE is_active DO NOTHING
      RETURNING id, employee_id, card_id, is_primary
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** Soft-remove an employee from a card; returns the removed link (incl. was-primary) or null if none active. */
  async unassignEmployee(cardId: number, employeeId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE employee_cards SET is_active = false, ended_at = NOW(), updated_at = NOW()
      WHERE card_id = ${cardId} AND employee_id = ${employeeId} AND is_active
      RETURNING id, is_primary
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** Mirror sync: mark one card primary in employee_cards + set employees.org_function_id (back-compat, Q-39). */
  async setPrimaryCard(employeeId: number, cardId: number): Promise<Result<Row[]>> {
    const a = await this.exec(sql`
      UPDATE employee_cards SET is_primary = (card_id = ${cardId}), updated_at = NOW()
      WHERE employee_id = ${employeeId} AND is_active
    `);
    if (!a.ok) return a;
    return this.exec(sql`UPDATE employees SET org_function_id = ${cardId} WHERE id = ${employeeId}`);
  }

  /** When the primary card is unassigned: repoint the org_function_id mirror to another active card (or NULL). */
  async repointPrimaryMirror(employeeId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      UPDATE employees SET org_function_id = (
        SELECT card_id FROM employee_cards
        WHERE employee_id = ${employeeId} AND is_active
        ORDER BY is_primary DESC, assigned_at DESC LIMIT 1
      ) WHERE id = ${employeeId}
    `);
  }

  /** An employee's active cards + each card's max_salary (the FORMULA-A components). */
  async listEmployeeCards(employeeId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT ec.card_id, ec.is_primary, f.position_name, f.code,
             f.max_salary, COALESCE(f.max_salary, 0) AS card_salary
      FROM employee_cards ec
      JOIN org_functions f ON f.id = ec.card_id
      WHERE ec.employee_id = ${employeeId} AND ec.is_active AND f.deleted_at IS NULL
      ORDER BY ec.is_primary DESC, f.position_name
    `);
  }

  /** FORMULA A (EP-ORG-142): employee profile total = SUM of active cards' max_salary (full, no cap, COALESCE 0). */
  async employeeSalaryTotal(employeeId: number): Promise<Result<number>> {
    const r = await this.exec(sql`
      SELECT COALESCE(SUM(COALESCE(f.max_salary, 0)), 0)::numeric AS total
      FROM employee_cards ec JOIN org_functions f ON f.id = ec.card_id
      WHERE ec.employee_id = ${employeeId} AND ec.is_active AND f.deleted_at IS NULL
    `);
    return r.ok ? Ok(Number(r.data[0]?.total ?? 0)) : Err(r.error);
  }
}
