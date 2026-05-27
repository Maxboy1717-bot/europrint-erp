/** LateArrivalService — detects late arrivals, notifies employee via Telegram, awaits reason,
 *  creates a LATE_ARRIVAL document for HR approval. Penalty deferred to document.rejected event. */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { safeCall, Result, AppError, Err } from '@common/result';
import { SYSTEM_USER_ID } from '@common/constants/app.constants';
import { TashkentTimeService } from '@common/time';
import { NotificationBotService } from '../telegram-bots/notification-bot.service';
import { DocumentWorkflowService } from '../document-workflow/document-workflow.service';
import { DisciplineRecordRepository } from './discipline-record.repository';

export interface LateArrivalPayload {
  employee_id:  string;
  ts:           string;
  minutes_late: number;
}

interface PendingReason {
  employee_id:  string;
  ts:           string;
  minutes_late: number;
  timer:        ReturnType<typeof setTimeout>;
  date:         string;
}

const REASON_TIMEOUT_MS = 30 * 60 * 1_000;

@Injectable()
export class LateArrivalService {
  private readonly logger  = new Logger(LateArrivalService.name);
  private readonly time    = new TashkentTimeService();

  private readonly _notified = new Map<string, string>();
  /** NOTE: in-memory only — lost on restart / not safe for horizontal scale-out.
   *  Migrate to Redis HASH if multi-instance deployment is required. */
  private readonly _pending  = new Map<string, PendingReason>();

  constructor(
    private readonly notificationBot:    NotificationBotService,
    private readonly documentWorkflow:   DocumentWorkflowService,
    private readonly disciplineRepo:     DisciplineRecordRepository,
  ) {}

  @OnEvent('attendance.territory_enter')
  async onTerritoryEnter(payload: {
    employee_id:  string;
    ts:           string;
    is_late:      boolean;
    minutes_late: number;
  }): Promise<void> {
    if (!payload.is_late) return;
    const result = await this.processLateArrival({
      employee_id:  payload.employee_id,
      ts:           payload.ts,
      minutes_late: payload.minutes_late,
    });
    if (!result.ok) {
      this.logger.error('processLateArrival (territory_enter) failed: %s', String(result.error));
    }
  }

  @OnEvent('attendance.late_arrival')
  async onLateArrival(payload: LateArrivalPayload): Promise<void> {
    const result = await this.processLateArrival(payload);
    if (!result.ok) {
      this.logger.error('processLateArrival failed: %s', String(result.error));
    }
  }

  @OnEvent('telegram.late_reason_received')
  async onTelegramLateReason(payload: { employeeId: string; reason: string }): Promise<void> {
    const result = await this.receiveLateReason(payload.employeeId, payload.reason);
    if (!result.ok) {
      this.logger.warn('receiveLateReason via Telegram failed: %s', String(result.error));
    }
  }

  /**
   * Listens for document rejections emitted by DocumentWorkflowService.
   * Applies the lateness penalty only when a late_arrival document is
   * explicitly rejected by the approver — never on timeout alone.
   */
  @OnEvent('document.rejected')
  async onDocumentRejected(payload: Record<string, unknown>): Promise<void> {
    const documentType = payload['documentType'] as string | undefined;
    const documentId   = payload['documentId']   as number | undefined;
    const employeeId   = payload['employeeId']   as number | undefined;
    const content      = payload['content']      as Record<string, unknown> | undefined;

    if (documentType !== 'LATE_ARRIVAL') return;
    if (!employeeId) return;

    const minutesLate = (content?.['minutes_late'] as number | undefined) ?? 0;

    this.logger.warn(
      'Late arrival document #%d rejected for employee %d — applying penalty (%d min)',
      documentId,
      employeeId,
      minutesLate,
    );

    const penaltyResult = await safeCall(() =>
      this._applyLatenessPenalty(employeeId, minutesLate),
    );
    if (!penaltyResult.ok) {
      this.logger.error('Penalty application failed for employee %d: %s', employeeId, String(penaltyResult.error));
    }
  }

  async processLateArrival(payload: LateArrivalPayload): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const today = this.time.formatDate(this.time.today());
      const key   = `${payload.employee_id}:${today}`;

      if (this._notified.has(key)) return;
      this._notified.set(key, today);

      const numericEmployeeId = parseInt(payload.employee_id, 10);
      const chatId = await this.notificationBot.handleErpEvent({
        event:      'attendance.late',
        employeeId: Number.isFinite(numericEmployeeId) ? numericEmployeeId : undefined,
        data: {
          arrivalTime: payload.ts,
          lateMinutes: payload.minutes_late,
          date:        today,
        },
      });
      if (chatId) {
        this.notificationBot.registerLateReasonPending(chatId, payload.employee_id);
      }

