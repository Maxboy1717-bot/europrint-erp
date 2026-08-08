/**
 * @module pos-inventory.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { posMovementTypes, posMovements, posMovementLines, inventoryPassports, inventoryBarcodeAssignments, posPdfTemplates, db, eq, and, isNull, desc, sql } from '@workspace/db';
import { CreateInventoryPassportDto, AssignBarcodeDto, CreatePdfTemplateDto } from '../../dto/pos.dto';
import { safeCall, Result } from '@common/result';

@Injectable()
export class PosInventoryRepository {
  constructor(private readonly i18n: I18nService) {}

  async getPassports(warehouseId?: string) : Promise<Result<(typeof inventoryPassports.$inferSelect)[]>>{
    return safeCall(async () => {
      if (warehouseId) {
        return await db.select().from(inventoryPassports)
          .where(and(eq(inventoryPassports.warehouseId, warehouseId), eq(inventoryPassports.isActive, true)))
          .orderBy(desc(inventoryPassports.createdAt));
      }
      return await db.select().from(inventoryPassports)
        .where(eq(inventoryPassports.isActive, true))
        .orderBy(desc(inventoryPassports.createdAt));
      }, 'DB_ERROR');
  }

  async getPassportById(id: number) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [passport] = await db.select().from(inventoryPassports).where(eq(inventoryPassports.id, id));
      if (!passport) throw new NotFoundException(await this.i18n.t('errors.passportNotFoundWithId', { args: { id } }));
      const barcodes = await db.select().from(inventoryBarcodeAssignments)
        .where(and(eq(inventoryBarcodeAssignments.passportId, id), eq(inventoryBarcodeAssignments.isActive, true)));
      return { ...passport, barcodes };
      }, 'DB_ERROR');
  }

  async findPassportByNumber(passportNumber: string) : Promise<Result<Record<string, unknown> | undefined>>{
    return safeCall(async () => {
      const [existing] = await db.select({ id: inventoryPassports.id })
        .from(inventoryPassports)
        .where(eq(inventoryPassports.passportNumber, passportNumber));
      return existing;
      }, 'DB_ERROR');
  }

  async createPassport(dto: CreateInventoryPassportDto, createdBy: number) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [created] = await db.insert(inventoryPassports).values({
        passportNumber: dto.passportNumber,
        productId: dto.productId,
        productName: dto.productName,
        unit: dto.unit ?? 'dona',
        warehouseId: dto.warehouseId,
        batchNumber: dto.batchNumber,
        serialNumber: dto.serialNumber,
        manufacturedAt: dto.manufacturedAt ? new Date(dto.manufacturedAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy,
      } as typeof inventoryPassports.$inferInsert).returning();
      return created;
      }, 'DB_ERROR');
  }

  async findPassportForBarcode(passportId: number) : Promise<Result<Record<string, unknown> | undefined>>{
    return safeCall(async () => {
      const [passport] = await db.select({ id: inventoryPassports.id })
        .from(inventoryPassports).where(eq(inventoryPassports.id, passportId));
      return passport;
      }, 'DB_ERROR');
  }

  async findBarcodeByValue(barcode: string) : Promise<Result<Record<string, unknown> | undefined>>{
    return safeCall(async () => {
      const [existing] = await db.select({ id: inventoryBarcodeAssignments.id })
        .from(inventoryBarcodeAssignments)
        .where(eq(inventoryBarcodeAssignments.barcode, barcode));
      return existing;
      }, 'DB_ERROR');
  }

  async clearPrimaryBarcode(passportId: number) : Promise<Result<void>>{
    return safeCall(async () => {
      await db.update(inventoryBarcodeAssignments)
        .set({ isPrimary: false } as Parameters<ReturnType<typeof db.update>['set']>[0])
        .where(eq(inventoryBarcodeAssignments.passportId, passportId));
      }, 'DB_ERROR');
  }

  async assignBarcode(dto: AssignBarcodeDto, printedBy: number) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const _barcodesRet = await db.insert(inventoryBarcodeAssignments).values({
        barcode: dto.barcode,
        barcodeType: dto.barcodeType,
        passportId: dto.passportId,
        quantity: dto.quantity != null ? Number(dto.quantity) : 1,
        isPrimary: dto.isPrimary ?? false,
        printedBy,
        printedAt: _time.now(),
      } as typeof inventoryBarcodeAssignments.$inferInsert).returning();
      return _barcodesRet[0];
      }, 'DB_ERROR');
  }

  async lookupBarcode(barcode: string) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [assignment] = await db.select().from(inventoryBarcodeAssignments)
        .where(and(eq(inventoryBarcodeAssignments.barcode, barcode), eq(inventoryBarcodeAssignments.isActive, true)));
      if (!assignment) throw new NotFoundException(await this.i18n.t('errors.barcodeNotFoundWithValue', { args: { barcode } }));
      const [passport] = await db.select().from(inventoryPassports)
        .where(eq(inventoryPassports.id, assignment.passportId));
      return { assignment, passport };
      }, 'DB_ERROR');
  }

  async getPdfTemplates() : Promise<Result<(typeof posPdfTemplates.$inferSelect)[]>>{
    return safeCall(async () => {
      return await db.select().from(posPdfTemplates)
        .where(eq(posPdfTemplates.isActive, true))
        .orderBy(posPdfTemplates.name);
      }, 'DB_ERROR');
  }

  async getPdfTemplateById(id: number) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [template] = await db.select().from(posPdfTemplates).where(eq(posPdfTemplates.id, id));
      if (!template) throw new NotFoundException(await this.i18n.t('errors.templateNotFoundWithId', { args: { id } }));
      return template;
      }, 'DB_ERROR');
  }

  async findTemplateByCode(code: string) : Promise<Result<Record<string, unknown> | undefined>>{
    return safeCall(async () => {
      const [existing] = await db.select({ id: posPdfTemplates.id })
        .from(posPdfTemplates).where(eq(posPdfTemplates.code, code));
      return existing;
      }, 'DB_ERROR');
  }

  async createPdfTemplate(dto: CreatePdfTemplateDto, createdBy: number) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [created] = await db.insert(posPdfTemplates).values({
        name: dto.name,
        code: dto.code,
        movementTypeId: dto.movementTypeId,
        templateContent: dto.templateContent,
        paperSize: dto.paperSize ?? 'A4',
        orientation: dto.orientation ?? 'portrait',
        isDefault: dto.isDefault ?? false,
        createdBy,
      } as typeof posPdfTemplates.$inferInsert).returning();
      return created;
      }, 'DB_ERROR');
  }

  async getStats() : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [movementsTotal] = await db.select({ count: sql<number>`count(*)::int` })
        .from(posMovements).where(isNull(posMovements.deletedAt));
      const [passportsTotal] = await db.select({ count: sql<number>`count(*)::int` })
        .from(inventoryPassports).where(eq(inventoryPassports.isActive, true));
      const [movementTypesCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(posMovementTypes).where(eq(posMovementTypes.isActive, true));
      const statusCounts = await db.select({ status: posMovements.status, count: sql<number>`count(*)::int` })
        .from(posMovements)
        .where(isNull(posMovements.deletedAt))
        .groupBy(posMovements.status);
      return {
        movements: movementsTotal?.count ?? 0,
        passports: passportsTotal?.count ?? 0,
        movementTypes: movementTypesCount?.count ?? 0,
        byStatus: statusCounts,
      };
      }, 'DB_ERROR');
  }
}
