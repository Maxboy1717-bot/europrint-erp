/**
 * @module cron-status.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common'
import { Ok, Err, Result, AppError } from '@common/result';

export interface CronJobStatus {
  name: string
  description: string
  schedule: string
  lastRanAt: Date | null
  nextRunAt: string | null
  successCount: number
  failureCount: number
  lastResult: 'success' | 'failure' | 'never'
  lastError: string | null
}

interface CronJobMeta {
  name: string
  description: string
  schedule: string
}

function matchesStepPart(part: string, value: number, min: number, max: number): boolean {
  const [base, step] = part.split('/')
  const start = base === '*' ? min : parseInt(base, 10)
  const stepN = parseInt(step, 10)
  for (let v = start; v <= max; v += stepN) {
    if (v === value) return true
  }
  return false
}

function matchesPart(part: string, value: number, min: number, max: number): boolean {
  if (part.includes('/')) return matchesStepPart(part, value, min, max)
  if (part.includes('-')) {
    const [lo, hi] = part.split('-').map(Number)
    return value >= lo && value <= hi
  }
  return parseInt(part, 10) === value
}

function matchesField(field: string, value: number, min: number, max: number): boolean {
  if (field === '*') return true
  for (const part of field.split(',')) {
    if (matchesPart(part, value, min, max)) return true
  }
  return false
}

function cronFieldsMatch(fields: string[], candidate: Date): boolean {
  const [minField, hourField, domField, monthField, dowField] = fields
  return (
    matchesField(monthField, candidate.getMonth() + 1, 1, 12) &&
    matchesField(domField, candidate.getDate(), 1, 31) &&
    matchesField(dowField, candidate.getDay(), 0, 7) &&
    matchesField(hourField, candidate.getHours(), 0, 23) &&
    matchesField(minField, candidate.getMinutes(), 0, 59)
  )
}

/** Parse a 5-field cron expression and return the next fire Date.
 *  Handles: numeric, *, ranges (a-b), lists (a,b,c), steps (n/step).
 */
function nextCronDate(expression: string): Date {
  const fields = expression.split(' ')
  const candidate = new Date(Date.now() + 60_000)
  candidate.setSeconds(0, 0)
  for (let i = 0; i < 60 * 24 * 366; i++) {
    if (cronFieldsMatch(fields, candidate)) return candidate
    candidate.setTime(candidate.getTime() + 60_000)
  }
  return new Date(Date.now() + 365 * 86400_000)
}

/**
 * Registry of all cron job statuses across the entire application.
 * Includes crons from both cron.module (instrumented) and hr-v2 module services.
 * hr-v2 crons show lastResult='never' as they call their own logging internally.
 */
@Injectable()
export class CronStatusService {
  private readonly logger = new Logger(CronStatusService.name);
  private readonly statuses = new Map<string, CronJobStatus>()

