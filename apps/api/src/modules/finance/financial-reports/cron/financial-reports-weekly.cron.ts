/**
 * @module financial-reports-weekly.cron
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
export class FinancialReportsWeeklyCron {
  private readonly logger = new Logger(FinancialReportsWeeklyCron.name);

  constructor(
    private readonly query: FinancialReportsQueryService,
    private readonly telegram: FinancialReportsTelegramService,
    private readonly analytics: FinancialReportsAnalyticsService,
  ) {}

  @Cron('0 9 * * 1', { timeZone: 'Asia/Tashkent' })
  async weeklyReport(): Promise<void> {
    const today = _time.now().toISOString().slice(0, 10);
    this.logger.log(`Running weekly financial report for week ending ${today}`);

    try {
      const [cashR, warehouseR, receivablesR, payablesR, productionR] = await Promise.all([
        this.query.getCashSummary(today),
        this.query.getWarehouseBalance(),
        this.query.getReceivables(today),
        this.query.getPayables(today),
        this.query.getProductionMetrics(today),
      ]);

      const cash      = cashR.ok      ? cashR.data      : null;
      const warehouse = warehouseR.ok ? warehouseR.data : null;
      const receivable = receivablesR.ok ? receivablesR.data?.[0] : null;
      const payable    = payablesR.ok    ? payablesR.data?.[0]    : null;
      const production = productionR.ok  ? productionR.data       : null;

      const fmt = (n: number) => this.analytics.formatCurrency(n);

      // Simple week-over-week trend via cash flow direction
      const cashTrend = cash
        ? this.analytics.trendAnalysis([cash.openingBalance, cash.closingBalance])
        : null;

      const trendEmoji = cashTrend?.direction === 'up' ? '📈' : cashTrend?.direction === 'down' ? '📉' : '➡️';

      const html = [
        `<b>📅 Haftalik Moliyaviy Hisobot</b>`,
        `<i>${today} holatiga</i>`,
        '',
        `<b>💰 Kassa Oqimi:</b>`,
        cash ? `  Kirim: ${fmt(cash.totalInflow)}\n  Chiqim: ${fmt(cash.totalOutflow)}\n  ${trendEmoji} Trend: ${cashTrend?.direction ?? 'flat'} (${cashTrend?.changePercent ?? 0}%)` : '  Ma\'lumot yo\'q',
        '',
        `<b>🏭 Ishlab Chiqarish Samaradorligi:</b>`,
        production ? `  Samaradorlik: <b>${production.efficiencyPct}%</b>\n  Chiqindilar: ${production.scrapRatePct}%\n  To\'xtatish: ${production.downtimeMinutes} daqiqa` : '  Ma\'lumot yo\'q',
        '',
        `<b>📦 Ombor Holati:</b>`,
        warehouse ? `  Jami miqdor: ${warehouse.totalQuantity.toFixed(2)}\n  30 kunlik o\'rtacha: ${warehouse.averageValue30d.toFixed(2)}` : '  Ma\'lumot yo\'q',
        '',
        `<b>💳 AR/AP Holati:</b>`,
        receivable ? `  Debitorlar: ${fmt(receivable.total)}` : '  Debitorlar: yo\'q',
        payable    ? `  Kreditorlar: ${fmt(payable.total)}`   : '  Kreditorlar: yo\'q',
      ].join('\n');

      await this.telegram.sendReport('haftalik', html);
      this.logger.log('Weekly financial report sent successfully');
    } catch (err) {
      this.logger.error(`Weekly report error: ${String(err)}`);
    }
  }
}
