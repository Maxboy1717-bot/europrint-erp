/**
 * @module wms-rental.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, Post, Delete, Patch, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors, Logger,
InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { ReceiveFgCommand } from '../application/commands/receive-fg.handler';
import { WmsCrudService } from '../application/wms-crud.service';
import { PatchRentalDto } from './dto/wms-crud.dto';

enum Role {
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('wms/rental')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class WmsRentalController {
  private readonly logger = new Logger(WmsRentalController.name);

  constructor(
    private commandBus: CommandBus,
    private readonly crudSvc: WmsCrudService,
  ) {}

  @Get(':warehouseId')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getRentals(@Param('warehouseId') warehouseId: number) {
    this.logger.log('Getting rentals');
    const items: unknown[] = [];
    return Array.isArray(items) ? items : [];
  }

  @Post('receive')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async receiveFg(
    @Body()
    dto: {
      materialId: number;
      warehouseId: number;
      amount: number;
      batchNumber: string;
      expiryDate?: Date;
    },
  ) {
    const command = new ReceiveFgCommand(
      dto.materialId,
      dto.warehouseId,
      dto.amount,
      dto.batchNumber,
      dto.expiryDate || null,
    );
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @Patch(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async patchRental(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchRentalDto,
  ) {
    const data = unwrapOrThrow(await this.crudSvc.patchRentalRecord(id, dto as Record<string, unknown>));
    return { data };
  }

  @Delete(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async deleteRental(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = unwrapOrThrow(await this.crudSvc.softDeleteRentalRecord(id, user?.id ?? null));
    return data;
  }
}
