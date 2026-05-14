/**
 * @module telegram-bots.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { HrV2Events } from '../events/hr-v2-events';
import { HrBotService } from './hr-bot.service';
import { RecruitmentBotService } from './recruitment-bot.service';
import { ReportBotService } from './report-bot.service';
import { NotificationBotService } from './notification-bot.service';
import { ManagerBotService } from './manager-bot.service';
import { AttendanceBotService } from './attendance-bot.service';
import { LearningBotService } from './learning-bot.service';
import { TelegramBotsRepository } from './telegram-bots.repository';

type BotType = 'hr' | 'recruitment' | 'report' | 'notification' | 'manager' | 'attendance' | 'learning';

@Injectable()
export class TelegramBotsService {
  private readonly logger = new Logger(TelegramBotsService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly hrBot: HrBotService,
    private readonly recruitmentBot: RecruitmentBotService,
    private readonly reportBot: ReportBotService,
    readonly notificationBot: NotificationBotService,
    private readonly managerBot: ManagerBotService,
    private readonly attendanceBot: AttendanceBotService,
    private readonly learningBot: LearningBotService,
    private readonly repo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
  ) {}

  async sendMessage(botType: BotType | string, chatId: number | string, message: string): Promise<Result<boolean, AppError>> {
    return safeCall(async () => {
      switch (botType) {
        case 'hr':          return this.hrBot.sendMessage(chatId, message);
        case 'recruitment': return this.recruitmentBot.sendMessage(chatId, message);
        case 'report':      return this.reportBot.sendMessage(chatId, message);
        case 'notification':return this.notificationBot.sendMessage(chatId, message);
        case 'manager':     return this.managerBot.sendMessage(chatId, message);
        case 'attendance':  return this.attendanceBot.sendMessage(chatId, message);
        case 'learning':    return this.learningBot.sendMessage(chatId, message);
        default:
          this.logger.debug(`Unknown bot type '${botType}', storing notification in DB`);
          try {
            await this.repo.insertFallbackNotification(message);
          } catch (fallbackErr: unknown) {
            this.logger.warn(`Fallback DB notification insert failed: ${errMsg(fallbackErr)}`);
          }
          return false;
      }
    });
  }

  async broadcastToAll(botType: string, message: string) {
    const chatIdsR = await this.repo.getActiveTelegramChatIds();
    const chatIds = chatIdsR.ok ? chatIdsR.data : [];
    let sent = 0;
    for (const chatId of chatIds) {
      const ok = await this.sendMessage(botType, chatId, message);
      if (ok) sent++;
    }
    this.logger.log(`Broadcast sent to ${sent}/${chatIds.length} employees via ${botType}`);
    return { sent, total: chatIds.length };
  }

  getBotStatus(): Record<string, boolean> {
    return {
      hr:           !!this.hrBot.getInstance(),
      recruitment:  !!this.recruitmentBot.getInstance(),
      report:       !!this.reportBot.getInstance(),
      notification: !!this.notificationBot.getInstance(),
      manager:      !!this.managerBot.getInstance(),
      attendance:   !!this.attendanceBot.getInstance(),
      learning:     !!this.learningBot.getInstance(),
    };
  }

  async notifyEmployee(employeeId: number, message: string): Promise<void> {
    try {
      const chatIdR = await this.repo.getEmployeeTelegramChatId(employeeId);
      const chatId = chatIdR.ok ? chatIdR.data : null;
      if (chatId) {
        await this.sendMessage('notification', chatId, message);
      } else {
        await this.repo.insertNotificationByEmployeeId(employeeId, message);
      }
    } catch (err) {
      this.logger.warn(`notifyEmployee #${employeeId} failed: ${errMsg(err)}`);
    }
  }

  async notifyHrGroup(message: string): Promise<void> {
    try {
      const chatId = this.cfg.get<string>('TELEGRAM_HR_GROUP_ID');
      if (chatId) {
        await this.sendMessage('hr', chatId, message);
      } else {
        this.logger.warn('notifyHrGroup: TELEGRAM_HR_GROUP_ID not configured');
      }
    } catch (err) {
      this.logger.warn(`notifyHrGroup failed: ${errMsg(err)}`);
    }
  }

  @OnEvent(HrV2Events.EMPLOYEE_BLOCKED)
  async onEmployeeBlocked(payload: { employeeId: number; reason: string }) {
    const chatIdR = await this.repo.getEmployeeTelegramChatId(payload.employeeId);
    const chatId = chatIdR.ok ? chatIdR.data : null;
    if (chatId) {
      await this.notificationBot.handleErpEvent({ event: 'employee.blocked', chatId, data: { reason: payload.reason } });
    }
  }

  @OnEvent(HrV2Events.EMPLOYEE_UNBLOCKED)
  async onEmployeeUnblocked(payload: { employeeId: number }) {
    const chatIdR = await this.repo.getEmployeeTelegramChatId(payload.employeeId);
    const chatId = chatIdR.ok ? chatIdR.data : null;
    if (chatId) {
      await this.notificationBot.handleErpEvent({ event: 'employee.unblocked', chatId, data: {} });
    }
  }

  @OnEvent(HrV2Events.DAILY_REPORT_OVERDUE)
  async onDailyReportOverdue(payload: { reportDate: string; absentCount: number; escalatedAt: string }) {
    const msg = `⚠️ <b>HR Eskalatsiya — Kunlik hisobot</b>\n\n`
              + `📅 Sana: ${payload.reportDate}\n`
              + `❌ Hisobot topshirmagan: <b>${payload.absentCount} ta xodim</b>\n`
              + `🕐 Eskalatsiya vaqti: ${payload.escalatedAt}\n\n`
              + `Iltimos, qolgan xodimlar bilan bog'laning va sababni aniqlang.`;
    await this.notifyHrGroup(msg);
  }

  @OnEvent(HrV2Events.DAILY_REPORT_REMINDER)
  async onDailyReportReminder(payload: { employeeId: number; reportDate: string }) {
    const chatIdR = await this.repo.getEmployeeTelegramChatId(payload.employeeId);
    const chatId = chatIdR.ok ? chatIdR.data : null;
    if (chatId) {
      const initiated = await this.reportBot.initiateReportRequest(chatId, payload.employeeId, payload.reportDate);
      if (!initiated) {
        await this.reportBot.sendMessage(chatId, `📊 <b>Kunlik hisobot eslatmasi!</b>\n\nBugungi hisobotingiz hali topshirilmagan!\n⏰ Deadline: soat 20:00\n\n/hisobot buyrug'i bilan topshiring.`);
      }
    }
  }

  @OnEvent(HrV2Events.VISITOR_CHECKED_IN)
  async onVisitorCheckedIn(payload: { visitorName: string; hostEmployeeId: number; badgeCode: string }) {
    const chatIdR = await this.repo.getEmployeeTelegramChatId(payload.hostEmployeeId);
    const chatId = chatIdR.ok ? chatIdR.data : null;
    if (chatId) {
      await this.sendMessage('notification', chatId, `👤 Mehmon keldi: <b>${payload.visitorName}</b>\nBetj: ${payload.badgeCode}`);
    }
  }

  @OnEvent(HrV2Events.SHIFT_REMINDER)
  async onShiftReminder(payload: { employeeId: number; shiftType: string; startTime: string; date: string }) {
    const chatIdR = await this.repo.getEmployeeTelegramChatId(payload.employeeId);
    const chatId = chatIdR.ok ? chatIdR.data : null;
    if (chatId) {
      await this.notificationBot.handleErpEvent({ event: 'shift.assigned', chatId, data: { date: payload.date, shiftType: payload.shiftType, startTime: payload.startTime } });
    }
  }

  @OnEvent(HrV2Events.DOCUMENT_SUBMITTED)
  async onDocumentSubmitted(payload: { documentId: number; documentTitle: string; approverId: number; submitterName: string }) {
    const chatIdR = await this.repo.getEmployeeTelegramChatId(payload.approverId);
    const chatId = chatIdR.ok ? chatIdR.data : null;
    if (chatId) {
      await this.notificationBot.handleErpEvent({ event: 'document.step.notify', chatId, data: { documentTitle: payload.documentTitle, submitterName: payload.submitterName } });
    }
  }

  @OnEvent(HrV2Events.DOCUMENT_APPROVED)
  async onDocumentApproved(payload: { documentId: number; documentTitle: string; employeeId: number; approverName: string }) {
    const chatIdR = await this.repo.getEmployeeTelegramChatId(payload.employeeId);
    const chatId = chatIdR.ok ? chatIdR.data : null;
    if (chatId) {
      await this.notificationBot.handleErpEvent({ event: 'document.approved', chatId, data: { documentTitle: payload.documentTitle, approverName: payload.approverName } });
    }
  }

  @OnEvent(HrV2Events.DOCUMENT_REJECTED)
  async onDocumentRejected(payload: { documentId: number; documentTitle: string; employeeId: number; rejectionReason: string }) {
    const chatIdR = await this.repo.getEmployeeTelegramChatId(payload.employeeId);
    const chatId = chatIdR.ok ? chatIdR.data : null;
    if (chatId) {
      await this.notificationBot.handleErpEvent({ event: 'document.rejected', chatId, data: { documentTitle: payload.documentTitle, rejectionReason: payload.rejectionReason } });
    }
  }

  async onInternalVacancyPublished(payload: { vacancyId: number; title: string; departmentName?: string; salaryMin?: number; salaryMax?: number }) {
    this.logger.log(`Internal vacancy published: #${payload.vacancyId} - ${payload.title}`);
    await this.broadcastToAll('hr', `🔔 Yangi ichki vakansiya: ${payload.title}${payload.departmentName ? ` (${payload.departmentName})` : ''}`);
  }
}
