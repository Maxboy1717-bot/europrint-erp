import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { createId } from '@paralleldrive/cuid2';
import { Result, Ok as ok, Err as err, isErr, Err } from '@common/result';
import { TransferRequest, RequestStatus, RequestLine } from '../../domain/aggregates/transfer-request.aggregate';
import { IPosV2Repo, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export interface TransferLineInput {
  stockItemId: string;
  itemName: string;
  sku: string;
  requestedQty: number;
  unit: string;
}

export class CreateTransferRequestCommand {
  constructor(public readonly fromWarehouseId: string,
    public readonly toWarehouseId: string,
    public readonly reason: string,
    public readonly lines: TransferLineInput[],
    public readonly userId: string) {}
}

@CommandHandler(CreateTransferRequestCommand)
@Injectable()
export class CreateTransferRequestHandler implements ICommandHandler<CreateTransferRequestCommand> {
  private readonly logger = new Logger(CreateTransferRequestHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(command: CreateTransferRequestCommand): Promise<Result<TransferRequest>> {
    try {
      // Validate warehouses are different
      if (command.fromWarehouseId === command.toWarehouseId) {
        return err({
          message: 'Source and destination warehouses must be different',
          code: 'SAME_WAREHOUSE',
        });
      }

      // Validate reason length
      if (command.reason.length < 5) {
        return err({
          message: 'Reason must be at least 5 characters',
          code: 'INVALID_REASON',
        });
      }

      // Validate lines
      if (command.lines.length === 0) {
        return err({
          message: 'At least one line is required',
          code: 'NO_LINES',
        });
      }

      for (const line of command.lines) {
        if (line.requestedQty <= 0) {
          return err({
            message: 'All quantities must be positive',
            code: 'INVALID_QUANTITY',
          });
        }
      }

      // Generate request number
      const now = _time.now();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const requestNumber = `TR-${dateStr}-${createId().substring(0, 6).toUpperCase()}`;

      // Create request lines
      const requestId = createId();
      const requestLines: RequestLine[] = (command?.lines ?? []).map((line) => ({
        id: createId(),
        requestId,
        stockItemId: line.stockItemId,
        itemName: line.itemName,
        sku: line.sku,
        requestedQty: line.requestedQty,
        approvedQty: null as number | null,
        unit: line.unit,
      }));

      // Create transfer request
      const request = new TransferRequest(
        requestId,
        requestNumber,
        command.fromWarehouseId,
        command.toWarehouseId,
        RequestStatus.PENDING,
        requestLines,
        command.userId,
        null,
        null,
        command.reason,
        _time.now(),
        _time.now(),
      );

      // Save to database
      const result = await this.repo.saveRequest(request, requestLines);

      if (isErr(result)) {
        this.logger.error('Failed to save transfer request', result.error);
        return err(result.error);
      }

      this.logger.log(
        `Transfer request ${request.requestNumber} created by user ${command.userId}`,
      );

      return ok(request);
    } catch (error: unknown) {
      this.logger.error('Failed to create transfer request:', error);
      return err({
        message: 'Failed to create transfer request',
        code: 'CREATE_REQUEST_ERROR',
      });
    }
  }
}
