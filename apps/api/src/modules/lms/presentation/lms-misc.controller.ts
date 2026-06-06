/**
 * @module lms-misc.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };

import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '@common/types/user.types';
import { LmsMiscService } from '../application/services/lms-misc.service';
import { VideoProgressSchema, VideoProgressDto } from './dto/courses.dto';
import { notImplemented } from '@common/exceptions/not-implemented';

@ApiThrottle()
@ApiTags('Lms Misc')
@ApiBearerAuth()
@Controller('micro-modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsMicroModulesController {
  constructor(private readonly svc: LmsMiscService) {}

  @ApiOperation({ summary: 'List micro modules' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listMicroModules() {
    const result = await this.svc.listMicroModules();
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Record view' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/view')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  async recordView(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const userId = String(user?.id ?? 0);
    const result = await this.svc.recordMicroModuleView(id, userId);
    const data = unwrapOrInternal(result);
    return { message: "Ko'rildi", data };
  }

  @ApiOperation({ summary: 'Patch record view' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/view')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  async patchRecordView(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const userId = String(user?.id ?? 0);
    const result = await this.svc.recordMicroModuleView(id, userId);
    const data = unwrapOrInternal(result);
    return { message: "Ko'rildi", data };
  }

  @ApiOperation({ summary: 'Create micro module' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async createMicroModule(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = (body ?? {}) as Record<string, unknown>;
    const r = await db.execute(sql`
      INSERT INTO micro_modules (title, title_ru, course_id, description, sort_order, is_active, created_by, created_at, updated_at)
      VALUES (
        ${String(dto['title'] ?? dto['titleUz'] ?? '')}::text,
        ${dto['title_ru'] ?? dto['titleRu'] ?? null}::text,
        ${dto['course_id'] ?? dto['courseId'] ?? null}::int,
        ${dto['description'] ?? null}::text,
        ${Number(dto['sort_order'] ?? dto['sortOrder'] ?? 0)}::int,
        ${dto['is_active'] !== false}::boolean,
        ${user?.id ?? 0}::int,
        NOW(), NOW()
      )
      RETURNING id, title
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? null;
    return { message: 'Mikro modul yaratildi', data: row };
  }
}

@ApiThrottle()
@Controller('lms-knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsKnowledgeController {
  constructor(private readonly svc: LmsMiscService) {}

  @ApiOperation({ summary: 'List knowledge' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listKnowledge(@Query('q') query?: string) {
    const result = await this.svc.listKnowledge(query);
    return unwrapOrInternal(result);
  }
}

@ApiThrottle()
@Controller('video-progress')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsVideoProgressController {
  constructor(private readonly svc: LmsMiscService) {}

  @ApiOperation({ summary: 'List video progress' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async listVideoProgress(@CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.svc.listVideoProgress(String(user?.id ?? 0)));
  }

  @ApiOperation({ summary: 'Save video progress' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(VideoProgressSchema))
  async saveVideoProgress(
    @Body() dto: VideoProgressDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const payload = { ...dto, employeeId: String(user?.id ?? 0) } as Record<string, unknown>;
    const result = await this.svc.saveVideoProgress(payload);
    const data = unwrapOrInternal(result);
    return { message: 'Video progressi saqlandi', data };
  }
}

@ApiThrottle()
@Controller('achievements')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsAchievementsController {
  constructor(private readonly svc: LmsMiscService) {}

  @ApiOperation({ summary: 'List achievements' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listAchievements(@CurrentUser() user: AuthenticatedUser) {
    const userId = String(user?.id ?? '');
    const result = await this.svc.listAchievements(userId || undefined);
    return unwrapOrInternal(result);
  }
}

@ApiThrottle()
@Controller('mentors')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsMentorsController {
  constructor(private readonly svc: LmsMiscService) {}

  @ApiOperation({ summary: 'List mentors' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listMentors(@Query('specialization') specialization?: string) {
    const result = await this.svc.listMentors(specialization);
    return unwrapOrInternal(result);
  }
}

@ApiThrottle()
@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsProgressCompatController {
  constructor(private readonly svc: LmsMiscService) {}

  @ApiOperation({ summary: 'List progress' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listProgress() {
    return unwrapOrInternal(await this.svc.listAllProgress());
  }

  @ApiOperation({ summary: 'Get user progress' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('user/:id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getUserProgress(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getProgressByUser(id));
  }

  @ApiOperation({ summary: 'Progress summary stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('summary')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getProgressSummary() {
    const r = await db.execute(sql`
      SELECT
        COUNT(*)::int                                                 AS total,
        SUM(CASE WHEN completed = true  THEN 1 ELSE 0 END)::int     AS completed,
        SUM(CASE WHEN completed = false THEN 1 ELSE 0 END)::int     AS in_progress
      FROM course_progress
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? { total: 0, completed: 0, in_progress: 0 };
    return { summary: row };
  }
}
