/**
 * @module pos-barcode-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Result, AppError, safeCall } from '@common/result';
import { castTo } from '@common/db-rows';
import { PosBarcodeExtRepository } from '../../infrastructure/repositories/pos-barcode-ext.repository';
import type {
  PrintLabelDto,
  ReviewAiSuggestionDto,
  GenerateEan13Dto,
} from '../../dto/barcode.dto';

@Injectable()
export class PosBarcodeExtService {
  private readonly logger = new Logger(PosBarcodeExtService.name);

  constructor(
    private readonly barcodeExtRepo: PosBarcodeExtRepository,
    private readonly i18n: I18nService,
  ) {}

  async queuePrint(dto: PrintLabelDto, userId: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const cardR = await this.barcodeExtRepo.findMaterialCardById(dto.materialCardId);
      if (!cardR.ok || !cardR.data) throw new NotFoundException(await this.i18n.t('errors.materialNotFoundWithId', { args: { id: dto.materialCardId } }));
      const card = cardR.data as { barcode?: string | null };
      if (!card.barcode) throw new BadRequestException(await this.i18n.t('errors.materialHasNoBarcode', { args: { id: dto.materialCardId } }));

      const printJob = await this.barcodeExtRepo.createPrintQueueJob(castTo<Parameters<typeof this.barcodeExtRepo.createPrintQueueJob>[0]>({
        materialCardId: dto.materialCardId,
        barcodeValue:   card.barcode,
        copies:         dto.copies,
        printerId:      dto.printerId,
        templateName:   dto.templateName ?? 'default',
        showPrice:      dto.showPrice ?? false,
        price:          dto.showPrice && dto.price ? String(dto.price) : undefined,
        posMovementId:  dto.posMovementId,
        status:         'QUEUED',
        requestedBy:    userId,
      }));

      this.logger.log(`Label navbatga: material=${dto.materialCardId} copies=${dto.copies}`);
      return printJob;
    });
  }

  async reviewAiSuggestion(dto: ReviewAiSuggestionDto, reviewerId: number) {
    const suggestionR = await this.barcodeExtRepo.findSuggestionById(dto.suggestionId);
    if (!suggestionR.ok || !suggestionR.data) throw new NotFoundException(await this.i18n.t('errors.aiSuggestionNotFound', { args: { id: dto.suggestionId } }));
    const suggestion = suggestionR.data as { status: string; suggestedName?: string; suggestedNameRu?: string; suggestedUnit?: string; suggestedBarcode?: string };
    if (suggestion.status !== 'PENDING') {
      throw new BadRequestException(await this.i18n.t('errors.suggestionAlreadyReviewed', { args: { status: suggestion.status } }));
    }

    let createdCardId: number | undefined;

    if (dto.decision === 'APPROVED' || dto.decision === 'MODIFIED') {
      const data = dto.decision === 'MODIFIED' && dto.modifiedData
        ? dto.modifiedData
        : {
            name:     suggestion.suggestedName,
            nameRu:   suggestion.suggestedNameRu,
            unit:     suggestion.suggestedUnit,
            barcode:  suggestion.suggestedBarcode,
          };

      const createdR = await this.barcodeExtRepo.createMaterialCard(
        data.name ?? '', data.nameRu ?? data.name ?? '', data.barcode ?? null, data.unit ?? 'dona',
      );
      createdCardId = (createdR.ok ? (createdR.data as { id: number }).id : undefined);
    }

    await this.barcodeExtRepo.updateSuggestionDecision(dto.suggestionId, {
      status:                dto.decision,
      reviewedBy:            reviewerId,
      reviewedAt:            _time.now(),
      createdMaterialCardId: createdCardId,
      rejectionReason:       dto.rejectionReason,
    });

    return { decision: dto.decision, createdCardId };
  }

  async generateEan13(dto: GenerateEan13Dto): Promise<string> {
    const base = dto.companyPrefix + dto.productCode;
    if (base.length !== 12) throw new BadRequestException(await this.i18n.t('validation.ean13BaseMustBe12Digits'));
    return base + this._calcEan13CheckDigit(base);
  }

  private _calcEan13CheckDigit(base12: string): string {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += i % 2 === 0 ? parseInt(base12[i], 10) : parseInt(base12[i], 10) * 3;
    }
    return String((10 - (sum % 10)) % 10);
  }

  async getStockInfo(materialCardId: number, warehouseId: string) {
    return this.barcodeExtRepo.getStockInfo(materialCardId, warehouseId);
  }

  async getPendingSuggestions(): Promise<Result<Record<string, unknown>[]>> {
    return this.barcodeExtRepo.findPendingSuggestions();
  }

  async requestAiSuggestion(barcode: string, _userId: number) {
    const existing = await this.barcodeExtRepo.findPendingAiSuggestion(barcode);
    if (existing) return existing;

    const suggestionCreated = await this.barcodeExtRepo.createAiSuggestion(barcode);
    const suggestionData = (suggestionCreated.ok ? suggestionCreated.data as { id?: number } : {});
    this.logger.warn(`AI taklif yaratildi: barcode=${barcode} id=${suggestionData.id}`);
    return suggestionCreated;
  }
}
