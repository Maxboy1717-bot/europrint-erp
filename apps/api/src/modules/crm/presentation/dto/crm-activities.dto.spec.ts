/**
 * @module crm-activities.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  CreateActivityDtoSchema,
  CompleteActivityDtoSchema,
  UpdateActivityDtoSchema,
} from './crm-activities.dto';

describe('CreateActivityDtoSchema', () => {
  it('accepts all optional fields', () => {
    const result = CreateActivityDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid full input with controller-used fields', () => {
    const result = CreateActivityDtoSchema.safeParse({
      type: 'call',
      subject: 'Follow-up call',
      title: 'Follow-up call',
      description: 'Call with client',
      notes: 'Client prefers morning',
      status: 'pending',
      lead_id: 1,
      deal_id: 2,
      assigned_to: 5,
      scheduled_at: '2024-06-15T10:00:00Z',
      due_date: '2024-06-20',
      duration_minutes: 30,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty type string', () => {
    const result = CreateActivityDtoSchema.safeParse({ type: '' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive lead_id', () => {
    const result = CreateActivityDtoSchema.safeParse({ lead_id: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive duration_minutes', () => {
    const result = CreateActivityDtoSchema.safeParse({ duration_minutes: -5 });
    expect(result.success).toBe(false);
  });
});

describe('CompleteActivityDtoSchema', () => {
  it('accepts empty body', () => {
    const result = CompleteActivityDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid outcome', () => {
    const result = CompleteActivityDtoSchema.safeParse({ outcome: 'Positive response from client' });
    expect(result.success).toBe(true);
  });
});

describe('UpdateActivityDtoSchema', () => {
  it('accepts partial update', () => {
    const result = UpdateActivityDtoSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = UpdateActivityDtoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
