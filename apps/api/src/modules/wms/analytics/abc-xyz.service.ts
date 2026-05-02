import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeDiv } from '@common/math/math-utils';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type DbRow = Record<string, unknown>;

export type AbcClass = 'A' | 'B' | 'C';
export type XyzClass = 'X' | 'Y' | 'Z';
export type AbcXyzClass = `${AbcClass}${XyzClass}`;

export interface AbcXyzItem {
  materialId: number | string;
  annualValue: number;
  cumPct: number;
  cv: number;
  abcClass: AbcClass;
  xyzClass: XyzClass;
  abcXyzClass: AbcXyzClass;
  strategy: string;
}

export interface AbcXyzReport {
  items: AbcXyzItem[];
  summary: Record<AbcXyzClass, number>;
}

const STRATEGY_MAP: Record<AbcXyzClass, string> = {
  AX: 'JIT — minimal zaxira, barqaror talab',
  AY: 'Yuqori darajadagi monitoring, buffer zaxira',
  AZ: 'Yuqori Safety Stock, tez-tez monitoring',
  BX: 'Standart zaxira siyosati',
  BY: 'O\'rtacha monitoring, oylik tahlil',
  BZ: 'Ehtiyot Safety Stock, choraklik ko\'rib chiqish',
  CX: 'Minimal zaxira, yillik buyurtma',
  CY: 'Minimal zaxira, yarim yillik buyurtma',
  CZ: 'Yiliga bir marta ko\'rib chiqish, va bo\'lmasa yo\'q qilish',
};

@Injectable()
export class AbcXyzService {
  @Calculation('wms.abcXyz.classifyItem')
  classifyItem(cumPct: number, cv: number): { abcClass: AbcClass; xyzClass: XyzClass; abcXyzClass: AbcXyzClass } {
    const abcClass = this.classifyAbc(cumPct);
    const xyzClass = this.classifyXyz(cv);
    return { abcClass, xyzClass, abcXyzClass: `${abcClass}${xyzClass}` as AbcXyzClass };
  }

  @Calculation('wms.abcXyz.analyzeInMemory')
  analyzeInMemory(
    rows: Array<{ materialId: number | string; annualValue: number; demandValues: number[] }>,
  ): Result<AbcXyzReport, AppError> {
    const totalValue = (rows ?? []).reduce((s, r) => s + r.annualValue, 0);

    const sorted = [...rows].sort((a, b) => b.annualValue - a.annualValue);

    let cumValue = 0;
    const items: AbcXyzItem[] = (sorted ?? []).map((r) => {
      cumValue += r.annualValue;
      const cumPct = safeDiv(cumValue * 100, totalValue);
      const avg = safeDiv((r?.demandValues ?? []).reduce((s, v) => s + v, 0), r.demandValues.length || 1);
      const variance = (r?.demandValues ?? []).reduce((s, v) => s + (v - avg) ** 2, 0);
      const sigma = Math.sqrt(safeDiv(variance, r.demandValues.length || 1));
      const cv = safeDiv(sigma, avg);

      const abcClass = this.classifyAbc(cumPct);
      const xyzClass = this.classifyXyz(cv);
      const abcXyzClass: AbcXyzClass = `${abcClass}${xyzClass}` as AbcXyzClass;

      return {
        materialId: r.materialId,
        annualValue: r.annualValue,
        cumPct,
        cv,
        abcClass,
        xyzClass,
        abcXyzClass,
        strategy: STRATEGY_MAP[abcXyzClass],
      };
    });

    const summary = {} as Record<AbcXyzClass, number>;
    for (const item of items) {
      summary[item.abcXyzClass] = (summary[item.abcXyzClass] ?? 0) + 1;
    }

    return Ok({ items, summary });
  }

  @Calculation('wms.abcXyz.calculateFromDb')
  async calculateFromDb(): Promise<Result<AbcXyzReport, AppError>> {
    try {
      const abcRows = await runQuery<DbRow>(sql`
        WITH ranked AS (
          SELECT
            m.id                                              AS material_id,
            m.avg_price * COALESCE(SUM(gm.qty), 0)           AS annual_value
          FROM mm_materials m
          LEFT JOIN goods_movement gm
            ON  gm.material_id = m.id
            AND gm.posting_date >= CURRENT_DATE - INTERVAL '1 year'
            AND gm.movement_type = 'ISSUE'
          GROUP BY m.id, m.avg_price
        ),
        ordered AS (
          SELECT *,
            SUM(annual_value) OVER (ORDER BY annual_value DESC) AS cum_value,
            SUM(annual_value) OVER ()                           AS total_value
          FROM ranked
        )
        SELECT
          material_id,
          annual_value::numeric(18,4)                                          AS annual_value,
          ROUND(100.0 * cum_value / NULLIF(total_value, 0), 2)::numeric(6,2)  AS cum_pct
        FROM ordered
        ORDER BY annual_value DESC
      `);

      const xyzRows = await runQuery<DbRow>(sql`
        SELECT
          material_id,
          COALESCE(STDDEV(daily_qty) / NULLIF(AVG(daily_qty), 0), 0)::numeric(8,4) AS cv
        FROM (
          SELECT
            material_id,
            DATE_TRUNC('day', posting_date) AS day,
            SUM(qty)                         AS daily_qty
          FROM goods_movement
          WHERE movement_type = 'ISSUE'
            AND posting_date >= CURRENT_DATE - INTERVAL '1 year'
          GROUP BY material_id, DATE_TRUNC('day', posting_date)
        ) daily
        GROUP BY material_id
      `);

      const xyzMap = new Map<string, number>();
      for (const r of xyzRows.rows) {
        xyzMap.set(String(r['material_id']), Number(r['cv'] ?? 0));
      }

      const items: AbcXyzItem[] = (abcRows?.rows ?? []).map((r) => {
        const cumPct = Number(r['cum_pct'] ?? 0);
        const cv = xyzMap.get(String(r['material_id'])) ?? 0;
        const abcClass = this.classifyAbc(cumPct);
        const xyzClass = this.classifyXyz(cv);
        const abcXyzClass: AbcXyzClass = `${abcClass}${xyzClass}` as AbcXyzClass;
        return {
          materialId: r['material_id'] as string,
          annualValue: Number(r['annual_value'] ?? 0),
          cumPct,
          cv,
          abcClass,
          xyzClass,
          abcXyzClass,
          strategy: STRATEGY_MAP[abcXyzClass],
        };
      });

      const summary = {} as Record<AbcXyzClass, number>;
      for (const item of items) {
        summary[item.abcXyzClass] = (summary[item.abcXyzClass] ?? 0) + 1;
      }

      return Ok({ items, summary });
    } catch (_e) {
      return Err(String(_e));
    }
  }

  classifyAbc(cumPct: number): AbcClass {
    if (cumPct <= 80) return 'A';
    if (cumPct <= 95) return 'B';
    return 'C';
  }

  classifyXyz(cv: number): XyzClass {
    if (cv <= 0.25) return 'X';
    if (cv <= 0.50) return 'Y';
    return 'Z';
  }
}
