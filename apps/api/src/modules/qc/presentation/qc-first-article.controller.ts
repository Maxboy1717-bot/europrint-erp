/**
 * @module qc-first-article.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * 09-qc #62 — first-article approval gate endpoints. POST records the decision; GET reads
 * the gate; POST assert-release is the halt guard (409 while the run is not yet approved).
 */

import { Controller, Get, Post, Param, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';
import { QcFirstArticleService } from '../application/qc-first-article.service';

const QC_FA_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.QC_SPECIALIST, Role.PRODUCTION_MANAGER, 'qc_manager', 'qc_inspector'];

const DecisionDto = z.object({
  productionOrderId: z.coerce.number().int().positive(),
  decision: z.enum(['approved', 'rejected']),
  sampleSize: z.coerce.number().int().min(1).default(1),
  defectCount: z.coerce.number().int().min(0).default(0),
  inspectionId: z.coerce.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});

@ApiTags('QC')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc/first-article')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcFirstArticleController {
  constructor(private readonly svc: QcFirstArticleService) {}

  @Post()
  @Roles(...QC_FA_ROLES)
  @ApiOperation({ summary: 'Record the first-article (birinchi namuna) inspection decision for a run' })
  async recordDecision(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = DecisionDto.parse(body);
    return unwrapOrThrow(await this.svc.recordDecision({
      productionOrderId: dto.productionOrderId,
      decision: dto.decision,
      sampleSize: dto.sampleSize,
      defectCount: dto.defectCount,
      inspectionId: dto.inspectionId ?? null,
      decidedBy: Number.isInteger(user?.id) ? user.id : null,
      notes: dto.notes ?? null,
    }));
  }

  @Get(':productionOrderId')
  @Roles(...QC_FA_ROLES)
  @ApiOperation({ summary: 'First-article gate state for a run (released only when approved)' })
  async getGate(@Param('productionOrderId') productionOrderId: string) {
    return unwrapOrThrow(await this.svc.getReleaseState(Number(productionOrderId)));
  }

  @Post(':productionOrderId/assert-release')
  @Roles(...QC_FA_ROLES)
  @ApiOperation({ summary: "Halt guard: 409 while the run is not first-article-approved (tiraj to'xtatilgan)" })
  async assertRelease(@Param('productionOrderId') productionOrderId: string) {
    return unwrapOrThrow(await this.svc.assertRunReleased(Number(productionOrderId)));
  }
}
