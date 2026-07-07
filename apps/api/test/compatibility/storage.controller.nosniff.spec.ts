/**
 * test/compatibility/storage.controller.nosniff.spec.ts
 *
 * C9.2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): .svg is allowlisted for upload and can carry a
 * stored-XSS payload if a browser is ever tricked into sniffing/rendering octet-stream content
 * as image/svg+xml. Currently latent (.svg has no MIME_MAP entry), but X-Content-Type-Options:
 * nosniff is the correct hardening regardless — it stops content-sniffing outright. These tests
 * prove both the force-download and inline-serve routes now set this header.
 */

jest.mock('@shared/db', () => ({ db: { insert: jest.fn(() => ({ values: jest.fn().mockResolvedValue(undefined) })) } }));
jest.mock('@shared/db/schema-rbac', () => ({ auditLogs: {} }));

import * as fs from 'fs';
import { StorageController } from '../../src/modules/storage/storage.controller';

const i18n = { t: jest.fn(async (key: string) => key) } as never;

function makeRes() {
  const headers: Record<string, string> = {};
  return { header: jest.fn((k: string, v: string) => { headers[k] = v; }), _headers: headers };
}

describe('StorageController — C9.2 nosniff header', () => {
  let ctrl: StorageController;

  beforeEach(() => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'createReadStream').mockReturnValue({ pipe: jest.fn() } as never);
    ctrl = new StorageController(i18n);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('downloadFile() sets X-Content-Type-Options: nosniff', async () => {
    const res = makeRes();
    const user = { id: 1, role: 'super_admin', firstName: 'A', lastName: 'B' } as never;

    await ctrl.downloadFile('chat/1/file/pic.svg', undefined, user, res as never);

    expect(res._headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('serveFile() sets X-Content-Type-Options: nosniff', async () => {
    const res = makeRes();
    const user = { id: 1, role: 'employee', firstName: 'A', lastName: 'B' } as never;

    await ctrl.serveFile('chat/1/file/pic.svg', user, res as never);

    expect(res._headers['X-Content-Type-Options']).toBe('nosniff');
  });
});
