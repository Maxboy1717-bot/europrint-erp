/**
 * @module mm-purchase-orders.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Body, Param, UseGuards, UseInterceptors, Logger, UsePipes,
InternalServerErrorException, HttpException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CommandBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { CreatePurchaseOrderCommand } from '../application/commands/create-purchase-order.handler';
import { ApprovePurchaseOrderCommand } from '../application/commands/approve-purchase-order.handler';
import { GoodsReceiptCommand } from '../application/commands/goods-receipt.handler';
import { db } from '@shared/db';
import { mm_purchase_orders } from '@shared/db';
import { eq, desc } from 'drizzle-orm';
import { notImplemented } from '@common/exceptions/not-implemented';

enum Role {
  PURCHASER = 'purchaser',
  PURCHASE_MANAGER = 'purchase_manager',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}



@ApiThrottle()
@ApiTags('Mm Purchase Orders')
@Controller('mm/purchase-orders')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MmPurchaseOrdersController {
  private readonly logger = new Logger(MmPurchaseOrdersController.name);

  constructor(private commandBus: CommandBus) {}

  @ApiOperation({ summary: 'List pos' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.PURCHASER, Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async listPos(){
    try {
      const rows = await db.select().from(mm_purchase_orders).orderBy(desc(mm_purchase_orders.created_at)).limit(50);
      return rows.map((r) => ({
        id: String(r.id),
        po_number: `PO-${String(r.id).padStart(6, '0')}`,
        vendor_name: `Vendor #${r.vendor_id ?? 0}`,
        order_date: r.order_date ?? '',
        delivery_date: r.expected_date ?? '',
        status: r.status ?? 'draft',
        total_amount: String(r.total_amount ?? 0),
        currency: r.currency ?? 'UZS',
        received_amount: '0',
        pending_amount: String(r.total_amount ?? 0),
        receipt_count: 0,
      }));
    } catch (_e) { return []; }
  }

  @ApiOperation({ summary: 'Get pending receipt' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pending-receipt')
  @Roles(Role.PURCHASER, Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getPendingReceipt(){
    try {
      const rows = await db.select().from(mm_purchase_orders)
        .where(eq(mm_purchase_orders.status, 'approved'))
        .orderBy(desc(mm_purchase_orders.created_at))
        .limit(20);
      return rows.map((r) => ({
        id: String(r.id),
        po_number: `PO-${String(r.id).padStart(6, '0')}`,
        vendor_name: `Vendor #${r.vendor_id ?? 0}`,
        order_date: r.order_date ?? '',
        delivery_date: r.expected_date ?? '',
        status: r.status ?? 'approved',
        total_amount: String(r.total_amount ?? 0),
        currency: r.currency ?? 'UZS',
        received_amount: '0',
        pending_amount: String(r.total_amount ?? 0),
        receipt_count: 0,
      }));
    } catch (_e) { return []; }
  }

  @ApiOperation({ summary: 'Get po' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-10 (use list endpoint)' })
  @Get(':id')
  @Roles(Role.PURCHASER, Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getPo(@Param('id') _id: number){
    this.logger.log('Getting purchase order');
    return notImplemented('GET /mm/purchase-orders/:id');
  }

  @ApiOperation({ summary: 'Create po' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(Role.PURCHASER, Role.SUPER_ADMIN)
  async createPo(
    @Body()
    dto: {
      supplierId: number;
      items: Array<{ materialId: number; quantity: number; unitPrice: number }>;
      createdBy: number;
    },
  ){
    const command = new CreatePurchaseOrderCommand(
      dto.supplierId,
      dto.items,
      dto.createdBy,
    );
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Approve po' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/approve')
  @Roles(Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async approvePo(
    @Param('id') id: number,
    @Body() dto: { approvedBy: number },
  ){
    const command = new ApprovePurchaseOrderCommand(id, dto.approvedBy);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Record goods receipt' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/goods-receipt')
  @Roles(Role.PURCHASER, Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async recordGoodsReceipt(
    @Param('id') id: number,
    @Body() dto: { quantity: number; invoiceQuantity: number },
  ){
    const command = new GoodsReceiptCommand(id, dto.quantity, dto.invoiceQuantity);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Delete po' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-10' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async deletePo(@Param('id') _id: number) {
    return notImplemented('DELETE /mm/purchase-orders/:id');
  }

  @ApiOperation({ summary: 'Update po' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-10' })
  @Patch(':id')
  @Roles(Role.PURCHASER, Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async updatePo(
    @Param('id') _id: number,
    @Body() _dto: Partial<{ supplierId: number; items: Array<{ materialId: number; quantity: number; unitPrice: number }>; notes: string }>,
  ) {
    return notImplemented('PATCH /mm/purchase-orders/:id');
  }

  @ApiOperation({ summary: 'Patch approve po' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/approve')
  @Roles(Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async patchApprovePo(@Param('id') id: number, @Body() dto: { approvedBy: number }) {
    const command = new ApprovePurchaseOrderCommand(id, dto.approvedBy ?? 0);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }
}
