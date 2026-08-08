/**
 * @module deliveries.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, Inject, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { I18nService } from 'nestjs-i18n';
import { ISdDeliveriesRepository, SD_DELIVERIES_REPO } from './i-sd-deliveries.repo';
import { safeCall, Result, AppError } from '@common/result';
import { DeliveryGoodsIssuedEvent } from '../domain/events/delivery-goods-issued.event';

/**
 * Delivery statuses that mean the goods have physically LEFT the finished-goods warehouse
 * (post-goods-issue): `in_transit` = on the truck, `delivered` = handed to the customer.
 * Reaching either fires the golden-thread SD→WMS EXTERNAL_OUT stock-out (VISION-3340 #51).
 * `pending` (not yet shipped), `returned` and `cancelled` do NOT issue stock.
 */
const DELIVERY_GOODS_ISSUED_STATUSES = new Set<string>(['in_transit', 'delivered']);

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    @Inject(SD_DELIVERIES_REPO) private readonly sdDeliveriesRepo: ISdDeliveriesRepository,
    private readonly i18n: I18nService,
    private readonly eventBus: EventBus,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.sdDeliveriesRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.sdDeliveriesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.deliveryNotFoundWithId', { args: { id } }));
    const itemsResult = await this.sdDeliveriesRepo.findItemsByDeliveryId(id);
    if (!itemsResult.ok) throw new InternalServerErrorException(itemsResult.error);
    return { ...result.data, items: itemsResult.data };
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.sdDeliveriesRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async updateStatus(id: number, status: string){
    return safeCall(async () => {
    const delivery = await this.findOne(id);
    const rec = (delivery && typeof delivery === 'object') ? (delivery as Record<string, unknown>) : {};
    const rawSoId = rec.sales_order_id ?? rec.salesOrderId ?? null;
    const salesOrderId = rawSoId != null && Number.isFinite(Number(rawSoId)) ? Number(rawSoId) : null;

    // Vision 09-qc.md #28 ("Muddati o'tgan sertifikat sotilmasin — buyurtma blok, SD ham"):
    // goods may not physically leave the warehouse (in_transit/delivered) against a sales
    // order whose QC product certificate has expired. Checked live against expiry_date, so
    // this blocks correctly even before QcCertificateExpiryCron's nightly sweep has run.
    if (DELIVERY_GOODS_ISSUED_STATUSES.has(status) && salesOrderId !== null) {
      const certR = await this.sdDeliveriesRepo.hasExpiredCertificate(salesOrderId);
      if (certR.ok && certR.data) {
        throw new ConflictException(
          `Buyurtma #${salesOrderId} sifat sertifikati muddati o'tgan — yetkazib berish bloklandi (QC bilan bog'laning)`,
        );
      }
    }

    const result = await this.sdDeliveriesRepo.updateStatus(id, status);
    if (!result.ok) throw new InternalServerErrorException(result.error);

    // Golden-thread SD→WMS (VISION-3340 #51): when a delivery reaches a "left-the-warehouse"
    // status (in_transit/delivered = post-goods-issue), the shipped finished-goods stock must
    // leave the warehouse. Emit the domain event so the WMS DeliveryGoodsIssuedListener writes
    // the EXTERNAL_OUT movement. Best-effort / non-fatal (Q-46): the status DB write already
    // succeeded above, so an emit failure must NOT break the delivery update — it is caught +
    // logged here (mirrors UpdateOrderStatusHandler's in-process eventBus.publish).
    if (DELIVERY_GOODS_ISSUED_STATUSES.has(status)) {
      try {
        this.eventBus.publish(new DeliveryGoodsIssuedEvent(id, salesOrderId));
      } catch (err) {
        this.logger.error(
          { deliveryId: id, status, err: (err as Error)?.message ?? String(err) },
          'DeliveriesService: DeliveryGoodsIssuedEvent publish failed (SD→WMS stock-out not triggered)',
        );
      }
    }

    return result.data;

    });}
}
