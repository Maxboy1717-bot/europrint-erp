/**
 * @module lead-time-reorder.controller
 * @description 10-wms #39 transport layer. POST /api/wms/inventory-policy/:materialId/lead-time
 *   — a supplier lead-time change immediately recomputes the material's reorder point and
 *   auto-drafts a purchase requisition (pending) when the recomputed ROP is breached.
 *   Controller stays transport-only (Qoida 6): validates with Zod, delegates to the service,
 *   unwraps the Result.
 */

import { Body, Controller, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';
import { LeadTimeReorderService } from '../application/lead-time-reorder.service';

const LT_WRITE = ['super_admin', 'warehouse_manager', 'director'];

const ChangeLeadTimeSchema = z.object({
  leadTimeDays: z.coerce.number().int().positive(),
});

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Wms Inventory Policy')
@ApiBearerAuth()
@Controller('wms/inventory-policy')
export class LeadTimeReorderController {
  constructor(private readonly svc: LeadTimeReorderService) {}

  @ApiOperation({ summary: 'Lead-time o\'zgarsa reorder point qayta hisoblanadi + PR loyihasi (draft) avto' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post(':materialId/lead-time')
  @Roles(...LT_WRITE)
  async changeLeadTime(@Param('materialId') materialId: string, @Body() body: unknown) {
    const dto = ChangeLeadTimeSchema.parse(body ?? {});
    return unwrapOrThrow(await this.svc.changeLeadTime(Number(materialId), dto.leadTimeDays));
  }
}
