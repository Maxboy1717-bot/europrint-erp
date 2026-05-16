/**
 * @module outbox-publisher.service
 * @description Scheduled worker that drains the domain_events outbox (PA0-6).
 *
 * Every 10s:
 *   1. Fetch up to 100 unpublished rows (attempts <= 10)
 *   2. Emit each via EventEmitter2 using the stored `event_name` namespace
 *   3. Mark published on success or increment attempts on failure
 *
 * The `running` flag prevents overlapping ticks if a previous batch is still
 * draining. The publisher is intentionally idempotent — markPublished only
 * runs after a successful emit, and EventEmitter2.emit is synchronous (any
 * listener throw is caught inside the per-row try/catch).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OutboxRepository } from './outbox.repository';

@Injectable()
export class OutboxPublisher {
  private readonly logger = new Logger(OutboxPublisher.name);
  private running = false;

  constructor(
    private readonly repo: OutboxRepository,
    private readonly emitter: EventEmitter2,
  ) {}

  @Interval('outbox-publisher', 10_000)
  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const fetchResult = await this.repo.fetchUnpublished(100);
      if (!fetchResult.ok) return;
      for (const row of fetchResult.data) {
        try {
          this.emitter.emit(row.event_name, row.payload);
          const marked = await this.repo.markPublished(row.id);
          if (!marked.ok) {
            this.logger.warn(`Outbox row ${row.id} emitted but mark-published failed: ${marked.error.message}`);
          }
        } catch (err) {
          const msg = (err as Error)?.message ?? 'unknown';
          this.logger.warn(`Outbox row ${row.id} (${row.event_name}) publish failed: ${msg}`);
          await this.repo.markFailed(row.id, msg);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
