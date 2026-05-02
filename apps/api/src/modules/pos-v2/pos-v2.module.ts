import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DrizzlePosV2Repo } from './infrastructure/repositories/drizzle-pos-v2.repo';
import { DrizzlePosV2RequestRepo } from './infrastructure/repositories/drizzle-pos-v2-request.repo';
import { DrizzlePosV2ReportRepo } from './infrastructure/repositories/drizzle-pos-v2-report.repo';
import { POS_V2_REPO } from './domain/repositories/i-pos-v2.repo';

// Commands
import { StartInventoryCountHandler } from './application/commands/start-inventory-count.command';
import { UpdateCountLineHandler } from './application/commands/update-count-line.command';
import { CompleteCountHandler } from './application/commands/complete-count.command';
import { ApproveCountHandler } from './application/commands/approve-count.command';
import { CreateTransferRequestHandler } from './application/commands/create-transfer-request.command';
import { UpdateTransferStatusHandler } from './application/commands/update-transfer-status.command';

// Queries
import { GetCountsHandler } from './application/queries/get-counts.query';
import { GetRequestsHandler } from './application/queries/get-requests.query';
import { GetBarcodeHandler } from './application/queries/get-barcode.query';
import {
  GetMovementReportHandler,
  GetEmployeeActivityHandler,
  GetLowStockHandler,
} from './application/queries/get-movement-report.query';

// Controllers
import { InventoryCountController } from './presentation/inventory-count.controller';
import { RequestsController } from './presentation/requests.controller';
import { BarcodeController } from './presentation/barcode.controller';
import { ReportsController } from './presentation/reports.controller';

const CommandHandlers = [
  StartInventoryCountHandler,
  UpdateCountLineHandler,
  CompleteCountHandler,
  ApproveCountHandler,
  CreateTransferRequestHandler,
  UpdateTransferStatusHandler,
];

const QueryHandlers = [
  GetCountsHandler,
  GetRequestsHandler,
  GetBarcodeHandler,
  GetMovementReportHandler,
  GetEmployeeActivityHandler,
  GetLowStockHandler,
];

const Controllers = [
  InventoryCountController,
  RequestsController,
  BarcodeController,
  ReportsController,
];

@Module({
  imports: [CqrsModule],
  providers: [
    DrizzlePosV2RequestRepo,
    DrizzlePosV2ReportRepo,
    { provide: POS_V2_REPO, useClass: DrizzlePosV2Repo },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  controllers: Controllers,
  exports: [POS_V2_REPO],
})
export class PosV2Module {}
