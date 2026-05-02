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
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('lms/enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsEnrollmentsController {
  private readonly logger = new Logger(LmsEnrollmentsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly lmsRepo: LmsRepository,
  ) {}

  @Get()
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getEnrollments(@Query() query: { userId?: string; employeeId?: string; status?: string; page?: string; limit?: string }) {
    const userId = query.userId ?? query.employeeId;
    assertRequired(userId, 'userId yoki employeeId talab qilinadi');
    const result = await this.lmsRepo.findEnrollmentsByUser(userId, {
      status: query.status,
      page: parseInt(query.page ?? '1', 10),
      limit: parseInt(query.limit ?? '20', 10),
    });
    assertOk(result);
    return result.data;
  }

  @Get('my')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  async getMyEnrollments(@CurrentUser() user: AuthenticatedUser, @Query() query: { status?: string; page?: string; limit?: string }) {
    const userId = String(user?.employeeId ?? user?.sub ?? user?.id ?? '');
    assertRequired(userId, 'Foydalanuvchi aniqlanmadi');
    const result = await this.lmsRepo.findEnrollmentsByUser(userId, {
      status: query.status,
      page: parseInt(query.page ?? '1', 10),
      limit: parseInt(query.limit ?? '20', 10),
    });
    assertOk(result);
    return result.data;
  }

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

  @Patch(':id/progress')
  @UsePipes(new ZodValidationPipe(LmsUpdateProgressSchema))
  @Roles('EMPLOYEE', 'TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN')
  async updateProgress(@Param('id') id: string, @Body() body: LmsUpdateProgressDto) {
    const newStatus = body.progressPercent >= 100 ? 'completed' : (body.status ?? 'in_progress');
    const result = await this.lmsRepo.updateEnrollment(id, {
      status: newStatus,
      score: body.progressPercent,
      completed_at: body.progressPercent >= 100 ? _time.now() : undefined,
    });
    assertOk(result);
    return result.data;
  }

  @Patch(':id/complete')
  @UsePipes(new ZodValidationPipe(LmsCompleteEnrollmentSchema))
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN')
  async completeEnrollment(@Param('id') id: string, @Body() body: LmsCompleteEnrollmentDto) {
    this.logger.log(`Completing enrollment ${id} with score ${body.score}`);
    const result = await this.lmsRepo.updateEnrollment(id, {
      status: 'completed',
      score: body.score,
      completed_at: _time.now(),
    });
    assertOk(result);
    return { message: `Kurs yakunlandi. Ball: ${body.score}`, data: result.data };
  }

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

  @Get('expiring-certificates')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getExpiringCertificates(@Query('days') days?: string) {
    return unwrapOrThrow(await this.lmsRepo.findExpiringCertificates(parseInt(days ?? '30', 10) || 30));
  }
}
