/**
 * @module get-inventory-levels.tool
 */

// RULE4_EXCEPTION: AIsha tools intentionally use raw SQL. Each tool
// aggregates across cross-module tables (sales, production, HR, finance,
// security, IoT, kanban, calendar) that the AIsha module does not own.
// Importing every Drizzle schema would create tight coupling between
// AIsha and every other domain module. The read-only / single-INSERT
// raw SQL keeps AIsha a loose query-adapter layer over the ERP. Drizzle
// ORM is used elsewhere; see [[aisha-final-report]] for the
// architectural rationale.

import { Injectable } from '@nestjs/common';
import { Result, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface InventoryLevel {
  sku: string; name: string; qty: number;
  reorderPoint: number; daysUntilDepletion: number | null;
  warehouseCode: string;
}

@Injectable()
export class GetInventoryLevelsTool implements IAishaTool {
  readonly definition = {
    name: 'get_inventory_levels',
    description: 'Ombor zaxiralari: hozirgi qoldiq, tugash kunlari, reorder point.',
    input_schema: {
      type: 'object' as const,
      properties: {
        itemName:       { type: 'string', description: 'Material nomi yoki SKU' },
        warehouseCode:  { type: 'string', description: 'Ombor kodi (ixtiyoriy)' },
      },
    },
  };

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<InventoryLevel[]>>> {
    const item = String(input['itemName'] ?? '');
    const wh = String(input['warehouseCode'] ?? '');
    return safeCall<ToolResult<InventoryLevel[]>>(async () => {
      const start = Date.now();
      const rows = rowsOf<{
        sku: string; name: string; qty: number; reorder_point: number;
        avg_daily_use: number | null; warehouse_code: string;
      }>(await db.execute(sql`
        SELECT m.sku, m.name, s.qty_on_hand AS qty,
               COALESCE(m.reorder_point,0) AS reorder_point,
               s.avg_daily_use, s.warehouse_code
        FROM mm_materials m
        JOIN wms_warehouse_stock s ON s.material_id = m.id
        WHERE (${item} = '' OR LOWER(m.name) LIKE LOWER('%' || ${item} || '%') OR m.sku = ${item})
          AND (${wh} = '' OR s.warehouse_code = ${wh})
        ORDER BY s.qty_on_hand ASC LIMIT 50
      `));
      const data = rows.map(r => ({
        sku: r.sku, name: r.name, qty: r.qty,
        reorderPoint: r.reorder_point, warehouseCode: r.warehouse_code,
        daysUntilDepletion: r.avg_daily_use && r.avg_daily_use > 0 ? Math.floor(r.qty / r.avg_daily_use) : null,
      }));
      return provResult<InventoryLevel[]>({
        data,
        sources: [
          provSource({ type: 'database', identifier: 'wms.warehouse_stock', startMs: start, rowCount: data.length }),
          provSource({ type: 'database', identifier: 'mm.materials', startMs: start, rowCount: data.length }),
        ],
      });
    });
  }
}
