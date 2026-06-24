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
  functionDescription?: string | null;
  functionDescriptionRu?: string | null;
}

@Injectable()
export class CardRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  /** EP-ORG-137 staleness flag: a card with no review, or reviewed > 1 year ago, is stale. */
  private readonly staleExpr = sql`(f.last_reviewed_at IS NULL OR f.last_reviewed_at < now() - interval '1 year')`;

  async list(departmentId: number | null, status: string | null): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT f.*, d.name AS department_name, ${this.staleExpr} AS is_stale
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
      SELECT f.*, d.name AS department_name, ${this.staleExpr} AS is_stale
      FROM org_functions f
      LEFT JOIN org_departments d ON d.id = f.department_id
      WHERE f.id = ${id} AND f.deleted_at IS NULL
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * Vizyon (Vysotskiy 7 vertikal): kartaning boshqaruvchisini (manager_id = keyingi yuqori karta)
   * belgilash. manager_id ustuni o'qilardi (Farzandlar tab) lekin hech qayerda SET qilinmasdi.
   * Sikl-himoya: boshqaruvchi o'zi YOKI quyi (farzand) karta bo'la olmaydi (rekursiv tekshiruv).
   */
  async setCardManager(cardId: number, managerId: number | null): Promise<Result<Row | null>> {
    if (managerId !== null) {
      if (managerId === cardId) return Err("Karta o'zini boshqara olmaydi");
      const sub = await this.exec(sql`
        WITH RECURSIVE descendants AS (
          SELECT id FROM org_functions WHERE id = ${cardId}
          UNION ALL
          SELECT f.id FROM org_functions f JOIN descendants dd ON f.manager_id = dd.id
        )
        SELECT 1 AS hit FROM descendants WHERE id = ${managerId} LIMIT 1
      `);
      if (!sub.ok) return Err(sub.error);
      if (sub.data.length > 0) return Err("Sikl: boshqaruvchi quyi (farzand) karta bo'la olmaydi");
    }
    const r = await this.exec(sql`
      UPDATE org_functions SET manager_id = ${managerId}, updated_at = now()
      WHERE id = ${cardId} AND deleted_at IS NULL
      RETURNING id, position_name, manager_id
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** Boshqaruvchi-nomzodlar: o'zidan va quyi (farzand) kartalardan tashqari barcha faol kartalar. */
  async listManagerCandidates(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      WITH RECURSIVE descendants AS (
        SELECT id FROM org_functions WHERE id = ${cardId}
        UNION ALL
        SELECT f.id FROM org_functions f JOIN descendants dd ON f.manager_id = dd.id
      )
      SELECT f.id, f.position_name, f.code, f.level
      FROM org_functions f
      WHERE f.deleted_at IS NULL AND f.id NOT IN (SELECT id FROM descendants)
      ORDER BY f.level NULLS LAST, f.position_name
    `);
  }

  async create(dto: CardInput): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      INSERT INTO org_functions
        (position_name, position_name_ru, department_id, code, level, razryad_level_id,
         salary_type, min_salary, max_salary, rbac_tier, status, tskp, tskp_target,
         tskp_measurement_unit, statistics_type, ai_exam_enabled,
         function_description, function_description_ru,
         is_active, created_at, updated_at)
      VALUES
        (${dto.positionName ?? ''}, ${dto.positionNameRu ?? null}, ${dto.departmentId ?? null},
         ${dto.code ?? null}, ${dto.level ?? null}, ${dto.razryadLevelId ?? null},
         ${dto.salaryType ?? null}, ${dto.minSalary ?? null}, ${dto.maxSalary ?? null},
         ${dto.rbacTier ?? null}, ${dto.status ?? 'active'}, ${dto.tskp ?? null},
         ${dto.tskpTarget ?? null}, ${dto.tskpMeasurementUnit ?? null}, ${dto.statisticsType ?? null},
         ${dto.aiExamEnabled ?? false},
         ${dto.functionDescription ?? null}, ${dto.functionDescriptionRu ?? null},
         true, NOW(), NOW())
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
        function_description    = COALESCE(${dto.functionDescription ?? null}, function_description),
        function_description_ru = COALESCE(${dto.functionDescriptionRu ?? null}, function_description_ru),
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
   * EP-ORG-002 atomic guard input: how many SUBSTANTIVE active employees occupy this card.
   * Phase 6: counts via the canonical M:N link `employee_cards` (not the org_function_id mirror).
   * Phase 7 (D2): EXCLUDES i.o./acting occupants (an i.o. does not consume the single substantive
   * seat) + on-read revert guard (an expired acting/dated link no longer counts).
   */
  async activeOccupantCount(cardId: number): Promise<Result<number>> {
    const r = await this.exec(sql`
      SELECT COUNT(*)::int AS c FROM employee_cards
      WHERE card_id = ${cardId} AND is_active
        AND COALESCE(is_acting, false) = false
        AND (ended_at IS NULL OR ended_at > now())
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
      SELECT e.id, e.first_name, e.last_name, COALESCE(e.status,'active') AS status,
             ec.is_primary, COALESCE(ec.is_acting, false) AS is_acting, ec.acting_supplement, ec.ended_at,
             COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
             (SELECT COALESCE(SUM(CASE WHEN COALESCE(ec2.is_acting,false) THEN 0 ELSE COALESCE(f2.max_salary,0) END),0)
                   + COALESCE(SUM(CASE WHEN ec2.is_acting THEN COALESCE(ec2.acting_supplement,0) ELSE 0 END),0)
                FROM employee_cards ec2 JOIN org_functions f2 ON f2.id = ec2.card_id
               WHERE ec2.employee_id = e.id AND ec2.is_active
                 AND (ec2.ended_at IS NULL OR ec2.ended_at > now()) AND f2.deleted_at IS NULL) AS total_salary
      FROM employee_cards ec
      JOIN employees e ON e.id = ec.employee_id
      WHERE ec.card_id = ${cardId} AND ec.is_active AND (ec.ended_at IS NULL OR ec.ended_at > now())
      ORDER BY ec.is_primary DESC, ec.is_acting, e.last_name, e.first_name
    `);
  }

  /**
   * Karta↔xodim moslik (fit) — deterministik v1. Vizyon: "karta xodim↔karta mosligini baholaydi".
   * Mavjud REAL signallardan hisoblaydi (fabrikatsiyasiz): biriktirish sifati (primary/acting) +
   * karta-ta'rif to'liqligi (razryad belgilangan + portret-talablar to'ldirilgan). AI-kalit / imtihon
   * (ai_exam_attempts) kelganda komponent qo'shiladi — score boyitiladi. Hozir 0 imtihon bor.
   */
  async computeCardFit(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT e.id AS employee_id,
             COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
             ec.is_primary, COALESCE(ec.is_acting,false) AS is_acting,
             (CASE WHEN COALESCE(ec.is_acting,false) THEN 50 WHEN ec.is_primary THEN 100 ELSE 70 END)::int AS assignment_score,
             (CASE WHEN f.razryad_level_id IS NOT NULL THEN 50 ELSE 0 END
              + CASE WHEN COALESCE(NULLIF(TRIM(p.portret_data->>'requirements'),''),'') <> '' THEN 50 ELSE 0 END)::int AS definition_score,
             (f.razryad_level_id IS NOT NULL) AS razryad_set,
             (COALESCE(NULLIF(TRIM(p.portret_data->>'requirements'),''),'') <> '') AS requirements_set
      FROM employee_cards ec
      JOIN employees e ON e.id = ec.employee_id
      JOIN org_functions f ON f.id = ec.card_id
      LEFT JOIN org_node_portret p ON p.card_id = f.id
      WHERE ec.card_id = ${cardId} AND ec.is_active AND (ec.ended_at IS NULL OR ec.ended_at > now())
      ORDER BY ec.is_primary DESC, ec.is_acting, e.last_name
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

  /** Vakant tab: vacancies opened for this card + priority + aging bucket (EP-ORG-072/073). */
  async listVacancies(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT id, title, status, priority, number_of_positions, open_positions, closing_date, created_at,
             (now()::date - created_at::date) AS aging_days,
             CASE WHEN (now()::date - created_at::date) <= 14 THEN '0-14'
                  WHEN (now()::date - created_at::date) <= 45 THEN '15-45'
                  ELSE '45+' END AS aging_bucket
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

  /**
   * Assign an employee to a card (M:N). Service guards substantive assigns with canAssignEmployee.
   * Phase 7: an acting (i.o.) assignment carries isActing + acting_supplement + ended_at (revert date).
   * Idempotent on the active (employee_id, card_id) pair.
   */
  async assignEmployee(
    cardId: number, employeeId: number, isPrimary: boolean,
    isActing = false, actingSupplement: number | null = null, endedAt: string | null = null,
  ): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      INSERT INTO employee_cards
        (employee_id, card_id, is_primary, is_active, is_acting, acting_supplement, assigned_at, ended_at, created_at, updated_at)
      VALUES
        (${employeeId}, ${cardId}, ${isPrimary}, true, ${isActing}, ${actingSupplement}, NOW(), ${endedAt}::timestamptz, NOW(), NOW())
      ON CONFLICT (employee_id, card_id) WHERE is_active DO NOTHING
      RETURNING id, employee_id, card_id, is_primary, is_acting
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

  /**
   * An employee's active cards + each card's max_salary (the FORMULA-A components).
   * Phase 7: includes the acting flag + supplement per link; an acting card's effective contribution
   * = its acting_supplement (own salary is its substantive card). On-read revert guard excludes expired links.
   */
  async listEmployeeCards(employeeId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT ec.card_id, ec.is_primary, COALESCE(ec.is_acting, false) AS is_acting,
             ec.acting_supplement, ec.ended_at, f.position_name, f.code, f.max_salary,
             -- effective contribution to FORMULA A: acting card → supplement only; substantive → max_salary
             (CASE WHEN COALESCE(ec.is_acting,false) THEN COALESCE(ec.acting_supplement,0) ELSE COALESCE(f.max_salary,0) END) AS card_salary
      FROM employee_cards ec
      JOIN org_functions f ON f.id = ec.card_id
      WHERE ec.employee_id = ${employeeId} AND ec.is_active
        AND (ec.ended_at IS NULL OR ec.ended_at > now()) AND f.deleted_at IS NULL
      ORDER BY ec.is_primary DESC, ec.is_acting, f.position_name
    `);
  }

  /**
   * FORMULA A (EP-ORG-142/061): employee profile total = "own + supplement", no cap.
   *   own        = SUM of the employee's SUBSTANTIVE (non-acting) cards' max_salary;
   *   supplement = SUM of acting_supplement for i.o./acting links (the i.o. earns the SUPPLEMENT only,
   *                NOT the acting card's full salary — that seat belongs to its substantive holder).
   * On-read revert guard (EP-ORG-060): expired dated links drop out automatically. COALESCE NULL→0.
   */
  async employeeSalaryTotal(employeeId: number): Promise<Result<number>> {
    const r = await this.exec(sql`
      SELECT ( COALESCE(SUM(CASE WHEN COALESCE(ec.is_acting,false) THEN 0 ELSE COALESCE(f.max_salary,0) END), 0)
             + COALESCE(SUM(CASE WHEN ec.is_acting THEN COALESCE(ec.acting_supplement,0) ELSE 0 END), 0) )::numeric AS total
      FROM employee_cards ec JOIN org_functions f ON f.id = ec.card_id
      WHERE ec.employee_id = ${employeeId} AND ec.is_active
        AND (ec.ended_at IS NULL OR ec.ended_at > now()) AND f.deleted_at IS NULL
    `);
    return r.ok ? Ok(Number(r.data[0]?.total ?? 0)) : Err(r.error);
  }

  /**
   * EP-ORG-047 cert-in-card: certificates earned by the card's active occupants + a 30-day expiry flag.
   * Reuses the canonical `certificates` table (no new cert table, C6). Occupants via employee_cards (M:N).
   */
  async listCertificates(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT c.id, c.name, c.certificate_number, c.issued_date, c.expiry_date,
             e.id AS employee_id,
             COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name,
             (c.expiry_date IS NOT NULL AND c.expiry_date <= (now()::date + 30)) AS expiring_soon
      FROM employee_cards ec
      JOIN employees e   ON e.id = ec.employee_id
      JOIN certificates c ON c.employee_id = e.id
      WHERE ec.card_id = ${cardId} AND ec.is_active AND COALESCE(c.is_active, true) = true
      ORDER BY c.expiry_date NULLS LAST, c.issued_date DESC NULLS LAST
    `);
  }

  // ─── Phase 7: card staleness (EP-ORG-137) + acting auto-revert (EP-ORG-060) ──

  /** EP-ORG-137: stamp last_reviewed_at = NOW() (resets the 1-year staleness clock). 404 if the card is gone. */
  async markReviewed(cardId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE org_functions SET last_reviewed_at = NOW(), updated_at = NOW()
      WHERE id = ${cardId} AND deleted_at IS NULL
      RETURNING id, last_reviewed_at
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * EP-ORG-060 acting auto-revert (cron housekeeping mirror): physically deactivate acting links whose
   * end date has passed. The on-read guard already excludes them from sums/occupancy; this keeps rows tidy.
   * Returns the number of links reverted.
   */
  async revertExpiredActing(): Promise<Result<number>> {
    const r = await this.exec(sql`
      UPDATE employee_cards SET is_active = false, updated_at = NOW()
      WHERE is_acting = true AND is_active = true AND ended_at IS NOT NULL AND ended_at <= now()
      RETURNING id
    `);
    return r.ok ? Ok(r.data.length) : Err(r.error);
  }

  // ─── Card-level Portret (org_node_portret, card_id-keyed) ────────────────────

  /**
   * Read a card's portret row (org_node_portret keyed by card_id; node_id is NULL for card rows).
   * Returns null when the card has no portret yet.
   */
  async getCardPortret(cardId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      SELECT * FROM org_node_portret WHERE card_id = ${cardId} LIMIT 1
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * Manual upsert of a card's portret (SELECT-then-write — does NOT rely on ON CONFLICT predicate
   * inference over the partial unique index). A card row = node_id NULL + card_id set + portret_data jsonb.
   */
  async saveCardPortret(
    cardId: number,
    portretData: Record<string, unknown>,
    creatorId: number | null,
  ): Promise<Result<Row | null>> {
    const existing = await this.getCardPortret(cardId);
    if (!existing.ok) return existing;

    if (existing.data) {
      const r = await this.exec(sql`
        UPDATE org_node_portret
           SET portret_data = ${sql`${JSON.stringify(portretData)}::jsonb`},
               updated_at   = NOW()
         WHERE card_id = ${cardId}
        RETURNING *
      `);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
    }

    const r = await this.exec(sql`
      INSERT INTO org_node_portret (card_id, node_id, portret_data, creator_id, created_at, updated_at)
      VALUES (${cardId}, NULL, ${sql`${JSON.stringify(portretData)}::jsonb`}, ${creatorId}, NOW(), NOW())
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  // ─── EP-ORG-003 card-gate (RBAC + salary from the card) ─────────────────────

  /**
   * The card-gate for a user: their card (org_functions via users.org_function_id), the card-derived
   * RBAC tier, and salary eligibility (an active employee_cards link). Read-only, non-blocking — the
   * card-LESS case is FLAGGED (principle 1: AI flags → human decides), NOT a login block (login is
   * never gated here, so the admin/owner can never be locked out).
   */
  async resolveGate(userId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      SELECT u.id AS user_id, u.username, u.role,
             u.org_function_id AS card_id, ofn.position_name AS card_name, ofn.rbac_tier AS rbac_tier,
             (u.org_function_id IS NOT NULL AND ofn.id IS NOT NULL) AS has_card,
             EXISTS (SELECT 1 FROM employees e JOIN employee_cards ec ON ec.employee_id = e.id
                     WHERE e.user_id = u.id AND ec.is_active
                       AND (ec.ended_at IS NULL OR ec.ended_at > now())) AS salary_eligible
      FROM users u
      LEFT JOIN org_functions ofn ON ofn.id = u.org_function_id AND ofn.deleted_at IS NULL
      WHERE u.id = ${userId}
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }
}
