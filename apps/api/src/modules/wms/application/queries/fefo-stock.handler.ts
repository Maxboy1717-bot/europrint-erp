import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { Stock } from '../../domain/aggregates/stock.aggregate';
import { IWmsRepository } from '../../domain/repositories/wms.repository';

export class FefoStockQuery {
  constructor(public materialId: number, public warehouseId: number) {}
}

@QueryHandler(FefoStockQuery)
export class FefoStockHandler implements IQueryHandler<FefoStockQuery> {
  private readonly logger = new Logger(FefoStockHandler.name);
  constructor(
    @Inject('IWmsRepository') private wmsRepo: IWmsRepository
  ) {}

  async execute(query: FefoStockQuery): Promise<Result<Stock[]>> {
    this.logger.log(
      { materialId: query.materialId, warehouseId: query.warehouseId },
      'Getting FEFO stock',
    );

    // §8.5 FEFO/FIFO: ORDER BY expiry_date ASC NULLS LAST, received_at ASC
    return this.wmsRepo.getFefoStock(query.materialId, query.warehouseId);
  }
}
