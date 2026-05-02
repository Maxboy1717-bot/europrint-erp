import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { FinanceRepository } from '../../infrastructure/repositories/drizzle-finance.repo';
import { AppErr, Err, Ok, Result } from '@common/result';

export class CheckAdvanceCommand {
  private readonly logger = new Logger(CheckAdvanceCommand.name);

  constructor(public readonly employeeId: number,
    public readonly requestAmount: number,
    public readonly checkedBy: number,
    public readonly overrideBy?: number,
    public readonly overrideReason?: string) {}
}

@CommandHandler(CheckAdvanceCommand)
export class CheckAdvanceHandler implements ICommandHandler<CheckAdvanceCommand> {
  private logger = new Logger('CheckAdvanceHandler');

  constructor(@Inject(FINANCE_REPO) private readonly financeRepo: FinanceRepository) {}

  async execute(command: CheckAdvanceCommand): Promise<Result<{ approved: boolean; status: string }>> {
      this.logger.debug(
        `Checking advance for employee ${command.employeeId}, Amount: ${command.requestAmount}`
      );

      const advancePercent = await this.financeRepo.getSettingValue('advance_percent');
      const threshold = advancePercent / 100;

      const employeeData = await this.financeRepo.findEmployeeBalance(command.employeeId);

      if (!employeeData) {
        return Err(AppErr('NOT_FOUND', 'Employee not found or has no balance data'));
      }

      const advanceLimit = employeeData.baseSalary * threshold;

      if (command.requestAmount <= advanceLimit) {
        this.logger.log(
          `Advance approved - Employee: ${command.employeeId}, Amount: ${command.requestAmount}`
        );

        await this.financeRepo.recordAdvance({
          employeeId: command.employeeId,
          amount: command.requestAmount,
          status: 'approved',
          approvedBy: command.checkedBy,
          approvedAt: _time.now(),
        });

        return Ok({ approved: true, status: 'approved' });
      }

      if (command.overrideBy) {
        this.logger.warn(
          `Advance override - Employee: ${command.employeeId}, Reason: ${command.overrideReason}`
        );

        await this.financeRepo.recordAdvance({
          employeeId: command.employeeId,
          amount: command.requestAmount,
          status: 'approved_override',
          approvedBy: command.overrideBy,
          remarks: command.overrideReason,
          approvedAt: _time.now(),
        });

        return Ok({ approved: true, status: 'approved_override' });
      }

      this.logger.log(
        `Advance pending - Employee: ${command.employeeId}, Amount exceeds limit ${advanceLimit}`
      );

      await this.financeRepo.recordAdvance({
        employeeId: command.employeeId,
        amount: command.requestAmount,
        status: 'pending_advance',
        approvedBy: command.checkedBy,
        approvedAt: _time.now(),
      });

      return Ok({ approved: false, status: 'pending_advance' });
  }
}
