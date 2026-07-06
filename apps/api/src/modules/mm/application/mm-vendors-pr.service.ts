/**
 * @module mm-vendors-pr.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { safeCall, Result, AppError } from '@common/result';
import { MM_VENDORS_PR_REPO, type IMmVendorsPrRepo } from '../domain/repositories/i-mm-vendors-pr.repo';

@Injectable()
export class MmVendorsPrService {
  constructor(
    @Inject(MM_VENDORS_PR_REPO) private readonly repo: IMmVendorsPrRepo,
    private readonly i18n: I18nService,
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
}
