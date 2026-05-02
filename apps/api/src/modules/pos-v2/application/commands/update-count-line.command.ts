import { Injectable, Logger, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, Ok as ok, Err as err, isErr, Err } from '@common/result';
import { CountLine } from '../../domain/aggregates/inventory-count.aggregate';
import { IPosV2Repo, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export class UpdateCountLineCommand {
  constructor(public readonly countId: string,
    public readonly lineId: string,
    public readonly countedQuantity: number,
    public readonly notes?: string) {}
}

@CommandHandler(UpdateCountLineCommand)
@Injectable()
export class UpdateCountLineHandler implements ICommandHandler<UpdateCountLineCommand> {
  private readonly logger = new Logger(UpdateCountLineHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(command: UpdateCountLineCommand): Promise<Result<CountLine>> {
    try {
      if (command.countedQuantity < 0) {
        return err({
          message: 'Counted quantity cannot be negative',
          code: 'INVALID_QUANTITY',
        });
      }

      const result = await this.repo.updateCountLine(
        command.countId,
        command.lineId,
        command.countedQuantity,
        command.notes,
      );

      if (isErr(result)) {
        this.logger.error('Failed to update count line', result.error);
        return err(result.error);
      }

      this.logger.log(`Count line ${command.lineId} updated with quantity ${command.countedQuantity}`);

      return ok(result.data);
    } catch (error: unknown) {
      this.logger.error('Failed to update count line:', error);
      return err({
        message: 'Failed to update count line',
        code: 'UPDATE_LINE_ERROR',
      });
    }
  }
}
