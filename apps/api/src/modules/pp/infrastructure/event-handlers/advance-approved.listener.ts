/**
 * @module advance-approved.listener
 * @description Trigger 7 — FI advance approved → unlock PP planning.
 *
 * TODO PA2-18: Promote to canonical `@EventsHandler(AdvanceApprovedEvent)`
 * once the emit-site (currently `eventEmitter.emit(ERP_EVENTS.ADVANCE_APPROVED,
 * {...})` in finance/tech-three-checkpoint.listener.ts) is refactored to
 * publish a typed event class via the CQRS bus. EventBridgeService cannot
 * translate string→class for legacy emit-sites.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

export interface AdvanceApprovedEvent {
  orderId: number;
  advanceId: number;
}

@Injectable()
export class AdvanceApprovedListener {
  private readonly logger = new Logger(AdvanceApprovedListener.name);

  constructor(@Inject(PP_REPO) private readonly ppRepo: IPpRepository) {}

  @OnEvent(ERP_EVENTS.ADVANCE_APPROVED)
  async handle(event: AdvanceApprovedEvent) {
    this.logger.log(
      { orderId: event.orderId, advanceId: event.advanceId },
      'Trigger 7: Advance approved - Unlocking PP planning',
    );

    const result = await this.ppRepo.unlockPlanning(event.orderId);
    if (!result.ok) {
      this.logger.error(result.error, 'Failed to unlock planning');
    }
  }
}
