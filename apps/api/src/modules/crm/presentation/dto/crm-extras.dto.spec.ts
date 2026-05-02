import {
  CreateCommentDtoSchema,
  CreateTaskDtoSchema,
} from './crm-extras.dto';

describe('CreateCommentDtoSchema', () => {
  it('accepts valid comment with lead_id', () => {
    const result = CreateCommentDtoSchema.safeParse({ text: 'Great call!', lead_id: 1 });
    expect(result.success).toBe(true);
  });

  it('accepts valid comment with deal_id', () => {
    const result = CreateCommentDtoSchema.safeParse({ text: 'Contract signed', deal_id: 5 });
    expect(result.success).toBe(true);
  });

  it('accepts text without optional fields', () => {
    const result = CreateCommentDtoSchema.safeParse({ text: 'Just a note' });
    expect(result.success).toBe(true);
  });

  it('rejects empty text', () => {
    const result = CreateCommentDtoSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing text', () => {
    const result = CreateCommentDtoSchema.safeParse({ lead_id: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive lead_id', () => {
    const result = CreateCommentDtoSchema.safeParse({ text: 'Note', lead_id: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive author_id', () => {
    const result = CreateCommentDtoSchema.safeParse({ text: 'Note', author_id: -1 });
    expect(result.success).toBe(false);
  });
});

describe('CreateTaskDtoSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = CreateTaskDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid task data', () => {
    const result = CreateTaskDtoSchema.safeParse({
      title: 'Send proposal',
      description: 'Send the updated proposal to the client',
      due_date: '2024-07-01',
      lead_id: 3,
      assignee_id: 7,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = CreateTaskDtoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 500 chars', () => {
    const result = CreateTaskDtoSchema.safeParse({ title: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive assignee_id', () => {
    const result = CreateTaskDtoSchema.safeParse({ title: 'Task', assignee_id: 0 });
    expect(result.success).toBe(false);
  });

  it('allows extra fields via passthrough', () => {
    const result = CreateTaskDtoSchema.safeParse({ title: 'Task', priority: 'high' });
    expect(result.success).toBe(true);
  });
});
