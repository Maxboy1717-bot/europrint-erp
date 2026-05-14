/**
 * @module start-inventory-count.command
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { createId } from '@paralleldrive/cuid2';
import { eq , sql } from 'drizzle-orm';
import { Result, Ok as ok, Err as err, isErr, Err } from '@common/result';
import { db } from '@shared/db';
import { stock_items } from '@shared/db';
import {
  InventoryCount,
  CountStatus,
  CountLine,
} from '../../domain/aggregates/inventory-count.aggregate';
import { IPosV2Repo, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export class StartInventoryCountCommand {
  constructor(public readonly warehouseId: string,
    public readonly userId: string,
    public readonly notes?: string) {}
}

@CommandHandler(StartInventoryCountCommand)
@Injectable()
export class StartInventoryCountHandler implements ICommandHandler<StartInventoryCountCommand> {
  private readonly logger = new Logger(StartInventoryCountHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(command: StartInventoryCountCommand): Promise<Result<InventoryCount>> {
    try {
      // Generate count number
      const now = _time.now();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const countNumber = `CNT-${dateStr}-001`;

      // Load current stock items in warehouse
      const items = await db.select().from(stock_items).where(sql`warehouse_id = ${command.warehouseId}`);

      if (items.length === 0) {
        return err({
          message: 'No stock items found in this warehouse',
          code: 'NO_ITEMS',
        });
      }

      // Create count lines
      const lines: CountLine[] = (items as Record<string, unknown>[]).map((item: Record<string, unknown>) => ({
        id: createId(),
        countId: '', // Will be set when count is created
        stockItemId: item.id,
        sku: item.sku,
        itemName: item.name,
        systemQuantity: safeNum(item.currentQuantity),
        countedQuantity: 0,
        variance: 0,
        unit: item.unit,
        location: item.warehouseLocation,
        notes: null as string | null,
      })) as CountLine[];

      // Create inventory count
      const count = new InventoryCount(
        createId(),
        command.warehouseId,
        countNumber,
        CountStatus.IN_PROGRESS,
        (Array.isArray(lines) ? lines : []).map((l) => ({ ...l, countId: createId() })),
        command.userId,
        null,
        null,
        command.notes || null,
        _time.now(),
        _time.now(),
      );

      // Save to database
      const result = await this.repo.saveCount(count, count.lines);

      if (isErr(result)) {
        this.logger.error('Failed to save inventory count', result.error);
        return err(result.error);
      }

      this.logger.log(`Inventory count ${count.countNumber} started by user ${command.userId}`);

      return ok(count);
    } catch (error: unknown) {
      this.logger.error('Failed to start inventory count:', error);
      return err({
        message: 'Failed to start inventory count',
        code: 'START_COUNT_ERROR',
      });
    }
  }
}
