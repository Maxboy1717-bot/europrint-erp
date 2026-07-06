/**
 * @module mini-app-approval-gate.spec
 * @description G1 (Residual Fix Loop): mini-app approve/reject was @Public()
 * with zero role check. Proves assertCanManageRequest blocks a non-manager
 * and lets an authorized manager/admin through.
 */

import { ForbiddenException } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import { assertCanManageRequest } from '../../src/modules/pos/presentation/mini-app.controller';
import type { PosMiniAppService } from '../../src/modules/pos/application/services/pos-mini-app.service';

function fakeService(canManage: boolean, ok = true): PosMiniAppService {
  return {
    canManageRequest: async () => (ok ? { ok: true, data: canManage } : { ok: false, error: { code: 'DB_ERROR', message: 'x' } }),
  } as unknown as PosMiniAppService;
}

// i18n stub — resolves to a fixed string; tests only assert the exception TYPE
// (ForbiddenException), not the message content.
const fakeI18n = { t: async (key: string) => key } as unknown as I18nService;

describe('mini-app approve/reject authorization gate (G1)', () => {
  it('rejects a non-manager / wrong-department session (canManageRequest=false)', async () => {
    await expect(assertCanManageRequest(fakeService(false), 999, 1, fakeI18n)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the underlying lookup errors (fail-closed, not fail-open)', async () => {
    await expect(assertCanManageRequest(fakeService(false, false), 1, 1, fakeI18n)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a legitimate department manager / admin session (canManageRequest=true)', async () => {
    await expect(assertCanManageRequest(fakeService(true), 1, 1, fakeI18n)).resolves.toBeUndefined();
  });
});
