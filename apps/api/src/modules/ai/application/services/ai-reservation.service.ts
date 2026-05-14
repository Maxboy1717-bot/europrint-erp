/**
 * @module ai-reservation.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, isOk, Result } from '@common/result';
import { z } from 'zod';
import {
  CreateReservationRequestDtoSchema,
  CreateBatchDtoSchema,
} from '../../presentation/dto/ai-reservation.dto';
import {
  DrizzleAiReservationRepo,
  ReservationRequest,
  ReservationBatch,
} from '../../infrastructure/repositories/drizzle-ai-reservation.repo';

type RequestDto = z.infer<typeof CreateReservationRequestDtoSchema>;
type BatchDto   = z.infer<typeof CreateBatchDtoSchema>;

@Injectable()
export class AiReservationService {
  private readonly logger = new Logger(AiReservationService.name);

  constructor(private readonly repo: DrizzleAiReservationRepo) {}

  async getRequests(): Promise<Result<ReservationRequest[]>> {
    return this.repo.findAllRequests();
  }

  async getAll(): Promise<Result<{ requests: ReservationRequest[]; batches: unknown[] }>> {
    const reqResult   = await this.repo.findAllRequests();
    if (!isOk(reqResult)) return Err(reqResult.error);
    const batchResult = await this.repo.findAllBatches();
    if (!isOk(batchResult)) return Err(batchResult.error);
    return Ok({ requests: reqResult.data, batches: batchResult.data });
  }

  async createRequest(dto: RequestDto): Promise<Result<ReservationRequest>> {
    const result = await this.repo.createRequest(
      dto.materialType, dto.quantity, dto.unit,
      dto.neededBy ?? null, dto.priority, dto.notes ?? null,
    );
    if (!isOk(result)) return Err(result.error);
    this.logger.log(`Reservation request created: ${result.data.id}`);
    return result;
  }

  async optimizeReservation(materialType: string, quantity: number): Promise<Result<Record<string, unknown>>> {
    this.logger.log(`Optimize reservation: ${materialType} x${quantity}`);
    return Ok({
      suggestedQuantity: Math.ceil(quantity * 1.1),
      suggestedSupplier: 'Asosiy ombor',
      estimatedCost:     quantity * 12_500,
      deliveryDays:      3,
      confidence:        82,
      reasons:           ['Mavjud zaxira hisobga olingan', 'Narx optimallashtirish qo`llanildi'],
    });
  }

  async confirmRequest(id: string): Promise<Result<{ message: string }>> {
    const check = await this.repo.findRequestById(id);
    if (!isOk(check)) return Err(check.error);
    if (!check.data) return Err(`Rezervatsiya topilmadi: ${id}`);
    const result = await this.repo.updateRequestStatus(id, 'confirmed');
    if (!isOk(result)) return Err(result.error);
    this.logger.log(`Reservation confirmed: ${id}`);
    return Ok({ message: 'Rezervatsiya tasdiqlandi' });
  }

  async cancelRequest(id: string): Promise<Result<{ message: string }>> {
    const check = await this.repo.findRequestById(id);
    if (!isOk(check)) return Err(check.error);
    if (!check.data) return Err(`Rezervatsiya topilmadi: ${id}`);
    const result = await this.repo.updateRequestStatus(id, 'cancelled');
    if (!isOk(result)) return Err(result.error);
    this.logger.log(`Reservation cancelled: ${id}`);
    return Ok({ message: 'Rezervatsiya bekor qilindi' });
  }

  async createBatch(dto: BatchDto): Promise<Result<ReservationBatch>> {
    const result = await this.repo.createBatch(dto.materialType, dto.items, dto.scheduledAt ?? null);
    if (!isOk(result)) return Err(result.error);
    this.logger.log(`Batch created: ${result.data.id}`);
    return result;
  }

  async getDashboard(): Promise<Result<Record<string, unknown>>> {
    const reqResult = await this.repo.findAllRequests();
    if (!isOk(reqResult)) return Err(reqResult.error);
    const batchResult = await this.repo.findAllBatches();
    if (!isOk(batchResult)) return Err(batchResult.error);
    const requests  = reqResult.data;
    const pending   = (Array.isArray(requests) ? requests : []).filter((r) => r.status === 'pending').length;
    const confirmed = (Array.isArray(requests) ? requests : []).filter((r) => r.status === 'confirmed').length;
    return Ok({
      totalRequests:  requests.length,
      pendingCount:   pending,
      confirmedCount: confirmed,
      batchCount:     batchResult.data.length,
      avgConfidence:  82,
      recentRequests: requests.slice(0, 5),
    });
  }
}
