/**
 * @module drizzle-design.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { and, desc, sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { PaginatedResult } from '@common/types/result.type';
import { IDesignRepo } from '../../domain/repositories/i-design.repo';
import { DesignOrder } from '../../domain/aggregates/design-order.aggregate';
import { DesignStatus } from '../../domain/enums/design-status.enum';
import { db, design_orders } from '@shared/db';
import { safeJsonParse } from '@shared/utils/safe-json';

@Injectable()
export class DrizzleDesignRepository implements IDesignRepo {
  private readonly logger = new Logger(DrizzleDesignRepository.name);

  async findById(id: string): Promise<Result<DesignOrder | null>> {
    return db
      .select()
      .from(design_orders)
      .where(sql`${design_orders.id}::text = ${id}`)
      .execute()
      .then((rows) => {
        if (rows.length === 0) return Ok(null);
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error finding design order by id');
        return Err((error as Error).message);
      });
  }

  async findAll(filters: {
    status?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: DesignOrder[]; total: number }>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    return Promise.all([
      db
        .select()
        .from(design_orders)
        .where(
          and(
            filters.status ? sql`${design_orders.status} = ${filters.status}` : undefined,
            filters.assignedTo ? sql`${design_orders.assigned_to} = ${filters.assignedTo}` : undefined,
          ),
        )
        .orderBy(desc(design_orders.created_at))
        .limit(limit)
        .offset(offset)
        .execute()
        .catch((error) => { this.logger.error('Error fetching design orders'); throw error; }),
      db
        .select()
        .from(design_orders)
        .where(
          and(
            filters.status ? sql`${design_orders.status} = ${filters.status}` : undefined,
            filters.assignedTo ? sql`${design_orders.assigned_to} = ${filters.assignedTo}` : undefined,
          ),
        )
        .execute()
        .then((rows) => rows.length)
        .catch((error) => { this.logger.error('Error counting design orders'); throw error; }),
    ])
      .then(([items, total]) => Ok({ items: (Array.isArray(items) ? items : []).map((row) => this.toDomain(row)), total }))
      .catch((error) => Err((error as Error).message));
  }

  async findBySalesOrderId(salesOrderId: string): Promise<Result<DesignOrder | null>> {
    return db
      .select()
      .from(design_orders)
      .where(sql`${design_orders.deal_id} = ${salesOrderId}`)
      .execute()
      .then((rows) => {
        if (rows.length === 0) return Ok(null);
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error finding design order by sales order id');
        return Err((error as Error).message);
      });
  }

  async save(order: DesignOrder): Promise<Result<DesignOrder>> {
    return db
      .insert(design_orders)
      .values({
        order_number: `DO-${Date.now()}`,
        client_name:  String(order.customerId ?? ''),
        description:  order.description,
        status:       order.status ?? 'draft',
        assigned_to:  order.designerId ? String(order.designerId) : undefined,
        file_urls:    order.aiGeneratedDesign
          ? (safeJsonParse<unknown[]>(order.aiGeneratedDesign, []) ?? [])
          : [],
        approved_at:  order.approvedAt ?? undefined,
        deal_id:      order.salesOrderId ? String(order.salesOrderId) : undefined,
        created_by:   String(order.customerId ?? ''),
        created_at:   order.createdAt,
        updated_at:   order.updatedAt,
      } as typeof design_orders.$inferInsert)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) return Err('Failed to save design order');
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error saving design order');
        return Err((error as Error).message);
      });
  }

  async update(id: string, data: Partial<DesignOrder>): Promise<Result<DesignOrder>> {
    const updateData: Record<string, unknown> = {};

    if (data.status)           updateData.status      = data.status;
    if (data.description)      updateData.description = data.description;
    if (data.designerId)       updateData.assigned_to = String(data.designerId);
    if (data.aiGeneratedDesign)
      updateData.file_urls = safeJsonParse<unknown[]>(data.aiGeneratedDesign, []) ?? [];
    if (data.approvedAt)       updateData.approved_at = data.approvedAt;
    updateData.updated_at = _time.now();

    return db
      .update(design_orders)
      .set(updateData)
      .where(sql`${design_orders.id}::text = ${id}`)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) return Err('Design order not found');
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error updating design order');
        return Err((error as Error).message);
      });
  }

  private toDomain(row: Record<string, unknown>): DesignOrder {
    const design = new DesignOrder(
      parseInt(String(row.deal_id ?? '0')) || 0,
      0,
      String(row.description ?? row.order_number ?? ''),
      parseInt(String(row.created_by ?? '0')) || 0,
    );

    design.id             = String(row.id ?? '');
    design.status         = row.status as DesignStatus;
    design.designerId     = row.assigned_to ? parseInt(String(row.assigned_to)) : null;
    const fileUrls        = row.file_urls;
    design.aiGeneratedDesign = fileUrls
      ? JSON.stringify(Array.isArray(fileUrls) ? fileUrls : safeJsonParse<unknown[]>(String(fileUrls), []))
      : null;
    design.approvedAt  = row.approved_at  ? new Date(String(row.approved_at))  : null;
    design.createdAt   = row.created_at   ? new Date(String(row.created_at))   : _time.now();
    design.updatedAt   = row.updated_at   ? new Date(String(row.updated_at))   : _time.now();

    return design;
  }
}