  constructor() {
    this.logger.log(`cron-status: operatsiya`);
    // Schedules are kept in sync with actual @Cron decorators.
    const jobs: CronJobMeta[] = [
      // ── New HR, Finance & Recruitment crons (Task #161, fully instrumented) ─
      { name: 'FpCycle.sendZvsReminder',        description: "ЗВС eslatmasi bo'lim boshliqlariga (Seshanba 09:00)",  schedule: '0 9 * * 2'        },
      { name: 'FpCycle.sendFpDayReminder',       description: "FP kuni eslatma moliya bo'limiga (Chorshanba 09:00)", schedule: '0 9 * * 3'        },
      { name: 'FpCycle.sendBankPaymentReminder', description: "Bank to'lov eslatmasi (Payshanba 09:00)",             schedule: '0 9 * * 4'        },
      { name: 'FpCycle.sendCashPaymentReminder', description: "Naqd to'lov eslatmasi (Dushanba 09:00)",              schedule: '0 9 * * 1'        },
      { name: 'DisciplineCron',                  description: "6 oydan o'tgan intizom yozuvlarini eskirish (01:00)", schedule: '0 1 * * *'        },
      { name: 'AiInterviewCron',                 description: "24 soatdan o'tgan AI sessiyalarni 'expired' (har soat)", schedule: '0 * * * *'     },
      { name: 'DailyReportCron',                 description: "Hisobot topshirmagan xodimlar auto-absent (Dush-Jum 20:00)", schedule: '0 20 * * 1-5' },
      { name: 'BirthdayCron.checkTomorrow',      description: "Ertangi tug'ilgan kun menejerlarga eslatma (20:00)", schedule: '0 20 * * *'       },
      { name: 'BirthdayCron.announceToday',      description: "Bugungi tug'ilgan kun jamoaga e'lon (07:30)",         schedule: '30 7 * * *'       },
      { name: 'BirthdayCron.greetEvening',       description: "Tug'ilgan kun egasiga shaxsiy tabrik (18:00)",        schedule: '0 18 * * *'       },
      { name: 'EnpsCron',                        description: "Choraklik eNPS so'rov yaratish + Telegram (1 Yan/Apr/Iyul/Okt 09:00)", schedule: '0 9 1 1,4,7,10 *' },
      { name: 'CandidateArchiveCron',            description: "6 oydan o'tgan rad etilgan kandidatlar arxivi (02:00)", schedule: '0 2 * * *'      },
      { name: 'AbsenceBlockCron',                description: "3 kun ketma-ket yo'qlik xodimlarni bloklash (09:00)", schedule: '0 9 * * *'        },
      { name: 'VacancyDeadlineCron',             description: "Vakansiya yopilishiga aynan 3 kun qoldi eslatmasi (09:00)", schedule: '0 9 * * *' },
      { name: 'RetentionCron',                   description: "Ma'lumot saqlash: POS 7 yil, ishchi hujjat 3 yil, rahbar 10 yil (02:30)", schedule: '30 2 * * *' },
      // ── Pre-existing crons in cron.module (schedules match @Cron decorators) ─
      { name: 'WarehouseRentalCron',             description: "Ombor ijarasi hisob-kitob (00:05)",                   schedule: '5 0 * * *'        },
      { name: 'CurrencyRatesCron',               description: "Valyuta kurslarini yangilash (09:00)",                schedule: '0 9 * * *'        },
      { name: 'AttendanceCheckCron',             description: "Kelmaganlarni tekshirish (10:00)",                    schedule: '0 10 * * *'       },
      { name: 'ReminderSendCron',                description: "Umumiy eslatmalar (har soat)",                        schedule: '0 * * * *'        },
      { name: 'ReportGenerateCron',              description: "Hisobot generatsiya (23:00)",                         schedule: '0 23 * * *'       },
      { name: 'BackupDatabaseCron',              description: "Ma'lumotlar bazasini zaxiralash (03:00)",             schedule: '0 3 * * *'        },
      { name: 'CleanupOldLogsCron',              description: "Eski loglarni tozalash (Yakshanba 02:00)",            schedule: '0 2 * * 0'        },
      { name: 'CreditCheckCron',                 description: "Kredit holati tekshirish (08:00)",                    schedule: '0 8 * * *'        },
      { name: 'OverduePoCron',                   description: "Muddati o'tgan buyurtmalar (09:00)",                  schedule: '0 9 * * *'        },
      { name: 'KpiCalculateCron',                description: "KPI hisoblash (23:30)",                               schedule: '30 23 * * *'      },
      { name: 'IotDataCleanupCron',              description: "IoT ma'lumotlarini tozalash (Shanba 02:00)",          schedule: '0 2 * * 6'        },
      { name: 'CertExpiryCron',                  description: "Sertifikat muddati eslatmasi (08:00)",                schedule: '0 8 * * *'        },
      { name: 'BudgetAlertCron',                 description: "Byudjet alert (Dushanba 09:00)",                     schedule: '0 9 * * 1'        },
      { name: 'StockAlertCron',                  description: "Ombor qoldig'i alert (08:00)",                        schedule: '0 8 * * *'        },
      { name: 'AdvanceReminderCron',             description: "Avans eslatmasi (10:00)",                             schedule: '0 10 * * *'       },
      // ── HR-v2 module crons (managed by their own services) ────────────────
      { name: 'DisciplineV2.expireOldRecords',   description: "Intizom yozuvlarini eskirish 6 oydan so'ng (01:00)", schedule: '0 1 * * *'        },
      { name: 'DisciplineV2.checkDailyAbsences', description: "Kunlik yo'qliklarni tekshirish, 3+ = bloklash (06:00)", schedule: '0 6 * * *'    },
      { name: 'DailyReport.sendReminder',        description: "Kunlik hisobot eslatmasi (17:00 Dush-Shan)",         schedule: '0 17 * * 1-6'     },
      { name: 'DailyReport.markAbsent',          description: "Hisobot topshirmaganlarni auto-absent (20:00)",      schedule: '0 20 * * 1-6'     },
      { name: 'TelegramBots.sendBirthdayGreeting',  description: "Tug'ilgan kun tabrik (shaxsiy 20:00)",            schedule: '0 20 * * *'       },
      { name: 'TelegramBots.sendBirthdayBroadcast', description: "Tug'ilgan kun e'lon (jamoa 07:30)",               schedule: '30 7 * * *'       },
      { name: 'TelegramBots.archiveCandidates',  description: "Rad etilgan kandidatlar arxivi (02:00)",             schedule: '0 2 * * *'        },
      { name: 'TelegramBots.autoBlockOffboarded',description: "Ishdan ketgan xodimlarni bloklash (23:59)",          schedule: '59 23 * * *'      },
      { name: 'EnpsService.createQuarterlySurvey', description: "Choraklik eNPS so'rov (1 Yan/Apr/Iyul/Okt 09:00)", schedule: '0 9 1 1,4,7,10 *' },
      { name: 'EnpsService.sendMonthlyReminder', description: "Oylik eNPS eslatmasi (15-sana 10:00)",               schedule: '0 10 15 * *'      },
      { name: 'DocumentWorkflow.cleanup',        description: "Hujjat ishlov muddati tekshirish (har soat)",        schedule: '0 * * * *'        },
      { name: 'Gamification.monthlyReset',       description: "Oylik gamification reset (1-sana 09:00)",            schedule: '0 9 1 * *'        },
      { name: 'Gamification.weeklyLeaderboard',  description: "Haftalik liderlar jadvali (Dushanba 08:00)",         schedule: '0 8 * * 1'        },
      { name: 'CareerPath.monthlyCheck',         description: "Karyera yo'li oylik tekshiruv (1-sana 09:00)",       schedule: '0 9 1 * *'        },
      { name: 'SkillsMatrix.quarterlyRemind',    description: "Choraklik ko'nikmalar eslatmasi (1 Yan/Apr/Iyul/Okt)", schedule: '0 9 1 1,4,7,10 *' },
      { name: 'PipService.weeklyCheck',          description: "PIP haftalik tekshiruv (Dushanba 09:00)",            schedule: '0 9 * * 1'        },
      { name: 'PipService.dailyReminder',        description: "PIP kunlik eslatma (08:00)",                         schedule: '0 8 * * *'        },
      { name: 'Reception.dailyCleanup',          description: "Qabul xonasi kunlik tozalash (23:00)",               schedule: '0 23 * * *'       },
      { name: 'Shift.checkStart',                description: "Smenani boshlash tekshiruv (har 30 daqiqa 05-10)",   schedule: '*/30 5-10 * * 1-6' },
      { name: 'TelegramBots.payrollNotification',description: "Oylik maosh xabari (25-sana 08:00)",                 schedule: '0 8 25 * *'       },
    ]

    for (const job of jobs) {
      this.statuses.set(job.name, {
        name: job.name,
        description: job.description,
        schedule: job.schedule,
        lastRanAt: null,
        nextRunAt: nextCronDate(job.schedule).toISOString(),
        successCount: 0,
        failureCount: 0,
        lastResult: 'never',
        lastError: null,
      })
    }
  }

