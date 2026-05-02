import {
  AiCrmChurnRiskDtoSchema,
  AiCrmEmailTemplateDtoSchema,
  AiCrmNextBestActionDtoSchema,
} from './ai-crm.dto';

describe('AiCrmChurnRiskDtoSchema', () => {
  it('accepts valid activityData record', () => {
    const result = AiCrmChurnRiskDtoSchema.safeParse({ activityData: { logins: 2, deals: 0 } });
    expect(result.success).toBe(true);
  });

  it('accepts empty activityData record', () => {
    const result = AiCrmChurnRiskDtoSchema.safeParse({ activityData: {} });
    expect(result.success).toBe(true);
  });

  it('rejects missing activityData', () => {
    const result = AiCrmChurnRiskDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-object activityData', () => {
    const result = AiCrmChurnRiskDtoSchema.safeParse({ activityData: 'string' });
    expect(result.success).toBe(false);
  });
});

describe('AiCrmEmailTemplateDtoSchema', () => {
  const valid = { purpose: 'FOLLOW_UP' as const, contactName: 'Alisher', context: 'Client met at expo' };

  it('accepts valid input', () => {
    const result = AiCrmEmailTemplateDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid purpose enum', () => {
    const result = AiCrmEmailTemplateDtoSchema.safeParse({ ...valid, purpose: 'UNKNOWN' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid purpose values', () => {
    for (const purpose of ['FOLLOW_UP', 'PROPOSAL', 'RE_ENGAGE', 'THANK_YOU'] as const) {
      const result = AiCrmEmailTemplateDtoSchema.safeParse({ ...valid, purpose });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty contactName', () => {
    const result = AiCrmEmailTemplateDtoSchema.safeParse({ ...valid, contactName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects context exceeding 2000 chars', () => {
    const result = AiCrmEmailTemplateDtoSchema.safeParse({ ...valid, context: 'x'.repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe('AiCrmNextBestActionDtoSchema', () => {
  it('accepts valid lastActivities array', () => {
    const result = AiCrmNextBestActionDtoSchema.safeParse({ lastActivities: ['called', 'emailed'] });
    expect(result.success).toBe(true);
  });

  it('accepts empty lastActivities array', () => {
    const result = AiCrmNextBestActionDtoSchema.safeParse({ lastActivities: [] });
    expect(result.success).toBe(true);
  });

  it('rejects missing lastActivities', () => {
    const result = AiCrmNextBestActionDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects lastActivities with more than 50 items', () => {
    const result = AiCrmNextBestActionDtoSchema.safeParse({
      lastActivities: Array.from({ length: 51 }, (_, i) => `activity${i}`),
    });
    expect(result.success).toBe(false);
  });
});
