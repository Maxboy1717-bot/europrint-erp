/**
 * @module qc-brak-snapshot.service
 * @description Vision 09-qc #48 — QC brak statistika Director paneliga durable
 * outbox event-stream orqali; QC servisi momentan uzilganda oxirgi snapshot +
 * "ma'lumot N daqiqa eski" belgisi. Real-time oqim = KANONIK outbox
 * (domain_events + OutboxPublisher). Bu servis: snapshotni qayta hisoblaydi,
 * outbox ga `qc.brak.stats.updated` event yozadi va staleness'ni hisoblaydi.
 */

import { Injectable, Logger } from '@nestjs/common';
import { QcBrakSnapshotRepository, QcBrakSnapshot } from '../infrastructure/repositories/qc-brak-snapshot.repository';
import { OutboxRepository } from '../../shared/outbox/outbox.repository';
import { Result, Ok, Err, AppErr } from '@common/result';

/** Snapshot "eski" chegarasi (daqiqa) — Director paneli ko'rsatuv chegarasi, egasi ma'lumoti EMAS. */
const SNAPSHOT_STALE_THRESHOLD_MIN = 5;
const MS_PER_MINUTE = 60_000;
const STALE_ROUND = 100; // 2-xona aniqlik

export interface QcBrakSnapshotView extends QcBrakSnapshot {
  /** now() - computed_at (daqiqa). computed_at NULL bo'lsa null = "hech qachon hisoblanmagan". */
  staleMinutes: number | null;
  /** true = snapshot eskirgan yoki hech qachon hisoblanmagan → panel "ma'lumot N daqiqa eski" ko'rsatadi. */
  stale: boolean;
  staleThresholdMin: number;
}

@Injectable()
export class QcBrakSnapshotService {
  private readonly logger = new Logger(QcBrakSnapshotService.name);

  constructor(
    private readonly repo: QcBrakSnapshotRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  /**
   * Recompute the snapshot and emit a durable `qc.brak.stats.updated` event into
   * the CANONICAL outbox (domain_events). OutboxPublisher (10s tick) drains it and
   * re-emits to EventEmitter2 → the Director panel gets the real-time push.
   */
  async refresh(scope = 'global'): Promise<Result<QcBrakSnapshotView>> {
    const res = await this.repo.refreshSnapshot(scope);
    if (!res.ok) return Err(res.error);
    const snap = res.data;
    if (!snap) return Err(AppErr('DB_ERROR', 'Snapshot yangilanmadi'));

    // Real-time stream via the canonical outbox. Best-effort: the durable snapshot
    // is already persisted, so an outbox hiccup must not fail the refresh.
    const emit = await this.outbox.insertBatch([{
      aggregate_type: 'QcBrakSnapshot',
      aggregate_id: snap.scope,
      event_name: 'qc.brak.stats.updated',
      payload: { ...snap } as Record<string, unknown>,
    }]);
    if (!emit.ok) {
      this.logger.warn(`qc.brak.stats.updated outbox emit failed: ${emit.error.message}`);
    }
    return Ok(this.withStaleness(snap));
  }

  /** Director-panel read: last snapshot + staleness (fallback when live QC stream is down). */
  async getForDirector(scope = 'global'): Promise<Result<QcBrakSnapshotView>> {
    const res = await this.repo.getSnapshot(scope);
    if (!res.ok) return Err(res.error);
    if (!res.data) return Err(AppErr('NOT_FOUND', `QC brak snapshot topilmadi (scope=${scope})`));
    return Ok(this.withStaleness(res.data));
  }

  private withStaleness(snap: QcBrakSnapshot): QcBrakSnapshotView {
    let staleMinutes: number | null = null;
    if (snap.computedAt) {
      const ms = Date.now() - new Date(snap.computedAt).getTime();
      staleMinutes = Math.max(0, Math.round((ms / MS_PER_MINUTE) * STALE_ROUND) / STALE_ROUND);
    }
    const stale = staleMinutes == null || staleMinutes > SNAPSHOT_STALE_THRESHOLD_MIN;
    return { ...snap, staleMinutes, stale, staleThresholdMin: SNAPSHOT_STALE_THRESHOLD_MIN };
  }
}
