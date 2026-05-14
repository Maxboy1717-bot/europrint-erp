/**
 * @module drizzle-pos-v2-request.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, desc, sql } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, decimal } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { db } from '@shared/db';
import { Result, Ok as ok, Err as err, isErr } from '@common/result';
import { TransferRequest, RequestStatus, RequestLine } from '../../domain/aggregates/transfer-request.aggregate';

const transferRequests = pgTable('transfer_requests', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  requestNumber: text('request_number').unique().notNull(),
  fromWarehouseId: uuid('from_warehouse_id').notNull(),
  toWarehouseId: uuid('to_warehouse_id').notNull(),
  status: text('status').notNull().default('pending'),
  reason: text('reason').notNull(),
  requestedBy: text('requested_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

const transferRequestLines = pgTable('transfer_request_lines', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  requestId: uuid('request_id').references(() => transferRequests.id),
  stockItemId: uuid('stock_item_id').notNull(),
  itemName: text('item_name').notNull(),
  sku: text('sku').notNull(),
  requestedQty: decimal('requested_qty', { precision: 12, scale: 3 }).notNull(),
  approvedQty: decimal('approved_qty', { precision: 12, scale: 3 }),
  unit: text('unit').notNull().default('pcs'),
});

@Injectable()
export class DrizzlePosV2RequestRepo {
  private readonly logger = new Logger(DrizzlePosV2RequestRepo.name);

  private mapToRequestLine(data: Record<string, unknown>): RequestLine {
    return { id: String(data.id), requestId: String(data.requestId), stockItemId: String(data.stockItemId), itemName: String(data.itemName), sku: String(data.sku), requestedQty: safeNum(data.requestedQty), approvedQty: data.approvedQty ? safeNum(data.approvedQty) : null, unit: String(data.unit) };
  }

  private mapToTransferRequest(data: Record<string, unknown>): TransferRequest {
    return new TransferRequest(String(data.id), String(data.requestNumber), String(data.fromWarehouseId), String(data.toWarehouseId), data.status as RequestStatus, data.lines ? (data.lines as Record<string, unknown>[]).map((l: Record<string, unknown>) => this.mapToRequestLine(l)) : [], String(data.requestedBy), data.approvedBy ? String(data.approvedBy) : null, data.approvedAt ? new Date(String(data.approvedAt)) : null, String(data.reason), data.createdAt ? new Date(String(data.createdAt)) : _time.now(), data.updatedAt ? new Date(String(data.updatedAt)) : _time.now());
  }

  async findRequestById(requestId: string): Promise<Result<TransferRequest>> {
    try {
      const [request] = await db.select().from(transferRequests).where(eq(transferRequests.id, requestId)).limit(1);
      if (!request) return err({ message: 'Transfer request not found', code: 'NOT_FOUND' });
      const lines = await db.select().from(transferRequestLines).where(eq(transferRequestLines.requestId, requestId));
      return ok(this.mapToTransferRequest({ ...(request as Record<string, unknown>), lines }));
    } catch (error: unknown) {
      this.logger.error(`Failed to find request ${requestId}:`, error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async findRequests(filter: { status?: RequestStatus; fromWarehouseId?: string; toWarehouseId?: string; page?: number; limit?: number }): Promise<Result<{ data: TransferRequest[]; total: number; page: number; limit: number }>> {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const offset = (page - 1) * limit;
      const conditions = [];
      if (filter.status) conditions.push(eq(transferRequests.status, filter.status));
      if (filter.fromWarehouseId) conditions.push(eq(transferRequests.fromWarehouseId, filter.fromWarehouseId));
      if (filter.toWarehouseId) conditions.push(eq(transferRequests.toWarehouseId, filter.toWarehouseId));
      const requests = await db.select().from(transferRequests).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(transferRequests.createdAt)).limit(limit).offset(offset);
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(transferRequests).where(conditions.length > 0 ? and(...conditions) : undefined);
      return ok({ data: (Array.isArray(requests) ? requests : []).map((r) => this.mapToTransferRequest(r as Record<string, unknown>)), total: countResult[0]?.count || 0, page, limit });
    } catch (error: unknown) {
      this.logger.error('Failed to find requests:', error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async saveRequest(request: TransferRequest, lines: RequestLine[]): Promise<Result<TransferRequest>> {
    try {
      await db.insert(transferRequests).values({ id: request.id, requestNumber: request.requestNumber, fromWarehouseId: request.fromWarehouseId, toWarehouseId: request.toWarehouseId, status: request.status, reason: request.reason, requestedBy: request.requestedBy });
      for (const line of lines) {
        await db.insert(transferRequestLines).values({ id: line.id, requestId: request.id, stockItemId: line.stockItemId, itemName: line.itemName, sku: line.sku, requestedQty: line.requestedQty.toString(), approvedQty: line.approvedQty ? line.approvedQty.toString() : null, unit: line.unit });
      }
      return ok(request);
    } catch (error: unknown) {
      this.logger.error('Failed to save request:', error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async updateRequestStatus(requestId: string, status: RequestStatus, approvedBy?: string): Promise<Result<TransferRequest>> {
    try {
      const updateData: Record<string, unknown> = { status, updatedAt: _time.now() };
      if (approvedBy) { updateData.approvedBy = approvedBy; updateData.approvedAt = _time.now(); }
      await db.update(transferRequests).set(updateData).where(eq(transferRequests.id, requestId));
      const [request] = await db.select().from(transferRequests).where(eq(transferRequests.id, requestId)).limit(1);
      if (!request) return err({ message: 'Transfer request not found', code: 'NOT_FOUND' });
      const lines2 = await db.select().from(transferRequestLines).where(eq(transferRequestLines.requestId, requestId));
      return ok(this.mapToTransferRequest({ ...(request as Record<string, unknown>), lines: lines2 }));
    } catch (error: unknown) {
      this.logger.error(`Failed to update request status ${requestId}:`, error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }
}
