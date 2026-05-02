import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { FinanceRepository } from '../../infrastructure/repositories/drizzle-finance.repo';
import { AppErr, Err, Ok, Result } from '@common/result';

export class StartRentalTimerCommand {
  private readonly logger = new Logger(StartRentalTimerCommand.name);

  constructor(public readonly orderId: number,
    public readonly warehouseId: number,
    public readonly areaM2: number,
    public readonly receivedDate: Date,
    public readonly startedBy?: number) {}
}

@CommandHandler(StartRentalTimerCommand)
export class StartRentalTimerHandler implements ICommandHandler<StartRentalTimerCommand> {
  private logger = new Logger('StartRentalTimerHandler');

  constructor(@Inject(FINANCE_REPO) private readonly financeRepo: FinanceRepository) {}

  async execute(command: StartRentalTimerCommand): Promise<Result<number>> {
      this.logger.debug(
        `Starting warehouse rental timer - Order: ${command.orderId}, Area: ${command.areaM2}m2`
      );

      const rentalRatePerM2 = await this.financeRepo.getWarehouseRentalRate(command.warehouseId);

      if (!rentalRatePerM2) {
        return Err(AppErr('NOT_FOUND', 'Warehouse rental rate not found'));
      }

      const dailyRate = rentalRatePerM2 * command.areaM2;

      const rentalId = await this.financeRepo.recordWarehouseRental({
        orderId: command.orderId,
        warehouseId: command.warehouseId,
        areaM2: command.areaM2,
        dailyRate,
        startDate: command.receivedDate,
        status: 'active',
        startedBy: command.startedBy || 0,
      });

      this.logger.log(
        `Warehouse rental timer started - Rental ID: ${rentalId}, Daily Rate: ${dailyRate}`
      );

      return Ok(rentalId);
  }
}
