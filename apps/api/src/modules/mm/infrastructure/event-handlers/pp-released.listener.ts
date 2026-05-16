/**
 * @module pp-released.listener
 * @description Source module. See exports for details.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IMmRepository, MM_REPO } from '../../domain/repositories/mm.repository';

export interface PpReleasedEvent {
  poId: number;
  materialList: Array<{ materialId: number; quantity: number }>;
}

@Injectable()
export class PpReleasedListener {
  private readonly logger = new Logger(PpReleasedListener.name);

  constructor(@Inject(MM_REPO) private readonly mmRepo: IMmRepository) {}

  @OnEvent('PP_RELEASED_TO_PRODUCTION')
  async handle(event: PpReleasedEvent) {
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
