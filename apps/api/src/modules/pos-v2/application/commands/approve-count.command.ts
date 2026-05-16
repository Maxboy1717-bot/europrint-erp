/**
 * @module approve-count.command
 * @description Source module. See exports for details.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, Ok as ok, Err as err, isErr } from '@common/result';
import { InventoryCount, CountStatus } from '../../domain/aggregates/inventory-count.aggregate';
import { IPosV2Repo, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export class ApproveCountCommand {
  constructor(public readonly countId: string,
    public readonly approverId: string,
    public readonly syncStock: boolean = true) {}
}

@CommandHandler(ApproveCountCommand)
@Injectable()
export class ApproveCountHandler implements ICommandHandler<ApproveCountCommand> {
  private readonly logger = new Logger(ApproveCountHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(command: ApproveCountCommand): Promise<Result<InventoryCount>> {
    try {
      // Get the current count
      const countResult = await this.repo.findCountById(command.countId);

      if (isErr(countResult)) {
        this.logger.error('Count not found', command.countId);
        return err(countResult.error);
      }

      const count = countResult.data;

      // Validate status
      if (count.status !== CountStatus.COMPLETED) {
        return err({
          message: 'Only completed counts can be approved',
          code: 'INVALID_STATUS',
        });
      }

      // Approve the count
      count.approve(command.approverId);

      // Update status in database
      const result = await this.repo.updateCountStatus(
        command.countId,
        CountStatus.APPROVED,
        command.approverId,
      );

      if (isErr(result)) {
        this.logger.error('Failed to approve count', result.error);
        return err(result.error);
      }

      const approvedCount = result.data;

      // Sync stock levels if requested (PA1-10: via repo)
      if (command.syncStock) {
        const updates = approvedCount.lines.map((line) => ({
          stockItemId: line.stockItemId,
          quantity: Number(line.countedQuantity),
        }));
        const syncResult = await this.repo.syncStockQuantities(updates);
        if (isErr(syncResult)) {
          this.logger.error('Failed to sync stock levels', syncResult.error);
          return err(syncResult.error);
        }

        this.logger.log(`Stock levels synced for count ${count.countNumber}`);
      }

      this.logger.log(
        `Inventory count ${count.countNumber} approved by user ${command.approverId}`,
      );

      return ok(approvedCount);
    } catch (error: unknown) {
      this.logger.error('Failed to approve count:', error);
      return err({
        message: 'Failed to approve count',
        code: 'APPROVE_COUNT_ERROR',
      });
    }
  }
}
