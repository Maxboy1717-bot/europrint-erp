/**
 * @module wms-crud.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { WMS_CRUD_REPO, type IWmsCrudRepo } from '../domain/repositories/i-wms-crud.repo';

type Row = Record<string, unknown>;

@Injectable()
export class WmsCrudService {
  constructor(@Inject(WMS_CRUD_REPO) private readonly repo: IWmsCrudRepo) {}

  softDeleteTransaction(id: number, userId: number | null): Promise<Result<Row>> {
    return this.repo.softDeleteTransaction(id, userId);
  }
  patchTransaction(id: number, body: Row): Promise<Result<Row>> {
    return this.repo.patchTransaction(id, body);
  }
  softDeleteGoodsIssue(id: number, userId: number | null): Promise<Result<Row>> {
    return this.repo.softDeleteGoodsIssue(id, userId);
  }
  patchGoodsIssue(id: number, body: Row): Promise<Result<Row>> {
    return this.repo.patchGoodsIssue(id, body);
  }
  softDeleteInventory(id: number, userId: number | null): Promise<Result<Row>> {
    return this.repo.softDeleteInventory(id, userId);
  }
  patchInventory(id: number, body: Row): Promise<Result<Row>> {
    return this.repo.patchInventory(id, body);
  }
  softDeleteRentalRecord(id: number, userId: number | null): Promise<Result<Row>> {
    return this.repo.softDeleteRentalRecord(id, userId);
  }
  patchRentalRecord(id: number, body: Row): Promise<Result<Row>> {
    return this.repo.patchRentalRecord(id, body);
  }
  softDeleteStock(id: number, userId: number | null): Promise<Result<Row>> {
    return this.repo.softDeleteStock(id, userId);
  }
  patchStock(id: number, body: Row): Promise<Result<Row>> {
    return this.repo.patchStock(id, body);
  }
  softDeleteInventoryCount(id: number, userId: number | null): Promise<Result<Row>> {
    return this.repo.softDeleteInventoryCount(id, userId);
  }
  softDeleteWarehouse(id: string | number, userId: number | null): Promise<Result<Row>> {
    return this.repo.softDeleteWarehouse(id, userId);
  }

  getStockById(id: number): Promise<Result<Row | null>> {
    return this.repo.getStockById(id);
  }

  listGoodsIssues(limit: number, offset: number): Promise<Result<Row[]>> {
    return this.repo.listGoodsIssues(limit, offset);
  }
  getGoodsIssueById(id: number): Promise<Result<Row>> {
    return this.repo.getGoodsIssueById(id);
  }
}
