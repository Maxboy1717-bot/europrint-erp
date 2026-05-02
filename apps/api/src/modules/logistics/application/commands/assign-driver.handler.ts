import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { AssignDriverCommand } from './assign-driver.command';
import { Delivery } from '../../domain/aggregates/delivery.aggregate';
import { IDeliveryRepo, DELIVERY_REPO } from '../../domain/repositories/i-delivery.repo';

@Injectable()
@CommandHandler(AssignDriverCommand)
export class AssignDriverHandler implements ICommandHandler<AssignDriverCommand> {
  private readonly logger = new Logger(AssignDriverHandler.name);

  constructor(
    @Inject(DELIVERY_REPO) private readonly deliveryRepo: IDeliveryRepo,
      ) {}

  async execute(command: AssignDriverCommand): Promise<Result<Delivery>> {
    const findResult = await this.deliveryRepo.findById(command.deliveryId);

    if (!findResult.ok) {
      this.logger.error('Failed to find delivery');
      return findResult as Result<Delivery>;
    }

    if (!findResult.data) {
      return Err(AppErr('NOT_FOUND', 'Delivery not found'));
    }

    const delivery = findResult.data;

    // Validate delivery is in correct state
    if (delivery.status !== 'pending' && delivery.status !== 'assigned') {
      return Err(`Cannot assign driver to delivery in ${delivery.status} state`);
    }

    delivery.assign(command.driverId, command.vehicleNumber);

    const updateResult = await this.deliveryRepo.update(delivery.id, {
      driverId: delivery.driverId,
      vehicleNumber: delivery.vehicleNumber,
      status: delivery.status,
    });

    if (!updateResult.ok) {
      this.logger.error(
        { id: delivery.id, driverId: command.driverId },
        'Failed to assign driver',
      );
      return updateResult;
    }

    this.logger.log(
      { deliveryId: delivery.id, driverId: command.driverId, vehicleNumber: command.vehicleNumber },
      'Driver assigned to delivery',
    );

    return updateResult;
  }
}
