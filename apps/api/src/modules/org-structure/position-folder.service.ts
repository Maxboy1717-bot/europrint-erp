/**
 * @module position-folder.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { PositionFolderRepository } from './position-folder.repository';

@Injectable()
export class PositionFolderService {
  constructor(private readonly repo: PositionFolderRepository) {}

  async getFolderItems(nodeId: number): Promise<Result<object, AppError>> {
    const r = await safeCall(() => this.repo.getFolderItems(nodeId));
    if (!r.ok) await safeCall(() => this.repo.ensureTable());
    return r;
  }

  async addFolderItem(nodeId: number, dto: {
    itemType: 'document' | 'video' | 'test';
    title: string;
    url?: string;
    description?: string;
    lmsCourseId?: number;
  }): Promise<Result<object, AppError>> {
    try {
      const row = await this.repo.addFolderItem(nodeId, dto);
      return Ok(row);
    } catch {
      await this.repo.ensureTable();
      return this.repo.addFolderItem(nodeId, dto);
    }
  }

  async removeFolderItem(itemId: number) {
    return safeCall(async () => {
      await this.repo.removeFolderItem(itemId);
      return { message: 'O\'chirildi' };
    });
  }

  async getEmployeeFolderItems(employeeId: number): Promise<Result<object, AppError>> {
    const r = await safeCall(() => this.repo.getEmployeeFolderItems(employeeId));
    if (!r.ok) await safeCall(() => this.repo.ensureTable());
    return r;
  }
}
