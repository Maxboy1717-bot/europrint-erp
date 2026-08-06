/**
 * @module drizzle-delivery.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { and, desc , sql } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/types/result.type';
import { IDeliveryRepo } from '../../domain/repositories/i-delivery.repo';
import { Delivery } from '../../domain/aggregates/delivery.aggregate';
import { db, deliveries } from '@shared/db';

@Injectable()
export class DrizzleDeliveryRepository implements IDeliveryRepo {
  private readonly logger = new Logger(DrizzleDeliveryRepository.name);

  constructor() {}

  async findById(id: string): Promise<Result<Delivery | null>> {
    return db
      .select()
      .from(deliveries)
      .where(sql`${deliveries.id} = ${id}`)
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Ok(null);
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error finding delivery by id');
        return Err((error as Error).message);
      });
  }

  async findAll(filters: {
    status?: string;
    driverId?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: Delivery[]; total: number }>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    return Promise.all([
      db
        .select()
        .from(deliveries)
        .where(
          and(
            filters.status ? sql`${deliveries.status} = ${filters.status}` : undefined,
            filters.driverId ? sql`${deliveries.driver_id} = ${filters.driverId}` : undefined))
        .orderBy(desc(deliveries.created_at))
        .limit(limit)
        .offset(offset)
        .execute()
        .catch((error) => {
          this.logger.error('Error fetching deliveries');
          throw error;
        }),
      db
        .select()
        .from(deliveries)
        .where(
          and(
            filters.status ? sql`${deliveries.status} = ${filters.status}` : undefined,
            filters.driverId ? sql`${deliveries.driver_id} = ${filters.driverId}` : undefined))
        .execute()
        .then((rows) => rows.length)
        .catch((error) => {
          this.logger.error('Error counting deliveries');
          throw error;
        }),
    ])
      .then(([items, total]) => (Ok({ items: items.map((row) => this.toDomain(row)), total })))
      .catch((error) => {
        return Err((error as Error).message);
      });
  }

  async findBySalesOrderId(salesOrderId: string): Promise<Result<Delivery | null>> {
    return db
      .select()
      .from(deliveries)
      // deliveries.sales_order_id is a live integer FK (see NOTE below); salesOrderId arrives
      // as the domain-layer string id, so this uses the same raw-sql coercion pattern as the
      // status/driver_id filters above instead of eq()'s stricter number-only overload.
      .where(sql`${deliveries.sales_order_id} = ${salesOrderId}`)
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Ok(null);
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error finding delivery by sales order id');
        return Err((error as Error).message);
      });
  }

  /**
   * Auto-create a delivery for a sales order. Resolves customer_name +
   * delivery_address from the sales order (and its linked CRM company) and
   * inserts a `deliveries` row keyed by the integer sales_order_id.
   *
   * NOTE: the live `deliveries` table uses a SERIAL integer `id` and an integer
   * `sales_order_id` FK → sales_orders(id). We let the serial default the id
   * (rather than the aggregate's uuid) and parameterise the cross-table lookup
   * in raw SQL — Drizzle's stub schema types `id`/`sales_order_id` as uuid,
   * which does not match the live integer columns. Proven by
   * _audit/bproof-t704-order-delivery.cjs (13/13, rollback-tx).
   */
  async createFromSalesOrder(salesOrderId: number): Promise<Result<Delivery | null>> {
    try {
      const lookup = await db.execute(sql`
        SELECT so.id            AS sales_order_id,
               so.order_number  AS order_number,
               so.customer_name AS customer_name,
               so.customer_id   AS customer_id,
               c.title          AS company_name,
               c.address        AS company_address
          FROM sales_orders so
          LEFT JOIN crm_companies c ON c.id = so.customer_id
         WHERE so.id = ${salesOrderId}
         LIMIT 1
      `);
      const rows = (lookup as unknown as { rows?: Record<string, unknown>[] }).rows ?? [];
      const order = rows[0];
      if (!order) {
        this.logger.warn(`createFromSalesOrder: sales order ${salesOrderId} not found`);
        return Ok(null);
      }

      const customerName =
        String(order.customer_name ?? order.company_name ?? `Order ${order.order_number ?? salesOrderId}`);
      const deliveryAddress = String(order.company_address ?? 'Manzil kiritilmagan');
      const deliveryNumber = `DEL-${String(order.order_number ?? salesOrderId)}-${Date.now()}`;
      const customerId = order.customer_id ?? null;

      const inserted = await db.execute(sql`
        INSERT INTO deliveries
          (sales_order_id, delivery_number, customer_name, delivery_address, status, customer_id)
        VALUES
          (${salesOrderId}, ${deliveryNumber}, ${customerName}, ${deliveryAddress}, 'pending', ${customerId})
        RETURNING id, sales_order_id, delivery_number, customer_name, delivery_address, status, driver_id, vehicle_number, created_at, updated_at
      `);
      const insRows = (inserted as unknown as { rows?: Record<string, unknown>[] }).rows ?? [];
      if (insRows.length === 0) {
        return Err('Failed to create delivery for sales order');
      }
      return Ok(this.toDomain(insRows[0]));
    } catch (error) {
      this.logger.error('Error creating delivery from sales order');
      return Err((error as Error).message);
    }
  }

  async save(delivery: Delivery): Promise<Result<Delivery>> {
    return db
      .insert(deliveries)
      .values({
        id: delivery.id,
        sales_order_id: delivery.salesOrderId,
        delivery_number: delivery.deliveryNumber,
        customer_name: delivery.customerName,
        delivery_address: delivery.deliveryAddress,
        status: delivery.status,
        driver_id: delivery.driverId,
        vehicle_number: delivery.vehicleNumber,
        completed_at: delivery.completedAt,
        created_at: delivery.createdAt,
        updated_at: delivery.updatedAt,
      } as never)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Failed to save delivery');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error saving delivery');
        return Err((error as Error).message);
      });
  }

  async update(id: string, data: Partial<Delivery>): Promise<Result<Delivery>> {
    const updateData: Record<string, unknown> = {};

    if (data.status) updateData.status = data.status;
    if (data.driverId) updateData.driver_id = data.driverId;
    if (data.vehicleNumber) updateData.vehicle_number = data.vehicleNumber;
    if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;

    updateData.updated_at = _time.now();

    return db
      .update(deliveries)
      .set(updateData)
      .where(sql`${deliveries.id} = ${id}`)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Delivery not found');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error updating delivery');
        return Err((error as Error).message);
      });
  }

  private toDomain(row: Record<string, unknown>): Delivery {
    const delivery = new Delivery(String(row.customer_name ?? ''), String(row.delivery_address));

    delivery.id = String(row.id ?? '');
    delivery.salesOrderId = String(row.sales_order_id ?? '');
    delivery.deliveryNumber = String(row.delivery_number ?? '');
    delivery.status = row.status as typeof delivery.status;
    delivery.driverId = Number(row.driver_id ?? 0);
    delivery.vehicleNumber = String(row.vehicle_number ?? '');
    delivery.completedAt = row.completed_at ? new Date(String(row.completed_at)) : null;
    delivery.createdAt = row.created_at ? new Date(String(row.created_at)) : _time.now();
    delivery.updatedAt = row.updated_at ? new Date(String(row.updated_at)) : _time.now();

    return delivery;
  }
}
