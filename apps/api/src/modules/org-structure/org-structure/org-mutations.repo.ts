/**
 * @module org-structure/org-mutations.repo
 * @description Create/update/deactivate/move/assignUser mutations.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Cross-module UPDATE against the `users` table (department_id sync) which
 *     belongs to the auth module's schema, not org-structure's — using sql
 *     preserves repository boundary while propagating the assignment
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db, runQuery } from '@shared/db';
import { eq, sql, and } from 'drizzle-orm';
import { orgDepartments, employeeOrgDepartments } from '@shared/db';
import { safeCall, Result } from '@common/result';
import { syncToCoreTable } from './sync-helper';

type Row = Record<string, unknown>;

@Injectable()
export class OrgMutationsRepo {
  async create(dto: Record<string, unknown>, level: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(orgDepartments)
        .values({
          name: dto.name as string,
          name_ru: (dto.nameRu as string) ?? null,
          description: (dto.description as string) ?? null,
          description_ru: (dto.descriptionRu as string) ?? null,
          color: (dto.color as string) ?? '#3b82f6',
          tskp: (dto.tskp as string) ?? null,
          tskp_ru: (dto.tskpRu as string) ?? null,
          parent_id: (dto.parentId as number) ?? null,
          level,
          node_type: (dto.nodeType as string) ?? 'department',
          sort_order: (dto.sortOrder as number) ?? 0,
        })
        .returning();

      // Unit fields (org-unit-fields-2026-06-19 migration — CHAT-TARIXI Bo'lim→Sex→Uskuna→Ishchi).
      // RULE4_EXCEPTION: the backend `orgDepartments` Drizzle definition (schema-misc-app-a.ts —
      // NOT an owned file) does not declare these columns, so they are written via parametrized
      // sql template after the insert. ARCHITECTURE_RULES.md Rule 4: raw SQL permitted + documented.
      const withUnit = await this.applyUnitFields(Number((row as Row).id), dto);

      await syncToCoreTable((withUnit ?? row) as Row, 'create');
      return castTo<Record<string, unknown>>(withUnit ?? row);
    }, 'DB_ERROR');
  }

  /**
   * Writes org-unit fields (code/qym_uz/qym_ru/camera_zone_id/telegram_group_id) to a row.
   * Only updates the keys present in `dto`. Returns the refreshed row, or null when no unit
   * key was supplied (caller keeps the original row). Parametrized sql — no injection.
   */
  private async applyUnitFields(id: number, dto: Record<string, unknown>): Promise<Row | null> {
    const sets: ReturnType<typeof sql>[] = [];
    if (dto.code !== undefined)            sets.push(sql`code = ${(dto.code as string) ?? null}`);
    if (dto.qymUz !== undefined)           sets.push(sql`qym_uz = ${(dto.qymUz as string) ?? null}`);
    if (dto.qymRu !== undefined)           sets.push(sql`qym_ru = ${(dto.qymRu as string) ?? null}`);
    if (dto.cameraZoneId !== undefined)    sets.push(sql`camera_zone_id = ${(dto.cameraZoneId as string) ?? null}`);
    if (dto.telegramGroupId !== undefined) sets.push(sql`telegram_group_id = ${(dto.telegramGroupId as string) ?? null}`);
    if (dto.razryadLevelId !== undefined)  sets.push(sql`razryad_level_id = ${(dto.razryadLevelId as number) ?? null}`);
    // VISION (egasi 2026-06-24): node=karta — to'liq karta-maydonlari
    if (dto.salaryType !== undefined)        sets.push(sql`salary_type = ${(dto.salaryType as string) ?? null}`);
    if (dto.minSalary !== undefined)         sets.push(sql`min_salary = ${(dto.minSalary as number) ?? null}`);
    if (dto.maxSalary !== undefined)         sets.push(sql`max_salary = ${(dto.maxSalary as number) ?? null}`);
    if (dto.rbacTier !== undefined)          sets.push(sql`rbac_tier = ${(dto.rbacTier as string) ?? null}`);
    if (dto.tskpTarget !== undefined)        sets.push(sql`tskp_target = ${(dto.tskpTarget as number) ?? null}`);
    if (dto.tskpMeasurementUnit !== undefined) sets.push(sql`tskp_measurement_unit = ${(dto.tskpMeasurementUnit as string) ?? null}`);
    // T11-02: ЦКП formula-turi (org_departments.ckp_formula_type) — CkpFactService.calcAchievement o'qiydi.
    if (dto.ckpFormulaType !== undefined)    sets.push(sql`ckp_formula_type = ${(dto.ckpFormulaType as string) ?? null}`);
    if (dto.workSchedule !== undefined)      sets.push(sql`work_schedule = ${(dto.workSchedule as string) ?? null}`);
    // VISION (A35 — Vysotskiy 7-otdeleniye): karta qaysi 7 bo'limdan biriga (1-7); DB CHECK chk_otdeleniye_no_range 1-7|NULL'ni majburlaydi.
    if (dto.otdeleniyeNo !== undefined)      sets.push(sql`otdeleniye_no = ${(dto.otdeleniyeNo as number) ?? null}`);
    if (dto.currentState !== undefined)      sets.push(sql`current_state = ${(dto.currentState as string) ?? null}`);
    // VISION 5-holat lifecycle (A32): muzlatish meta + frozen_at/archived_at avto-boshqaruv.
    if (dto.freezeReason !== undefined)      sets.push(sql`freeze_reason = ${(dto.freezeReason as string) ?? null}`);
    if (dto.freezeUntil !== undefined)       sets.push(sql`freeze_until = ${(dto.freezeUntil as string) ?? null}`);
    if (dto.currentState !== undefined) {
      const state = (dto.currentState as string) ?? null;
      // frozen → frozen_at=now (agar hali yo'q bo'lsa); boshqa holatga o'tsa frozen_at tozalanadi.
      sets.push(sql`frozen_at = ${state === 'frozen' ? sql`COALESCE(frozen_at, now())` : sql`NULL`}`);
      // archived → archived_at=now (agar hali yo'q bo'lsa); boshqa holatga o'tsa tozalanadi.
      sets.push(sql`archived_at = ${state === 'archived' ? sql`COALESCE(archived_at, now())` : sql`NULL`}`);
    }
    if (dto.bonusConfig !== undefined)       sets.push(sql`bonus_config = ${(dto.bonusConfig as string) ?? null}`);
    if (dto.aiExamEnabled !== undefined)     sets.push(sql`ai_exam_enabled = ${(dto.aiExamEnabled as boolean) ?? null}`);
    if (dto.statisticsType !== undefined)    sets.push(sql`statistics_type = ${(dto.statisticsType as string) ?? null}`);
    if (sets.length === 0) return null;
    const rows = await runQuery<Row>(sql`
      UPDATE org_departments SET ${sql.join(sets, sql`, `)}
      WHERE id = ${id}
      RETURNING *
    `);
    return (rows.rows[0] as Row) ?? null;
  }

  async updateFromDto(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      type OrgDeptPatch = Partial<typeof orgDepartments.$inferInsert>;
      const patch: OrgDeptPatch = {};
      if (dto.name !== undefined)          patch.name = dto.name as string;
      if (dto.nameRu !== undefined)        patch.name_ru = dto.nameRu as string;
      if (dto.description !== undefined)   patch.description = dto.description as string;
      if (dto.descriptionRu !== undefined) patch.description_ru = dto.descriptionRu as string;
      if (dto.color !== undefined)         patch.color = dto.color as string;
      if (dto.tskp !== undefined)          patch.tskp = dto.tskp as string;
      if (dto.tskpRu !== undefined)        patch.tskp_ru = dto.tskpRu as string;
      if (dto.headUserId !== undefined)    patch.head_user_id = dto.headUserId as number;
      if (dto.nodeType !== undefined)      patch.node_type = dto.nodeType as string;
      if (dto.sortOrder !== undefined)     patch.sort_order = dto.sortOrder as number;
      if (dto.isActive !== undefined)      patch.is_active = dto.isActive as boolean;

      let row: Row | undefined;
      if (Object.keys(patch).length > 0) {
        [row] = (await db.update(orgDepartments).set(patch).where(eq(orgDepartments.id, id)).returning()) as Row[];
      }

      // Unit fields (org-unit-fields-2026-06-19) via parametrized sql — see applyUnitFields note.
      const withUnit = await this.applyUnitFields(id, dto);
      const finalRow = withUnit ?? row;
      if (!finalRow) return { id };

      await syncToCoreTable(finalRow as Row, 'update');
      return castTo<Record<string, unknown>>(finalRow);
    }, 'DB_ERROR');
  }

  async deactivate(id: number): Promise<void> {
    const [row] = await db
      .update(orgDepartments)
      .set({ is_active: false })
      .where(eq(orgDepartments.id, id))
      .returning();
    if (row) await syncToCoreTable(row as Row, 'deactivate');
  }

  async move(id: number, newParentId: number | null, level: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .update(orgDepartments)
        .set({ parent_id: newParentId ?? null, level })
        .where(eq(orgDepartments.id, id))
        .returning();
      return castTo<Record<string, unknown>>(row);
    }, 'DB_ERROR');
  }

  /**
   * VISION (egasi 2026-06-25): KO'P-KARTA. Bitta xodim bir nechta kartaga ulanadi (EP-ORG-004).
   *   - KARTA-tomon (EP-ORG-002): position (o'rindiq) band bo'lsa — boshqa faol xodim bilan — RAD.
   *     department/section guruh-kartalari ko'p tutadi.
   *   - XODIM-tomon (EP-ORG-066/142): har bog'lanishda ulush (stake_fraction); aktiv ulushlar
   *     yig'indisi >1.0 → RAD, owner-override (allowOverload) bilan ruxsat.
   *   - Eski link SAQLANADI (1:1 "delete-previous" OLIB TASHLANDI). Idempotent: shu karta-shu xodim
   *     aktiv link bo'lsa — qayta INSERT yo'q, faqat ulush yangilanadi.
   */
  async assignUser(
    userId: number,
    nodeId: number,
    stakeFraction: number | null = null,
    allowOverload = false,
  ): Promise<{ assigned: boolean; reason?: string }> {
    const [node] = await db
      .select({ id: orgDepartments.id, node_type: orgDepartments.node_type })
      .from(orgDepartments)
      .where(eq(orgDepartments.id, nodeId))
      .limit(1);
    if (!node) return { assigned: false, reason: 'Karta topilmadi' };

    // KARTA-tomon 1-seat guard (position) — SAQLANADI (EP-ORG-002). is_active yangi ustun (Drizzle
    // schema'da yo'q) → raw SQL. ⭐ A23: bu APP-qatlam; DB-qatlam = trg_one_seat_per_position_card
    // triggeri (migrations-drift, 23505). Faqat node_type='position' kartaga 1 aktiv egasi; guruh-kartalar
    // (owner/ceo/director/section/department) ko'p egasi TUTADI — shuning uchun bu shart faqat 'position'da.
    // Ikkala qatlam bir xil invariant (defence-in-depth): boshqa user aktiv egasi bo'lsa → RAD.
    if (node.node_type === 'position') {
      const occupants = (await runQuery<{ user_id: number }>(sql`
        SELECT user_id FROM employee_org_departments
        WHERE org_department_id = ${nodeId} AND is_active = true AND user_id <> ${userId}
      `)).rows;
      if (occupants.length > 0) {
        return { assigned: false, reason: "EP_ORG_002: Karta band — 1 o'rin = 1 xodim" };
      }
    }

    // XODIM-tomon ulush-cap guard (EP-ORG-066/142). Jami >1.0 → owner-override (allowOverload) talab.
    if (stakeFraction != null) {
      const existing = (await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(stake_fraction), 0)::numeric AS total
        FROM   employee_org_departments
        WHERE  user_id = ${userId} AND is_active = true AND org_department_id <> ${nodeId}
      `)).rows;
      const newTotal = Number(existing[0]?.total ?? 0) + stakeFraction;
      if (newTotal > 1.0 && !allowOverload) {
        return { assigned: false, reason: `Ulush yig'indisi ${newTotal.toFixed(2)} > 1.0. Owner ruxsati kerak.` };
      }
    }

    // KO'P-KARTA: eski link SAQLANADI. Shu karta-shu xodim aktiv link bo'lsa → ulushni yangila (idempotent).
    const dup = (await runQuery<{ id: number; stake_fraction: string | null }>(sql`
      SELECT id, stake_fraction FROM employee_org_departments
      WHERE user_id = ${userId} AND org_department_id = ${nodeId} AND is_active = true LIMIT 1
    `)).rows;

    if (dup[0]) {
      const oldStake = dup[0].stake_fraction == null ? null : Number(dup[0].stake_fraction);
      await runQuery(sql`UPDATE employee_org_departments SET stake_fraction = ${stakeFraction} WHERE id = ${dup[0].id}`);
      // A39: ULUSH TARIXI — faqat ulush HAQIQATAN o'zgargan bo'lsa append (idempotent qayta-assign log bermaydi).
      await this.recordStakeChange(dup[0].id, userId, nodeId, oldStake, stakeFraction, 'reassign', allowOverload);
    } else {
      const hasPrimary = (await runQuery<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt FROM employee_org_departments
        WHERE user_id = ${userId} AND is_active = true AND is_primary = true
      `)).rows;
      const isPrimary = Number(hasPrimary[0]?.cnt ?? 0) === 0;
      const [ins] = (await runQuery<{ id: number }>(sql`
        INSERT INTO employee_org_departments (user_id, org_department_id, is_primary, is_active, stake_fraction, assigned_at, created_at)
        VALUES (${userId}, ${nodeId}, ${isPrimary}, true, ${stakeFraction}, NOW(), NOW())
        RETURNING id
      `)).rows;
      // A39: ULUSH TARIXI — yangi bog'lanish (old=NULL → new=stakeFraction). eod_id INSERT id'dan.
      await this.recordStakeChange(ins?.id ?? null, userId, nodeId, null, stakeFraction, 'assign', allowOverload);
    }

    // department mirror (users.department_id) faqat birlamchi (back-compat).
    if (node.node_type === 'department' || node.node_type === null) {
      await runQuery(sql`UPDATE users SET department_id = ${nodeId} WHERE id = ${userId} AND department_id IS NULL`);
    }
    return { assigned: true };
  }

  /** Xodimni kartadan olib tashlash (bog'lanishni uzish). */
  async removeUser(userId: number, nodeId: number): Promise<{ removed: boolean }> {
    // A39: olib tashlashdan OLDIN eski ulushni o'qib, tarixga 'remove' (old→NULL) yoz.
    const prior = (await runQuery<{ id: number; stake_fraction: string | null }>(sql`
      SELECT id, stake_fraction FROM employee_org_departments
      WHERE user_id = ${userId} AND org_department_id = ${nodeId} AND is_active = true LIMIT 1
    `)).rows;
    await db
      .delete(employeeOrgDepartments)
      .where(and(eq(employeeOrgDepartments.user_id, userId), eq(employeeOrgDepartments.org_department_id, nodeId)));
    await runQuery(sql`UPDATE users SET department_id = NULL WHERE id = ${userId} AND department_id = ${nodeId}`);
    if (prior[0]) {
      const oldStake = prior[0].stake_fraction == null ? null : Number(prior[0].stake_fraction);
      await this.recordStakeChange(prior[0].id, userId, nodeId, oldStake, null, 'remove', false);
    }
    return { removed: true };
  }

  /**
   * A39 — ULUSH (stake) TARIX MEXANIZMI. Xodim↔karta bog'lanishida `stake_fraction` o'zgarganda
   * `stake_history` jadvaliga 1 IMMUTABLE (append-only) qator yozadi (razryad_history bilan bir naqsh).
   *
   * Faqat HAQIQIY o'zgarishda yoziladi: eski === yangi bo'lsa (idempotent qayta-assign) — yozuv YO'Q.
   * old/new NULL (taqsimlanmagan ulush) farqlanadi: NULL↔qiymat = o'zgarish; NULL↔NULL = o'zgarish emas.
   *
   * NON-FATAL: tarix yozuvi assign/remove asosiy oqimini BUZMAYDI — agar stake_history hali migratsiya
   * qilinmagan bo'lsa (drift bootda yaratadi), xato yutiladi va biriktirish davom etadi (Q-46: ishlovchi
   * funksiyani buzma). Parametrlangan SQL — injection yo'q. changed_by hozir NULL (egasi-DATA: aktor
   * userId controller/JWT'dan keladi; mexanizm tayyor, sim ulanganda to'ldiriladi — Q-40 fabrikatsiya yo'q).
   */
  private async recordStakeChange(
    eodId: number | null,
    userId: number,
    cardId: number,
    oldStake: number | null,
    newStake: number | null,
    changeType: 'assign' | 'reassign' | 'remove',
    allowOverload: boolean,
  ): Promise<void> {
    // HAQIQIY o'zgarish tekshiruvi (NULL-xavfsiz): bir xil bo'lsa append qilma.
    if (oldStake === newStake) return;
    if (oldStake != null && newStake != null && Math.abs(oldStake - newStake) < 1e-9) return;
    try {
      await runQuery(sql`
        INSERT INTO stake_history (eod_id, user_id, card_id, old_stake, new_stake, change_type, changed_by, allow_overload, effective_at, created_at)
        VALUES (${eodId}, ${userId}, ${cardId}, ${oldStake}, ${newStake}, ${changeType}, ${null}, ${allowOverload}, NOW(), NOW())
      `);
    } catch {
      // NON-FATAL (Q-46): tarix yozuvi biriktirishni buzmaydi. Drift bootda jadvalni yaratadi.
    }
  }

  /**
   * P51 — Recomputes `org_functions.manager_id` and `employees.manager_id` from
   * the org tree (parent-chain head_user_id, recursive, NULL-skipping).
   *
   * Two gates protect this write:
   *   1. DATA gate — every active org_departments node must have a non-null
   *      head_user_id (owner/HR knowledge — code cannot fabricate it, Q-40).
   *      `dataGateOpen` is true only when `nullHeadCount === 0`.
   *   2. dryRun — when true, only previews how many rows WOULD change; writes
   *      nothing. Default behaviour at the endpoint is dryRun=true.
   *
   * Idempotent: only touches rows where manager_id IS NULL OR = 0, and only
   * derives a manager where a non-null head exists up the chain (NULL stays
   * NULL — never fabricated). Safe to run repeatedly.
   */
  async backfillManagerIds(dryRun = true): Promise<Result<{
    nullHeadCount: number;
    dataGateOpen: boolean;
    updatedFunctions: number;
    updatedEmployees: number;
    message: string;
  }>> {
    return safeCall(async () => {
      // 1. DATA gate — count active nodes still missing a head.
      const gate = (await runQuery<{ null_head_count: number }>(sql`
        SELECT COUNT(*)::int AS null_head_count
        FROM   org_departments
        WHERE  is_active = true AND head_user_id IS NULL
      `)).rows;
      const nullHeadCount = Number(gate[0]?.null_head_count ?? 999);
      const dataGateOpen = nullHeadCount === 0;

      if (!dataGateOpen) {
        return {
          nullHeadCount,
          dataGateOpen: false,
          updatedFunctions: 0,
          updatedEmployees: 0,
          message:
            `DATA DARVOZA YOPIQ: ${nullHeadCount} ta aktiv node head_user_id = NULL. ` +
            `Avval barcha rahbarlik ma'lumotlarini to'ldiring.`,
        };
      }

      if (dryRun) {
        const fnPreview = (await runQuery<{ cnt: number }>(sql`
          SELECT COUNT(*)::int AS cnt
          FROM   org_functions f
          WHERE  f.is_active = true AND (f.manager_id IS NULL OR f.manager_id = 0)
        `)).rows;
        const empPreview = (await runQuery<{ cnt: number }>(sql`
          SELECT COUNT(*)::int AS cnt
          FROM   employees
          WHERE  manager_id IS NULL OR manager_id = 0
        `)).rows;
        return {
          nullHeadCount: 0,
          dataGateOpen: true,
          updatedFunctions: Number(fnPreview[0]?.cnt ?? 0),
          updatedEmployees: Number(empPreview[0]?.cnt ?? 0),
          message: "DRY RUN: hech narsa yozilmadi. dryRun=false bilan qayta chaqiring.",
        };
      }

      // 2. org_functions.manager_id ← nearest ancestor head_user_id.
      // RULE4_EXCEPTION: recursive-CTE correlated UPDATE — not expressible in
      // Drizzle. Idempotent via the manager_id IS NULL / = 0 guard.
      const fnRes = (await runQuery<{ id: number }>(sql`
        UPDATE org_functions f
        SET    manager_id = (
          WITH RECURSIVE ancestor AS (
            SELECT od.id, od.parent_id, od.head_user_id, 1 AS depth
            FROM   org_departments od
            WHERE  od.id = f.department_id AND od.is_active = true
            UNION ALL
            SELECT od2.id, od2.parent_id, od2.head_user_id, a.depth + 1
            FROM   org_departments od2
            JOIN   ancestor a ON od2.id = a.parent_id
            WHERE  od2.is_active = true AND a.depth < 10
          )
          SELECT head_user_id
          FROM   ancestor
          WHERE  head_user_id IS NOT NULL
          ORDER  BY depth
          LIMIT  1
        )
        WHERE  f.is_active = true
          AND  (f.manager_id IS NULL OR f.manager_id = 0)
        RETURNING f.id
      `)).rows;
      const updatedFunctions = Array.isArray(fnRes) ? fnRes.length : 0;

      // 3. employees.manager_id ← manager's employees.id, via the employee's
      // primary card → department → parent head_user_id → employees lookup.
      // KANONIK JOIN: employee_cards (M:N, org-phase6). employee_functions does
      // NOT exist. employees.manager_id stores employees.id (not users.id), so
      // we map the resolved head_user_id back through employees.user_id.
      const empRes = (await runQuery<{ id: number }>(sql`
        UPDATE employees e
        SET    manager_id = mgr_emp.id
        FROM   employee_cards ec
        JOIN   org_functions   f    ON f.id = ec.card_id AND f.is_active = true
        JOIN   org_departments dept ON dept.id = f.department_id AND dept.is_active = true
        JOIN   org_departments par  ON par.id = dept.parent_id  AND par.is_active = true
        JOIN   employees mgr_emp    ON mgr_emp.user_id = par.head_user_id
        WHERE  ec.employee_id = e.id
          AND  ec.is_primary = true
          AND  ec.is_active = true
          AND  (e.manager_id IS NULL OR e.manager_id = 0)
          AND  par.head_user_id IS NOT NULL
          AND  mgr_emp.id <> e.id
        RETURNING e.id
      `)).rows;
      const updatedEmployees = Array.isArray(empRes) ? empRes.length : 0;

      return {
        nullHeadCount: 0,
        dataGateOpen: true,
        updatedFunctions,
        updatedEmployees,
        message:
          `Backfill yakunlandi: org_functions=${updatedFunctions} ta yangilandi, ` +
          `employees=${updatedEmployees} ta yangilandi.`,
      };
    }, 'DB_ERROR');
  }
}
