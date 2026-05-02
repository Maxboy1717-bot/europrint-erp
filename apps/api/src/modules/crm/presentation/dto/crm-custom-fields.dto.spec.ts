import {
  CreateCustomFieldDtoSchema,
  ReorderCustomFieldsDtoSchema,
} from './crm-custom-fields.dto';

describe('CreateCustomFieldDtoSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = CreateCustomFieldDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid custom field data', () => {
    const result = CreateCustomFieldDtoSchema.safeParse({
      name: 'project_code',
      field_type: 'text',
      entity_type: 'lead',
      is_required: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CreateCustomFieldDtoSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 200 chars', () => {
    const result = CreateCustomFieldDtoSchema.safeParse({ name: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects empty field_type', () => {
    const result = CreateCustomFieldDtoSchema.safeParse({ field_type: '' });
    expect(result.success).toBe(false);
  });

  it('allows extra fields via passthrough', () => {
    const result = CreateCustomFieldDtoSchema.safeParse({ name: 'code', extra: 'data' });
    expect(result.success).toBe(true);
  });
});

describe('ReorderCustomFieldsDtoSchema', () => {
  it('accepts valid items array', () => {
    const result = ReorderCustomFieldsDtoSchema.safeParse({
      items: [
        { id: 1, order_index: 0 },
        { id: 2, order_index: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty items array', () => {
    const result = ReorderCustomFieldsDtoSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive item id', () => {
    const result = ReorderCustomFieldsDtoSchema.safeParse({
      items: [{ id: 0, order_index: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative order_index', () => {
    const result = ReorderCustomFieldsDtoSchema.safeParse({
      items: [{ id: 1, order_index: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing items', () => {
    const result = ReorderCustomFieldsDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
