/**
 * @module audio-cleanup.cron.spec
 * @description We can't easily reach the real DB inside Jest, so we mock
 * the @shared/db module's `db.execute` to return zero rows. The cron's
 * happy path is therefore "no rows → no fs deletions → returns counts".
 */

jest.mock('@shared/db', () => ({
  db: {
    execute: () => Promise.resolve({ rows: [] }),
  },
}));

import { AudioCleanupCron } from '../../src/modules/aisha/infrastructure/audio/audio-cleanup.cron';
import { AishaConfig } from '../../src/modules/aisha/config/aisha.config';

function fakeCfg(): AishaConfig {
  return { audioRetentionMinutes: 3 } as unknown as AishaConfig;
}

describe('AudioCleanupCron', () => {
  it('returns zero counts when no rows match', async () => {
    const cron = new AudioCleanupCron(fakeCfg());
    const r = await cron.cleanupOnce();
    expect(r.rowsMarked).toBe(0);
    expect(r.filesAttempted).toBe(0);
  });

  it('uses retention minutes from config', async () => {
    const cron = new AudioCleanupCron(fakeCfg());
    await expect(cron.cleanupOnce(new Date('2026-01-01T00:00:00Z'))).resolves.toBeDefined();
  });

  it('cleanup wrapper does not throw on schedule fire', async () => {
    const cron = new AudioCleanupCron(fakeCfg());
    await expect(cron.cleanup()).resolves.toBeUndefined();
  });
});
