/**
 * @module pos-external-out-created.event
 * @description Discovery sweep 2026-08-03 fix ("POS chiqim (EXTERNAL_OUT) harakati
 *   SD/logistika modulga event yubormaydi"): PosMovementCreatedEvent already fires for
 *   every movement type, but it's a generic "some movement was created" signal — no
 *   module outside POS/WMS ever subscribed to it, and it carries no customer context.
 *   EXTERNAL_OUT ("Tashqi Chiqim") is the one movement type that can be tied to a real
 *   customer (dto.customerId, used for the credit-limit gate right above the publish
 *   site in pos-movement.service.ts) — when it is, SD should know stock left the
 *   warehouse for that customer OUTSIDE the formal delivery flow (deliveries.service.ts
 *   / DeliveryGoodsIssuedEvent is the OTHER direction: SD-initiated dispatch -> WMS
 *   EXTERNAL_OUT; this event covers the reverse: POS-initiated EXTERNAL_OUT that SD
 *   never asked for, e.g. a walk-in pickup or manual correction).
 *
 *   Consumer: sd/infrastructure/event-handlers/pos-external-out-sd.listener.ts.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface PosExternalOutCreatedEventProps {
  movementId: number;
  movementNumber: string;
  customerId: number | null;
  fromWarehouseId: string | null;
  createdById: number;
}

export class PosExternalOutCreatedEvent extends DomainEvent {
  constructor(public readonly props: PosExternalOutCreatedEventProps) {
    super(String(props.movementId), 'PosExternalOutCreated');
  }
}
