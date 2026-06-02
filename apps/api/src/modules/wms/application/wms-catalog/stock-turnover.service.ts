/**
 * @module wms-catalog/stock-turnover.service
 * @description Stock balance and turnover sub-reports.
 */

import { Injectable, Logger } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class WmsCatalogStockTurnoverService {
  private readonly logger = new Logger(WmsCatalogStockTurnoverService.name);

  async getStockBalance(warehouseId?: string, category?: string, lowStockOnly = false) {
    try {
      const catFilter = category && category !== 'all' ? category : null;
      const r = await rawSql(sql`
        SELECT mc.id::text AS id, COALESCE(mc.xom_ashyo, mc.kod) AS material_name, mc.kod AS material_code,
               mc.unit_of_measure, mc.category, mc.material_type,
               COALESCE(SUM(ws.quantity), 0)::numeric AS total_qty,
               COALESCE(mc.min_stock, 0)::numeric AS min_stock,
               COALESCE(mc.unit_price, 0)::numeric AS unit_price,
               COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS total_value
        FROM material_cards mc
        LEFT JOIN warehouse_stock ws ON ws.material_id = mc.id
          AND (${warehouseId ?? null}::int IS NULL OR ws.warehouse_id = ${warehouseId ? parseInt(warehouseId, 10) : null}::int)
        WHERE mc.is_active IS NOT FALSE
          AND (${catFilter}::text IS NULL OR mc.category = ${catFilter} OR mc.material_type = ${catFilter})
        GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.unit_of_measure, mc.category, mc.material_type, mc.min_stock, mc.unit_price
        ORDER BY total_value DESC LIMIT 200
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      let data = rawRows.map(row => {
        const qty = Number(row.total_qty ?? 0);
        const minStock = Number(row.min_stock ?? 0);
        const status = minStock > 0 && qty <= 0 ? 'critical' : minStock > 0 && qty < minStock ? 'low' : 'normal';
        return {
          materialId: String(row.id), name: String(row.material_name ?? ''),
          code: String(row.material_code ?? ''), currentStock: qty, minStock,
          value: Number(row.total_value ?? 0),
          unitOfMeasure: String(row.unit_of_measure ?? ''), status,
        };
      });
      if (lowStockOnly) data = data.filter(d => d.status === 'low' || d.status === 'critical');
      const lowStockCount = data.filter(d => d.status === 'low').length;
      const criticalCount = data.filter(d => d.status === 'critical').length;
      const totalValue = data.reduce((s, d) => s + d.value, 0);
      return { data, summary: { totalMaterials: data.length, totalValue, lowStockCount, criticalCount } };
    } catch (e) {
      this.logger.warn(`getStockBalance failed: ${(e as Error).message}`);
      return { data: [], summary: { totalMaterials: 0, totalValue: 0, lowStockCount: 0, criticalCount: 0 } };
    }
  }

  async getTurnover() {
    try {
      const r = await rawSql(sql`
        SELECT mc.id::text AS id, COALESCE(mc.xom_ashyo, mc.kod) AS material_name,
               mc.unit_of_measure,
               COALESCE(SUM(ws.quantity), 0)::numeric AS current_stock,
               COALESCE(mc.unit_price, 0)::numeric AS unit_price,
               COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS stock_value
        FROM material_cards mc
        LEFT JOIN warehouse_stock ws ON ws.material_id = mc.id
        WHERE mc.is_active IS NOT FALSE
        GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.unit_of_measure, mc.unit_price
        ORDER BY stock_value DESC LIMIT 100
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      const data = rawRows.map(row => {
        const closingStock = Number(row.current_stock ?? 0);
        const stockValue = Number(row.stock_value ?? 0);
        const unitPrice = Number(row.unit_price ?? 1) || 1;
        const turnoverRate = closingStock > 0
          ? Math.round((stockValue / (closingStock * unitPrice)) * 10) / 10
          : 0;
        return {
          materialId: String(row.id), name: String(row.material_name ?? ''),
          openingStock: closingStock, totalIn: 0, totalOut: 0,
          closingStock, turnoverRate,
          unitOfMeasure: String(row.unit_of_measure ?? ''),
        };
      });
      const avgTurnover = data.length > 0
        ? Math.round(data.reduce((s, d) => s + d.turnoverRate, 0) / data.length * 10) / 10
        : 0;
      const fastMovers = data.filter(d => d.turnoverRate >= 1).length;
      const slowMovers = data.filter(d => d.turnoverRate < 1).length;
      return { data, summary: { averageTurnover: avgTurnover, fastMovers, slowMovers } };
    } catch (e) {
      this.logger.warn(`getTurnover failed: ${(e as Error).message}`);
      return { data: [], summary: { averageTurnover: 0, fastMovers: 0, slowMovers: 0 } };
    }
  }

  async getTopMaterials(limit: number) {
    const lim = Math.min(Math.max(limit, 1), 50);
    const r = await rawSql(sql`
      SELECT mc.id AS material_id,
             COALESCE(mc.xom_ashyo, mc.kod) AS name,
             mc.kod,
             COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS value,
             COALESCE(SUM(ws.quantity), 0)::numeric AS movement
      FROM material_cards mc
      JOIN warehouse_stock ws ON ws.material_id = mc.id
      WHERE mc.is_active IS NOT FALSE
      GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.unit_price
      ORDER BY value DESC
      LIMIT ${lim}
    `);
    return ((r as { rows?: Record<string, unknown>[] }).rows ?? []).map(row => ({
      materialId: Number(row.material_id),
      name: String(row.name ?? '—'),
      kod: String(row.kod ?? ''),
      value: Number(row.value ?? 0),
      movement: Number(row.movement ?? 0),
    }));
  }
}
