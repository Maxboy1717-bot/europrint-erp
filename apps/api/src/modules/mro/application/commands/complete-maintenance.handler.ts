import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result } from '@common/types/result.type';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { MaintenanceOrder } from '../../domain/aggregates/maintenance-order.aggregate';
import { IMaintenanceRepo, MAINTENANCE_REPO } from '../../domain/repositories/i-maintenance.repo';

export class CompleteMaintenanceCommand {

  constructor(readonly maintenanceOrderId: string) {}
}

@Injectable()
@CommandHandler(CompleteMaintenanceCommand)
export class CompleteMaintenanceHandler implements ICommandHandler<CompleteMaintenanceCommand> {
  private readonly logger = new Logger(CompleteMaintenanceHandler.name);
  constructor(
    @Inject(MAINTENANCE_REPO) private readonly maintenanceRepo: IMaintenanceRepo,
    private readonly eventEmitter: EventEmitter2,
      ) {}

  async execute(command: CompleteMaintenanceCommand): Promise<Result<MaintenanceOrder>> {
    const findResult = await this.maintenanceRepo.findById(command.maintenanceOrderId);

    if (!findResult.ok) {
      this.logger.error('Failed to find maintenance order');
      return findResult as Result<MaintenanceOrder>;
    }

    if (!findResult.data) {
      return Err(AppErr('NOT_FOUND', 'Maintenance order not found'));
    }

    const order = findResult.data;
    order.complete();

    const updateResult = await this.maintenanceRepo.update(order.id, {
      status: order.status,
      completedAt: order.completedAt,
    });

    if (!updateResult.ok) {
      this.logger.error('Failed to complete maintenance');
      return updateResult;
    }

    // If production order was affected, emit event for PP to reschedule
    if (order.productionOrderAffected) {
      this.eventEmitter.emit(ERP_EVENTS.MRO_MAINTENANCE_COMPLETED, {
        maintenanceOrderId: order.id,
        productionOrderId: order.productionOrderAffected,
        completedAt: order.completedAt,
        timestamp: _time.now(),
      });

      this.logger.log(
        { maintenanceOrderId: order.id, productionOrderId: order.productionOrderAffected },
        'MRO_MAINTENANCE_COMPLETED event emitted - PP can now reschedule',
      );
    }

    this.logger.log(
      { maintenanceOrderId: order.id, completedAt: order.completedAt },
      'Maintenance order completed',
    );

    return updateResult;
  }
}
