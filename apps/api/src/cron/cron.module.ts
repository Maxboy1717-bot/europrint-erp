/**
 * @module cron.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TelegramModule } from '../telegram/telegram.module'
import { QueueModule } from '../modules/queue/queue.module'
import { EoqSafetyStockRefreshCron } from './eoq-safety-stock-refresh.cron'
import { WarehouseRentalCron } from './warehouse-rental.cron'
import { CurrencyRatesCron } from './currency-rates.cron'
import { AttendanceCheckCron } from './attendance-check.cron'
import { ReminderSendCron } from './reminder-send.cron'
import { ReportGenerateCron } from './report-generate.cron'
import { BackupDatabaseCron } from './backup-database.cron'
import { CleanupOldLogsCron } from './cleanup-old-logs.cron'
import { CreditCheckCron } from './credit-check.cron'
import { OverduePoCron } from './overdue-po.cron'
import { KpiCalculateCron } from './kpi-calculate.cron'
import { IotDataCleanupCron } from './iot-data-cleanup.cron'
import { CertExpiryCron } from './cert-expiry.cron'
import { BudgetAlertCron } from './budget-alert.cron'
import { StockAlertCron } from './stock-alert.cron'
import { AdvanceReminderCron } from './advance-reminder.cron'
import { FpCycleCron } from './fp-cycle.cron'
import { DisciplineCron } from './discipline.cron'
import { AiInterviewCron } from './ai-interview.cron'
import { DailyReportCron } from './daily-report.cron'
import { BirthdayCron } from './birthday.cron'
import { BadgeAwardCron } from './badge-award.cron'
import { EnpsCron } from './enps.cron'
import { CandidateArchiveCron } from './candidate-archive.cron'
import { AbsenceBlockCron } from './absence-block.cron'
import { VacancyDeadlineCron } from './vacancy-deadline.cron'
import { RetentionCron } from './retention.cron'
import { KanbanRecurringCron } from './kanban-recurring.cron'
import { ActingRevertCron } from './acting-revert.cron'
import { CkpDailyAggregateCron } from './ckp-daily-aggregate.cron'
import { CardRepository } from '../modules/org-structure/card.repository'
import { CkpFactRepository } from '../modules/org-structure/ckp-fact.repository'
import { CronStatusService } from './cron-status.service'
import { AbsenceBlockRepository } from './repositories/absence-block.repository'
import { EnpsCronRepository } from './repositories/enps-cron.repository'
import { DataRetentionRepository } from './repositories/data-retention.repository'

@Module({
  imports: [ScheduleModule.forRoot(), TelegramModule, QueueModule],
  providers: [
    CronStatusService,
    // Sprint 2 — Haftalik EOQ + Safety Stock yangilash (TZ-02/TZ-04)
    EoqSafetyStockRefreshCron,
    // Pre-existing crons
    WarehouseRentalCron,
    CurrencyRatesCron,
    AttendanceCheckCron,
    ReminderSendCron,
    ReportGenerateCron,
    BackupDatabaseCron,
    CleanupOldLogsCron,
    CreditCheckCron,
    OverduePoCron,
    KpiCalculateCron,
    IotDataCleanupCron,
    CertExpiryCron,
    BudgetAlertCron,
    StockAlertCron,
    AdvanceReminderCron,
    // New HR, Finance & Recruitment crons (Task #161)
    FpCycleCron,
    DisciplineCron,
    AiInterviewCron,
    DailyReportCron,
    BirthdayCron,
    BadgeAwardCron,
    EnpsCron,
    CandidateArchiveCron,
    AbsenceBlockCron,
    VacancyDeadlineCron,
    // ORG Phase 7 — i.o./acting auto-revert (EP-ORG-060); CardRepository = standalone (runQuery, no deps)
    ActingRevertCron,
    CardRepository,
    // A68 (ЦКП) — kunlik kaskad-agregat (har root-karta subtree avg, 01:00); CkpFactRepository = standalone (runQuery)
    CkpDailyAggregateCron,
    CkpFactRepository,
    // Data retention cron (Task #180)
    RetentionCron,
    // Kanban — takrorlanuvchi kartalar yaratish (har kuni 07:00)
    KanbanRecurringCron,
    // Cron repositories (Drizzle ORM)
    AbsenceBlockRepository,
    EnpsCronRepository,
    DataRetentionRepository,
  ],
  exports: [CronStatusService],
})
export class CronModule {}
