/**
 * Unit tests for OtpSessionRepository.
 * Covers Ok / Err for invalidatePending, insert, findBySessionId, markUsed.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  otp_sessions: {
    id: 'otp.id',
    identifier: 'otp.identifier',
    used: 'otp.used',
    code: 'otp.code',
    expires_at: 'otp.expires_at',
    session_id: 'otp.session_id',
  },
}));

import { OtpSessionRepository } from '../../src/modules/auth/infrastructure/repositories/otp-session.repository';

describe('OtpSessionRepository', () => {
  let repo: OtpSessionRepository;
  beforeEach(() => {
    repo = new OtpSessionRepository();
    dbStub.__setResolved([]);
  });

  describe('invalidatePending', () => {
    it('returns Ok when update succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.invalidatePending('+998901234567');
      expect(r.ok).toBe(true);
    });

    it('returns Ok when no pending sessions match', async () => {
      dbStub.__setResolved([]);
      const r = await repo.invalidatePending('+998000000000');
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('db down'));
      const r = await repo.invalidatePending('+998901234567');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('db down');
    });
  });

  describe('insert', () => {
    it('returns Ok with session id when insert succeeds', async () => {
      dbStub.__setResolved([{ session_id: 'abc-123' }]);
      const r = await repo.insert('+9989', '1234', new Date('2030-01-01'));
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe('abc-123');
    });

    it('returns Ok with empty string when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.insert('+9989', '1234', new Date('2030-01-01'));
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe('');
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert fail'));
      const r = await repo.insert('+9989', '1234', new Date('2030-01-01'));
      expect(r.ok).toBe(false);
    });
  });

  describe('findBySessionId', () => {
    it('returns Ok with mapped session when row exists', async () => {
      dbStub.__setResolved([{
        id: 5,
        session_id: 'sess-1',
        code: '1234',
        expires_at: '2030-01-01T00:00:00Z',
        used: false,
      }]);
      const r = await repo.findBySessionId('sess-1');
      expect(r.ok).toBe(true);
      if (r.ok && r.data) {
        expect(r.data.id).toBe(5);
        expect(r.data.code).toBe('1234');
        expect(r.data.used).toBe(false);
      }
    });

    it('returns Ok with null when session missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findBySessionId('missing');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('parse error'));
      const r = await repo.findBySessionId('x');
      expect(r.ok).toBe(false);
    });
  });

  describe('markUsed', () => {
    it('returns Ok when update succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.markUsed(7);
      expect(r.ok).toBe(true);
    });

    it('returns Ok when no rows changed', async () => {
      dbStub.__setResolved([]);
      const r = await repo.markUsed(999);
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('locked'));
      const r = await repo.markUsed(7);
      expect(r.ok).toBe(false);
    });
  });
});
