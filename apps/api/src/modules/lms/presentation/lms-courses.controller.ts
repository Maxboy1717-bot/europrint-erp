/**
 * @module lms-courses.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { LmsRepository } from '../infrastructure/repositories/drizzle-lms.repo';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { EnrollCourseCommand } from '../application/commands/enroll-course.handler';
import { GetCoursesQuery } from '../application/queries/get-courses.query';
import { AuthenticatedUser } from '@auth/types';
import { LmsCreateCourseSchema, LmsCreateCourseDto, LmsEnrollEmployeeSchema, LmsEnrollEmployeeDto, LmsSetCourseCardSchema, LmsSetCourseCardDto } from '../dto/lms.dto';
import { LMS_GENERAL_PASS_THRESHOLD_PCT } from '../application/constants/lms-completion.constants';

@ApiThrottle()
@ApiTags('Lms Courses')
@ApiBearerAuth()
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

  @ApiOperation({ summary: 'List courses' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  // EP-LMS-001 (card-centric): list darsliklar bound to an org-CARD (org_functions.id).
  // Declared BEFORE @Get(':id') so the literal path segment is not captured by the :id matcher.
  @ApiOperation({ summary: 'List courses by org-card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('by-card/:cardId')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listCoursesByCard(@Param('cardId') cardId: string) {
    const data = unwrapOrThrow(await this.lmsRepo.findCoursesByCard(parseInt(cardId, 10)));
    return { data: data.items, pagination: { total: data.total } };
  }

  @ApiOperation({ summary: 'Get course' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getCourse(@Param('id') id: string) {
    return unwrapOrThrow(await this.lmsRepo.findCourseById(id));
  }

  @ApiOperation({ summary: 'Create course' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
      passing_score: body.passingScore ?? LMS_GENERAL_PASS_THRESHOLD_PCT,
      created_by: String(user?.sub ?? user?.id ?? ''),
      created_at: _time.now(),
      card_id: body.cardId ?? null,
    });
    assertOk(result);
    return { message: 'Kurs yaratildi', data: result.data };
  }

  @ApiOperation({ summary: 'Patch course' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async patchCourse(@Param('id') id: string, @Body() body: unknown) {
    // Was a green-lie (echoed body, no DB). Persist the editable fields to `courses` via COALESCE.
    const b = (body ?? {}) as Record<string, unknown>;
    const r = await db.execute(sql`
      UPDATE courses SET
        title          = COALESCE(${(b.title as string) ?? null}, title),
        title_uz       = COALESCE(${(b.titleUz as string) ?? (b.title_uz as string) ?? null}, title_uz),
        description    = COALESCE(${(b.description as string) ?? null}, description),
        category       = COALESCE(${(b.category as string) ?? null}, category),
        duration_hours = COALESCE(${(b.durationHours ?? b.duration_hours ?? null) as number}::numeric, duration_hours),
        is_mandatory   = COALESCE(${(b.isMandatory ?? b.is_mandatory ?? null) as boolean}::boolean, is_mandatory),
        is_active      = COALESCE(${(b.isActive ?? b.is_active ?? null) as boolean}::boolean, is_active),
        card_id        = COALESCE(${(b.cardId ?? b.card_id ?? null) as number}::integer, card_id),
        updated_at     = NOW()
      WHERE id = ${parseInt(id, 10)}`);
    if (((r as unknown as { rowCount?: number }).rowCount ?? 0) === 0) throw new NotFoundException(`Course #${id} topilmadi`);
    return { id, updated: true };
  }

  // EP-LMS-001 (card-centric): bind/unbind a darslik to an org-CARD (org_functions.id). cardId=null unbinds.
  @ApiOperation({ summary: 'Assign course to org-card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/card')
  @UsePipes(new ZodValidationPipe(LmsSetCourseCardSchema))
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async setCourseCard(@Param('id') id: string, @Body() body: LmsSetCourseCardDto) {
    const result = await this.lmsRepo.setCourseCard(id, body.cardId);
    if (!result.ok) throw new NotFoundException(`Kurs topilmadi: ${id}`);
    return { message: 'Kurs kartaga biriktirildi', data: result.data };
  }

  @ApiOperation({ summary: 'Delete course' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async deleteCourse(@Param('id') id: string) {
    this.logger.log(`Deleting course ${id}`);
    const result = await this.lmsRepo.deleteCourse(id);
    if (!result.ok) throw new NotFoundException(`Kurs topilmadi: ${id}`);
    return { message: 'Kurs o\'chirildi', data: result.data };
  }

  // ===========================================================================
  // T11-04: 3-bosqich kurs-tasdiq workflow (draft -> review -> approved), 2-imzo.
  //   POST :id/submit  = 1-imzo (yuboruvchi): draft -> review.
  //   POST :id/approve = 2-imzo (boshqa tasdiqlovchi): review -> approved (approver != submitter).
  // ===========================================================================

  @ApiOperation({ summary: "Kursni ko'rib chiqishga yuborish (draft -> review)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async submitCourse(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const submittedBy = Number(user?.sub ?? user?.id ?? 0);
    const result = await this.lmsRepo.submitCourseForReview(id, submittedBy);
    if (!result.ok) throwFromError(result.error);
    return { message: "Kurs ko'rib chiqishga yuborildi", data: result.data };
  }

  @ApiOperation({ summary: 'Kursni tasdiqlash (review -> approved, 2-imzo)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles('HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async approveCourse(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const approvedBy = Number(user?.sub ?? user?.id ?? 0);
    const result = await this.lmsRepo.approveCourse(id, approvedBy);
    if (!result.ok) throwFromError(result.error);
    return { message: 'Kurs tasdiqlandi', data: result.data };
  }

  @ApiOperation({ summary: 'Enroll employee' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
