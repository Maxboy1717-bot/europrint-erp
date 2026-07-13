/**
 * @module qc.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { QcDispatchConclusionsController } from './presentation/qc-dispatch-conclusions.controller';
import { QcDispatchConclusionService } from './application/qc-dispatch-conclusion.service';
import { QcDispatchConclusionRepository } from './infrastructure/repositories/qc-dispatch-conclusion.repository';
import { QcFirstArticleController } from './presentation/qc-first-article.controller';
import { QcFirstArticleService } from './application/qc-first-article.service';
import { QcFirstArticleRepository } from './infrastructure/repositories/qc-first-article.repository';
import { DrizzleService } from '@common/services/drizzle.service';
import { DrizzleQcSupplierRegimeRepository } from './infrastructure/repositories/drizzle-qc-supplier-regime.repo';
import { QcSupplierRegimeService } from './application/qc-supplier-regime.service';
import { QcSupplierRegimeController } from './presentation/qc-supplier-regime.controller';
import { QcNormVersionsRepository } from './infrastructure/repositories/qc-norm-versions.repository';
import { QcNormVersionsController } from './presentation/qc-norm-versions.controller';
import { ReferenceSampleController } from './presentation/reference-sample.controller';
import { ReferenceSampleRepository } from './infrastructure/repositories/reference-sample.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { QcOverrideController } from './presentation/qc-override.controller';
import { QcOverrideService } from './application/qc-override.service';
import { QcOverrideRepository } from './infrastructure/repositories/qc-override.repository';
import { SubmitInspectionHandler } from './application/commands/submit-inspection.handler';
import { ReportDefectHandler } from './application/commands/report-defect.handler';
import { ResolveDefectHandler } from './application/commands/resolve-defect.handler';
import { RecategorizeDefectHandler } from './application/commands/recategorize-defect.handler';
import { SetWasteCategoryHandler } from './application/commands/set-waste-category.handler';
import { SetFaultAttributionHandler } from './application/commands/set-fault-attribution.handler';
import { CreateReclamationHandler } from './application/commands/create-reclamation.handler';
import { ResolveReclamationHandler } from './application/commands/resolve-reclamation.handler';
import { CreateInspectionHandler } from './application/commands/create-inspection.handler';
import { GetInspectionsHandler } from './application/queries/get-inspections.handler';
import { GetInspectionStatsHandler } from './application/queries/get-inspection-stats.handler';
import { GetDefectsHandler } from './application/queries/get-defects.handler';
import { GetDefectStatsHandler } from './application/queries/get-defect-stats.handler';
import { GetWasteCategoryStatsHandler } from './application/queries/get-waste-category-stats.handler';
import { GetDefectByIdHandler } from './application/queries/get-defect-by-id.handler';
import { GetReclamationsHandler } from './application/queries/get-reclamations.handler';
import { GetReclamationByIdHandler } from './application/queries/get-reclamation-by-id.handler';
import { MesCompletedListener } from './infrastructure/event-handlers/mes-completed.listener';
import { SoSampleRequestedListener } from './infrastructure/event-handlers/so-sample-requested.listener';
import { QcPassedCertificateListener } from './infrastructure/event-handlers/qc-passed-certificate.listener';
import { QcInspectionFailedCcListener } from './infrastructure/event-handlers/qc-inspection-failed-cc.listener';
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
import { QcDefectsExtendedRepository } from './infrastructure/repositories/qc-defects-extended.repository';
import { QC_DEFECTS_EXTENDED_REPO } from './domain/repositories/i-qc-defects-extended.repo';
import { QcExtendedService } from './application/qc-extended.service';
import { QcExtendedRepository } from './infrastructure/repositories/qc-extended.repository';
import { QcExtendedStandardsRepository } from './infrastructure/repositories/qc-extended-standards.repository';
import { QcExtendedFinalRepository } from './infrastructure/repositories/qc-extended-final.repository';
import { QcExtendedInProcessRepository } from './infrastructure/repositories/qc-extended-in-process.repository';
import { QcExtendedRootCausesRepository } from './infrastructure/repositories/qc-extended-root-causes.repository';
import { QC_EXTENDED_REPO } from './domain/repositories/i-qc-extended.repo';
import { QcNewService } from './application/qc-new.service';
import { QcCertificatePdfService } from './application/qc-certificate-pdf.service';
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
import { QcAqlService } from './domain/services/qc-aql.service';
import { GradePricingService } from './domain/services/grade-pricing.service';
import { InstrumentCalibrationController } from './presentation/instrument-calibration.controller';
import { InstrumentCalibrationRepository } from './infrastructure/repositories/instrument-calibration.repository';
import { QcBrakSnapshotRepository } from './infrastructure/repositories/qc-brak-snapshot.repository';
import { QcBrakSnapshotService } from './application/qc-brak-snapshot.service';
import { QcBrakSnapshotController } from './presentation/qc-brak-snapshot.controller';
import { QcMaterialScanController } from './presentation/qc-material-scan.controller';
import { QcMaterialScanService } from './application/qc-material-scan.service';
import { QcMaterialScanRepository } from './infrastructure/repositories/qc-material-scan.repository';

const commandHandlers = [
  SubmitInspectionHandler,
  ReportDefectHandler,
  ResolveDefectHandler,
  RecategorizeDefectHandler,
  SetWasteCategoryHandler,
  SetFaultAttributionHandler,
  CreateReclamationHandler,
  ResolveReclamationHandler,
  CreateInspectionHandler,
];

const eventHandlers = [MesCompletedListener, SoSampleRequestedListener, QcPassedCertificateListener, QcInspectionFailedCcListener];

const queryHandlers = [
  GetInspectionsHandler,
  GetInspectionStatsHandler,
  GetDefectsHandler,
  GetDefectStatsHandler,
  GetWasteCategoryStatsHandler,
  GetDefectByIdHandler,
  GetReclamationsHandler,
  GetReclamationByIdHandler,
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
    QcFirstArticleController,
    QcDispatchConclusionsController,
    QcSupplierRegimeController,
    QcOverrideController,
    QcNormVersionsController,
    ReferenceSampleController,
    QcInspectionsController,
    QcDefectsController,
    QcExtendedController,
    QcDefectsExtendedController,
    QcReclamationsController,
    QcNewController,
    QcParametersController,
    PrintController,
    QcDpmoController,
    InstrumentCalibrationController,
    QcBrakSnapshotController,
    QcMaterialScanController,
  ],
  providers: [
    QcFirstArticleRepository,
    QcFirstArticleService,
    QcDispatchConclusionRepository,
    QcDispatchConclusionService,
    DrizzleService,
    DrizzleQcSupplierRegimeRepository,
    QcSupplierRegimeService,
    QcOverrideService,
    QcOverrideRepository,
    QcNormVersionsRepository,
    ReferenceSampleRepository,
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
    { provide: QC_DEFECTS_EXTENDED_REPO, useClass: QcDefectsExtendedRepository },
    QcDefectsExtendedService,
    QcExtendedStandardsRepository,
    QcExtendedFinalRepository,
    QcExtendedInProcessRepository,
    QcExtendedRootCausesRepository,
    QcExtendedRepository,
    { provide: QC_EXTENDED_REPO, useClass: QcExtendedRepository },
    QcExtendedService,
    QcNewService,
    QcCertificatePdfService,
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
    QcAqlService,
    GradePricingService,
    InstrumentCalibrationRepository,
    QcBrakSnapshotRepository,
    QcBrakSnapshotService,
    QcMaterialScanRepository,
    QcMaterialScanService,
  ],
  exports: [
    QcFirstArticleService,
    QcFirstArticleRepository,
    QC_DEFECT_REPO, QC_REPOSITORY_PROVIDER, DEFECTS_REPO, DefectsService,
    DefectDetectorService, SpcService, FmeaService,
    InkConsumptionService, ImpositionService, SpoilageService, DeltaEService,
    DpmoService,
    QcAqlService,
    GradePricingService,
  ],
})
export class QcModule {}
