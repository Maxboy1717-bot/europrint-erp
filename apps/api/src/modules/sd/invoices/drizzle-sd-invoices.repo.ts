import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { salesInvoices } from '@europrint/schemas';
import { eq, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ISdInvoicesRepository } from './i-sd-invoices.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleSdInvoicesRepository implements ISdInvoicesRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(salesInvoices).where(isNull(salesInvoices.deletedAt)).limit(1).offset(0),
        db.select().from(salesInvoices).where(isNull(salesInvoices.deletedAt)).orderBy(desc(salesInvoices.createdAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Hisob-fakturalar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Hisob-faktura #${id} topilmadi`); }
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(salesInvoices).where(eq(salesInvoices.invoiceNumber, invoiceNumber)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Hisob-faktura topilmadi'); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(salesInvoices).values({ ...dto, status: 'draft', ...(createdBy ? { createdBy } : {} as typeof salesInvoices.$inferInsert) } as typeof salesInvoices.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }
}
