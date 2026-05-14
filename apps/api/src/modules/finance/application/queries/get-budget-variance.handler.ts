/**
 * @module get-budget-variance.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { safeNum } from '@common/math';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { Calculation } from '@common/decorators/calculation.decorator';
import { GetBudgetVarianceQuery } from './get-budget-variance.query';
import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { IFinanceRepo } from '../../domain/repositories/i-finance.repo';

@QueryHandler(GetBudgetVarianceQuery)
export class GetBudgetVarianceHandler
  implements IQueryHandler<GetBudgetVarianceQuery>
{
  private readonly logger = new Logger(GetBudgetVarianceHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly repo: IFinanceRepo) {}

  @Calculation('finance.budget.variance')
  async execute(
    query: GetBudgetVarianceQuery,
  ): Promise<
    Result<{
      id: string;
      name: string;
      totalPlanned: number;
      totalActual: number;
      variance: number;
      variancePercent: number;
      isOverBudget: boolean;
      lines: unknown[];
      topOverspentCategories: Array<{
        category: string;
        planned: number;
        actual: number;
        variance: number;
      }>;
    }>
  > {
      this.logger.debug(`Fetching budget variance: ${query.budgetId}`);

      const result = await this.repo.findBudgetById(query.budgetId);

      if (!result.ok) {
        return Err('Budget not found');
      }

      const budget = result.data as { id: string; name: string; totalPlanned: string; totalActual: string; lines?: Array<Record<string, unknown>> };
      const totalPlanned = safeNum(budget.totalPlanned ?? 0);
      const totalActual = safeNum(budget.totalActual ?? 0);
      const variance = totalPlanned - totalActual;
      const variancePercent =
        totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;

      const lines = (budget.lines || []).map((line: Record<string, unknown>) => {
        const plannedAmount = safeNum(line.plannedAmount ?? 0);
        const actualAmount = safeNum(line.actualAmount ?? 0);
        const lineVariance = plannedAmount - actualAmount;
        const lineVariancePercent =
          plannedAmount > 0 ? (lineVariance / plannedAmount) * 100 : 0;

        return {
          id: line.id,
          category: line.category,
          description: line.description,
          plannedAmount,
          actualAmount,
          variance: lineVariance,
          variancePercent: lineVariancePercent,
        };
      });

      const topOverspentCategories = lines
        .filter((line: Record<string, unknown>) => Number(line.actualAmount) > Number(line.plannedAmount))
        .sort(
          (a: Record<string, unknown>, b: Record<string, unknown>) =>
            Number(b.actualAmount) - Number(b.plannedAmount) - (Number(a.actualAmount) - Number(a.plannedAmount)),
        )
        .slice(0, 5)
        .map((line: Record<string, unknown>) => ({
          category: String(line.category),
          planned: Number(line.plannedAmount),
          actual: Number(line.actualAmount),
          variance: Number(line.variance),
        }));

      return {
        ok: true,
        data: {
          id: budget.id,
          name: budget.name,
          totalPlanned,
          totalActual,
          variance,
          variancePercent,
          isOverBudget: totalActual > totalPlanned,
          lines,
          topOverspentCategories,
        },
      };
  }
}
