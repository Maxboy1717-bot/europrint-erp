/**
 * @module crm-extras-documents.repository (infrastructure)
 * @description Sub-repository for CRM extras — invoices + proposals listing.
 *   Split from `crm-extras.repository.ts` (Wave 13 PR1) per the
 *   Wave 9 R16 umbrella-pattern. Plain `@Injectable()` — the umbrella
 *   `CrmExtrasRepository` is the sole implementer of `ICrmExtrasRepo`.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db, runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crm_proposals, crmContacts } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmExtrasDocumentsRepository {
  private readonly logger = new Logger(CrmExtrasDocumentsRepository.name);

  async listInvoices(lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        const rows = await runQuery<Row>(sql`
          SELECT i.id, i.company_id AS customer_id, i.total_amount AS amount, i.status,
                 i.due_date, i.created_at, i.number, i.title, i.currency,
                 c.name AS client_name
          FROM crm_invoices i
          LEFT JOIN sd_customers c ON c.id = i.company_id
          ORDER BY i.created_at DESC
          LIMIT ${lim} OFFSET ${off}
        `);
        return castTo<Row[]>(rows.rows);
      } catch (err) {
        this.logger.warn(`listInvoices: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async listProposals(lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select({
          id:           crm_proposals.id,
          contact_id:   crm_proposals.contact_id,
          title:        crm_proposals.title,
          status:       crm_proposals.status,
          amount:       crm_proposals.amount,
          created_at:   crm_proposals.created_at,
          contact_name: sql<string>`${crmContacts.first_name} || ' ' || ${crmContacts.last_name}`,
        })
          .from(crm_proposals)
          .leftJoin(crmContacts, eq(crmContacts.id, crm_proposals.contact_id))
          .orderBy(sql`${crm_proposals.created_at} DESC`)
          .limit(lim).offset(off).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`listProposals: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }
}
