/**
 * @module nps-auto-request.listener
 * @description Modul 14 (Marketing) — NPS avto-yig'ish (14.60). Yetkazib berish yopilganda
 *   (`logistics.delivery.completed`) avtomatik pending NPS so'rovi yaratiladi. Avval bu trigger
 *   yo'q edi (NPS faqat qo'lda POST orqali kelardi). Golden-thread: logistics → marketing.
 * @layer Listener (Marketing)
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { NpsRequestsRepository } from '../repositories/nps-requests.repository';

@Injectable()
export class NpsAutoRequestListener {
  private readonly logger = new Logger(NpsAutoRequestListener.name);
  constructor(private readonly repo: NpsRequestsRepository) {}

  @OnEvent(ERP_EVENTS.DELIVERY_COMPLETED)
  async onDeliveryCompleted(payload: { deliveryId?: number }): Promise<void> {
    const deliveryId = payload?.deliveryId;
    if (!deliveryId) return;
    const r = await this.repo.createFromDelivery(deliveryId);
    if (!r.ok) {
      this.logger.warn(`NPS avto-so'rov yaratilmadi (delivery=${deliveryId}): ${r.error.message}`);
      return;
    }
    if (r.data.id) this.logger.log(`NPS avto-so'rov yaratildi: delivery=${deliveryId} → request=${r.data.id}`);
  }
}
