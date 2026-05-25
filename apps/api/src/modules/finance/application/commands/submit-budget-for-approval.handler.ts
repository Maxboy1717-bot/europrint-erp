/**
 * @module submit-budget-for-approval.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { safeNum } from '@common/math';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err , Ok } from '@common/types/result.type';
import { SubmitBudgetForApprovalCommand } from './submit-budget-for-approval.command';
import { Budget, BudgetStatus } from '../../domain/aggregates/budget.aggregate';
import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { IFinanceRepo } from '../../domain/repositories/i-finance.repo';

@CommandHandler(SubmitBudgetForApprovalCommand)
export class SubmitBudgetForApprovalHandler
  implements ICommandHandler<SubmitBudgetForApprovalCommand>
{
  private readonly logger = new Logger(SubmitBudgetForApprovalHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly repo: IFinanceRepo) {}

  async execute(
    command: SubmitBudgetForApprovalCommand,
  ): Promise<Result<Budget>> {
      this.logger.log(`Submitting budget for approval: ${command.budgetId}`);

      const findResult = await this.repo.findBudgetById(command.budgetId);

      if (!findResult.ok) {
        return Err('Budget not found');
      }

      const budgetData = findResult.data;

      const budget = new Budget(
        String(budgetData['id']),
        String(budgetData['name']),
        Number(budgetData['fiscalYear']),
        budgetData['quarter'] !== undefined && budgetData['quarter'] !== null ? Number(budgetData['quarter']) : null,
        budgetData['department'] ? String(budgetData['department']) : null,
        String(budgetData['status']) as import('../../domain/aggregates/budget.aggregate').BudgetStatus,
        (budgetData.lines as import('../../domain/aggregates/budget.aggregate').BudgetLine[]) || [],
        safeNum(budgetData['totalPlanned']),
        safeNum(budgetData['totalActual']),
        String(budgetData['createdBy']),
        budgetData['approvedBy'] ? String(budgetData['approvedBy']) : null,
        budgetData['approvedAt'] instanceof Date ? budgetData['approvedAt'] : budgetData['approvedAt'] != null ? new Date(String(budgetData['approvedAt'])) : null,
        budgetData['notes'] ? String(budgetData['notes']) : null,
        budgetData['createdAt'] as Date,
        budgetData['updatedAt'] as Date,
      );

      if (budget.status !== BudgetStatus.DRAFT) {
        return Err('Only draft budgets can be submitted for approval');
      }

      budget.submitForApproval();

      const updateResult = await this.repo.updateBudgetStatus(
        command.budgetId,
        budget.status,
      );

      if (!updateResult.ok) {
        return Err(`Failed to update budget: ${updateResult.error}`);
      }

      return Ok(budget);
  }
}
