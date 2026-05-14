/**
 * @module pos-request-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException,
} from '@nestjs/common'; 
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';
import { posMaterialRequests, posMaterialRequestLines, db, and, eq, sql, desc } from '@workspace/db';

import { LifecycleBlockService }   from '../lifecycle-block.service';
import { PosMovementService }      from './pos-movement.service';
import { PosRequestExtRepository } from '../pos-request-ext.repository';

import type {
  IssueFromRequestDto,
  RequestFilterDto,
} from '../dto/request.dto';

@Injectable()
export class PosRequestExtService {
  private readonly logger = new Logger(PosRequestExtService.name);

  constructor(
    private readonly lifecycleBlock:  LifecycleBlockService,
    private readonly movementService: PosMovementService,
    private readonly eventEmitter:    EventEmitter2,
    private readonly requestExtRepo:  PosRequestExtRepository,
  ) {}

  async issueFromRequest(
    dto: IssueFromRequestDto,
    issuedById: number,
    ipAddress?: string,
  ): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`POS so'rov qayta ishlash bajarilmoqda`);
      const [request] = await db
        .select()
        .from(posMaterialRequests)
        .where(eq(posMaterialRequests.id, dto.requestId));
  
      if (!request) throw new NotFoundException(`So'rov topilmadi: ${dto.requestId}`);
      if (request.status !== 'APPROVED') {
        throw new BadRequestException(`So'rov APPROVED holatida emas: ${request.status}`);
      }
  
      const requestLines = await db
        .select()
        .from(posMaterialRequestLines)
        .where(eq(posMaterialRequestLines.requestId, dto.requestId));
  
      if (dto.receivedByEmployeeId) {
        for (const line of requestLines) {
          const approvedQty = Number(line.approvedQty ?? line.requestedQty);
          const check = await this.lifecycleBlock.check(
            dto.receivedByEmployeeId,
            line.materialCardId,
            approvedQty,
          );
          if (!check.allowed) {
            throw new BadRequestException(`Material ${line.materialCardId}: ${check.reason}`);
          }
        }
      }
  
      const issueType = await this.requestExtRepo.getInternalIssueTypeId();
      if (!issueType || !issueType.ok || issueType.data === null) throw new BadRequestException('Ichki chiqarish harakati turi topilmadi');
  
      const movLines = (Array.isArray(requestLines) ? requestLines : []).map(line => {
        const detail = dto.lineDetails?.find(d => d.lineId === line.id);
        return {
          materialCardId: line.materialCardId,
          quantity:       Number(detail?.issuedQty ?? line.approvedQty ?? line.requestedQty),
          binLocation:    detail?.binLocation,
          batchId:        detail?.batchId,
        };
      });
  
      const movementR = await this.movementService.createMovement(
        {
          movementTypeId:        Number(issueType.data?.id ?? 0),
          fromWarehouseId:       dto.fromWarehouseId,
          receivedByEmployeeId:  dto.receivedByEmployeeId,
          lines:                 movLines,
          notes:                 dto.notes ?? `So'rov: ${request.requestNumber}`,
        },
        issuedById,
        ipAddress,
      );
      if (!movementR.ok) throw new InternalServerErrorException(movementR.error.message);
      const movement = movementR.data as { id: number };
  
      await db
        .update(posMaterialRequests)
        .set({
          status:        'FULLY_ISSUED' as typeof posMaterialRequests.$inferInsert['status'],
          posMovementId: movement.id,
          updatedAt:     _time.now(),
        })
        .where(eq(posMaterialRequests.id, dto.requestId));
  
      this.eventEmitter.emit('pos.request.issued', {
        requestId:  dto.requestId,
        movementId: movement.id,
        issuedById,
      });
  
      return { request: { ...request, status: 'issued' }, movement };
    });
  }

  async findAll(filter: RequestFilterDto, userId: number, userRole: string) {
    const page   = filter.page  ?? 1;
    const limit  = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const paginateR = await this.requestExtRepo.paginateWithFilter({
      status:         filter.status,
      departmentCode: filter.departmentCode,
      priority:       filter.priority,
      dateFrom:       filter.dateFrom,
      dateTo:         filter.dateTo,
      requestedBy:    userRole === 'employee' ? userId : undefined,
    }, limit, offset);
    const { items, total } = (paginateR.ok ? paginateR.data : { items: [], total: 0 }) as { items: unknown[]; total: number };

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  async findOne(requestId: number) {
    const [request] = await db
      .select()
      .from(posMaterialRequests)
      .where(eq(posMaterialRequests.id, requestId));

    if (!request) throw new NotFoundException(`So'rov topilmadi: ${requestId}`);

    const lines = await db
      .select()
      .from(posMaterialRequestLines)
      .where(eq(posMaterialRequestLines.requestId, requestId));

    return { ...request, lines };
  }
}
