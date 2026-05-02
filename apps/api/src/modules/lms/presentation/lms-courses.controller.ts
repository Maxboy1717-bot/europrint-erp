import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
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
import { GetCoursesQuery } from '../application/queries/get-courses.query';
import { AuthenticatedUser } from '@auth/types';
import { LmsCreateCourseSchema, LmsCreateCourseDto, LmsEnrollEmployeeSchema, LmsEnrollEmployeeDto } from '../dto/lms.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('lms/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsCoursesController {
  private readonly logger = new Logger(LmsCoursesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly lmsRepo: LmsRepository,
  ) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listCourses(@Query() query: { category?: string; isMandatory?: string; page?: string; limit?: string }) {
    const result = await this.queryBus.execute(
      new GetCoursesQuery(
        query.isMandatory !== undefined ? query.isMandatory === 'true' : undefined,
        query.category,
        parseInt(query.page ?? '1', 10),
        parseInt(query.limit ?? '20', 10),
      ),
    );
    assertOk(result);
    return result.data;
  }

  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getCourse(@Param('id') id: string) {
    return unwrapOrThrow(await this.lmsRepo.findCourseById(id));
  }

  @Post()
  @UsePipes(new ZodValidationPipe(LmsCreateCourseSchema))
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async createCourse(
    @Body() body: LmsCreateCourseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log(`Creating course: ${body.title}`);
    const result = await this.lmsRepo.saveCourse({
      id: '',
      title: body.title,
      description: body.description,
      category: body.category,
      is_mandatory: body.isMandatory ?? false,
      passing_score: body.passingScore ?? 70,
      created_by: String(user?.sub ?? user?.id ?? ''),
      created_at: _time.now(),
    });
    assertOk(result);
    return { message: 'Kurs yaratildi', data: result.data };
  }

  @Post('enroll')
  @UsePipes(new ZodValidationPipe(LmsEnrollEmployeeSchema))
  @Roles('TRAINING_OFFICER', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
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
    return { message: 'Xodim kursga yozildi', data: result.data };
  }
}
