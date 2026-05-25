/**
 * Unit tests for AuthSchemaRepository.
 * Only public method: ensureOtpTables — delegates to ddl-migrations helper.
 */

const ensureOtpTablesMock = jest.fn().mockResolvedValue(undefined);

jest.mock('@common/database/ddl-migrations', () => ({
  ensureOtpTables: ensureOtpTablesMock,
}));

import { AuthSchemaRepository } from '../../src/modules/auth/infrastructure/auth-schema.repository';

describe('AuthSchemaRepository', () => {
  let repo: AuthSchemaRepository;
  beforeEach(() => {
    repo = new AuthSchemaRepository();
    ensureOtpTablesMock.mockReset().mockResolvedValue(undefined);
  });

  describe('ensureOtpTables', () => {
    it('returns Ok when helper resolves successfully', async () => {
      const r = await repo.ensureOtpTables();
      expect(r.ok).toBe(true);
      expect(ensureOtpTablesMock).toHaveBeenCalledTimes(1);
    });

    it('returns Ok again on repeated invocation (idempotent)', async () => {
      await repo.ensureOtpTables();
      const r2 = await repo.ensureOtpTables();
      expect(r2.ok).toBe(true);
      expect(ensureOtpTablesMock).toHaveBeenCalledTimes(2);
    });

    it('returns Err when helper rejects with DB error', async () => {
      ensureOtpTablesMock.mockRejectedValueOnce(new Error('cannot create table'));
      const r = await repo.ensureOtpTables();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('cannot create table');
    });

    it('returns Err when helper rejects with non-Error', async () => {
      ensureOtpTablesMock.mockRejectedValueOnce('string failure');
      const r = await repo.ensureOtpTables();
      expect(r.ok).toBe(false);
    });
  });
});
