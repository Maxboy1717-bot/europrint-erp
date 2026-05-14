/**
 * @module get-movement-report.query
 * @description Source module. See exports for details.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result, Ok as ok, Err as err, isErr, Err } from '@common/result';
import { IPosV2Repo, MovementSummary, EmployeeActivity, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export class GetMovementReportQuery {
  constructor(public readonly warehouseId: string,
    public readonly from: Date,
    public readonly to: Date) {}
}

@QueryHandler(GetMovementReportQuery)
@Injectable()
export class GetMovementReportHandler implements IQueryHandler<GetMovementReportQuery> {
  private readonly logger = new Logger(GetMovementReportHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(query: GetMovementReportQuery): Promise<Result<MovementSummary>> {
    try {
      if (query.from >= query.to) {
        return err({
          message: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE',
        });
      }

      const result = await this.repo.getMovementReport(query.warehouseId, query.from, query.to);

      if (isErr(result)) {
        this.logger.error('Failed to get movement report', result.error);
        return err(result.error);
      }

      this.logger.log(
        `Movement report generated for warehouse ${query.warehouseId} from ${query.from} to ${query.to}`,
      );

      return ok(result.data);
    } catch (error: unknown) {
      this.logger.error('Failed to get movement report:', error);
      return err({
        message: 'Failed to get movement report',
        code: 'MOVEMENT_REPORT_ERROR',
      });
    }
  }
}

export class GetEmployeeActivityQuery {
  constructor(
    public readonly userId: string,
    public readonly from: Date,
    public readonly to: Date,
  ) {}
}

@QueryHandler(GetEmployeeActivityQuery)
@Injectable()
export class GetEmployeeActivityHandler implements IQueryHandler<GetEmployeeActivityQuery> {
  private readonly logger = new Logger(GetEmployeeActivityHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(query: GetEmployeeActivityQuery): Promise<Result<EmployeeActivity>> {
    try {
      if (query.from >= query.to) {
        return err({
          message: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE',
        });
      }

      const result = await this.repo.getEmployeeActivity(query.userId, query.from, query.to);

      if (isErr(result)) {
        this.logger.error('Failed to get employee activity', result.error);
        return err(result.error);
      }

      this.logger.log(`Employee activity retrieved for user ${query.userId}`);

      return ok(result.data);
    } catch (error: unknown) {
      this.logger.error('Failed to get employee activity:', error);
      return err({
        message: 'Failed to get employee activity',
        code: 'EMPLOYEE_ACTIVITY_ERROR',
      });
    }
  }
}

export class GetLowStockQuery {
  constructor(public readonly warehouseId?: string) {}
}

@QueryHandler(GetLowStockQuery)
@Injectable()
export class GetLowStockHandler implements IQueryHandler<GetLowStockQuery> {
  private readonly logger = new Logger(GetLowStockHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(
    query: GetLowStockQuery,
  ): Promise<
    Result<Array<{ stockItemId: string; name: string; sku: string; currentQty: number; minQty: number; location: string | null }>>
  > {
    try {
      const result = await this.repo.getLowStockReport(query.warehouseId);

      if (isErr(result)) {
        this.logger.error('Failed to get low stock report', result.error);
        return err(result.error);
      }

      this.logger.log(
        `Low stock report retrieved for warehouse ${query.warehouseId || 'all'}`,
      );

      return ok(result.data);
    } catch (error: unknown) {
      this.logger.error('Failed to get low stock report:', error);
      return err({
        message: 'Failed to get low stock report',
        code: 'LOW_STOCK_ERROR',
      });
    }
  }
}
