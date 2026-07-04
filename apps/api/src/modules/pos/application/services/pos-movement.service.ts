/**
 * @module pos-movement.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * POS — Movement Create Service
 *
 * createMovement + addLines + createDamageAct
 * (Boshqa servislar faqat createMovement ni ishlatadi)
 */
import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { Result, AppError, Err, safeCall } from '@common/result';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '@nestjs/cqrs';

import { PosMovementCreatedEvent } from '../../domain/events/pos-movement-created.event';
import { LifecycleBlockService }   from './lifecycle-block.service';
import { StockReservationService } from './stock-reservation.service';
import { EmployeeLedgerService }   from './employee-ledger.service';
import { PosAuditService }         from './pos-audit.service';
import { PosBalanceGuardService }  from './pos-balance-guard.service';
import { PosTechCardGateService }  from './pos-techcard-gate.service';
import { PosVarianceConfigService } from './pos-variance-config.service';
import { CreateMovementDto, AddMovementLineDto, CreateDamageActDto } from '../../dto/movement.dto';
import { resolveActNumberPrefix, resolveMovementCategory, MovementCategory } from '../../dto/movement-enums';
import { nextDocNumber, nextWarehouseDocNumber } from '@common/database/doc-sequences.helper';
import { Role } from '@common/constants/roles.constants';
import { PosMovementRepository } from '../../infrastructure/repositories/pos-movement.repository';
import { movementTypeEnum, posMovements, posMovementLines } from '@workspace/db';

type PosMovementType     = typeof movementTypeEnum.enumValues[number];
type PosMovementRow      = typeof posMovements.$inferSelect;
type LineInsert          = Omit<typeof posMovementLines.$inferInsert, 'id'>;

/** Chiqim harakatlari — balans tekshiruvi talab qilinadi */
const OUTBOUND_TYPES = new Set([
  'EXTERNAL_OUT',
  'INTERNAL_ISSUE',
  'INTERNAL_RETURN',
  'INTERNAL_TRANSFER',
  'DAMAGE',
  // ADDITIVE (2026-06-27): laboratoriya namuna olish ombordan chiqim —
  // mavjud chiqim-discipline (balans-gate) bilan bir xil ishlov.
  'LAB_SAMPLE_OUT',
]);

@Injectable()
export class PosMovementService {
  private readonly logger = new Logger(PosMovementService.name);

  constructor(
    private readonly lifecycleBlock:   LifecycleBlockService,
    private readonly stockReservation: StockReservationService,
    private readonly employeeLedger:   EmployeeLedgerService,
    private readonly auditService:     PosAuditService,
    private readonly balanceGuard:     PosBalanceGuardService,
    private readonly techCardGate:     PosTechCardGateService,
    private readonly varianceConfig:   PosVarianceConfigService,
    private readonly eventEmitter:     EventEmitter2,
    private readonly eventBus:         EventBus,
    private readonly repo:             PosMovementRepository,
  ) {}

