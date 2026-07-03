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
import { eq, sql, getTableColumns } from 'drizzle-orm';
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
      // NOTE: raw sql used for LEFT JOIN aggregate — Drizzle .select() does not cleanly support
      // subquery aggregates in the column list for this shape.
      const result = await db.execute(sql`
        SELECT
          po.id,
          po.vendor_id,
          po.vendor_name,
          po.order_date,
          po.expected_date,
          po.status,
          po.total_amount,
          po.currency,
          COALESCE(poi_agg.item_count, 0)::int                                       AS receipt_count,
          COALESCE(poi_agg.items_total, 0)::numeric(15,2)                            AS received_amount,
          (po.total_amount - COALESCE(poi_agg.items_total, 0))::numeric(15,2)        AS pending_amount
        FROM mm_purchase_orders po
        LEFT JOIN (
          SELECT purchase_order_id,
                 COUNT(*)::int              AS item_count,
                 SUM(quantity * unit_price) AS items_total
          FROM purchase_order_items
          GROUP BY purchase_order_id
        ) poi_agg ON poi_agg.purchase_order_id = po.id
        WHERE po.deleted_at IS NULL
        ORDER BY po.created_at DESC
        LIMIT 50
      `);
      const rows = (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? []) as Record<string, unknown>[];
      return rows.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        po_number: `PO-${String(r.id).padStart(6, '0')}`,
        vendor_name: (r.vendor_name as string | null) ?? (r.vendor_id != null ? String(r.vendor_id) : ''),
        order_date: (r.order_date as string | null) ?? '',
        delivery_date: (r.expected_date as string | null) ?? '',
        status: (r.status as string | null) ?? 'draft',
        total_amount: String(r.total_amount ?? 0),
        currency: (r.currency as string | null) ?? 'UZS',
        received_amount: String(r.received_amount ?? 0),
        pending_amount: String(r.pending_amount ?? r.total_amount ?? 0),
        receipt_count: Number(r.receipt_count ?? 0),
      }));
    } catch (e) { throw new InternalServerErrorException(String(e)); }
  }

  @ApiOperation({ summary: 'Get pending receipt' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pending-receipt')
  @Roles(Role.PURCHASER, Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getPendingReceipt(){
    try {
      // NOTE: raw sql used for LEFT JOIN aggregate — same pattern as listPos().
      const result = await db.execute(sql`
        SELECT
          po.id,
          po.vendor_id,
          po.vendor_name,
          po.order_date,
          po.expected_date,
          po.status,
          po.total_amount,
          po.currency,
          COALESCE(poi_agg.item_count, 0)::int                                       AS receipt_count,
          COALESCE(poi_agg.items_total, 0)::numeric(15,2)                            AS received_amount,
          (po.total_amount - COALESCE(poi_agg.items_total, 0))::numeric(15,2)        AS pending_amount
        FROM mm_purchase_orders po
        LEFT JOIN (
          SELECT purchase_order_id,
                 COUNT(*)::int              AS item_count,
                 SUM(quantity * unit_price) AS items_total
          FROM purchase_order_items
          GROUP BY purchase_order_id
        ) poi_agg ON poi_agg.purchase_order_id = po.id
        WHERE po.deleted_at IS NULL
          AND po.status = 'approved'
        ORDER BY po.created_at DESC
        LIMIT 20
      `);
      const rows = (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? []) as Record<string, unknown>[];
      return rows.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        po_number: `PO-${String(r.id).padStart(6, '0')}`,
        vendor_name: (r.vendor_name as string | null) ?? (r.vendor_id != null ? String(r.vendor_id) : ''),
        order_date: (r.order_date as string | null) ?? '',
        delivery_date: (r.expected_date as string | null) ?? '',
        status: (r.status as string | null) ?? 'approved',
        total_amount: String(r.total_amount ?? 0),
        currency: (r.currency as string | null) ?? 'UZS',
        received_amount: String(r.received_amount ?? 0),
        pending_amount: String(r.pending_amount ?? r.total_amount ?? 0),
        receipt_count: Number(r.receipt_count ?? 0),
      }));
    } catch (e) { throw new InternalServerErrorException(String(e)); }
  }

  @ApiOperation({ summary: 'Get po' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id')
  @Roles(Role.PURCHASER, Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getPo(@Param('id') id: string){
    const poId = Number(id);
    const result = await db.execute(sql`
      SELECT
        po.id,
        po.vendor_id,
        po.vendor_name,
        po.order_date,
        po.expected_date,
        po.status,
        po.total_amount,
        po.currency,
        COALESCE(poi_agg.item_count, 0)::int                                       AS receipt_count,
        COALESCE(poi_agg.items_total, 0)::numeric(15,2)                            AS received_amount,
        (po.total_amount - COALESCE(poi_agg.items_total, 0))::numeric(15,2)        AS pending_amount
      FROM mm_purchase_orders po
      LEFT JOIN (
        SELECT purchase_order_id,
               COUNT(*)::int              AS item_count,
               SUM(quantity * unit_price) AS items_total
        FROM purchase_order_items
        GROUP BY purchase_order_id
      ) poi_agg ON poi_agg.purchase_order_id = po.id
      WHERE po.id = ${poId}
        AND po.deleted_at IS NULL
      LIMIT 1
    `);
    const rows = Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? [];
    const r = rows[0] as Record<string, unknown> | undefined;
    if (!r) throw new HttpException('Buyurtma topilmadi', HttpStatus.NOT_FOUND);
    return {
      id: String(r.id),
      po_number: `PO-${String(r.id).padStart(6, '0')}`,
      vendor_name: (r.vendor_name as string | null) ?? (r.vendor_id != null ? String(r.vendor_id) : ''),
      order_date: (r.order_date as string | null) ?? '',
      delivery_date: (r.expected_date as string | null) ?? '',
      status: (r.status as string | null) ?? 'draft',
      total_amount: String(r.total_amount ?? 0),
      currency: (r.currency as string | null) ?? 'UZS',
      received_amount: String(r.received_amount ?? 0),
      pending_amount: String(r.pending_amount ?? r.total_amount ?? 0),
      receipt_count: Number(r.receipt_count ?? 0),
    };
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
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: "Faqat draft holatdagi buyurtma o'chiriladi" })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async deletePo(@Param('id') id: string) {
    const poId = Number(id);
    const rows = await db.select({ ...getTableColumns(mm_purchase_orders), vendorName: sql<string | null>`vendor_name` }).from(mm_purchase_orders).where(eq(mm_purchase_orders.id, poId)).limit(1);
    const r = rows[0];
    if (!r) throw new HttpException('Buyurtma topilmadi', HttpStatus.NOT_FOUND);
    if ((r.status ?? 'draft') !== 'draft') throw new HttpException("Faqat 'draft' holatdagi buyurtmani o'chirish mumkin", HttpStatus.BAD_REQUEST);
    await db.execute(sql`UPDATE mm_purchase_orders SET deleted_at = NOW() WHERE id = ${poId}`);
    return { id: String(poId), deleted: true };
  }

  @ApiOperation({ summary: 'Update po' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: "Faqat draft holatdagi buyurtma tahrirlanadi" })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles(Role.PURCHASER, Role.PURCHASE_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async updatePo(
    @Param('id') id: string,
    @Body() dto: Partial<{ supplierId: number; items: Array<{ materialId: number; quantity: number; unitPrice: number }>; notes: string }>,
  ) {
    const poId = Number(id);
    const rows = await db.select({ ...getTableColumns(mm_purchase_orders), vendorName: sql<string | null>`vendor_name` }).from(mm_purchase_orders).where(eq(mm_purchase_orders.id, poId)).limit(1);
    const r = rows[0];
    if (!r) throw new HttpException('Buyurtma topilmadi', HttpStatus.NOT_FOUND);
    if ((r.status ?? 'draft') !== 'draft') throw new HttpException("Faqat 'draft' holatdagi buyurtmani tahrirlash mumkin", HttpStatus.BAD_REQUEST);
    // Header-only update (notes + vendor); line-item recalc is a larger task, deferred.
    await db.execute(sql`UPDATE mm_purchase_orders SET
      notes = COALESCE(${dto.notes ?? null}, notes),
      vendor_id = COALESCE(${dto.supplierId != null ? Number(dto.supplierId) : null}, vendor_id)
      WHERE id = ${poId}`);
    return { id: String(poId), updated: true };
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