  recordSuccess(jobName: string): void {
    const status = this.statuses.get(jobName)
    if (!status) return
    status.lastRanAt = _time.now()
    status.successCount++
    status.lastResult = 'success'
    status.lastError = null
    status.nextRunAt = nextCronDate(status.schedule).toISOString()
  }

  recordFailure(jobName: string, error: string): void {
    const status = this.statuses.get(jobName)
    if (!status) return
    status.lastRanAt = _time.now()
    status.failureCount++
    status.lastResult = 'failure'
    status.lastError = error
    status.nextRunAt = nextCronDate(status.schedule).toISOString()
  }

  getAllStatuses(): CronJobStatus[] {
    return Array.from(this.statuses.values())
  }

  getStatus(jobName: string): CronJobStatus | undefined {
    return this.statuses.get(jobName)
  }

  getSummary(): Result<{ total: number; neverRan: number; successLast: number; failureLast: number }, AppError> {
    const all = this.getAllStatuses()
    return Ok({
      total: all.length,
      neverRan: (Array.isArray(all) ? all : []).filter(j => j.lastResult === 'never').length,
      successLast: (Array.isArray(all) ? all : []).filter(j => j.lastResult === 'success').length,
      failureLast: (Array.isArray(all) ? all : []).filter(j => j.lastResult === 'failure').length,
    })
  }
}
