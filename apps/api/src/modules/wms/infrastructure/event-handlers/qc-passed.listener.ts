import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IWmsRepository } from '../../domain/repositories/wms.repository';

export interface QcPassedEvent {
  materialId: number;
  warehouseId: number;
  amount: number;
  batchNumber: string;
}

@Injectable()
export class QcPassedListener {
  private readonly logger = new Logger(QcPassedListener.name);

  constructor(@Inject('IWmsRepository') private readonly wmsRepo: IWmsRepository) {}

  @OnEvent('QC_PASSED')
  async handle(event: QcPassedEvent) {
    this.logger.log(
      { materialId: event.materialId, amount: event.amount },
      'Trigger 11: QC passed - Creating FG receipt',
    );

    const result = await this.wmsRepo.receiveFg(
      event.materialId,
      event.warehouseId,
      event.amount,
    );

    if (!result.ok) {
      this.logger.error(result.error, 'Failed to receive FG after QC passed');
    }
  }
}
