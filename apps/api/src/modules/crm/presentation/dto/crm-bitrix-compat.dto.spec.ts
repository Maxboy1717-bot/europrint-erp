import {
  CreateRobotDtoSchema,
  UpdateRobotDtoSchema,
} from './crm-bitrix-compat.dto';

describe('CreateRobotDtoSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = CreateRobotDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid robot creation data', () => {
    const result = CreateRobotDtoSchema.safeParse({
      name: 'Email Sender',
      type: 'notification',
      config: { template: 'welcome', delay: 60 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects name exceeding 200 chars', () => {
    const result = CreateRobotDtoSchema.safeParse({ name: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects type exceeding 100 chars', () => {
    const result = CreateRobotDtoSchema.safeParse({ type: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('allows extra fields via passthrough', () => {
    const result = CreateRobotDtoSchema.safeParse({
      name: 'Bot',
      custom_field: 'value',
      nested: { key: 'data' },
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateRobotDtoSchema', () => {
  it('accepts partial update', () => {
    const result = UpdateRobotDtoSchema.safeParse({ name: 'Updated Bot' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = UpdateRobotDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
