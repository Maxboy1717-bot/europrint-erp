/**
 * @module create-inspection.handler
 * @description CQRS @CommandHandler for CreateInspectionCommand.
 * golden-thread hop 4: fixes POST /api/qc/inspections → 500 (no handler registered)
 *
 * RULE4_EXCEPTION: qc_inspections.id is INTEGER in the live DB while the Drizzle
 * schema declares it as UUID (schema drift added via migrations-drift). Raw SQL
 * INSERT is used so the DB sequence generates the id; avoids UUID→integer cast error.
 * Inspector_id is also integer in the live DB (schema drift from uuid). Reference_id
 * (uuid) is nullable — omitted here so no FK cast error occurs.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { AppErr, Err, Ok, Result } from '@common/result';
import { CreateInspectionCommand } from './submit-inspection.command';

type Row = Record<string, unknown>;

@Injectable()
@CommandHandler(CreateInspectionCommand)
export class CreateInspectionHandler implements ICommandHandler<CreateInspectionCommand> {
  private readonly logger = new Logger(CreateInspectionHandler.name);

  async execute(command: CreateInspectionCommand): Promise<Result<string>> {
    try {
      // RULE4_EXCEPTION: qc_inspections schema drift (id=integer in DB, uuid in Drizzle).
      // Raw SQL INSERT lets the DB sequence generate the integer id.
      const referenceType = command.batchId ? 'batch' : 'order';
      // A56 (2026-06-26) QC card-linkage: resolve BOTH cards from real master data inline so the
      // inspection records WHO inspected (inspector's card = users.card_id -> org_departments) and
      // WHAT production it covers (production card = production_orders.work_center_id ->
      // pp_work_centers.org_department_id). Each is a scalar sub-select returning the integer card id
      // or NULL — NO fabrication: when the inspector has no card, or the work-center is not yet tied to
      // an org card (owner data), the column stays NULL. orderId is the production order id.
      const r = await db.execute(sql`
        INSERT INTO qc_inspections
          (status, inspector_id, items_checked, items_passed, items_failed, reference_type,
           inspector_card_id, production_card_id)
        VALUES
          ('pending',
           ${command.inspectorId},
           ${command.sampleSize},
           ${command.sampleSize},
           0,
           ${referenceType},
           (SELECT u.card_id FROM users u WHERE u.id = ${command.inspectorId}),
           (SELECT wc.org_department_id
              FROM production_orders po
              JOIN pp_work_centers wc ON wc.id = po.work_center_id
             WHERE po.id = ${command.orderId}
             LIMIT 1))
        RETURNING id
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      const id = String(rows[0]?.['id'] ?? '');
      if (!id) return Err(AppErr('INTERNAL', 'Insert qc_inspections yieldga id qaytarmadi'));
      this.logger.log(`QC inspection created: id=${id}`);
      return Ok(id);
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Tekshiruv yaratishda xatolik';
      this.logger.error(msg);
      return Err(AppErr('INTERNAL', msg));
    }
  }
}
