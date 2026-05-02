import { Injectable, Logger, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result, Ok as ok, Err as err, isErr, Err } from '@common/result';
import { IPosV2Repo, StockItemBarcode, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export class GetBarcodeQuery {
  constructor(public readonly barcode: string) {}
}

@QueryHandler(GetBarcodeQuery)
@Injectable()
export class GetBarcodeHandler implements IQueryHandler<GetBarcodeQuery> {
  private readonly logger = new Logger(GetBarcodeHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(query: GetBarcodeQuery): Promise<Result<StockItemBarcode | null>> {
    try {
      if (query.barcode.length < 2) {
        return err({
          message: 'Barcode must be at least 2 characters',
          code: 'INVALID_BARCODE',
        });
      }

      const result = await this.repo.findByBarcode(query.barcode);

      if (isErr(result)) {
        this.logger.error('Failed to lookup barcode', result.error);
        return err(result.error);
      }

      if (!result.data) {
        this.logger.debug(`Barcode ${query.barcode} not found`);
        return ok(null);
      }

      this.logger.log(`Barcode ${query.barcode} looked up successfully`);

      return ok(result.data);
    } catch (error: unknown) {
      this.logger.error('Failed to lookup barcode:', error);
      return err({
        message: 'Failed to lookup barcode',
        code: 'BARCODE_LOOKUP_ERROR',
      });
    }
  }
}