      const hrChatId = process.env['HR_TELEGRAM_CHAT_ID'];
      if (hrChatId) {
        const msg =
          `⏰ *Kech kelish xabarnomasi*\n` +
          `👤 Xodim ID: \`${payload.employee_id}\`\n` +
          `🕒 Vaqt: ${payload.ts}\n` +
          `⏱ Kechikish: *${payload.minutes_late} daqiqa*`;
        await this.notificationBot.sendNotificationRaw(hrChatId, msg);
      }

      const existing = this._pending.get(key);
      if (existing) clearTimeout(existing.timer);

      const timer = setTimeout(() => {
        void this._onReasonTimeout(key, payload, today);
      }, REASON_TIMEOUT_MS);

      this._pending.set(key, {
        employee_id:  payload.employee_id,
        ts:           payload.ts,
        minutes_late: payload.minutes_late,
        timer,
        date:         today,
      });

      this.logger.log(
        'Late arrival notified: employee=%s minutes_late=%d awaiting_reason=30m',
        payload.employee_id,
        payload.minutes_late,
      );
    });
  }

  async receiveLateReason(employeeId: string, reason: string): Promise<Result<void, AppError>> {
    if (!reason || reason.trim().length < 30) {
      return Err(
        `Sabab kamida 30 ta belgi bo'lishi kerak (hozir: ${reason?.trim().length ?? 0} ta belgi).`,
      );
    }
    return safeCall(async () => {
      const today = this.time.formatDate(this.time.today());
      const key   = `${employeeId}:${today}`;
      const pend  = this._pending.get(key);
      if (!pend) return;

      clearTimeout(pend.timer);
      this._pending.delete(key);

      await this._createAndSubmitDocument(pend, reason.trim());
    });
  }

  private async _onReasonTimeout(
    key:     string,
    payload: LateArrivalPayload,
    today:   string,
  ): Promise<void> {
    const pend = this._pending.get(key);
    if (!pend) return;
    this._pending.delete(key);

    this.logger.warn(
      'Late arrival reason timeout — employee=%s submitting document for approval (no immediate penalty)',
      payload.employee_id,
    );

    await this._createAndSubmitDocument(pend, 'Sabab ko\'rsatilmadi (muddati o\'tdi)');
  }

  private async _createAndSubmitDocument(
    pend:   PendingReason,
    reason: string,
  ): Promise<void> {
    try {
      const numericId = parseInt(pend.employee_id, 10);
      if (isNaN(numericId)) return;

      const docResult = await this.documentWorkflow.createDocument({
        employeeId:   numericId,
        documentType: 'LATE_ARRIVAL',
        title:        `Kech kelish: Xodim #${numericId} — ${pend.date}`,
        content: {
          employee_id:  numericId,
          date:         pend.date,
          arrival_time: pend.ts,
          minutes_late: pend.minutes_late,
          reason,
        },
        initiatedBy: SYSTEM_USER_ID,
      });

      if (!docResult.ok || !docResult.data) {
        this.logger.error('Failed to create late_arrival document for employee %s', pend.employee_id);
        return;
      }

      const docId = (docResult.data as Record<string, unknown>)['id'] as number | undefined;
      if (docId) {
        await this.documentWorkflow.submitDocument(docId, SYSTEM_USER_ID);
        this.logger.log(
          'Late arrival document #%d submitted for approval — employee=%s minutes_late=%d',
          docId, pend.employee_id, pend.minutes_late,
        );
      }
    } catch (err) {
      this.logger.error('_createAndSubmitDocument error: %s', String(err));
    }
  }

  private async _applyLatenessPenalty(employeeId: number, minutesLate: number): Promise<void> {
    const today = this.time.formatDate(this.time.today());
    const r = await this.disciplineRepo.insert({
      employeeId:     employeeId,
      violationType:  'LATE_ARRIVAL',
      disciplineType: 'FINE',
      description:    `Avtomatik jarima: ${minutesLate} daqiqa kech kelganlik, sababnomasi rad etildi`,
      violationDate:  today,
      issuedDate:     today,
      severity:       'low',
      issuedBy:       SYSTEM_USER_ID,
      status:         'approved',
    });
    if (!r.ok) this.logger.warn?.(`disciplineRepo.insert failed: ${r.error.message}`);
  }

  async getLateArrivalsToday(): Promise<Result<{ employee_id: string; date: string }[], AppError>> {
    return safeCall(async () => {
      const today  = this.time.formatDate(this.time.today());
      const result: { employee_id: string; date: string }[] = [];
      for (const [key, date] of this._notified.entries()) {
        if (date === today) {
          const emp = key.split(':')[0] ?? '';
          result.push({ employee_id: emp, date });
        }
      }
      return result;
    });
  }

  private _cleanOldKeys(today: string): void {
    for (const [key, date] of this._notified.entries()) {
      if (date !== today) this._notified.delete(key);
    }
    for (const [key, pend] of this._pending.entries()) {
      if (pend.date !== today) { clearTimeout(pend.timer); this._pending.delete(key); }
    }
  }
}
