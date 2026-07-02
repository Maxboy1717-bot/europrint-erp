/**
 * @module finance.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CfoConfigService } from './domain/services/cfo-config.service';
import { FpCycleCronService } from './application/fp-cycle-cron.service';
import { FpCycleCronRepository } from './infrastructure/repositories/fp-cycle-cron.repository';
import { FP_CYCLE_CRON_REPO } from './domain/repositories/i-fp-cycle-cron.repo';
import { FINANCE_ACTIONS_REPO } from './domain/repositories/i-finance-actions.repo';
import { FINANCE_AP_REPO } from './domain/repositories/i-finance-ap.repo';
import { FINANCE_AR_REPO } from './domain/repositories/i-finance-ar.repo';
import { FINANCE_PAYROLL_APP_REPO } from './domain/repositories/i-finance-payroll.repo';
import { FinanceRepository } from './infrastructure/repositories/drizzle-finance.repo';
import { FinanceInvoiceRepo } from './infrastructure/repositories/drizzle-finance-invoice.repo';
import { FinanceReportRepo } from './infrastructure/repositories/drizzle-finance-report.repo';
import { FinanceOpsRepo } from './infrastructure/repositories/drizzle-finance-ops.repo';
import { FinanceCfoRepo } from './infrastructure/repositories/drizzle-finance-cfo.repo';
import { FinancePlanningRepo } from './infrastructure/repositories/drizzle-finance-planning.repo';
import { FinanceCostingRepo } from './infrastructure/repositories/drizzle-finance-costing.repo';
import { FinanceVarianceRepo } from './infrastructure/repositories/drizzle-finance-variance.repo';
import { GlPostingService } from './domain/services/gl-posting.service';
import { IncomeSplitService } from './application/income-split.service';
import { GL_POSTING_REPO } from './domain/repositories/i-gl-posting.repo';
import { DrizzleGlPostingRepository } from './infrastructure/repositories/drizzle-gl-posting.repo';
import { CheckAdvanceHandler } from './application/commands/check-advance.handler';
import { RecordPaymentHandler } from './application/commands/record-payment.handler';
import { StartRentalTimerHandler } from './application/commands/start-rental-timer.handler';
import { CreateBudgetHandler } from './application/commands/create-budget.handler';
import { ApproveBudgetHandler } from './application/commands/approve-budget.handler';
import { SubmitBudgetForApprovalHandler } from './application/commands/submit-budget-for-approval.handler';
import { ArAgingHandler } from './application/queries/ar-aging.handler';
import { ApAgingHandler } from './application/queries/ap-aging.handler';
import { CashFlowHandler } from './application/queries/cash-flow.handler';
import { GetInvoicesHandler } from './application/queries/get-invoices.handler';
import { GetPaymentsHandler } from './application/queries/get-payments.handler';
import { GetGlEntriesHandler } from './application/queries/get-gl-entries.handler';
import { GetBudgetsHandler } from './application/queries/get-budgets.handler';
import { GetBudgetByIdHandler } from './application/queries/get-budget-by-id.handler';
import { GetBudgetVarianceHandler } from './application/queries/get-budget-variance.handler';
import { GetBudgetStatsHandler } from './application/queries/get-budget-stats.handler';
import { WmsFgReceivedListener } from './infrastructure/event-handlers/wms-fg-received.listener';
import { WmsGoodsIssuedListener, WmsFgReceivedGlListener } from './infrastructure/event-handlers/wms-goods-issued.listener';
import { DeliveryCompletedListener } from './infrastructure/event-handlers/delivery-completed.listener';
import { TechThreeCheckpointListener } from './infrastructure/event-handlers/tech-three-checkpoint.listener';
import { FinanceInvoicesController } from './presentation/finance-invoices.controller';
import { FinancePaymentsController } from './presentation/finance-payments.controller';
import { FinanceGlController } from './presentation/finance-gl.controller';
import { FinanceAdvanceController } from './presentation/finance-advance.controller';
import { FinanceBudgetsController } from './presentation/finance-budgets.controller';
import { FinanceAccountingController } from './presentation/finance-accounting.controller';
import { FinancePayrollController } from './presentation/finance-payroll.controller';
import { FinanceArController } from './presentation/finance-ar.controller';
import { FinanceApController } from './presentation/finance-ap.controller';
import { FinanceMainController, FinanceMainActionsController } from './presentation/finance-main.controller';
import { FinanceCfoConfigController } from './presentation/finance-cfo-config.controller';
import { FinanceAccountingService } from './application/finance-accounting.service';
import { DrizzleFinanceAccountingRepo } from './infrastructure/repositories/drizzle-finance-accounting.repo';
import { FinanceApService } from './application/finance-ap.service';
import { FinanceApRepository } from './infrastructure/repositories/finance-ap.repository';
import { FinanceActionsRepository } from './infrastructure/repositories/finance-actions.repository';
import { FinanceActionsService } from './application/finance-actions.service';
import { FinanceArService } from './application/finance-ar.service';
import { FinanceArRepository } from './infrastructure/repositories/finance-ar.repository';
import { FinancePayrollService } from './application/finance-payroll.service';
import { FinancePayrollRepository } from './infrastructure/repositories/finance-payroll.repository';
import { FINANCE_REPO } from './domain/repositories/i-finance.repo';
import { FINANCE_GL_REPO } from './gl/i-finance-gl.repo';
import { DrizzleFinanceGlRepository } from './gl/drizzle-finance-gl.repo';
import { GlService } from './gl/gl.service';
import { FINANCE_BUDGETS_REPO } from './budgets/i-finance-budgets.repo';
import { DrizzleFinanceBudgetsRepository } from './budgets/drizzle-finance-budgets.repo';
import { BudgetsService } from './budgets/budgets.service';
import { FINANCE_PAYROLL_REPO } from './payroll/i-finance-payroll.repo';
import { DrizzleFinancePayrollRepository } from './payroll/drizzle-finance-payroll.repo';
import { PayrollService } from './payroll/payroll.service';
// Moliya-GL-Kassa (2026-07-02): HR's PayrollService.closePeriod is the ONE real
// payroll-closure implementation (GL journal + ЦКП/LMS gate + domain event).
// Finance's own PayrollService.close() proxies to it instead of duplicating a
// bare status flip (forwardRef — HrModule already imports FinanceModule).
import { HrModule } from '../hr/hr.module';
// --- New modules ---
import { FINANCE_EXTENDED_REPO } from './finance-extended/i-finance-extended.repo';
import { DrizzleFinanceExtendedRepository } from './finance-extended/drizzle-finance-extended.repo';
import { FinanceExtendedService } from './finance-extended/finance-extended.service';
import { FinanceExtendedPayrollService } from './finance-extended/finance-extended-payroll.service';
import {
  FinanceExtendedController,
  FinanceExtendedIncomeController,
  FinanceExtendedPayrollController,
} from './presentation/finance-extended.controller';
import { CASHFLOW_REPO } from './cashflow/i-cashflow.repo';
import { DrizzleCashflowRepository } from './cashflow/drizzle-cashflow.repo';
import { CashflowService } from './cashflow/cashflow.service';
import { CashflowController } from './presentation/cashflow.controller';
import { FINANCE_REPORTS_REPO } from './reports/i-reports.repo';
import { DrizzleFinanceReportsRepository } from './reports/drizzle-reports.repo';
import { FinanceReportsService } from './reports/reports.service';
import { ReportsController } from './presentation/reports.controller';
import { ORDER_COSTING_REPO } from './order-costing/i-order-costing.repo';
import { DrizzleOrderCostingRepository } from './order-costing/drizzle-order-costing.repo';
import { OrderCostingService } from './order-costing/order-costing.service';
import { OrderCostingController } from './presentation/order-costing.controller';
import { FiController } from './presentation/fi.controller';
import { BudgetsStandaloneController } from './presentation/budgets-standalone.controller';
import { GlStandaloneController } from './presentation/gl-standalone.controller';
import { PayrollPeriodsController } from './presentation/payroll-periods.controller';
import { ReportsHubController } from './presentation/reports-hub.controller';
import { SalesOrdersStandaloneController } from './presentation/sales-orders-standalone.controller';
import { FI_REPO } from './fi/i-fi.repo';
import { DrizzleFiRepository } from './fi/drizzle-fi.repo';
import { FiService } from './fi/fi.service';
import { REPORTS_HUB_REPO } from './reports-hub/i-reports-hub.repo';
import { DrizzleReportsHubRepository } from './reports-hub/drizzle-reports-hub.repo';
import { ReportsHubService } from './reports-hub/reports-hub.service';
import { SALES_ORDERS_FI_REPO } from './sales-orders-fi/i-sales-orders-fi.repo';
import { DrizzleSalesOrdersFiRepository } from './sales-orders-fi/drizzle-sales-orders-fi.repo';
import { SalesOrdersFiService } from './sales-orders-fi/sales-orders-fi.service';
import { FinancialReportsModule } from './financial-reports/financial-reports.module';
// Sprint 1 — new services and controllers
import { StandardCostService } from './domain/services/standard-cost.service';
import { VarianceAnalysisService } from './domain/services/variance-analysis.service';
import { BreakEvenService } from './domain/services/break-even.service';
import { TieredPricingService } from './domain/services/tiered-pricing.service';
import { FinancialRatiosService } from './domain/services/financial-ratios.service';
import { CashflowForecastService } from './domain/services/cashflow-forecast.service';
import { FinanceStandardCostController } from './presentation/finance-standard-cost.controller';
import { FinanceVarianceController } from './presentation/finance-variance.controller';
import { FinanceBreakEvenController } from './presentation/finance-break-even.controller';
import { FinanceRatiosController } from './presentation/finance-ratios.controller';
import { FinanceCashflowForecastController } from './presentation/finance-cashflow-forecast.controller';
import { PricingController } from './presentation/pricing.controller';
// PA3-17: GeneralTaxService relocated from `modules/fi/tax/`.
import { GeneralTaxService } from './application/general-tax.service';
// CASHIER-HUB KAS-1: factory cashier hub (shift open/close + cash movements → canonical GL).
import { CASHIER_HUB_REPO } from './cashier-hub/i-cashier-hub.repo';
import { DrizzleCashierHubRepository } from './cashier-hub/drizzle-cashier-hub.repo';
import { CashierHubService } from './cashier-hub/cashier-hub.service';
import { CashierHubPdfService } from './cashier-hub/cashier-hub-pdf.service';
import { CashierHubController } from './cashier-hub/cashier-hub.controller';
// CASHIER-HUB Phase 2: KAS-2 salary-payout approval gate + podotchet (advance/debt) cycle.
import { CASHIER_PAYROLL_REPO } from './cashier-hub/i-cashier-payroll.repo';
import { DrizzleCashierPayrollRepository } from './cashier-hub/drizzle-cashier-payroll.repo';
import { CashierPayrollService } from './cashier-hub/cashier-payroll.service';
import { CashierPodotchetService } from './cashier-hub/cashier-podotchet.service';
import { CashierPayrollController } from './cashier-hub/cashier-payroll.controller';

const commandHandlers = [
  CheckAdvanceHandler, RecordPaymentHandler, StartRentalTimerHandler,
  CreateBudgetHandler, ApproveBudgetHandler, SubmitBudgetForApprovalHandler,
];

const queryHandlers = [
  ArAgingHandler, ApAgingHandler, CashFlowHandler, GetInvoicesHandler, GetPaymentsHandler,
  GetGlEntriesHandler, GetBudgetsHandler, GetBudgetByIdHandler, GetBudgetVarianceHandler, GetBudgetStatsHandler,
];

const eventListeners = [
  WmsFgReceivedListener,           // Trigger 12 (rental timer)
  WmsGoodsIssuedListener,          // HOP 5 WMS→FIN: goods-issue → Dr COGS / Cr Inventory (entries)
  WmsFgReceivedGlListener,         // HOP 5 WMS→FIN: FG receipt → Dr Inventory / Cr AP (entries)
  DeliveryCompletedListener,       // Trigger 14
  TechThreeCheckpointListener,     // Trigger 6
];

@Module({
  imports: [
    CqrsModule, EventEmitterModule.forRoot(), FinancialReportsModule,
    // forwardRef: HrModule already imports FinanceModule (GlPostingService) —
    // Finance's payroll.service.ts proxies close() to HR's real closePeriod().
    forwardRef(() => HrModule),
  ],
  controllers: [
    FinanceInvoicesController, FinancePaymentsController, FinanceGlController,
    FinanceAdvanceController, FinanceBudgetsController, FinanceAccountingController,
    FinancePayrollController, FinanceArController, FinanceApController, FinanceMainController, FinanceMainActionsController,
    // New controllers
    FinanceExtendedController, FinanceExtendedIncomeController, FinanceExtendedPayrollController,
    CashflowController, ReportsController,
    OrderCostingController, FiController, BudgetsStandaloneController,
    GlStandaloneController, PayrollPeriodsController, ReportsHubController,
    SalesOrdersStandaloneController, FinanceCfoConfigController,
    // Sprint 1 controllers
    FinanceStandardCostController, FinanceVarianceController, FinanceBreakEvenController,
    FinanceRatiosController, FinanceCashflowForecastController, PricingController,
    // CASHIER-HUB KAS-1
    CashierHubController,
    // CASHIER-HUB Phase 2 (KAS-2 + podotchet)
    CashierPayrollController,
  ],
  providers: [
    FinanceInvoiceRepo, FinanceReportRepo,
    FinanceOpsRepo, FinanceCfoRepo, FinancePlanningRepo, FinanceCostingRepo, FinanceVarianceRepo,
    { provide: FINANCE_REPO, useClass: FinanceRepository },
    { provide: GL_POSTING_REPO, useClass: DrizzleGlPostingRepository },
    GlPostingService,
    IncomeSplitService,
    ...commandHandlers, ...queryHandlers, ...eventListeners,
    FpCycleCronRepository,
    { provide: FP_CYCLE_CRON_REPO, useClass: FpCycleCronRepository },
    FpCycleCronService,
    { provide: FINANCE_GL_REPO, useClass: DrizzleFinanceGlRepository },
    GlService,
    // Bare class provider so DrizzleFinanceBudgetsRepository can also be injected
    // directly (by class token) from the FinanceRepository CQRS facade, sharing
    // the same singleton instance as the FINANCE_BUDGETS_REPO token below.
    DrizzleFinanceBudgetsRepository,
    { provide: FINANCE_BUDGETS_REPO, useExisting: DrizzleFinanceBudgetsRepository },
    BudgetsService,
    { provide: FINANCE_PAYROLL_REPO, useClass: DrizzleFinancePayrollRepository },
    PayrollService,
    DrizzleFinanceAccountingRepo, FinanceAccountingService,
    FinanceApRepository,
    { provide: FINANCE_AP_REPO, useClass: FinanceApRepository },
    FinanceApService,
    FinanceArRepository,
    { provide: FINANCE_AR_REPO, useClass: FinanceArRepository },
    FinanceArService,
    FinancePayrollRepository,
    { provide: FINANCE_PAYROLL_APP_REPO, useClass: FinancePayrollRepository },
    FinancePayrollService,
    FinanceActionsRepository,
    { provide: FINANCE_ACTIONS_REPO, useClass: FinanceActionsRepository },
    FinanceActionsService,
    // New providers
    { provide: FINANCE_EXTENDED_REPO, useClass: DrizzleFinanceExtendedRepository },
    FinanceExtendedService,
    FinanceExtendedPayrollService,
    { provide: CASHFLOW_REPO, useClass: DrizzleCashflowRepository },
    CashflowService,
    { provide: FINANCE_REPORTS_REPO, useClass: DrizzleFinanceReportsRepository },
    FinanceReportsService,
    { provide: ORDER_COSTING_REPO, useClass: DrizzleOrderCostingRepository },
    OrderCostingService,
    { provide: FI_REPO, useClass: DrizzleFiRepository },
    FiService,
    { provide: REPORTS_HUB_REPO, useClass: DrizzleReportsHubRepository },
    ReportsHubService,
    { provide: SALES_ORDERS_FI_REPO, useClass: DrizzleSalesOrdersFiRepository },
    SalesOrdersFiService,
    CfoConfigService,
    // Sprint 1 services
    StandardCostService, VarianceAnalysisService, BreakEvenService,
    TieredPricingService, FinancialRatiosService, CashflowForecastService,
    // PA3-17: tax calculator merged from `modules/fi/`
    GeneralTaxService,
    // CASHIER-HUB KAS-1 (reuses GlPostingService already provided above)
    { provide: CASHIER_HUB_REPO, useClass: DrizzleCashierHubRepository },
    CashierHubService,
    CashierHubPdfService,
    // CASHIER-HUB Phase 2 — KAS-2 approval gate + podotchet (reuse CashierHubService for cash-out + GL)
    { provide: CASHIER_PAYROLL_REPO, useClass: DrizzleCashierPayrollRepository },
    CashierPayrollService,
    CashierPodotchetService,
  ],
  exports: [FINANCE_REPO, GlPostingService, CfoConfigService, GeneralTaxService],
})
export class FinanceModule {}
