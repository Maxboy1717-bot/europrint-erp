/**
 * @module ai-finance.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  AiFinanceCashflowDtoSchema,
  AiFinanceBudgetVarianceDtoSchema,
  AiFinanceClassifyInvoiceDtoSchema,
  AiFinanceFraudRiskDtoSchema,
} from './ai-finance.dto';

describe('AiFinanceCashflowDtoSchema', () => {
  const validMonth = { month: '2024-01', inflow: 500_000, outflow: 400_000 };

  it('accepts valid historicalData', () => {
    const result = AiFinanceCashflowDtoSchema.safeParse({ historicalData: [validMonth] });
    expect(result.success).toBe(true);
  });

  it('rejects empty historicalData array', () => {
    const result = AiFinanceCashflowDtoSchema.safeParse({ historicalData: [] });
    expect(result.success).toBe(false);
  });

  it('rejects negative inflow', () => {
    const result = AiFinanceCashflowDtoSchema.safeParse({
      historicalData: [{ ...validMonth, inflow: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 120 months', () => {
    const data = Array.from({ length: 121 }, (_, i) => ({ month: `2020-${i}`, inflow: 0, outflow: 0 }));
    const result = AiFinanceCashflowDtoSchema.safeParse({ historicalData: data });
    expect(result.success).toBe(false);
  });
});

describe('AiFinanceBudgetVarianceDtoSchema', () => {
  const valid = { category: 'Marketing', budgeted: 100_000, actual: 120_000, context: 'Exceeded due to campaign' };

  it('accepts valid input', () => {
    const result = AiFinanceBudgetVarianceDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty category', () => {
    const result = AiFinanceBudgetVarianceDtoSchema.safeParse({ ...valid, category: '' });
    expect(result.success).toBe(false);
  });

  it('requires context', () => {
    const { context: _, ...rest } = valid;
    const result = AiFinanceBudgetVarianceDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('AiFinanceClassifyInvoiceDtoSchema', () => {
  const valid = { description: 'Office supplies', amount: 500, vendor: 'Acme Corp' };

  it('accepts valid invoice data', () => {
    const result = AiFinanceClassifyInvoiceDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects non-positive amount', () => {
    const result = AiFinanceClassifyInvoiceDtoSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects empty vendor', () => {
    const result = AiFinanceClassifyInvoiceDtoSchema.safeParse({ ...valid, vendor: '' });
    expect(result.success).toBe(false);
  });
});

describe('AiFinanceFraudRiskDtoSchema', () => {
  it('accepts any record for transactionData', () => {
    const result = AiFinanceFraudRiskDtoSchema.safeParse({ transactionData: { amount: 99, ip: '1.2.3.4' } });
    expect(result.success).toBe(true);
  });

  it('rejects missing transactionData', () => {
    const result = AiFinanceFraudRiskDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
