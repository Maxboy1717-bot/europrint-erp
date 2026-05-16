/**
 * @module crm-bitrix-compat.repository (infrastructure)
 * @description Drizzle implementation of {@link ICrmBitrixCompatRepo}.
 *   Migrated from `application/crm-bitrix-compat.repository.ts` per PA1-9.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crm_proposals, crm_robots, invoices } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { ICrmBitrixCompatRepo } from '../../domain/repositories/i-crm-bitrix-compat.repo';

type Row = Record<string, unknown>;

@Injectable()
export class CrmBitrixCompatRepository implements ICrmBitrixCompatRepo {
  private readonly logger = new Logger(CrmBitrixCompatRepository.name);

  async listProposals(lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select({
          id:           crm_proposals.id,
          leadId:       sql<number>`null`,
          contactId:    crm_proposals.contact_id,
          title:        crm_proposals.title,
          amount:       crm_proposals.amount,
          status:       crm_proposals.status,
          description:  sql<string>`null`,
          createdAt:    crm_proposals.created_at,
          updatedAt:    crm_proposals.updated_at,
        })
          .from(crm_proposals)
          .orderBy(sql`${crm_proposals.created_at} DESC`)
          .limit(lim).offset(off).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`listProposals: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

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

  async listRobots(lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select().from(crm_robots)
          .orderBy(sql`${crm_robots.created_at} DESC`)
          .limit(lim).offset(off).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`listRobots: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async getRobot(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      try {
        const rows = await db.select().from(crm_robots).where(eq(crm_robots.id, id));
        return (rows[0] ?? null) as Row | null;
      } catch (err) {
        this.logger.warn(`getRobot: ${(err as Error).message}`);
        throw err;
      }
      }, 'DB_ERROR');
  }

  async createRobot(body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.insert(crm_robots).values({
        name:         (body.name as string) ?? 'New Robot',
        trigger_type: (body.trigger_event as string) ?? undefined,
        action_type:  (body.type as string) ?? 'automation',
        config:       body.actions ? { actions: body.actions, conditions: body.conditions ?? null } : undefined,
        is_active:    (body.is_active as boolean) ?? true,
      }).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async updateRobot(id: number, body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(crm_robots).set({
        name:         sql`COALESCE(${body.name ?? null}, ${crm_robots.name})`,
        trigger_type: sql`COALESCE(${body.trigger_event ?? null}, ${crm_robots.trigger_type})`,
        action_type:  sql`COALESCE(${body.type ?? null}, ${crm_robots.action_type})`,
      }).where(eq(crm_robots.id, id)).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async toggleRobot(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(crm_robots)
        .set({ is_active: sql`NOT ${crm_robots.is_active}` })
        .where(eq(crm_robots.id, id))
        .returning({ id: crm_robots.id, is_active: crm_robots.is_active });
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async deleteRobot(id: number): Promise<void> {
    await db.delete(crm_robots).where(eq(crm_robots.id, id));
  }

  async updateProposalStage(id: number, status: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(crm_proposals)
        .set({ status: status as typeof crm_proposals.$inferInsert['status'], updated_at: new Date() })
        .where(eq(crm_proposals.id, id))
        .returning();
      return (rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async updateInvoiceStage(id: number, status: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(invoices)
        .set({ status: status as typeof invoices.$inferInsert['status'], updated_at: new Date() })
        .where(eq(invoices.id, String(id)))
        .returning();
      return (rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }
}
