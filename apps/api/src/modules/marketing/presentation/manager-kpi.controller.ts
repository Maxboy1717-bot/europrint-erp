/**
 * @module manager-kpi.controller
 * @description Sales-manager KPI karta endpoint (vision 14-90 /
 *   TASDIQ-2146 §14 #90): faollik (activity) + natija (result/conversion)
 *   statistics aggregated per manager.
 *
 * Rule 3: @Query validated with Zod.
 * Rule 6: controller delegates to service; no business logic here.
 * Rule 8/RBAC: JwtAuthGuard + RolesGuard.
 * Rule 10: no fake responses — the service queries the DB.
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';
import { ManagerKpiService } from '../application/manager-kpi.service';

const QuerySchema = z.object({
  managerId: z.coerce.number().int().positive().optional(),
});

@ApiTags('§17 Marketing — Menejer KPI')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
@Roles('super_admin', 'marketing_manager', 'manager', 'director', 'sales_manager')
export class ManagerKpiController {
  constructor(private readonly svc: ManagerKpiService) {}

  @Get('managers/kpi')
  @ApiOperation({
    summary: "Savdo menejer kartasi: faollik + natija statistikasi (per-manager, ixtiyoriy ?managerId filtri)",
  })
  async getManagerKpi(@Query('managerId') managerId?: string) {
    const dto = QuerySchema.parse({ managerId });
    const result = await this.svc.getManagerKpi({ managerId: dto.managerId });
    return unwrapOrThrow(result);
  }
}
