/**
 * @module offer-made.event
 * @description Emitted when a Funnel aggregate transitions into the
 * OFFER_SENT stage via `makeOffer`. Carries the full offer payload so
 * downstream consumers (notification bot, GL projection, recruiter
 * dashboard) don't need to re-fetch it from the database.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface OfferMadeEventProps {
  funnelId: number;
  candidateId: number;
  amount: number;
  currency: string;
  startDate: Date;
  madeAt: Date;
}

export class OfferMadeEvent extends DomainEvent {
  constructor(public readonly props: OfferMadeEventProps) {
    super(String(props.funnelId), 'OfferMade');
  }
}
