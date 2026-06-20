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
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
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

  async listProposals(lim: number, off: number, dealId?: number | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        const rows = await runQuery<Row>(sql`
          SELECT p.id,
                 p.deal_id,
                 p.contact_id,
                 p.title,
                 p.status,
                 p.amount,
                 p.created_at,
                 c.first_name || ' ' || c.last_name AS contact_name
          FROM crm_proposals p
          LEFT JOIN crm_contacts c ON c.id = p.contact_id
          ${dealId ? sql`WHERE p.deal_id = ${dealId}` : sql``}
          ORDER BY p.created_at DESC
          LIMIT ${lim} OFFSET ${off}
        `);
        return castTo<Row[]>(rows.rows);
      } catch (err) {
        this.logger.warn(`listProposals: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }
}