  /**
   * @param requesterRole — so'rovchi roli (G1-2 bron-blok override uchun):
   *   faqat super_admin/direktor ACTIVE bronli materialni chiqara oladi.
   *   Ichki chaqiruvchilar (requisition/sync/balance) rol bermaydi → blok amal qiladi.
   */
  async createMovement(dto: CreateMovementDto, createdById: number, ipAddress?: string, requesterRole?: string): Promise<Result<PosMovementRow, AppError>> {
    return safeCall(async () => {
      // Idempotency (2026-07-01, Savdo-sity referens H-8 naqshi): double-tap/retry bir xil
      // kalit bilan qayta kelsa — mavjud harakatni qaytar, qayta-yaratma/qayta-tekshirma.
      if (dto.idempotencyKey) {
        const existingR = await this.repo.findMovementByIdempotencyKey(dto.idempotencyKey);
        if (existingR.ok && existingR.data) return existingR.data;
      }

      let movTypeR;
      if (dto.movementTypeId != null) {
        movTypeR = await this.repo.findMovementType(dto.movementTypeId);
      } else if (dto.movementTypeCode) {
        movTypeR = await this.repo.findMovementTypeByCode(dto.movementTypeCode);
      } else {
        throw new BadRequestException('movementTypeId yoki movementTypeCode majburiy');
      }
      if (!movTypeR.ok || !movTypeR.data) throw new NotFoundException(`Harakat turi topilmadi: ${dto.movementTypeId ?? dto.movementTypeCode}`);
      const movType = movTypeR.data;

      if (movType.code === 'INTERNAL_RETURN' && !dto.returnReason) {
        throw new BadRequestException('INTERNAL_RETURN uchun qaytarish sababi majburiy');
      }

      // G1-1 BARKOD SERVER-GATE (2026-07-02): EXTERNAL_IN kirimda har qatorda
      // barkod MAJBURIY (egasi: "barcode bo'lmasa qabul qilmaydi", kitob
      // 18400-18402). DTO superRefine faqat movementTypeCode yo'lini ushlaydi —
      // bu yerda movementTypeId yo'li ham qamrab olinadi (server = yagona darvoza).
      if (movType.code === 'EXTERNAL_IN' && dto.lines?.length) {
        const missingRows = dto.lines
          .map((l, i) => (l.barcode ? null : i + 1))
          .filter((i): i is number => i !== null);
        if (missingRows.length > 0) {
          throw new BadRequestException(
            `EXTERNAL_IN kirimda barkodsiz qator qabul qilinmaydi (qator: ${missingRows.join(', ')})`,
          );
        }
      }

      // SB0551 NARX-DARVOZASI (2026-07-04): EXTERNAL_IN (real tashqi xarid
      // qabuli) qatorida unitPrice 0/manfiy/yo'q bo'lsa GL'ga 0-summa yozib,
      // ombor bahosini (valuation) buzadi — auto-gl-posting.repository.ts
      // sumLines() to'g'ridan SUM(quantity*unit_price) yig'adi. DTO
      // superRefine faqat movementTypeCode yo'lini ushlaydi — bu yerda
      // movementTypeId yo'li ham qamrab olinadi (server = yagona darvoza,
      // G1-1 barkod-darvozasi bilan bir xil naqsh).
      if (movType.code === 'EXTERNAL_IN' && dto.lines?.length) {
        const badPriceRows = dto.lines
          .map((l, i) => (typeof l.unitPrice === 'number' && l.unitPrice > 0 ? null : i + 1))
          .filter((i): i is number => i !== null);
        if (badPriceRows.length > 0) {
          throw new BadRequestException(
            `EXTERNAL_IN kirimda musbat unitPrice majburiy (0/manfiy/yo'q narx qabul qilinmaydi, qator: ${badPriceRows.join(', ')})`,
          );
        }
      }

      // G2-1 QABUL-TOLERANS (2026-07-04, SB0544/EP-WMS-047 vizyon: "receipt
      // ±2% auto-accept, above -> manager approval + mandatory reason").
      // EXTERNAL_IN + purchaseOrderId berilganda har qator PO buyurtma
      // miqdoriga solishtiriladi. Mavjud PosVarianceConfigService (P4,
      // inventarizatsiya uchun qurilgan) qayta ishlatiladi — yangi jadval
      // YO'Q (Q-35). PO/material topilmasa (eski oqim, PO'siz kirim) —
      // tekshiruv no-op (Q-46, mavjud oqim buzilmaydi).
      if (movType.code === 'EXTERNAL_IN' && dto.purchaseOrderId && dto.lines?.length) {
        const poIdNum = Number(dto.purchaseOrderId);
        const whIdForConfig = dto.toWarehouseId && Number.isFinite(Number(dto.toWarehouseId))
          ? Number(dto.toWarehouseId)
          : null;
        if (Number.isFinite(poIdNum)) {
          const receiptEscalations: string[] = [];
          for (const line of dto.lines) {
            const poQtyR = await this.repo.findPoLineQty(poIdNum, line.materialCardId);
            const poQty = poQtyR.ok ? poQtyR.data : null;
            if (poQty == null || poQty <= 0) continue; // PO qatori topilmadi — tekshirilmaydi
            const decisionR = await this.varianceConfig.decideForLine(whIdForConfig, {
              systemQty:   poQty,
              varianceQty: Math.abs(line.quantity - poQty),
            });
            if (decisionR.ok && decisionR.data.decision === 'ESCALATE') {
              receiptEscalations.push(
                `Material #${line.materialCardId}: PO=${poQty}, kelgan=${line.quantity} ` +
                `(${decisionR.data.qtyPct.toFixed(2)}% farq) — ${decisionR.data.reason}`,
              );
            }
          }
          if (receiptEscalations.length > 0 && !(dto as Record<string, unknown>).overrideReason) {
            throw new HttpException(
              {
                statusCode: HttpStatus.CONFLICT,
                message:    "Qabul miqdori PO'dan tolerans chegarasidan tashqarida — rahbar tasdig'i kerak (overrideReason yuboring)",
                warnings:   receiptEscalations,
              },
              HttpStatus.CONFLICT,
            );
          }
          if (receiptEscalations.length > 0) {
            await this.auditService.log({
              userId:     createdById,
              action:     'pos.movement.receipt_tolerance_override',
              entityType: 'pos_movements',
              entityId:   0,
              newValue:   { purchaseOrderId: dto.purchaseOrderId, escalations: receiptEscalations, overrideReason: (dto as Record<string, unknown>).overrideReason },
              ipAddress,
            });
          }
        }
      }

      // G1-2 BRON-BLOK POST-GATE (2026-07-02): EXTERNAL_OUT/INTERNAL_ISSUE
      // yaratishda har qator materiali uchun ACTIVE bron tekshiriladi — GET
      // issuable (pos-stock-issuable.service.ts:182-239) bilan BIR XIL semantika:
      // bron > 0 → blok; faqat super_admin/direktor override qila oladi.
      if ((movType.code === 'EXTERNAL_OUT' || movType.code === 'INTERNAL_ISSUE') && dto.lines?.length && dto.fromWarehouseId) {
        const canOverride = requesterRole === Role.SUPER_ADMIN || requesterRole === Role.DIRECTOR;
        const whIdNum = Number(dto.fromWarehouseId);
        // stock_reservations.warehouse_id = integer; raqam bo'lmagan (legacy UUID)
        // ombor id'siga bron bog'lanolmaydi → tekshirish shart emas.
        if (!canOverride && Number.isFinite(whIdNum)) {
          const reservedBlocks: string[] = [];
          for (const line of dto.lines) {
            const resR = await this.stockReservation.getActiveReservedTotal(line.materialCardId, whIdNum);
            if (!resR.ok) throw new InternalServerErrorException(resR.error.message);
            if (resR.data > 0) {
              reservedBlocks.push(`Material #${line.materialCardId}: ${resR.data} birlik ACTIVE bronda`);
            }
          }
          if (reservedBlocks.length > 0) {
            throw new ForbiddenException(
              `Bronlangan material chiqimi bloklandi (faqat super_admin/direktor ochishi mumkin):\n${reservedBlocks.join('\n')}`,
            );
          }
        }
      }

      if (movType.code === 'EXTERNAL_OUT' && dto.fromWarehouseId) {
        const whR = await this.repo.findWarehouseType(dto.fromWarehouseId);
        const wh = whR.ok ? whR.data : null;
        if (!wh || wh.type !== 'finished_goods') {
          throw new ForbiddenException('EXTERNAL_OUT faqat tayyor mahsulot omboridan amalga oshirilishi mumkin');
        }
      }

      if (movType.code === 'INTERNAL_ISSUE' && dto.receivedByEmployeeId && dto.lines) {
        for (const line of dto.lines) {
          const check = await this.lifecycleBlock.check(dto.receivedByEmployeeId, line.materialCardId, line.quantity);
          if (!check.allowed) throw new BadRequestException(`Material ${line.materialCardId}: ${check.reason}`);
        }
      }

      // Chiqim harakatlari uchun ombor qoldiqlarini tekshirish
      if (OUTBOUND_TYPES.has(movType.code) && dto.lines?.length && dto.fromWarehouseId) {
        const balanceLines = dto.lines.map((l) => ({
          warehouseId:    dto.fromWarehouseId as string,
          materialCardId: l.materialCardId,
          quantity:       l.quantity,
        }));

        const guardResult = await this.balanceGuard.checkMovementLines(
          balanceLines,
          (dto as Record<string, unknown>).overrideReason as string | undefined,
        );

        if (guardResult.blocks.length > 0) {
          throw new BadRequestException(
            `Ombor qoldig'i yetarli emas:\n${guardResult.blocks.join('\n')}`,
          );
        }

        if (guardResult.warnings.length > 0 && !(dto as Record<string, unknown>).overrideReason) {
          // 409 — frontend tasdiqlash dialogini ko'rsatadi
          throw new HttpException(
            {
              statusCode: HttpStatus.CONFLICT,
              message:    'Qoldiq ogohlantirishi: davom etish uchun overrideReason yuboring',
              warnings:   guardResult.warnings,
            },
            HttpStatus.CONFLICT,
          );
        }

        if (guardResult.warnings.length > 0 && (dto as Record<string, unknown>).overrideReason) {
          await this.auditService.log({
            userId:     createdById,
            action:     'pos.movement.balance_override',
            entityType: 'pos_movements',
            entityId:   0,
            newValue: {
              movementType: movType.code,
              overrideReason: (dto as Record<string, unknown>).overrideReason,
              warnings: guardResult.warnings,
            },
            ipAddress,
          });
        }
      }

      // P4-TECHCARD-VARIANCE: texkarta-material mosligi CHIQIMDAN OLDIN blok
      // (EP-WMS-084/085). Faqat chiqim turlari + context.technologyCardId
      // berilganda ishlaydi; aks holda no-op (mavjud oqim o'zgarmaydi, Q-46).
      // DUBLIKAT YO'Q: WMS OutboundEnforcementService qayta-ishlatiladi.
      const techCardId = dto.context?.technologyCardId ?? null;
      if (OUTBOUND_TYPES.has(movType.code) && techCardId && dto.lines?.length) {
        const gateLines = dto.lines.map((l) => ({
          materialCardId: l.materialCardId,
          issuedLayer:    dto.context?.issuedLayer ?? null,
        }));
        const gateR = await this.techCardGate.checkLines(techCardId, gateLines);
        if (!gateR.ok) throw new InternalServerErrorException(gateR.error.message);
        if (!gateR.data.allowed) {
          const lines = gateR.data.blocks.map((b) => `Material #${b.materialCardId}: ${b.message}`);
          throw new BadRequestException(
            `Texkarta-material mos kelmadi (chiqim bloklandi):\n${lines.join('\n')}`,
          );
        }
      }

      // G1-3 OMBOR-PREFIKSLI raqamlash (2026-07-02, vizyon OMBOR-KASSIR-INTERVYU
      // §13/29-savol): raqam = <OMBOR-KOD>-<TUR>-<YIL>-<SEQ> (mas.
      // RMMAIN-KIRIM-2026-00001) — kirimda to_warehouse, chiqim/qolganida
      // from_warehouse kodidan prefiks; sequence har prefiks uchun atomik.
      // Ombor/kod topilmasa → FAZA D akt-prefiks fallback (KIRIM-AKT-...), u ham
      // bo'lmasa eski generic POS-YYYY-NNNNN. ESKI raqamlar o'zgarmaydi (Q-39).
      const category = resolveMovementCategory(movType.code);
      const prefixWarehouseId = category === MovementCategory.KIRIM
        ? (dto.toWarehouseId ?? dto.fromWarehouseId)
        : (dto.fromWarehouseId ?? dto.toWarehouseId);
      let movementNumber: string | null = null;
      if (category && prefixWarehouseId) {
        const whCodeR = await this.repo.findWarehouseCode(prefixWarehouseId);
        const whCode = whCodeR.ok ? whCodeR.data : null;
        if (whCode) movementNumber = await nextWarehouseDocNumber(whCode, category);
      }
      if (!movementNumber) {
        const aktPrefix = resolveActNumberPrefix(movType.code);
        if (aktPrefix) {
          movementNumber = await nextDocNumber(aktPrefix);
        } else {
          const countR = await this.repo.countMovements();
          const count = countR.ok ? (countR.data as number) : 0;
          movementNumber = `POS-${_time.now().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
        }
      }

      const movementR = await this.repo.insertMovement({
        movementNumber,
        movementType:         movType.code as PosMovementType,
        status:               'draft',
        fromWarehouseId:      dto.fromWarehouseId,
        toWarehouseId:        dto.toWarehouseId,
        receivedByEmployeeId: dto.receivedByEmployeeId,
        createdBy:            createdById,
        returnReason:         dto.returnReason,
        purchaseOrderId:      dto.purchaseOrderId,
        cashPaid:             dto.cashPaid ?? false,
        cashAmount:           dto.cashAmount ?? 0,
        currency:             dto.baseCurrency ?? 'UZS',
        exchangeRate:         dto.exchangeRate ?? 1,
        notes:                dto.notes,
        idempotencyKey:       dto.idempotencyKey ?? null,
      });
      if (!movementR.ok) {
        // Race-condition: ikkita bir-vaqtli so'rov bir xil kalit bilan — UNIQUE-buzilish
        // bo'lsa mavjud harakatni qaytar (Ok), boshqa xato bo'lsa haqiqiy xatoni qaytar.
        if (dto.idempotencyKey && /idempotency_key|unique/i.test(movementR.error.message)) {
          const raceR = await this.repo.findMovementByIdempotencyKey(dto.idempotencyKey);
          if (raceR.ok && raceR.data) return raceR.data;
        }
        throw new InternalServerErrorException(movementR.error.message);
      }
      const movement = movementR.data;

      if (dto.lines?.length) {
        const linesR = await this.addLines(movement.id, dto.lines, dto.fromWarehouseId, movType.code);
        if (!linesR.ok) throw new InternalServerErrorException(linesR.error.message);
      }

      // ADDITIVE (2026-06-27): yangi harakat turlari uchun kontekst saqlash.
      // WASTE_IN / LAB_SAMPLE_OUT / PARTIAL_RECEIPT / CUSTOMER_MATERIAL.
      // Q-40: fabrikatsiya yo'q — faqat dto'da kelgan qiymatlar saqlanadi
      // (kelmasa NULL/graceful). Mavjud oqim bu bilan o'zgarmaydi.
      await this.persistMovementContext(movement.id, movType.code, dto);

      // P4: chiqim ↔ texkarta bog'lanishini saqlash (buyurtma-o'zgarish
      // qayta-tekshiruvi uchun). Texkarta yo'q → no-op.
      if (techCardId) {
        await this.techCardGate.recordLink(
          movement.id,
          techCardId,
          dto.context?.issuedLayer ?? null,
          { allowed: true, blocks: [] },
        );
      }

      await this.auditService.log({
        userId: createdById, action: 'pos.movement.created', entityType: 'pos_movements',
        entityId: movement.id, newValue: { movementNumber, type: movType.code, status: 'draft' }, ipAddress,
      });
      this.logger.log(`[POS] Harakat yaratildi: ${movementNumber} type=${movType.code}`);
      // Wave 4 round-4 (PA2-18): publish both legacy string topic AND canonical
      // typed event. EventBridge bridges CQRS → string for any consumer not
      // yet migrated; the legacy emit is kept here as a belt-and-suspenders
      // measure while migration is in flight.
      this.eventEmitter.emit('pos.movement.data.created', { movementId: movement.id, movementNumber, typeCode: movType.code, createdById });
      this.eventBus.publish(new PosMovementCreatedEvent({ movementId: movement.id, movementNumber, typeCode: movType.code, createdById }));

      if (dto.submit) {
        const statusR = await this.repo.updateMovementStatus(movement.id, 'pending');
        if (!statusR.ok) this.logger.warn(`[POS] Submit->pending xatolik: ${movementNumber}`);
        this.eventEmitter.emit('pos.movement.data.pending', { movementId: movement.id, movementNumber, oldStatus: 'draft', newStatus: 'pending', updatedById: createdById });
      }

      return movement;
    });
  }

  /**
   * ADDITIVE (2026-06-27): yangi harakat turlari uchun kontekst yozish.
   * Faqat 4 yangi tur uchun va faqat dto.context kelganda yoziladi.
   * Boshqa (mavjud) turlar uchun no-op — eski oqim o'zgarmaydi (Q-46).
   */
  private async persistMovementContext(
    movementId: number,
    typeCode: string,
    dto: CreateMovementDto,
  ): Promise<void> {
    const CONTEXT_TYPES = new Set(['WASTE_IN', 'LAB_SAMPLE_OUT', 'PARTIAL_RECEIPT', 'CUSTOMER_MATERIAL']);
    if (!CONTEXT_TYPES.has(typeCode)) return;

    const ctx = dto.context;
    // Kontekst yo'q bo'lsa ham — tur yangi bo'lgani uchun bo'sh qator yozamiz
    // (keyinchalik to'ldirilishi mumkin). Fabrikatsiya yo'q: faqat kelgan
    // qiymatlar; kelmaganlari NULL.
    const result = await this.repo.upsertMovementContext({
      movementId,
      labSampleReason: ctx?.labSampleReason,
      labTestRef:      ctx?.labTestRef,
      orderedQty:      ctx?.orderedQty,
      acceptedQty:     ctx?.acceptedQty,
      rejectedQty:     ctx?.rejectedQty,
      partialReason:   ctx?.partialReason,
      customerId:      ctx?.customerId,
      customerName:    ctx?.customerName,
      // CUSTOMER_MATERIAL turi avtomatik mijoz-mol deb belgilanadi
      isCustomerOwned: ctx?.isCustomerOwned ?? (typeCode === 'CUSTOMER_MATERIAL'),
      wasteSource:     ctx?.wasteSource,
    });
    if (!result.ok) {
      this.logger.warn(`[POS] Kontekst saqlash xatosi (movement=${movementId}, type=${typeCode}): ${result.error.message}`);
    }
  }

  async addLines(movementId: number, lines: AddMovementLineDto[], fromWarehouseId?: string, movementTypeCode?: string) {
    // G1-1 BARKOD SERVER-GATE (2026-07-02): EXTERNAL_IN qatorlariga barkodsiz
    // qo'shish TAQIQ (egasi: "barcode bo'lmasa qabul qilmaydi").
    const safeLines = Array.isArray(lines) ? lines : [];
    if (movementTypeCode === 'EXTERNAL_IN') {
      const missingRows = safeLines
        .map((l, i) => (l.barcode ? null : i + 1))
        .filter((i): i is number => i !== null);
      if (missingRows.length > 0) {
        return Err({
          code: 'BAD_REQUEST',
          message: `EXTERNAL_IN kirimda barkodsiz qator qabul qilinmaydi (qator: ${missingRows.join(', ')})`,
        });
      }
    }
    const maxSeqR = await this.repo.getMaxLineSequence(movementId);
    const maxSeq = maxSeqR.ok ? (maxSeqR.data as number) : 0;
    let seq = maxSeq + 1;
    const values: LineInsert[] = safeLines.map((line) => ({
      movementId,
      materialCardId:  line.materialCardId,
      batchId:         line.batchId ?? undefined,
      quantity:        line.quantity,
      unitPrice:       line.unitPrice ?? 0,
      totalPrice:      line.quantity * (line.unitPrice ?? 0),
      currency:        line.currency ?? 'UZS',
      exchangeRate:    line.exchangeRate ?? 1,
      unitPriceBase:   line.unitPrice ?? 0,
      totalPriceBase:  line.quantity * (line.unitPrice ?? 0),
      expiryDate:      line.expiryDate ? new Date(line.expiryDate) : undefined,
      binId:           line.binLocation ?? undefined,
      fifoSequence:    seq++,
      // G1-1 (2026-07-02): FE yuborgan barkod endi saqlanadi (avval tashlanardi).
      barcode:         line.barcode ?? undefined,
      notes:           line.notes ?? undefined,
    }));
    return this.repo.insertLines(values);
  }

  async createDamageAct(dto: CreateDamageActDto, createdById: number, ipAddress?: string) {
    const damageTypeR = await this.repo.findMovementTypeByCode('DAMAGE');
    if (!damageTypeR.ok) throw new NotFoundException('DAMAGE harakat turi topilmadi');
    const damageType = damageTypeR.data as { id: number };

    const movementR = await this.repo.findMovementWarehouseIds(dto.posMovementId);
    const movement = movementR.ok ? (movementR.data as { toWarehouseId?: string }) : null;

    const damageMovementR = await this.createMovement({
      movementTypeId: damageType.id,
      fromWarehouseId: movement?.toWarehouseId ?? undefined,
      lines: [{ materialCardId: dto.materialCardId, quantity: dto.damagedQty, serialNumber: dto.serialNumber }],
      notes: dto.damageDescription,
    }, createdById, ipAddress);
    if (!damageMovementR.ok) throw new InternalServerErrorException(damageMovementR.error.message);
    const damageMovement = damageMovementR.data as { id: number };

    if (dto.sendToQc) {
      await this.repo.insertDamageQcLink(damageMovement.id, dto.posMovementId, dto.materialCardId, dto.damagedQty, dto.damageDescription);
      this.eventEmitter.emit('pos.damage.qc_required', { damageMovementId: damageMovement.id, materialCardId: dto.materialCardId, damagedQty: dto.damagedQty });
    }
    return damageMovement;
  }
}
