/**
 * @module director.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  ZnoCreateSchema,
  ZvsCreateSchema,
  CoordinationCreateDoklaSchema,
  KaizenCreateSuggestionSchema,
  OkrCreateObjectiveSchema,
  OkrCreateKeyResultSchema,
  SfCreateFunctionSchema,
  SfCreateKpiSchema,
  CoordinationCreateRaspSchema,
} from './director.dto';

describe('ZnoCreateSchema', () => {
  it('accepts valid ZNO request', () => {
    const result = ZnoCreateSchema.safeParse({ purpose: 'Buy paper', amount: 500000 });
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = ZnoCreateSchema.safeParse({
      purpose: 'Office supplies',
      amount: 1000000,
      department_id: 3,
      submitter_name: 'John',
      payment_date: '2026-02-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing purpose', () => {
    const result = ZnoCreateSchema.safeParse({ amount: 500000 });
    expect(result.success).toBe(false);
  });

  it('rejects empty purpose', () => {
    const result = ZnoCreateSchema.safeParse({ purpose: '', amount: 500000 });
    expect(result.success).toBe(false);
  });

  it('rejects missing amount', () => {
    const result = ZnoCreateSchema.safeParse({ purpose: 'Buy paper' });
    expect(result.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = ZnoCreateSchema.safeParse({ purpose: 'Buy paper', amount: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = ZnoCreateSchema.safeParse({ purpose: 'Buy paper', amount: -100 });
    expect(result.success).toBe(false);
  });
});

describe('ZvsCreateSchema', () => {
  it('accepts valid ZVS request', () => {
    const result = ZvsCreateSchema.safeParse({ purpose: 'Weekly supplies', amount: 200000 });
    expect(result.success).toBe(true);
  });

  it('accepts valid priority values', () => {
    for (const p of ['low', 'normal', 'high', 'urgent'] as const) {
      const result = ZvsCreateSchema.safeParse({ purpose: 'test', amount: 100, priority: p });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid priority', () => {
    const result = ZvsCreateSchema.safeParse({ purpose: 'test', amount: 100, priority: 'critical' });
    expect(result.success).toBe(false);
  });

  it('rejects missing purpose', () => {
    const result = ZvsCreateSchema.safeParse({ amount: 200000 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive amount', () => {
    const result = ZvsCreateSchema.safeParse({ purpose: 'test', amount: 0 });
    expect(result.success).toBe(false);
  });
});

describe('CoordinationCreateDoklaSchema', () => {
  it('accepts valid dokla with title', () => {
    const result = CoordinationCreateDoklaSchema.safeParse({ title: 'Dokla title' });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = CoordinationCreateDoklaSchema.safeParse({ description: 'No title' });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = CoordinationCreateDoklaSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});

describe('KaizenCreateSuggestionSchema', () => {
  it('accepts valid suggestion', () => {
    const result = KaizenCreateSuggestionSchema.safeParse({
      title: 'Improve workflow',
      description: 'Detailed description of the improvement',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing description', () => {
    const result = KaizenCreateSuggestionSchema.safeParse({ title: 'Some title' });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = KaizenCreateSuggestionSchema.safeParse({ title: 'Title', description: '' });
    expect(result.success).toBe(false);
  });
});

describe('OkrCreateObjectiveSchema', () => {
  it('accepts valid objective with title', () => {
    const result = OkrCreateObjectiveSchema.safeParse({ title: 'Increase revenue 20%' });
    expect(result.success).toBe(true);
  });

  it('accepts full objective', () => {
    const result = OkrCreateObjectiveSchema.safeParse({
      title: 'Increase revenue',
      type: 'financial',
      year: 2026,
      quarter: 'Q1',
      description: 'Grow revenue by 20%',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = OkrCreateObjectiveSchema.safeParse({ year: 2026 });
    expect(result.success).toBe(false);
  });
});

describe('OkrCreateKeyResultSchema', () => {
  it('accepts valid key result', () => {
    const result = OkrCreateKeyResultSchema.safeParse({
      objective_id: 1,
      title: 'Reach 1000 customers',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing objective_id', () => {
    const result = OkrCreateKeyResultSchema.safeParse({ title: 'No objective' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive objective_id', () => {
    const result = OkrCreateKeyResultSchema.safeParse({ objective_id: 0, title: 'test' });
    expect(result.success).toBe(false);
  });
});

describe('SfCreateFunctionSchema', () => {
  it('accepts valid function with name', () => {
    const result = SfCreateFunctionSchema.safeParse({ name: 'Sales Management' });
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = SfCreateFunctionSchema.safeParse({
      name: 'HR Function',
      description: 'Manages human resources',
      owner_id: 5,
      order_index: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = SfCreateFunctionSchema.safeParse({ description: 'No name' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = SfCreateFunctionSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('SfCreateKpiSchema', () => {
  it('accepts valid KPI with required fields', () => {
    const result = SfCreateKpiSchema.safeParse({ function_id: 1, name: 'Revenue KPI' });
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = SfCreateKpiSchema.safeParse({
      function_id: 1,
      name: 'Revenue KPI',
      target_value: 1000000,
      unit: 'UZS',
      responsible_id: 3,
      frequency: 'monthly',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing function_id', () => {
    const result = SfCreateKpiSchema.safeParse({ name: 'KPI without function' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = SfCreateKpiSchema.safeParse({ function_id: 1 });
    expect(result.success).toBe(false);
  });
});

describe('CoordinationCreateRaspSchema', () => {
  it('accepts valid rasporyazhenie with title', () => {
    const result = CoordinationCreateRaspSchema.safeParse({ title: 'Complete the report' });
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = CoordinationCreateRaspSchema.safeParse({
      title: 'Urgent task',
      description: 'Details here',
      deadline: '2026-05-01',
      assignee_id: 10,
      to_user: 'user123',
      priority: 'high',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = CoordinationCreateRaspSchema.safeParse({ description: 'No title' });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = CoordinationCreateRaspSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = CoordinationCreateRaspSchema.safeParse({ title: 'Task', priority: 'critical' });
    expect(result.success).toBe(false);
  });
});
