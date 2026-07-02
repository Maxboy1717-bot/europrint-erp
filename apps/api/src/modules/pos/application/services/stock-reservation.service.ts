/**
 * @module stock-reservation.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { MS_PER_HOUR } from '@common/constants/app.constants';
/**
 * POS — Stock Reservation Service
 *
 * §38 ARCHITECTURE: AI qayta ishlash uchun zaxira (bron) boshqaruvi
 *
 * Bron yaratilganda current_stock da reserved_qty ortadi,
 * bron bekor qilinganda yoki bajarilganda kamayadi.
 *
 * Redis kalit: `res:{warehouseId}:{materialCardId}` — TTL 24 soat
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { stockReservations } from '@workspace/db';
import { PosStockReservationRepository } from '../../infrastructure/repositories/pos-stock-reservation.repository';

interface CreateReservationDto {
  materialCardId:  number;
  warehouseId:     string;
  reservedQty:     number;
  posMovementId?:  number;
  expiresInHours?: number;
}

@Injectable()
export class StockReservationService {
  private readonly logger = new Logger(StockReservationService.name);

  constructor(private readonly stockReservationRepo: PosStockReservationRepository) {}

  /**
   * Bronni tekshirish va yaratish.
   * Agar mavjud stock yetarli bo'lmasa — BadRequestException.
   */

  async reserve(dto: CreateReservationDto, reservedById: number): Promise<Result<object, AppError>> {
    // Mavjud stock tekshiruv
    const stockData = await this.stockReservationRepo.getAvailableStock(dto.materialCardId, dto.warehouseId);
    if (!stockData.ok) return stockData;
    return safeCall(async () => {
      const onHand     = stockData.data.on_hand;
      const reserved   = stockData.data.already_reserved;
      const available  = onHand - reserved;
  
      if (available < dto.reservedQty) {
        throw new BadRequestException(
          `Yetarli mavjud emas: mavjud=${available}, so'ralgan=${dto.reservedQty} ` +
          `(jami=${onHand}, bronlangan=${reserved})`,
        );
      }
  
      const expiresAt = new Date(
        Date.now() + (dto.expiresInHours ?? 24) * MS_PER_HOUR,
      );
  
      const reservation = await this.stockReservationRepo.createReservation({
        reservationNumber: `RES-${Date.now()}`,
        reservationDate:   _time.now().toISOString().slice(0, 10),
        materialCardId:    String(dto.materialCardId),
        warehouseId:       dto.warehouseId,
        quantity:          dto.reservedQty,
        reservedBy:        String(reservedById),
        status:            'active',
        expiresAt,
      } as Omit<typeof stockReservations.$inferInsert, 'id'>);
  
      const reservationData = reservation.ok ? (reservation.data as { id: number }) : { id: 0 };
      this.logger.debug(
        `Bron yaratildi: id=${reservationData.id} mat=${dto.materialCardId} wh=${dto.warehouseId} qty=${dto.reservedQty}`,
      );
  
      return reservation;
    });
  }

  /**
   * G1-2 BRON-BLOK (2026-07-02): material+ombor uchun ACTIVE bron yig'indisi.
   * PosMovementService chiqim-gate'i (EXTERNAL_OUT/INTERNAL_ISSUE) shu orqali
   * bron bor-yo'qligini tekshiradi — GET issuable (pos-stock-issuable.service
   * :182-239) bilan BIR XIL semantika: bron > 0 → blok, faqat
   * super_admin/direktor override qila oladi.
   */
  async getActiveReservedTotal(materialCardId: number, warehouseId: number): Promise<Result<number, AppError>> {
    return this.stockReservationRepo.sumActiveReservations(materialCardId, warehouseId);
  }

  /**
   * Bronni bekor qilish (CANCELLED).
   */
  async cancel(reservationId: number, cancelledById: number) {
    const reservationR = await this.stockReservationRepo.findById(reservationId);
    if (!reservationR.ok) throw new BadRequestException(`Bron topilmadi: ${reservationId}`);
    const reservation = reservationR.data as { status: string };
    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestException(`Bron faol emas: ${reservation.status}`);
    }

    const updated = await this.stockReservationRepo.cancelById(reservationId);
    this.logger.debug(`Bron bekor: id=${reservationId} by=${cancelledById}`);
    return updated;
  }

  /**
   * Bronni bajarilgan deb belgilash (FULFILLED — harakat completed bo'lganda).
   */
  async fulfill(posMovementId: number) {
    await this.stockReservationRepo.fulfillByMovementId(posMovementId);
  }

  /**
   * Muddati o'tgan bronlarni tozalash (cron tomonidan chaqiriladi).
   */
  async expireOldReservations(): Promise<number> {
    const r = await this.stockReservationRepo.expireOldReservations();
    return r.ok ? (r.data as number) : 0;
  }
}
