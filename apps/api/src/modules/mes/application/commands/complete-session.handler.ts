/**
 * @module complete-session.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, AppErr } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IMesRepository, MES_REPO } from '../../domain/repositories/mes.repository';
import { MesCompletedEvent } from '../../domain/events/mes-completed.event';
import { MesToHr360Event } from '../../domain/events/mes-to-hr-360.event';

export class CompleteSessionCommand {
  constructor(public sessionId: number) {}
}

@CommandHandler(CompleteSessionCommand)
export class CompleteSessionHandler implements ICommandHandler<CompleteSessionCommand> {
  private readonly logger = new Logger(CompleteSessionHandler.name);
  constructor(
    @Inject(MES_REPO) private mesRepo: IMesRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: CompleteSessionCommand): Promise<Result<void>> {
    this.logger.log('Completing MES session');

    // Session read + status update atomically — partial failures roll back.
    const outcome = await this.mesRepo.withTransaction(async (tx) => {
      const sessionResult = await this.mesRepo.getSession(command.sessionId, tx);
      if (!sessionResult.ok) {
        return Err(sessionResult.error);
      }

      const session = sessionResult.data;

      // Complete session
      const completeResult = session.complete();
      if (!completeResult.ok) {
        return Err(completeResult.error);
      }

      // Move to QC
      const moveResult = session.moveToQc();
      if (!moveResult.ok) {
        return Err(moveResult.error);
      }

      const saveResult = await this.mesRepo.saveSession(session, tx);
      if (!saveResult.ok) {
        return Err(saveResult.error);
      }

      return Ok(session);
    });

    if (!outcome.ok) {
      return Err(outcome.error);
    }

    const session = outcome.data;
    if (!session) {
      return Err(AppErr('INTERNAL', 'Session transaction returned no data'));
    }

    // Trigger 10: MES completed → QC (only after commit)
    // PA2-18 Wave 6: canonical class form; EventBridge re-emits to legacy @OnEvent listeners.
    this.eventBus.publish(new MesCompletedEvent(command.sessionId, _time.now()));

    // Trigger 16: MES → HR 360° (only after commit)
    this.eventBus.publish(
      new MesToHr360Event(command.sessionId, session.getOperatorId(), _time.now()),
    );

    this.logger.log('MES session completed and sent to QC');
    return Ok(undefined);
  }
}
