/**
 * @module outbox-event-writer.service
 * @description Atomic domain-event persister (golden-thread durability — A14).
 *
 * Background — why this exists:
 *   Three event mechanisms coexist (see `event-bridge.service.ts`): the CQRS
 *   `EventBus`, the namespaced `EventEmitter2` (`ERP_EVENTS.*`), and the
 *   per-event-name `EventEmitter2`. `EventBridgeService` already subscribes to
 *   the `EventBus` and RE-EMITS each event to `EventEmitter2` — but it writes
 *   NOTHING to the `domain_events` table. The only rows that ever reached
 *   `domain_events` came from a handful of hand-written `OutboxRepository
 *   .insertBatch(...)` calls inside specific command handlers (e.g. SD
 *   create-order). Every other `eventBus.publish(new SomeEvent(...))` stayed
 *   purely in-memory and was lost on a crash — which is exactly why
 *   `domain_events` stayed at 0 rows and the golden thread (SD→PP→MES→QC→WMS→FIN)
 *   could not be reconstructed/replayed.
 *
 *   This service closes that gap. It subscribes to the same `EventBus` and, for
 *   every published domain event, performs ONE atomic INSERT into
 *   `domain_events` via `OutboxRepository.insertBatch`. The write captures
 *   `aggregate_type` / `aggregate_id` / `event_name` / `payload` (+ the table's
 *   own `occurred_at` / `created_at` defaults). Because the row is persisted,
 *   the `OutboxPublisher` tick can replay it durably and listeners downstream
 *   recover after a crash.
 *
 * Relationship to the existing pieces (no duplication, no regression):
 *   - `EventBridgeService`  → in-memory re-emit (CQRS → EventEmitter2). UNCHANGED.
 *   - `OutboxRepository`    → the atomic insert/fetch/mark API. REUSED here.
 *   - `OutboxPublisher`     → drains `domain_events` every 10s. UNCHANGED — it
 *                             now has rows to drain for bus-published events too.
 *   - hand-written `insertBatch` callers (SD create-order) → still write their
 *     own rows inside the order transaction. This writer is keyed off the bus
 *     subscription, so it does NOT double-insert those: the create-order handler
 *     persists via the outbox and does NOT re-publish the same rows on the bus,
 *     so there is exactly one durable row per published event.
 *
 * Design notes:
 *   - Best-effort, never throws. A persistence failure here must not break the
 *     business transaction that emitted the event (the in-memory re-emit via the
 *     bridge still happens independently). All failures are logged + swallowed.
 *   - Event shapes vary across the codebase (CQRS event classes with scattered
 *     id fields; plain `{ aggregateId, aggregateName, eventName, data }` objects;
 *     `DomainEvent` subclasses). `extractRow` normalises all of them.
 *   - This file is self-contained. It must be registered as a provider (the head
 *     agent wires it into the global OutboxModule alongside OutboxPublisher).
 *     Its dependencies — `EventBus` (CqrsModule, global) and `OutboxRepository`
 *     (OutboxModule, global, exported) — are already available app-wide.
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';
import { OutboxRepository, type OutboxRow } from './outbox.repository';

/** Metadata keys that describe the envelope, not the business payload. */
const META_KEYS = new Set([
  'aggregateId',
  'aggregateName',
  'eventName',
  'timestamp',
  'createdAt',
  'occurredAt',
  'data',
]);

/** Candidate fields, in priority order, that commonly hold the aggregate id. */
const ID_FIELDS = [
  'aggregateId',
  'orderId',
  'salesOrderId',
  'productionOrderId',
  'sessionId',
  'inspectionId',
  'entityId',
  'id',
] as const;

@Injectable()
export class OutboxEventWriter implements OnModuleInit {
  private readonly logger = new Logger(OutboxEventWriter.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly outbox: OutboxRepository,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe((event: IEvent) => {
      // Fire-and-forget: persistence must never block or break the publisher.
      void this.persist(event);
    });
    this.logger.log(
      'OutboxEventWriter initialised (CQRS EventBus → domain_events atomic write)',
    );
  }

  /**
   * Atomically persist one domain event into `domain_events`. Best-effort:
   * any error is logged and swallowed so the emitting transaction is unaffected.
   */
  private async persist(event: IEvent): Promise<void> {
    if (!event || typeof event !== 'object') return;
    try {
      const row = this.extractRow(event);
      const result = await this.outbox.insertBatch([row]);
      if (!result.ok) {
        this.logger.warn(
          `OutboxEventWriter insert failed for ${row.event_name}: ${result.error.message}`,
        );
      }
    } catch (err) {
      // Defensive: extraction or DB hiccup must not propagate to the bus caller.
      this.logger.warn(
        `OutboxEventWriter persist threw: ${(err as Error)?.message ?? 'unknown'}`,
      );
    }
  }

  /**
   * Normalise any event shape into the `OutboxRow` the repository expects.
   * `OutboxRow` minus the DB-generated columns (id / occurred_at default / attempts).
   */
  private extractRow(event: IEvent): Omit<OutboxRow, 'id' | 'occurred_at' | 'attempts'> {
    const e = event as Record<string, unknown>;
    const className = (event as { constructor?: { name?: string } }).constructor?.name;

    const eventName =
      this.asString(e.eventName) ??
      (className && className !== 'Object' ? className : undefined) ??
      'UnknownEvent';

    const aggregateType =
      this.asString(e.aggregateName) ??
      this.deriveAggregateType(eventName, className) ??
      'Unknown';

    const aggregateId = this.resolveAggregateId(e);
    const payload = this.resolvePayload(e);

    return {
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      event_name: eventName,
      payload,
    };
  }

  /** Pick the aggregate id from the first populated candidate field. */
  private resolveAggregateId(e: Record<string, unknown>): string {
    for (const field of ID_FIELDS) {
      const v = e[field];
      if (v !== undefined && v !== null && v !== '') return String(v);
    }
    return 'unknown';
  }

  /**
   * Prefer an explicit `data` envelope; otherwise serialise the event's own
   * enumerable business fields (excluding metadata keys). Always a plain object.
   */
  private resolvePayload(e: Record<string, unknown>): Record<string, unknown> {
    if (e.data && typeof e.data === 'object' && !Array.isArray(e.data)) {
      return e.data as Record<string, unknown>;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(e)) {
      if (META_KEYS.has(key)) continue;
      if (typeof value === 'function') continue;
      out[key] = value;
    }
    return out;
  }

  /**
   * Derive an aggregate type when the event carries no `aggregateName`:
   * strip a trailing `Event` suffix off the class name (e.g. `OrderCreatedEvent`
   * → `OrderCreated`), or fall back to the event name.
   */
  private deriveAggregateType(eventName: string, className?: string): string | undefined {
    if (className && className !== 'Object') {
      return className.endsWith('Event') ? className.slice(0, -'Event'.length) : className;
    }
    return eventName !== 'UnknownEvent' ? eventName : undefined;
  }

  private asString(v: unknown): string | undefined {
    return typeof v === 'string' && v.length > 0 ? v : undefined;
  }
}
