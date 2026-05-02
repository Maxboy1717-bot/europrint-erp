import { Module } from '@nestjs/common';
import { ErpProductsController } from './erp-products.controller';
import { ErpOrdersController } from './erp-orders.controller';
import { ErpCameraController } from './erp-camera.controller';
import { ErpReportsController } from './erp-reports.controller';
import { ErpService } from './erp.service';
import { ErpRepository } from './erp.repository';
import { ErpExtraService } from './erp-extra.service';
import { ErpExtraRepository } from './erp-extra.repository';
import { ErpCameraService } from './erp-camera.service';
import { ErpCameraRepository } from './erp-camera.repository';
import { ErpReportsService } from './erp-reports.service';
import { ErpReportsRepository } from './erp-reports.repository';

@Module({
  controllers: [
    ErpProductsController,
    ErpOrdersController,
    ErpCameraController,
    ErpReportsController,
  ],
  providers: [ErpRepository, ErpService, ErpExtraRepository, ErpExtraService, ErpCameraRepository, ErpCameraService, ErpReportsRepository, ErpReportsService],
  exports: [ErpService, ErpExtraService, ErpCameraService, ErpReportsService],
})
export class ErpModule {}
