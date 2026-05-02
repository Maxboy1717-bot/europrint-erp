import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from "../hr-v2-error";
import { OnEvent } from '@nestjs/event-emitter';
import { HrV2Events } from '../events/hr-v2-events';
import { RecruitmentBotService } from './recruitment-bot.service';
import { NotificationBotService } from './notification-bot.service';
import { TelegramBotsPipEventsRepository } from './telegram-bots-pip-events.repository';

@Injectable()
export class TelegramBotsPipEventsService {
  private readonly logger = new Logger(TelegramBotsPipEventsService.name);

  constructor(
    private readonly notificationBot: NotificationBotService,
    private readonly recruitmentBot: RecruitmentBotService,
    private readonly repo: TelegramBotsPipEventsRepository,
  ) {}

  private async notify(chatId: string, event: string, data: Record<string, unknown>) {
    return this.notificationBot.handleErpEvent({ event, chatId, data });
  }

  private async broadcastMsg(message: string) {
    const chatIds = await this.repo.getActiveChatIds();
    for (const chatId of (chatIds.ok ? chatIds.data : [])) {
      await this.notificationBot.sendMessage(chatId, message).catch((): void => undefined);
    }
  }

  @OnEvent(HrV2Events.PIP_STARTED)
  async onPipStarted(payload: { employeeId: number; durationDays: number; goalsCount: number }): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const chatId = await this.repo.getEmpChat(payload.employeeId);
      if (chatId.ok && chatId.data) await this.notify(chatId.data, 'pip.started', { durationDays: payload.durationDays, goalsCount: payload.goalsCount });
    });
  }

  @OnEvent(HrV2Events.PIP_PROGRESS_UPDATED)
  async onPipProgressUpdated(payload: { employeeId: number; pendingGoals: number; dueDate: string }) {
    const chatId = await this.repo.getEmpChat(payload.employeeId);
    if (chatId.ok && chatId.data) await this.notify(chatId.data, 'pip.progress.reminder', { pendingGoals: payload.pendingGoals, dueDate: payload.dueDate });
  }

  @OnEvent(HrV2Events.PIP_COMPLETED)
  async onPipCompleted(payload: { employeeId: number }) {
    const chatId = await this.repo.getEmpChat(payload.employeeId);
    if (chatId.ok && chatId.data) await this.notify(chatId.data, 'pip.completed', {});
  }

  @OnEvent(HrV2Events.PIP_FAILED)
  async onPipFailed(payload: { employeeId: number }) {
    const chatId = await this.repo.getEmpChat(payload.employeeId);
    if (chatId.ok && chatId.data) await this.notify(chatId.data, 'pip.failed', {});
  }

  @OnEvent(HrV2Events.DISCIPLINE_ISSUED)
  async onDisciplineIssued(payload: { employeeId: number; disciplineType: string; reason: string }) {
    const chatId = await this.repo.getEmpChat(payload.employeeId);
    if (chatId.ok && chatId.data) await this.notify(chatId.data, 'discipline.issued', { disciplineType: payload.disciplineType, reason: payload.reason });
  }

  @OnEvent(HrV2Events.GAMIFICATION_BADGE_AWARDED)
  async onBadgeAwarded(payload: { employeeId: number; badgeName: string; badgeDescription?: string }) {
    const chatId = await this.repo.getEmpChat(payload.employeeId);
    if (chatId.ok && chatId.data) await this.notify(chatId.data, 'gamification.badge.awarded', { badgeName: payload.badgeName, badgeDescription: payload.badgeDescription ?? '' });
  }

  @OnEvent(HrV2Events.GAMIFICATION_POINTS_AWARDED)
  async onPointsAwarded(payload: { employeeId: number; points: number; reason: string; totalPoints?: number }) {
    const chatId = await this.repo.getEmpChat(payload.employeeId);
    if (chatId.ok && chatId.data) await this.notify(chatId.data, 'gamification.points.awarded', { points: payload.points, reason: payload.reason, totalPoints: payload.totalPoints });
  }

  @OnEvent(HrV2Events.CANDIDATE_HIRED)
  async onCandidateHired(payload: { candidateId: number; startDate?: string }) {
    try {
      const chatId = await this.repo.getCandidateChat(payload.candidateId);
      if (chatId.ok && chatId.data) await this.notify(chatId.data, 'recruitment.candidate_hired', { startDate: payload.startDate ?? 'Kelishiladi' });
    } catch (err) {
      this.logger.warn(`onCandidateHired error: ${errMsg(err)}`);
    }
  }

  @OnEvent(HrV2Events.ATTENDANCE_LATE)
  async onAttendanceLate(payload: { employeeId: number; arrivalTime: string; lateMinutes: number; date: string }) {
    const chatId = await this.repo.getEmpChat(payload.employeeId);
    if (chatId.ok && chatId.data) await this.notify(chatId.data, 'attendance.late', { arrivalTime: payload.arrivalTime, lateMinutes: payload.lateMinutes, date: payload.date });
  }

  @OnEvent(HrV2Events.ADAPTATION_AT_RISK)
  async onAdaptationAtRisk(payload: { employeeId: number; riskLevel: string; reason?: string; adaptationDay?: number }) {
    const emp = await this.repo.getAdaptationAtRiskData(payload.employeeId);
    if (!emp.ok || !emp.data) return;
    const empData = emp.data as Record<string, unknown>;
    if (empData['telegram_chat_id']) {
      await this.notify(empData['telegram_chat_id'] as string, 'adaptation.at_risk', {
        employeeName: `${String(empData['first_name'])} ${String(empData['last_name'])}`,
        riskLevel: payload.riskLevel,
        reason: payload.reason ?? 'Adaptatsiya ko\'rsatkichlari past',
        adaptationDay: payload.adaptationDay,
      });
    }
    if (empData['manager_chat_id'] && empData['manager_chat_id'] !== empData['telegram_chat_id']) {
      await this.notificationBot.sendMessage(
        empData['manager_chat_id'] as string,
        `⚠️ <b>Xodim adaptatsiya xavfi</b>\n\n👤 ${String(empData['first_name'])} ${String(empData['last_name'])}\n🔴 Xavf: ${payload.riskLevel}\nSabab: ${payload.reason ?? 'Ko\'rsatkichlar past'}\n\nXodim bilan suhbatlashing.`,
      ).catch((): void => undefined);
    }
  }

  @OnEvent(HrV2Events.OFFBOARDING_STARTED)
  async onOffboardingStarted(payload: { employeeId: number; lastWorkingDay?: string }) {
    const chatId = await this.repo.getEmpChat(payload.employeeId);
    if (chatId.ok && chatId.data) await this.notify(chatId.data, 'offboarding.started', { lastWorkingDay: payload.lastWorkingDay ?? 'Belgilanmagan' });
  }

  @OnEvent(HrV2Events.VACANCY_PUBLISHED_INTERNAL)
  async onInternalVacancyPublished(payload: { vacancyId: number; title: string; departmentName?: string; salaryMin?: number; salaryMax?: number }) {
    try {
      const msg =
        `📢 <b>Ichki vakansiya!</b>\n\n🏷 Lavozim: ${payload.title}\n` +
        (payload.departmentName ? `🏢 Bo'lim: ${payload.departmentName}\n` : '') +
        (payload.salaryMin ? `💰 Maosh: ${payload.salaryMin.toLocaleString()} – ${(payload.salaryMax ?? payload.salaryMin).toLocaleString()} so'm\n` : '') +
        `\nQo'shimcha ma'lumot uchun HR bo'limiga murojaat qiling. erp.europrint.uz`;
      await this.broadcastMsg(msg);
      this.logger.log(`Internal vacancy broadcast sent: ${payload.title} (#${payload.vacancyId})`);
    } catch (err) {
      this.logger.warn(`Internal vacancy broadcast failed: ${errMsg(err)}`);
    }
  }

  @OnEvent(HrV2Events.AI_INTERVIEW_COMPLETED)
  async onAiInterviewCompleted(payload: { sessionId: number; recommendation?: string }) {
    try {
      const session = await this.repo.getInterviewSession(payload.sessionId);
      if (!session.ok || !session.data) return;
      const sessionData = session.data as Record<string, unknown>;

      const scoreStr = sessionData['overall_score'] ? `${sessionData['overall_score']}/100` : 'N/A';
      const recStr = sessionData['recommendation'] === 'HIRE' ? '✅ Qabul qilish tavsiya etiladi'
        : sessionData['recommendation'] === 'REJECT' ? '❌ Qabul qilmaslik tavsiya etiladi'
        : '⚠️ Qo\'shimcha ko\'rib chiqish kerak';
      const message = `🎤 *AI Intervyu Yakunlandi*\n\n👤 Nomzod: ${sessionData['candidate_name']}\n📊 Umumiy ball: ${scoreStr}\n${recStr}\n` + (sessionData['ai_summary'] ? `\n💬 ${sessionData['ai_summary']}` : '');

      if (sessionData['recruiter_chat_id']) {
        await this.recruitmentBot.sendMessage(sessionData['recruiter_chat_id'] as string, message);
      }
    } catch (err) {
      this.logger.warn(`onAiInterviewCompleted notification error: ${errMsg(err)}`);
    }
  }

  @OnEvent(HrV2Events.AI_INTERVIEW_CANCELLED)
  async onAiInterviewCancelled(payload: { sessionId: number; reason: string }) {
    try {
      const session = await this.repo.getInterviewSessionBasic(payload.sessionId);
      if (!session.ok || !session.data) return;
      const sessionData = session.data as Record<string, unknown>;
      if (!sessionData['recruiter_chat_id']) return;
      const reasonMap: Record<string, string> = { camera_rejected_3_times: 'Kamera 3 marta rad etildi' };
      const reasonText = reasonMap[payload.reason] || payload.reason;
      const message = `🚫 *AI Intervyu Bekor Qilindi*\n\n👤 Nomzod: ${sessionData['candidate_name']}\n❗ Sabab: ${reasonText}\n\nHR bilan bog'laning yoki yangi intervyu rejalashtiring.`;
      await this.recruitmentBot.sendMessage(sessionData['recruiter_chat_id'] as string, message);
    } catch (err) {
      this.logger.warn(`onAiInterviewCancelled notification error: ${errMsg(err)}`);
    }
  }
}
