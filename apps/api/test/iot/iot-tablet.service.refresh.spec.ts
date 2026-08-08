/**
 * test/iot/iot-tablet.service.refresh.spec.ts
 *
 * C2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): IotTabletService.refresh() reissues a tablet token
 * from an existing one, including one that has already expired (`ignoreExpiration: true`) — that's
 * the whole point, since the PWA calls this reactively after a 401. Covers: happy path, expired
 * token still refreshable within the grace window, too-old token rejected, malformed/non-tablet
 * token rejected, deactivated worker rejected, revoked card-gate rejected.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { IotTabletService } from '../../src/modules/iot/application/iot-tablet.service';
import type { DrizzleIotTabletRepo, TabletWorkerRow } from '../../src/modules/iot/infrastructure/repositories/drizzle-iot-tablet.repo';
import type { JwtService } from '@nestjs/jwt';
import type { EventBus } from '@nestjs/cqrs';
import type { ConfigService } from '@nestjs/config';
import type { IPasswordHasher } from '../../src/modules/auth/domain/ports/i-password-hasher.port';
import type { IAuthRepo } from '../../src/modules/auth/domain/repositories/i-auth.repo';
import { runQuery } from '@shared/db';
import { Ok } from '../../src/common/result';

const mockRunQuery = runQuery as jest.Mock;

function makeWorker(overrides: Partial<TabletWorkerRow> = {}): TabletWorkerRow {
  return {
    id: 10, user_id: 5, employee_code: 'T-001', first_name: 'Aziz', last_name: 'Karimov',
    password_hash: 'hash', role: 'operator', equipment_id: null, equipment_name: null,
    ...overrides,
  };
}

describe('IotTabletService.refresh() — C2', () => {
  let repo: jest.Mocked<Pick<DrizzleIotTabletRepo, 'findWorkerByTabel'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'verify' | 'sign'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let authRepo: jest.Mocked<Pick<IAuthRepo, 'resolveCardGate'>>;
  let svc: IotTabletService;

  const nowSec = () => Math.floor(Date.now() / 1000);

  beforeEach(() => {
    mockRunQuery.mockReset();
    repo = { findWorkerByTabel: jest.fn().mockResolvedValue(Ok(makeWorker())) };
    jwtService = { verify: jest.fn(), sign: jest.fn().mockReturnValue('new-token') };
    configService = { get: jest.fn().mockReturnValue(undefined) };
    authRepo = {
      resolveCardGate: jest.fn().mockResolvedValue({ primaryCardId: 7, rbacTier: 'operator', activeCardCount: 1 }),
    };
    // `resolveAuthUser` runs a raw runQuery — provide a matching active linked-user row by default.
    mockRunQuery.mockResolvedValue([{ user_id: 5, user_role: 'operator', password_hash: 'hash', is_active: true }]);

    svc = new IotTabletService(
      repo as unknown as DrizzleIotTabletRepo,
      jwtService as unknown as JwtService,
      { publish: jest.fn() } as unknown as EventBus,
      configService as unknown as ConfigService,
      { verify: jest.fn(), hash: jest.fn() } as unknown as IPasswordHasher,
      authRepo as unknown as IAuthRepo,
    );
  });

  it('reissues a fresh token for a still-valid tablet token', async () => {
    jwtService.verify.mockReturnValue({ sub: 10, tabel: 'T-001', tablet: true, iat: nowSec() - 60 });

    const result = await svc.refresh('old-token');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.tabletToken).toBe('new-token');
    expect(jwtService.verify).toHaveBeenCalledWith('old-token', { ignoreExpiration: true });
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ tablet: true, tabel: 'T-001' }),
      { expiresIn: '12h' },
    );
  });

  it('reissues a token even when the OLD one is already expired, within the grace window', async () => {
    // 10 hours past its own 12h expiry, but well inside the 24h issue-grace-window.
    jwtService.verify.mockReturnValue({ sub: 10, tabel: 'T-001', tablet: true, iat: nowSec() - 22 * 60 * 60 });

    const result = await svc.refresh('expired-but-recent-token');

    expect(result.ok).toBe(true);
  });

  it('rejects a token issued more than 24h ago (grace window exceeded)', async () => {
    jwtService.verify.mockReturnValue({ sub: 10, tabel: 'T-001', tablet: true, iat: nowSec() - 25 * 60 * 60 });

    const result = await svc.refresh('stale-token');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/muddati tugagan/);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejects a token that fails verification entirely', async () => {
    jwtService.verify.mockImplementation(() => { throw new Error('bad signature'); });

    const result = await svc.refresh('garbage-token');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/yaroqsiz/);
  });

  it('rejects a non-tablet token (tablet claim missing/false)', async () => {
    jwtService.verify.mockReturnValue({ sub: 10, tabel: 'T-001', tablet: false, iat: nowSec() - 60 });

    const result = await svc.refresh('erp-session-token');

    expect(result.ok).toBe(false);
  });

  it('rejects when the worker has been deactivated since the original login', async () => {
    jwtService.verify.mockReturnValue({ sub: 10, tabel: 'T-001', tablet: true, iat: nowSec() - 60 });
    mockRunQuery.mockResolvedValue([{ user_id: 5, user_role: 'operator', password_hash: 'hash', is_active: false }]);

    const result = await svc.refresh('old-token');

    expect(result.ok).toBe(false);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejects when the card-gate is enabled and the operator has lost their active card', async () => {
    jwtService.verify.mockReturnValue({ sub: 10, tabel: 'T-001', tablet: true, iat: nowSec() - 60 });
    configService.get.mockReturnValue('true'); // CARD_LOGIN_GATE_ENABLED
    authRepo.resolveCardGate.mockResolvedValue({ primaryCardId: null, rbacTier: null, activeCardCount: 0 });

    const result = await svc.refresh('old-token');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/Faol karta/);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
