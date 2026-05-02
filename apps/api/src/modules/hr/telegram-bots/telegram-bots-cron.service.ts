import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { errMsg } from "../hr-v2-error";
import { safeCall, Result, AppError } from '@common/result';
import { Cron } from '@nestjs/schedule';
import { NotificationBotService } from './notification-bot.service';
import { TelegramBotsRepository } from './telegram-bots.repository';
import { AttendanceBotService } from './attendance-bot.service';
import { LearningBotService } from './learning-bot.service';
import { BoomerangEmbeddingService } from './boomerang-embedding.service';
import { NOTIFICATION_TEMPLATES, renderTemplate } from './notification-templates';

interface IncidentPayload {
  severity: string;
  type: 'FIRE' | 'MEDICAL' | string;
  location: string;
  description?: string;
  responsiblePerson?: string;
  incidentTime?: string;
}

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
export class TelegramBotsCronService {
  private readonly logger = new Logger(TelegramBotsCronService.name);

  constructor(
    private readonly notificationBot: NotificationBotService,
    private readonly repo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly attendanceBot: AttendanceBotService,
    private readonly learningBot: LearningBotService,
    private readonly boomerangEmbedding: BoomerangEmbeddingService,
  ) {}

  @Cron('30 7 * * *')
  async sendBirthdayAndAnniversaryNotifications(): Promise<Result<void, AppError>> {
    const r = await safeCall(async () => {
      const birthdayRows = await this.repo.getBirthdayEmployeesToday();
      if (birthdayRows.ok && birthdayRows.data.length > 0) {
        for (const emp of birthdayRows.data) {
          if (!emp.id) continue;
          await this.notificationBot.sendNotification({
            userId: emp.id as number,
            templateKey: 'BIRTHDAY_SELF',
            params: { name: `${String(emp.first_name)} ${String(emp.last_name)}` },
          });
        }
        const nameList = birthdayRows.data.map(e =>
          `• ${String(e.first_name)} ${String(e.last_name)} (${String(e.department_name ?? 'Bo\'lim ko\'rsatilmagan')})`,
        ).join('\n');
        await this.notificationBot.broadcastTemplate('BIRTHDAY_TEAM', { name: nameList, department: '' });
        const hrGroupId = this.cfg.get<string>('TELEGRAM_HR_GROUP_ID');
        if (hrGroupId) {
          await this.notificationBot.sendNotificationRaw(hrGroupId, `🎂 Bugungi tug'ilgan kunlar:\n${nameList}`);
        }
      }

      const anniversaryRows = await this.repo.getWorkAnniversaryEmployeesToday();
      if (anniversaryRows.ok) {
        for (const emp of anniversaryRows.data) {
          if (!emp.id) continue;
          await this.notificationBot.sendNotification({
            userId: emp.id as number,
            templateKey: 'WORK_ANNIVERSARY',
            params: {
              name: `${String(emp.first_name)} ${String(emp.last_name)}`,
              years: String(emp.years_worked ?? ''),
            },
          });
        }
      }

      this.logger.log(
        `07:30 cron — Birthday self+team: ${birthdayRows.ok ? birthdayRows.data.length : 0}, anniversaries: ${anniversaryRows.ok ? anniversaryRows.data.length : 0}`,
      );
    });
    if (!r.ok) this.logger.error('Birthday/anniversary cron error', r.error.message);
    return r;
  }

  @Cron('0 9 * * *')
  async sendProbationAndContractReminders(): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const probationRows = await this.repo.getExpiringProbations();
      if (probationRows.ok) {
        for (const emp of probationRows.data) {
          if (!emp.id) continue;
          const daysLeft = emp.days_left as number;
          let templateKey: 'PROBATION_1DAY' | 'PROBATION_3DAYS' | 'PROBATION_7DAYS';
          if (daysLeft <= 1) templateKey = 'PROBATION_1DAY';
          else if (daysLeft <= 3) templateKey = 'PROBATION_3DAYS';
          else templateKey = 'PROBATION_7DAYS';
          await this.notificationBot.sendNotification({
            userId: emp.id as number,
            templateKey,
            params: {
              name: `${String(emp.first_name)} ${String(emp.last_name)}`,
              probation_end_date: String(emp.probation_end_date ?? ''),
              meeting_date: String(emp.meeting_date ?? 'Belgilanmagan'),
            },
          });
        }
      }

      const contractRows = await this.repo.getExpiringContracts();
      if (contractRows.ok) {
        for (const emp of contractRows.data) {
          if (!emp.id) continue;
          await this.notificationBot.sendNotification({
            userId: emp.id as number,
            templateKey: 'CONTRACT_EXPIRING',
            params: {
              name: `${String(emp.first_name)} ${String(emp.last_name)}`,
              expiry_date: String(emp.contract_end_date ?? ''),
              hr_phone: this.cfg.get<string>('HR_PHONE') ?? '+998900000000',
            },
          });
        }
      }

