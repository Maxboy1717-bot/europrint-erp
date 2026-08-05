/**
 * @module lms.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { LmsRepository } from './infrastructure/repositories/drizzle-lms.repo';
import { LmsCertRepo } from './infrastructure/repositories/drizzle-lms-cert.repo';
import { LmsExamsRepository } from './infrastructure/repositories/drizzle-lms-exams.repo';
import { LmsTestsRepository } from './infrastructure/repositories/drizzle-lms-tests.repo';
import { LmsMiscRepository } from './infrastructure/repositories/drizzle-lms-misc.repo';
import { LmsCoursesExtendedRepository } from './infrastructure/repositories/drizzle-lms-courses-extended.repo';
import { LmsCoreService } from './application/services/lms-core.service';
import { LmsExamsService } from './application/services/lms-exams.service';
import { LmsCoursesExtendedService } from './application/services/lms-courses-extended.service';
import { LmsTestsService } from './application/services/lms-tests.service';
import { LmsCertificatesStandaloneService } from './application/services/lms-certificates-standalone.service';
import { LmsCertificatePdfService } from './application/services/lms-certificate-pdf.service';
import { LmsMiscService } from './application/services/lms-misc.service';
import { LmsCompletionService } from './application/services/lms-completion.service';
import { LmsCardGateService } from './application/services/lms-card-gate.service';
import { CertificationService } from './domain/services/certification.service';
import { IssueCertificateHandler } from './application/commands/issue-certificate.handler';
import { EnrollCourseHandler } from './application/commands/enroll-course.handler';
import { OperatorCertificationsHandler } from './application/queries/operator-certifications.handler';
import { GetCoursesHandler } from './application/queries/get-courses.handler';
import { GetMyEnrollmentsHandler } from './application/queries/get-my-enrollments.handler';
import { CertExpiryHandler } from './infrastructure/event-handlers/cert-expiry.handler';
import { WeeklyProgressReportHandler } from './infrastructure/event-handlers/weekly-progress-report.handler';
import { CardEmployeeAssignedHandler } from './infrastructure/event-handlers/card-employee-assigned.handler';
import { CourseCompletedCreditHandler } from './infrastructure/event-handlers/course-completed-credit.handler';
import { LmsCoursesController } from './presentation/lms-courses.controller';
import { LmsCertificatesController } from './presentation/lms-certificates.controller';
import { LmsEnrollmentsController } from './presentation/lms-enrollments.controller';
import { LmsCoreController } from './presentation/lms-core.controller';
import { CoursesController } from './presentation/courses.controller';
import { LmsLessonsController, LmsModulesController } from './presentation/lms-lessons.controller';
import { LmsTestsController, LmsQuestionsController, LmsAssignmentsController } from './presentation/lms-tests.controller';
import { LmsAttemptsController } from './presentation/lms-attempts.controller';
import { LmsProgressCompatController } from './presentation/lms-misc.controller';
import { LmsCertificatesStandaloneController } from './presentation/lms-certificates-standalone.controller';
import {
  LmsMicroModulesController,
  LmsKnowledgeController,
  LmsVideoProgressController,
  LmsAchievementsController,
  LmsMentorsController,
} from './presentation/lms-misc.controller';
import { KnowledgeBaseController } from './presentation/knowledge-base.controller';
import { KnowledgeBaseService } from './application/services/knowledge-base.service';
import { KnowledgeBaseRepository } from './infrastructure/repositories/drizzle-knowledge-base.repo';
import { CardRequiredKnowledgeController } from './presentation/card-required-knowledge.controller';
import { CardRequiredKnowledgeService } from './application/services/card-required-knowledge.service';
import { CardRequiredKnowledgeRepository } from './infrastructure/repositories/drizzle-card-required-knowledge.repo';
import { LMS_REPO } from './domain/repositories/i-lms.repo';
import { LMS_COURSES_REPO } from './courses/i-lms-courses.repo';
import { DrizzleLmsCoursesRepository } from './courses/drizzle-lms-courses.repo';
import { CoursesService } from './courses/courses.service';
import { LMS_ENROLLMENTS_REPO } from './enrollments/i-lms-enrollments.repo';
import { DrizzleLmsEnrollmentsRepository } from './enrollments/drizzle-lms-enrollments.repo';
import { EnrollmentsService } from './enrollments/enrollments.service';

const commandHandlers = [IssueCertificateHandler, EnrollCourseHandler];
const queryHandlers = [OperatorCertificationsHandler, GetCoursesHandler, GetMyEnrollmentsHandler];
const eventListeners = [CertExpiryHandler, CardEmployeeAssignedHandler, CourseCompletedCreditHandler, WeeklyProgressReportHandler];

const appControllers = [
  LmsCoursesController,
  LmsCertificatesController,
  LmsEnrollmentsController,
  LmsCoreController,
  CoursesController,
  LmsLessonsController,
  LmsModulesController,
  LmsTestsController,
  LmsQuestionsController,
  LmsAssignmentsController,
  LmsAttemptsController,
  LmsCertificatesStandaloneController,
  LmsMicroModulesController,
  LmsKnowledgeController,
  LmsVideoProgressController,
  LmsAchievementsController,
  LmsMentorsController,
  LmsProgressCompatController,
  KnowledgeBaseController,
  CardRequiredKnowledgeController,
];

const appServices = [
  CertificationService,
  LmsCoreService,
  LmsExamsService,
  LmsCoursesExtendedService,
  LmsTestsService,
  LmsCertificatesStandaloneService,
  LmsCertificatePdfService,
  LmsMiscService,
  CoursesService,
  EnrollmentsService,
  KnowledgeBaseService,
  CardRequiredKnowledgeService,
  // EP-ORG-027 LMS oylik/razryad gate (A73): PURE 3-condition evaluator + DB-wrapper.
  LmsCompletionService,
  LmsCardGateService,
];

const appRepos = [
  LmsCertRepo,
  LmsExamsRepository,
  LmsTestsRepository,
  LmsMiscRepository,
  LmsCoursesExtendedRepository,
  LmsRepository,
  KnowledgeBaseRepository,
  CardRequiredKnowledgeRepository,
  { provide: LMS_REPO, useClass: LmsRepository },
  { provide: LMS_COURSES_REPO, useClass: DrizzleLmsCoursesRepository },
  { provide: LMS_ENROLLMENTS_REPO, useClass: DrizzleLmsEnrollmentsRepository },
];

@Module({
  imports: [AuthModule, CqrsModule, EventEmitterModule.forRoot(), ScheduleModule.forRoot()],
  controllers: appControllers,
  providers: [...appRepos, ...appServices, ...commandHandlers, ...queryHandlers, ...eventListeners],
  // LmsCardGateService exported so HR payroll (FAZA 04) + org-structure razryad (FAZA 03)
  // can consult the LMS oylik/razryad gate via DI (EP-ORG-027, A73).
  exports: [LmsRepository, CertificationService, LMS_REPO, LmsCardGateService],
})
export class LmsModule {}
