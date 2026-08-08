/**
 * @module pos-inventory.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { safeCall, Result, AppError } from '@common/result';
import { PosInventoryRepository } from '../../infrastructure/repositories/pos-inventory.repository';
import { CreateInventoryPassportDto, AssignBarcodeDto, CreatePdfTemplateDto } from '../../dto/pos.dto';

@Injectable()
export class PosInventoryService {
  private readonly logger = new Logger(PosInventoryService.name);

  constructor(
    private readonly repo: PosInventoryRepository,
    private readonly i18n: I18nService,
  ) {}

  async getPassports(warehouseId?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => this.repo.getPassports(warehouseId));
  }

  async getPassportById(id: number) {
    return safeCall(async () => this.repo.getPassportById(id));
  }

  async createPassport(dto: CreateInventoryPassportDto, createdBy: number) {
    return safeCall(async () => {
      const existing = await this.repo.findPassportByNumber(dto.passportNumber);
      if (existing) throw new BadRequestException(await this.i18n.t('errors.passportNumberAlreadyExists', { args: { number: dto.passportNumber } }));
      const created = await this.repo.createPassport(dto, createdBy);
      this.logger.log(`[POS] Pasport yaratildi: ${dto.passportNumber}`);
      return created;
    });
  }

  async assignBarcode(dto: AssignBarcodeDto, printedBy: number) {
    return safeCall(async () => {
      await this.repo.findPassportForBarcode(dto.passportId);
      const existing = await this.repo.findBarcodeByValue(dto.barcode);
      if (existing) throw new BadRequestException(await this.i18n.t('errors.barcodeAlreadyExists', { args: { barcode: dto.barcode } }));
      if (dto.isPrimary) {
        await this.repo.clearPrimaryBarcode(dto.passportId);
      }
      return this.repo.assignBarcode(dto, printedBy);
    });
  }

  async lookupBarcode(barcode: string) {
    return safeCall(async () => this.repo.lookupBarcode(barcode));
  }

  async getPdfTemplates() {
    return safeCall(async () => this.repo.getPdfTemplates());
  }

  async getPdfTemplateById(id: number) {
    return safeCall(async () => this.repo.getPdfTemplateById(id));
  }

  async createPdfTemplate(dto: CreatePdfTemplateDto, createdBy: number) {
    return safeCall(async () => {
      const existing = await this.repo.findTemplateByCode(dto.code);
      if (existing) throw new BadRequestException(await this.i18n.t('errors.templateCodeAlreadyExists', { args: { code: dto.code } }));
      const created = await this.repo.createPdfTemplate(dto, createdBy);
      this.logger.log(`[POS] PDF shablon yaratildi: ${dto.code}`);
      return created;
    });
  }

  async getStats() {
    return safeCall(async () => this.repo.getStats());
  }
}
