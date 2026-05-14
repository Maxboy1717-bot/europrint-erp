/**
 * @module financial-reports-monthly.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FinancialReportsQueryService } from '../services/financial-reports-query.service';
import { FinancialReportsTelegramService } from '../services/financial-reports-telegram.service';
import { FinancialReportsAnalyticsService } from '../services/financial-reports-analytics.service';

@Injectable()
export class FinancialReportsMonthlyCron {
  private readonly logger = new Logger(FinancialReportsMonthlyCron.name);

  constructor(
    private readonly query: FinancialReportsQueryService,
    private readonly telegram: FinancialReportsTelegramService,
    private readonly analytics: FinancialReportsAnalyticsService,
  ) {}

  // 3rd of each month at 10:00 Tashkent
  @Cron('0 10 3 * *', { timeZone: 'Asia/Tashkent' })
  async monthlyReport(): Promise<void> {
    const today = _time.now().toISOString().slice(0, 10);
    this.logger.log(`Running monthly financial report for ${today}`);

    try {
      const [cashR, warehouseR, receivablesR, payablesR, balanceR, productionR] = await Promise.all([
        this.query.getCashSummary(today),
        this.query.getWarehouseBalance(),
        this.query.getReceivables(today),
        this.query.getPayables(today),
        this.query.getBalanceSheet(today),
        this.query.getProductionMetrics(today),
      ]);

      const cash      = cashR.ok      ? cashR.data      : null;
      const warehouse = warehouseR.ok ? warehouseR.data : null;
      const balance   = balanceR.ok   ? balanceR.data   : null;
      const receivable = receivablesR.ok ? receivablesR.data?.[0] : null;
      const payable    = payablesR.ok    ? payablesR.data?.[0]    : null;
      const production = productionR.ok  ? productionR.data       : null;

      const fmt = (n: number) => this.analytics.formatCurrency(n);

      // Financial ratios
      const ratios = balance
        ? this.analytics.liquidityRatios(
            balance.currentAssets,
            0,
            cash?.closingBalance ?? 0,
            balance.currentLiabilities,
          )
        : null;

      const profitability = balance
        ? this.analytics.roaRoe(
            balance.retainedEarnings,
            balance.totalAssets,
            balance.equity,
          )
        : null;

      const html = [
        `<b>📆 Oylik Moliyaviy Hisobot</b>`,
        `<i>${today} holatiga</i>`,
        '',
        `<b>📊 Balans Varag\'i:</b>`,
        balance
          ? `  Jami aktivlar: ${fmt(balance.totalAssets)}\n  Kapital: ${fmt(balance.equity)}\n  Majburiyatlar: ${fmt(balance.totalLiabilities)}`
          : '  Ma\'lumot yo\'q',
        '',
        `<b>💰 Kassa Oqimi:</b>`,
        cash
          ? `  Kirim: ${fmt(cash.totalInflow)}\n  Chiqim: ${fmt(cash.totalOutflow)}\n  Sof: ${fmt(cash.netCashFlow)}`
          : '  Ma\'lumot yo\'q',
        '',
        `<b>📈 Likvidlik Ko\'rsatkichlari:</b>`,
        ratios
          ? `  Joriy likvidlik: ${ratios.currentRatio}\n  Tezkor likvidlik: ${ratios.quickRatio}\n  Naqd likvidlik: ${ratios.cashRatio}`
          : '  Ma\'lumot yo\'q',
        '',
        `<b>💹 Rentabellik:</b>`,
        profitability
          ? `  ROA: ${profitability.roa}%\n  ROE: ${profitability.roe}%`
          : '  Ma\'lumot yo\'q',
        '',
        `<b>🏭 Ishlab Chiqarish:</b>`,
        production
          ? `  Samaradorlik: <b>${production.efficiencyPct}%</b>\n  Chiqindilar: ${production.scrapRatePct}%`
          : '  Ma\'lumot yo\'q',
        '',
        `<b>📦 Ombor:</b>`,
        warehouse ? `  Jami qoldiq qiymati: ${warehouse.totalQuantity.toFixed(2)}` : '  Ma\'lumot yo\'q',
        '',
        `<b>💳 Qarzdorlar:</b>`,
        receivable ? `  Debitorlar: ${fmt(receivable.total)}\n  Muddati o\'tgan: ${fmt(receivable.overdue30 + receivable.overdue60 + receivable.overdue90plus)}` : '  Ma\'lumot yo\'q',
        payable    ? `  Kreditorlar: ${fmt(payable.total)}` : '',
      ].filter(Boolean).join('\n');

      await this.telegram.sendReport('oylik', html);
      this.logger.log('Monthly financial report sent successfully');
    } catch (err) {
      this.logger.error(`Monthly report error: ${String(err)}`);
    }
  }
}
