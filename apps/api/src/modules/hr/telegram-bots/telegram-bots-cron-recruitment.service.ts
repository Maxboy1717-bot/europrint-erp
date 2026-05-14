/**
 * @module telegram-bots-cron-recruitment.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { errMsg } from "../hr-v2-error";
import { safeCall, Result, AppError } from '@common/result';
import { SEVEN_DAYS_MS } from '@common/constants/business.constants';
import { Cron } from '@nestjs/schedule';
import { NotificationBotService } from './notification-bot.service';
import { TelegramBotsRepository } from './telegram-bots.repository';
import { BoomerangEmbeddingService } from './boomerang-embedding.service';
import { NOTIFICATION_TEMPLATES, renderTemplate } from './notification-templates';

interface VacancyPublishedPayload {
  vacancyId: number;
  title: string;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  url?: string;
  requiredSkills?: string;
  tags?: string;
}

@Injectable()
export class TelegramBotsCronRecruitmentService {
  private readonly logger = new Logger(TelegramBotsCronRecruitmentService.name);

  constructor(
    private readonly notificationBot: NotificationBotService,
    private readonly repo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly boomerangEmbedding: BoomerangEmbeddingService,
  ) {}

  @Cron('0 9 * * *')
  async sendMandatoryCourseDeadlineReminders(): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const coursesR = await this.repo.getCoursesDeadlineIn3Days();
      const courses = coursesR.ok ? coursesR.data : [];
      for (const c of courses) {
        if (!c.employee_id) continue;
        const daysLeft = Number(c.days_left ?? 3);
        const url = String(c.course_url ?? 'https://erp.europrint.uz');
        const deadline = String(c.deadline ?? '');
        const progress = String(c.progress ?? 0);
        await this.notificationBot.sendNotification({
          userId: c.employee_id as number,
          templateKey: 'TRAINING_DEADLINE',
          params: {
            name: String(c.first_name ?? '') + (c.last_name ? ` ${String(c.last_name)}` : ''),
            course_title: String(c.course_title ?? ''),
            days_left: String(daysLeft),
            deadline,
            progress,
            url,
          },
        });
      }
      if (courses.length > 0) this.logger.log(`Course deadline reminders sent: ${courses.length}`);
    });
  }

  private buildVacancyKeywords(payload: VacancyPublishedPayload): string[] {
    const raw = [
      payload.title,
      payload.department ?? '',
      payload.requiredSkills ?? '',
      payload.tags ?? '',
    ].join(' ').toLowerCase();
    return raw.split(/[\s,;/|]+/).map(k => k.trim()).filter(k => k.length >= 3);
  }

  private candidateMatchesVacancy(candidate: Record<string, unknown>, vacancyKeywords: string[]): boolean {
    if (!vacancyKeywords.length) return true;
    const candidateText = [
      String(candidate['position_hint'] ?? ''),
      String(candidate['department_hint'] ?? ''),
      String(candidate['skills_hint'] ?? ''),
    ].join(' ').toLowerCase();

    const departmentMatch = (candidate['department_hint'] as string ?? '').toLowerCase() !== '' &&
      (candidate['department_hint'] as string).toLowerCase() ===
        (vacancyKeywords.find(k => k.length > 3) ?? '');

    const keywordMatches = vacancyKeywords.filter(k => candidateText.includes(k)).length;
    return departmentMatch || keywordMatches >= Math.max(1, Math.floor(vacancyKeywords.length * 0.25));
  }

  @OnEvent('vacancy.published')
  async onVacancyPublished(payload: VacancyPublishedPayload): Promise<void> {
    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const candidatesR = await this.repo.getBoomerangCandidates(twoYearsAgo.toISOString());
      const allCandidates = candidatesR.ok ? candidatesR.data : [];

      const ranked = await this.boomerangEmbedding.rankCandidates(allCandidates, {
        title: payload.title,
        department: payload.department,
        requiredSkills: payload.requiredSkills,
        tags: payload.tags,
      });

      const keywords = this.buildVacancyKeywords(payload);
      const matchedCandidates = ranked.length > 0
        ? ranked.map(r => r.candidate)
        : allCandidates.filter(c => this.candidateMatchesVacancy(c, keywords));

      const salary = payload.salaryMin && payload.salaryMax
        ? `${payload.salaryMin.toLocaleString()} – ${payload.salaryMax.toLocaleString()} so'm`
        : 'Kelishiladi';
      const vacancyUrl = payload.url ?? `https://erp.europrint.uz/vacancies/${payload.vacancyId}`;
      const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS).toLocaleDateString('uz');

      let sent = 0;
      for (const candidate of matchedCandidates) {
        const message = renderTemplate(NOTIFICATION_TEMPLATES.BOOMERANG_OFFER.template_uz, {
          name: String(candidate['name'] ?? 'Hurmatli nomzod'),
          vacancy_title: payload.title,
          department: payload.department ?? '',
          salary,
          url: vacancyUrl,
          expires_at: expiresAt,
        });
        if (candidate['telegram_chat_id']) {
          await this.notificationBot.sendNotificationRaw(candidate['telegram_chat_id'] as string, message);
          sent++;
        }
        if (candidate['phone']) {
          await this.sendSms(candidate['phone'] as string, this.stripHtml(message));
        }
      }
      this.logger.log(
        `Boomerang offers: ${sent}/${allCandidates.length} embedding-ranked candidates notified for vacancy #${payload.vacancyId}`,
      );
    } catch (err) {
      this.logger.warn(`onVacancyPublished (boomerang) error: ${errMsg(err)}`);
    }
  }

  // ── Recruiter: new candidate applied ────────────────────────────────────
  @OnEvent('candidate.applied')
  async onCandidateApplied(payload: {
    candidateName: string;
    vacancyTitle: string;
    source: string;
    appliedAt: string;
    funnelId: number;
  }): Promise<void> {
    try {
      const recruitersR = await this.repo.getRecruiterChatIds();
      const recruiters = recruitersR.ok ? recruitersR.data : [];
      const url = `https://erp.europrint.uz/candidates/${payload.funnelId}`;
      const message = renderTemplate(NOTIFICATION_TEMPLATES.CANDIDATE_APPLIED.template_uz, {
        candidate_name: payload.candidateName,
        vacancy_title:  payload.vacancyTitle,
        source:         payload.source,
        applied_at:     payload.appliedAt,
        url,
      });
      for (const chatId of recruiters) {
        await this.notificationBot.sendNotificationRaw(chatId, message);
      }
      this.logger.log(`Recruiter notification sent: candidate.applied — ${payload.candidateName}`);
    } catch (err) {
      this.logger.warn(`onCandidateApplied error: ${errMsg(err)}`);
    }
  }

  // ── Recruiter: candidate stage changed ──────────────────────────────────
  @OnEvent('candidate.stage_changed')
  async onCandidateStageChanged(payload: {
    candidateName: string;
    vacancyTitle: string;
    prevStage: string;
    newStage: string;
    funnelId: number;
    recruiterChatId?: string;
  }): Promise<void> {
    try {
      const url = `https://erp.europrint.uz/candidates/${payload.funnelId}`;
      const message = renderTemplate(NOTIFICATION_TEMPLATES.CANDIDATE_STAGE_CHANGED.template_uz, {
        candidate_name: payload.candidateName,
        vacancy_title:  payload.vacancyTitle,
        prev_stage:     payload.prevStage,
        new_stage:      payload.newStage,
        url,
      });
      const targets = payload.recruiterChatId
        ? [payload.recruiterChatId]
        : (await this.repo.getRecruiterChatIds()).ok
          ? (await this.repo.getRecruiterChatIds()).data ?? []
          : [];
      for (const chatId of targets) {
        await this.notificationBot.sendNotificationRaw(chatId, message);
      }
    } catch (err) {
      this.logger.warn(`onCandidateStageChanged error: ${errMsg(err)}`);
    }
  }

  // ── Recruiter: 48-hour interview decision deadline (hourly check) ────────
  @Cron('0 * * * *')
  async checkInterviewDecisionDeadlines(): Promise<void> {
    try {
      const pendingR = await this.repo.getInterviewsPendingDecision();
      const pending = pendingR.ok ? pendingR.data : [];
      for (const row of pending) {
        if (!row['recruiter_chat_id']) continue;
        const message = renderTemplate(NOTIFICATION_TEMPLATES.CANDIDATE_INTERVIEW_48H.template_uz, {
          candidate_name: String(row['candidate_name'] ?? '—'),
          vacancy_title:  String(row['vacancy_title']  ?? '—'),
          interview_date: String(row['interview_date'] ?? '—'),
          deadline:       String(row['deadline']       ?? '—'),
          url: `https://erp.europrint.uz/candidates/${String(row['id'] ?? '')}`,
        });
        await this.notificationBot.sendNotificationRaw(row['recruiter_chat_id'] as string, message);
      }
      if (pending.length > 0) {
        this.logger.log(`48h interview deadline reminders: ${pending.length}`);
      }
    } catch (err) {
      this.logger.warn(`checkInterviewDecisionDeadlines error: ${errMsg(err)}`);
    }
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
