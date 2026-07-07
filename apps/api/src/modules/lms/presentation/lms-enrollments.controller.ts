/**
 * @module lms-enrollments.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertRequired } from '@common/assertions';
import {
BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { LmsRepository } from '../infrastructure/repositories/drizzle-lms.repo';
import { EnrollCourseCommand } from '../application/commands/enroll-course.handler';
import { AuthenticatedUser } from '@auth/types';
import {
  LmsEnrollEmployeeSchema, LmsEnrollEmployeeDto,
  LmsUpdateProgressSchema, LmsUpdateProgressDto,
  LmsCompleteEnrollmentSchema, LmsCompleteEnrollmentDto,
} from '../dto/lms.dto';
import {
  COURSE_COMPLETED_EVENT,
  CourseCompletedPayload,
} from '../infrastructure/event-handlers/course-completed-credit.handler';

@ApiThrottle()
@ApiTags('Lms Enrollments')
@ApiBearerAuth()
@Controller('lms/enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsEnrollmentsController {
  private readonly logger = new Logger(LmsEnrollmentsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly lmsRepo: LmsRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  /**
   * T10-10 (Q562): emit `lms.course.completed` so CourseCompletedCreditHandler can replicate a
   * universal-course completion onto the employee's other cards. Resolves the enrollment's
   * (employee, course, sourceCard) tuple first; emit is best-effort — a resolve/emit failure is
   * logged and swallowed so it never fails the completion HTTP response (the enrollment is committed).
   */
  private async emitCourseCompleted(enrollmentId: string, completedBy?: number): Promise<void> {
    try {
      const ctxR = await this.lmsRepo.getEnrollmentCardContext(enrollmentId);
      if (!ctxR.ok) {
        this.logger.warn(`emitCourseCompleted: context o'qib bo'lmadi (${enrollmentId}): ${ctxR.error.message}`);
        return;
      }
      const payload: CourseCompletedPayload = {
        employeeId: ctxR.data.employeeId,
        courseId: ctxR.data.courseId,
        sourceCardId: ctxR.data.cardId ?? undefined,
        completedBy,
      };
      this.eventEmitter.emit(COURSE_COMPLETED_EVENT, payload);
    } catch (error: unknown) {
      this.logger.error(`emitCourseCompleted xato (${enrollmentId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @ApiOperation({ summary: 'Get enrollments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getEnrollments(@Query() query: { userId?: string; employeeId?: string; status?: string; page?: string; limit?: string }) {
    const userId = query.userId ?? query.employeeId;
    assertRequired(userId, await this.i18n.t('validation.userIdOrEmployeeIdRequired'));
    const result = await this.lmsRepo.findEnrollmentsByUser(userId, {
      status: query.status,
      page: parseInt(query.page ?? '1', 10),
      limit: parseInt(query.limit ?? '20', 10),
    });
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Get my enrollments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('my')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  async getMyEnrollments(@CurrentUser() user: AuthenticatedUser, @Query() query: { status?: string; page?: string; limit?: string }) {
    const userId = String(user?.employeeId ?? user?.sub ?? user?.id ?? '');
    assertRequired(userId, await this.i18n.t('errors.currentUserNotIdentified'));
    const result = await this.lmsRepo.findEnrollmentsByUser(userId, {
      status: query.status,
      page: parseInt(query.page ?? '1', 10),
      limit: parseInt(query.limit ?? '20', 10),
    });
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Enroll employee' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @UsePipes(new ZodValidationPipe(LmsEnrollEmployeeSchema))
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN')
  async enrollEmployee(@Body() body: LmsEnrollEmployeeDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Enrolling employee ${body.employeeId} in course ${body.courseId}`);
    const result = await this.commandBus.execute(
      new EnrollCourseCommand(
        body.employeeId,
        body.courseId,
        body.courseName ?? String(body.courseId),
        user?.employeeId ?? user?.sub ?? 0,
      ),
    );
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Update progress' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/progress')
  @UsePipes(new ZodValidationPipe(LmsUpdateProgressSchema))
  @Roles('EMPLOYEE', 'TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN')
  async updateProgress(@Param('id') id: string, @Body() body: LmsUpdateProgressDto, @CurrentUser() user?: AuthenticatedUser) {
    const newStatus = body.progressPercent >= 100 ? 'completed' : (body.status ?? 'in_progress');
    const result = await this.lmsRepo.updateEnrollment(id, {
      status: newStatus,
      score: body.progressPercent,
      completed_at: body.progressPercent >= 100 ? _time.now() : undefined,
    });
    assertOk(result);
    // T10-10 (Q562): a completed universal course credits the employee's other cards (cross-card credit).
    if (newStatus === 'completed') {
      await this.emitCourseCompleted(id, Number(user?.employeeId ?? user?.sub ?? user?.id) || undefined);
    }
    return result.data;
  }

  @ApiOperation({ summary: 'Complete enrollment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/complete')
  @UsePipes(new ZodValidationPipe(LmsCompleteEnrollmentSchema))
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN')
  async completeEnrollment(@Param('id') id: string, @Body() body: LmsCompleteEnrollmentDto, @CurrentUser() user?: AuthenticatedUser) {
    this.logger.log(`Completing enrollment ${id} with score ${body.score}`);
    const result = await this.lmsRepo.updateEnrollment(id, {
      status: 'completed',
      score: body.score,
      completed_at: _time.now(),
    });
    assertOk(result);
    // T10-10 (Q562): a completed universal course credits the employee's other cards (cross-card credit).
    await this.emitCourseCompleted(id, Number(user?.employeeId ?? user?.sub ?? user?.id) || undefined);
    return { message: `Kurs yakunlandi. Ball: ${body.score}`, data: result.data };
  }

  @ApiOperation({ summary: 'Get enrollment stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getEnrollmentStats() {
    const [statusResult, expiringResult] = await Promise.all([
      this.lmsRepo.findExpiringCertificates(30),
      this.lmsRepo.findAllCourses({ page: 1, limit: 1 }),
    ]);
    return {
      expiringCertificates30Days: statusResult.ok ? statusResult.data?.length ?? 0 : 0,
      totalCourses: expiringResult.ok ? expiringResult.data?.total ?? 0 : 0,
    };
  }

  @ApiOperation({ summary: 'Get expiring certificates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('expiring-certificates')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getExpiringCertificates(@Query('days') days?: string) {
    return unwrapOrThrow(await this.lmsRepo.findExpiringCertificates(parseInt(days ?? '30', 10) || 30));
  }
}
