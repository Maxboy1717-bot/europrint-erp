/**
 * @module pos-shift-handover.service
 * @description Business-logic for POS smena-topshirish (2-IMZO darvozasi) + foto-dalil +
 *   qaytariladigan-tara (poddon/rohler). Returns Result<T>; never throws raw Errors.
 *
 *   2-IMZO GATE: akt 'closed' holatiga FAQAT topshiruvchi (from) VA qabul qiluvchi (to)
 *   ikkalasi ham imzolaganda o'tadi. Bitta imzo bo'lsa status `from_signed`/`to_signed`
 *   da qoladi — akt yopilmaydi. (Migration'da DB-level CHECK ham bor — ikki qatlam.)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { PosShiftHandoverRepository } from '../../infrastructure/repositories/pos-shift-handover.repository';
import { PosAuditService } from './pos-audit.service';
import {
  CreateShiftHandoverDto,
  SignHandoverDto,
  CancelShiftHandoverDto,
  ShiftHandoverFilterDto,
  ReturnablePalletDto,
  ReturnablePalletFilterDto,
} from '../../dto/shift-handover.dto';

const OPEN_STATUSES = ['draft', 'from_signed', 'to_signed'];

@Injectable()
export class PosShiftHandoverService {
  private readonly logger = new Logger(PosShiftHandoverService.name);

  constructor(
    private readonly repo: PosShiftHandoverRepository,
    private readonly auditService: PosAuditService,
  ) {}

  // ─── Akt yaratish ──────────────────────────────────────────────────────────
  async createHandover(dto: CreateShiftHandoverDto, fromUserId: number, ipAddress?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      if (dto.toUserId === fromUserId) {
        throw new BadRequestException('Topshiruvchi va qabul qiluvchi bir xil bo\'lishi mumkin emas');
      }
      const handoverNumber = `SH-${_time.now().getTime()}`;
      const createdR = await this.repo.createHandover({
        handoverNumber,
        warehouseId: dto.warehouseId ?? null,
        fromUserId,
        toUserId: dto.toUserId,
        items: dto.items,
        notes: dto.notes ?? null,
        photoEvidenceUrl: dto.photoEvidenceUrl ?? null,
        createdBy: fromUserId,
      });
      if (!createdR.ok) throw new BadRequestException(`Akt yaratilmadi: ${createdR.error.message}`);
      const created = createdR.data as Record<string, unknown>;

      await this.auditService.log({
        userId: fromUserId, action: 'pos.handover.created', entityType: 'pos_shift_handovers',
        entityId: Number(created.id), newValue: { handoverNumber, toUserId: dto.toUserId, items: dto.items }, ipAddress,
      });
      return created;
    });
  }

  // ─── Imzo (2-imzo darvozasi) ───────────────────────────────────────────────
  async sign(id: number, dto: SignHandoverDto, userId: number, ipAddress?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const found = await this.repo.findById(id);
      if (!found.ok || !found.data) throw new NotFoundException(`Akt topilmadi: ${id}`);
      const handover = found.data as Record<string, unknown>;
      const status = String(handover.status ?? '');
      if (!OPEN_STATUSES.includes(status)) {
        throw new BadRequestException(`Akt ${status} holatida — imzolab bo'lmaydi`);
      }

      const fromUserId = Number(handover.fromUserId ?? handover.from_user_id);
      const toUserId = Number(handover.toUserId ?? handover.to_user_id);

      // Faqat tegishli rol egasi imzolaydi (topshiruvchi 'from', qabul qiluvchi 'to').
      if (dto.role === 'from' && userId !== fromUserId) {
        throw new ForbiddenException('Faqat topshiruvchi (from_user) topshiruvchi imzosini qo\'ya oladi');
      }
      if (dto.role === 'to' && userId !== toUserId) {
        throw new ForbiddenException('Faqat qabul qiluvchi (to_user) qabul imzosini qo\'ya oladi');
      }

      const fromSigned = handover.fromSignedAt ?? handover.from_signed_at;
      const toSigned = handover.toSignedAt ?? handover.to_signed_at;
      if (dto.role === 'from' && fromSigned) throw new BadRequestException('Topshiruvchi allaqachon imzolagan');
      if (dto.role === 'to' && toSigned) throw new BadRequestException('Qabul qiluvchi allaqachon imzolagan');

      // 2-IMZO GATE: yangi status — ikkala imzo bo'lsa 'closed', aks holda yarim holat.
      const willFromSigned = dto.role === 'from' ? true : Boolean(fromSigned);
      const willToSigned = dto.role === 'to' ? true : Boolean(toSigned);
      const newStatus = willFromSigned && willToSigned
        ? 'closed'
        : (willFromSigned ? 'from_signed' : 'to_signed');

      const updatedR = await this.repo.applySignature(id, dto.role, newStatus, dto.photoEvidenceUrl ?? null);
      if (!updatedR.ok) throw new BadRequestException(`Imzo saqlanmadi: ${updatedR.error.message}`);

      await this.auditService.log({
        userId, action: `pos.handover.signed.${dto.role}`, entityType: 'pos_shift_handovers',
        entityId: id, oldValue: { status }, newValue: { status: newStatus, role: dto.role }, ipAddress,
      });

      if (newStatus === 'closed') {
        this.logger.log(`[HANDOVER] Akt yopildi (2-imzo to'liq): id=${id} from=${fromUserId} to=${toUserId}`);
      }
      return updatedR.data as object;
    });
  }

  // ─── Bekor qilish ──────────────────────────────────────────────────────────
  async cancel(id: number, dto: CancelShiftHandoverDto, userId: number, ipAddress?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const found = await this.repo.findById(id);
      if (!found.ok || !found.data) throw new NotFoundException(`Akt topilmadi: ${id}`);
      const status = String((found.data as Record<string, unknown>).status ?? '');
      if (status === 'closed') throw new BadRequestException('Yopilgan aktni bekor qilib bo\'lmaydi');
      if (status === 'cancelled') throw new BadRequestException('Akt allaqachon bekor qilingan');

      const cancelledR = await this.repo.cancel(id, dto.reason);
      if (!cancelledR.ok) throw new BadRequestException(`Bekor qilinmadi: ${cancelledR.error.message}`);

      await this.auditService.log({
        userId, action: 'pos.handover.cancelled', entityType: 'pos_shift_handovers',
        entityId: id, oldValue: { status }, newValue: { status: 'cancelled', reason: dto.reason }, ipAddress,
      });
      return cancelledR.data as object;
    });
  }

  // ─── So'rovlar ─────────────────────────────────────────────────────────────
  async findOne(id: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const found = await this.repo.findById(id);
      if (!found.ok || !found.data) throw new NotFoundException(`Akt topilmadi: ${id}`);
      return found.data as object;
    });
  }

  async findAll(filter: ShiftHandoverFilterDto): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findAll(filter);
      const items = r.ok && Array.isArray(r.data) ? r.data : [];
      return { items, total: items.length };
    });
  }

  // ─── Qaytariladigan-tara (poddon / rohler) ─────────────────────────────────
  async recordPallet(dto: ReturnablePalletDto, userId: number, ipAddress?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const createdR = await this.repo.createPalletEntry({
        warehouseId: dto.warehouseId ?? null,
        palletType: dto.palletType,
        direction: dto.direction,
        quantity: dto.quantity,
        counterpartyId: dto.counterpartyId ?? null,
        handoverId: dto.handoverId ?? null,
        movementId: dto.movementId ?? null,
        photoEvidenceUrl: dto.photoEvidenceUrl ?? null,
        note: dto.note ?? null,
        createdBy: userId,
      });
      if (!createdR.ok) throw new BadRequestException(`Tara yozuvi saqlanmadi: ${createdR.error.message}`);

      await this.auditService.log({
        userId, action: `pos.pallet.${dto.direction}`, entityType: 'pos_returnable_pallets',
        entityId: Number((createdR.data as Record<string, unknown>).id),
        newValue: { palletType: dto.palletType, direction: dto.direction, quantity: dto.quantity }, ipAddress,
      });
      return createdR.data as object;
    });
  }

  async getPalletBalance(filter: ReturnablePalletFilterDto): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getPalletBalance(filter);
      const rows = r.ok && Array.isArray(r.data) ? r.data : [];
      return { items: rows, total: rows.length };
    });
  }
}
