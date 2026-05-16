/**
 * @module qc.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SubmitInspectionHandler } from './application/commands/submit-inspection.handler';
import { ReportDefectHandler } from './application/commands/report-defect.handler';
import { ResolveDefectHandler } from './application/commands/resolve-defect.handler';
import { CreateReclamationHandler } from './application/commands/create-reclamation.handler';
import { GetInspectionsHandler } from './application/queries/get-inspections.handler';
import { GetInspectionStatsHandler } from './application/queries/get-inspection-stats.handler';
import { GetDefectsHandler } from './application/queries/get-defects.handler';
import { GetReclamationsHandler } from './application/queries/get-reclamations.handler';
import { MesCompletedListener } from './infrastructure/event-handlers/mes-completed.listener';
import { SoSampleRequestedListener } from './infrastructure/event-handlers/so-sample-requested.listener';
import { QcInspectionsController } from './presentation/qc-inspections.controller';
import { QcDefectsController } from './presentation/qc-defects.controller';
import { QcReclamationsController } from './presentation/qc-reclamations.controller';
import { QcExtendedController } from './presentation/qc-extended.controller';
import { QcDefectsExtendedController } from './presentation/qc-defects-extended.controller';
import { QcNewController } from './presentation/qc-new.controller';
import { QcParametersController } from './presentation/qc-parameters.controller';
import { QC_REPOSITORY_PROVIDER } from './application/repositories/qc.repository';
import { QC_COMPUTE_REPO } from './domain/repositories/i-qc.repo';
import { QC_DEFECT_REPO } from './infrastructure/repositories/drizzle-defect.repo';
import { DrizzleDefectRepository } from './infrastructure/repositories/drizzle-defect.repo';
import { DrizzleQcReclamationRepo } from './infrastructure/repositories/drizzle-qc-reclamation.repo';
import { DrizzleQcInspectionRepository } from './infrastructure/repositories/drizzle-inspection.repo';
import { DrizzleQcComputeRepository } from './infrastructure/repositories/drizzle-qc.repo';
import { DefectsService } from './defects/defects.service';
import { DrizzleDefectsRepository } from './defects/drizzle-defects.repo';
import { DEFECTS_REPO } from './defects/i-defects.repo';
import { QcDefectsExtendedService } from './application/qc-defects-extended.service';
import { QcDefectsExtendedRepository } from './application/qc-defects-extended.repository';
import { QcExtendedService } from './application/qc-extended.service';
import { QcExtendedRepository } from './application/qc-extended.repository';
import { QcNewService } from './application/qc-new.service';
import { QcParametersService } from './application/qc-parameters.service';
import { QcNewRepository } from './infrastructure/repositories/qc-new.repository';
import { QcParametersRepository } from './infrastructure/repositories/qc-parameters.repository';
import { AuthModule } from '../auth/auth.module';
import { DefectDetectorService } from './domain/services/defect-detector.service';
import { SpcService } from './domain/services/spc.service';
import { FmeaService } from './domain/services/fmea.service';
import { InkConsumptionService } from './domain/services/ink-consumption.service';
import { ImpositionService } from './domain/services/imposition.service';
import { SpoilageService } from './domain/services/spoilage.service';
import { DeltaEService } from './domain/services/delta-e.service';
import { PrintController } from './presentation/print.controller';
import { QcDpmoController } from './presentation/qc-dpmo.controller';
import { DpmoService } from './domain/services/dpmo.service';

const commandHandlers = [
  SubmitInspectionHandler,
  ReportDefectHandler,
  ResolveDefectHandler,
  CreateReclamationHandler,
];

const eventHandlers = [MesCompletedListener, SoSampleRequestedListener];

const queryHandlers = [
  GetInspectionsHandler,
  GetInspectionStatsHandler,
  GetDefectsHandler,
  GetReclamationsHandler,
];

const repositories = [
  DrizzleQcReclamationRepo,
  {
    provide: QC_DEFECT_REPO,
    useClass: DrizzleDefectRepository,
  },
  { provide: DEFECTS_REPO, useClass: DrizzleDefectsRepository },
  { provide: QC_COMPUTE_REPO, useClass: DrizzleQcComputeRepository },
  QcNewRepository,
  QcParametersRepository,
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot(), AuthModule],
  controllers: [
    QcInspectionsController,
    QcDefectsController,
    QcExtendedController,
    QcDefectsExtendedController,
    QcReclamationsController,
    QcNewController,
    QcParametersController,
    PrintController,
    QcDpmoController,
  ],
  providers: [
    ...commandHandlers,
    ...eventHandlers,
    ...queryHandlers,
    ...repositories,
    {
      provide: QC_REPOSITORY_PROVIDER,
      useClass: DrizzleQcInspectionRepository,
    },
    DefectsService,
    QcDefectsExtendedRepository,
    QcDefectsExtendedService,
    QcExtendedRepository,
    QcExtendedService,
    QcNewService,
    QcParametersService,
    // TZ-D11/30/31/32/33/34/35/36/37/38
    DefectDetectorService,
    SpcService,
    FmeaService,
    InkConsumptionService,
    ImpositionService,
    SpoilageService,
    DeltaEService,
    DpmoService,
  ],
  exports: [
    QC_DEFECT_REPO, QC_REPOSITORY_PROVIDER, DEFECTS_REPO, DefectsService,
    DefectDetectorService, SpcService, FmeaService,
    InkConsumptionService, ImpositionService, SpoilageService, DeltaEService,
    DpmoService,
  ],
})
export class QcModule {}
