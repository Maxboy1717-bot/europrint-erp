/**
 * @module telegram-bots-cron.helpers
 * @description Attendance + offboarding + adaptation + PIP cron bodies.
 * Life-event cron bodies live in telegram-bots-cron-life.helpers.ts.
 * Shared types live in telegram-bots-cron.types.ts.
 * (Rule 16: each file <300 lines.)
 */

import type { Logger } from '@nestjs/common';
import { errMsg } from '../hr-v2-error';
import { Result, AppError, safeCall } from '@common/result';
import type { CronDeps } from './telegram-bots-cron.types';

export type { IncidentPayload, CronDeps } from './telegram-bots-cron.types';

export {
  runBirthdayAndAnniversary,
  runProbationAndContractReminders,
  runPayrollNotification,
  runIncidentEvent,
  runManagerDailySummary,
} from './telegram-bots-cron-life.helpers';

export async function runMorningAttendanceCheck(d: CronDeps): Promise<Result<void, AppError>> {
  return safeCall(async () => {
    const logger = d.logger as Logger;
    const unrecognizedR = await d.repo.getUnrecognizedByCameraToday();
    const unrecognized = unrecognizedR.ok ? unrecognizedR.data : [];
    for (const emp of unrecognized) {
      if (!emp.telegram_chat_id) continue;
      await d.attendance.sendMorningCheckQuery(emp.telegram_chat_id as string);
    }
    if (unrecognized.length > 0) logger.log(`Morning attendance check sent to ${unrecognized.length} employees`);
  });
}

export async function runAbsenceDay1Reminders(d: CronDeps): Promise<void> {
  const logger = d.logger as Logger;
  try {
    const rows = await d.repo.getAbsentEmployees(1);
    const today = new Date().toLocaleDateString('uz');
    for (const emp of (rows.ok ? rows.data : [])) {
      if (!emp.id) continue;
      if (emp.telegram_chat_id) {
        await d.attendance.sendAbsenceDay1(emp.telegram_chat_id as string, today);
      }
      await d.notif.sendNotification({
        userId: emp.id as number,
        templateKey: 'ABSENCE_DAY1',
        params: {
          name: `${String(emp.first_name)} ${String(emp.last_name)}`,
          date: today,
          hr_phone: d.cfg.get<string>('HR_PHONE') ?? '+998900000000',
        },
      });
    }
    if ((rows.ok ? rows.data.length : 0) > 0) {
      logger.log(`Absence Day-1 reminders sent: ${rows.ok ? rows.data.length : 0}`);
    }
  } catch (err) {
    logger.error(`sendAbsenceDay1Reminders error: ${errMsg(err)}`);
  }
}

