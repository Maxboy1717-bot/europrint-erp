/**
 * @module sd-quotations.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  SdCreateQuotationSchema,
  SdCreateContractSchema,
  SdCalculatePriceSchema,
} from './sd-quotations.dto';

describe('SdCreateQuotationSchema', () => {
  it('accepts empty quotation (all optional)', () => {
    const result = SdCreateQuotationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full quotation', () => {
    const result = SdCreateQuotationSchema.safeParse({
      customer_id: 1,
      valid_until: '2026-03-31',
      discount: 10,
      payment_terms: 'Net 30',
      notes: 'Special pricing for Q1',
      items: [{ product_id: 5, quantity: 100, price: 2500 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects discount over 100', () => {
    const result = SdCreateQuotationSchema.safeParse({ discount: 110 });
    expect(result.success).toBe(false);
  });

  it('rejects negative discount', () => {
    const result = SdCreateQuotationSchema.safeParse({ discount: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects item with non-positive product_id', () => {
    const result = SdCreateQuotationSchema.safeParse({
      items: [{ product_id: 0, quantity: 10 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('SdCreateContractSchema', () => {
  it('accepts empty contract (all optional)', () => {
    const result = SdCreateContractSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full contract', () => {
    const result = SdCreateContractSchema.safeParse({
      customer_id: 1,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      total_amount: 50000000,
      payment_terms: 'Monthly',
      notes: 'Annual contract',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive total_amount', () => {
    const result = SdCreateContractSchema.safeParse({ total_amount: 0 });
    expect(result.success).toBe(false);
  });
});

describe('SdCalculatePriceSchema', () => {
  it('accepts valid product_id and quantity as numbers', () => {
    const result = SdCalculatePriceSchema.safeParse({ product_id: 5, quantity: 100 });
    expect(result.success).toBe(true);
  });

  it('accepts string product_id and quantity', () => {
    const result = SdCalculatePriceSchema.safeParse({ product_id: '5', quantity: '100' });
    expect(result.success).toBe(true);
  });

  it('accepts optional formula_id', () => {
    const result = SdCalculatePriceSchema.safeParse({ product_id: 5, quantity: 100, formula_id: 2 });
    expect(result.success).toBe(true);
  });

  it('rejects missing product_id', () => {
    const result = SdCalculatePriceSchema.safeParse({ quantity: 100 });
    expect(result.success).toBe(false);
  });

  it('rejects missing quantity', () => {
    const result = SdCalculatePriceSchema.safeParse({ product_id: 5 });
    expect(result.success).toBe(false);
  });

  it('rejects empty string product_id', () => {
    const result = SdCalculatePriceSchema.safeParse({ product_id: '', quantity: 100 });
    expect(result.success).toBe(false);
  });
});
