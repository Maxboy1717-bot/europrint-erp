/**
 * @module inventory-advanced.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class InventoryAdvancedRepository {
  private readonly logger = new Logger(InventoryAdvancedRepository.name);

  async getAnalytics() {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT (SELECT COUNT(*) FROM inventory_counts) AS total_counts, (SELECT COUNT(*) FROM inventory_counts WHERE status = 'in_progress') AS in_progress, (SELECT COUNT(*) FROM inventory_counts WHERE status = 'completed') AS completed, (SELECT COALESCE(SUM(total_items), 0) FROM inventory_counts WHERE status = 'completed') AS total_items_counted, (SELECT COALESCE(SUM(variance_items), 0) FROM inventory_counts WHERE status = 'completed') AS total_variance_items, (SELECT COALESCE(SUM(total_variance), 0) FROM inventory_counts WHERE status = 'completed') AS total_variance_value`);
      return (rows[0] ?? {}) as Row;
    });
  }

  async findCounts(status?: string, warehouseId?: string, limit = 50, offset = 0) {
    return safeCall(async () =>
      status && warehouseId
        ? exec(sql`SELECT * FROM inventory_counts WHERE status = ${status} AND warehouse_id = ${warehouseId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : status
        ? exec(sql`SELECT * FROM inventory_counts WHERE status = ${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : warehouseId
        ? exec(sql`SELECT * FROM inventory_counts WHERE warehouse_id = ${warehouseId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT * FROM inventory_counts ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    );
  }

  async getBarcodeAssignments(limit = 50, offset = 0) {
    return safeCall(async () =>
      exec(sql`SELECT * FROM inventory_barcode_assignments ORDER BY assigned_at DESC LIMIT ${limit} OFFSET ${offset}`)
    );
  }
}
