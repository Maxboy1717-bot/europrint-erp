/**
 * @module pos-barcode-ext.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */


import { Injectable } from '@nestjs/common';
import type { SQL, SQLWrapper } from 'drizzle-orm';
import { materialCardSuggestions, materialCards, posBarcodePrintQueue, db, sql, eq, and } from '@workspace/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await db.execute(q)).rows as Row[];
};

@Injectable()
export class PosBarcodeExtRepository {
  async createMaterialCard(name: string, nameRu: string, barcode: string | null, unit: string): Promise<Result<{ id: number }>> {
    return safeCall(async () => {
      const r = await exec(sql`INSERT INTO material_cards (xom_ashyo, xom_ashyo_ru, barcode, unit_of_measure) VALUES (${name}, ${nameRu}, ${barcode ?? null}, ${unit}) RETURNING id`);
      return { id: Number(r[0]?.id) };
      }, 'DB_ERROR');
  }

  async findPendingAiSuggestion(barcode: string) : Promise<Result<Record<string, unknown> | null>>{
    return safeCall(async () => {
      const [existing] = await db.select().from(materialCardSuggestions).where(and(eq(materialCardSuggestions.unknownBarcode, barcode), eq(materialCardSuggestions.status, 'PENDING')));
      return existing ?? null;
      }, 'DB_ERROR');
  }

  async createAiSuggestion(barcode: string) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [suggestion] = await db.insert(materialCardSuggestions).values({ triggeredBy: 'AI', unknownBarcode: barcode, suggestedName: `Noma'lum (${barcode})`, aiConfidence: 0, aiReasoning: 'Barcode bazada topilmadi. Qo\'lda tasdiqlash kerak.', status: 'PENDING' } as typeof materialCardSuggestions.$inferInsert).returning();
      return suggestion;
      }, 'DB_ERROR');
  }

  async findMaterialCardById(id: number) : Promise<Result<Record<string, unknown> | null>>{
    return safeCall(async () => {
      const [card] = await db.select({ id: materialCards.id, name: materialCards.xomAshyo, barcode: materialCards.barcode }).from(materialCards).where(eq(materialCards.id, id));
      return card ?? null;
      }, 'DB_ERROR');
  }

  async createPrintQueueJob(data: typeof posBarcodePrintQueue.$inferInsert) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [printJob] = await db.insert(posBarcodePrintQueue).values(data).returning();
      return printJob;
      }, 'DB_ERROR');
  }

  async findSuggestionById(id: number) : Promise<Result<Record<string, unknown> | null>>{
    return safeCall(async () => {
      const [suggestion] = await db.select().from(materialCardSuggestions).where(eq(materialCardSuggestions.id, id));
      return suggestion ?? null;
      }, 'DB_ERROR');
  }

  async updateSuggestionDecision(id: number, data: { status: string; reviewedBy: number; reviewedAt: Date; createdMaterialCardId?: number; rejectionReason?: string }) : Promise<Result<void>>{
    return safeCall(async () => {
      await db.update(materialCardSuggestions).set(data as Partial<typeof materialCardSuggestions.$inferInsert>).where(eq(materialCardSuggestions.id, id));
      }, 'DB_ERROR');
  }

  async getStockInfo(materialCardId: number, warehouseId: string): Promise<Result<{ currentStock: number; availableStock: number }>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COALESCE(cs.quantity_on_hand, 0) AS current_stock, COALESCE(cs.quantity_on_hand, 0) - COALESCE((SELECT COALESCE(SUM(reserved_qty), 0) FROM stock_reservations WHERE material_id = ${materialCardId} AND warehouse_id = ${warehouseId} AND status = 'ACTIVE'), 0) AS available_stock FROM current_stock cs WHERE cs.material_id = ${materialCardId} AND cs.warehouse_id = ${warehouseId} LIMIT 1`);
      const row = r[0] ?? {};
      return { currentStock: Number(row.current_stock ?? 0), availableStock: Number(row.available_stock ?? 0) };
      }, 'DB_ERROR');
  }
}
