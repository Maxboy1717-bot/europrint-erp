/**
 * @module crm-contacts.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  CheckContactDuplicatesDtoSchema,
  CreateContactDtoSchema,
} from './crm-contacts.dto';

describe('CheckContactDuplicatesDtoSchema', () => {
  it('accepts email only', () => {
    const result = CheckContactDuplicatesDtoSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts phone only', () => {
    const result = CheckContactDuplicatesDtoSchema.safeParse({ phone: '+998901234567' });
    expect(result.success).toBe(true);
  });

  it('accepts both email and phone', () => {
    const result = CheckContactDuplicatesDtoSchema.safeParse({ email: 'user@example.com', phone: '+998901234567' });
    expect(result.success).toBe(true);
  });

  it('rejects empty object (neither email nor phone)', () => {
    const result = CheckContactDuplicatesDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = CheckContactDuplicatesDtoSchema.safeParse({ email: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects phone shorter than 7 chars', () => {
    const result = CheckContactDuplicatesDtoSchema.safeParse({ phone: '123' });
    expect(result.success).toBe(false);
  });
});

describe('CreateContactDtoSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = CreateContactDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid contact', () => {
    const result = CreateContactDtoSchema.safeParse({
      first_name: 'Alisher',
      last_name: 'Toshmatov',
      email: 'alisher@example.com',
      phone: '+998901234567',
      company_id: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = CreateContactDtoSchema.safeParse({ email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('rejects first_name longer than 100 chars', () => {
    const result = CreateContactDtoSchema.safeParse({ first_name: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive company_id', () => {
    const result = CreateContactDtoSchema.safeParse({ company_id: 0 });
    expect(result.success).toBe(false);
  });
});
