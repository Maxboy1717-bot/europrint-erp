/**
 * @module crm-bitrix-compat-invoices.repository (infrastructure)
 * @description Sub-repository for Bitrix-compatible CRM invoices.
 *   Split from `crm-bitrix-compat.repository.ts` (Wave 13 PR1) per the
 *   Wave 9 R16 umbrella-pattern. Plain `@Injectable()` — the umbrella
 *   `CrmBitrixCompatRepository` is the sole implementer of `ICrmBitrixCompatRepo`.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { invoices } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmBitrixCompatInvoicesRepository {
  private readonly logger = new Logger(CrmBitrixCompatInvoicesRepository.name);

  async listInvoices(lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select({
          id:            invoices.id,
          dealId:        sql<string>`null`,
          contactId:     sql<string>`null`,
          invoiceNumber: invoices.invoice_number,
          totalAmount:   invoices.total_amount,
          status:        invoices.status,
          dueDate:       invoices.due_date,
          createdAt:     invoices.created_at,
          updatedAt:     invoices.updated_at,
        })
          .from(invoices)
          .orderBy(sql`${invoices.created_at} DESC`)
          .limit(lim).offset(off).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`listInvoices: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  // invoices.id is a uuid — take the raw string id. The controller used to
  // parseInt(id) which produced NaN->0, so eq(id, '0') matched no invoice and
  // stage/delete silently affected zero rows.
  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async updateInvoiceStage(id: string, status: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(invoices)
        .set({ status: status as typeof invoices.$inferInsert['status'], updated_at: new Date() })
        .where(eq(invoices.id, id))
        .returning();
      return (rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }
}