      this.logger.log(
        `Probation reminders: ${probationRows.ok ? probationRows.data.length : 0}, contract reminders: ${contractRows.ok ? contractRows.data.length : 0}`,
      );
    });
  }

  @Cron('30 9 * * *')
  async sendMorningAttendanceCheck(): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const unrecognizedR = await this.repo.getUnrecognizedByCameraToday();
      const unrecognized = unrecognizedR.ok ? unrecognizedR.data : [];
      for (const emp of unrecognized) {
        if (!emp.telegram_chat_id) continue;
        await this.attendanceBot.sendMorningCheckQuery(emp.telegram_chat_id as string);
      }
      if (unrecognized.length > 0) this.logger.log(`Morning attendance check sent to ${unrecognized.length} employees`);
    });
  }

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

  @Cron('0 11 * * 1-6')
  async sendAbsenceDay1Reminders(): Promise<void> {
    try {
      const rows = await this.repo.getAbsentEmployees(1);
      const today = new Date().toLocaleDateString('uz');
      for (const emp of (rows.ok ? rows.data : [])) {
        if (!emp.id) continue;
        if (emp.telegram_chat_id) {
          await this.attendanceBot.sendAbsenceDay1(emp.telegram_chat_id as string, today);
        }
        await this.notificationBot.sendNotification({
          userId: emp.id as number,
          templateKey: 'ABSENCE_DAY1',
          params: {
            name: `${String(emp.first_name)} ${String(emp.last_name)}`,
            date: today,
            hr_phone: this.cfg.get<string>('HR_PHONE') ?? '+998900000000',
          },
        });
      }
      if ((rows.ok ? rows.data.length : 0) > 0) {
        this.logger.log(`Absence Day-1 reminders sent: ${rows.ok ? rows.data.length : 0}`);
      }
    } catch (err) {
      this.logger.error(`sendAbsenceDay1Reminders error: ${errMsg(err)}`);
    }
  }

  @Cron('0 11 * * 1-6')
  async sendAbsenceDay2Warnings(): Promise<void> {
    try {
      const rows = await this.repo.getAbsentEmployees(2);
      const hrPhone = this.cfg.get<string>('HR_PHONE') ?? '+998900000000';
      for (const emp of (rows.ok ? rows.data : [])) {
        if (!emp.id) continue;
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('uz');
        const today = new Date().toLocaleDateString('uz');
        await this.notificationBot.sendNotification({
          userId: emp.id as number,
          templateKey: 'ABSENCE_DAY2',
          params: {
            name: `${String(emp.first_name)} ${String(emp.last_name)}`,
            date1: yesterday,
            date2: today,
            hr_phone: hrPhone,
            url: 'https://erp.europrint.uz',
          },
        });
        await this.attendanceBot.sendAbsenceDay2(emp.telegram_chat_id as string, hrPhone);
      }
      if ((rows.ok ? rows.data.length : 0) > 0) {
        this.logger.log(`Absence Day-2 warnings sent: ${rows.ok ? rows.data.length : 0}`);
      }
    } catch (err) {
      this.logger.error(`sendAbsenceDay2Warnings error: ${errMsg(err)}`);
    }
  }

  @Cron('59 23 * * *')
  async autoBlockOffboardedEmployees() {
    try {
      const rowsR = await this.repo.getOffboardingDueEmployees();
      const rows = (rowsR.ok ? rowsR.data as { employee_id: number; case_id: number; full_name?: string }[] : []);
      for (const emp of rows) {
        await this.repo.terminateEmployee(emp.employee_id as number);
        await this.repo.completeOffboardingCase(emp.case_id as number);
        await this.repo.insertTerminationBlock(emp.employee_id as number);
        const hrGroupId = this.cfg.get<string>('TELEGRAM_HR_GROUP_ID');
        if (hrGroupId) {
          await this.notificationBot.sendNotificationRaw(hrGroupId, `🔒 <b>${String(emp.full_name)}</b> — oxirgi ish kuni tugadi.\nERP kirishi avtomatik bloklandi.`);
        }
        this.logger.log(`Auto-blocked employee #${emp.employee_id as number} (${String(emp.full_name)})`);
      }
      if (rows.length > 0) this.logger.log(`Offboarding auto-block: ${rows.length} employee(s) processed`);
    } catch (err) {
      this.logger.error('Offboarding auto-block error', err instanceof Error ? errMsg(err) : String(err));
    }
  }

  @Cron('0 2 * * *')
  async archiveInactiveCandidates() {
    try {
      const archivedFunnels = await this.repo.archiveInactiveFunnels();
      const archivedCandidates = await this.repo.archiveInactiveCandidates();
      if ((archivedFunnels.ok ? archivedFunnels.data : 0) > 0 || (archivedCandidates.ok ? archivedCandidates.data : 0) > 0) {
        this.logger.log(`Archival cron: ${archivedFunnels} funnel(s), ${archivedCandidates} candidate(s) archived`);
      }
    } catch (err) {
      this.logger.error('Candidate archival cron error', err instanceof Error ? errMsg(err) : String(err));
    }
  }

  @Cron('0 8 25 * *')
  async sendPayrollNotification() {
    try {
      const rowsR2 = await this.repo.getActiveEmployeesWithChatId();
      const rows = (rowsR2.ok ? rowsR2.data as { telegram_chat_id: string }[] : []);
      for (const emp of rows) {
        await this.notificationBot.sendNotificationRaw(emp.telegram_chat_id as string, `💰 Maosh hisoblash:\nShu oyning ish haqi hisoblanmoqda. 3 ish kuni ichida to'lov amalga oshiriladi.\nerp.europrint.uz orqali tekshiring.`);
      }
    } catch (err) {
      this.logger.error('Payroll notification error', err instanceof Error ? errMsg(err) : String(err));
    }
  }

  @Cron('0 10 * * 1-6')
  async checkAdaptationRisks() {
    try {
      const rowsR3 = await this.repo.getAdaptationRisks();
      const rows = (rowsR3.ok ? rowsR3.data as Record<string, unknown>[] : []);
      for (const row of rows) {
        if (row.telegram_chat_id) {
          await this.notificationBot.handleErpEvent({ event: 'adaptation.at_risk', chatId: row.telegram_chat_id as string, data: { employeeName: row.employee_name, adaptationDay: row.adaptation_day, riskLevel: row.risk_level, reason: row.risk_reason ?? 'Adaptatsiya ko\'rsatkichlari past' } });
        }
        if (row.manager_chat_id && row.manager_chat_id !== row.telegram_chat_id) {
          await this.notificationBot.sendNotificationRaw(row.manager_chat_id as string, `⚠️ <b>Xodim adaptatsiya xavfi</b>\n\n👤 Xodim: ${String(row.employee_name)}\n📅 Adaptatsiya kuni: ${String(row.adaptation_day ?? '')}\n🔴 Xavf darajasi: ${String(row.risk_level)}\n\nIltimos, xodim bilan suhbatlashing.`);
        }
        await this.repo.markAdaptationNotified(row.employee_id as number);
      }
      if (rows.length > 0) this.logger.log(`Adaptation risk notifications: ${rows.length} cases`);
    } catch (err) {
      this.logger.warn(`checkAdaptationRisks error: ${errMsg(err)}`);
    }
  }

  @Cron('0 9 * * 1,3,5')
  async sendPipProgressReminders() {
    try {
      const rowsR4 = await this.repo.getActivePipWithPendingGoals();
      const rows = (rowsR4.ok ? rowsR4.data as Record<string, unknown>[] : []);
      for (const row of rows) {
        await this.notificationBot.handleErpEvent({ event: 'pip.progress.reminder', chatId: row.telegram_chat_id as string, data: { pendingGoals: row.pending_goals, dueDate: row.due_date } });
      }
      if (rows.length > 0) this.logger.log(`PIP reminders sent: ${rows.length}`);
    } catch (err) {
      this.logger.warn(`sendPipProgressReminders error: ${errMsg(err)}`);
    }
  }

  @OnEvent('incident.created')
  async onIncidentCreated(payload: IncidentPayload): Promise<void> {
    try {
      if (payload.severity !== 'CRITICAL') return;

      const tplKey = payload.type === 'FIRE' ? 'EMERGENCY_FIRE' : 'EMERGENCY_MEDICAL';
      const tpl = NOTIFICATION_TEMPLATES[tplKey];
      const incidentTime = payload.incidentTime ?? new Date().toLocaleString('uz');
      const message = renderTemplate(tpl.template_uz, {
        location: payload.location ?? 'Noma\'lum joy',
        incident_time: incidentTime,
        description: payload.description ?? '',
        responsible_person: payload.responsiblePerson ?? 'HR bo\'limi',
        url: 'https://erp.europrint.uz',
      });

      const recipientsR = await this.repo.getEmergencyRecipients();
      const recipients = recipientsR.ok ? recipientsR.data : [];
      let sentCount = 0;
      for (const rec of recipients) {
        if (rec.telegram_chat_id) {
          await this.notificationBot.sendNotificationRaw(rec.telegram_chat_id as string, message);
          sentCount++;
        }
        if (rec.phone) {
          await this.sendSms(rec.phone as string, this.stripHtml(message));
        }
      }
      this.logger.warn(`Emergency notification sent: type=${payload.type}, recipients=${sentCount}`);
    } catch (err) {
      this.logger.error(`onIncidentCreated error: ${errMsg(err)}`);
    }
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
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('uz');

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
