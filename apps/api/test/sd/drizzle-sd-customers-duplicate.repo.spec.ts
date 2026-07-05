/**
 * test/sd/drizzle-sd-customers-duplicate.repo.spec.ts
 *
 * G4 (Residual Fix Loop, B11): DrizzleSdCustomersRepository.create() used to
 * have no duplicate-prevention — a customer could be created twice under the
 * same STIR (tax id) or phone with no error, since sd_customers has no
 * DB-level unique constraint on either column. Proves the new
 * findDuplicate() pre-check now rejects a matching create with a
 * ConflictException, while a distinct customer still succeeds.
 *
 * Strategy: mock @shared/db (runQuery) so no real DB call is made, mirroring
 * test/hr/save-360-feedback.repo.spec.ts (same Residual Fix Loop G2 task).
 */

const mockRunQuery = jest.fn();

jest.mock('@shared/db', () => ({
  runQuery: (...args: unknown[]) => mockRunQuery(...args),
}));

jest.mock('@common/database/queries-sd', () => ({
  execSdCustomerSoftDelete: jest.fn(),
}));

import { ConflictException } from '@nestjs/common';
import { DrizzleSdCustomersRepository } from '../../src/modules/sd/infrastructure/repositories/drizzle-sd-customers.repo';

describe('DrizzleSdCustomersRepository.create (G4 duplicate-prevention, B11)', () => {
  let repo: DrizzleSdCustomersRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new DrizzleSdCustomersRepository();
  });

  it('throws ConflictException when an existing customer matches on STIR', async () => {
    mockRunQuery.mockResolvedValueOnce({
      rows: [{ id: 3, name: 'Existing Co', stir: '123456789', phone: null }],
    });

    await expect(
      repo.create({ name: 'New Co', stir: '123456789' }),
    ).rejects.toBeInstanceOf(ConflictException);

    // Only the duplicate-lookup query ran — no INSERT was attempted.
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it('throws ConflictException when an existing customer matches on phone', async () => {
    mockRunQuery.mockResolvedValueOnce({
      rows: [{ id: 4, name: 'Existing Co 2', stir: null, phone: '+998901234567' }],
    });

    await expect(
      repo.create({ name: 'New Co 2', phone: '+998901234567' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it('creates successfully when no existing customer matches STIR or phone', async () => {
    mockRunQuery
      .mockResolvedValueOnce({ rows: [] }) // duplicate lookup: none found
      .mockResolvedValueOnce({
        rows: [{ id: 10, name: 'Fresh Co', stir: '999999999', phone: '+998900000000', status: 'new' }],
      });

    const row = await repo.create({ name: 'Fresh Co', stir: '999999999', phone: '+998900000000' });

    expect(row.id).toBe(10);
    expect(mockRunQuery).toHaveBeenCalledTimes(2);
  });

  it('skips the duplicate lookup entirely when neither STIR nor phone is supplied', async () => {
    mockRunQuery.mockResolvedValueOnce({
      rows: [{ id: 11, name: 'No Key Co', status: 'new' }],
    });

    const row = await repo.create({ name: 'No Key Co' });

    expect(row.id).toBe(11);
    // Only the INSERT ran — findDuplicate short-circuited before querying.
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });
});
