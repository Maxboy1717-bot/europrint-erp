import { Injectable, Logger, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, Ok as ok, Err as err, isErr, Err } from '@common/result';
import { InventoryCount, CountStatus } from '../../domain/aggregates/inventory-count.aggregate';
import { IPosV2Repo, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export class CompleteCountCommand {
  constructor(public readonly countId: string) {}
}

@CommandHandler(CompleteCountCommand)
@Injectable()
export class CompleteCountHandler implements ICommandHandler<CompleteCountCommand> {
  private readonly logger = new Logger(CompleteCountHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(command: CompleteCountCommand): Promise<Result<InventoryCount>> {
    try {
      // Get the current count
      const countResult = await this.repo.findCountById(command.countId);

      if (isErr(countResult)) {
        this.logger.error('Count not found', command.countId);
        return err(countResult.error);
      }

      const count = countResult.data;

      // Check if all lines have been counted
      const uncountedLines = (count?.lines ?? []).filter((l) => l.countedQuantity === 0);

      if (uncountedLines.length > 0) {
        return err({
          message: `${uncountedLines.length} lines have not been counted yet`,
          code: 'UNCOUNTED_LINES',
        });
      }

      // Complete the count
      count.complete();

      // Update status in database
      const result = await this.repo.updateCountStatus(command.countId, CountStatus.COMPLETED);

      if (isErr(result)) {
        this.logger.error('Failed to complete count', result.error);
        return err(result.error);
      }

      this.logger.log(`Inventory count ${count.countNumber} completed`);

      return ok(result.data);
    } catch (error: unknown) {
      this.logger.error('Failed to complete count:', error);
      return err({
        message: 'Failed to complete count',
        code: 'COMPLETE_COUNT_ERROR',
      });
    }
  }
}
