/**
 * @module advance-approved.listener
 * @description PA2-18 Wave 6: canonical CQRS @EventsHandler form. Reacts to
 *   `AdvanceApprovedEvent` (published by finance/tech-three-checkpoint.listener.ts)
 *   and unlocks PP planning for the order. Trigger 7.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';
import { AdvanceApprovedEvent } from '@modules/finance/domain/events/advance-approved.event';

@Injectable()
@EventsHandler(AdvanceApprovedEvent)
export class AdvanceApprovedListener implements IEventHandler<AdvanceApprovedEvent> {
  private readonly logger = new Logger(AdvanceApprovedListener.name);

  constructor(@Inject(PP_REPO) private readonly ppRepo: IPpRepository) {}

  async handle(event: AdvanceApprovedEvent): Promise<void> {
    this.logger.log(
      { orderId: event.orderId, advancePct: event.advancePct },
      'Trigger 7: Advance approved - Unlocking PP planning',
    );

    const result = await this.ppRepo.unlockPlanning(event.orderId);
    if (!result.ok) {
      this.logger.error(result.error, 'Failed to unlock planning');
    }
  }
}
