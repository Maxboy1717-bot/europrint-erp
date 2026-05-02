import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IMmRepository } from '../../domain/repositories/mm.repository';

export interface SupplierQualityFailEvent {
  supplierId: number;
  inspectionId: number;
  defectCount: number;
}

@Injectable()
export class SupplierQualityFailListener {
  private readonly logger = new Logger(SupplierQualityFailListener.name);

  constructor(@Inject('IMmRepository') private readonly mmRepo: IMmRepository) {}

  @OnEvent('SUPPLIER_QUALITY_FAIL')
  async handle(event: SupplierQualityFailEvent) {
    this.logger.log(
      { supplierId: event.supplierId, defectCount: event.defectCount },
      'Trigger 19: Supplier quality fail - Decreasing vendor rating',
    );

    // Trigger 19: Quality fail → vendor rating decrease
    const currentRating = 5; // placeholder
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
