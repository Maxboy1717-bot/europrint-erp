/**
 * @module drizzle-ai-fit.repo
 * @description Repository / data-access layer for the AI-fit per-card scorer (P36).
 *   Wraps Drizzle ORM queries over `ai_fit_scores`; returns Result<T>.
 * @layer Infrastructure (AI)
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Result } from '@common/result';
import { runQuery } from '@shared/db';
import { aiFitScores } from '@europrint/schemas';
import {
  IAiFitRepo,
  FitScoreRow,
  InsertFitScoreDto,
  ListFitScoreFilters,
  ActiveCardAssignmentRow,
} from '../../domain/repositories/i-ai-fit.repo';

const DEFAULT_LIST_LIMIT = 100;

/** Raw row shape returned by the org_functions↔users↔employees join (see below). */
interface ActiveCardAssignmentSqlRow {
  employee_id:           number;
  card_id:                number;
  position_name:          string | null;
  function_description:   string | null;
  tskp:                   string | null;
  tskp_target:            number | null;
  razryad_level_id:       number | null;
  min_salary:             string | null;
  max_salary:             string | null;
  emp_first_name:         string | null;
  emp_last_name:          string | null;
  emp_position_id:        number | null;
  emp_department_id:      number | null;
  emp_hire_date:          string | null;
  emp_status:             string | null;
}

@Injectable()
export class DrizzleAiFitRepo implements IAiFitRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  /** Map a raw Drizzle select row → transport FitScoreRow (numeric→number, dates→ISO). */
  private toRow(r: typeof aiFitScores.$inferSelect): FitScoreRow {
    return {
      id:                  r.id,
      employeeId:          r.employeeId,
      cardId:              r.cardId,
      fitScore:            r.fitScore != null ? Number(r.fitScore) : 0,
      fitReport:           (r.fitReport as Record<string, unknown> | null) ?? null,
      bonusRecommendation: r.bonusRecommendation != null ? Number(r.bonusRecommendation) : null,
      successionCandidate: r.successionCandidate ?? false,
      aiProvider:          r.aiProvider ?? null,
      evaluatedAt:         r.evaluatedAt?.toISOString() ?? '',
      createdAt:           r.createdAt?.toISOString() ?? '',
    };
  }

  async insertScore(dto: InsertFitScoreDto): Promise<Result<FitScoreRow>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiFitScores)
        .values({
          employeeId:          dto.employeeId,
          cardId:              dto.cardId,
          fitScore:            dto.fitScore.toFixed(2),
          fitReport:           dto.fitReport ?? null,
          bonusRecommendation: dto.bonusRecommendation != null ? dto.bonusRecommendation.toFixed(2) : null,
          successionCandidate: dto.successionCandidate ?? false,
          aiProvider:          dto.aiProvider ?? null,
        })
        .returning();
      if (!row) throw new InternalServerErrorException('AI-fit baho saqlanmadi: natija qaytmadi');
      return this.toRow(row);
    });
  }

  async findLatestByEmployee(employeeId: number): Promise<Result<FitScoreRow | null>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .select()
        .from(aiFitScores)
        .where(eq(aiFitScores.employeeId, employeeId))
        .orderBy(desc(aiFitScores.evaluatedAt), desc(aiFitScores.id))
        .limit(1);
      return row ? this.toRow(row) : null;
    });
  }

  async listScores(filters: ListFitScoreFilters): Promise<Result<FitScoreRow[]>> {
    return safeCall(async () => {
      const conditions = [];
      if (filters.employeeId != null) conditions.push(eq(aiFitScores.employeeId, filters.employeeId));
      if (filters.cardId != null) conditions.push(eq(aiFitScores.cardId, filters.cardId));
      const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, DEFAULT_LIST_LIMIT) : DEFAULT_LIST_LIMIT;
      const rows = await this.drizzle.db
        .select()
        .from(aiFitScores)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(aiFitScores.evaluatedAt), desc(aiFitScores.id))
        .limit(limit);
      return (Array.isArray(rows) ? rows : []).map((r) => this.toRow(r));
    });
  }

  /**
   * Faol org_functions kartasi + unga `users.org_function_id` orqali
   * biriktirilgan xodim juftliklari. `employeeProfile`/`cardRequirements`
   * DB'dagi mavjud maydonlardan yig'iladi (fabrikatsiya yo'q) — haftalik
   * AI-fit avto-tsikl (2.18) shu ro'yxatni evaluate() ga uzatadi.
   *
   * Parametrized `sql` template (Qoide 4/B) — Drizzle table-builder ishlatilmadi,
   * chunki `@europrint/schemas` (apps/api tsconfig path) `org_functions`ni
   * eksport qilmaydi va shu barrel orqali kelgan `users`/`employees` uuid-PK
   * eski shim'lar (schema-core.ts/schema-hr-lms.ts) — jonli integer-PK jadval
   * bilan mos emas (memory: "schema barrel precedence"). card.repository.ts
   * ham xuddi shu sabab bilan runQuery/sql ishlatadi.
   */
  async listActiveCardAssignments(): Promise<Result<ActiveCardAssignmentRow[]>> {
    return safeCall(async () => {
      const result = await runQuery<ActiveCardAssignmentSqlRow>(sql`
        SELECT
          u.employee_id            AS employee_id,
          f.id                     AS card_id,
          f.position_name          AS position_name,
          f.function_description   AS function_description,
          f.tskp                   AS tskp,
          f.tskp_target            AS tskp_target,
          f.razryad_level_id       AS razryad_level_id,
          f.min_salary             AS min_salary,
          f.max_salary             AS max_salary,
          e.first_name             AS emp_first_name,
          e.last_name              AS emp_last_name,
          e.position_id            AS emp_position_id,
          e.department_id          AS emp_department_id,
          e.hire_date              AS emp_hire_date,
          e.status                 AS emp_status
        FROM org_functions f
        INNER JOIN users u ON u.org_function_id = f.id
        INNER JOIN employees e ON e.id = u.employee_id
        WHERE f.is_active = true
          AND f.deleted_at IS NULL
          AND e.deleted_at IS NULL
          AND u.employee_id IS NOT NULL
      `);

      const rows = Array.isArray(result.rows) ? result.rows : [];
      return rows.map((r): ActiveCardAssignmentRow => ({
        employeeId: r.employee_id,
        cardId:     r.card_id,
        employeeProfile: {
          firstName:    r.emp_first_name,
          lastName:     r.emp_last_name,
          positionId:   r.emp_position_id,
          departmentId: r.emp_department_id,
          hireDate:     r.emp_hire_date,
          status:       r.emp_status,
        },
        cardRequirements: {
          positionName:        r.position_name,
          functionDescription: r.function_description,
          tskp:                r.tskp,
          tskpTarget:          r.tskp_target,
          razryadLevelId:      r.razryad_level_id,
          minSalary:           r.min_salary,
          maxSalary:           r.max_salary,
        },
      }));
    });
  }
}
