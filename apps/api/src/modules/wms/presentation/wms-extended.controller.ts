/**
 * @module wms-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */import { Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';


import { assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import { z } from 'zod';

const CreateWmsTransactionSchema = z.object({
  warehouse_id: z.union([z.string(), z.number()]),
  material_id: z.union([z.string(), z.number()]),
  type: z.string().min(1).max(50),
  quantity: z.union([z.string(), z.number()]).optional(),
  unit_cost: z.union([z.string(), z.number()]).optional(),
  reference: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

const ScanBarcodeSchema = z.object({
  barcode: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(200).optional(),
}).passthrough();
import { BadRequestException, ParseIntPipe } from '@nestjs/common';
import { assertOk, throwFromError, unwrapOrNotFound, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { WmsExtendedService } from '../application/wms-extended.service';
import { WmsCrudService } from '../application/wms-crud.service';
import { MovementsService } from '../movements/movements.service';
import { PatchTransactionDto } from './dto/wms-crud.dto';

const WMS_WRITE_ROLES = ['warehouse_manager', 'mm_manager', 'super_admin', 'director'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Wms Extended')
@Controller('wms')
export class WmsExtendedController {
  private readonly logger = new Logger(WmsExtendedController.name);

  constructor(
    private readonly svc: WmsExtendedService,
    private readonly crudSvc: WmsCrudService,
    private readonly movementsSvc: MovementsService,
  ) {}

  @ApiOperation({ summary: 'Get total stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats/total')
  async getTotalStats() {
    return unwrapOrThrow(await this.svc.getTotalStats());
  }

  @ApiOperation({ summary: 'Get fifo cost' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('materials/:id/fifo-cost')
  async getFifoCost(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getFifoCost(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'List transactions' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Create transaction' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('transactions')
  @UseGuards(RolesGuard)
  @Roles(...WMS_WRITE_ROLES)
  async createTransaction(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = CreateWmsTransactionSchema.parse(body);
    return unwrapOrThrow(await this.svc.createTransaction(dto as Record<string, unknown>, user?.id ?? null));
  }

  @ApiOperation({ summary: 'Get alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('alerts')
  async getAlerts(@Query('warehouseId') warehouseId?: string, @Query('type') type?: string) {
    return unwrapOrThrow(await this.svc.getAlerts(warehouseId ? safeInt(warehouseId, 0) : null, type));
  }

  @ApiOperation({ summary: 'Check alerts' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('check-alerts')
  @UseGuards(RolesGuard)
  @Roles(...WMS_WRITE_ROLES)
  async checkAlerts(@Body() _body: unknown) {
    z.unknown().parse(_body);
    return unwrapOrThrow(await this.svc.checkAlerts());
  }

  @ApiOperation({ summary: 'Get replenishment suggestions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('suggestions')
  async getReplenishmentSuggestions(@Query('warehouseId') warehouseId?: string) {
    return unwrapOrThrow(await this.svc.getReplenishmentSuggestions(warehouseId ? safeInt(warehouseId, 0) : null));
  }

  @ApiOperation({ summary: 'Get low stock' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('low-stock')
  async getLowStock(@Query('warehouseId') warehouseId?: string) {
    this.logger.log('Getting low stock');
    return unwrapOrThrow(await this.svc.getLowStock(warehouseId ? safeInt(warehouseId, 0) : null));
  }

  @ApiOperation({ summary: 'Scan barcode' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('barcode/scan')
  @UseGuards(RolesGuard)
  @Roles(...WMS_WRITE_ROLES)
  async scanBarcode(@Body() body: unknown) {
    const dto = ScanBarcodeSchema.parse(body);
    this.logger.log('Scanning barcode');
    return unwrapOrThrow(await this.svc.scanBarcode(String(dto.barcode ?? dto.code ?? '')));
  }

  @ApiOperation({ summary: 'Patch transaction' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Delete transaction' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get movements' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('movements')
  async getMovements(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.movementsSvc.findAll({ page: page ? safeInt(page, 1) : 1, limit: limit ? safeInt(limit, 10) : 10 }));
  }
}
