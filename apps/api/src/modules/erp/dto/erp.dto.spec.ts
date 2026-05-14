/**
 * @module erp.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  ErpUpdateOrderSchema,
  ErpUpdateWorkCenterSchema,
  ErpCreateMrpRunSchema,
} from './erp.dto';

describe('ErpUpdateOrderSchema', () => {
  it('accepts all optional fields', () => {
    const result = ErpUpdateOrderSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts status update', () => {
    const result = ErpUpdateOrderSchema.safeParse({ status: 'in_production' });
    expect(result.success).toBe(true);
  });

  it('accepts full order update', () => {
    const result = ErpUpdateOrderSchema.safeParse({
      status: 'completed',
      notes: 'Completed on schedule',
      production_date: '2026-01-20',
    });
    expect(result.success).toBe(true);
  });

  it('rejects null input', () => {
    const result = ErpUpdateOrderSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

describe('ErpUpdateWorkCenterSchema', () => {
  it('accepts all optional fields', () => {
    const result = ErpUpdateWorkCenterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts work center update', () => {
    const result = ErpUpdateWorkCenterSchema.safeParse({
      name: 'Cutting Center',
      capacity: 500,
      status: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive capacity', () => {
    const result = ErpUpdateWorkCenterSchema.safeParse({ capacity: 0 });
    expect(result.success).toBe(false);
  });
});

describe('ErpCreateMrpRunSchema', () => {
  it('accepts all optional fields', () => {
    const result = ErpCreateMrpRunSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full MRP run spec', () => {
    const result = ErpCreateMrpRunSchema.safeParse({
      horizon_days: 30,
      warehouse_id: 1,
      run_date: '2026-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive horizon_days', () => {
    const result = ErpCreateMrpRunSchema.safeParse({ horizon_days: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive warehouse_id', () => {
    const result = ErpCreateMrpRunSchema.safeParse({ warehouse_id: -1 });
    expect(result.success).toBe(false);
  });
});
