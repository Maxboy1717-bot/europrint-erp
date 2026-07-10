/**
 * @module off-hours-report.cron
 * @description Vision 10-warehouse #30 - "Ish vaqtidan tashqari amal bayrogi AVTO" (off-hours flag).
 *   Weekly CRON (Monday 07:00): collects the last 7 days of outside-shift warehouse movements
 *   (OffHoursAuditService) and sends a summary notification to HR + Director (vision E5).
 *   Recipients are resolved via notification_routing_rules (config-driven); when no rule row
 *   exists it falls back to the 'director'/'hr_manager' roles (no regression, Q-39).
 *   The off-hours flag is computed in the report - no new table/column.
 *
 *   NOTE: @Cron works because ScheduleModule.forRoot() is registered at the app root (same as
 *   the existing WmsCycleCountGeneratorCron / DepartmentWarehouseSyncService providers).
 * @layer Cron (WMS)
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OffHoursAuditService } from '../../application/off-hours-audit.service';
import { NotificationRoutingRepository } from '../../../notifications/infrastructure/notification-routing.repository';
import { INotificationRepo, NOTIFICATION_REPO } from '../../../notifications/domain/repositories/i-notification.repo';
import { Notification } from '../../../notifications/domain/aggregates/notification.aggregate';

/** notification_routing_rules.event_type - config-driven routing key. */
const OFF_HOURS_EVENT_TYPE = 'wms.off_hours_report';
/** Fallback roles when no routing row exists (HR + Director, vision E5). */
const OFF_HOURS_FALLBACK_ROLES = ['director', 'hr_manager'];
/** Report window in days. */
const OFF_HOURS_WINDOW_DAYS = 7;

@Injectable()
export class OffHoursReportCron {
  private readonly logger = new Logger(OffHoursReportCron.name);

  constructor(
    private readonly svc: OffHoursAuditService,
    private readonly routing: NotificationRoutingRepository,
    @Inject(NOTIFICATION_REPO) private readonly notifications: INotificationRepo,
  ) {}

  /** Weekly Monday 07:00 - off-hours warehouse-activity report (HR + Director). */
  @Cron('0 7 * * 1')
  async sendWeeklyOffHoursReport(): Promise<void> {
    try {
      const r = await this.svc.getOffHoursMovements(OFF_HOURS_WINDOW_DAYS);
      if (!r.ok) {
        this.logger.error(`off-hours report: ${r.error.message}`);
        return;
      }
      const rows = r.data;
      if (rows.length === 0) {
        this.logger.log('Off-hours weekly report: no outside-shift movements (no notification sent)');
        return;
      }

      const recipientIds = await this.resolveRecipients();
      if (recipientIds.length === 0) {
        this.logger.warn('Off-hours report: no target users resolved (routing + fallback both empty)');
        return;
      }

      const title = 'Ish vaqtidan tashqari ombor amallari (haftalik)';
      const body = this.buildBody(rows);
      await Promise.all(
        recipientIds.map((id) =>
          this.notifications.save(
            Notification.createForUser(String(id), title, body, 'wms_off_hours'),
          ),
        ),
      );
      this.logger.log(`Off-hours weekly report: ${rows.length} movement(s) -> ${recipientIds.length} recipient(s)`);
    } catch (e) {
      this.logger.error(`sendWeeklyOffHoursReport: ${(e as Error).message}`);
    }
  }

  /** Collect director + hr_manager user ids (routing rule or role fallback), de-duplicated. */
  private async resolveRecipients(): Promise<number[]> {
    const ids = new Set<number>();
    for (const role of OFF_HOURS_FALLBACK_ROLES) {
      const res = await this.routing.resolveUserIds(OFF_HOURS_EVENT_TYPE, role);
      if (res.ok) for (const id of res.data) ids.add(id);
    }
    return Array.from(ids);
  }

  /** Report body: total count + a short preview of the most recent movements. */
  private buildBody(rows: Array<Record<string, unknown>>): string {
    const preview = rows.slice(0, 10).map((row) => {
      const raw = row['performed_at'];
      const at = raw instanceof Date ? raw.toISOString().slice(0, 16).replace('T', ' ') : String(raw);
      const who = String(row['performed_by_name'] ?? row['performed_by']);
      const mat = String(row['material_name'] ?? '');
      return `- ${at} - ${who}: ${String(row['movement_type'])} ${mat}`.trim();
    });
    const more = rows.length > preview.length ? `\n...and ${rows.length - preview.length} more` : '';
    return `Last 7 days: ${rows.length} outside-shift warehouse movement(s) detected:\n${preview.join('\n')}${more}`;
  }
}
