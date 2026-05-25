/**
 * @module pos-printer-config.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { PosPrinterConfigRepository } from '../../infrastructure/repositories/pos-printer-config.repository';

@Injectable()
export class PosPrinterConfigService {
  constructor(private readonly repo: PosPrinterConfigRepository) {}

  async getAll(): Promise<Result<object, AppError>> {
    return this.repo.getAll();
  }

  async create(body: { name?: string; printerIp: string; printerPort?: number; printFormat?: string; notes?: string }) {
    return this.repo.create(body);
  }

  async update(id: number, body: { name?: string; printerIp?: string; printerPort?: number; printFormat?: string; isActive?: boolean; notes?: string }) {
    return this.repo.update(id, body);
  }

  async getForTest(id: number) {
    return this.repo.getForTest(id);
  }
}
