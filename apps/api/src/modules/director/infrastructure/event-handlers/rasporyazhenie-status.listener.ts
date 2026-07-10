/**
 * @module rasporyazhenie-status.listener
 * @description 04-coordination #4 — canonical CQRS @EventsHandler. When a
 *   rasporyazhenie status changes (RasporyazhenieStatusChangedEvent, published by
 *   CoordinationService.updateRaspWithAuth / markRaspDoneWithAuth), recompute the
 *   COR (coordination) completion % from the live rasporyazhenie stats.
 *
 *   The durable artifact of the transition is the domain_events row written by
 *   OutboxEventWriter (subscribed to the same CQRS bus). This listener performs
 *   the reactive recompute and logs the fresh completion %. There is no persistent
 *   "COR %" column to write to — the % is a derived stat already served live by
 *   GET /coordination/stats (CoordinationService.getStats); persisting a snapshot
 *   would require a new table (owner-gated, Q-35), so the recompute is log-only,
 *   mirroring AdvanceBypassApprovedListener.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RasporyazhenieStatusChangedEvent } from '../../domain/events/rasporyazhenie-status-changed.event';
import { CoordinationService } from '../../application/coordination.service';

@Injectable()
@EventsHandler(RasporyazhenieStatusChangedEvent)
export class RasporyazhenieStatusChangedListener
  implements IEventHandler<RasporyazhenieStatusChangedEvent>
{
  private readonly logger = new Logger(RasporyazhenieStatusChangedListener.name);

  constructor(private readonly coordination: CoordinationService) {}

  async handle(event: RasporyazhenieStatusChangedEvent): Promise<void> {
    const stats = await this.coordination.getStats();
    if (!stats.ok) {
      this.logger.warn(
        `COR recompute failed after rasporyazhenie #${event.rasporyazhenieId} status change: ${stats.error.message}`,
      );
      return;
    }
    const rasp = (stats.data as { rasporyazhenie?: { done?: number; total?: number } }).rasporyazhenie;
    const done = Number(rasp?.done ?? 0);
    const total = Number(rasp?.total ?? 0);
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;
    this.logger.log({
      msg: 'COR completion recomputed on rasporyazhenie status change',
      rasporyazhenieId: event.rasporyazhenieId,
      newStatus: event.newStatus,
      done,
      total,
      completionPct,
    });
  }
}
