/**
 * @module advance-approved.listener
 * @description Source module. See exports for details.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IPpRepository } from '../../domain/repositories/pp.repository';

export interface AdvanceApprovedEvent {
  orderId: number;
  advanceId: number;
}

@Injectable()
export class AdvanceApprovedListener {
  private readonly logger = new Logger(AdvanceApprovedListener.name);

  constructor(@Inject('IPpRepository') private readonly ppRepo: IPpRepository) {}

  @OnEvent('ADVANCE_APPROVED')
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
