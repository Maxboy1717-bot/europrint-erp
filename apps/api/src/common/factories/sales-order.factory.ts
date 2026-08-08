import { eq } from 'drizzle-orm';
import { salesOrders } from '../../shared/db';
import { DrizzleService } from '../database/drizzle.service';
import { BaseFactory, seq } from './base.factory';

type InsertOrder = typeof salesOrders.$inferInsert;
type SelectOrder = typeof salesOrders.$inferSelect;

// Integration test uchun savdo buyurtmasi factory.
// sales_orders = KANONIK jadval (orders emas — ADR-002).

export class SalesOrderFactory extends BaseFactory<InsertOrder, SelectOrder> {
  constructor(
    db: DrizzleService,
    private readonly defaultCustomerId: number = 1,
    private readonly defaultCreatedBy: number = 1,
  ) {
    super(db);
  }

  build(overrides?: Partial<InsertOrder>): InsertOrder {
    const n = seq();
    return this.merge(
      {
        documentNumber: `TEST-SO-${String(n).padStart(4, '0')}`,
        customerId: String(this.defaultCustomerId),
        status: 'draft',
        totalAmount: '5000000',
        createdBy: String(this.defaultCreatedBy),
      } as InsertOrder,
      overrides,
    );
  }

  async create(overrides?: Partial<InsertOrder>): Promise<SelectOrder> {
    const data = this.build(overrides);
    const [row] = await this.db.db
      .insert(salesOrders)
      .values(data)
      .returning();
    return row;
  }

  async createMany(count: number, overrides?: Partial<InsertOrder>): Promise<SelectOrder[]> {
    return Promise.all(Array.from({ length: count }, () => this.create(overrides)));
  }

  async cleanup(id: number): Promise<void> {
    await this.db.db.delete(salesOrders).where(eq(salesOrders.id, id));
  }

  table() {
    return salesOrders;
  }
}
