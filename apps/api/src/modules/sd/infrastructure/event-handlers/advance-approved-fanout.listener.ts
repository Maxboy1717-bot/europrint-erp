/**
 * @module advance-approved-fanout.listener
 * @description Phase 4 fan-out orchestrator. When the 70% advance is approved
 *   (AdvanceApprovedEvent, published by confirm-advance-payment.handler), this creates a
 *   department job for each department the manager selected on the order (sd_order_departments)
 *   and marks that department 'started'. Canonical CQRS @EventsHandler form (same as
 *   DealWonListener). Idempotent — re-firing does not duplicate jobs.
 *
 *   Phase 4 is incremental: mold is wired now (the proof); other departments log and are
 *   added one at a time in later steps.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AdvanceApprovedEvent } from '@modules/finance/domain/events/advance-approved.event';
import { SdOrderDepartmentsRepository } from '../../orders/drizzle-sd-order-departments.repo';

@Injectable()
@EventsHandler(AdvanceApprovedEvent)
export class AdvanceApprovedFanoutListener implements IEventHandler<AdvanceApprovedEvent> {
  private readonly logger = new Logger(AdvanceApprovedFanoutListener.name);

  constructor(private readonly deptRepo: SdOrderDepartmentsRepository) {}

  async handle(event: AdvanceApprovedEvent): Promise<void> {
    const orderId = Number(event?.orderId);
    if (!orderId) return;

    const deptsResult = await this.deptRepo.listForOrder(orderId);
    if (!deptsResult.ok) {
      this.logger.warn({ msg: 'Fan-out: could not read selected departments', orderId, error: deptsResult.error?.message });
      return;
    }
    if (deptsResult.data.length === 0) {
      this.logger.log({ msg: 'Fan-out: advance approved but no departments selected — nothing to dispatch', orderId });
      return;
    }

    for (const row of deptsResult.data) {
      const dept = String((row as Record<string, unknown>).department);
      if (dept === 'mold') {
        const created = await this.deptRepo.createMoldJob(orderId);
        if (created.ok) {
          await this.deptRepo.markStatus(orderId, 'mold', 'started');
          this.logger.log({ msg: 'Fan-out: mold job dispatched', orderId, newlyCreated: created.data.created });
        } else {
          this.logger.warn({ msg: 'Fan-out: mold job dispatch failed', orderId, error: created.error?.message });
        }
      } else if (dept === 'design') {
        const created = await this.deptRepo.createDesignJob(orderId);
        if (created.ok) {
          await this.deptRepo.markStatus(orderId, 'design', 'started');
          this.logger.log({ msg: 'Fan-out: design job dispatched', orderId, newlyCreated: created.data.created });
        } else {
          this.logger.warn({ msg: 'Fan-out: design job dispatch failed', orderId, error: created.error?.message });
        }
      } else if (dept === 'cliche') {
        const created = await this.deptRepo.createClicheJob(orderId);
        if (created.ok) {
          await this.deptRepo.markStatus(orderId, 'cliche', 'started');
          this.logger.log({ msg: 'Fan-out: cliché job dispatched', orderId, newlyCreated: created.data.created });
        } else {
          this.logger.warn({ msg: 'Fan-out: cliché job dispatch failed', orderId, error: created.error?.message });
        }
      } else if (dept === 'logistics') {
        const created = await this.deptRepo.createShippingRequestJob(orderId);
        if (created.ok) {
          await this.deptRepo.markStatus(orderId, 'logistics', 'started');
          this.logger.log({ msg: 'Fan-out: logistics shipping request dispatched', orderId, newlyCreated: created.data.created });
        } else {
          this.logger.warn({ msg: 'Fan-out: logistics dispatch failed', orderId, error: created.error?.message });
        }
      } else {
        // Remaining departments (warehouse/production) wired in later Phase 4 steps —
        // same spine, one at a time.
        this.logger.log({ msg: 'Fan-out: department not yet wired (Phase 4 incremental)', orderId, dept });
      }
    }
  }
}
