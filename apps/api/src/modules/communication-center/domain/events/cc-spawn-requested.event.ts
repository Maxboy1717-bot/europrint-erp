/**
 * @module cc-spawn-requested.event
 * @description Wave 4 round-4 (PA2-18): canonical CQRS event class for the
 *   `cc.spawn` topic. The `CcEventListener.onSpawn` listener was previously
 *   subscribing via `@OnEvent('cc.spawn')`; it now subscribes to this class.
 *
 *   EventBridge re-emits to the legacy `cc.spawn` string topic for any
 *   non-migrated consumers (notably `cc-webhook.controller.ts` still emits
 *   the legacy string form) — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Publisher: CcWebhookController.receiveWebhook (still emits string topic;
 *   typed event can be published in a follow-up migration once the webhook
 *   surface is refactored).
 */

import { DomainEvent } from '@shared/domain/domain-event';
import type { Priority, Language } from '../types';

export interface CcSpawnRequestedEventProps {
  templateCode: string;
  senderUserId: number;
  subject: string;
  body: string;
  priority?: Priority;
  language?: Language;
  metadata?: Record<string, unknown>;
  autoSend?: boolean;
}

export class CcSpawnRequestedEvent extends DomainEvent {
  constructor(public readonly props: CcSpawnRequestedEventProps) {
    super(String(props.senderUserId), 'CcSpawnRequested');
  }
}
