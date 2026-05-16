/**
 * @module hr.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';
import { FaceRecognitionService } from './attendance/face-recognition.service';
import { TerritoryLogRepository } from './attendance/territory-log.repository';
import { TerritoryLogService } from './attendance/territory-log.service';
import { LateArrivalService } from './attendance/late-arrival.service';
import { DisciplineRecordRepository } from './attendance/discipline-record.repository';
import { RoomSnapshotCron } from './attendance/room-snapshot.cron';
import { AttendanceFaceController } from './attendance/attendance-face.controller';
import { TerritoryGateway } from './attendance/territory.gateway';
import { HrV2CommonModule } from './common/hr-v2-common.module';
import { DocumentWorkflowModule } from './document-workflow/document-workflow.module';
import { DisciplineV2Module } from './discipline-v2/discipline-v2.module';
import { GamificationModule } from './gamification/gamification.module';
import { DailyReportModule } from './daily-report/daily-report.module';
import { CareerPathModule } from './career-path/career-path.module';
import { SkillsMatrixModule } from './skills-matrix/skills-matrix.module';
import { PipModule } from './pip/pip.module';
import { EnpsModule } from './enps/enps.module';
import { ReceptionModule } from './reception/reception.module';
import { ShiftModule } from './shift/shift.module';
import { AiInterviewV2Module } from './ai-interview-v2/ai-interview-v2.module';
import { TelegramBotsModule } from './telegram-bots/telegram-bots.module';
import { InspectionModule } from './inspection/inspection.module';
import { HrRepository } from './infrastructure/repositories/drizzle-hr.repo';
import { HrLeaveRepo } from './infrastructure/repositories/drizzle-hr-leave.repo';
import { LeaveRepository } from './infrastructure/repositories/drizzle-leave.repo';
import { KpiService } from './domain/services/kpi.service';
import { TaxCalculatorService } from './domain/services/tax-calculator.service';
import { AttritionService } from './analytics/attrition.service';
import { UtilizationService } from './analytics/utilization.service';
import { OvertimeCalculatorService } from './domain/services/overtime-calculator.service';
import { RecordAttendanceHandler } from './application/commands/record-attendance.handler';
import { CalculatePayrollHandler } from './application/commands/calculate-payroll.handler';
import { ApproveLeaveHandler } from './application/commands/approve-leave.handler';
import { RejectLeaveHandler } from './application/commands/reject-leave.handler';
import { CancelLeaveHandler } from './application/commands/cancel-leave.handler';
import { CreateLeaveRequestHandler } from './application/commands/create-leave-request.handler';
import { DeleteLeaveHandler } from './application/commands/delete-leave.handler';
import { Record360FeedbackHandler } from './application/commands/record-360-feedback.handler';
import { EmployeeKpiHandler } from './application/queries/employee-kpi.handler';
import { AttendanceSummaryHandler } from './application/queries/attendance-summary.handler';
import { GetEmployeesHandler } from './application/queries/get-employees.handler';
import { GetPayrollHandler } from './application/queries/get-payroll.handler';
import { GetAttendanceHandler } from './application/queries/get-attendance.handler';
import { GetLeavesHandler } from './application/queries/get-leaves.handler';
import { GetLeaveBalanceHandler } from './application/queries/get-leave-balance.handler';
import { MesTo360Listener } from './infrastructure/event-handlers/mes-completed.listener';
import { HrEmployeesController } from './presentation/hr-employees.controller';
import { HrAttendanceController } from './presentation/hr-attendance.controller';
import { HrPayrollController } from './presentation/hr-payroll.controller';
import { HrLeaveController } from './presentation/hr-leave.controller';
import { HrDashboardController } from './presentation/hr-dashboard.controller';
import { HrDashboardStubsController } from './presentation/hr-dashboard-stubs.controller';
import { HrDashboardExtraController, HrCapitalController } from './presentation/hr-dashboard-extra.controller';
import { HrShiftsCompatController } from './presentation/hr-shifts-compat.controller';
import { HrCompatAController } from './presentation/hr-compat-a.controller';
import { HrCompatSafetyController } from './presentation/hr-compat-safety.controller';
import { HrEmployeesExtController } from './presentation/hr-employees-ext.controller';
import { HrDashboardService } from './application/hr-dashboard.service';
import { HrDashboardRepository } from './application/hr-dashboard.repository';
import { HrCompatAService } from './application/hr-compat-a.service';
import { HrCompatARepository } from './application/hr-compat-a.repository';
import { HrCompatSafetyService } from './application/hr-compat-safety.service';
import { HrCompatSafetyRepository } from './application/hr-compat-safety.repository';
import { HrDashboardExtraService } from './application/hr-dashboard-extra.service';
import { HrDashboardExtraRepository } from './application/hr-dashboard-extra.repository';
import { HrEmployeesExtService } from './application/hr-employees-ext.service';
import { HrEmployeesExtRepository } from './application/hr-employees-ext.repository';
import { HrAttendanceService } from './application/hr-attendance.service';
import { HR_REPO } from './domain/repositories/i-hr.repo';
import { OnboardingController } from './onboarding/onboarding.controller';
import { OnboardingService } from './onboarding/onboarding.service';
import { OnboardingJobService } from './onboarding/onboarding-job.service';
import { RecruitmentController } from './recruitment/recruitment.controller';
import { RecruitmentOffersController } from './recruitment/recruitment-offers.controller';
import { RecruitmentService } from './recruitment/recruitment.service';
import { RecruitmentFunnelService } from './recruitment/recruitment-funnel.service';
import { RecruitmentAssessmentService } from './recruitment/recruitment-assessment.service';
import { DrizzleRecruitmentAssessmentRepository } from './recruitment/repos/drizzle-recruitment-assessment.repo';
import { RecruitmentStatsService } from './recruitment/recruitment-stats.service';
import { RecruitmentStatsRepository } from './recruitment/recruitment-stats.repository';
import { EMPLOYEES_REPO } from './employees/i-employees.repo';
import { DrizzleEmployeesRepository } from './employees/drizzle-employees.repo';
import { EmployeesService } from './employees/employees.service';
import { ATTENDANCE_REPO } from './attendance/i-attendance.repo';
import { DrizzleAttendanceRepository } from './attendance/drizzle-attendance.repo';
import { AttendanceService } from './attendance/attendance.service';
import { HR_PAYROLL_REPO } from './payroll/i-hr-payroll.repo';
import { DrizzleHrPayrollRepository } from './payroll/drizzle-hr-payroll.repo';
import { PayrollService } from './payroll/payroll.service';
import { HR_LEAVE_SVC_REPO } from './leave/i-hr-leave-svc.repo';
import { DrizzleHrLeaveSvcRepository } from './leave/drizzle-hr-leave-svc.repo';
import { LeaveService } from './leave/leave.service';
import { HR_ONBOARDING_REPO } from './onboarding/repos/i-hr-onboarding.repo';
import { DrizzleHrOnboardingRepository } from './onboarding/repos/drizzle-hr-onboarding.repo';
import { HR_RECRUITMENT_FUNNEL_REPO } from './recruitment/repos/i-hr-recruitment-funnel.repo';
import { DrizzleHrRecruitmentFunnelRepository } from './recruitment/repos/drizzle-hr-recruitment-funnel.repo';
import { HrVacanciesController, HrVacanciesPipelineController } from './recruitment/hr-vacancies.controller';
import { HrVacanciesService } from './recruitment/hr-vacancies.service';
import { DrizzleHrVacanciesRepository } from './recruitment/repos/drizzle-hr-vacancies.repo';
import { DrizzleHrVacanciesFunnelRepository } from './recruitment/repos/drizzle-hr-vacancies-funnel.repo';
import { HrSafetyController } from './safety/hr-safety.controller';
import { HrSafetyService } from './safety/hr-safety.service';
import { HrSafetyRepository } from './safety/hr-safety.repository';
import { HrOffboardingController } from './offboarding/hr-offboarding.controller';
import { HrOffboardingService } from './offboarding/hr-offboarding.service';
import { HrOffboardingRepository } from './offboarding/hr-offboarding.repository';
import { HrGsdController } from './presentation/hr-gsd.controller';
import { HrGsdService } from './presentation/hr-gsd.service';
import { HrGsdRepository } from './presentation/hr-gsd.repository';
import { EmployeesForFaceController } from './presentation/employees-for-face.controller';
import { HrEmployeeGoalsController } from './presentation/hr-employee-goals.controller';

const commandHandlers = [
  RecordAttendanceHandler,
  CalculatePayrollHandler,
  ApproveLeaveHandler,
  RejectLeaveHandler,
  CancelLeaveHandler,
  CreateLeaveRequestHandler,
  DeleteLeaveHandler,
  Record360FeedbackHandler,
];

const queryHandlers = [
  EmployeeKpiHandler,
  AttendanceSummaryHandler,
  GetEmployeesHandler,
  GetPayrollHandler,
  GetAttendanceHandler,
  GetLeavesHandler,
  GetLeaveBalanceHandler,
];

const eventListeners = [MesTo360Listener];

const domainServices = [KpiService, TaxCalculatorService, AttritionService, UtilizationService, OvertimeCalculatorService];
const repositories = [LeaveRepository, HrLeaveRepo];

@Module({
  imports: [
    CqrsModule,
    HttpModule,
    HrV2CommonModule,
    DocumentWorkflowModule,
    DisciplineV2Module,
    GamificationModule,
    DailyReportModule,
    CareerPathModule,
    SkillsMatrixModule,
    PipModule,
    EnpsModule,
    ReceptionModule,
    ShiftModule,
    AiInterviewV2Module,
    TelegramBotsModule,
    InspectionModule,
  ],
  controllers: [
    HrDashboardController,
    HrDashboardStubsController,
    HrDashboardExtraController,
    HrCapitalController,
    HrShiftsCompatController,
    HrCompatAController,
    HrCompatSafetyController,
    HrEmployeesExtController,
    HrEmployeesController,
    HrAttendanceController,
    HrPayrollController,
    HrLeaveController,
    OnboardingController,
    RecruitmentController,
    RecruitmentOffersController,
    HrVacanciesController,
    HrVacanciesPipelineController,
    HrSafetyController,
    HrOffboardingController,
    HrGsdController,
    EmployeesForFaceController,
    AttendanceFaceController,
    HrEmployeeGoalsController,
  ],
  providers: [
    HrRepository,
    {
      provide: HR_REPO,
      useClass: HrRepository,
    },
    { provide: EMPLOYEES_REPO, useClass: DrizzleEmployeesRepository },
    EmployeesService,
    { provide: ATTENDANCE_REPO, useClass: DrizzleAttendanceRepository },
    AttendanceService,
    { provide: HR_PAYROLL_REPO, useClass: DrizzleHrPayrollRepository },
    PayrollService,
    { provide: HR_LEAVE_SVC_REPO, useClass: DrizzleHrLeaveSvcRepository },
    LeaveService,
    { provide: HR_ONBOARDING_REPO, useClass: DrizzleHrOnboardingRepository },
    { provide: HR_RECRUITMENT_FUNNEL_REPO, useClass: DrizzleHrRecruitmentFunnelRepository },
    ...repositories,
    ...domainServices,
    ...commandHandlers,
    ...queryHandlers,
    ...eventListeners,
    OnboardingService,
    OnboardingJobService,
    RecruitmentService,
    RecruitmentFunnelService,
    RecruitmentAssessmentService,
    DrizzleRecruitmentAssessmentRepository,
    RecruitmentStatsRepository,
    RecruitmentStatsService,
    HrDashboardRepository,
    HrDashboardService,
    HrCompatARepository,
    HrCompatAService,
    HrCompatSafetyRepository,
    HrCompatSafetyService,
    HrDashboardExtraRepository,
    HrDashboardExtraService,
    HrEmployeesExtRepository,
    HrEmployeesExtService,
    HrAttendanceService,
    HrVacanciesService,
    DrizzleHrVacanciesRepository,
    DrizzleHrVacanciesFunnelRepository,
    HrSafetyService,
    HrSafetyRepository,
    HrOffboardingService,
    HrOffboardingRepository,
    HrGsdService,
    HrGsdRepository,
    FaceRecognitionService,
    TerritoryLogRepository,
    TerritoryLogService,
    LateArrivalService,
    DisciplineRecordRepository,
    RoomSnapshotCron,
    TerritoryGateway,
  ],
  exports: [HR_REPO, Record360FeedbackHandler, LeaveRepository, TaxCalculatorService, AttritionService, UtilizationService, OvertimeCalculatorService],
})
export class HrModule {}
