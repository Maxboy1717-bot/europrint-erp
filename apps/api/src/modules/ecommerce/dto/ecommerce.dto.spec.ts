/**
 * @module ecommerce.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  EcommerceCreateOrderSchema,
  EcommerceUpdateOrderStatusSchema,
} from './ecommerce.dto';

describe('EcommerceCreateOrderSchema', () => {
  it('accepts empty order (all optional)', () => {
    const result = EcommerceCreateOrderSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full order with items', () => {
    const result = EcommerceCreateOrderSchema.safeParse({
      customer_id: 1,
      items: [
        { product_id: 5, quantity: 2, price: 15000 },
        { product_id: 6, quantity: 1 },
      ],
      total_amount: 45000,
      payment_method: 'card',
      delivery_address: '123 Main St',
      notes: 'Leave at door',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive customer_id', () => {
    const result = EcommerceCreateOrderSchema.safeParse({ customer_id: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects item with non-positive product_id', () => {
    const result = EcommerceCreateOrderSchema.safeParse({
      items: [{ product_id: 0, quantity: 5 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects item with zero quantity', () => {
    const result = EcommerceCreateOrderSchema.safeParse({
      items: [{ product_id: 1, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive total_amount', () => {
    const result = EcommerceCreateOrderSchema.safeParse({ total_amount: -100 });
    expect(result.success).toBe(false);
  });
});

describe('EcommerceUpdateOrderStatusSchema', () => {
  it('accepts valid status update', () => {
    const result = EcommerceUpdateOrderStatusSchema.safeParse({ status: 'shipped' });
    expect(result.success).toBe(true);
  });

  it('accepts status with notes', () => {
    const result = EcommerceUpdateOrderStatusSchema.safeParse({
      status: 'cancelled',
      notes: 'Customer requested cancellation',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing status', () => {
    const result = EcommerceUpdateOrderStatusSchema.safeParse({ notes: 'no status' });
    expect(result.success).toBe(false);
  });

  it('rejects empty status', () => {
    const result = EcommerceUpdateOrderStatusSchema.safeParse({ status: '' });
    expect(result.success).toBe(false);
  });
});
