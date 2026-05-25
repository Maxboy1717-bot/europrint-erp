/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export { PosV2Module } from './pos-v2.module';

// Aggregates
export { InventoryCount, CountStatus, CountLine } from './domain/aggregates/inventory-count.aggregate';
export { TransferRequest, RequestStatus, RequestLine } from './domain/aggregates/transfer-request.aggregate';

// Repository
export { IPosV2Repo, POS_V2_REPO } from './domain/repositories/i-pos-v2.repo';

// Commands
export { StartInventoryCountCommand } from './application/commands/start-inventory-count.command';
export { UpdateCountLineCommand } from './application/commands/update-count-line.command';
export { CompleteCountCommand } from './application/commands/complete-count.command';
export { ApproveCountCommand } from './application/commands/approve-count.command';
export { CreateTransferRequestCommand, TransferLineInput } from './application/commands/create-transfer-request.command';
export { UpdateTransferStatusCommand } from './application/commands/update-transfer-status.command';

// Queries
export { GetCountsQuery } from './application/queries/get-counts.query';
export { GetRequestsQuery } from './application/queries/get-requests.query';
export { GetBarcodeQuery } from './application/queries/get-barcode.query';
export {
  GetMovementReportQuery,
  GetEmployeeActivityQuery,
  GetPosV2LowStockQuery,
} from './application/queries/get-movement-report.query';

// DTOs
export {
  StartCountDto,
  UpdateCountLineDto,
  CreateTransferRequestDto,
  GetCountsDto,
  GetRequestsDto,
  BarcodeDto,
  MovementReportDto,
  EmployeeActivityReportDto,
  LowStockReportDto,
} from './presentation/dto/pos-v2.dto';
