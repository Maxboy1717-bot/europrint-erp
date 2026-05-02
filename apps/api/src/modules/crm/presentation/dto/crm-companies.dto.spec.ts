
import {
  CheckCompanyDuplicatesDtoSchema,
  CreateCompanyDtoSchema,
  UpdateCreditLimitDtoSchema,
  CreateLeadStageDtoSchema,
  UpdateLeadStageDtoSchema,
} from './crm-companies.dto';

describe('CheckCompanyDuplicatesDtoSchema', () => {
  it('accepts name only', () => {
    const result = CheckCompanyDuplicatesDtoSchema.safeParse({ name: 'Acme' });
    expect(result.success).toBe(true);
  });

  it('accepts inn only', () => {
    const result = CheckCompanyDuplicatesDtoSchema.safeParse({ inn: '1234567890' });
    expect(result.success).toBe(true);
  });

  it('accepts both name and inn', () => {
    const result = CheckCompanyDuplicatesDtoSchema.safeParse({ name: 'Acme', inn: '123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty object (neither name nor inn)', () => {
    const result = CheckCompanyDuplicatesDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty name string', () => {
    const result = CheckCompanyDuplicatesDtoSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('CreateCompanyDtoSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = CreateCompanyDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid company data', () => {
    const result = CreateCompanyDtoSchema.safeParse({
      name: 'EuroPrint LLC',
      inn: '302345678',
      phone: '+998901234567',
      email: 'info@europrint.uz',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = CreateCompanyDtoSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateCreditLimitDtoSchema', () => {
  it('accepts zero credit limit', () => {
    const result = UpdateCreditLimitDtoSchema.safeParse({ credit_limit: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts positive credit limit', () => {
    const result = UpdateCreditLimitDtoSchema.safeParse({ credit_limit: 5_000_000 });
    expect(result.success).toBe(true);
  });

  it('rejects negative credit limit', () => {
    const result = UpdateCreditLimitDtoSchema.safeParse({ credit_limit: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects missing credit_limit', () => {
    const result = UpdateCreditLimitDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('CreateLeadStageDtoSchema', () => {
  it('accepts valid name', () => {
    const result = CreateLeadStageDtoSchema.safeParse({ name: 'Qualification' });
    expect(result.success).toBe(true);
  });

  it('accepts name with optional fields', () => {
    const result = CreateLeadStageDtoSchema.safeParse({ name: 'Proposal', color: '#FF5733', sort_order: 2 });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CreateLeadStageDtoSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 200 chars', () => {
    const result = CreateLeadStageDtoSchema.safeParse({ name: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects negative sort_order', () => {
    const result = CreateLeadStageDtoSchema.safeParse({ name: 'Stage', sort_order: -1 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateLeadStageDtoSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid name update', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('accepts full valid update', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({
      name: 'Won',
      color: '#00ff00',
      sort_order: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name string', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 200 chars', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({ name: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects negative sort_order', () => {
    const result = UpdateLeadStageDtoSchema.safeParse({ sort_order: -1 });
    expect(result.success).toBe(false);
  });
});
