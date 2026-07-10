/**
 * @module advance-linkage.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import { AdvanceLinkageService } from '../application/advance-linkage.service';

// WMS + Finance o'qiydigan rollar (kross-modul avans↔qabul ko'rinishi).
// RolesGuard case-insensitive + fail-closed; WMS-boshqa controller'lardagi ad-hoc string rollarga mos.
const ADVANCE_LINKAGE_READ_ROLES = [
  'director', 'super_admin', 'finance_manager', 'finance',
  'warehouse_manager', 'mm_manager', 'warehouse_keeper',
];

@ApiThrottle()
@ApiTags('Wms Advance Linkage')
@Controller('wms/advance-linkage')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...ADVANCE_LINKAGE_READ_ROLES)
export class AdvanceLinkageController {
  constructor(private readonly svc: AdvanceLinkageService) {}

  // Vision 10-warehouse #65 (TASDIQ-2146 §10 #65) — yopilmagan avanslar (avans↔yetkazish bog'lanishi).
  @ApiOperation({ summary: 'Unclosed supplier advances linked to goods receipts (avans↔yetkazish, yopilmagan)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('unclosed')
  async listUnclosedAdvances(
    @Query('vendorId') vendorId?: string,
    @Query('purchaseOrderId') purchaseOrderId?: string,
    @Query('limit') limit?: string,
  ) {
    const r = await this.svc.getUnclosedAdvances(
      vendorId ? safeInt(vendorId, 0) : null,
      purchaseOrderId ? safeInt(purchaseOrderId, 0) : null,
      safeInt(limit, 100),
    );
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }
}
