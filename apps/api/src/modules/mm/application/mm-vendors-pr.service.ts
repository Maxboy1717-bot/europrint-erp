/**
 * @module mm-vendors-pr.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { I18nService } from 'nestjs-i18n';
import { safeCall, Result, AppError, Ok, Err, AppErr } from '@common/result';
import { MM_VENDORS_PR_REPO, type IMmVendorsPrRepo } from '../domain/repositories/i-mm-vendors-pr.repo';
import { CreatePurchaseOrderCommand } from './commands/create-purchase-order.handler';

@Injectable()
export class MmVendorsPrService {
  constructor(
    @Inject(MM_VENDORS_PR_REPO) private readonly repo: IMmVendorsPrRepo,
    private readonly i18n: I18nService,
    private readonly commandBus: CommandBus,
  ) {}

  async listVendors(search: string | undefined, lim: number, off: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const pat = search ? `%${search}%` : null;
      return this.repo.listVendors(pat, lim, off);
    });
  }

  async getVendor(id: number) {
    return this.repo.getVendor(id);
  }

  async createVendor(body: Record<string, unknown>) {
    return this.repo.createVendor(body);
  }

  async updateVendor(id: number, body: Record<string, unknown>) {
    return this.repo.updateVendor(id, body);
  }

  async deleteVendor(id: number) {
    return this.repo.deleteVendor(id);
  }

  async listRequisitions(status: string | undefined, lim: number, off: number) {
    return this.repo.listRequisitions(status, lim, off);
  }

  async getRequisition(rid: number) {
    return safeCall(async () => {
      const header = await this.repo.getRequisitionHeader(rid);
      if (!header) throw new NotFoundException(await this.i18n.t('errors.requisitionNotFoundWithId', { args: { id: rid } }));
      const items = await this.repo.getRequisitionItems(rid);
      return { ...header, items };
    });
  }

  /**
   * Q-46 (2026-07-02): `mm_purchase_requisitions` is a VIEW over the strict
   * `purchase_requisitions` table (NOT NULL material_id/required_quantity/
   * required_date/requisition_number) — the header row needs a real material_id +
   * quantity, so at least one item is now required. This is real validation (Q-40
   * forbids inventing a material_id out of nothing), not a design change: the
   * previous "items optional" path always crashed with 23502 on the header INSERT
   * anyway, so nothing that used to work is being taken away.
   */
  async createRequisition(title: unknown, requested_by: number | null, needed_by: unknown, notes: unknown, items: Array<Record<string, unknown>>) {
    return safeCall(async () => {
      if (!Array.isArray(items) || items.length === 0) {
        throw new BadRequestException(await this.i18n.t('validation.atLeastOneItemRequired'));
      }
      const first = items[0];
      const materialId = Number(first?.material_id);
      const quantity = Number(first?.quantity);
      if (!Number.isFinite(materialId) || materialId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(await this.i18n.t('errors.firstItemMaterialAndQuantityRequired'));
      }

      const req = await this.repo.createRequisition(title, requested_by, needed_by, notes, materialId, quantity);
      if (!req.ok) throw new BadRequestException(String(req.error));

      for (const item of items) {
        await this.repo.createRequisitionItem(req.data.id, item.material_id, item.quantity, item.unit_price);
      }
      return req.data;
    });
  }

  async updateRequisition(rid: number, body: Record<string, unknown>) {
    return this.repo.updateRequisition(rid, body);
  }

  async deleteRequisition(rid: number) {
    return this.repo.deleteRequisition(rid);
  }

  /**
   * #11.13 — Convert an APPROVED requisition into a purchase order and link them.
   * Vision TASDIQ-2146 §11 #13 ("Tasdiqlangan arizadan PO ga avto-ko'chirish").
   * Eligible = status 'approved' AND not yet converted. Items are copied from
   * mm_purchase_requisition_items (aggregated by material — the PO aggregate's
   * addItem() rejects a repeated materialId), with a fallback to the requisition
   * header line when the item table is empty. createdBy is the session user (SoD).
   */
  async convertRequisitionToPo(
    rid: number,
    supplierIdOverride: number | null,
    createdBy: number,
  ): Promise<Result<{ requisitionId: number; purchaseOrderId: number }>> {
    try {
      const headerR = await this.repo.getRequisitionHeader(rid);
      if (!headerR.ok) return Err(AppErr('DB_ERROR', String(headerR.error.message ?? headerR.error)));
      const header = headerR.data;
      if (!header) return Err(AppErr('NOT_FOUND', `Ariza topilmadi: #${rid}`));

      if (String(header.status) !== 'approved') {
        return Err(AppErr('VALIDATION', 'Faqat tasdiqlangan (approved) arizani PO ga aylantirish mumkin'));
      }
      if (header.purchase_order_id != null) {
        return Err(AppErr('CONFLICT', `Ariza allaqachon PO ga aylantirilgan (PO #${header.purchase_order_id})`));
      }

      const supplierId = supplierIdOverride ?? (header.supplier_id != null ? Number(header.supplier_id) : null);
      if (supplierId == null || !Number.isFinite(supplierId) || supplierId <= 0) {
        return Err(AppErr('VALIDATION', "Yetkazib beruvchi aniqlanmadi — supplierId yuboring yoki arizada supplier_id bo'lsin"));
      }

      const itemsR = await this.repo.getRequisitionItems(rid);
      if (!itemsR.ok) return Err(AppErr('DB_ERROR', String(itemsR.error.message ?? itemsR.error)));
      const rawItems = Array.isArray(itemsR.data) ? (itemsR.data as Array<Record<string, unknown>>) : [];

      // Aggregate by materialId — PurchaseOrder.addItem() forbids a repeated material.
      const byMaterial = new Map<number, { materialId: number; quantity: number; unitPrice: number }>();
      for (const it of rawItems) {
        const materialId = Number(it.material_id);
        const quantity = Number(it.quantity);
        if (!Number.isFinite(materialId) || materialId <= 0 || !Number.isFinite(quantity) || quantity <= 0) continue;
        const unitPrice = Number(it.unit_price);
        const line = byMaterial.get(materialId) ?? { materialId, quantity: 0, unitPrice: 0 };
        line.quantity += quantity;
        if (Number.isFinite(unitPrice) && unitPrice > 0) line.unitPrice = unitPrice;
        byMaterial.set(materialId, line);
      }
      let items = Array.from(byMaterial.values());

      // Fallback: no item rows -> use the requisition header's single material line.
      if (items.length === 0) {
        const materialId = Number(header.material_id);
        const quantity = Number(header.required_quantity);
        if (!Number.isFinite(materialId) || materialId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
          return Err(AppErr('VALIDATION', "Arizada kamida bitta material bo'lishi kerak"));
        }
        const est = Number(header.estimated_cost);
        const unitPrice = Number.isFinite(est) && est > 0 && quantity > 0 ? est / quantity : 0;
        items = [{ materialId, quantity, unitPrice }];
      }

      const poRes: Result<number> = await this.commandBus.execute(
        new CreatePurchaseOrderCommand(supplierId, items, createdBy),
      );
      if (!poRes.ok) return Err(AppErr('INTERNAL', String(poRes.error.message ?? poRes.error)));
      const purchaseOrderId = poRes.data;

      const writeR = await this.repo.setRequisitionPurchaseOrderId(rid, purchaseOrderId);
      if (!writeR.ok) return Err(AppErr('DB_ERROR', String(writeR.error.message ?? writeR.error)));

      return Ok({ requisitionId: rid, purchaseOrderId });
    } catch (e) {
      return Err(AppErr('INTERNAL', e instanceof Error ? e.message : String(e)));
    }
  }
}
