import { eq } from 'drizzle-orm';
import { hrEmployees } from '../../shared/db';
import { DrizzleService } from '../database/drizzle.service';
import { BaseFactory, rand, seq } from './base.factory';

type InsertEmployee = typeof hrEmployees.$inferInsert;
type SelectEmployee = typeof hrEmployees.$inferSelect;

// Integration test uchun xodim ma'lumot factory.
// Minimal majburiy maydonlar bilan to'liq xodim yaratadi.
// Qaramliklar: org_function_id va user_id allaqachon DB da bo'lishi kerak.

export class EmployeeFactory extends BaseFactory<InsertEmployee, SelectEmployee> {
  constructor(
    db: DrizzleService,
    private readonly defaultUserId: number = 1,
  ) {
    super(db);
  }

  build(overrides?: Partial<InsertEmployee>): InsertEmployee {
    const n = seq();
    return this.merge(
      {
        first_name: `Test${n}`,
        last_name: `Xodim${n}`,
        email_work: `test${n}@europrint.test`,
        user_id: this.defaultUserId,
        base_salary: '3000000',
        status: 'active',
      } as InsertEmployee,
      overrides,
    );
  }

  async create(overrides?: Partial<InsertEmployee>): Promise<SelectEmployee> {
    const data = this.build(overrides);
    const [row] = await this.db.db
      .insert(hrEmployees)
      .values(data)
      .returning();
    return row;
  }

  async createMany(count: number, overrides?: Partial<InsertEmployee>): Promise<SelectEmployee[]> {
    return Promise.all(Array.from({ length: count }, () => this.create(overrides)));
  }

  async cleanup(id: number): Promise<void> {
    await this.db.db.delete(hrEmployees).where(eq(hrEmployees.id, id));
  }

  table() {
    return hrEmployees;
  }
}
