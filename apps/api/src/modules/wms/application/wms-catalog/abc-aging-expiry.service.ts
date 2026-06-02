/**
 * @module wms-catalog/abc-aging-expiry.service
 * @description ABC, aging, and expiry sub-reports extracted from WmsCatalogService.
 */

import { Injectable, Logger } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class WmsCatalogAbcAgingExpiryService {
  private readonly logger = new Logger(WmsCatalogAbcAgingExpiryService.name);

  async getAbcAnalysis() {
    try {
      const r = await rawSql(sql`
        SELECT mc.id::text AS id, COALESCE(mc.xom_ashyo, mc.kod) AS name, mc.kod,
               COALESCE(mc.abc_segment, 'C') AS segment,
               COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS total_value
        FROM material_cards mc
        LEFT JOIN warehouse_stock ws ON ws.material_id = mc.id
        WHERE mc.is_active IS NOT FALSE
        GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.abc_segment
        ORDER BY total_value DESC LIMIT 100
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      const grandTotal = rawRows.reduce((s, row) => s + Number(row.total_value ?? 0), 0);
      let cumulative = 0;
      const data = rawRows.map(row => {
        const val = Number(row.total_value ?? 0);
        const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
        cumulative += pct;
        const cls = cumulative <= 80 ? 'A' : cumulative <= 95 ? 'B' : 'C';
        return {
          materialId: String(row.id),
          name: String(row.name ?? row.kod ?? ''),
          totalValue: val,
          percentage: Math.round(pct * 100) / 100,
          cumulativePercentage: Math.round(cumulative * 100) / 100,
          class: cls,
        };
      });
      const classA = data.filter(d => d.class === 'A').length;
      const classB = data.filter(d => d.class === 'B').length;
      const classC = data.filter(d => d.class === 'C').length;
      return { data, summary: { classA, classB, classC } };
    } catch (e) {
      this.logger.warn(`getAbcAnalysis failed: ${(e as Error).message}`);
      return { data: [], summary: { classA: 0, classB: 0, classC: 0 } };
    }
  }

  async getAging(daysThreshold: number) {
    try {
      const r = await rawSql(sql`
        SELECT bl.id::text AS id, COALESCE(bl.lot_number, bl.batch_number) AS lot_number,
               COALESCE(mc.xom_ashyo, mc.kod) AS material_name,
               bl.remaining_quantity AS quantity, bl.unit,
               COALESCE(mc.unit_price, 0)::numeric AS unit_price,
               mc.unit_of_measure,
               COALESCE(bl.received_date, bl.created_at) AS received_date,
               EXTRACT(DAY FROM NOW() - COALESCE(bl.received_date, bl.created_at))::int AS age_days
        FROM batch_lots bl
        LEFT JOIN material_cards mc ON mc.id = bl.material_id
        WHERE bl.remaining_quantity > 0 AND bl.is_active = true
        ORDER BY age_days DESC LIMIT 200
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      const data = rawRows.map(row => {
        const ageDays = Number(row.age_days ?? 0);
        const category = ageDays <= 30 ? 'active' : ageDays <= daysThreshold ? 'slow' : 'obsolete';
        const qty = Number(row.quantity ?? 0);
        const price = Number(row.unit_price ?? 0);
        return {
          materialId: String(row.id),
          name: String(row.material_name ?? ''),
          lastMovementDate: row.received_date ? String(row.received_date) : undefined,
          daysWithoutMovement: ageDays,
          currentStock: qty,
          value: qty * price,
          unitOfMeasure: String(row.unit_of_measure ?? row.unit ?? ''),
          category,
        };
      });
      const activeCount = data.filter(d => d.category === 'active').length;
      const slowCount = data.filter(d => d.category === 'slow').length;
      const obsoleteCount = data.filter(d => d.category === 'obsolete').length;
      const total = data.length || 1;
      return {
        data,
        summary: {
          activeCount, activePercent: Math.round(activeCount / total * 100),
          slowCount, slowPercent: Math.round(slowCount / total * 100),
          obsoleteCount, obsoletePercent: Math.round(obsoleteCount / total * 100),
        },
      };
    } catch (e) {
      this.logger.warn(`getAging failed: ${(e as Error).message}`);
      return { data: [], summary: { activeCount: 0, activePercent: 0, slowCount: 0, slowPercent: 0, obsoleteCount: 0, obsoletePercent: 0 } };
    }
  }

  async getExpiry(daysAhead: number) {
    try {
      const r = await rawSql(sql`
        SELECT bl.id::text AS id, COALESCE(bl.lot_number, bl.batch_number) AS lot_number,
               COALESCE(mc.xom_ashyo, mc.kod) AS material_name, mc.kod AS material_code,
               bl.remaining_quantity AS quantity, bl.unit, mc.unit_of_measure,
               COALESCE(mc.unit_price, 0)::numeric AS unit_price,
               bl.expiry_date,
               EXTRACT(DAY FROM bl.expiry_date - NOW())::int AS days_until_expiry
        FROM batch_lots bl
        LEFT JOIN material_cards mc ON mc.id = bl.material_id
        WHERE bl.expiry_date IS NOT NULL
          AND bl.remaining_quantity > 0 AND bl.is_active = true
          AND bl.expiry_date <= NOW() + (${daysAhead} || ' days')::interval
        ORDER BY bl.expiry_date ASC LIMIT 200
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      const data = rawRows.map(row => {
        const daysLeft = Number(row.days_until_expiry ?? 0);
        const qty = Number(row.quantity ?? 0);
        const price = Number(row.unit_price ?? 0);
        const status = daysLeft < 0 ? 'expired' : daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'warning' : 'ok';
        return {
          materialId: String(row.id), name: String(row.material_name ?? ''),
          batchNumber: String(row.lot_number ?? ''),
          expiryDate: row.expiry_date ? String(row.expiry_date) : undefined,
          daysToExpiry: daysLeft, quantity: qty, value: qty * price,
          unitOfMeasure: String(row.unit_of_measure ?? row.unit ?? ''),
          status,
        };
      });
      const expiredCount = data.filter(d => d.status === 'expired').length;
      const criticalCount = data.filter(d => d.status === 'critical').length;
      const totalAtRiskValue = data.filter(d => d.status !== 'ok').reduce((s, d) => s + d.value, 0);
      return { data, summary: { totalItems: data.length, expiredCount, criticalCount, totalAtRiskValue } };
    } catch (e) {
      this.logger.warn(`getExpiry failed: ${(e as Error).message}`);
      return { data: [], summary: { totalItems: 0, expiredCount: 0, criticalCount: 0, totalAtRiskValue: 0 } };
    }
  }
}
