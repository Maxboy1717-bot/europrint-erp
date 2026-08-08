/**
 * @module notification-bot-event-builders
 * @description Event-name → Telegram HTML message builders extracted from
 *   notification-bot.service.ts to keep that file <300 lines (Rule 16).
 */

import { TashkentTimeService } from '@common/time';
import { NOTIFICATION_TEMPLATES, renderTemplate } from './notification-templates';

const _time = new TashkentTimeService();
const LINK = '<a href="https://erp.europrint.uz">erp.europrint.uz</a>';

type D = Record<string, unknown>;

export function buildDocumentEventMessage(event: string, d: D): string | undefined {
  if (event === 'document.step.notify' || event === 'document.submitted')
    return renderTemplate(NOTIFICATION_TEMPLATES.APPROVAL_PENDING.template_uz, {
      document_title: String(d['documentTitle'] ?? 'Hujjat'),
      submitter_name: String(d['submitterName'] ?? 'Xodim'),
      submitted_at: String(d['submittedAt'] ?? _time.now().toLocaleString('uz')),
      url: 'https://erp.europrint.uz',
    });
  if (event === 'document.approved')
    return renderTemplate(NOTIFICATION_TEMPLATES.DOC_SIGNED.template_uz, {
      document_title: String(d['documentTitle'] ?? 'Hujjat'),
      signer_name: String(d['approverName'] ?? 'HR'),
      signed_at: String(d['approvedAt'] ?? _time.now().toLocaleString('uz')),
      url: 'https://erp.europrint.uz',
    });
  if (event === 'document.rejected')
    return renderTemplate(NOTIFICATION_TEMPLATES.DOC_REJECTED.template_uz, {
      document_title: String(d['documentTitle'] ?? 'Hujjat'),
      approver_name: String(d['approverName'] ?? 'HR'),
      rejection_reason: String(d['rejectionReason'] ?? 'Sabab ko\'rsatilmagan'),
      url: 'https://erp.europrint.uz',
    });
  if (event === 'document.overdue')
    return `⚠️ <b>Hujjat muddati o'tgan!</b>\n\nHujjat: ${String(d['documentTitle'] ?? 'Hujjat')}\nDeadline: ${String(d['deadline'] ?? 'Belgilanmagan')}\n\nImzolash uchun: ${LINK}`;
  return;
}

export function buildPipEventMessage(event: string, d: D): string | undefined {
  if (event === 'pip.progress.reminder' || event === 'pip.progress_updated')
    return `📋 <b>PIP eslatma</b>\n\nBajarish muddati: ${String(d['dueDate'] ?? 'Belgilanmagan')}\nQolgan maqsadlar: ${String(d['pendingGoals'] ?? 0)} ta\n\nMaqsadlaringizni bajarishni davom eting!\n${LINK}`;
  if (event === 'pip.started')
    return `📋 <b>Ishlash yaxshilash rejasi (PIP) boshlandi</b>\n\nDavomiyligi: ${String(d['durationDays'] ?? 30)} kun\nMaqsadlar soni: ${String(d['goalsCount'] ?? 0)} ta\n\nBatafsil: ${LINK}`;
  if (event === 'pip.completed')
    return `✅ <b>PIP muvaffaqiyatli yakunlandi!</b>\n\nBarcha maqsadlar bajarildi.\nRahmat, siz yaxshi natijalarga erishdingiz!🎉`;
  if (event === 'pip.failed')
    return `❌ <b>PIP yakunlandi — maqsadlar bajarilmadi</b>\n\nHR bo'limi bilan muloqot o'tkaziladi.\nBatafsil: ${LINK}`;
  return;
}

