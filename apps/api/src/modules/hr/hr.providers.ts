/**
 * @module hr.providers
 * @description Provider/controller arrays for HrModule, extracted per Rule 16 (≤ 300 lines).
 * hr.module.ts spreads these arrays into its @Module() decorator. Keeping them here means
 * the module file itself stays focused on the @Module() definition and imports list.
 */

import { FaceRecognitionService } from './attendance/face-recognition.service';
import { TerritoryLogRepository } from './attendance/territory-log.repository';
import { TerritoryLogService } from './attendance/territory-log.service';
import { LateArrivalService } from './attendance/late-arrival.service';
import { DisciplineRecordRepository } from './attendance/discipline-record.repository';
import { RoomSnapshotCron } from './attendance/room-snapshot.cron';
import { AttendanceFaceController } from './attendance/attendance-face.controller';
import { TerritoryGateway } from './attendance/territory.gateway';
import { HrRepository } from './infrastructure/repositories/drizzle-hr.repo';
import { HrLeaveRepo } from './infrastructure/repositories/drizzle-hr-leave.repo';
import { LeaveRepository } from './infrastructure/repositories/drizzle-leave.repo';
import { KpiService } from './domain/services/kpi.service';
import { AttritionService } from './analytics/attrition.service';
import { UtilizationService } from './analytics/utilization.service';
import { OvertimeCalculatorService } from './domain/services/overtime-calculator.service';
import { RecordAttendanceHandler } from './application/commands/record-attendance.handler';
import { CalculatePayrollHandler } from './application/commands/calculate-payroll.handler';
import { ApproveLeaveHandler } from './application/commands/approve-leave.handler';
import { RejectLeaveHandler } from './application/commands/reject-leave.handler';
import { CancelLeaveHandler } from './application/commands/cancel-leave.handler';
import { CreateLeaveRequestHandler } from './application/commands/create-leave-request.handler';
import { CreateEmployeeHandler } from './application/commands/create-employee.handler';
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
// presentation controllers (route prefix '/hr' unless noted)
import { HrEmployeesController } from './presentation/hr-employees.controller';
import { HrAttendanceController } from './presentation/hr-attendance.controller';
import { HrPayrollController } from './presentation/hr-payroll.controller';
import { HrLeaveController } from './presentation/hr-leave.controller';
import { HrDashboardController } from './presentation/hr-dashboard.controller';
import { HrDashboardExtraController, HrCapitalController } from './presentation/hr-dashboard-extra.controller';
import { HrShiftsCompatController } from './presentation/hr-shifts-compat.controller';
import { HrCompatAController } from './presentation/hr-compat-a.controller';
import { HrCompatSafetyController } from './presentation/hr-compat-safety.controller';
import { HrEmployeesExtController } from './presentation/hr-employees-ext.controller';
// application services + repositories
import { HrDashboardService } from './application/hr-dashboard.service';
import { HrCompatAService } from './application/hr-compat-a.service';
import { HrCompatSafetyService } from './application/hr-compat-safety.service';
import { HrDashboardExtraService } from './application/hr-dashboard-extra.service';
import { HrEmployeesExtService } from './application/hr-employees-ext.service';
import { HrAttendanceService } from './application/hr-attendance.service';
import { HrDashboardRepository } from './infrastructure/repositories/hr-dashboard.repository';
import { HrCompatARepository } from './infrastructure/repositories/hr-compat-a.repository';
import { HrCompatSafetyRepository } from './infrastructure/repositories/hr-compat-safety.repository';
import { HrDashboardExtraRepository } from './infrastructure/repositories/hr-dashboard-extra.repository';
import { HrEmployeesExtRepository } from './infrastructure/repositories/hr-employees-ext.repository';
// DI tokens
import { HR_REPO } from './domain/repositories/i-hr.repo';
import { HR_DASHBOARD_REPO } from './domain/repositories/i-hr-dashboard.repo';
import { HR_COMPAT_A_REPO } from './domain/repositories/i-hr-compat-a.repo';
import { HR_COMPAT_SAFETY_REPO } from './domain/repositories/i-hr-compat-safety.repo';
import { HR_DASHBOARD_EXTRA_REPO } from './domain/repositories/i-hr-dashboard-extra.repo';
import { HR_EMPLOYEES_EXT_REPO } from './domain/repositories/i-hr-employees-ext.repo';
import { OnboardingController } from './onboarding/onboarding.controller';
import { OnboardingService } from './onboarding/onboarding.service';
import { OnboardingJobService } from './onboarding/onboarding-job.service';
import { OnboardingProgressService } from './onboarding/onboarding-progress.service';
import { RecruitmentController } from './recruitment/recruitment.controller';
import { RecruitmentOffersController } from './recruitment/recruitment-offers.controller';
import { RecruitmentService } from './recruitment/recruitment.service';
import { RecruitmentFunnelService } from './recruitment/recruitment-funnel.service';
import { RecruitmentGateway } from './recruitment/recruitment.gateway';
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
import { PayrollClosureService } from './payroll/payroll-closure.service';
import { HrPayrollClosureController } from './payroll/hr-payroll-closure.controller';
import { HR_LEAVE_SVC_REPO } from './leave/i-hr-leave-svc.repo';
import { DrizzleHrLeaveSvcRepository } from './leave/drizzle-hr-leave-svc.repo';
import { LeaveService } from './leave/leave.service';
import { LeaveAccrualService } from './leave/leave-accrual.service';
import { LeaveAccrualJobService } from './leave/leave-accrual-job.service';
import { HrLeaveAccrualController } from './leave/hr-leave-accrual.controller';
import { HR_ONBOARDING_REPO } from './onboarding/repos/i-hr-onboarding.repo';
import { DrizzleHrOnboardingRepository } from './onboarding/repos/drizzle-hr-onboarding.repo';
import { HR_RECRUITMENT_FUNNEL_REPO } from './recruitment/repos/i-hr-recruitment-funnel.repo';
import { DrizzleHrRecruitmentFunnelRepository } from './recruitment/repos/drizzle-hr-recruitment-funnel.repo';
import {
  HrVacanciesController,
  HrVacanciesPipelineController,
  HrVacanciesProbationController,
  HrVacanciesAnalyticsController,
} from './recruitment/hr-vacancies.controller';
import { HrVacanciesService } from './recruitment/hr-vacancies.service';
import { DrizzleHrVacanciesRepository } from './recruitment/repos/drizzle-hr-vacancies.repo';
import { DrizzleHrVacanciesFunnelRepository } from './recruitment/repos/drizzle-hr-vacancies-funnel.repo';
import { HrSafetyController } from './safety/hr-safety.controller';
import { HrSafetyService } from './safety/hr-safety.service';
import { HrSafetyRepository } from './safety/hr-safety.repository';
import { HrOffboardingController } from './offboarding/hr-offboarding.controller';
import { HrOffboardingService } from './offboarding/hr-offboarding.service';
import { HrOffboardingRepository } from './offboarding/hr-offboarding.repository';
import { OffboardingWorkflowService } from './offboarding/offboarding-workflow.service';
import { HrGsdController } from './presentation/hr-gsd.controller';
import { HrGsdService } from './presentation/hr-gsd.service';
import { HrGsdRepository } from './presentation/hr-gsd.repository';
import { EmployeesForFaceController } from './presentation/employees-for-face.controller';
import { HrEmployeeGoalsController } from './presentation/hr-employee-goals.controller';
import { ValidateController } from '../common/presentation/validate.controller';
import { Feedback360Controller } from './feedback-360/feedback-360.controller';
import { Feedback360Service } from './feedback-360/feedback-360.service';
import { Feedback360Repository } from './feedback-360/feedback-360.repo';
import { HrAssetsController } from './hr-assets/hr-assets.controller';
import { HrAssetsService } from './hr-assets/hr-assets.service';
import { HrAssetsRepository } from './hr-assets/hr-assets.repository';
import { HrAssetsSchemaService } from './hr-assets/hr-assets-schema.service';
import { HrAssetsSchemaRepository } from './hr-assets/hr-assets-schema.repository';
import { ApplicationsController } from './applications/applications.controller';
import { ApplicationResponsesController } from './applications/application-responses.controller';
import { ApplicationsService } from './applications/applications.service';
import { ApplicationsRepository } from './applications/applications.repository';
import { HrQuestionnaireController } from './presentation/hr-questionnaire.controller';

