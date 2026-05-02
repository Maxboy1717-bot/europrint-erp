import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * POS — Material Request Service
 *
 * Bo'lim material so'rov tizimi:
 *  1. Xodim so'rov yaratadi (draft → pending)
 *  2. Bo'lim mudiri tasdiqlaydi (pending → approved)
 *  3. Ombor xodimi materiallarni beradi (approved → issued)
 *
 * Qo'shimcha tekshiruvlar:
 *  - Kategoriya-bo'lim cheklovi (material_category_dept_rules)
 *  - Lifecycle blocking (LifecycleBlockService)
 *  - Stock availability
 */

import {
  Injectable, Logger, BadRequestException,
  NotFoundException, ForbiddenException,
} from '@nestjs/common'; 
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';
import { PosRequestExtService } from './pos-request-ext.service';
import { PosRequestRepository } from '../pos-request.repository';
import { posMaterialRequests, posMaterialRequestLines, materialCategoryDeptRules, db, and, eq, sql, desc } from '@workspace/db';
import { materialCards, warehouses } from '@workspace/db';

import { LifecycleBlockService }   from '../lifecycle-block.service';
import { StockReservationService } from '../stock-reservation.service';
import { PosMovementService }      from './pos-movement.service';
import { PosAuditService }         from './pos-audit.service';

import {
  CreateMaterialRequestDto,
  ApproveRequestDto,
  RejectRequestDto,
  IssueFromRequestDto,
  RequestFilterDto,
  RequestStatus,
} from '../dto/request.dto';

@Injectable()
export class PosRequestService {
  private readonly logger = new Logger(PosRequestService.name);

  constructor(
    private readonly lifecycleBlock:   LifecycleBlockService,
    private readonly stockReservation: StockReservationService,
    private readonly movementService:  PosMovementService,
    private readonly auditService:     PosAuditService,
    private readonly eventEmitter:     EventEmitter2,
    private readonly extSvc:           PosRequestExtService,
    private readonly requestRepo:      PosRequestRepository,
  ) {}

  // ─── So'rov Yaratish ──────────────────────────────────────────────────────

  async createRequest(
    dto: CreateMaterialRequestDto,
    createdById: number,
    ipAddress?: string,
  ): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      // Har bir material uchun kategoriya-bo'lim cheklovi
      for (const line of dto.lines) {
        const [card] = await db
          .select({ materialType: materialCards.materialType })
          .from(materialCards)
          .where(eq(materialCards.id, line.materialCardId));
  
        if (!card) throw new NotFoundException(`Material topilmadi: ${line.materialCardId}`);
  
        // Kategoriya cheklovi tekshiruv
        const restriction = await db
          .select()
          .from(materialCategoryDeptRules)
          .where(
            and(
              eq(materialCategoryDeptRules.materialCategory, card.materialType ?? ''),
              eq(materialCategoryDeptRules.departmentCode, dto.departmentCode),
            )
          );
  
        if (restriction.length > 0 && !restriction[0].canRequest) {
          throw new ForbiddenException(
            `${dto.departmentCode} bo'limi ${card.materialType} kategoriyasini so'ray olmaydi`,
          );
        }
      }
  
      // So'rov raqami
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(posMaterialRequests);
      const requestNumber = `REQ-${_time.now().getFullYear()}-${String(Number(count) + 1).padStart(5, '0')}`;
  
      // So'rov yaratish
      const requestRow: Omit<typeof posMaterialRequests.$inferInsert, 'id'> = {
        requestNumber,
        departmentCode:    dto.departmentCode,
        targetWarehouseId: dto.targetWarehouseId ?? dto.departmentCode,
        requestedBy:       createdById,
        status:            'DRAFT',
        priority:          (dto.priority ?? 'normal').toUpperCase(),
        neededBy:          dto.requiredByDate ? new Date(dto.requiredByDate) : undefined,
        justification:     dto.notes,
      };
      const [request] = await db
        .insert(posMaterialRequests)
        .values(requestRow)
        .returning();
  
      // Satrlari
      const lineValues = (dto?.lines ?? []).map(line => ({
        requestId:      request.id,
        materialCardId: line.materialCardId,
        requestedQty: Number(line.requestedQty),
        purpose:        line.purpose,
      }));
  
