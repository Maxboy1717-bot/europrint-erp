/**
 * @module create-budget.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { CreateBudgetCommand } from './create-budget.command';
import { Budget, BudgetStatus } from '../../domain/aggregates/budget.aggregate';
import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { IFinanceRepo } from '../../domain/repositories/i-finance.repo';
import { createId } from '@paralleldrive/cuid2';

@CommandHandler(CreateBudgetCommand)
export class CreateBudgetHandler
  implements ICommandHandler<CreateBudgetCommand>
{
  private readonly logger = new Logger(CreateBudgetHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly repo: IFinanceRepo) {}

  async execute(command: CreateBudgetCommand): Promise<Result<Budget>> {
      this.logger.log(`Creating budget: ${command.name}`);

      const totalPlanned = (Array.isArray(command.lines) ? command.lines : []).reduce(
        (sum, line) => sum + line.plannedAmount,
        0,
      );

      const budgetId = createId();

      const budget = new Budget(
        budgetId,
        command.name,
        command.fiscalYear,
        command.quarter,
        command.department,
        BudgetStatus.DRAFT,
        [],
        totalPlanned,
        0,
        command.userId,
        null,
        null,
        command.notes,
        _time.now(),
        _time.now(),
      );

      const lines = (Array.isArray(command?.lines) ? command?.lines : []).map((line) => ({
        id: createId(),
        budgetId: budgetId,
        category: line.category,
        description: line.description,
        plannedAmount: line.plannedAmount.toString(),
        actualAmount: '0',
      }));

      const saveResult = await this.repo.saveBudget(
        {
          id: budget.id,
          name: budget.name,
          fiscalYear: budget.fiscalYear,
          quarter: budget.quarter,
          department: budget.department,
          status: budget.status,
          totalPlanned: budget.totalPlanned.toString(),
          totalActual: '0',
          createdBy: budget.createdBy,
          approvedBy: budget.approvedBy,
          approvedAt: budget.approvedAt,
          notes: budget.notes,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
        },
        lines,
      );

      if (isErr(saveResult)) {
        return Err(AppErr('INTERNAL', `Failed to save budget: ${saveResult.error.message}`));
      }

      return Ok(budget);
  }
}
