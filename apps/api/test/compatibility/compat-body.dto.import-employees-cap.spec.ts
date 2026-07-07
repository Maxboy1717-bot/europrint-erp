/**
 * test/compatibility/compat-body.dto.import-employees-cap.spec.ts
 *
 * C9.1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): ImportEmployeesSchema's `employees` array had no
 * upper bound — a caller could submit an arbitrarily large JSON array via @Body (bypasses the
 * global multipart file-size cap since this isn't a file upload), and the handler does one
 * INSERT per row with no batching (memory/DoS exposure).
 */

import { ImportEmployeesDto } from '../../src/modules/compatibility/dto/compat-body.dto';

type ZodDtoStatics = { create: (input: unknown) => unknown };

describe('ImportEmployeesDto — C9.1 DoS cap', () => {
  const dto = ImportEmployeesDto as unknown as ZodDtoStatics;

  it('rejects a batch larger than 1000 rows', () => {
    const employees = Array.from({ length: 1001 }, () => ({ first_name: 'A', last_name: 'B' }));
    expect(() => dto.create({ employees })).toThrow();
  });

  it('accepts a batch of exactly 1000 rows', () => {
    const employees = Array.from({ length: 1000 }, () => ({ first_name: 'A', last_name: 'B' }));
    expect(() => dto.create({ employees })).not.toThrow();
  });

  it('still rejects an empty batch (pre-existing .min(1) unaffected)', () => {
    expect(() => dto.create({ employees: [] })).toThrow();
  });

  it('accepts a normal small batch', () => {
    const employees = [{ first_name: 'John', last_name: 'Doe' }];
    expect(() => dto.create({ employees })).not.toThrow();
  });
});
