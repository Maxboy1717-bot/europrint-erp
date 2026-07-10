/**
 * @module mes-oee-targets.controller
 * @description OEE-target settings CRUD. GET list/current are readable by any
 *   authenticated user; POST (new versioned target) is restricted to НО/direktor
 *   (production_manager/director/super_admin) via RolesGuard — vision 08-mes#36.
 */

import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { safeInt } from '../../hr/common/db-rows';
import { MesOeeTargetsService } from '../application/mes-oee-targets.service';

// НО (Начальник отдела = production_manager) + direktor + super_admin only may set targets.
const MES_OEE_TARGET_ROLES = ['production_manager', 'director', 'super_admin'];

const CreateOeeTargetSchema = z.object({
  station_id:     z.number().int().positive().nullable().optional(),
  target_percent: z.number().min(0).max(100),
  effective_date: z.string().optional(),
});
type CreateOeeTargetDto = z.infer<typeof CreateOeeTargetSchema>;

@ApiThrottle()
@ApiBearerAuth()
@UseInterceptors(AuditInterceptor)
@ApiTags('Mes OEE Targets')
@Controller('mes')
export class MesOeeTargetsController {
  constructor(private readonly svc: MesOeeTargetsService) {}

  @ApiOperation({ summary: 'List OEE targets (all versions)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee-targets')
  async list() {
    return unwrapOrThrow(await this.svc.list());
  }

  @ApiOperation({ summary: 'Current effective OEE target (station_id optional; default = factory-wide 85)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee-targets/current')
  async current(@Query('station_id') stationId?: string) {
    const sid = stationId ? safeInt(stationId, 0) : 0;
    return unwrapOrThrow(await this.svc.getCurrentTarget(sid > 0 ? sid : null));
  }

  @ApiOperation({ summary: 'Set a new OEE target version (НО/direktor only)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden (not НО/direktor)' })
  @Post('oee-targets')
  @UseGuards(RolesGuard)
  @Roles(...MES_OEE_TARGET_ROLES)
  @UsePipes(new ZodValidationPipe(CreateOeeTargetSchema))
  async create(@Body() body: CreateOeeTargetDto, @CurrentUser() user: AuthenticatedUser) {
    const r = unwrapOrThrow(
      await this.svc.createTarget(body.station_id ?? null, body.target_percent, body.effective_date ?? null, user?.id ?? null),
    );
    return r[0];
  }
}
