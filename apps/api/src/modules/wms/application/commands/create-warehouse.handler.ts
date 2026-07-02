/**
 * @module create-warehouse.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IWmsRepository, WMS_REPO, CreateWarehouseInput } from '../../domain/repositories/wms.repository';
import { CreateWarehouseCommand } from './create-warehouse.command';

@Injectable()
@CommandHandler(CreateWarehouseCommand)
export class CreateWarehouseHandler implements ICommandHandler<CreateWarehouseCommand> {
  private readonly logger = new Logger(CreateWarehouseHandler.name);

  constructor(@Inject(WMS_REPO) private readonly repo: IWmsRepository) {}

  async execute(command: CreateWarehouseCommand): Promise<Result<CreateWarehouseInput & { id: number }>> {
      const warehouse: CreateWarehouseInput = {
        name: command.name,
        address: command.address,
        is_free_storage: command.isFreeStorage || false,
        free_storage_days: command.freeStorageDays || 30,
        monthly_rate: command.monthlyRate
          ? command.monthlyRate.toString()
          : null,
        created_at: _time.now(),
      };

      // `id` is DB-generated (integer serial) — the repo returns it via RETURNING.
      const result = await this.repo.createWarehouse(warehouse);
      if (!result.ok) return { ok: false, error: result.error };

      this.logger.log(`Warehouse created: ${result.data.id}`);
      return { ok: true, data: result.data };
  }
}
