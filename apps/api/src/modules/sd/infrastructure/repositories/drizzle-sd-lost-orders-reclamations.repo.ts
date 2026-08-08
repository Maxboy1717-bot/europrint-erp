/**
 * @module drizzle-sd-lost-orders-reclamations.repo
 * @description Repository implementation for SD lost-orders + reclamations.
 *   Parametrised raw SQL via `sql` template (no Drizzle schema definition yet
 *   for these two new tables — same pattern as sd-contracts.controller.ts).
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Ok, Err, AppErr, Result, safeCall } from '@common/result';
import {
  ISdLostOrdersReclamationsRepo, LostOrderRow, ReclamationRow,
  CreateLostOrderInput, CreateReclamationInput, ResolveReclamationInput,
} from '../../domain/repositories/i-sd-lost-orders-reclamations.repo';

@Injectable()
export class DrizzleSdLostOrdersReclamationsRepo implements ISdLostOrdersReclamationsRepo {
  private readonly logger = new Logger(DrizzleSdLostOrdersReclamationsRepo.name);

  async listLostOrders(filters: { reasonCode?: string; customerId?: number }): Promise<Result<LostOrderRow[]>> {
    return safeCall(async () => {
      return typedExecute<LostOrderRow>(sql`
        SELECT * FROM sd_lost_orders
        WHERE (${filters.reasonCode ?? null}::text IS NULL OR reason_code = ${filters.reasonCode ?? null})
          AND (${filters.customerId ?? null}::int IS NULL OR customer_id = ${filters.customerId ?? null})
        ORDER BY lost_date DESC, id DESC
        LIMIT 200
      `);
    });
  }

  async createLostOrder(input: CreateLostOrderInput): Promise<Result<LostOrderRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<LostOrderRow>(sql`
        INSERT INTO sd_lost_orders
          (sales_order_id, customer_id, reason_code, reason_text, lost_amount, competitor_name, lost_date, created_by)
        VALUES (
          ${input.salesOrderId ?? null}, ${input.customerId ?? null}, ${input.reasonCode},
          ${input.reasonText ?? null}, ${input.lostAmount ?? null}, ${input.competitorName ?? null},
          ${input.lostDate ?? new Date().toISOString().slice(0, 10)}, ${input.createdBy}
        )
        RETURNING *
      `);
      const row = rows[0];
      if (!row) throw new Error('Lost-order insert returned no row');
      return row;
    });
  }

  async listReclamations(filters: { status?: string; customerId?: number }): Promise<Result<ReclamationRow[]>> {
    return safeCall(async () => {
      return typedExecute<ReclamationRow>(sql`
        SELECT * FROM sd_reclamations
        WHERE (${filters.status ?? null}::text IS NULL OR status = ${filters.status ?? null})
          AND (${filters.customerId ?? null}::int IS NULL OR customer_id = ${filters.customerId ?? null})
        ORDER BY created_at DESC
        LIMIT 200
      `);
    });
  }

  async getReclamation(id: number): Promise<Result<ReclamationRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<ReclamationRow>(sql`SELECT * FROM sd_reclamations WHERE id = ${id} LIMIT 1`);
      const row = rows[0];
      if (!row) throw new Error('Reklamatsiya topilmadi');
      return row;
    }, 'NOT_FOUND');
  }

  async createReclamation(input: CreateReclamationInput): Promise<Result<ReclamationRow>> {
    try {
      const seq = await typedExecute<{ n: string | number }>(sql`SELECT nextval('sd_reclamations_id_seq') AS n`);
      const n = Number(seq[0]?.n ?? 0);
      const year = new Date().getFullYear();
      const reclamationNumber = `REC-${year}-${String(n).padStart(5, '0')}`;
      const rows = await typedExecute<ReclamationRow>(sql`
        INSERT INTO sd_reclamations
          (reclamation_number, sales_order_id, customer_id, category, description, sla_deadline, created_by)
        VALUES (
          ${reclamationNumber}, ${input.salesOrderId ?? null}, ${input.customerId ?? null},
          ${input.category ?? 'other'}, ${input.description}, ${input.slaDeadline ?? null}, ${input.createdBy}
        )
        RETURNING *
      `);
      const row = rows[0];
      if (!row) return Err(AppErr('DB_ERROR', 'Reclamation insert returned no row'));
      return Ok(row);
    } catch (e) {
      this.logger.error('createReclamation failed', e as Error);
      return Err(AppErr('DB_ERROR', (e as Error)?.message ?? 'Reclamation insert failed'));
    }
  }

  async resolveReclamation(id: number, input: ResolveReclamationInput): Promise<Result<ReclamationRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<ReclamationRow>(sql`
        UPDATE sd_reclamations
        SET status = ${input.status},
            resolution_text = COALESCE(${input.resolutionText ?? null}, resolution_text),
            resolved_at = CASE WHEN ${input.status} IN ('resolved','rejected') THEN now() ELSE resolved_at END,
            resolved_by = ${input.resolvedBy},
            updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `);
      const row = rows[0];
      if (!row) throw new Error('Reklamatsiya topilmadi');
      return row;
    }, 'NOT_FOUND');
  }
}
