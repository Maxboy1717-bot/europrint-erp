/**
 * @module room-analysis.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { safeCall, Result, AppError } from '@common/result';
import { TashkentTimeService } from '@common/time';
import { db, camera_events, hrEmployees } from '@shared/db';
import { eq, gte, desc, or, and } from 'drizzle-orm';
import { InspectionRepository } from './inspection.repository';
import { InspectionService } from './inspection.service';
import { NotificationBotService } from '../telegram-bots/notification-bot.service';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const HR_NOTIFY_ROLES = ['HR_MANAGER', 'HR_DIRECTOR', 'SECURITY'] as const;

@Injectable()
export class RoomAnalysisCron {
  private readonly logger = new Logger(RoomAnalysisCron.name);
  private readonly time   = new TashkentTimeService();

  constructor(
    private readonly repo:            InspectionRepository,
    private readonly inspectionSvc:   InspectionService,
    private readonly notificationBot: NotificationBotService,
  ) {}

  @Cron('0 */2 * * *', { name: 'room-analysis' })
  async runAnalysis(): Promise<void> {
    const result = await this._run();
    if (!result.ok) {
      const e = result.error;
      const msg = `[${e.code}] ${e.message}`;
      this.logger.error('RoomAnalysisCron failed: %s', msg);
    }
  }

  async _run(): Promise<Result<{ processed: number; anomalies: number }, AppError>> {
    return safeCall(async () => {
      const roomsResult = await this.repo.findAllRooms();
      if (!roomsResult.ok) throw new Error(String(roomsResult.error));

      const rooms = roomsResult.data as Record<string, unknown>[];
      if (rooms.length === 0) {
        this.logger.debug('RoomAnalysisCron: no rooms registered yet');
        return { processed: 0, anomalies: 0 };
      }

      const cutoff     = new Date(this.time.now().getTime() - TWO_HOURS_MS);
      let processed    = 0;
      let anomalyCount = 0;

      for (const room of rooms) {
        const roomCode = String(room['room_code'] ?? '');
        if (!roomCode) continue;

        const snapshotUrl = await this._findCameraSnapshot(roomCode, cutoff);
        if (!snapshotUrl) {
          this.logger.debug('RoomAnalysisCron: no snapshot found for room=%s', roomCode);
          continue;
        }

        const compResult = await this.inspectionSvc.runRoomComparison(roomCode, snapshotUrl);
        if (!compResult.ok) {
          this.logger.warn('RoomAnalysisCron: comparison failed room=%s: %s', roomCode, String(compResult.error));
          continue;
        }

        processed++;
        const analysis   = compResult.data as Record<string, unknown>;
        const cs         = parseFloat(String(analysis['cleanliness_score'] ?? '1'));
        const os         = parseFloat(String(analysis['order_score'] ?? '1'));
        const eok        = analysis['equipment_ok'];
        const hasAnomaly = cs < 0.6 || os < 0.6 || eok === false;

        if (hasAnomaly) {
          anomalyCount++;
          const issues    = (analysis['issues'] as string[] | null) ?? [];
          const issueText = issues.slice(0, 3).join('; ') || 'Anomaliya aniqlandi';
          const roomName  = String(room['room_name'] ?? roomCode);

          this.logger.warn('RoomAnalysisCron: anomaly room=%s issues=%s', roomCode, issueText);

          await this._notifyHrStaff(
            `⚠️ <b>Xona inspeksiyasi — muammo!</b>\n\n` +
            `Xona: <b>${roomName}</b>\n` +
            `Muammo: ${issueText}\n` +
            `Tozalik: ${Math.round(cs * 100)}%  Tartib: ${Math.round(os * 100)}%\n` +
            `Jihozlar: ${eok ? '✅' : '❌'}\n` +
            `Vaqt: ${this.time.now().toLocaleString('uz')}`,
          );

          if (analysis['id']) {
            await this.repo.markNotifiedHr(String(analysis['id'])).catch(() => undefined);
          }
        }
      }

      this.logger.log('RoomAnalysisCron: processed=%d anomalies=%d', processed, anomalyCount);
      return { processed, anomalies: anomalyCount };
    });
  }

  private async _findCameraSnapshot(roomCode: string, since: Date): Promise<string | null> {
    try {
      const roomSpecificRows = await db
        .select({ screenshot_url: camera_events.screenshot_url })
        .from(camera_events)
        .where(
          and(
            eq(camera_events.camera_id, roomCode),
            gte(camera_events.created_at, since),
          ),
        )
        .orderBy(desc(camera_events.created_at))
        .limit(1);

      const roomUrl = (roomSpecificRows[0] as Record<string, unknown> | undefined)?.['screenshot_url'];
      if (roomUrl) return String(roomUrl);

      // No room-specific snapshot in the 2-hour window — skip this room
      this.logger.debug('_findCameraSnapshot: no snapshot for camera_id=%s since=%s', roomCode, since.toISOString());
      return null;
    } catch {
      return null;
    }
  }

  private async _notifyHrStaff(message: string): Promise<void> {
    try {
      const rows = await db
        .select({ telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(
          or(
            eq(hrEmployees.role, HR_NOTIFY_ROLES[0]),
            eq(hrEmployees.role, HR_NOTIFY_ROLES[1]),
            eq(hrEmployees.role, HR_NOTIFY_ROLES[2]),
          ),
        )
        .limit(50);

      for (const row of rows as Record<string, unknown>[]) {
        const chatId = String(row['telegram_chat_id'] ?? '');
        if (!chatId) continue;
        await this.notificationBot.sendNotificationRaw(chatId, message).catch((e: unknown) => {
          this.logger.warn('RoomAnalysisCron: notify failed chatId=%s: %s', chatId, String(e));
        });
      }
    } catch (e: unknown) {
      this.logger.warn('RoomAnalysisCron: _notifyHrStaff failed: %s', String(e));
    }
  }
}
