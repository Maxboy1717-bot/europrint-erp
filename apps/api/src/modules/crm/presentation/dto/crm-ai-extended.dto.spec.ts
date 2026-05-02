import { AutofillDtoSchema } from './crm-ai-extended.dto';

describe('AutofillDtoSchema', () => {
  it('accepts any string-keyed record', () => {
    const result = AutofillDtoSchema.safeParse({ entityType: 'lead', someField: 'value' });
    expect(result.success).toBe(true);
  });

  it('accepts empty record', () => {
    const result = AutofillDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts nested objects', () => {
    const result = AutofillDtoSchema.safeParse({ meta: { key: 'val' }, count: 42 });
    expect(result.success).toBe(true);
  });

  it('rejects non-object input', () => {
    const result = AutofillDtoSchema.safeParse('string');
    expect(result.success).toBe(false);
  });

  it('rejects null', () => {
    const result = AutofillDtoSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('rejects array input', () => {
    const result = AutofillDtoSchema.safeParse(['item']);
    expect(result.success).toBe(false);
  });
});
