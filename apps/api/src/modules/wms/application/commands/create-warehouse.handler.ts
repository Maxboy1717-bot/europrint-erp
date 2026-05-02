import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { db, warehouses } from '@shared/db';
import { Result } from '@common/result';
import { CreateWarehouseCommand } from './create-warehouse.command';

@Injectable()
@CommandHandler(CreateWarehouseCommand)
export class CreateWarehouseHandler implements ICommandHandler<CreateWarehouseCommand> {
  private readonly logger = new Logger(CreateWarehouseHandler.name);

  async execute(command: CreateWarehouseCommand): Promise<Result<Record<string, unknown>>> {
      const warehouse = {
        id: createId(),
        name: command.name,
        address: command.address,
        is_free_storage: command.isFreeStorage || false,
        free_storage_days: command.freeStorageDays || 30,
        monthly_rate: command.monthlyRate
          ? command.monthlyRate.toString()
          : null,
        created_at: _time.now(),
      };

      const result = await db.insert(warehouses).values(warehouse);

      this.logger.log(`Warehouse created: ${warehouse.id}`);
      return { ok: true, data: warehouse };
  }
}
