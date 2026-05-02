
import {
  UpdateLeadDtoSchema,
  UpdateLeadStageDtoSchema,
  ConvertLeadDtoSchema,
} from './crm-leads-ops.dto';

describe('UpdateLeadDtoSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = UpdateLeadDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid lead update', () => {
    const result = UpdateLeadDtoSchema.safeParse({
      firstName: 'Dilnoza',
      lastName: 'Karimova',
      email: 'dilnoza@example.com',
      phone: '+998901234567',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = UpdateLeadDtoSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects phone shorter than 7 chars', () => {
    const result = UpdateLeadDtoSchema.safeParse({ phone: '123' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateLeadStageDtoSchema', () => {
  it('accepts valid stage_id', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({ stage_id: 3 });
    expect(result.success).toBe(true);
  });

  it('accepts stage_id with optional notes', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({ stage_id: 2, notes: 'Customer agreed to demo' });
    expect(result.success).toBe(true);
  });

  it('rejects missing stage_id', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-positive stage_id', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({ stage_id: 0 });
    expect(result.success).toBe(false);
  });
});

describe('ConvertLeadDtoSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = ConvertLeadDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts deal_name and expected_amount', () => {
    const result = ConvertLeadDtoSchema.safeParse({ deal_name: 'Print Batch Q3', expected_amount: 5_000_000 });
    expect(result.success).toBe(true);
  });

  it('rejects empty deal_name', () => {
    const result = ConvertLeadDtoSchema.safeParse({ deal_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative expected_amount', () => {
    const result = ConvertLeadDtoSchema.safeParse({ expected_amount: -100 });
    expect(result.success).toBe(false);
  });

  it('accepts zero expected_amount', () => {
    const result = ConvertLeadDtoSchema.safeParse({ expected_amount: 0 });
    expect(result.success).toBe(true);
  });
});
