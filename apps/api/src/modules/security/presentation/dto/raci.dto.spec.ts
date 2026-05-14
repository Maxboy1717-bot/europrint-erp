/**
 * @module raci.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  RaciCreateTaskSchema,
  RaciCreateAssignmentSchema,
  RaciCreateAssessmentSchema,
} from './raci.dto';

describe('RaciCreateTaskSchema', () => {
  it('accepts valid task with title', () => {
    const result = RaciCreateTaskSchema.safeParse({ title: 'Complete safety audit' });
    expect(result.success).toBe(true);
  });

  it('accepts full task with all fields', () => {
    const result = RaciCreateTaskSchema.safeParse({
      title: 'Complete safety audit',
      description: 'Annual safety review',
      responsible_id: 5,
      accountable_id: 3,
      deadline: '2026-03-31',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = RaciCreateTaskSchema.safeParse({ description: 'No title given' });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = RaciCreateTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive responsible_id', () => {
    const result = RaciCreateTaskSchema.safeParse({ title: 'Test', responsible_id: -1 });
    expect(result.success).toBe(false);
  });
});

describe('RaciCreateAssignmentSchema', () => {
  it('accepts valid assignment with numeric IDs', () => {
    const result = RaciCreateAssignmentSchema.safeParse({
      task_id: 1,
      employee_id: 5,
      role: 'responsible',
    });
    expect(result.success).toBe(true);
  });

  it('accepts string IDs', () => {
    const result = RaciCreateAssignmentSchema.safeParse({
      task_id: '1',
      employee_id: '5',
      role: 'accountable',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing role', () => {
    const result = RaciCreateAssignmentSchema.safeParse({ task_id: 1, employee_id: 5 });
    expect(result.success).toBe(false);
  });

  it('rejects empty role', () => {
    const result = RaciCreateAssignmentSchema.safeParse({ task_id: 1, employee_id: 5, role: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing task_id', () => {
    const result = RaciCreateAssignmentSchema.safeParse({ employee_id: 5, role: 'responsible' });
    expect(result.success).toBe(false);
  });

  it('rejects missing employee_id', () => {
    const result = RaciCreateAssignmentSchema.safeParse({ task_id: 1, role: 'responsible' });
    expect(result.success).toBe(false);
  });
});

describe('RaciCreateAssessmentSchema', () => {
  it('accepts valid assessment with title', () => {
    const result = RaciCreateAssessmentSchema.safeParse({ title: 'Fire risk assessment' });
    expect(result.success).toBe(true);
  });

  it('accepts full assessment', () => {
    const result = RaciCreateAssessmentSchema.safeParse({
      title: 'Fire risk assessment',
      risk_level: 'high',
      description: 'Risk of fire in storage area',
      likelihood: 3,
      impact: 4,
    });
    expect(result.success).toBe(true);
  });

  it('accepts all risk_level values', () => {
    for (const level of ['low', 'medium', 'high', 'critical'] as const) {
      const result = RaciCreateAssessmentSchema.safeParse({ title: 'Test', risk_level: level });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid risk_level', () => {
    const result = RaciCreateAssessmentSchema.safeParse({ title: 'Test', risk_level: 'extreme' });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const result = RaciCreateAssessmentSchema.safeParse({ risk_level: 'medium' });
    expect(result.success).toBe(false);
  });

  it('rejects likelihood out of range (0)', () => {
    const result = RaciCreateAssessmentSchema.safeParse({ title: 'Test', likelihood: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects impact out of range (6)', () => {
    const result = RaciCreateAssessmentSchema.safeParse({ title: 'Test', impact: 6 });
    expect(result.success).toBe(false);
  });
});
