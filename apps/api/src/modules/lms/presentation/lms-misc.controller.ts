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
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
// NOTE: `courseProgress` is only defined in lib/db/src/schema/lms-schema.ts
// (canonical) — the local `@shared/db`/`@europrint/schemas` compat barrel
// (apps/api/src/shared/db/europrint-compat.ts) does not re-export it, so it
// is imported from `@workspace/db` directly. Same Postgres pool/dialect as
// `db` from `@shared/db`, so the table object is safe to use with either.
import { courseProgress } from '@workspace/db';
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
import { VideoProgressSchema, VideoProgressDto, AssignCardMentorSchema, UpdateCardMentorSchema, RateCardMentorSchema } from './dto/courses.dto';
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
    // NOTE: no Drizzle schema exists for `micro_modules` anywhere in the codebase
    // (lib/db/src/schema/*.ts and apps/api/src/shared/db/*.ts both lack a pgTable
    // definition for it — drizzle-lms-misc.repo.ts also reads it via raw SQL) —
    // raw SQL until a schema is added.
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

  // ─── Card Mentors (lms_card_mentors) — EP-ORG-116 karta-markazli mentor CRUD ──────
  // Onboarding davrida KARTAga mentor biriktiriladi (xodimga emas). PHASE-07 darslik item 4.
  // Sub-route `mentors/cards/*` — eski `GET /mentors` (master mentors jadval) buzilmaydi.

  @ApiOperation({ summary: 'List card mentors (optional ?cardId=)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cards')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listCardMentors(@Query('cardId') cardId?: string) {
    const result = await this.svc.listCardMentors(cardId);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Get one card-mentor assignment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('cards/:id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getCardMentor(@Param('id') id: string) {
    const result = await this.svc.getCardMentor(id);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.data;
  }

  @ApiOperation({ summary: 'Assign a mentor to a card' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(AssignCardMentorSchema))
  async assignCardMentor(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = body as { cardId: number; mentorUserId: number; courseId?: number; notes?: string };
    const result = await this.svc.assignCardMentor({
      cardId: dto.cardId,
      mentorUserId: dto.mentorUserId,
      courseId: dto.courseId ?? null,
      notes: dto.notes ?? null,
      assignedBy: Number(user?.id ?? 0) || null,
    });
    if (!result.ok) throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST);
    return { message: 'Mentor kartaga biriktirildi', data: result.data };
  }

  @ApiOperation({ summary: 'Update a card-mentor assignment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('cards/:id')
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateCardMentorSchema))
  async updateCardMentor(@Param('id') id: string, @Body() body: unknown) {
    const dto = body as { courseId?: number; notes?: string };
    const result = await this.svc.updateCardMentor(id, { courseId: dto.courseId ?? null, notes: dto.notes ?? null });
    if (!result.ok) throw new NotFoundException(result.error.message);
    return { message: 'Mentor biriktiruvi yangilandi', data: result.data };
  }

  @ApiOperation({ summary: 'Revoke (soft-delete) a card-mentor assignment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('cards/:id')
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async revokeCardMentor(@Param('id') id: string) {
    const result = await this.svc.revokeCardMentor(id);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return { message: 'Mentor biriktiruvi bekor qilindi', data: result.data };
  }

  // EP-ORG-116 follow-up (2026-07-07): mentor bahosi (0..5) + malaka tasdiqlash
  // (qualification_verified_at/by). Narrower role set than assign/update on purpose —
  // baholash/tasdiqlash HR_SPECIALIST darajasidan yuqori qaror.
  @ApiOperation({ summary: 'Rate a card-mentor assignment and/or verify their qualification' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('cards/:id/rating')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'DIRECTOR', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(RateCardMentorSchema))
  async rateCardMentor(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = body as { rating?: number; verifyQualification?: boolean };
    const verify = dto.verifyQualification === true;
    const result = await this.svc.rateCardMentor(id, {
      rating: dto.rating ?? null,
      qualificationVerified: verify,
      verifiedBy: verify ? (Number(user?.id ?? 0) || null) : null,
    });
    // Repo returns "topilmadi" for a missing/inactive row (dominant path) or a CHECK-constraint
    // message if an out-of-range rating somehow bypasses Zod (0..5) — mirrors updateCardMentor's
    // NotFoundException mapping since "not found" is the only realistically reachable failure.
    if (!result.ok) throw new NotFoundException(result.error.message);
    return { message: 'Mentor bahosi saqlandi', data: result.data };
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
    const rows = await db.select({
      total:       sql<number>`COUNT(*)::int`,
      completed:   sql<number>`SUM(CASE WHEN ${courseProgress.completed} = true  THEN 1 ELSE 0 END)::int`,
      in_progress: sql<number>`SUM(CASE WHEN ${courseProgress.completed} = false THEN 1 ELSE 0 END)::int`,
    }).from(courseProgress);
    const row = rows[0] ?? { total: 0, completed: 0, in_progress: 0 };
    return { summary: row };
  }
}