export const hrCommandHandlers = [
  RecordAttendanceHandler, CalculatePayrollHandler, ApproveLeaveHandler,
  RejectLeaveHandler, CancelLeaveHandler, CreateLeaveRequestHandler,
  CreateEmployeeHandler, DeleteLeaveHandler, Record360FeedbackHandler,
];

export const hrQueryHandlers = [
  EmployeeKpiHandler, AttendanceSummaryHandler, GetEmployeesHandler, GetPayrollHandler,
  GetAttendanceHandler, GetLeavesHandler, GetLeaveBalanceHandler,
];

export const hrEventListeners = [MesTo360Listener];

export const hrDomainServices = [
  KpiService, AttritionService, UtilizationService, OvertimeCalculatorService,
];

export const hrLegacyRepositories = [LeaveRepository, HrLeaveRepo];

export const hrControllers = [
  HrDashboardController,
  // TODO HR-STUB-DUP: Both stub controllers removed — their routes
  // duplicate HrDashboardController (Fastify rejects duplicates).
  // - HrDashboardStubsController: 22 of 26 routes are duplicates
  // - HrDashboardStubsWriteController: similar collisions on POST/PUT
  // Follow-up: either (a) extract unique stubs into a /v2 prefix controller,
  // or (b) convert HrDashboardController mock returns to notImplemented() 501.
  // HrDashboardStubsController,
  // HrDashboardStubsWriteController,
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
  HrVacanciesProbationController,
  HrVacanciesAnalyticsController,
  HrSafetyController,
  HrOffboardingController,
  HrPayrollClosureController,
  HrLeaveAccrualController,
  HrGsdController,
  EmployeesForFaceController,
  AttendanceFaceController,
  HrEmployeeGoalsController,
  // PA3-17 Wave 3: merged from feedback-360, hr-assets
  ValidateController,
  Feedback360Controller,
  HrAssetsController,
  // PA3-17 Wave 5: merged from modules/applications/
  ApplicationsController,
  ApplicationResponsesController,
  HrQuestionnaireController,
];

