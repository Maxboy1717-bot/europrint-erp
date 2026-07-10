/**
 * @module wms-pallet-mixing.controller
 * @description NestJS controller (10-wms #17). Bir paletda 2 partiya -> "Aralash"
 *   ogohlantirish (blok EMAS). Pallet_id biriktirish + aralash-palet ro'yxati.
 *   Transport qatlami — biznes-logika PalletMixingService da (Qoida 6).
 */

import {
  Body, Controller, Get, Param, Post, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { PalletMixingService } from '../application/pallet-mixing.service';
import { safeInt } from '../../hr/common/db-rows';

const AssignPalletSchema = z.object({
  pallet_id: z.string().min(1).max(120),
});

const WH_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'manager'];
const WH_WRITE = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'director'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Pallet Mixing')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsPalletMixingController {
  constructor(private readonly svc: PalletMixingService) {}

  @ApiOperation({ summary: 'Assign pallet to lot (mixed-batch warning, non-blocking)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Lot not found' })
  @Post('warehouses/:id/lots/:lotId/pallet')
  @Roles(...WH_WRITE)
  async assignPallet(
    @Param('id') id: string,
    @Param('lotId') lotId: string,
    @Body() rawBody: unknown,
  ) {
    const body = AssignPalletSchema.parse(rawBody);
    return unwrapOrThrow(
      await this.svc.assignPallet(safeInt(lotId, 0), safeInt(id, 0), body.pallet_id),
    );
  }

  @ApiOperation({ summary: 'List mixed-batch pallet warnings for a warehouse' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('warehouses/:id/pallet-mixing-warnings')
  @Roles(...WH_READ)
  async listWarnings(@Param('id') id: string) {
    const r = await this.svc.listWarnings(safeInt(id, 0));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data: items, total: items.length };
  }
}
