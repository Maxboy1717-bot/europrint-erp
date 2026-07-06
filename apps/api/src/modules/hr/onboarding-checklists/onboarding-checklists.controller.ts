import {
  Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe,
  UseGuards, UseInterceptors, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import { I18nService } from 'nestjs-i18n';
import { createZodDto } from '@anatine/zod-nestjs';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { OnboardingChecklistsService } from './onboarding-checklists.service';
import { unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'admin', 'manager'] as const;

const CreateChecklistSchema = z.object({
  userId: z.union([z.number().int().positive(), z.string()]),
  type: z.enum(['onboarding', 'offboarding']).default('onboarding'),
  fullName: z.string().optional(),
  positionName: z.string().optional(),
  totalItems: z.number().int().positive().optional(),
});
class CreateChecklistDto extends createZodDto(CreateChecklistSchema) {}

const UpdateChecklistSchema = z.object({
  completedItems: z.number().int().min(0),
});
class UpdateChecklistDto extends createZodDto(UpdateChecklistSchema) {}

/**
 * Backs the `/api/hr/onboarding-checklists` family that
 * `HROnboarding.tsx` and `HRExtended.tsx` rely on.
 *
 * Previously these paths were served by a stub in
 * `hr-dashboard.controller.ts` that returned `{ items: [], total: 0 }`,
 * so the onboarding page rendered empty.
 */
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr/onboarding-checklists')
export class OnboardingChecklistsController {
  constructor(
    private readonly svc: OnboardingChecklistsService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * `HROnboarding.tsx:128` calls `GET /api/hr/onboarding-checklists`.
   * Returns `ChecklistItem[]` directly (FE uses `Array.isArray`).
   */
  @Get()
  async list(@Query('type') type?: string) {
    return unwrapOrInternal(await this.svc.list(type));
  }

  /**
   * `HROnboarding.tsx:166` calls `POST /api/hr/onboarding-checklists`
   *   { userId, fullName, positionName, type }
   * `fullName` / `positionName` are FE convenience fields — the persisted
   * row only stores `userId`, `type`, and the counters.
   */
  @Post()
  async create(@Body() body: CreateChecklistDto) {
    const userId = typeof body.userId === 'number' ? body.userId : parseInt(body.userId, 10);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new BadRequestException(await this.i18n.t('validation.userIdMustBePositive'));
    }
    return unwrapOrInternal(
      await this.svc.createForUser({
        userId,
        type: body.type,
        totalItems: body.totalItems,
      }),
    );
  }

  /**
   * `HROnboarding.tsx:157` calls
   *   PATCH /api/hr/onboarding-checklists/:id  { completedItems }
   */
  @Patch(':id')
  async updateProgress(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateChecklistDto,
  ) {
    return unwrapOrInternal(await this.svc.updateProgress(id, body.completedItems));
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getById(id);
    const row = unwrapOrInternal(r);
    if (!row) throw new NotFoundException(await this.i18n.t('errors.onboardingChecklistNotFound', { args: { id } }));
    return row;
  }
}
