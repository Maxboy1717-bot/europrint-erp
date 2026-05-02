import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { AssignMaintenanceCommand } from './assign-maintenance.command';
import { MaintenanceOrder } from '../../domain/aggregates/maintenance-order.aggregate';
import { IMaintenanceRepo, MAINTENANCE_REPO } from '../../domain/repositories/i-maintenance.repo';

@Injectable()
@CommandHandler(AssignMaintenanceCommand)
export class AssignMaintenanceHandler implements ICommandHandler<AssignMaintenanceCommand> {
  private readonly logger = new Logger(AssignMaintenanceHandler.name);

  constructor(
    @Inject(MAINTENANCE_REPO) private readonly maintenanceRepo: IMaintenanceRepo,
      ) {}

  async execute(command: AssignMaintenanceCommand): Promise<Result<MaintenanceOrder>> {
    const findResult = await this.maintenanceRepo.findById(command.maintenanceOrderId);

    if (!findResult.ok) {
      this.logger.error('Failed to find maintenance order');
      return findResult as Result<MaintenanceOrder>;
    }

    if (!findResult.data) {
      return Err(AppErr('NOT_FOUND', 'Maintenance order not found'));
    }

    const order = findResult.data;
    order.assign(command.assignedToUserId);

    const updateResult = await this.maintenanceRepo.update(order.id, {
      assignedTo: command.assignedToUserId,
      status: order.status,
    });

    if (!updateResult.ok) {
      this.logger.error('Failed to assign maintenance');
      return updateResult;
    }

    this.logger.log(
      { maintenanceOrderId: order.id, assignedTo: command.assignedToUserId },
      'Maintenance order assigned',
    );

    return updateResult;
  }
}