export const hrProviders = [
  HrRepository,
  { provide: HR_REPO, useClass: HrRepository },
  { provide: EMPLOYEES_REPO, useClass: DrizzleEmployeesRepository },
  EmployeesService,
  { provide: ATTENDANCE_REPO, useClass: DrizzleAttendanceRepository },
  AttendanceService,
  { provide: HR_PAYROLL_REPO, useClass: DrizzleHrPayrollRepository },
  PayrollClosureService,
  PayrollService,
  { provide: HR_LEAVE_SVC_REPO, useClass: DrizzleHrLeaveSvcRepository },
  LeaveService,
  LeaveAccrualService,
  LeaveAccrualJobService,
  { provide: HR_ONBOARDING_REPO, useClass: DrizzleHrOnboardingRepository },
  { provide: HR_RECRUITMENT_FUNNEL_REPO, useClass: DrizzleHrRecruitmentFunnelRepository },
  ...hrLegacyRepositories,
  ...hrDomainServices,
  ...hrCommandHandlers,
  ...hrQueryHandlers,
  ...hrEventListeners,
  OnboardingService,
  OnboardingJobService,
  OnboardingProgressService,
  RecruitmentService,
  RecruitmentFunnelService,
  RecruitmentGateway,
  RecruitmentAssessmentService,
  DrizzleRecruitmentAssessmentRepository,
  RecruitmentStatsRepository,
  RecruitmentStatsService,
  HrDashboardRepository,
  { provide: HR_DASHBOARD_REPO, useClass: HrDashboardRepository },
  HrDashboardService,
  HrCompatARepository,
  { provide: HR_COMPAT_A_REPO, useClass: HrCompatARepository },
  HrCompatAService,
  HrCompatSafetyRepository,
  { provide: HR_COMPAT_SAFETY_REPO, useClass: HrCompatSafetyRepository },
  HrCompatSafetyService,
  HrDashboardExtraRepository,
  { provide: HR_DASHBOARD_EXTRA_REPO, useClass: HrDashboardExtraRepository },
  HrDashboardExtraService,
  HrEmployeesExtRepository,
  { provide: HR_EMPLOYEES_EXT_REPO, useClass: HrEmployeesExtRepository },
  HrEmployeesExtService,
  HrAttendanceService,
  HrVacanciesService,
  DrizzleHrVacanciesRepository,
  DrizzleHrVacanciesFunnelRepository,
  HrSafetyService,
  HrSafetyRepository,
  HrOffboardingService,
  HrOffboardingRepository,
  OffboardingWorkflowService,
  HrGsdService,
  HrGsdRepository,
  FaceRecognitionService,
  TerritoryLogRepository,
  TerritoryLogService,
  LateArrivalService,
  DisciplineRecordRepository,
  RoomSnapshotCron,
  TerritoryGateway,
  // PA3-17 Wave 3: merged from modules/feedback-360/
  Feedback360Service,
  Feedback360Repository,
  // PA3-17 Wave 3: merged from modules/hr-assets/
  HrAssetsService,
  HrAssetsRepository,
  HrAssetsSchemaService,
  HrAssetsSchemaRepository,
  // PA3-17 Wave 5: merged from modules/applications/
  ApplicationsRepository,
  ApplicationsService,
];

export const hrExports = [
  HR_REPO, Record360FeedbackHandler, LeaveRepository,
  AttritionService, UtilizationService, OvertimeCalculatorService,
  Feedback360Service, ApplicationsService,
];
