/**
 * @module crm-bitrix-compat-proposals.repository (infrastructure)
 * @description Sub-repository for Bitrix-compatible CRM proposals.
 *   Split from `crm-bitrix-compat.repository.ts` (Wave 13 PR1) per the
 *   Wave 9 R16 umbrella-pattern. Plain `@Injectable()` — the umbrella
 *   `CrmBitrixCompatRepository` is the sole implementer of `ICrmBitrixCompatRepo`.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crm_proposals } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmBitrixCompatProposalsRepository {
  private readonly logger = new Logger(CrmBitrixCompatProposalsRepository.name);

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

  async deleteProposal(id: number): Promise<void> {
    await db.delete(crm_proposals).where(eq(crm_proposals.id, id));
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
}
