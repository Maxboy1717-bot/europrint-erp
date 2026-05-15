/**
 * @module audio-cleanup.cron
 * @description Runs every 5 minutes and deletes raw audio files whose
 * voice_audit row is older than AISHA_AUDIO_RETENTION_MINUTES. We keep the
 * transcript indefinitely (it's needed for audit) but the audio itself is
 * purged to minimise privacy exposure.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, inArray, isNull, lt } from 'drizzle-orm';
import { db, aishaVoiceAudit } from '@shared/db';
import { AishaConfig } from '../../config/aisha.config';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const AUDIO_DIR_ENV = 'AISHA_AUDIO_DIR';

@Injectable()
export class AudioCleanupCron {
  private readonly logger = new Logger(AudioCleanupCron.name);

  constructor(private readonly cfg: AishaConfig) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanup(): Promise<void> {
    await this.cleanupOnce();
  }

  /** Exposed for testing. Returns rowsMarked + filesAttempted counts. */
  async cleanupOnce(now: Date = new Date()): Promise<{ rowsMarked: number; filesAttempted: number }> {
    const cutoff = new Date(now.getTime() - this.cfg.audioRetentionMinutes * 60_000);
    const audioDir = process.env[AUDIO_DIR_ENV] ?? '/tmp/aisha-audio';

    const ids = await db
      .select({ id: aishaVoiceAudit.id })
      .from(aishaVoiceAudit)
      .where(and(isNull(aishaVoiceAudit.audioDeletedAt), lt(aishaVoiceAudit.createdAt, cutoff)));
    let filesAttempted = 0;
    for (const r of ids) {
      filesAttempted++;
      try {
        await fs.unlink(join(audioDir, `${r.id}.webm`));
      } catch {
        // Already gone — fine, just mark the row.
      }
    }
    if (ids.length > 0) {
      await db
        .update(aishaVoiceAudit)
        .set({ audioDeletedAt: new Date() })
        .where(inArray(aishaVoiceAudit.id, ids.map(r => r.id)));
    }
    this.logger.log(`audio cleanup — ${ids.length} rows`);
    return { rowsMarked: ids.length, filesAttempted };
  }
}
