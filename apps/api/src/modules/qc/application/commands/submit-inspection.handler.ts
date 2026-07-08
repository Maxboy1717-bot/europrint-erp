/**
 * @module submit-inspection.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { sql, SQL } from 'drizzle-orm';
import { db } from '@shared/db';
import { AppErr, Err, Ok, Result } from '@common/result';
import {
  QC_FINAL_INSPECTION_REFERENCE_TYPE,
  QC_FINAL_SIGNOFF_MIN_RAZRYAD_LEVEL,
} from '@common/constants/business.constants';
import { SubmitInspectionCommand, QcDecision } from './submit-inspection.command';
import { QcPassedEvent, QcFailedEvent, QcReworkEvent, SupplierQualityFailEvent } from '../../domain/events';
import { IQcRepository, QC_REPOSITORY_PROVIDER, DrizzleExecutor } from '../repositories/qc.repository';

type Row = Record<string, unknown>;

/** Narrow shape of a Drizzle executor (db or tx) — same pattern as drizzle-inspection.repo.ts. */
type ExecLike = { execute: (q: SQL) => Promise<{ rows?: Row[] }> };

@Injectable()
@CommandHandler(SubmitInspectionCommand)
export class SubmitInspectionHandler implements ICommandHandler<SubmitInspectionCommand> {
  private readonly logger = new Logger(SubmitInspectionHandler.name);

  constructor(
    @Inject(QC_REPOSITORY_PROVIDER) private readonly qcRepository: IQcRepository,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * VISION-3340 #37 — razryad-based sign-off gate for FINAL QC.
   * Card linkage (`qc_inspections.inspector_card_id`) is already real (A56); this
   * closes the gap where nothing enforced a minimum razryad on final sign-off.
   *
   * Only gates when the row's `reference_type` is literally
   * QC_FINAL_INSPECTION_REFERENCE_TYPE ('final') — in-process/batch/production_order
   * inspections are unaffected. Reuses the exact join pattern already used in
   * create-inspection.handler.ts / drizzle-auth.repo.ts:
   *   org_departments od LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
   *
   * `inspectionId` in this module is always the live-DB integer id (see
   * drizzle-inspection.repo.ts RULE4_EXCEPTION comment) once it has round-tripped
   * through findById; a non-numeric id (e.g. a synthetic/unit-test aggregate id
   * that never touched the DB) means there is no row to resolve a type from, so
   * NO fabrication — we don't block (Q-40/Q-46).
   */
  private async checkFinalSignoffRazryadGate(
    inspectionId: string,
    tx?: DrizzleExecutor,
  ): Promise<Result<void>> {
    const idNum = Number(inspectionId);
    if (!Number.isFinite(idNum)) return Ok(undefined);

    try {
      const exec = (tx ?? db) as unknown as ExecLike;
      const result = await exec.execute(sql`
        SELECT qi.reference_type,
          (SELECT rl.level FROM org_departments od
             LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
            WHERE od.id = qi.inspector_card_id) AS inspector_razryad_level
        FROM qc_inspections qi
        WHERE qi.id = ${idNum}
      `);
      const rows = Array.isArray(result?.rows) ? result.rows : [];
      const row = rows[0] as Row | undefined;
      if (!row || row['reference_type'] !== QC_FINAL_INSPECTION_REFERENCE_TYPE) {
        return Ok(undefined);
      }

      const level = row['inspector_razryad_level'] == null ? null : Number(row['inspector_razryad_level']);
      if (level == null || !Number.isFinite(level) || level < QC_FINAL_SIGNOFF_MIN_RAZRYAD_LEVEL) {
        return Err(AppErr(
          'BUSINESS_RULE_VIOLATION',
          `Final QC yakuniy imzo uchun kamida ${QC_FINAL_SIGNOFF_MIN_RAZRYAD_LEVEL}-razryad talab qilinadi ` +
          `(inspektor razryadi: ${level ?? 'yoʻq / karta bogʻlanmagan'})`,
        ));
      }
      return Ok(undefined);
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Final QC razryad tekshiruvi muvaffaqiyatsiz';
      this.logger.error(msg);
      return Err(AppErr('INTERNAL', msg));
    }
  }

  async execute(command: SubmitInspectionCommand): Promise<Result<string>> {
    // Resolve the 3-way decision: explicit `decision` wins; otherwise derive
    // from the legacy `passed` boolean so existing callers keep their behaviour.
    const decision: QcDecision =
      command.decision ?? (command.passed ? 'pass' : 'fail');

    // Inspection read + state transition + save atomically — partial failures roll back.
    const outcome = await this.qcRepository.withTransaction(async (tx) => {
      const inspection = await this.qcRepository.findById(command.inspectionId, tx);
      if (!inspection) {
        return Err(AppErr('NOT_FOUND', 'Inspection not found'));
      }

      const gate = await this.checkFinalSignoffRazryadGate(command.inspectionId, tx);
      if (!gate.ok) {
        return Err(gate.error);
      }

      if (decision === 'pass') {
        inspection.pass();
      } else if (decision === 'rework') {
        inspection.rework(command.reason);
      } else {
        inspection.fail(command.reason);
      }

      await this.qcRepository.save(inspection, tx);
      return Ok(inspection.id);
    });

    if (!outcome.ok) {
      return Err(outcome.error);
    }
    const inspectionId = outcome.data;
    if (!inspectionId) {
      return Err(AppErr('INTERNAL', 'Inspection transaction returned no id'));
    }

    // Publish events only after the tx committed.
    if (decision === 'pass') {
      this.eventBus.publish(new QcPassedEvent(inspectionId, command.orderId));
      this.logger.log('QC passed - Trigger 11');
    } else if (decision === 'rework') {
      // Third QC decision (Qayta ishlash): batch returns to production rather
      // than being accepted or scrapped. No supplier-fail event is raised.
      this.eventBus.publish(new QcReworkEvent(inspectionId, command.orderId, command.reason));
      this.logger.log({ inspectionId, orderId: command.orderId }, 'QC rework - batch returned to production');
    } else {
      this.eventBus.publish(new QcFailedEvent(inspectionId, command.orderId, command.reason));

      if (command.supplierId) {
        this.eventBus.publish(
          new SupplierQualityFailEvent(command.supplierId, command.orderId, command.reason),
        );
        this.logger.log(
          { supplierId: command.supplierId, orderId: command.orderId },
          'Supplier quality fail - Trigger 19',
        );
      }
    }

    return Ok(inspectionId);
  }
}
