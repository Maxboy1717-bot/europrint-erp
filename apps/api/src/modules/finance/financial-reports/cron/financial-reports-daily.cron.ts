/**
 * @module financial-reports-daily.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FinancialReportsQueryService } from '../services/financial-reports-query.service';
import { FinancialReportsSnapshotService } from '../services/financial-reports-snapshot.service';
import { FinancialReportsTelegramService } from '../services/financial-reports-telegram.service';
import { FinancialReportsAnalyticsService } from '../services/financial-reports-analytics.service';

@Injectable()
export class FinancialReportsDailyCron {
  private readonly logger = new Logger(FinancialReportsDailyCron.name);

  constructor(
    private readonly query: FinancialReportsQueryService,
    private readonly snapshot: FinancialReportsSnapshotService,
    private readonly telegram: FinancialReportsTelegramService,
    private readonly analytics: FinancialReportsAnalyticsService,
  ) {}

  @Cron('0 18 * * *', { timeZone: 'Asia/Tashkent' })
  async dailyReport(): Promise<void> {
    const today = _time.now().toISOString().slice(0, 10);
    this.logger.log(`Running daily financial report for ${today}`);

    try {
      // Fetch all data once — reused for both snapshot persistence and HTML formatting
      const [cashR, warehouseR, receivablesR, payablesR, balanceR, productionR] = await Promise.all([
        this.query.getCashSummary(today),
        this.query.getWarehouseBalance(),
        this.query.getReceivables(today),
        this.query.getPayables(today),
        this.query.getBalanceSheet(today),
        this.query.getProductionMetrics(today),
      ]);

      // Persist snapshots from pre-fetched data (no extra DB reads)
      await this.snapshot.snapshotAllFromPrefetched(
        today, cashR, warehouseR, receivablesR, payablesR, balanceR, productionR,
      );

      const cash       = cashR.ok        ? cashR.data        : null;
      const warehouse  = warehouseR.ok   ? warehouseR.data   : null;
      const receivable = receivablesR.ok ? receivablesR.data?.[0] : null;
      const payable    = payablesR.ok    ? payablesR.data?.[0]    : null;
      const production = productionR.ok  ? productionR.data  : null;

      // Format HTML message
      const fmt = (n: number) => this.analytics.formatCurrency(n);
      const html = [
        `<b>📊 Kunlik Moliyaviy Hisobot — ${today}</b>`,
        '',
        `<b>💰 Kassa:</b>`,
        cash ? `  Kirim: ${fmt(cash.totalInflow)}\n  Chiqim: ${fmt(cash.totalOutflow)}\n  Sof: ${fmt(cash.netCashFlow)}` : '  Ma\'lumot yo\'q',
        '',
        `<b>🏭 Ishlab chiqarish:</b>`,
        production ? `  Samaradorlik: ${production.efficiencyPct}%\n  Chiqindilar: ${production.scrapRatePct}%` : '  Ma\'lumot yo\'q',
        '',
        `<b>📦 Ombor:</b>`,
        warehouse ? `  Jami miqdor: ${warehouse.totalQuantity.toFixed(2)}` : '  Ma\'lumot yo\'q',
        '',
        `<b>💳 Debitorlar:</b>`,
        receivable ? `  Jami: ${fmt(receivable.total)}\n  Muddati o\'tgan (30d+): ${fmt(receivable.overdue30 + receivable.overdue60 + receivable.overdue90plus)}` : '  Ma\'lumot yo\'q',
        '',
        `<b>💸 Kreditorlar:</b>`,
        payable ? `  Jami: ${fmt(payable.total)}` : '  Ma\'lumot yo\'q',
      ].join('\n');

      await this.telegram.sendReport('kunlik', html);

      // Check and send alerts
      await this._checkAndSendAlerts(today);

      this.logger.log('Daily financial report sent successfully');
    } catch (err) {
      this.logger.error(`Daily report error: ${String(err)}`);
    }
  }

  private async _checkAndSendAlerts(today: string): Promise<void> {
    try {
      const [overstockR, overdueR] = await Promise.all([
        this.query.getOverstockAlerts(),
        this.query.getOverdueDebtAlerts(),
      ]);

      const overstockAlerts = overstockR.ok ? overstockR.data : [];
      const overdueAlerts   = overdueR.ok   ? overdueR.data   : [];

      if (overstockAlerts.length) {
        const lines = overstockAlerts.map((a) =>
          `  ⚠️ Ombor ${a.warehouseId ?? '?'}: ${a.pct}% (norma: ${a.avgValue.toFixed(0)}, hozir: ${a.currentValue.toFixed(0)})`
        );
        await this.telegram.sendReport('muammo', `<b>🔴 Ortiqcha Zaxira Ogohlantirishi — ${today}</b>\n\n${lines.join('\n')}`);
      }

      if (overdueAlerts.length) {
        const lines = overdueAlerts.map((a) =>
          `  ⚠️ Mijoz ${a.customerId ?? '?'}: ${this.analytics.formatCurrency(a.amount)} — ${a.daysOverdue} kun kechikkan`
        );
        await this.telegram.sendReport('muammo', `<b>🔴 Muddati O\'tgan Qarzlar — ${today}</b>\n\n${lines.join('\n')}`);

        const taskLines = overdueAlerts
          .slice(0, 5)
          .map((a) => `  ✅ Mijoz ${a.customerId ?? '?'} dan qarzni undirib olish (${a.daysOverdue} kun)`);
        await this.telegram.sendReport('vazifa', `<b>📋 Bugungi Vazifalar — ${today}</b>\n\n${taskLines.join('\n')}`);
      }
    } catch (err) {
      this.logger.error(`Alert check error: ${String(err)}`);
    }
  }
}