export async function runAbsenceDay2Warnings(d: CronDeps): Promise<void> {
  const logger = d.logger as Logger;
  try {
    const rows = await d.repo.getAbsentEmployees(2);
    const hrPhone = d.cfg.get<string>('HR_PHONE') ?? '+998900000000';
    for (const emp of (rows.ok ? rows.data : [])) {
      if (!emp.id) continue;
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('uz');
      const today = new Date().toLocaleDateString('uz');
      await d.notif.sendNotification({
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
      await d.attendance.sendAbsenceDay2(emp.telegram_chat_id as string, hrPhone);
    }
    if ((rows.ok ? rows.data.length : 0) > 0) {
      logger.log(`Absence Day-2 warnings sent: ${rows.ok ? rows.data.length : 0}`);
    }
  } catch (err) {
    logger.error(`sendAbsenceDay2Warnings error: ${errMsg(err)}`);
  }
}

export async function runAutoBlockOffboarded(d: CronDeps): Promise<void> {
  const logger = d.logger as Logger;
  try {
    const rowsR = await d.repo.getOffboardingDueEmployees();
    const rows = (rowsR.ok ? rowsR.data as { employee_id: number; case_id: number; full_name?: string }[] : []);
    for (const emp of rows) {
      await d.repo.terminateEmployee(emp.employee_id as number);
      await d.repo.completeOffboardingCase(emp.case_id as number);
      await d.repo.insertTerminationBlock(emp.employee_id as number);
      const hrGroupId = d.cfg.get<string>('TELEGRAM_HR_GROUP_ID');
      if (hrGroupId) {
        await d.notif.sendNotificationRaw(hrGroupId, `🔒 <b>${String(emp.full_name)}</b> — oxirgi ish kuni tugadi.\nERP kirishi avtomatik bloklandi.`);
      }
      logger.log(`Auto-blocked employee #${emp.employee_id as number} (${String(emp.full_name)})`);
    }
    if (rows.length > 0) logger.log(`Offboarding auto-block: ${rows.length} employee(s) processed`);
  } catch (err) {
    logger.error('Offboarding auto-block error', err instanceof Error ? errMsg(err) : String(err));
  }
}

export async function runArchiveInactiveCandidates(d: CronDeps): Promise<void> {
  const logger = d.logger as Logger;
  try {
    const archivedFunnels = await d.repo.archiveInactiveFunnels();
    const archivedCandidates = await d.repo.archiveInactiveCandidates();
    if ((archivedFunnels.ok ? archivedFunnels.data : 0) > 0 || (archivedCandidates.ok ? archivedCandidates.data : 0) > 0) {
      logger.log(`Archival cron: ${archivedFunnels} funnel(s), ${archivedCandidates} candidate(s) archived`);
    }
  } catch (err) {
    logger.error('Candidate archival cron error', err instanceof Error ? errMsg(err) : String(err));
  }
}

export async function runCheckAdaptationRisks(d: CronDeps): Promise<void> {
  const logger = d.logger as Logger;
  try {
    const rowsR3 = await d.repo.getAdaptationRisks();
    const rows = (rowsR3.ok ? rowsR3.data as Record<string, unknown>[] : []);
    for (const row of rows) {
      if (row.telegram_chat_id) {
        await d.notif.handleErpEvent({ event: 'adaptation.at_risk', chatId: row.telegram_chat_id as string, data: { employeeName: row.employee_name, adaptationDay: row.adaptation_day, riskLevel: row.risk_level, reason: row.risk_reason ?? 'Adaptatsiya ko\'rsatkichlari past' } });
      }
      if (row.manager_chat_id && row.manager_chat_id !== row.telegram_chat_id) {
        await d.notif.sendNotificationRaw(row.manager_chat_id as string, `⚠️ <b>Xodim adaptatsiya xavfi</b>\n\n👤 Xodim: ${String(row.employee_name)}\n📅 Adaptatsiya kuni: ${String(row.adaptation_day ?? '')}\n🔴 Xavf darajasi: ${String(row.risk_level)}\n\nIltimos, xodim bilan suhbatlashing.`);
      }
      await d.repo.markAdaptationNotified(row.employee_id as number);
    }
    if (rows.length > 0) logger.log(`Adaptation risk notifications: ${rows.length} cases`);
  } catch (err) {
    logger.warn(`checkAdaptationRisks error: ${errMsg(err)}`);
  }
}

export async function runPipProgressReminders(d: CronDeps): Promise<void> {
  const logger = d.logger as Logger;
  try {
    const rowsR4 = await d.repo.getActivePipWithPendingGoals();
    const rows = (rowsR4.ok ? rowsR4.data as Record<string, unknown>[] : []);
    for (const row of rows) {
      await d.notif.handleErpEvent({ event: 'pip.progress.reminder', chatId: row.telegram_chat_id as string, data: { pendingGoals: row.pending_goals, dueDate: row.due_date } });
    }
    if (rows.length > 0) logger.log(`PIP reminders sent: ${rows.length}`);
  } catch (err) {
    logger.warn(`sendPipProgressReminders error: ${errMsg(err)}`);
  }
}
