/**
 * @module wms-warehouses.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertRequired } from '@common/assertions';
import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, UseInterceptors, Query, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { assertOk, throwFromError, unwrapOrNotFound, unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { CreateWarehouseCommand } from '../application/commands/create-warehouse.command';
import { GetWarehousesQuery } from '../application/queries/get-warehouses.query';
import { CreateWarehouseDtoSchema, CreateWarehouseDto } from './dto/wms-extended.dto';
import { WmsCrudService } from '../application/wms-crud.service';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

enum Role {
  SUPER_ADMIN = 'super_admin',
  WAREHOUSE_MANAGER = 'warehouse_manager',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('wms/warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class WmsWarehousesController {
  private readonly logger = new Logger(WmsWarehousesController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private readonly crudSvc: WmsCrudService,
  ) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async getAll(@Query() query?: Record<string, unknown>) {
    this.logger.log('Getting all warehouses');
    const result = await this.queryBus.execute(new GetWarehousesQuery(query || {}));
    const items = result?.data?.items;
    return { items: Array.isArray(items) ? items : [], total: Array.isArray(items) ? items.length : 0 };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async getById(@Param('id') id: string) {
    this.logger.log('Getting warehouse by ID');
    const result = await this.queryBus.execute(new GetWarehousesQuery({}));
    assertOk(result);
    const items = Array.isArray(result.data?.items) ? result.data.items : [];
    const warehouse = (Array.isArray(items) ? items : []).find((w: Record<string, unknown>) => w.id === id);
    assertRequired(warehouse, 'Omborni topilmadi');
    return warehouse;
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async create(@Body() dto: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('Creating warehouse');
    try {
      const name = String(dto.name ?? 'Nomsiz ombor');
      const code = dto.code
        ? String(dto.code)
        : name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 10) + '_' + Date.now().toString().slice(-4);
      const warehouseType = String(dto.type ?? dto.warehouse_type ?? 'main');
      const nameRu = dto.name_ru ? String(dto.name_ru) : null;
      const location = (dto.location ?? dto.address) ? String(dto.location ?? dto.address) : null;
      const r = await rawSql(sql`
        INSERT INTO warehouses (code, name, name_ru, type, location, is_active, manager_id)
        VALUES (${code}, ${name}, ${nameRu}, ${warehouseType}, ${location}, true, ${user?.id ?? null})
        RETURNING id, code, name, name_ru, type, location, is_active, manager_id, created_at
      `);
      const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0];
      return row ?? {};
    } catch (e) {
      throw new BadRequestException(`Ombor yaratishda xatolik: ${String(e).substring(0, 200)}`);
    }
  }

  @Patch(':id/toggle-active')
  @Roles(Role.SUPER_ADMIN)
  async toggleActive(@Param('id') id: string, @Body() dto: { isActive: boolean }) {
    this.logger.log('Toggling warehouse active status');
    try {
      const r = await rawSql(sql`
        UPDATE warehouses SET is_active = ${dto.isActive ?? true}
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id, code, name, type, is_active
      `);
      const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0];
      if (!row) throw new NotFoundException(`Ombor #${id} topilmadi`);
      return row;
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(String(e).substring(0, 100));
    }
  }

  @Get(':id/inventory')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async getInventory(@Param('id') id: string, @Query() query?: Record<string, unknown>) {
    this.logger.log('Getting warehouse inventory');
    try {
      const r = await rawSql(sql`
        SELECT ws.id, ws.material_card_id, mc.code AS material_code, mc.name AS material_name,
               mc.unit_of_measure AS unit, ws.quantity, ws.reserved_quantity, ws.available_quantity,
               mc.min_stock, mc.max_stock
        FROM warehouse_stock ws
        LEFT JOIN material_cards mc ON mc.id = ws.material_card_id
        WHERE ws.warehouse_id = ${id}
        ORDER BY mc.xom_ashyo ASC
        LIMIT 200
      `);
      const items = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      return { items, total: items.length };
    } catch (e) {
      this.logger.warn(`getInventory error: ${(e as Error).message}`);
      return { items: [], total: 0 };
    }
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async deleteWarehouse(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.crudSvc.softDeleteWarehouse(id, user?.id ?? null);
    return unwrapOrNotFound(r);
  }
}
