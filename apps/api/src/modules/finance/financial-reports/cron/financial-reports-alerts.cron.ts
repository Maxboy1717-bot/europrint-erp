/**
 * @module financial-reports-alerts.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { FinancialReportsQueryService } from '../services/financial-reports-query.service';
import { FinancialReportsTelegramService } from '../services/financial-reports-telegram.service';
import { FinancialReportsAnalyticsService } from '../services/financial-reports-analytics.service';

@Injectable()
export class FinancialReportsAlertsCron {
  private readonly logger = new Logger(FinancialReportsAlertsCron.name);

  constructor(
    private readonly query: FinancialReportsQueryService,
    private readonly telegram: FinancialReportsTelegramService,
    private readonly analytics: FinancialReportsAnalyticsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('*/30 * * * *')
  async checkAlerts(): Promise<void> {
    // Skip all DB queries when no alert channels are configured
    if (!this.configService.get<string>('TELEGRAM_MUAMMO_CHAT_ID') && !this.configService.get<string>('TELEGRAM_VAZIFA_CHAT_ID')) {
      return;
    }

    const now = _time.now().toISOString();
    this.logger.debug(`Alert check at ${now}`);

    try {
      await Promise.allSettled([
        this._checkOverstock(now),
        this._checkOutOfStock(now),
        this._checkOverdueDebts(now),
      ]);
    } catch (err) {
      this.logger.error(`Alert cron error: ${String(err)}`);
    }
  }

  private async _checkOverstock(timestamp: string): Promise<void> {
    const result = await this.query.getOverstockAlerts();
    if (!result.ok || !result.data.length) return;

    const lines = (Array.isArray(result.data) ? result.data : []).map((a) =>
      `  ⚠️ Ombor #${a.warehouseId ?? '?'}: <b>${a.pct}%</b> (hozir: ${a.currentValue.toFixed(0)}, o\'rtacha: ${a.avgValue.toFixed(0)})`
    );

    await this.telegram.sendReport(
      'muammo',
      `<b>🔴 Ortiqcha Zaxira [${timestamp.slice(0, 16).replace('T', ' ')}]</b>\n\n${lines.join('\n')}`,
    );
  }

  private async _checkOutOfStock(timestamp: string): Promise<void> {
    const result = await this.query.getOutOfStockAlerts();
    if (!result.ok || !result.data.length) return;

    const lines = result.data.slice(0, 15).map((a) =>
      `  🚫 ${a.materialName ?? `Material #${a.warehouseId ?? '?'}`}: <b>${a.currentQty}</b> dona`
    );

    await this.telegram.sendReport(
      'muammo',
      `<b>⛔ Zaxira Tugagan (Out of Stock) [${timestamp.slice(0, 16).replace('T', ' ')}]</b>\n\n${lines.join('\n')}\n\n<i>Xarid bo'limiga xabarnoma yuborildi</i>`,
    );

    await this.telegram.sendReport(
      'vazifa',
      `<b>📦 Zaxirani To'ldirish Vazifalari</b>\n\n${lines.slice(0, 5).join('\n')}`,
    );
  }

  private async _checkOverdueDebts(timestamp: string): Promise<void> {
    const result = await this.query.getOverdueDebtAlerts();
    if (!result.ok || !result.data.length) return;

    const fmt = (n: number) => this.analytics.formatCurrency(n);

    const lines = result.data.slice(0, 10).map((a) =>
      `  ⚠️ Mijoz #${a.customerId ?? '?'}: ${fmt(a.amount)} — <b>${a.daysOverdue} kun</b> kechikkan`
    );

    await this.telegram.sendReport(
      'muammo',
      `<b>🔴 Muddati O\'tgan Qarzlar [${timestamp.slice(0, 16).replace('T', ' ')}]</b>\n\n${lines.join('\n')}`,
    );

    // Post top-5 as tasks to vazifa channel
    const tasks = result.data.slice(0, 5).map((a) =>
      `  ✅ Mijoz #${a.customerId ?? '?'} — ${fmt(a.amount)} undirish (${a.daysOverdue} kun)`
    );
    await this.telegram.sendReport(
      'vazifa',
      `<b>📋 Undirilmagan Qarzlar Vazifalari</b>\n\n${tasks.join('\n')}`,
    );
  }
}
