/**
 * @module okr.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { sql, eq, desc } from 'drizzle-orm';
import { db } from '@shared/db';
import { okr_objectives, okr_key_results } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result } from '@common/result';
import type { IOkrRepo, KeyResultsDashboard } from '../../domain/repositories/i-okr.repo';

type Row = Record<string, unknown>;

export type { KeyResultsDashboard };

@Injectable()
export class OkrRepository implements IOkrRepo {
  // P30 EP-DIR-015/016: kaskad uchun typedExecute — parent_goal_id self-JOIN
  // (parent_title) va parentGoalId filtri. parent_goal_id/owner_card_id
  // ustunlari gated P30 migration bilan qo'shiladi (Drizzle schema'da hali yo'q).
  //
  // EP-DIR-012/015: har maqsad uchun "bajarilish foizi" o'lchanadigan kalit
  // natijalardan kelib chiqib hisoblanadi (klassik OKR). progress = shu maqsadning
  // kalit natijalari bo'yicha AVG(LEAST(current/target*100, 100)). Kalit natija
  // bo'lmasa — saqlangan progress_percent fallback. Formula `getDashboardKeyResults`
  // dagi kanonik usul bilan bir xil (current/target → foiz, 100% bilan cheklangan).
  async listObjectives(type: string | null, year: number | null, quarter: string | null, status: string | null, parentGoalId?: number | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return typedExecute<Row>(sql`
        SELECT
          o.*,
          p.title AS parent_title,
          COALESCE(kr.kr_count, 0)::int AS key_result_count,
          -- EP-DIR-012: kalit natijalardan hisoblangan bajarilish foizi (yoki saqlangan fallback)
          COALESCE(
            ROUND(kr.kr_progress, 0)::int,
            o.progress_percent,
            0
          ) AS progress
        FROM okr_objectives o
        LEFT JOIN okr_objectives p ON p.id = o.parent_goal_id
        LEFT JOIN (
          SELECT
            objective_id,
            COUNT(*) AS kr_count,
            AVG(
              LEAST(
                CASE WHEN target_value > 0
                     THEN current_value::numeric / target_value * 100
                     ELSE 0 END,
                100
              )
            ) AS kr_progress
          FROM okr_key_results
          GROUP BY objective_id
        ) kr ON kr.objective_id = o.id
        WHERE
          (${type}::text IS NULL OR o.type = ${type}) AND
          (${year}::int IS NULL OR o.year = ${year}::int) AND
          (${quarter}::text IS NULL OR o.quarter = ${quarter}) AND
          (${status}::text IS NULL OR o.status = ${status}) AND
          (${parentGoalId ?? null}::int IS NULL
            OR o.parent_goal_id = ${parentGoalId ?? null}::int)
        ORDER BY o.created_at DESC
      `);
      }, 'DB_ERROR');
  }

  // EP-DIR-016: OKR kaskad daraxti — kompaniya → bo'lim → karta (lavozim).
  // Har tugun progressi: o'z kalit natijalaridan hisoblanadi; agar kalit natija
  // bo'lmasa, bolalarining (parent_goal_id orqali) o'rtacha rolled-up progressi.
  // "Oltin ip": har quyi maqsad yuqori maqsadga hissa qo'shadi.
  async getCascade(year: number | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      // 1) Barcha maqsadlar + har biri uchun KR dan hisoblangan xom progress.
      const rows = await typedExecute<{
        id: number;
        title: string;
        type: string | null;
        status: string | null;
        parent_goal_id: number | null;
        owner_card_id: number | null;
        department_id: number | null;
        key_result_count: number;
        kr_progress: number | null;
      }>(sql`
        SELECT
          o.id, o.title, o.type, o.status,
          o.parent_goal_id, o.owner_card_id, o.department_id,
          COALESCE(kr.kr_count, 0)::int AS key_result_count,
          kr.kr_progress
        FROM okr_objectives o
        LEFT JOIN (
          SELECT
            objective_id,
            COUNT(*) AS kr_count,
            AVG(
              LEAST(
                CASE WHEN target_value > 0
                     THEN current_value::numeric / target_value * 100
                     ELSE 0 END,
                100
              )
            ) AS kr_progress
          FROM okr_key_results
          GROUP BY objective_id
        ) kr ON kr.objective_id = o.id
        WHERE (${year ?? null}::int IS NULL OR o.year = ${year ?? null}::int)
        ORDER BY o.id ASC
      `);

      // 2) Bolalar indeksini qur (parent_goal_id → bolalar).
      const childrenOf = new Map<number, number[]>();
      for (const r of rows) {
        if (r.parent_goal_id != null) {
          const arr = childrenOf.get(r.parent_goal_id) ?? [];
          arr.push(r.id);
          childrenOf.set(r.parent_goal_id, arr);
        }
      }
      const byId = new Map<number, typeof rows[number]>();
      for (const r of rows) byId.set(r.id, r);

      // 3) Rolled-up progress: KR bor bo'lsa — KR progress; aks holda bolalarning
      //    o'rtachasi (rekursiv, sikl-himoyasi bilan).
      const memo = new Map<number, number>();
      const rollup = (id: number, seen: Set<number>): number => {
        if (memo.has(id)) return memo.get(id) as number;
        const node = byId.get(id);
        if (!node || seen.has(id)) return 0;
        seen.add(id);
        let value: number;
        if (node.key_result_count > 0) {
          value = Math.round(Number(node.kr_progress ?? 0));
        } else {
          const kids = childrenOf.get(id) ?? [];
          if (kids.length === 0) {
            value = 0;
          } else {
            const sum = kids.reduce((acc, kid) => acc + rollup(kid, seen), 0);
            value = Math.round(sum / kids.length);
          }
        }
        memo.set(id, value);
        return value;
      };

      // 4) Har tugun uchun yakuniy progress + bolalar soni + hissa metadata.
      return rows.map((r) => ({
        id:                r.id,
        title:             r.title,
        type:              r.type,
        status:            r.status,
        parent_goal_id:    r.parent_goal_id,
        owner_card_id:     r.owner_card_id,
        department_id:     r.department_id,
        key_result_count:  r.key_result_count,
        child_count:       (childrenOf.get(r.id) ?? []).length,
        progress:          rollup(r.id, new Set<number>()),
      }));
      }, 'DB_ERROR');
  }

  async getObjective(id: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(okr_objectives).where(eq(okr_objectives.id, id)).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  // P30 EP-DIR-015/016: parent_goal_id (kaskad) + owner_card_id (karta egasi).
  // typedExecute — yangi ustunlar gated P30 migration bilan qo'shiladi.
  async createObjective(title: string, type: string, year: number, quarter: string, description: string | null, ownerId: number, parentGoalId?: number | null, ownerCardId?: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      // created_by/updated_by — config-o'zgarish auditi (T23-B1, gated migration ustunlari).
      const rows = await typedExecute<Row>(sql`
        INSERT INTO okr_objectives
          (title, type, year, quarter, description, owner_id, status,
           parent_goal_id, owner_card_id, created_by, updated_by)
        VALUES
          (${title}, ${type}, ${year}, ${quarter}, ${description}, ${ownerId},
           'active', ${parentGoalId ?? null}, ${ownerCardId ?? null},
           ${ownerId ?? null}, ${ownerId ?? null})
        RETURNING *
      `);
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  // updated_by — config-o'zgarish auditi (T23-B1). updated_by ustuni gated migration
  // bilan qo'shilgan (Drizzle pgTable'da yo'q) → typedExecute raw UPDATE ishlatamiz.
  async updateObjective(id: number, title: string | null, status: string | null, description: string | null, updatedBy?: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await typedExecute<Row>(sql`
        UPDATE okr_objectives SET
          title       = COALESCE(${title}, title),
          status      = COALESCE(${status}, status),
          description = COALESCE(${description}, description),
          updated_by  = COALESCE(${updatedBy ?? null}::int, updated_by),
          updated_at  = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  /**
   * C6.2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): okr_key_results has no live FK
   * on objective_id (only owner_card_id→org_functions exists) — the Drizzle
   * schema declares `.references(() => okrObjectives.id, {onDelete:'cascade'})`
   * but that migration was never applied, so deleting an objective silently
   * orphaned its key results. Cascade the delete atomically at the app layer
   * until/unless the schema drift is reconciled with a real migration.
   */
  async deleteObjective(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(okr_key_results).where(eq(okr_key_results.objectiveId, id));
      await tx.delete(okr_objectives).where(eq(okr_objectives.id, id));
    });
  }

  async listKeyResults(objectiveId: number | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:              okr_key_results.id,
        objective_id:    okr_key_results.objectiveId,
        title:           okr_key_results.title,
        target_value:    okr_key_results.targetValue,
        current_value:   okr_key_results.currentValue,
        unit:            okr_key_results.unit,
        status:          okr_key_results.status,
        created_at:      okr_key_results.createdAt,
        updated_at:      okr_key_results.updatedAt,
        objective_title: okr_objectives.title,
      })
        .from(okr_key_results)
        .leftJoin(okr_objectives, eq(okr_objectives.id, okr_key_results.objectiveId))
        .where(sql`(${objectiveId}::int IS NULL OR ${okr_key_results.objectiveId} = ${objectiveId}::int)`)
        .orderBy(desc(okr_key_results.createdAt)).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  // created_by/updated_by — config-o'zgarish auditi (T23-B1, gated migration ustunlari).
  async createKeyResult(objectiveId: number, title: string, targetValue: number, currentValue: number, unit: string, ownerId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await typedExecute<Row>(sql`
        INSERT INTO okr_key_results
          (objective_id, title, target_value, current_value, unit, created_by, updated_by)
        VALUES
          (${objectiveId}, ${title}, ${String(targetValue)}, ${String(currentValue)}, ${unit},
           ${ownerId ?? null}, ${ownerId ?? null})
        RETURNING *
      `);
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  // updated_by — config-o'zgarish auditi (T23-B1, gated migration ustuni).
  async updateKeyResult(id: number, currentValue: number | null, status: string | null, title: string | null, updatedBy?: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await typedExecute<Row>(sql`
        UPDATE okr_key_results SET
          current_value = COALESCE(${currentValue ?? null}::numeric, current_value),
          status        = COALESCE(${status}, status),
          title         = COALESCE(${title}, title),
          updated_by    = COALESCE(${updatedBy ?? null}::int, updated_by),
          updated_at    = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async deleteKeyResult(id: number): Promise<void> {
    await db.delete(okr_key_results).where(eq(okr_key_results.id, id));
  }

  async getDashboardObjectives(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      return db.select({ status: okr_objectives.status, cnt: sql<number>`COUNT(*)` })
        .from(okr_objectives).groupBy(okr_objectives.status).then(r => castTo<unknown[]>(r));
      }, 'DB_ERROR');
  }

  async getDashboardKeyResults(): Promise<Result<KeyResultsDashboard>> {
    return safeCall(async () => {
      const r = await db.select({
        avg_progress: sql<number>`ROUND(AVG(CASE WHEN ${okr_key_results.targetValue} > 0 THEN (${okr_key_results.currentValue}::numeric / ${okr_key_results.targetValue} * 100) ELSE 0 END), 1)`,
        total:        sql<number>`COUNT(*)`,
      }).from(okr_key_results);
      return r[0] ?? { avg_progress: 0, total: 0 };
      }, 'DB_ERROR');
  }
}
