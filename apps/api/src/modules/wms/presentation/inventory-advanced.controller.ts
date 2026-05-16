/**
 * @module inventory-advanced.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Role } from '@common/constants/roles.constants';
import { InventoryAdvancedService } from '../application/inventory-advanced.service';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { unwrapOrInternal } from '@common/http-result';
@ApiThrottle()
@ApiTags('Inventory Advanced')
@ApiBearerAuth()
@Controller('inventory/advanced')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.WAREHOUSE_KEEPER)
@UseInterceptors(AuditInterceptor)
export class InventoryAdvancedController {
  constructor(private readonly svc: InventoryAdvancedService) {}

  @ApiOperation({ summary: 'Get analytics' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('analytics')
  async getAnalytics() {
    return unwrapOrInternal(await this.svc.getAnalytics());
  }

  @ApiOperation({ summary: 'Get counts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('counts')
  async getCounts(
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const limit = Math.min(parseInt(limitParam ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const offset = parseInt(offsetParam ?? '0', 10) || 0;
    const result = await this.svc.getCounts(status, warehouseId, limit, offset);
    const items = Array.isArray(result) ? result : (result?.items ?? []);
    return { items, total: Array.isArray(items) ? items.length : 0 };
  }

  @ApiOperation({ summary: 'Get barcode assignments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('barcodes')
  async getBarcodeAssignments(
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const limit = Math.min(parseInt(limitParam ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const offset = parseInt(offsetParam ?? '0', 10) || 0;
    return unwrapOrInternal(await this.svc.getBarcodeAssignments(limit, offset));
  }
}
