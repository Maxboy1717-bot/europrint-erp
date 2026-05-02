import {
  CrmAiContextDtoSchema,
  CrmAiSuggestActionDtoSchema,
} from './crm-ai.dto';

describe('CrmAiContextDtoSchema', () => {
  it('accepts any string-keyed record', () => {
    const result = CrmAiContextDtoSchema.safeParse({ score: 80, notes: 'test' });
    expect(result.success).toBe(true);
  });

  it('accepts empty record', () => {
    const result = CrmAiContextDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects non-object input', () => {
    const result = CrmAiContextDtoSchema.safeParse('not an object');
    expect(result.success).toBe(false);
  });

  it('rejects null input', () => {
    const result = CrmAiContextDtoSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('rejects array input', () => {
    const result = CrmAiContextDtoSchema.safeParse([1, 2, 3]);
    expect(result.success).toBe(false);
  });
});

describe('CrmAiSuggestActionDtoSchema', () => {
  it('accepts lead_id only', () => {
    const result = CrmAiSuggestActionDtoSchema.safeParse({ lead_id: 5 });
    expect(result.success).toBe(true);
  });

  it('accepts deal_id only', () => {
    const result = CrmAiSuggestActionDtoSchema.safeParse({ deal_id: 3 });
    expect(result.success).toBe(true);
  });

  it('accepts both lead_id and deal_id', () => {
    const result = CrmAiSuggestActionDtoSchema.safeParse({ lead_id: 5, deal_id: 3 });
    expect(result.success).toBe(true);
  });

  it('rejects empty object (neither lead_id nor deal_id)', () => {
    const result = CrmAiSuggestActionDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-positive lead_id', () => {
    const result = CrmAiSuggestActionDtoSchema.safeParse({ lead_id: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive deal_id', () => {
    const result = CrmAiSuggestActionDtoSchema.safeParse({ deal_id: -1 });
    expect(result.success).toBe(false);
  });
});
