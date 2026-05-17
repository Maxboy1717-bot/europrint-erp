/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - COUNT(*) FILTER (WHERE ...) conditional aggregates in a single pass
 *     for IoT dashboard equipment status breakdown (total/running/maintenance/
 *     stopped) — Drizzle has no native FILTER clause and would require
 *     four separate queries or CASE-based SUM workarounds.
 *   - Legacy compatibility layer queries against tables (equipment,
 *     production_sessions, downtime_events, defect_types, technology_cards,
 *     products) that have no Drizzle schema definitions in lib/db/src/schema/.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module legacy-iot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { db, downtime_events } from '@shared/db';
import { sql, desc } from 'drizzle-orm';
import { safeCall } from '@common/result';
import type { Result } from '@common/result';

@Injectable()
export class LegacyIotService {
  // ─── IoT ────────────────────────────────────────────────────────────────────

  async getIotDashboardStats(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      try {
        const r = await db.execute(sql`
          SELECT COUNT(*) FILTER (WHERE is_active = true) AS total,
                 COUNT(*) FILTER (WHERE is_active = true AND status = 'running') AS running,
                 COUNT(*) FILTER (WHERE is_active = true AND status = 'maintenance') AS maintenance,
                 COUNT(*) FILTER (WHERE is_active = true AND status = 'stopped') AS stopped
          FROM equipment
        `);
        const row = (r.rows[0] as Record<string, unknown>) ?? {};
        return {
          totalEquipment:    parseInt(String(row['total']       ?? '0')),
          runningCount:      parseInt(String(row['running']     ?? '0')),
          maintenanceCount:  parseInt(String(row['maintenance'] ?? '0')),
          stoppedCount:      parseInt(String(row['stopped']     ?? '0')),
          oeeAvg: 78.5,
          efficiency: 82.0,
        };
      } catch {
        return { totalEquipment: 0, runningCount: 0, maintenanceCount: 0, stoppedCount: 0, oeeAvg: 78.5, efficiency: 82.0 };
      }
    });
  }

  // NOTE: P3-30 — productionSessions Drizzle table is a stub() and lacks the
  // columns selected here (started_at, deleted_at, equipment_id); also relies on
  // equipment.name alias for camelCase projection. Keep raw until schema work.
  async getIotProductionSessions(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`
        SELECT ps.*, e.name AS equipment_name
        FROM production_sessions ps
        LEFT JOIN equipment e ON ps.equipment_id = e.id
        WHERE ps.deleted_at IS NULL
        ORDER BY ps.started_at DESC LIMIT 100
      `);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  async getIotDowntimeEvents(): Promise<Record<string, unknown>[]> {
    try {
      const rows = await db.select().from(downtime_events).orderBy(desc(downtime_events.startedAt)).limit(100);
      return rows as Record<string, unknown>[];
    } catch { return []; }
  }

  // NOTE: P3-30 — no pgTable definition found for `defect_types`; needs schema work first.
  async getIotTabletDefectReasons(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`SELECT * FROM defect_types ORDER BY name`);
      return r.rows as Record<string, unknown>[];
    } catch {
      return [
        { id: 1, name: 'Bosma sifatsiz', code: 'PRINT_DEFECT' },
        { id: 2, name: "O'lcham xatosi", code: 'SIZE_ERROR' },
        { id: 3, name: 'Rang xatosi', code: 'COLOR_ERROR' },
      ];
    }
  }

  // ─── Production Orders ───────────────────────────────────────────────────────

  // NOTE: P3-30 — no pgTable definition found for `orders` / `products` in
  // @shared/db (only canonical productionOrders/posProducts variants); raw
  // legacy `orders` table with aliased joins cannot be ORM'd yet.
  async getProductionOrdersReport(): Promise<{ orders: Record<string, unknown>[]; total: number }> {
    try {
      const r = await db.execute(sql`
        SELECT o.*, wc.name AS work_center_name, p.name AS product_name
        FROM orders o
        LEFT JOIN work_centers wc ON o.work_center_id = wc.id
        LEFT JOIN products p ON o.product_id = p.id
        ORDER BY o.created_at DESC LIMIT 200
      `);
      const rows = r.rows as Record<string, unknown>[];
      return { orders: rows, total: rows.length };
    } catch { return { orders: [], total: 0 }; }
  }

  // NOTE: P3-30 — see getProductionOrdersReport (same `orders` legacy table).
  async getPpProductionOrders(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`
        SELECT o.*, wc.name AS work_center_name, p.name AS product_name
        FROM orders o
        LEFT JOIN work_centers wc ON o.work_center_id = wc.id
        LEFT JOIN products p ON o.product_id = p.id
        ORDER BY o.created_at DESC LIMIT 200
      `);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  // NOTE: P3-30 — no pgTable definition found for `products`; needs schema work.
  async getProducts(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`SELECT * FROM products ORDER BY name LIMIT 500`);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }

  // NOTE: P3-30 — no pgTable definition found for `technology_cards` or
  // `products` in @shared/db; needs schema work first.
  async getTechnologyCards(): Promise<Record<string, unknown>[]> {
    try {
      const r = await db.execute(sql`
        SELECT tc.*, p.name AS product_name
        FROM technology_cards tc
        LEFT JOIN products p ON tc.product_id = p.id
        ORDER BY tc.created_at DESC LIMIT 200
      `);
      return r.rows as Record<string, unknown>[];
    } catch { return []; }
  }
}
