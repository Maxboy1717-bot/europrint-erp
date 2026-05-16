/**
 * @module wms-rental.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * PA1-11 — All writes go through CommandBus (receive/patch/delete). The previous
 * `WmsCrudService` direct injection has been removed so this controller has a
 * single write path.
 */

import {
  Controller, Get, Post, Delete, Patch, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors, Logger,
  HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { ReceiveFgCommand } from '../application/commands/receive-fg.handler';
import { PatchRentalCommand } from '../application/commands/patch-rental.handler';
import { DeleteRentalCommand } from '../application/commands/delete-rental.handler';
import { PatchRentalDto } from './dto/wms-crud.dto';

enum Role {
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

@ApiThrottle()
@ApiTags('Wms Rental')
@Controller('wms/rental')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class WmsRentalController {
  private readonly logger = new Logger(WmsRentalController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Get rentals' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get(':warehouseId')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getRentals(@Param('warehouseId') warehouseId: number) {
    // PA1-11 / Rule 10: previously returned a stub `[]`. Wire to a real
    // GetRentalsQuery + handler when the read model is defined.
    // TODO PA1-11: implement GetRentalsByWarehouseQuery and switch from 501.
    this.logger.warn({ msg: 'getRentals not implemented', warehouseId });
    throw new HttpException(
      "Tez orada amalga oshiriladi (rentals by warehouse)",
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Receive fg' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Patch rental' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async patchRental(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchRentalDto,
  ) {
    const res = await this.commandBus.execute(
      new PatchRentalCommand(id, dto as Record<string, unknown>),
    );
    return { data: unwrapOrThrow(res) };
  }

  @ApiOperation({ summary: 'Delete rental' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async deleteRental(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const res = await this.commandBus.execute(
      new DeleteRentalCommand(id, user?.id ?? null),
    );
    return unwrapOrThrow(res);
  }
}
