import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IMesRepository } from '../../domain/repositories/mes.repository';

export class CompleteSessionCommand {
  constructor(public sessionId: number) {}
}

@CommandHandler(CompleteSessionCommand)
export class CompleteSessionHandler implements ICommandHandler<CompleteSessionCommand> {
  private readonly logger = new Logger(CompleteSessionHandler.name);
  constructor(
    @Inject('IMesRepository') private mesRepo: IMesRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: CompleteSessionCommand): Promise<Result<void>> {
    this.logger.log('Completing MES session');

    const sessionResult = await this.mesRepo.getSession(command.sessionId);
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

    const saveResult = await this.mesRepo.saveSession(session);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    // Trigger 10: MES completed → QC ga signal
    this.eventBus.publish('MES_COMPLETED', {
      sessionId: command.sessionId,
      timestamp: _time.now(),
    });

    // Trigger 16: MES → HR 360° bazaga
    this.eventBus.publish('MES_TO_HR_360', {
      sessionId: command.sessionId,
      operatorId: session.getOperatorId(),
      timestamp: _time.now(),
    });

    this.logger.log('MES session completed and sent to QC');
    return Ok(undefined);
  }
}
