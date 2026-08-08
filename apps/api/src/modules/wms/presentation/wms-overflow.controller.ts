/**
 * @module wms-overflow.controller
 * @description WMS overflow (idish-yaxlitlash) chiqim + chiqim hard-gate tekshiruvi.
 *   - POST /wms/goods-issue/overflow      → idish-overflow chiqim (EP-WMS, OMBOR-INTERVYU §2).
 *   - POST /wms/goods-issue/enforce-check  → EP-WMS-084/085 chiqim hard-gate tekshiruvi.
 */

import {
  Controller, Post, Body, UseGuards, UseInterceptors, Logger,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow } from '@common/http-result';
import { WmsOverflowService } from '../application/wms-overflow.service';
import { OutboundEnforcementService } from '../application/outbound-enforcement.service';

enum Role {
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

const OverflowIssueSchema = z.object({
  sourceWarehouseId: z.number().int().positive(),
  deptWarehouseId: z.number().int().positive(),
  materialId: z.number().int().positive(),
  requestedAmount: z.number().positive(),
  issuedAmount: z.number().positive(),
  ppId: z.number().int().positive().nullable().optional(),
});

const EnforceCheckSchema = z.object({
  materialId: z.number().int().positive(),
  technologyCardId: z.number().int().positive().nullable().optional(),
  issuedLayer: z.number().int().positive().nullable().optional(),
});

@ApiThrottle()
@ApiTags('Wms Overflow + Gates')
@ApiBearerAuth()
@Controller('wms/goods-issue')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class WmsOverflowController {
  private readonly logger = new Logger(WmsOverflowController.name);

  constructor(
    private readonly overflowSvc: WmsOverflowService,
    private readonly enforcementSvc: OutboundEnforcementService,
  ) {}

  @ApiOperation({
    summary: 'Idish-overflow chiqim — ortiqcha bo\'lim ichki omboriga o\'tadi (OMBOR-INTERVYU §2)',
  })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request / yetarli qoldiq yo\'q' })
  @Post('overflow')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async issueWithOverflow(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = OverflowIssueSchema.parse(body);
    const result = await this.overflowSvc.issueWithOverflow({
      sourceWarehouseId: dto.sourceWarehouseId,
      deptWarehouseId: dto.deptWarehouseId,
      materialId: dto.materialId,
      requestedAmount: dto.requestedAmount,
      issuedAmount: dto.issuedAmount,
      ppId: dto.ppId ?? null,
      issuedBy: user?.id ?? null,
    });
    return { data: unwrapOrThrow(result) };
  }

  @ApiOperation({
    summary: 'Chiqim hard-gate tekshiruvi (EP-WMS-084 material / EP-WMS-085 gofra qavat)',
  })
  @ApiResponse({ status: 200, description: 'OK — ruxsat berildi' })
  @ApiResponse({ status: 422, description: 'BLOCK — texkarta/gofra mos kelmadi' })
  @Post('enforce-check')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async enforceCheck(@Body() body: unknown) {
    const dto = EnforceCheckSchema.parse(body);
    const result = await this.enforcementSvc.checkIssueAllowed({
      materialId: dto.materialId,
      technologyCardId: dto.technologyCardId ?? null,
      issuedLayer: dto.issuedLayer ?? null,
    });
    const data = unwrapOrThrow(result);
    if (!data.allowed) {
      throw new HttpException(
        { code: data.blockCode, message: data.message },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return { allowed: true };
  }
}
