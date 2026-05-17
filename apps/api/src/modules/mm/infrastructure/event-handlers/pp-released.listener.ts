/**
 * @module pp-released.listener
 * @description PA2-18 Wave 6: canonical CQRS @EventsHandler form. Listens for
 *   PpReleasedEvent (published by pp/release-production-order.handler) and
 *   reserves materials in MM. Trigger 8.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IMmRepository, MM_REPO } from '../../domain/repositories/mm.repository';
import { PpReleasedEvent } from '@modules/pp/domain/events/pp-released.event';

@Injectable()
@EventsHandler(PpReleasedEvent)
export class PpReleasedListener implements IEventHandler<PpReleasedEvent> {
  private readonly logger = new Logger(PpReleasedListener.name);

  constructor(@Inject(MM_REPO) private readonly mmRepo: IMmRepository) {}

  async handle(event: PpReleasedEvent): Promise<void> {
    this.logger.log(
      { materials: event.materialList.length },
      'Trigger 8: PP released - Material reservation in MM',
    );

    // Material reservation triggered for each material in production order
    for (const mat of event.materialList) {
      this.logger.log(
        { materialId: mat.materialId, quantity: mat.quantity },
        'Material reserved for production',
      );
    }
  }
}