export function buildHrEventMessage(event: string, d: D): string | undefined {
  if (event === 'attendance.late')
    return renderTemplate(NOTIFICATION_TEMPLATES.LATE_ARRIVAL_REASON.template_uz, {
      late_minutes: String(d['lateMinutes'] ?? 0),
      arrival_time: String(d['arrivalTime'] ?? 'Noma\'lum'),
      date: String(d['date'] ?? _time.now().toISOString().split('T')[0]),
    });
  if (event === 'adaptation.at_risk')
    return `⚠️ <b>Adaptatsiya xavfi!</b>\n\nXodim: ${String(d['employeeName'] ?? 'Xodim')}\nAdaptatsiya kuni: ${String(d['adaptationDay'] ?? '')}\nXavf darajasi: <b>${String(d['riskLevel'] ?? 'o\'rta')}</b>\nSabab: ${String(d['reason'] ?? 'Adaptatsiya ko\'rsatkichlari past')}\n\nBatafsil: ${LINK}`;
  if (event === 'discipline.issued')
    return `⚠️ <b>Intizom chorasi qo'llanildi</b>\n\nTur: ${String(d['disciplineType'] ?? 'Ogohlantirishlar')}\nSabab: ${String(d['reason'] ?? 'Ko\'rsatilmagan')}\n\nBatafsil: ${LINK}`;
  if (event === 'employee.blocked')
    return renderTemplate(NOTIFICATION_TEMPLATES.ABSENCE_BLOCKED.template_uz, {
      hr_phone: String(d['hrPhone'] ?? '+998900000000'),
    });
  if (event === 'employee.unblocked')
    return `✅ <b>Kirish tiklandi</b>\n\nERP kirishingiz qayta tiklandi.\n${LINK}`;
  return;
}

export function buildMiscEventMessage(event: string, d: D): string | undefined {
  if (event === 'gamification.badge.awarded')
    return `🏆 <b>Yangi nishon!</b>\n\n${String(d['badgeName'] ?? 'Nishon')} oldingi nishon qo'lga kiritildi!\n${String(d['badgeDescription'] ?? '')}\n\nTabriklaymiz!🎉`;
  if (event === 'gamification.points.awarded')
    return `⭐ <b>+${String(d['points'] ?? 0)} ball!</b>\n\n${String(d['reason'] ?? 'Ball berildi')}\n\nUmumiy ball: ${String(d['totalPoints'] ?? '')}`;
  if (event === 'shift.assigned')
    return `🕐 <b>Smena belgilandi</b>\n\nSana: ${String(d['date'] ?? '')}\nTur: ${String(d['shiftType'] ?? '')}\nVaqt: ${String(d['startTime'] ?? '')} – ${String(d['endTime'] ?? '')}`;
  if (event === 'offboarding.started')
    return `📋 <b>Ishdan chiqish jarayoni boshlandi</b>\n\nOxirgi ish kuni: ${String(d['lastWorkingDay'] ?? 'Belgilanmagan')}\n\nHR bilan yuzlashuv sanasi kelishiladi.`;
  if (event === 'recruitment.candidate_hired')
    return renderTemplate(NOTIFICATION_TEMPLATES.OFFER_ACCEPTED.template_uz, {
      name: String(d['name'] ?? 'Hurmatli nomzod'),
      start_date: String(d['startDate'] ?? 'Kelishiladi'),
    });
  if (event === 'chat.new_message')
    return `💬 <b>Yangi xabar</b>\n\nKim: ${String(d['senderName'] ?? 'Xodim')}\nChat: ${String(d['roomName'] ?? 'Guruh')}\nXabar: ${String(d['preview'] ?? '')}\n\nKo'rish: ${LINK}`;
  if (event === 'chat.mention')
    return `🔔 <b>Sizni belgilashdi</b>\n\nKim: ${String(d['senderName'] ?? 'Xodim')}\nChat: ${String(d['roomName'] ?? 'Guruh')}\nXabar: ${String(d['preview'] ?? '')}\n\nKo'rish: ${LINK}`;
  if (event === 'penalty.assigned')
    return renderTemplate(NOTIFICATION_TEMPLATES.PENALTY_ASSIGNED.template_uz, {
      name: String(d['name'] ?? ''),
      penalty_type: String(d['penaltyType'] ?? 'Jarima'),
      amount: String(d['amount'] ?? ''),
      reason: String(d['reason'] ?? ''),
      appeal_deadline: String(d['appealDeadline'] ?? ''),
      url: 'https://erp.europrint.uz',
    });
  if (event === 'reward.given')
    return renderTemplate(NOTIFICATION_TEMPLATES.REWARD_GIVEN.template_uz, {
      name: String(d['name'] ?? ''),
      reward_title: String(d['rewardTitle'] ?? 'Mukofot'),
      reward_value: String(d['rewardValue'] ?? ''),
      reason: String(d['reason'] ?? ''),
    });
  return;
}

export function buildEventMessage(event: string, data: D): string | undefined {
  return (
    buildDocumentEventMessage(event, data) ??
    buildPipEventMessage(event, data) ??
    buildHrEventMessage(event, data) ??
    buildMiscEventMessage(event, data)
  );
}
