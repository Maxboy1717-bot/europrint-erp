/**
 * @module ai-wms.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  AiWmsReorderPointDtoSchema,
  AiWmsOptimizeStockDtoSchema,
  AiWmsDeliveryPredictDtoSchema,
  AiWmsRouteOptimizeDtoSchema,
} from './ai-wms.dto';

describe('AiWmsReorderPointDtoSchema', () => {
  const valid = {
    itemName: 'Paper A4',
    currentStock: 200,
    avgDailyUsage: 10,
    leadTimeDays: 5,
    historicalUsage: [10, 12, 8, 11],
  };

  it('accepts valid input', () => {
    const result = AiWmsReorderPointDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects negative currentStock', () => {
    const result = AiWmsReorderPointDtoSchema.safeParse({ ...valid, currentStock: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive leadTimeDays', () => {
    const result = AiWmsReorderPointDtoSchema.safeParse({ ...valid, leadTimeDays: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects historicalUsage with more than 365 entries', () => {
    const result = AiWmsReorderPointDtoSchema.safeParse({
      ...valid,
      historicalUsage: Array.from({ length: 366 }, () => 10),
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty historicalUsage', () => {
    const result = AiWmsReorderPointDtoSchema.safeParse({ ...valid, historicalUsage: [] });
    expect(result.success).toBe(true);
  });
});

describe('AiWmsOptimizeStockDtoSchema', () => {
  it('accepts valid inventorySnapshot', () => {
    const result = AiWmsOptimizeStockDtoSchema.safeParse({
      inventorySnapshot: [{ sku: 'A1', qty: 100 }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty inventorySnapshot', () => {
    const result = AiWmsOptimizeStockDtoSchema.safeParse({ inventorySnapshot: [] });
    expect(result.success).toBe(true);
  });

  it('rejects missing inventorySnapshot', () => {
    const result = AiWmsOptimizeStockDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('AiWmsDeliveryPredictDtoSchema', () => {
  const valid = {
    origin: 'Tashkent',
    destination: 'Samarkand',
    itemType: 'Fragile',
    orderDate: '2024-01-15',
    historicalDeliveries: [],
  };

  it('accepts valid input', () => {
    const result = AiWmsDeliveryPredictDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty origin', () => {
    const result = AiWmsDeliveryPredictDtoSchema.safeParse({ ...valid, origin: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty orderDate', () => {
    const result = AiWmsDeliveryPredictDtoSchema.safeParse({ ...valid, orderDate: '' });
    expect(result.success).toBe(false);
  });
});

describe('AiWmsRouteOptimizeDtoSchema', () => {
  it('accepts valid deliveries and startLocation', () => {
    const result = AiWmsRouteOptimizeDtoSchema.safeParse({
      deliveries: [{ address: 'Street 1' }, { address: 'Street 2' }],
      startLocation: 'Warehouse A',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty startLocation', () => {
    const result = AiWmsRouteOptimizeDtoSchema.safeParse({ deliveries: [], startLocation: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing startLocation', () => {
    const result = AiWmsRouteOptimizeDtoSchema.safeParse({ deliveries: [] });
    expect(result.success).toBe(false);
  });
});
