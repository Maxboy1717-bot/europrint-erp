/**
 * @module drizzle-maintenance.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, desc , sql } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/types/result.type';
import { IMaintenanceRepo } from '../../domain/repositories/i-maintenance.repo';
import { MaintenanceOrder } from '../../domain/aggregates/maintenance-order.aggregate';
import { db, maintenance_orders } from '@shared/db';

@Injectable()
export class DrizzleMaintenanceRepository implements IMaintenanceRepo {
  private readonly logger = new Logger(DrizzleMaintenanceRepository.name);

  constructor() {}

  async findById(id: string): Promise<Result<MaintenanceOrder | null>> {
    return db
      .select()
      .from(maintenance_orders)
      .where(sql`${maintenance_orders.id} = ${id}`)
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Ok(null);
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error finding maintenance order by id');
        return Err((error as Error).message);
      });
  }

  async findAll(filters: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: MaintenanceOrder[]; total: number }>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    return Promise.all([
      db
        .select()
        .from(maintenance_orders)
        .where(
          and(
            filters.status ? sql`${maintenance_orders.status} = ${filters.status}` : undefined,
            filters.priority ? sql`${maintenance_orders.priority} = ${filters.priority}` : undefined,
            filters.assignedTo ? sql`${maintenance_orders.assigned_to} = ${filters.assignedTo}` : undefined))
        .orderBy(desc(maintenance_orders.created_at))
        .limit(limit)
        .offset(offset)
        .execute()
        .catch((error) => {
          this.logger.error('Error fetching maintenance orders');
          throw error;
        }),
      db
        .select()
        .from(maintenance_orders)
        .where(
          and(
            filters.status ? sql`${maintenance_orders.status} = ${filters.status}` : undefined,
            filters.priority ? sql`${maintenance_orders.priority} = ${filters.priority}` : undefined,
            filters.assignedTo ? sql`${maintenance_orders.assigned_to} = ${filters.assignedTo}` : undefined))
        .execute()
        .then((rows) => rows.length)
        .catch((error) => {
          this.logger.error('Error counting maintenance orders');
          throw error;
        }),
    ])
      .then(([items, total]) => (Ok({ items: items.map((row) => this.toDomain(row)), total })))
      .catch((error) => {
        return Err((error as Error).message);
      });
  }

  async findOpenByEquipment(equipmentId: string): Promise<Result<MaintenanceOrder[]>> {
    return db
      .select()
      .from(maintenance_orders)
      .where(
        and(
          eq(maintenance_orders.equipment_id, equipmentId),
          eq(maintenance_orders.status, 'open')))
      .execute()
      .then((rows) => (Ok(rows.map((row) => this.toDomain(row)))))
      .catch((error) => {
        this.logger.error('Error finding open maintenance orders');
        return Err((error as Error).message);
      });
  }

  async save(order: MaintenanceOrder): Promise<Result<MaintenanceOrder>> {
    return db
      .insert(maintenance_orders)
      .values({
        id: order.id,
        equipment_id: order.equipmentId,
        equipment_name: order.equipmentName,
        issue_description: order.issueDescription,
        priority: order.priority,
        status: order.status,
        assigned_to: order.assignedTo,
        production_order_affected: order.productionOrderAffected,
        completed_at: order.completedAt,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
      } as typeof maintenance_orders.$inferInsert)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Failed to save maintenance order');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error saving maintenance order');
        return Err((error as Error).message);
      });
  }

  async update(id: string, data: Partial<MaintenanceOrder>): Promise<Result<MaintenanceOrder>> {
    const updateData: Record<string, unknown> = {};

    if (data.status) updateData.status = data.status;
    if (data.assignedTo) updateData.assigned_to = data.assignedTo;
    if (data.priority) updateData.priority = data.priority;
    if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;

    updateData.updated_at = _time.now();

    return db
      .update(maintenance_orders)
      .set(updateData)
      .where(sql`${maintenance_orders.id} = ${id}`)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Maintenance order not found');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error updating maintenance order');
        return Err((error as Error).message);
      });
  }

  private toDomain(row: Record<string, unknown>): MaintenanceOrder {
    const order = new MaintenanceOrder(
      String(row.equipment_id ?? ''),
      String(row.equipment_name ?? ''),
      String(row.issue_description ?? ''),
      String(row.priority ?? 'low') as 'low' | 'medium' | 'high' | 'critical');

    order.id = String(row.id ?? '');
    order.status = row.status as typeof order.status;
    order.assignedTo = String(row.assigned_to ?? '');
    order.productionOrderAffected = String(row.production_order_affected ?? '');
    order.completedAt = row.completed_at ? new Date(String(row.completed_at)) : null;
    order.createdAt = row.created_at ? new Date(String(row.created_at)) : _time.now();
    order.updatedAt = row.updated_at ? new Date(String(row.updated_at)) : _time.now();

    return order;
  }
}
