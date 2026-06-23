/**
 * @module drizzle-pp-routings.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { routings, routingOperations } from '@europrint/schemas';
import { eq, isNull, count, desc, asc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IPpRoutingsRepository } from './i-pp-routings.repo';

type Row = Record<string, unknown>;
// NOTE: Canonical `routings` has uuid id, no deletedAt/updatedAt; soft-delete via is_active=false.

@Injectable()
export class DrizzlePpRoutingsRepository implements IPpRoutingsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(routings).where(eq(routings.is_active, true)).orderBy(desc(routings.created_at)).limit(limit).offset(offset),
        db.select({ count: count() }).from(routings).where(eq(routings.is_active, true)).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Routinglar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(routings).where(eq(routings.id, String(id))).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Routing #${id} topilmadi`); }
  }

  async findOperationsByRoutingId(routingId: string): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(routingOperations).where(eq(routingOperations.routingId, routingId)).orderBy(asc(routingOperations.sequence));
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Operatsiyalar topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      // Wave 2: REAL composite create (was header-only — operations[] were silently dropped, and the
      // controller threw 501). Raw parameterized SQL because the Drizzle routings/routingOperations
      // defs drift from live (operation_description + routing_number are NOT NULL live; ids are integer).
      const d = dto as { productId?: number; routingNumber?: string; operations?: Array<Record<string, unknown>> };
      const productId = Number(d.productId);
      const routingNumber = String(d.routingNumber ?? `RT-${Date.now()}`);
      const operations = Array.isArray(d.operations) ? d.operations : [];
      const hdr = await runQuery<{ id: number }>(sql`
        INSERT INTO routings (routing_number, product_id, version, status, is_active, created_at)
        VALUES (${routingNumber}, ${productId}, 1, 'draft', true, NOW()) RETURNING id`);
      const routingId = hdr.rows[0]?.id;
      if (!routingId) return Err('Routing header yaratilmadi');
      let created = 0;
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const wcId = Number(op.workCenterId ?? op.work_center_id);
        if (!Number.isFinite(wcId)) continue; // work_center_id NOT NULL FK -> noto'g'ri op'ni skip
        // Graf-ustunlar (predecessor/return/condition) berilsa olib boriladi; nochiziqli routing.
        await runQuery(sql`
          INSERT INTO routing_operations
            (routing_id, operation_number, operation_description, work_center_id, sequence, is_parallel,
             predecessor_operation_id, return_to_operation_id, routing_condition)
          VALUES (${routingId}, ${Number(op.operationNumber ?? op.operation_number ?? i + 1)},
             ${String(op.operationDescription ?? op.operation_description ?? `Operatsiya ${i + 1}`)},
             ${wcId}, ${Number(op.sequence ?? i + 1)}, ${Boolean(op.isParallel ?? op.is_parallel ?? false)},
             ${(op.predecessorOperationId ?? op.predecessor_operation_id ?? null) as number | null},
             ${(op.returnToOperationId ?? op.return_to_operation_id ?? null) as number | null},
             ${(op.routingCondition ?? op.routing_condition ?? null) as string | null})`);
        created++;
      }
      return Ok({ id: routingId, routingNumber, productId, operationsCreated: created });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(routings).set(dto as Partial<typeof routings.$inferInsert>).where(eq(routings.id, String(id))).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      // No deletedAt column on canonical schema — soft-delete by toggling is_active.
      await db.update(routings).set({ is_active: false } as Partial<typeof routings.$inferInsert>).where(eq(routings.id, String(id)));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
