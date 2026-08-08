/**
 * test/sd/drizzle-sd-customers-soft-delete.repo.spec.ts
 *
 * VISION-3340 #63 (2026-07-08): DrizzleSdCustomersRepository.softDelete() used to
 * call execSdCustomerSoftDelete(cid) with no acting user, so sd_customers.deleted_by
 * stayed NULL forever even though the column existed live. Proves the repo now
 * threads an optional `deletedBy` straight through to the query helper.
 *
 * Strategy: mock @common/database/queries-sd (execSdCustomerSoftDelete) so no real
 * DB call is made, mirroring test/sd/drizzle-sd-customers-duplicate.repo.spec.ts
 * (same repo, same mocking pattern, G4/B11 task).
 */

const mockExecSdCustomerSoftDelete = jest.fn();

jest.mock('@shared/db', () => ({
  runQuery: jest.fn(),
}));

jest.mock('@common/database/queries-sd', () => ({
  execSdCustomerSoftDelete: (...args: unknown[]) => mockExecSdCustomerSoftDelete(...args),
}));

import { DrizzleSdCustomersRepository } from '../../src/modules/sd/infrastructure/repositories/drizzle-sd-customers.repo';

describe('DrizzleSdCustomersRepository.softDelete deletedBy wiring (VISION-3340 #63)', () => {
  let repo: DrizzleSdCustomersRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new DrizzleSdCustomersRepository();
  });

  it('threads deletedBy through to execSdCustomerSoftDelete', async () => {
    mockExecSdCustomerSoftDelete.mockResolvedValue(undefined);

    await repo.softDelete(42, 9);

    expect(mockExecSdCustomerSoftDelete).toHaveBeenCalledTimes(1);
    expect(mockExecSdCustomerSoftDelete).toHaveBeenCalledWith(42, 9);
  });

  it('passes undefined deletedBy through when no acting user is known', async () => {
    mockExecSdCustomerSoftDelete.mockResolvedValue(undefined);

    await repo.softDelete(42);

    expect(mockExecSdCustomerSoftDelete).toHaveBeenCalledWith(42, undefined);
  });
});
