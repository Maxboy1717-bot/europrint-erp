/**
 * @module cron.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common'
// 09-qc #22 — Davriy ichki sifat auditi (choraklik cron); QcInternalAuditRepository = standalone (runQuery)
import { QcInternalAuditCron } from './qc-internal-audit.cron'
import { QcInternalAuditService } from '../modules/qc/application/qc-internal-audit.service'
import { QcInternalAuditRepository } from '../modules/qc/infrastructure/repositories/qc-internal-audit.repo'
import { ScheduleModule } from '@nestjs/schedule'
import { TelegramModule } from '../telegram/telegram.module'
import { QueueModule } from '../modules/queue/queue.module'
import { NotificationsModule } from '../modules/notifications/notifications.module'
import { EoqSafetyStockRefreshCron } from './eoq-safety-stock-refresh.cron'
import { WarehouseRentalCron } from './warehouse-rental.cron'
import { CurrencyRatesCron } from './currency-rates.cron'
import { RecurringJournalEntriesCron } from './recurring-journal-entries.cron'
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
import { WmsCatalogAbcAgingExpiryService } from '../modules/wms/application/wms-catalog/abc-aging-expiry.service'
import { NotificationRoutingRepository } from '../modules/notifications/infrastructure/notification-routing.repository'
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
import { MesSosEscalationCron } from './mes-sos-escalation.cron'
import { MesSosEscalationService } from '../modules/mes/application/mes-sos-escalation.service'
import { MesSosEscalationRepository } from '../modules/mes/infrastructure/repositories/mes-sos-escalation.repo'
import { SdMaterialWaitEscalationCron } from './sd-material-wait-escalation.cron'
import { SdMaterialWaitEscalationService } from '../modules/sd/application/sd-material-wait-escalation.service'
import { DrizzleSdMaterialWaitEscalationRepo } from '../modules/sd/infrastructure/repositories/drizzle-sd-material-wait-escalation.repo'
import { CkpDailyAggregateCron } from './ckp-daily-aggregate.cron'
import { CardRepository } from '../modules/org-structure/card.repository'
// CardRepository injects LmsCardGateService (mandatory-darslik gate, VISION-3340 #27) —
// import LmsModule so that exported service is resolvable for the CardRepository provider below.
import { LmsModule } from '../modules/lms/lms.module'
import { CkpFactRepository } from '../modules/org-structure/ckp-fact.repository'
import { CronStatusService } from './cron-status.service'
// A4 (vizyon) — har xodim kunlik ishlagan-pul PDF (19:00); HrPdfGeneratorService = standalone (pdf-lib, deps yo'q)
import { EmployeeDailyInvoiceCron } from './employee-daily-invoice.cron'
import { HrPdfGeneratorService } from '../common/pdf/hr-pdf-generator.service'
import { AbsenceBlockRepository } from './repositories/absence-block.repository'
import { EnpsCronRepository } from './repositories/enps-cron.repository'
import { DataRetentionRepository } from './repositories/data-retention.repository'
// 2.5 (MASTER-REJA-VIZYON) — mijoz ABC segmentatsiya kunlik avto-hisob (sd_customers.abc_class)
import { CustomerAbcRecomputeCron } from './customer-abc-recompute.cron'
// 06-sd #27 — nofaol mijoz cron (har kuni 03:30)
import { CustomerInactivityCron } from './customer-inactivity.cron'
import { CustomerInactivityService } from '../modules/sd/application/customer-inactivity.service'
import { DrizzleCustomerInactivityRepository } from '../modules/sd/infrastructure/repositories/drizzle-customer-inactivity.repo'
import { CustomerAbcService } from '../modules/sd/application/customer-abc.service'
import { SD_CUSTOMER_ABC_REPO } from '../modules/sd/infrastructure/repositories/i-sd-customer-abc.repo'
import { DrizzleSdCustomerAbcRepository } from '../modules/sd/infrastructure/repositories/drizzle-sd-customer-abc.repo'
// 2.18 (MASTER-REJA-VIZYON) — AI-fit haftalik avto-tsikl (har faol karta+xodim evaluate())
import { AiFitWeeklyCron } from './ai-fit-weekly.cron'
import { AiFitModule } from '../modules/ai/ai-fit.module'
// 02-hr #46 (vizyon) — "E'tibor talab qiluvchi xodim" haftalik HR digest (Dushanba 09:00);
// HrAttentionDigestRepository = standalone (typedExecute); RBAC = AbsenceBlockRepository.findHrManagersWithTelegram()
import { HrAttentionDigestCron } from './hr-attention-digest.cron'
import { HrAttentionDigestRepository } from './repositories/hr-attention-digest.repository'

@Module({
  imports: [ScheduleModule.forRoot(), TelegramModule, QueueModule, AiFitModule, NotificationsModule, LmsModule],
  providers: [
    // 06-sd #27 — nofaol mijoz cron (har kuni 03:30) + manba service/repo
    CustomerInactivityCron,
    CustomerInactivityService,
    DrizzleCustomerInactivityRepository,
    // 09-qc #22 — Davriy ichki sifat auditi (choraklik cron): qc_internal_audits idempotent scheduling
    QcInternalAuditCron,
    QcInternalAuditService,
    QcInternalAuditRepository,
    CronStatusService,
    // Sprint 2 — Haftalik EOQ + Safety Stock yangilash (TZ-02/TZ-04)
    EoqSafetyStockRefreshCron,
    // Pre-existing crons
    WarehouseRentalCron,
    CurrencyRatesCron,
    RecurringJournalEntriesCron,
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
    // wms.lot_expiring (FAZA Bildirishnoma 2026-07-01) — StockAlertCron qayta qurildi,
    // qarang stock-alert.cron.ts JSDoc. Standalone deps (runQuery/rawSql, boshqa modul provideri kerak emas).
    WmsCatalogAbcAgingExpiryService,
    NotificationRoutingRepository,
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
    // #11 — SOS/downtime org-zanjir timeout eskalatsiya (har 2 daqiqa); repo+service standalone (runQuery)
    MesSosEscalationCron,
    MesSosEscalationService,
    MesSosEscalationRepository,
    // 06-sd #2 — material-wait (Ожд.Сырьё) MM-reject / 24h→48h escalation (hourly); repo+service standalone (typedExecute)
    SdMaterialWaitEscalationCron,
    SdMaterialWaitEscalationService,
    DrizzleSdMaterialWaitEscalationRepo,
    // A68 (ЦКП) — kunlik kaskad-agregat (har root-karta subtree avg, 01:00); CkpFactRepository = standalone (runQuery)
    CkpDailyAggregateCron,
    CkpFactRepository,
    // Data retention cron (Task #180)
    RetentionCron,
    // Kanban — takrorlanuvchi kartalar yaratish (har kuni 07:00)
    KanbanRecurringCron,
    // A4 (vizyon) — har xodim kunlik ishlagan-pul PDF (har kuni 19:00 Toshkent):
    // uskunachi = production_fact real data, boshqa xodim = base_salary/oy-ish-kunlari
    EmployeeDailyInvoiceCron,
    HrPdfGeneratorService,
    // Cron repositories (Drizzle ORM)
    AbsenceBlockRepository,
    EnpsCronRepository,
    DataRetentionRepository,
    // 2.5 (MASTER-REJA-VIZYON) — mijoz ABC segmentatsiya kunlik avto-hisob (har kuni 02:00)
    CustomerAbcRecomputeCron,
    CustomerAbcService,
    { provide: SD_CUSTOMER_ABC_REPO, useClass: DrizzleSdCustomerAbcRepository },
    // 2.18 — AI-fit haftalik avto-tsikl (Dushanba 03:00); AiFitService = AiFitModule'dan (import qilingan, exported)
    AiFitWeeklyCron,
    // 02-hr #46 — "E'tibor talab qiluvchi xodim" haftalik HR digest (Dushanba 09:00)
    HrAttentionDigestCron,
    HrAttentionDigestRepository,
  ],
  exports: [CronStatusService],
})
export class CronModule {}
