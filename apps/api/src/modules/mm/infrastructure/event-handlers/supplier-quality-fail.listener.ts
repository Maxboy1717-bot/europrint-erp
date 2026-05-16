/**
 * @module supplier-quality-fail.listener
 * @description PA2-18: canonical CQRS @EventsHandler form. Reacts to the
 *   canonical `SupplierQualityFailEvent` class published by
 *   `submit-inspection.handler.ts` (qc module). The previous `@OnEvent`
 *   string-keyed form ('SUPPLIER_QUALITY_FAIL') never matched any emitter and
 *   used a local interface with the wrong field set (defectCount). Now the
 *   listener consumes the same class as the publisher.
 *
 * Trigger 19: Supplier quality fail → vendor rating decrease.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SupplierQualityFailEvent } from '../../../qc/domain/events';
import { IMmRepository, MM_REPO } from '../../domain/repositories/mm.repository';

@Injectable()
@EventsHandler(SupplierQualityFailEvent)
export class SupplierQualityFailListener implements IEventHandler<SupplierQualityFailEvent> {
  private readonly logger = new Logger(SupplierQualityFailListener.name);

  constructor(@Inject(MM_REPO) private readonly mmRepo: IMmRepository) {}

  async handle(event: SupplierQualityFailEvent): Promise<void> {
    this.logger.log(
      { supplierId: event.supplierId, orderId: event.orderId, reason: event.reason },
      'Trigger 19: Supplier quality fail - Decreasing vendor rating',
    );

    // Trigger 19: Quality fail → vendor rating decrease
    const currentRating = 5; // placeholder until rating lookup is wired
    const newRating = Math.max(1, currentRating - 1);

    const result = await this.mmRepo.updateVendorRating(event.supplierId, newRating);
    if (!result.ok) {
      this.logger.error(result.error, 'Failed to update vendor rating');
    } else {
      this.logger.log(
        { supplierId: event.supplierId, newRating },
        'Vendor rating updated',
      );
    }
  }
}
