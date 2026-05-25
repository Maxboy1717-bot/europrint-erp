/**
 * @module telegram-bots-cron-life.helpers
 * @description Life-event cron job bodies (birthdays, anniversaries, probation, contracts, payroll, incidents).
 * Extracted from telegram-bots-cron.helpers.ts to keep each file under 300 lines (Rule 16).
 */

import type { Logger } from '@nestjs/common';
import { errMsg } from '../hr-v2-error';
import { Result, AppError, safeCall } from '@common/result';
import { NOTIFICATION_TEMPLATES, renderTemplate } from './notification-templates';
import type { CronDeps, IncidentPayload } from './telegram-bots-cron.types';

export async function runBirthdayAndAnniversary(d: CronDeps): Promise<Result<void, AppError>> {
  const logger = d.logger as Logger;
  const r = await safeCall(async () => {
    const birthdayRows = await d.repo.getBirthdayEmployeesToday();
    if (birthdayRows.ok && birthdayRows.data.length > 0) {
      for (const emp of birthdayRows.data) {
        if (!emp.id) continue;
        await d.notif.sendNotification({
          userId: emp.id as number,
          templateKey: 'BIRTHDAY_SELF',
          params: { name: `${String(emp.first_name)} ${String(emp.last_name)}` },
        });
      }
      const nameList = birthdayRows.data.map(e =>
        `• ${String(e.first_name)} ${String(e.last_name)} (${String(e.department_name ?? 'Bo\'lim ko\'rsatilmagan')})`,
      ).join('\n');
      await d.notif.broadcastTemplate('BIRTHDAY_TEAM', { name: nameList, department: '' });
      const hrGroupId = d.cfg.get<string>('TELEGRAM_HR_GROUP_ID');
      if (hrGroupId) {
        await d.notif.sendNotificationRaw(hrGroupId, `🎂 Bugungi tug'ilgan kunlar:\n${nameList}`);
      }
    }

    const anniversaryRows = await d.repo.getWorkAnniversaryEmployeesToday();
    if (anniversaryRows.ok) {
      for (const emp of anniversaryRows.data) {
        if (!emp.id) continue;
        await d.notif.sendNotification({
          userId: emp.id as number,
          templateKey: 'WORK_ANNIVERSARY',
          params: {
            name: `${String(emp.first_name)} ${String(emp.last_name)}`,
            years: String(emp.years_worked ?? ''),
          },
        });
      }
    }

    logger.log(
      `07:30 cron — Birthday self+team: ${birthdayRows.ok ? birthdayRows.data.length : 0}, anniversaries: ${anniversaryRows.ok ? anniversaryRows.data.length : 0}`,
    );
  });
  if (!r.ok) logger.error('Birthday/anniversary cron error', r.error.message);
  return r;
}

export async function runProbationAndContractReminders(d: CronDeps): Promise<Result<void, AppError>> {
  return safeCall(async () => {
    const logger = d.logger as Logger;
    const probationRows = await d.repo.getExpiringProbations();
    if (probationRows.ok) {
      for (const emp of probationRows.data) {
        if (!emp.id) continue;
        const daysLeft = emp.days_left as number;
        let templateKey: 'PROBATION_1DAY' | 'PROBATION_3DAYS' | 'PROBATION_7DAYS';
        if (daysLeft <= 1) templateKey = 'PROBATION_1DAY';
        else if (daysLeft <= 3) templateKey = 'PROBATION_3DAYS';
        else templateKey = 'PROBATION_7DAYS';
        await d.notif.sendNotification({
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

    const contractRows = await d.repo.getExpiringContracts();
    if (contractRows.ok) {
      for (const emp of contractRows.data) {
        if (!emp.id) continue;
        await d.notif.sendNotification({
          userId: emp.id as number,
          templateKey: 'CONTRACT_EXPIRING',
          params: {
            name: `${String(emp.first_name)} ${String(emp.last_name)}`,
            expiry_date: String(emp.contract_end_date ?? ''),
            hr_phone: d.cfg.get<string>('HR_PHONE') ?? '+998900000000',
          },
        });
      }
    }

    logger.log(
      `Probation reminders: ${probationRows.ok ? probationRows.data.length : 0}, contract reminders: ${contractRows.ok ? contractRows.data.length : 0}`,
    );
  });
}

export async function runPayrollNotification(d: CronDeps): Promise<void> {
  const logger = d.logger as Logger;
  try {
    const rowsR2 = await d.repo.getActiveEmployeesWithChatId();
    const rows = (rowsR2.ok ? rowsR2.data as { telegram_chat_id: string }[] : []);
    for (const emp of rows) {
      await d.notif.sendNotificationRaw(emp.telegram_chat_id as string, `💰 Maosh hisoblash:\nShu oyning ish haqi hisoblanmoqda. 3 ish kuni ichida to'lov amalga oshiriladi.\nerp.europrint.uz orqali tekshiring.`);
    }
  } catch (err) {
    logger.error('Payroll notification error', err instanceof Error ? errMsg(err) : String(err));
  }
}

export async function runIncidentEvent(
  d: CronDeps,
  payload: IncidentPayload,
  sendSms: (phone: string, msg: string) => Promise<void>,
  stripHtml: (html: string) => string,
): Promise<void> {
  const logger = d.logger as Logger;
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
    const recipientsR = await d.repo.getEmergencyRecipients();
    const recipients = recipientsR.ok ? recipientsR.data : [];
    let sentCount = 0;
    for (const rec of recipients) {
      if (rec.telegram_chat_id) {
        await d.notif.sendNotificationRaw(rec.telegram_chat_id as string, message);
        sentCount++;
      }
      if (rec.phone) {
        await sendSms(rec.phone as string, stripHtml(message));
      }
    }
    logger.warn(`Emergency notification sent: type=${payload.type}, recipients=${sentCount}`);
  } catch (err) {
    logger.error(`onIncidentCreated error: ${errMsg(err)}`);
  }
}

export async function runManagerDailySummary(d: CronDeps): Promise<void> {
  const logger = d.logger as Logger;
  try {
    const managersR = await d.repo.getActiveEmployeesWithChatId();
    if (!managersR.ok) return;
    const allActive = managersR.data as { id: number; telegram_chat_id: string }[];

    for (const mgr of allActive) {
      const managerR = await d.repo.getManagerByChatId(Number(mgr.telegram_chat_id));
      if (!managerR.ok || !managerR.data) continue;
      const manager = managerR.data;
      if (!manager['department_id']) continue;

      const summaryR = await d.repo.getDailyReportStatusForManager(mgr.id);
      if (!summaryR.ok) continue;
      const s = summaryR.data as { total: number; submitted: number; missing: number };
      if (Number(s.missing) === 0) continue;

      const message = renderTemplate(NOTIFICATION_TEMPLATES.MANAGER_DAILY_SUMMARY.template_uz, {
        department: String(manager['department_name'] ?? 'Bo\'lim'),
        total:      String(s.total     ?? 0),
        submitted:  String(s.submitted ?? 0),
        missing:    String(s.missing   ?? 0),
        url: 'https://erp.europrint.uz/daily-reports',
      });
      await d.notif.sendNotificationRaw(mgr.telegram_chat_id, message);
    }
  } catch (err) {
    logger.warn(`sendManagerDailySummary error: ${errMsg(err)}`);
  }
}
