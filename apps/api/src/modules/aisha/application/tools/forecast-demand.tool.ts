/**
 * @module forecast-demand.tool
 * @description Simple moving-average + linear trend forecast. Reads the
 * historical daily totals for a product category and projects N days
 * forward. For a real model the caller can replace this with the AI/Forecast
 * Holt-Winters service.
 */

// NOTE: Raw SQL is intentional for AIsha tools. Each tool aggregates
// across multiple cross-module tables (sales, production, HR, finance,
// security, kanban) that the AIsha module does not own. Importing every
// Drizzle schema would create tight coupling between AIsha and every
// other domain module; the read-only / single-INSERT raw SQL keeps
// AIsha as a loose query-adapter layer over the ERP. Drizzle ORM is
// used elsewhere; see [[aisha-final-report]] for the architectural
// rationale.

import { Injectable } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface ForecastPoint { day: string; value: number; ciLow: number; ciHigh: number }
export interface ForecastResult {
  productCategory: string;
  horizonDays:     number;
  history:         ForecastPoint[];
  forecast:        ForecastPoint[];
}

@Injectable()
export class ForecastDemandTool implements IAishaTool {
  readonly definition = {
    name: 'forecast_demand',
    description: 'Mahsulot kategoriyasi uchun talab prognozi (N kun).',
    input_schema: {
      type: 'object' as const,
      properties: {
        productCategory: { type: 'string' },
        horizonDays:     { type: 'string', description: 'Prognoz uzunligi (kunlar)' },
      },
      required: ['productCategory', 'horizonDays'],
    },
  };

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<ForecastResult>>> {
    const cat = String(input['productCategory'] ?? '');
    const horizon = parseInt(String(input['horizonDays'] ?? '7'), 10);
    if (!cat) return Err(AppErr('VALIDATION', 'productCategory majburiy'));
    if (!Number.isFinite(horizon) || horizon < 1 || horizon > 90) {
      return Err(AppErr('VALIDATION', 'horizonDays 1..90 oralig\'ida'));
    }

    return safeCall<ToolResult<ForecastResult>>(async () => {
      const start = Date.now();
      const hist = rowsOf<{ day: string; v: number }>(await db.execute(sql`
        SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, COALESCE(SUM(qty),0)::float AS v
        FROM sales_orders WHERE category = ${cat} AND created_at > NOW() - INTERVAL '60 days'
        GROUP BY day ORDER BY day
      `));
      const history: ForecastPoint[] = hist.map(r => ({ day: r.day, value: r.v, ciLow: r.v, ciHigh: r.v }));
      const window = history.slice(-7).map(p => p.value);
      const avg = window.length > 0 ? window.reduce((a, b) => a + b, 0) / window.length : 0;
      const std = window.length > 1
        ? Math.sqrt(window.reduce((a, v) => a + (v - avg) ** 2, 0) / (window.length - 1))
        : 0;

      const lastDay = history.at(-1)?.day ?? new Date().toISOString().slice(0, 10);
      const lastMs = new Date(lastDay).getTime();
      const forecast: ForecastPoint[] = Array.from({ length: horizon }, (_, i) => {
        const day = new Date(lastMs + (i + 1) * 86_400_000).toISOString().slice(0, 10);
        return { day, value: avg, ciLow: Math.max(0, avg - 1.96 * std), ciHigh: avg + 1.96 * std };
      });

      return provResult<ForecastResult>({
        data: { productCategory: cat, horizonDays: horizon, history, forecast },
        sources: [provSource({ type: 'database', identifier: 'sd.sales_orders', startMs: start, rowCount: history.length })],
        confidence: history.length >= 14 ? 0.8 : 0.5,
        citations: [{ label: `${cat} ${horizon}d forecast` }],
      });
    });
  }
}
