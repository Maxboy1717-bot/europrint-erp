/**
 * @module wms-counts.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import {
BadRequestException, Body, Controller, Delete, Get, NotFoundException,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors, Logger, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  WmsCreateInventoryCountSchema, WmsCreateInventoryCountDto,
  WmsCreateInternalRequestSchema, WmsCreateInternalRequestDto,
  WmsUpdateInternalRequestSchema, WmsUpdateInternalRequestDto,
} from './dto/wms-counts.dto';
import { assertOk, throwFromError, unwrapOrInternal, unwrapOrNotFound, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { safeInt } from '../../hr/common/db-rows';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { WmsCountsService } from '../application/wms-counts.service';
import { WmsCrudService } from '../application/wms-crud.service';

const WMS_WRITE_ROLES = ['warehouse_manager', 'ERP_MANAGER', 'mm_manager', 'super_admin', 'director'];
const WMS_FLOOR_ROLES = ['WAREHOUSE_WORKER', 'warehouse_manager', 'ERP_MANAGER', 'mm_manager', 'super_admin', 'director'];

@ApiThrottle()
@ApiTags('Wms Counts')
@Controller('wms')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...WMS_WRITE_ROLES)
export class WmsCountsController {
  private readonly logger = new Logger(WmsCountsController.name);

  constructor(
    private readonly svc: WmsCountsService,
    private readonly crudSvc: WmsCrudService,
  ) {}

  @ApiOperation({ summary: 'List inventory counts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('inventory-counts')
  async listInventoryCounts(
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const r = await this.svc.listInventoryCounts(warehouseId, status, safeInt(limit, 20));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create inventory count' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('inventory-counts')
  @UsePipes(new ZodValidationPipe(WmsCreateInventoryCountSchema))
  async createInventoryCount(@Body() body: WmsCreateInventoryCountDto) {
    const { warehouse_id, counted_by, notes } = body;
    assertRequired(warehouse_id, 'warehouse_id required');
    return unwrapOrThrow(await this.svc.createInventoryCount(safeInt(warehouse_id, 0), counted_by != null ? safeInt(counted_by, 0) : null, notes != null ? String(notes) : null));
  }

  @ApiOperation({ summary: 'Delete inventory count' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('inventory-counts/:id')
  @UsePipes(new ZodValidationPipe(WmsCreateInventoryCountSchema))
  async deleteInventoryCount(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.crudSvc.softDeleteInventoryCount(id, user?.id ?? null);
    return unwrapOrNotFound(r);
  }

  @ApiOperation({ summary: 'List internal requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('internal-requests')
  async listInternalRequests(@Query('status') status?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.listInternalRequests(status, safeInt(limit, 50)));
  }

  @ApiOperation({ summary: 'Create internal request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('internal-requests')
  @UsePipes(new ZodValidationPipe(WmsCreateInternalRequestSchema))
  @Roles(...WMS_FLOOR_ROLES)
  async createInternalRequest(@Body() body: WmsCreateInternalRequestDto, @CurrentUser() user: AuthenticatedUser) {
    const { from_warehouse_id, to_warehouse_id, material_id, quantity, notes } = body;
    assertRequired(material_id, 'material_id and quantity required');
    assertRequired(quantity, 'material_id and quantity required');
    return unwrapOrThrow(await this.svc.createInternalRequest(user?.id ?? null, from_warehouse_id != null ? safeInt(from_warehouse_id, 0) : null, to_warehouse_id != null ? safeInt(to_warehouse_id, 0) : null, safeInt(material_id, 0), safeInt(quantity, 0), notes != null ? String(notes) : null));
  }

  @ApiOperation({ summary: 'Update internal request' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('internal-requests/:id')
  @UsePipes(new ZodValidationPipe(WmsUpdateInternalRequestSchema))
  async updateInternalRequest(@Param('id') id: string, @Body() body: WmsUpdateInternalRequestDto) {
    const { status, notes } = body;
    const _rR = await this.svc.updateInternalRequest(safeInt(id, 0), status != null ? String(status) : null, notes != null ? String(notes) : null);
    assertOk(_rR);
    const r = _rR.data;
    assertFound(r, 'Request not found');
    const items = Array.isArray(r) ? r : [];
    return items[0];
  }

  @ApiOperation({ summary: 'List batches' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('batches')
  async listBatches(@Query('materialId') materialId?: string, @Query('warehouseId') warehouseId?: string, @Query('expiring') expiring?: string) {
    return unwrapOrInternal(await this.svc.listBatches(materialId, warehouseId, expiring));
  }

  @ApiOperation({ summary: 'Get production supply' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('production-supply')
  async getProductionSupply(@Query('sessionId') sessionId?: string) {
    return unwrapOrInternal(await this.svc.getProductionSupply(sessionId));
  }
}
