import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Result } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { HR_REPO, IHrRepo } from '../../domain/repositories/i-hr.repo';

export class Record360FeedbackCommand {
  constructor(public readonly employeeId: number,
    public readonly orderId: number,
    public readonly sessionId: string,
    public readonly quantity: number,
    public readonly defectRate: number,
    public readonly oee: number) {}
}

@CommandHandler(Record360FeedbackCommand)
export class Record360FeedbackHandler implements ICommandHandler<Record360FeedbackCommand> {
  private readonly logger = new Logger(Record360FeedbackHandler.name);

  constructor(@Inject(HR_REPO) private readonly hrRepo: IHrRepo) {}

  async execute(command: Record360FeedbackCommand): Promise<Result<Record<string, unknown>>> {
      this.logger.debug(`Recording 360° feedback - Employee: ${command.employeeId}, OEE: ${command.oee}%`);

      const result = await (this.hrRepo).save360Feedback({
        employeeId: command.employeeId,
        orderId: command.orderId,
        sessionId: command.sessionId,
        quantity: command.quantity,
        defectRate: command.defectRate,
        oee: command.oee,
        recordedAt: _time.now(),
      });

      this.logger.log(`360° feedback recorded - Employee: ${command.employeeId}`);
      return result ?? { ok: true, data: null };
  }
}
