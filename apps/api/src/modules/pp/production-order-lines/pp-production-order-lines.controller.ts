/**
 * @module pp-production-order-lines.controller
 * @description REST surface for production_order_lines (multi-line order — EP-PP-118 /
 *   vision 07-pp#124). An order can now hold N positions, each with its own product /
 *   route / quantity / status.
 *
 *   GET    /api/pp/order-lines?orderId=  — list an order's lines (seq order)
 *   POST   /api/pp/order-lines           — add a line to an order (orderId in body)
 *   PATCH  /api/pp/order-lines/:id       — patch a line
 *   DELETE /api/pp/order-lines/:id       — remove a line
 *
 *   Auth mirrors the sibling pp/reason-codes surface: JwtAuthGuard + RolesGuard; reads open to
 *   the PP read tier, writes gated to the production-management write tier. Transport-only
 *   (Rule 6): validate with Zod, delegate to the service, unwrap Result.
 */

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow } from '@common/http-result';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { PpProductionOrderLinesService } from './pp-production-order-lines.service';

// Read tier mirrors pp/reason-codes: any planner/production role may read an order's lines.
const PP_LINES_READ = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.TECHNOLOGIST];
// Write tier mirrors pp/reason-codes: only super_admin / director / production_manager mutate.
const PP_LINES_WRITE = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER];

const CreateLineSchema = z.object({
  orderId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantity: z.number().nonnegative(),
  routeId: z.number().int().positive().nullable().optional(),
  seq: z.number().int().positive().optional(),
  status: z.string().min(1).max(20).optional(),
  notes: z.string().max(2000).optional(),
});

const UpdateLineSchema = z
  .object({
    productId: z.number().int().positive().optional(),
    quantity: z.number().nonnegative().optional(),
    routeId: z.number().int().positive().nullable().optional(),
    seq: z.number().int().positive().optional(),
    status: z.string().min(1).max(20).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Kamida bitta maydon kerak' });

@ApiTags('PP Order Lines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pp/order-lines')
export class PpProductionOrderLinesController {
  constructor(private readonly svc: PpProductionOrderLinesService) {}

  @ApiOperation({ summary: "List a production order's lines" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...PP_LINES_READ)
  async list(@Query('orderId', ParseIntPipe) orderId: number) {
    return unwrapOrThrow(await this.svc.list(orderId));
  }

  @ApiOperation({ summary: 'Add a line to a production order' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Post()
  @Roles(...PP_LINES_WRITE)
  async create(@Body() body: unknown) {
    const { orderId, ...line } = CreateLineSchema.parse(body);
    return unwrapOrThrow(await this.svc.create(orderId, line));
  }

  @ApiOperation({ summary: 'Update a production order line' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Line not found' })
  @Patch(':id')
  @Roles(...PP_LINES_WRITE)
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const patch = UpdateLineSchema.parse(body);
    return unwrapOrThrow(await this.svc.update(id, patch));
  }

  @ApiOperation({ summary: 'Delete a production order line' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Line not found' })
  @Delete(':id')
  @Roles(...PP_LINES_WRITE)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.remove(id));
  }
}
