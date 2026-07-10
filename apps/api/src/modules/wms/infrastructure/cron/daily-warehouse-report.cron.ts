/**
 * @module daily-warehouse-report.cron
 * @description Kunlik ombor hisoboti (vizyon 10-warehouse#47): har kuni BARCHA faol
 *   ombor turlari bo'yicha agregat hisobot — "bo'sh" tur ham 0 bilan (transparentlik
 *   uchun, hisobotdan chiqarilmaydi). Recipient bo'yicha ikki format (vizyon: "format
 *   konfiguratsiyadan"):
 *     - ombor boshlig'i (warehouse_head) = BATAFSIL (har tur alohida),
 *     - Direktor (director)              = QISQACHA summary (umumiy jami).
 *   Nishon (kimga yuborish) `notification_routing_rules` orqali config-driven
 *   (StockAlertCron namunasi qayta ishlatiladi): `wms.daily_report_detailed` /
 *   `wms.daily_report_summary` — egasi/admin `notification-routing-rules` CRUD orqali
 *   aniq xodimga yo'naltiradi; jadvalda qator bo'lmasa fallback rol (warehouse_head /
 *   director). Bir kunda bir marta yuboriladi (NOT EXISTS dedupe,
 *   reference_type='wms_daily_report', created_at::date=CURRENT_DATE).
 *
 *   Agregat so'rovi WmsCatalogDashboardService.getDailyWarehouseReport() da (query
 *   qatlami, dep item #91) — bu fayl faqat formatlash + bildirishnoma yozadi (Qoida 6).
 *   RU tarjima (title_ru/message_ru) ataylab to'ldirilmaydi (bilingual darvoza).
 * @layer Cron (WMS)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { WmsCatalogDashboardService } from '../../application/wms-catalog/dashboard.service';
import { NotificationRoutingRepository } from '../../../notifications/infrastructure/notification-routing.repository';

/** notification_routing_rules.event_type — batafsil hisobot (ombor boshlig'i). */
const DETAILED_EVENT_TYPE = 'wms.daily_report_detailed';
const DETAILED_FALLBACK_ROLE = 'warehouse_head';
/** notification_routing_rules.event_type — qisqacha summary (Direktor). */
const SUMMARY_EVENT_TYPE = 'wms.daily_report_summary';
const SUMMARY_FALLBACK_ROLE = 'director';
/** notifications.reference_type — kunlik dedupe kaliti. */
const REFERENCE_TYPE = 'wms_daily_report';

type DailyReport = Awaited<ReturnType<WmsCatalogDashboardService['getDailyWarehouseReport']>>;

@Injectable()
export class DailyWarehouseReportCron {
  private readonly logger = new Logger(DailyWarehouseReportCron.name);

  constructor(
    private readonly dashboard: WmsCatalogDashboardService,
    private readonly routing: NotificationRoutingRepository,
  ) {}

  /** Har kuni 07:00 — barcha ombor turlari kunlik hisoboti (batafsil + summary). */
  @Cron('0 7 * * *')
  async run(): Promise<void> {
    try {
      const report = await this.dashboard.getDailyWarehouseReport();
      if (report.totals.warehouseCount === 0) {
        this.logger.log("Kunlik ombor hisoboti: faol ombor yo'q, o'tkazib yuborildi");
        return;
      }

      const detailedBody = this.buildDetailedBody(report);
      const summaryBody = this.buildSummaryBody(report);

      const detailedIds = await this.routing.resolveUserIds(DETAILED_EVENT_TYPE, DETAILED_FALLBACK_ROLE);
      const summaryIds = await this.routing.resolveUserIds(SUMMARY_EVENT_TYPE, SUMMARY_FALLBACK_ROLE);

      let sent = 0;
      sent += await this.dispatch(detailedIds.ok ? detailedIds.data : [], 'Kunlik ombor hisoboti (batafsil)', detailedBody);
      sent += await this.dispatch(summaryIds.ok ? summaryIds.data : [], 'Kunlik ombor hisoboti (qisqacha)', summaryBody);

      this.logger.log(`Kunlik ombor hisoboti: turlar=${report.totals.typeCount} bildirishnoma=${sent}`);
    } catch (e) {
      this.logger.error(`DailyWarehouseReportCron: ${(e as Error).message}`);
    }
  }

  /** Ombor boshlig'i uchun — har ombor turi alohida (bo'sh tur ham 0 bilan). */
  private buildDetailedBody(report: DailyReport): string {
    const lines = report.byType.map(
      t => `${t.type}: ${t.warehouseCount} ombor, ${t.materialCount} material, ${t.totalQuantity} birlik`,
    );
    return `Ombor turlari bo'yicha (${report.totals.typeCount} tur):\n` + lines.join('\n');
  }

  /** Direktor uchun — qisqacha umumiy jami + nechta tur bo'sh (0). */
  private buildSummaryBody(report: DailyReport): string {
    const emptyTypes = report.byType.filter(t => t.totalQuantity === 0).length;
    return (
      `Jami ${report.totals.warehouseCount} ombor / ${report.totals.typeCount} tur, ` +
      `${report.totals.materialCount} material, ${report.totals.totalQuantity} birlik zaxira ` +
      `(${emptyTypes} tur bo'sh — 0).`
    );
  }

  /** Bir kunda bir marta (NOT EXISTS dedupe) har recipientga bildirishnoma yozadi. */
  private async dispatch(userIds: number[], title: string, body: string): Promise<number> {
    let count = 0;
    for (const userId of userIds) {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO notifications
          (user_id, type, title, body, is_read, priority, title_uz, message_uz, reference_type, created_at)
        SELECT ${userId}, 'wms_daily_report', ${title}, ${body}, FALSE, 'normal', ${title}, ${body}, ${REFERENCE_TYPE}, NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM notifications
          WHERE user_id = ${userId} AND reference_type = ${REFERENCE_TYPE}
            AND created_at::date = CURRENT_DATE
        )
        RETURNING id
      `);
      if (r.rows.length > 0) count += 1;
    }
    return count;
  }
}
