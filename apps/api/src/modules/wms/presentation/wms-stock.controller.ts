/**
 * @module wms-stock.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { BadRequestException, Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { GetStockInventoryQuery } from '../application/queries/get-stock-inventory.query';
import { FefoStockQuery } from '../application/queries/fefo-stock.handler';
import { WmsCrudService } from '../application/wms-crud.service';
import { PatchStockDto } from './dto/wms-crud.dto';
import { ReserveMaterialCommand } from '../application/commands/reserve-material.handler';

enum Role {
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

@ApiThrottle()
@ApiTags('Wms Stock')
@ApiBearerAuth()
@Controller('wms/stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class WmsStockController {
  private readonly logger = new Logger(WmsStockController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private readonly crudSvc: WmsCrudService,
    private readonly i18n: I18nService,
  ) {}

  // A2/green-lie retire (2026-06-05): `POST /api/wms/stock` `createStock()` returned
  // {success:true} and wrote NOTHING. Stock rows are created canonically via goods-receipt
  // (mm-goods) + POS/WMS sync, never by this bare POST (no FE caller; no crudSvc create method).
  // Removed rather than double-write a second stock writer. See docs/yashil-yolgon-reja-2026-06-05.md A1.

  @ApiOperation({ summary: 'List stock' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async listStock(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.queryBus.execute(new GetStockInventoryQuery({ page: Number(page), limit: Number(limit) }));
    const items = result?.data?.items;
    const total = result?.data?.total ?? (Array.isArray(items) ? items.length : 0);
    return { items: Array.isArray(items) ? items : [], total };
  }

  @ApiOperation({ summary: 'Get stock' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getStock(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Getting stock id=${id}`);
    const result = await this.crudSvc.getStockById(id);
    const row = result.ok ? result.data : null;
    if (!row) throw new NotFoundException(await this.i18n.t('errors.stockNotFound', { args: { id } }));
    return { data: row };
  }

  @ApiOperation({ summary: 'Get fefo stock' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fefo/:materialId/:warehouseId')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getFefoStock(
    @Param('materialId') materialId: number,
    @Param('warehouseId') warehouseId: number,
  ) {
    const query = new FefoStockQuery(materialId, warehouseId);
    const res = await this.queryBus.execute(query);
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Reserve stock' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('reserve')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async reserveStock(@Body() dto: Record<string, unknown>) {
    const materialId = Number(dto['materialId'] ?? dto['material_id']);
    const warehouseId = Number(dto['warehouseId'] ?? dto['warehouse_id']);
    const quantity    = Number(dto['quantity']);
    const orderId     = Number(dto['orderId'] ?? dto['order_id'] ?? 0);

    if (!materialId || !warehouseId || !quantity) {
      throw new BadRequestException(await this.i18n.t('errors.materialWarehouseQtyRequired'));
    }

    this.logger.log(`Reserving stock: materialId=${materialId}, warehouseId=${warehouseId}, qty=${quantity}`);
    const command = new ReserveMaterialCommand(materialId, warehouseId, quantity, orderId);
    const result  = await this.commandBus.execute(command);
    return unwrapOrThrow(result);
  }

  @ApiOperation({ summary: 'Patch stock' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async patchStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchStockDto,
  ) {
    const data = unwrapOrThrow(await this.crudSvc.patchStock(id, dto as Record<string, unknown>));
    return { data };
  }

  @ApiOperation({ summary: 'Delete stock' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async deleteStock(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = unwrapOrThrow(await this.crudSvc.softDeleteStock(id, user?.id ?? null));
    return data;
  }
}
