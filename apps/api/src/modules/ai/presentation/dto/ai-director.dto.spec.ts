/**
 * @module ai-director.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  AiDirectorKpiExplainDtoSchema,
  AiDirectorRiskAssessDtoSchema,
  AiDirectorStrategicDtoSchema,
} from './ai-director.dto';

describe('AiDirectorKpiExplainDtoSchema', () => {
  const valid = {
    kpiName: 'Revenue Growth',
    currentValue: 1200000,
    targetValue: '2000000',
    historicalValues: [{ period: '2024-Q1', value: 900000 }],
    context: 'Q1 results are below plan due to seasonal dip.',
  };

  it('accepts valid input', () => {
    const result = AiDirectorKpiExplainDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty kpiName', () => {
    const result = AiDirectorKpiExplainDtoSchema.safeParse({ ...valid, kpiName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects kpiName longer than 200 chars', () => {
    const result = AiDirectorKpiExplainDtoSchema.safeParse({ ...valid, kpiName: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects missing historicalValues', () => {
    const { historicalValues: _, ...rest } = valid;
    const result = AiDirectorKpiExplainDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects context exceeding 2000 chars', () => {
    const result = AiDirectorKpiExplainDtoSchema.safeParse({ ...valid, context: 'x'.repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe('AiDirectorRiskAssessDtoSchema', () => {
  it('accepts any record for companyData', () => {
    const result = AiDirectorRiskAssessDtoSchema.safeParse({ companyData: { revenue: 1_000_000 } });
    expect(result.success).toBe(true);
  });

  it('accepts empty companyData object', () => {
    const result = AiDirectorRiskAssessDtoSchema.safeParse({ companyData: {} });
    expect(result.success).toBe(true);
  });

  it('rejects missing companyData', () => {
    const result = AiDirectorRiskAssessDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('AiDirectorStrategicDtoSchema', () => {
  it('accepts any record for businessContext', () => {
    const result = AiDirectorStrategicDtoSchema.safeParse({ businessContext: { market: 'UZ' } });
    expect(result.success).toBe(true);
  });

  it('rejects missing businessContext', () => {
    const result = AiDirectorStrategicDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
