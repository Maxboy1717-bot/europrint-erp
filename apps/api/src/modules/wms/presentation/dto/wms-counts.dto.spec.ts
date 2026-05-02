
import {
  WmsCreateInventoryCountSchema,
  WmsCreateInternalRequestSchema,
  WmsUpdateInternalRequestSchema,
} from './wms-counts.dto';

describe('WmsCreateInventoryCountSchema', () => {
  it('accepts valid inventory count with warehouse_id as number', () => {
    const result = WmsCreateInventoryCountSchema.safeParse({ warehouse_id: 1 });
    expect(result.success).toBe(true);
  });

  it('accepts warehouse_id as string', () => {
    const result = WmsCreateInventoryCountSchema.safeParse({ warehouse_id: '2' });
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = WmsCreateInventoryCountSchema.safeParse({
      warehouse_id: 1,
      counted_by: 42,
      notes: 'Monthly count',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing warehouse_id', () => {
    const result = WmsCreateInventoryCountSchema.safeParse({ notes: 'no warehouse' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string warehouse_id', () => {
    const result = WmsCreateInventoryCountSchema.safeParse({ warehouse_id: '' });
    expect(result.success).toBe(false);
  });
});

describe('WmsCreateInternalRequestSchema', () => {
  it('accepts valid request with required fields', () => {
    const result = WmsCreateInternalRequestSchema.safeParse({
      material_id: 10,
      quantity: 5,
    });
    expect(result.success).toBe(true);
  });

  it('accepts string material_id and quantity', () => {
    const result = WmsCreateInternalRequestSchema.safeParse({
      material_id: '10',
      quantity: '5',
    });
    expect(result.success).toBe(true);
  });

  it('accepts full request with all fields', () => {
    const result = WmsCreateInternalRequestSchema.safeParse({
      material_id: 10,
      quantity: 5,
      from_warehouse_id: 1,
      to_warehouse_id: 2,
      notes: 'Transfer needed',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing material_id', () => {
    const result = WmsCreateInternalRequestSchema.safeParse({ quantity: 5 });
    expect(result.success).toBe(false);
  });

  it('rejects missing quantity', () => {
    const result = WmsCreateInternalRequestSchema.safeParse({ material_id: 10 });
    expect(result.success).toBe(false);
  });
});

describe('WmsUpdateInternalRequestSchema', () => {
  it('accepts all optional fields', () => {
    const result = WmsUpdateInternalRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts status update', () => {
    const result = WmsUpdateInternalRequestSchema.safeParse({ status: 'approved' });
    expect(result.success).toBe(true);
  });

  it('accepts notes update', () => {
    const result = WmsUpdateInternalRequestSchema.safeParse({ notes: 'Approved by manager' });
    expect(result.success).toBe(true);
  });

  it('rejects array input', () => {
    const result = WmsUpdateInternalRequestSchema.safeParse([{ status: 'approved' }]);
    expect(result.success).toBe(false);
  });
});
