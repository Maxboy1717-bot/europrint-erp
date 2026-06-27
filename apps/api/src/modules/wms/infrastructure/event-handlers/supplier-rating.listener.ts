/**
 * @module supplier-rating.listener
 * @description Ta'minotchi reyting tetiklagichi (EP-WMS-094 / EP-WMS-022).
 *   QC-fail (SupplierQualityFailEvent) signalida ta'minotchining oxirgi N-oy
 *   oynasi bo'yicha 4-faktor reytingini AVTO qayta hisoblaydi (window recompute).
 *
 *   ⚠️ Bu listener mavjud MM `SupplierQualityFailListener` (placeholder -1)
 *   bilan PARALLEL ishlaydi — NestJS CQRS bir event klassiga bir nechta
 *   @EventsHandler ni qo'llab-quvvatlaydi (MesCompletedEvent kabi). Bu listener
 *   xom -1 o'rniga oxirgi-oyna bo'yicha HAQIQIY reytingni yozadi (Q-40: soxta
 *   guess emas, jonli agregat). Q-46: faqat ADDITIVE — mavjud yo'lga tegmaydi.
 *
 *   #22 listener-resilience: butun oqim best-effort — QC qarori allaqachon
 *   commit bo'lgan; reyting hisobidagi xato event bus'ga qaytarib otilmaydi
 *   (aks holda qardosh listener'lar uziladi).
 * @layer Infrastructure (WMS)
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SupplierQualityFailEvent } from '../../../qc/domain/events';
import { SupplierRatingService } from '../../application/supplier-rating.service';

@Injectable()
@EventsHandler(SupplierQualityFailEvent)
export class SupplierRatingListener implements IEventHandler<SupplierQualityFailEvent> {
  private readonly logger = new Logger(SupplierRatingListener.name);

  constructor(private readonly ratingService: SupplierRatingService) {}

  async handle(event: SupplierQualityFailEvent): Promise<void> {
    this.logger.log(
      { supplierId: event.supplierId, orderId: event.orderId, reason: event.reason },
      'EP-WMS-094: QC-fail → ta\'minotchi reytingini oxirgi oyna bo\'yicha qayta hisoblash',
    );

    try {
      const result = await this.ratingService.recompute(
        Number(event.supplierId),
        'qc.supplier_quality_fail',
      );
      if (!result.ok) {
        this.logger.error(
          { supplierId: event.supplierId, err: result.error.message },
          'SupplierRatingListener: reyting qayta hisoblash muvaffaqiyatsiz',
        );
        return;
      }
      if (result.data.rating == null) {
        this.logger.warn(
          { supplierId: event.supplierId },
          'SupplierRatingListener: oynada faktor-data yo\'q — reyting o\'zgartirilmadi',
        );
      }
    } catch (error: unknown) {
      // Event bus'ga qaytarib otilmaydi (qardosh listener'larni uzmaslik uchun).
      this.logger.error(
        {
          supplierId: event.supplierId,
          orderId: event.orderId,
          error: (error as Error)?.message ?? String(error),
        },
        'SupplierRatingListener: reyting oqimi xatosi (yutildi)',
      );
    }
  }
}
