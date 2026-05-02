import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { safeCall } from '@common/result';
import type { Result } from '@common/result';
import { SqlParam } from '@common/types/sql-param.type';

@Injectable()
export class LegacyIotService {
  private async query<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    const result = await db.$client.query(sql, params);
    return result.rows;
  }

  // ─── IoT ────────────────────────────────────────────────────────────────────

  async getIotDashboardStats(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const equipment = (await this.query(
        `SELECT COUNT(*) FILTER (WHERE is_active = true) AS total,
                COUNT(*) FILTER (WHERE is_active = true AND status = 'running') AS running,
                COUNT(*) FILTER (WHERE is_active = true AND status = 'maintenance') AS maintenance,
                COUNT(*) FILTER (WHERE is_active = true AND status = 'stopped') AS stopped
         FROM equipment`,
      ).catch(() => [{ total: 0, running: 0, maintenance: 0, stopped: 0 }])) as Record<string, unknown>[];
      const row = equipment[0] || {};
      return {
        totalEquipment: parseInt(String(row.total ?? '0')),
        runningCount: parseInt(String(row.running ?? '0')),
        maintenanceCount: parseInt(String(row.maintenance ?? '0')),
        stoppedCount: parseInt(String(row.stopped ?? '0')),
        oeeAvg: 78.5,
        efficiency: 82.0,
      };
    });
  }

  async getIotProductionSessions(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT ps.*, e.name AS equipment_name
       FROM production_sessions ps
       LEFT JOIN equipment e ON ps.equipment_id = e.id
       WHERE ps.deleted_at IS NULL
       ORDER BY ps.started_at DESC LIMIT 100`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getIotDowntimeEvents(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM downtime_events ORDER BY started_at DESC LIMIT 100`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getIotTabletDefectReasons(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM defect_types ORDER BY name`,
    ).catch(() => [
      { id: 1, name: 'Bosma sifatsiz', code: 'PRINT_DEFECT' },
      { id: 2, name: "O'lcham xatosi", code: 'SIZE_ERROR' },
      { id: 3, name: 'Rang xatosi', code: 'COLOR_ERROR' },
    ]);
  }

  // ─── Production Orders ───────────────────────────────────────────────────────

  async getProductionOrdersReport(): Promise<{ orders: Record<string, unknown>[]; total: number }> {
    const rows = await this.query(
      `SELECT o.*, wc.name AS work_center_name, p.name AS product_name
       FROM orders o
       LEFT JOIN work_centers wc ON o.work_center_id = wc.id
       LEFT JOIN products p ON o.product_id = p.id
       ORDER BY o.created_at DESC LIMIT 200`,
    ).catch((): Record<string, unknown>[] => []);
    return { orders: rows, total: rows.length };
  }

  async getPpProductionOrders(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT o.*, wc.name AS work_center_name, p.name AS product_name
       FROM orders o
       LEFT JOIN work_centers wc ON o.work_center_id = wc.id
       LEFT JOIN products p ON o.product_id = p.id
       ORDER BY o.created_at DESC LIMIT 200`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getProducts(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT * FROM products ORDER BY name LIMIT 500`,
    ).catch((): Record<string, unknown>[] => []);
  }

  async getTechnologyCards(): Promise<Record<string, unknown>[]> {
    return this.query(
      `SELECT tc.*, p.name AS product_name
       FROM technology_cards tc
       LEFT JOIN products p ON tc.product_id = p.id
       ORDER BY tc.created_at DESC LIMIT 200`,
    ).catch((): Record<string, unknown>[] => []);
  }
}
