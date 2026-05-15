/**
 * @module telegram-bots-cron.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Rule 16: Cron job bodies live in telegram-bots-cron.helpers.ts; this file owns the @Cron decorators.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { errMsg } from '../hr-v2-error';
import { Result, AppError } from '@common/result';
import { Cron } from '@nestjs/schedule';
import { NotificationBotService } from './notification-bot.service';
import { TelegramBotsRepository } from './telegram-bots.repository';
import { AttendanceBotService } from './attendance-bot.service';
import { LearningBotService } from './learning-bot.service';
import {
  IncidentPayload,
  runBirthdayAndAnniversary, runProbationAndContractReminders,
  runMorningAttendanceCheck, runAbsenceDay1Reminders, runAbsenceDay2Warnings,
  runAutoBlockOffboarded, runArchiveInactiveCandidates, runPayrollNotification,
  runCheckAdaptationRisks, runPipProgressReminders,
  runIncidentEvent, runManagerDailySummary,
} from './telegram-bots-cron.helpers';

@Injectable()
export class TelegramBotsCronService {
  private readonly logger = new Logger(TelegramBotsCronService.name);

  constructor(
    private readonly notificationBot: NotificationBotService,
    private readonly repo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly attendanceBot: AttendanceBotService,
    private readonly learningBot: LearningBotService,
  ) {}

  private get deps() {
    return {
      logger: this.logger,
      notif: this.notificationBot,
      repo: this.repo,
      cfg: this.cfg,
      attendance: this.attendanceBot,
    };
  }

  @Cron('30 7 * * *')
  async sendBirthdayAndAnniversaryNotifications(): Promise<Result<void, AppError>> {
    return runBirthdayAndAnniversary(this.deps);
  }

  @Cron('0 9 * * *')
  async sendProbationAndContractReminders(): Promise<Result<void, AppError>> {
    return runProbationAndContractReminders(this.deps);
  }

  @Cron('30 9 * * *')
  async sendMorningAttendanceCheck(): Promise<Result<void, AppError>> {
    return runMorningAttendanceCheck(this.deps);
  }

  @Cron('0 11 * * 1-6')
  async sendAbsenceDay1Reminders(): Promise<void> {
    return runAbsenceDay1Reminders(this.deps);
  }

  @Cron('0 11 * * 1-6')
  async sendAbsenceDay2Warnings(): Promise<void> {
    return runAbsenceDay2Warnings(this.deps);
  }

  @Cron('59 23 * * *')
  async autoBlockOffboardedEmployees(): Promise<void> {
    return runAutoBlockOffboarded(this.deps);
  }

  @Cron('0 2 * * *')
  async archiveInactiveCandidates(): Promise<void> {
    return runArchiveInactiveCandidates(this.deps);
  }

  @Cron('0 8 25 * *')
  async sendPayrollNotification(): Promise<void> {
    return runPayrollNotification(this.deps);
  }

  @Cron('0 10 * * 1-6')
  async checkAdaptationRisks(): Promise<void> {
    return runCheckAdaptationRisks(this.deps);
  }

  @Cron('0 9 * * 1,3,5')
  async sendPipProgressReminders(): Promise<void> {
    return runPipProgressReminders(this.deps);
  }

  @OnEvent('incident.created')
  async onIncidentCreated(payload: IncidentPayload): Promise<void> {
    return runIncidentEvent(
      this.deps,
      payload,
      (phone, message) => this.sendSms(phone, message),
      (html) => this.stripHtml(html),
    );
  }

  @Cron('30 20 * * 1-6')
  async sendManagerDailySummary(): Promise<void> {
    return runManagerDailySummary(this.deps);
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    const smsApiUrl = this.cfg.get<string>('SMS_API_URL');
    const smsApiKey = this.cfg.get<string>('SMS_API_KEY');
    if (!smsApiUrl || !smsApiKey) {
      this.logger.debug(`SMS not configured — skipping SMS to ${phone}`);
      return;
    }
    try {
      const resp = await fetch(smsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${smsApiKey}` },
        body: JSON.stringify({ phone, message }),
      });
      if (!resp.ok) {
        this.logger.warn(`SMS API error: ${resp.status} for phone=${phone}`);
      }
    } catch (err) {
      this.logger.warn(`sendSms error for phone=${phone}: ${errMsg(err)}`);
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
