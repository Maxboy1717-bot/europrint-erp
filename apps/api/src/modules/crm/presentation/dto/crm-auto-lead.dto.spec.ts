import {
  IngestCallLeadDtoSchema,
  IngestFormLeadDtoSchema,
  IngestTelegramLeadDtoSchema,
  IngestWebsiteLeadDtoSchema,
  ChurnRescueDtoSchema,
} from './crm-auto-lead.dto';

describe('IngestCallLeadDtoSchema', () => {
  it('accepts valid payload with phone', () => {
    const result = IngestCallLeadDtoSchema.safeParse({
      phone: '+998901234567',
      first_name: 'Ali',
      last_name: 'Valiev',
      notes: 'test note',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal payload (all optional)', () => {
    const result = IngestCallLeadDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts source_meta as record', () => {
    const result = IngestCallLeadDtoSchema.safeParse({ phone: '+998901234567', source_meta: { ad: 'google' } });
    expect(result.success).toBe(true);
  });

  it('rejects invalid notes exceeding max', () => {
    const result = IngestCallLeadDtoSchema.safeParse({ notes: 'a'.repeat(5001) });
    expect(result.success).toBe(false);
  });
});

describe('IngestFormLeadDtoSchema', () => {
  it('accepts valid email and phone', () => {
    const result = IngestFormLeadDtoSchema.safeParse({
      email: 'test@example.com',
      phone: '+998901234567',
      first_name: 'John',
      last_name: 'Doe',
      form_name: 'contact_form',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty payload', () => {
    const result = IngestFormLeadDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = IngestFormLeadDtoSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('IngestTelegramLeadDtoSchema', () => {
  it('accepts string telegram_id', () => {
    const result = IngestTelegramLeadDtoSchema.safeParse({
      telegram_id: '123456789',
      first_name: 'Ali',
      username: 'ali_uz',
      message: 'Salom!',
    });
    expect(result.success).toBe(true);
  });

  it('accepts numeric telegram_id', () => {
    const result = IngestTelegramLeadDtoSchema.safeParse({ telegram_id: 123456789 });
    expect(result.success).toBe(true);
  });

  it('accepts empty payload', () => {
    const result = IngestTelegramLeadDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('IngestWebsiteLeadDtoSchema', () => {
  it('accepts valid email and page_url', () => {
    const result = IngestWebsiteLeadDtoSchema.safeParse({
      email: 'user@site.com',
      page_url: 'https://example.com/contact',
      first_name: 'Bob',
      message: 'Interested',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty payload', () => {
    const result = IngestWebsiteLeadDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = IngestWebsiteLeadDtoSchema.safeParse({ email: 'bad-email' });
    expect(result.success).toBe(false);
  });
});

describe('ChurnRescueDtoSchema', () => {
  it('accepts any string-keyed record', () => {
    const result = ChurnRescueDtoSchema.safeParse({ customData: 'value', count: 5 });
    expect(result.success).toBe(true);
  });

  it('accepts empty record', () => {
    const result = ChurnRescueDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects non-object input', () => {
    const result = ChurnRescueDtoSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });

  it('rejects null input', () => {
    const result = ChurnRescueDtoSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});
