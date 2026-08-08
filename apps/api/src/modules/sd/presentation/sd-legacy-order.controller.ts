/**
 * @module sd-legacy-order.controller
 * @description HTTP routes for the optional legacy 1C (Zakaz 1S) order number on a sales order:
 *   GET/PATCH /sd/orders/:id/legacy-number. Delegates to SdLegacyOrderService and unwraps Result.
 *   vision 06-sd#154.
 */

import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow } from '@common/http-result';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { SdLegacyOrderService } from '../application/sd-legacy-order.service';

const SetLegacyNumberDtoSchema = z.object({
  // Opaque external 1C id — free text, capped to the column width; null/empty clears it.
  legacyOrderNumber: z.string().trim().max(64).nullish(),
});

@ApiTags('Sd Orders')
@ApiBearerAuth()
@Controller('sd/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SdLegacyOrderController {
  constructor(private readonly service: SdLegacyOrderService) {}

  @ApiOperation({ summary: "Get an order's optional legacy 1C (Zakaz 1S) number" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id/legacy-number')
  @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async get(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.getLegacyNumber(id));
  }

  @ApiOperation({ summary: "Set or clear an order's optional legacy 1C (Zakaz 1S) number" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Patch(':id/legacy-number')
  @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.SUPER_ADMIN)
  async set(@Param('id', ParseIntPipe) id: number, @Body() dto: unknown) {
    const parsed = SetLegacyNumberDtoSchema.parse(dto);
    return unwrapOrThrow(await this.service.setLegacyNumber(id, parsed.legacyOrderNumber ?? null));
  }
}
