import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { FinanceRepository } from '../../infrastructure/repositories/drizzle-finance.repo';
import { Result, Ok } from '@common/result';

export class CashFlowQuery {
  private readonly logger = new Logger(CashFlowQuery.name);

  constructor(public readonly startDate: Date,
    public readonly endDate: Date) {}
}

export interface CashFlowResult {
  period: string;
  openingBalance: number;
  receipts: { sales: number; other: number };
  disbursements: { expenses: number; payroll: number; other: number };
  closingBalance: number;
  netFlow: number;
}

@QueryHandler(CashFlowQuery)
export class CashFlowHandler implements IQueryHandler<CashFlowQuery> {
  private logger = new Logger('CashFlowHandler');

  constructor(@Inject(FINANCE_REPO) private readonly financeRepo: FinanceRepository) {}

  async execute(query: CashFlowQuery): Promise<Result<CashFlowResult>> {
      this.logger.debug(
        `Calculating cash flow from ${query.startDate} to ${query.endDate}`
      );

      const openingBalance = await this.financeRepo.getCashBalance(query.startDate);
      const salesReceipts = await this.financeRepo.getSalesReceipts(query.startDate, query.endDate);
      const otherReceipts = await this.financeRepo.getOtherReceipts(query.startDate, query.endDate);
      const expenses = await this.financeRepo.getExpenses(query.startDate, query.endDate);
      const payroll = await this.financeRepo.getPayrollDisbursements(query.startDate, query.endDate);
      const otherDisbursements = await this.financeRepo.getOtherDisbursements(
        query.startDate,
        query.endDate
      );

      const totalReceipts = salesReceipts + otherReceipts;
      const totalDisbursements = expenses + payroll + otherDisbursements;
      const netFlow = totalReceipts - totalDisbursements;
      const closingBalance = openingBalance + netFlow;

      this.logger.log(
        `Cash flow calculated - Net Flow: ${netFlow}, Closing Balance: ${closingBalance}`
      );

      return Ok({
        period: `${query.startDate.toISOString().split('T')[0]} to ${query.endDate.toISOString().split('T')[0]}`,
        openingBalance,
        receipts: { sales: salesReceipts, other: otherReceipts },
        disbursements: { expenses, payroll, other: otherDisbursements },
        closingBalance,
        netFlow,
      });
  }
}
