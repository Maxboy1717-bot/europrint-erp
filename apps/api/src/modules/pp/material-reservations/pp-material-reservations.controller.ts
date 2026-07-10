/**
 * @module pp-material-reservations.controller
 * @description PP material-reservation surface (vision 07-pp#30 / EP-PP-068). A
 *   reservation records which production order gets first claim on a scarce material;
 *   the allocation queue is ranked by priority (1=Shoshilinch..4=Past) then FIFO
 *   (reserved_at). Only director/owner may manually override a priority (YOZMA + sabab).
 *
 *   GET   /api/pp/material-reservations?materialId=   — ranked allocation queue
 *   GET   /api/pp/material-reservations/order/:orderId — reservations for an order
 *   POST  /api/pp/material-reservations               — create a reservation
 *   PATCH /api/pp/material-reservations/:id/priority  — director/owner override
 *   PATCH /api/pp/material-reservations/:id/wait      — mark waiting + estimated date
 *   PATCH /api/pp/material-reservations/:id/release   — release
 *
 *   Auth mirrors the sibling pp-reason-codes surface (JwtAuthGuard + RolesGuard). Reads
 *   and reservation management open to the planner tier; the manual priority override is
 *   gated to super_admin/director only ("faqat direktor/egasi"). Transport-only (Rule 6):
 *   validate with Zod, delegate to the service, unwrap Result.
 */

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow, unwrapOrNotFoundDefined } from '@common/http-result';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';
import { PpMaterialReservationsService } from './pp-material-reservations.service';

// Planner tier: read + create/manage reservations.
const PP_RES_MANAGE = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.TECHNOLOGIST];
// Manual priority override — vision "faqat direktor/egasi" (owner = super_admin).
const PP_RES_OVERRIDE = [Role.SUPER_ADMIN, Role.DIRECTOR];

const CreateReservationSchema = z.object({
  productionOrderId: z.number().int().positive(),
  materialId: z.number().int().positive(),
  qty: z.number().positive(),
  priority: z.number().int().min(1).max(4).optional(),
});

const OverridePrioritySchema = z.object({
  priority: z.number().int().min(1).max(4),
  // YOZMA + sabab: the written justification is mandatory and audited.
  reason: z.string().min(3).max(1000),
});

const WaitSchema = z.object({
  estimatedAvailableDate: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "sana 'YYYY-MM-DD' formatda bo'lishi kerak"),
});

@ApiTags('PP Material Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pp/material-reservations')
export class PpMaterialReservationsController {
  constructor(private readonly svc: PpMaterialReservationsService) {}

  @ApiOperation({ summary: 'Ranked material allocation queue (priority -> FIFO)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'materialId required' })
  @Get()
  @Roles(...PP_RES_MANAGE)
  async queue(@Query('materialId', ParseIntPipe) materialId: number) {
    const items = unwrapOrThrow(await this.svc.allocationQueue(materialId));
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Reservations for a production order' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('order/:orderId')
  @Roles(...PP_RES_MANAGE)
  async byOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    const items = unwrapOrThrow(await this.svc.findByOrder(orderId));
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create a material reservation' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(...PP_RES_MANAGE)
  async create(@Body() body: unknown) {
    const dto = CreateReservationSchema.parse(body);
    return unwrapOrThrow(await this.svc.create(dto));
  }

  @ApiOperation({ summary: 'Director/owner manual priority override (YOZMA + sabab)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/priority')
  @Roles(...PP_RES_OVERRIDE)
  async override(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = OverridePrioritySchema.parse(body);
    return unwrapOrNotFoundDefined(
      await this.svc.overridePriority(id, dto.priority, user.id, dto.reason),
      'Rezerv topilmadi',
    );
  }

  @ApiOperation({ summary: 'Mark reservation waiting + estimated available date' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/wait')
  @Roles(...PP_RES_MANAGE)
  async wait(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = WaitSchema.parse(body);
    return unwrapOrNotFoundDefined(
      await this.svc.markWaiting(id, dto.estimatedAvailableDate),
      'Rezerv topilmadi',
    );
  }

  @ApiOperation({ summary: 'Release a material reservation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/release')
  @Roles(...PP_RES_MANAGE)
  async release(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrNotFoundDefined(await this.svc.release(id), 'Rezerv topilmadi');
  }
}
