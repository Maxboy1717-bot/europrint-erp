/**
 * @module pos-movement-query.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { posMovements, posMovementLines, db, and, eq, sql, desc } from '@workspace/db';
import { MovementFilterDto } from '../../dto/movement.dto';

type Row = Record<string, unknown>;
interface MovementPagedResult { items: Row[]; total: number; page: number; limit: number; totalPages: number }

@Injectable()
export class PosMovementQueryRepository {
  async findAll(filter: MovementFilterDto): Promise<Result<MovementPagedResult>> {
  try {  
      const page   = filter.page  ?? 1;
      const limit  = filter.limit ?? 20;
      const offset = (page - 1) * limit;
  
      const conditions = [];
      if (filter.status)         conditions.push(eq(posMovements.status, filter.status));
      if (filter.warehouseId)    conditions.push(sql`(from_warehouse_id = ${filter.warehouseId} OR to_warehouse_id = ${filter.warehouseId})`);
      if (filter.supplierName)   conditions.push(sql`supplier_name ILIKE ${'%' + filter.supplierName + '%'}`);
      if (filter.movementNumber) conditions.push(eq(posMovements.movementNumber, filter.movementNumber));
      if (filter.materialCardId) conditions.push(sql`id IN (SELECT movement_id FROM pos_movement_lines WHERE material_card_id = ${filter.materialCardId})`);
      if (filter.dateFrom)       conditions.push(sql`created_at >= ${new Date(filter.dateFrom)}`);
      if (filter.dateTo)         conditions.push(sql`created_at <= ${new Date(filter.dateTo)}`);
  
      const where = conditions.length ? and(...conditions) : undefined;
      const [items, [{ total }]] = await Promise.all([
        db.select().from(posMovements).where(where).orderBy(desc(posMovements.createdAt)).limit(limit).offset(offset),
        db.select({ total: sql<number>`count(*)` }).from(posMovements).where(where),
      ]);
      return Ok({ items, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findOne(movementId: number): Promise<Result<Row | null>> {
  try {  
      const [movement] = await db.select().from(posMovements).where(eq(posMovements.id, movementId));
      if (!movement) return Ok(null);
      const lines = await db.select().from(posMovementLines).where(eq(posMovementLines.movementId, movementId));
      return Ok({ ...movement, lines });  } catch (_e) {
    return Err(String(_e));
  }

  }
}