      await this.requestRepo.insertRequestLines(lineValues as Parameters<PosRequestRepository['insertRequestLines']>[0]);
  
      // Draft → Pending (avtomatik)
      await db
        .update(posMaterialRequests)
        .set({ status: sql`'SUBMITTED'`,  })
        .where(eq(posMaterialRequests.id, request.id));
  
      await this.auditService.log({
        userId: createdById,
        action: 'pos.request.created',
        entityType: 'pos_material_requests',
        entityId: request.id,
        newValue: { requestNumber, departmentCode: dto.departmentCode },
        ipAddress,
      });
  
      this.eventEmitter.emit('pos.request.pending', {
        requestId:      request.id,
        requestNumber,
        departmentCode: dto.departmentCode,
        createdById,
      });
  
      this.logger.log(`Material so'rov yaratildi: ${requestNumber}`);
      return { ...request, status: 'DRAFT' };
    });
  }

  // ─── So'rov Tasdiqlash ────────────────────────────────────────────────────

  async approveRequest(
    dto: ApproveRequestDto,
    approvedById: number,
    ipAddress?: string,
  ) {
    const [request] = await db
      .select()
      .from(posMaterialRequests)
      .where(eq(posMaterialRequests.id, dto.requestId));

    if (!request) throw new NotFoundException(`So'rov topilmadi: ${dto.requestId}`);
    if (request.status !== 'DRAFT') {
      throw new BadRequestException(`So'rov pending holatida emas: ${request.status}`);
    }

    // Tasdiqlangan miqdorlarni yangilash
    if (dto.approvedLines) {
      for (const al of dto.approvedLines) {
        await db
          .update(posMaterialRequestLines)
          .set({ approvedQty: Number(al.approvedQty) })
          .where(eq(posMaterialRequestLines.id, al.lineId));
      }
    }

    const [updated] = await db
      .update(posMaterialRequests)
      .set({
        status: 'APPROVED',
        approvedBy: approvedById,
        approvedAt: _time.now(),
                updatedAt:  _time.now(),
      } as Partial<typeof posMaterialRequests.$inferInsert>)
      .where(eq(posMaterialRequests.id, dto.requestId))
      .returning();

    await this.auditService.log({
      userId:     approvedById,
      action:     'pos.request.approved',
      entityType: 'pos_material_requests',
      entityId:   dto.requestId,
      oldValue:   { status: 'DRAFT' },
      newValue:   { status: 'APPROVED' },
      ipAddress,
    });

    this.eventEmitter.emit('pos.request.approved', {
      requestId:     dto.requestId,
      requestNumber: request.requestNumber,
      approvedById,
    });

    return updated;
  }

  // ─── So'rov Rad Etish ─────────────────────────────────────────────────────

  async rejectRequest(
    dto: RejectRequestDto,
    rejectedById: number,
    ipAddress?: string,
  ) {
    const [request] = await db
      .select()
      .from(posMaterialRequests)
      .where(eq(posMaterialRequests.id, dto.requestId));

    if (!request) throw new NotFoundException(`So'rov topilmadi: ${dto.requestId}`);
    if (!['DRAFT', 'APPROVED'].includes(request.status)) {
      throw new BadRequestException(`So'rov rad etib bo'lmaydi: ${request.status}`);
    }

    const [updated] = await db
      .update(posMaterialRequests)
      .set({
        status:           'REJECTED',
        rejectionReason:  dto.rejectionReason,
        updatedAt:        _time.now(),
      })
      .where(eq(posMaterialRequests.id, dto.requestId))
      .returning();

    this.eventEmitter.emit('pos.request.rejected', {
      requestId:       dto.requestId,
      requestNumber:   request.requestNumber,
      rejectedById,
      rejectionReason: dto.rejectionReason,
    });

    return updated;
  }

  issueFromRequest(dto: IssueFromRequestDto, issuedById: number, ipAddress?: string) { return this.extSvc.issueFromRequest(dto, issuedById, ipAddress); }
  findAll(filter: RequestFilterDto, userId: number, userRole: string) { return this.extSvc.findAll(filter, userId, userRole); }
  findOne(requestId: number) { return this.extSvc.findOne(requestId); }
}
