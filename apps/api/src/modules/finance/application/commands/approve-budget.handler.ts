import { safeNum } from '@common/math';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { ApproveBudgetCommand } from './approve-budget.command';
import { Budget, BudgetLine, BudgetStatus } from '../../domain/aggregates/budget.aggregate';
import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { IFinanceRepo } from '../../domain/repositories/i-finance.repo';

@CommandHandler(ApproveBudgetCommand)
export class ApproveBudgetHandler
  implements ICommandHandler<ApproveBudgetCommand>
{
  private readonly logger = new Logger(ApproveBudgetHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly repo: IFinanceRepo) {}

  async execute(command: ApproveBudgetCommand): Promise<Result<Budget>> {
      this.logger.log(`Approving budget: ${command.budgetId}`);

      const findResult = await this.repo.findBudgetById(command.budgetId);

      if (!findResult.ok) {
        return Err(AppErr('NOT_FOUND', 'Budget not found'));
      }

      const budgetData = findResult.data;

      const budget = new Budget(
        String(budgetData.id),
        String(budgetData.name),
        Number(budgetData.fiscalYear),
        budgetData.quarter != null ? Number(budgetData.quarter) : null,
        budgetData.department != null ? String(budgetData.department) : null,
        String(budgetData.status) as BudgetStatus,
        (budgetData.lines as BudgetLine[]) || [],
        safeNum(budgetData.totalPlanned),
        safeNum(budgetData.totalActual),
        String(budgetData.createdBy),
        budgetData.approvedBy != null ? String(budgetData.approvedBy) : null,
        budgetData.approvedAt != null ? new Date(String(budgetData.approvedAt)) : null,
        budgetData.notes != null ? String(budgetData.notes) : null,
        new Date(String(budgetData.createdAt)),
        new Date(String(budgetData.updatedAt)),
      );

      if (budget.status !== BudgetStatus.PENDING_APPROVAL) {
        return Err(AppErr('VALIDATION', 'Budget is not pending approval'));
      }

      budget.approve(command.userId);

      const updateResult = await this.repo.updateBudgetStatus(
        command.budgetId,
        budget.status,
      );

      if (isErr(updateResult)) {
        return Err(AppErr('INTERNAL', `Failed to update budget: ${updateResult.error.message}`));
      }

      return Ok(budget);
  }
}
