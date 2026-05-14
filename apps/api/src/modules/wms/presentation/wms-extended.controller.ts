/**
 * @module wms-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */import { Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';


import { assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import { BadRequestException, ParseIntPipe } from '@nestjs/common';
import { assertOk, throwFromError, unwrapOrNotFound, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { WmsExtendedService } from '../application/wms-extended.service';
import { WmsCrudService } from '../application/wms-crud.service';
import { PatchTransactionDto } from './dto/wms-crud.dto';

const WMS_WRITE_ROLES = ['warehouse_manager', 'ERP_MANAGER', 'mm_manager', 'super_admin', 'director'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('wms')
export class WmsExtendedController {
  private readonly logger = new Logger(WmsExtendedController.name);

  constructor(
    private readonly svc: WmsExtendedService,
    private readonly crudSvc: WmsCrudService,
  ) {}

  @Get('stats/total')
  async getTotalStats() {
    return unwrapOrThrow(await this.svc.getTotalStats());
  }

  @Get('materials/:id/fifo-cost')
  async getFifoCost(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getFifoCost(safeInt(id, 0)));
  }

  @Get('transactions')
  async listTransactions(@Query('warehouseId') warehouseId?: string, @Query('materialId') materialId?: string,
    @Query('type') type?: string, @Query('from') from?: string, @Query('to') to?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const _rListTransactions = await this.svc.listTransactions(
      warehouseId ? safeInt(warehouseId, 0) : null,
      materialId ? safeInt(materialId, 0) : null,
      type, from, to, safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rListTransactions);
    const items = _rListTransactions.data;
    return Array.isArray(items) ? items : [];
  }

  @Post('transactions')
  @UseGuards(RolesGuard)
  @Roles(...WMS_WRITE_ROLES)
  async createTransaction(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    assertRequired(body.warehouse_id, 'warehouse_id, material_id, and type are required');
    assertRequired(body.material_id, 'warehouse_id, material_id, and type are required');
    assertRequired(body.type, 'warehouse_id, material_id, and type are required');
    return unwrapOrThrow(await this.svc.createTransaction(body, user?.id ?? null));
  }

  @Get('alerts')
  async getAlerts(@Query('warehouseId') warehouseId?: string, @Query('type') type?: string) {
    return unwrapOrThrow(await this.svc.getAlerts(warehouseId ? safeInt(warehouseId, 0) : null, type));
  }

  @Post('check-alerts')
  @UseGuards(RolesGuard)
  @Roles(...WMS_WRITE_ROLES)
  async checkAlerts(@Body() _body: Record<string, unknown>) {
    return unwrapOrThrow(await this.svc.checkAlerts());
  }

  @Get('suggestions')
  async getReplenishmentSuggestions(@Query('warehouseId') warehouseId?: string) {
    return unwrapOrThrow(await this.svc.getReplenishmentSuggestions(warehouseId ? safeInt(warehouseId, 0) : null));
  }

  @Get('low-stock')
  async getLowStock(@Query('warehouseId') warehouseId?: string) {
    this.logger.log('Getting low stock');
    return unwrapOrThrow(await this.svc.getLowStock(warehouseId ? safeInt(warehouseId, 0) : null));
  }

  @Post('barcode/scan')
  @UseGuards(RolesGuard)
  @Roles(...WMS_WRITE_ROLES)
  async scanBarcode(@Body() body: Record<string, unknown>) {
    this.logger.log('Scanning barcode');
    return unwrapOrThrow(await this.svc.scanBarcode(String(body.barcode ?? body.code ?? '')));
  }

  @Patch('transactions/:id')
  @UseGuards(RolesGuard)
  @Roles(...WMS_WRITE_ROLES)
  async patchTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchTransactionDto,
  ) {
    const r = await this.crudSvc.patchTransaction(id, dto as Record<string, unknown>);
    return { data: unwrapOrNotFound(r) };
  }

  @Delete('transactions/:id')
  @UseGuards(RolesGuard)
  @Roles(...WMS_WRITE_ROLES)
  async deleteTransaction(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.crudSvc.softDeleteTransaction(id, user?.id ?? null);
    return unwrapOrNotFound(r);
  }

  @Get('movements')
  async getMovements() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }
}
