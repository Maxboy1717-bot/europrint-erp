import { Injectable, NotFoundException } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MmVendorsPrRepository } from './mm-vendors-pr.repository';

@Injectable()
export class MmVendorsPrService {
  constructor(private readonly repo: MmVendorsPrRepository) {}

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
      if (!header) throw new NotFoundException(`Requisitsiya #${rid} topilmadi`);
      const items = await this.repo.getRequisitionItems(rid);
      return { ...header, items };
    });
  }

  async createRequisition(title: unknown, requested_by: number | null, needed_by: unknown, notes: unknown, items: Array<Record<string, unknown>>) {
    return safeCall(async () => {
      const req = await this.repo.createRequisition(title, requested_by, needed_by, notes);
      if (!req.ok) throw new Error(req.error.message);
      for (const item of items) {
        await this.repo.createRequisitionItem(req.data.id, item.material_id, item.quantity, item.unit_price);
      }
      return req;
    });
  }

  async updateRequisition(rid: number, body: Record<string, unknown>) {
    return this.repo.updateRequisition(rid, body);
  }

  async deleteRequisition(rid: number) {
    return this.repo.deleteRequisition(rid);
  }
}
