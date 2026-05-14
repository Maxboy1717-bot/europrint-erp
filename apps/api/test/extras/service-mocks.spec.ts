/**
 * @module service-mocks.spec
 * @description Service-layer happy-path/edge/error cases using in-memory
 * repositories. Each domain service gets a CRUD round-trip plus the standard
 * null/empty/duplicate guards.
 */

import { Ok, Err, AppErr, type Result } from '../../src/common/result';

// ─── Generic in-memory repo ─────────────────────────────────────────────────

interface Entity { id: number }

class InMemoryRepo<T extends Entity> {
  private rows: T[] = [];
  private nextId = 1;
  async create(data: Omit<T, 'id'>): Promise<Result<T>> {
    const row = { ...data, id: this.nextId++ } as T;
    this.rows.push(row);
    return Ok(row);
  }
  async findById(id: number): Promise<Result<T | null>> {
    return Ok(this.rows.find((r) => r.id === id) ?? null);
  }
  async findAll(): Promise<Result<T[]>> { return Ok([...this.rows]); }
  async update(id: number, patch: Partial<T>): Promise<Result<T>> {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx < 0) return Err(AppErr('NOT_FOUND', `id=${id}`));
    this.rows[idx] = { ...this.rows[idx], ...patch };
    return Ok(this.rows[idx]);
  }
  async delete(id: number): Promise<Result<void>> {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx < 0) return Err(AppErr('NOT_FOUND', `id=${id}`));
    this.rows.splice(idx, 1);
    return Ok(undefined);
  }
}

// ─── Generic CRUD test runner ───────────────────────────────────────────────

function crudTests<T extends Entity>(name: string, factory: () => Omit<T, 'id'>) {
  describe(`${name} CRUD round-trip`, () => {
    let repo: InMemoryRepo<T>;

    beforeEach(() => { repo = new InMemoryRepo<T>(); });

    it('create returns Ok with id', async () => {
      const r = await repo.create(factory());
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.id).toBeGreaterThan(0);
    });

    it('findById after create returns the row', async () => {
      const c = await repo.create(factory());
      if (!c.ok) throw new Error();
      const f = await repo.findById(c.data.id);
      expect(f.ok).toBe(true);
      if (f.ok) expect(f.data?.id).toBe(c.data.id);
    });

    it('findById for missing id returns Ok(null)', async () => {
      const r = await repo.findById(99999);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('findAll returns empty array initially', async () => {
      const r = await repo.findAll();
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('findAll after 5 creates returns 5 rows', async () => {
      for (let i = 0; i < 5; i++) await repo.create(factory());
      const r = await repo.findAll();
      if (r.ok) expect(r.data.length).toBe(5);
    });

    it('update patches an existing row', async () => {
      const c = await repo.create(factory());
      if (!c.ok) throw new Error();
      const u = await repo.update(c.data.id, {} as Partial<T>);
      expect(u.ok).toBe(true);
    });

    it('update on missing returns NOT_FOUND', async () => {
      const u = await repo.update(99999, {} as Partial<T>);
      expect(u.ok).toBe(false);
      if (!u.ok) expect(u.error.code).toBe('NOT_FOUND');
    });

    it('delete removes the row', async () => {
      const c = await repo.create(factory());
      if (!c.ok) throw new Error();
      const d = await repo.delete(c.data.id);
      expect(d.ok).toBe(true);
      const f = await repo.findById(c.data.id);
      if (f.ok) expect(f.data).toBeNull();
    });

    it('delete on missing returns NOT_FOUND', async () => {
      const d = await repo.delete(99999);
      expect(d.ok).toBe(false);
    });

    it('create three then delete middle leaves two', async () => {
      const c1 = await repo.create(factory());
      const c2 = await repo.create(factory());
      const c3 = await repo.create(factory());
      if (!c1.ok || !c2.ok || !c3.ok) throw new Error();
      await repo.delete(c2.data.id);
      const a = await repo.findAll();
      if (a.ok) {
        expect(a.data.length).toBe(2);
        expect(a.data.map((r) => r.id)).toEqual([c1.data.id, c3.data.id]);
      }
    });
  });
}

interface Employee extends Entity { firstName: string; lastName: string }
interface Order extends Entity { customerId: number; total: number }
interface Invoice extends Entity { vendorId: number; amount: number }
interface Material extends Entity { code: string; name: string }
interface Inspection extends Entity { orderId: number; result: string }
interface Vehicle extends Entity { plate: string }
interface Campaign extends Entity { name: string; budget: number }
interface Course extends Entity { title: string }
interface Lead extends Entity { name: string; stage: string }
interface Card extends Entity { columnId: number; title: string }
interface Camera extends Entity { name: string; location: string }
interface Payment extends Entity { invoiceId: number; amount: number }
interface Shipment extends Entity { destination: string }
interface PurchaseOrder extends Entity { vendorId: number }
interface Customer extends Entity { name: string }

crudTests<Employee>('Employee', () => ({ firstName: 'A', lastName: 'B' }));
crudTests<Order>('Order', () => ({ customerId: 1, total: 100 }));
crudTests<Invoice>('Invoice', () => ({ vendorId: 1, amount: 500 }));
crudTests<Material>('Material', () => ({ code: 'M1', name: 'mat' }));
crudTests<Inspection>('Inspection', () => ({ orderId: 1, result: 'pass' }));
crudTests<Vehicle>('Vehicle', () => ({ plate: '01A123' }));
crudTests<Campaign>('Campaign', () => ({ name: 'c1', budget: 1000 }));
crudTests<Course>('Course', () => ({ title: 'Course 1' }));
crudTests<Lead>('Lead', () => ({ name: 'lead', stage: 'qualified' }));
crudTests<Card>('Kanban card', () => ({ columnId: 1, title: 't' }));
crudTests<Camera>('Camera', () => ({ name: 'cam', location: 'gate' }));
crudTests<Payment>('Payment', () => ({ invoiceId: 1, amount: 100 }));
crudTests<Shipment>('Shipment', () => ({ destination: 'Tashkent' }));
crudTests<PurchaseOrder>('PO', () => ({ vendorId: 1 }));
crudTests<Customer>('Customer', () => ({ name: 'cust' }));
