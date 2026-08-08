/**
 * @module qc-override.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Query, Body, HttpCode, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';
import { unwrapOrInternal } from '@common/http-result';
import { QcOverrideService } from '../application/qc-override.service';
import { z } from 'zod';

// qc:override RBAC — faqat sifat boshlig'i + direktor (super_admin/director RolesGuard'da avtomatik bypass).
const QC_OVERRIDE_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.QC_SPECIALIST, 'qc_manager'];

const CreateOverrideDto = z.object({
  inspectionId: z.number().int().positive().optional(),
  reason: z.string().min(1).max(2000),
});

@ApiTags('QC')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcOverrideController {
  constructor(private readonly svc: QcOverrideService) {}

  @Post('overrides')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...QC_OVERRIDE_ROLES)
  @ApiOperation({ summary: 'Record a QC inspection-skip override (qc:override); daily 3 / monthly 15, escalates to director beyond' })
  async createOverride(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = CreateOverrideDto.parse(body);
    // tsc-slip fix (09-qc#35): AuthenticatedUser exposes `id` (number), not `userId`.
    return unwrapOrInternal(await this.svc.recordOverride({
      userId: Number(user.id),
      inspectionId: dto.inspectionId ?? null,
      reason: dto.reason,
    }));
  }

  @Get('overrides')
  @Roles(...QC_OVERRIDE_ROLES)
  @ApiOperation({ summary: 'List recent QC overrides (audit log)' })
  async listOverrides(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrInternal(await this.svc.listOverrides(parseInt(limit ?? '50', 10) || 50, parseInt(offset ?? '0', 10) || 0));
  }
}
