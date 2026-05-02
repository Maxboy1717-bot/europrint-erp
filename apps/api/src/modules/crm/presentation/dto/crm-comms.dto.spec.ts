
import {
  SendEmailDtoSchema,
  ScheduleMeetingDtoSchema,
  SendSmsDtoSchema,
  SendWhatsappDtoSchema,
} from './crm-comms.dto';

describe('SendEmailDtoSchema', () => {
  const valid = { to: 'user@example.com', subject: 'Hello', body: 'World' };

  it('accepts valid email data', () => {
    const result = SendEmailDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email address', () => {
    const result = SendEmailDtoSchema.safeParse({ ...valid, to: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty subject', () => {
    const result = SendEmailDtoSchema.safeParse({ ...valid, subject: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty body', () => {
    const result = SendEmailDtoSchema.safeParse({ ...valid, body: '' });
    expect(result.success).toBe(false);
  });

  it('rejects body exceeding 50000 chars', () => {
    const result = SendEmailDtoSchema.safeParse({ ...valid, body: 'x'.repeat(50_001) });
    expect(result.success).toBe(false);
  });

  it('accepts optional lead_id', () => {
    const result = SendEmailDtoSchema.safeParse({ ...valid, lead_id: 5 });
    expect(result.success).toBe(true);
  });
});

describe('ScheduleMeetingDtoSchema', () => {
  it('accepts valid meeting title', () => {
    const result = ScheduleMeetingDtoSchema.safeParse({ title: 'Product Demo' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = ScheduleMeetingDtoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('accepts all optional fields', () => {
    const result = ScheduleMeetingDtoSchema.safeParse({
      title: 'Demo',
      lead_id: 1,
      deal_id: 2,
      scheduled_at: '2024-06-20T14:00:00Z',
      attendees: [{ email: 'a@b.com' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('SendSmsDtoSchema', () => {
  const valid = { phone: '+998901234567', message: 'Hello from EuroPrint' };

  it('accepts valid SMS data', () => {
    const result = SendSmsDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects phone shorter than 7 chars', () => {
    const result = SendSmsDtoSchema.safeParse({ ...valid, phone: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects empty message', () => {
    const result = SendSmsDtoSchema.safeParse({ ...valid, message: '' });
    expect(result.success).toBe(false);
  });

  it('rejects message exceeding 2000 chars', () => {
    const result = SendSmsDtoSchema.safeParse({ ...valid, message: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe('SendWhatsappDtoSchema', () => {
  const valid = { phone: '+998901234567', message: 'Hello from EuroPrint via WhatsApp' };

  it('accepts valid WhatsApp data', () => {
    const result = SendWhatsappDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects phone exceeding 20 chars', () => {
    const result = SendWhatsappDtoSchema.safeParse({ ...valid, phone: '1'.repeat(21) });
    expect(result.success).toBe(false);
  });

  it('rejects message exceeding 4096 chars', () => {
    const result = SendWhatsappDtoSchema.safeParse({ ...valid, message: 'x'.repeat(4097) });
    expect(result.success).toBe(false);
  });
});
