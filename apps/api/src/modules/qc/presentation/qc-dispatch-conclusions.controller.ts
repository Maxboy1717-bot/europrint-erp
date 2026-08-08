/**
 * @module qc-dispatch-conclusions.controller
 * @description NestJS controller. Transport-only (Qoida 6); delegates to the service and returns
 * unwrapped Result data. Vision 09-qc #26 — yakuniy sifat xulosasi (PP "Yopildi" + per-dispatch, N+1).
 */

import { Controller, Get, Post, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrInternal, throwFromError } from '@common/http-result';
import { z } from 'zod';
import { QcDispatchConclusionService } from '../application/qc-dispatch-conclusion.service';

const QC_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.QC_SPECIALIST, Role.PRODUCTION_MANAGER, 'qc_manager', 'qc_inspector'];

const DispatchConclusionDto = z.object({
  productionOrderId: z.number().int().positive(),
  deliveryId: z.number().int().positive(),
});

const FinalConclusionDto = z.object({
  productionOrderId: z.number().int().positive(),
});

const ListQuerySchema = z.object({
  productionOrderId: z.coerce.number().int().positive(),
});

/** Resolve the acting user id from the authenticated principal (integer, or null). */
function actingUserId(user: AuthenticatedUser | undefined): number | null {
  const raw = user?.id ?? user?.userId ?? user?.sub;
  return typeof raw === 'number' && Number.isInteger(raw) ? raw : null;
}

@ApiTags('QC')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc/dispatch-conclusions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcDispatchConclusionsController {
  constructor(private readonly svc: QcDispatchConclusionService) {}

  @Get()
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Vision 09-qc#26: PP buyurtma sifat xulosalari (per-dispatch + yakuniy, N+1)' })
  @ApiQuery({ name: 'productionOrderId', type: Number, required: true })
  async list(@Query() query: unknown) {
    const parsed = ListQuerySchema.safeParse(query);
    if (!parsed.success) {
      throwFromError({ code: 'VALIDATION', message: parsed.error.issues[0]?.message ?? 'Invalid query parameters' });
    }
    const { productionOrderId } = (parsed as { success: true; data: { productionOrderId: number } }).data;
    return unwrapOrInternal(await this.svc.getConclusions(productionOrderId));
  }

  @Post('dispatch')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Vision 09-qc#26: qisman yetkazishda dispatch tasdiqlanganda sifat xulosasi' })
  async recordDispatch(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = DispatchConclusionDto.parse(body);
    return unwrapOrInternal(
      await this.svc.recordDispatchConclusion(dto.productionOrderId, dto.deliveryId, actingUserId(user)),
    );
  }

  @Post('final')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Vision 09-qc#26: PP buyurtma "Yopildi" da yakuniy sifat xulosasi' })
  async recordFinal(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = FinalConclusionDto.parse(body);
    return unwrapOrInternal(
      await this.svc.recordFinalConclusion(dto.productionOrderId, actingUserId(user)),
    );
  }
}
