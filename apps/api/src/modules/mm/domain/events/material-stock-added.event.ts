/**
 * @module material-stock-added.event
 * @description Domain event payload emitted when stock is added to a Material.
 *   - Subscribers: WMS inventory ledger, MRP demand re-planning, audit log.
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class MaterialStockAddedEvent extends DomainEvent {
  readonly aggregateName: string = 'Material';

  constructor(
    public readonly materialId: string,
    public readonly quantity: number,
    public readonly newStock: number,
  ) {
    super(materialId, 'MaterialStockAdded');
  }
}
