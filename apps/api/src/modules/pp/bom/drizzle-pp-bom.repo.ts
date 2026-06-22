/**
 * @module drizzle-pp-bom.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { bomHeaders, bomItems } from '@europrint/schemas';
import { eq, isNull, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IPpBomRepository } from './i-pp-bom.repo';

import { MAX_EXPORT_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
@Injectable()
export class DrizzlePpBomRepository implements IPpBomRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(bomHeaders).where(isNull(bomHeaders.deletedAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(bomHeaders).where(isNull(bomHeaders.deletedAt)).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'BOM-lar topilmadi'); }
  }

  async findById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(bomHeaders).where(eq(bomHeaders.id, id)).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `BOM #${id} topilmadi`); }
  }

  async findItemsByBomId(bomId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(bomItems).where(eq(bomItems.bomId, bomId)).limit(MAX_EXPORT_LIMIT).offset(0);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'BOM elementlari topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      // product_id is an INTEGER column (FK products.id). The DTO sends a number;
      // never coerce to string ('') — that 500s with "invalid input syntax for type integer".
      const productId = Number(dto.productId);
      if (!Number.isFinite(productId) || productId <= 0) {
        return Err('Mahsulot (productId) noto\'g\'ri');
      }

      // bom_number is NOT NULL with no DB default — it MUST be supplied or the
      // header INSERT fails with a NOT NULL violation.
      const bomNumber =
        (typeof dto.bomNumber === 'string' && dto.bomNumber.trim().length > 0)
          ? (dto.bomNumber as string)
          : `BOM-${productId}-${Date.now()}`;

      // items[] component lines from the DTO — these MUST be persisted, not dropped.
      const rawItems = Array.isArray(dto.items) ? (dto.items as Array<Record<string, unknown>>) : [];

      const created = await db.transaction(async (tx) => {
        const headerRow = {
          bomNumber,
          productId,
          version: (typeof dto.version === 'string' && dto.version.length > 0) ? (dto.version as string) : '1.0',
          status: (typeof dto.status === 'string' && dto.status.length > 0) ? (dto.status as string) : 'draft',
          baseQuantity: dto.baseQuantity !== undefined ? Number(dto.baseQuantity) : 1,
          baseUnit: (typeof dto.baseUnit === 'string' && dto.baseUnit.length > 0) ? (dto.baseUnit as string) : 'dona',
          description: (typeof dto.description === 'string') ? (dto.description as string) : null,
          isActive: (dto.isActive as boolean | undefined) ?? true,
        };
        const [header] = await tx
          .insert(bomHeaders)
          // live product_id column is INTEGER; the generated insert type (from the
          // schema barrel) types it as string — cast through unknown to keep the
          // numeric value Postgres actually requires.
          .values(headerRow as unknown as typeof bomHeaders.$inferInsert)
          .returning();

        const bomId = Number((header as { id: number }).id);

        if (rawItems.length > 0) {
          const itemRows = rawItems.map((it, idx) => {
            // accept both componentId and materialId from the form payload
            const componentId = Number(it.componentId ?? it.materialId);
            return {
              bomId,
              itemNumber: (typeof it.itemNumber === 'string' && it.itemNumber.length > 0)
                ? (it.itemNumber as string)
                : String(idx + 1),
              componentType: (typeof it.componentType === 'string' && it.componentType.length > 0)
                ? (it.componentType as string)
                : 'material',
              componentId,
              quantity: Number(it.quantity),
              unit: (typeof it.unit === 'string' && it.unit.length > 0) ? (it.unit as string) : 'dona',
              scrapPercentage: it.scrapPercentage !== undefined ? Number(it.scrapPercentage) : 0,
              position: it.position !== undefined ? Number(it.position) : idx,
              notes: (typeof it.notes === 'string') ? (it.notes as string) : null,
            } as unknown as typeof bomItems.$inferInsert;
          });
          await tx.insert(bomItems).values(itemRows);
        }

        return header;
      });

      return Ok(created);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const patch: Partial<typeof bomHeaders.$inferInsert> = {
        ...(dto.productId !== undefined ? { productId: Number(dto.productId) } : {}),
        ...(dto.version !== undefined ? { version: dto.version as string } : {}),
        ...(dto.status !== undefined ? { status: dto.status as string } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive as boolean } : {}),
        updatedAt: _time.now(),
      };
      const result = await db.update(bomHeaders).set(patch).where(eq(bomHeaders.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async approve(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(bomHeaders).set({ status: 'active' }).where(eq(bomHeaders.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Tasdiqlashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(bomHeaders).set({ deletedAt: _time.now() }).where(eq(bomHeaders.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
