/**
 * @module compatibility.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';

import { EmployeesCompatController } from './employees-compat.controller';
import { EmployeesCompatSubController } from './employees-compat-sub.controller';
import { EmployeesExtraController }  from './employees-extra.controller';
import { UsersCompatController } from './users-compat.controller';
import { BarcodeWarehouseCompatController } from './barcode-warehouse.controller';
import { BarcodeWarehouseDebtService } from './barcode-warehouse-debt.service';
import { CfoCompatController } from './cfo.controller';
import { EuroprintControlCompatController } from './europrint-control.controller';
import { EuroprintControlDirectorController } from './europrint-control-director.controller';
import { CrmExtendedCompatController, MarketingExtendedCompatController } from './crm-extended.controller';
import {
  WarehousesCompatController, MaterialCardsCompatController,
  OrgDepartmentsCompatController,
  OrgFunctionsCompatController,
} from './resources.controller';
import { CoreDepartmentsCompatController } from './core-departments-compat.controller';
import { WarehouseCatalogController }    from './warehouse-catalog.controller';
import { WarehouseBarcodeOpsController } from './warehouse-barcode-ops.controller';
import { WarehouseLabelController }      from './warehouse-label.controller';
import { SuccessionCompatController }    from './succession-compat.controller';
import { MentorshipsCompatController }   from './mentorships-compat.controller';
import { CandidatesCompatController }    from './candidates-compat.controller';
import {
  EmployeeKpiCompatController,
  EmployeeZoneHistoryCompatController,
  DailyAttendanceCompatController,
} from './employee-kpi-compat.controller';
import { DisciplineRecordsCompatController } from './discipline-records-compat.controller';
import { HrMapCompatController }         from './hr-map-compat.controller';
import { GoalsCompatController }         from './goals-compat.controller';
import { EmployeeFilesCompatController } from './employee-files-compat.controller';
import { SaasController, OrdersRegistryCompatController } from './saas.controller';
import { TelegramAdminController }       from './telegram-admin.controller';
import { SettingsAdminController }       from './settings-admin.controller';
import { ApprovalWorkflowController }    from './approval-workflow.controller';
import { CalendarEventsController }      from './calendar-events.controller';
import { AssetManagementController }     from './asset-management.controller';
import { DocumentWorkflowV2Controller }  from './document-workflow-v2.controller';
import { DocumentWorkflowV2Service }     from './document-workflow-v2.service';
import { PosWarehouseIntegrationController } from './pos-warehouse-integration.controller';
import { PosWarehouseIntegrationService }    from './pos-warehouse-integration.service';
import { PosWarehouseIntegrationQueriesService } from './pos-warehouse-integration-queries.service';
import { PosWarehouseIntegrationMovementService } from './pos-warehouse-integration-movement.service';

import { EmployeesCompatService }          from './employees-compat.service';
import { EmployeesCompatSubService }       from './employees-compat-sub.service';
import { EmployeesListExtendedService }    from './employees-list-extended.service';
import { EmployeesCompatProfileService }   from './employees-compat-profile.service';
import { EmployeesCompatProfileRawService } from './employees-compat-profile-raw.service';
import { EmployeesCompatProfileOrmService } from './employees-compat-profile-orm.service';
import { EmployeesCompatFinancialsService } from './employees-compat-financials.service';
import { UsersCompatService }            from './users-compat.service';
import { BarcodeWarehouseCompatService } from './barcode-warehouse.service';
import { CfoCompatService }              from './cfo.service';
import { CfoRiskService }                from './cfo-risk.service';
import { EuroprintControlCompatService } from './europrint-control.service';
import { EuroprintControlDirectorService } from './europrint-control-director.service';
import { CrmExtendedCompatService }      from './crm-extended.service';
import { ResourcesCompatService }        from './resources.service';
import { WarehouseCatalogService }       from './warehouse-catalog.service';
import { WarehouseBarcodeOpsService }    from './warehouse-barcode-ops.service';
import { WarehouseLabelCompatService }   from './warehouse-label.service';
import { SuccessionCompatService }       from './succession-compat.service';
import { MentorshipsCompatService }      from './mentorships-compat.service';
import { CandidatesCompatService }       from './candidates-compat.service';
import { EmployeeKpiCompatService }      from './employee-kpi-compat.service';
import { DisciplineRecordsCompatService } from './discipline-records-compat.service';
import { HrMapCompatService }            from './hr-map-compat.service';
import { GoalsCompatService }            from './goals-compat.service';
import { EmployeeFilesCompatService }    from './employee-files-compat.service';
import { SaasService }                   from './saas.service';
import { OrdersRegistryService }         from './orders-registry.service';
import { TelegramAdminService }          from './telegram-admin.service';
import { SettingsAdminService }          from './settings-admin.service';
import { ApprovalWorkflowService }       from './approval-workflow.service';
import { CalendarEventsService }         from './calendar-events.service';
import { AssetManagementService }        from './asset-management.service';
import { SaasRepo }                      from './repositories/saas.repo';
import { SettingsAdminRepo }             from './repositories/settings-admin.repo';
import { ApprovalWorkflowRepo }          from './repositories/approval-workflow.repo';
import { CalendarEventsRepo }            from './repositories/calendar-events.repo';
import { AssetManagementRepo }           from './repositories/asset-management.repo';

import { LabelService }               from '../pos/application/services/label.service';
import { LabelExtService }            from '../pos/application/services/label-ext.service';
import { LabelRepository }            from '../pos/infrastructure/repositories/label.repository';
import { PosPrinterConfigRepository } from '../pos/infrastructure/repositories/pos-printer-config.repository';
import { AuthModule }                 from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    EmployeesCompatController,
    EmployeesCompatSubController,
    EmployeesExtraController,
    UsersCompatController,
    BarcodeWarehouseCompatController,
    CfoCompatController,
    EuroprintControlCompatController,
    EuroprintControlDirectorController,
    CrmExtendedCompatController,
    MarketingExtendedCompatController,
    WarehousesCompatController,
    MaterialCardsCompatController,
    OrgDepartmentsCompatController,
    OrgFunctionsCompatController,
    CoreDepartmentsCompatController,
    WarehouseCatalogController,
    WarehouseBarcodeOpsController,
    WarehouseLabelController,
    SuccessionCompatController,
    MentorshipsCompatController,
    CandidatesCompatController,
    EmployeeKpiCompatController,
    EmployeeZoneHistoryCompatController,
    DailyAttendanceCompatController,
    DisciplineRecordsCompatController,
    HrMapCompatController,
    GoalsCompatController,
    EmployeeFilesCompatController,
    SaasController,
    OrdersRegistryCompatController,
    TelegramAdminController,
    SettingsAdminController,
    ApprovalWorkflowController,
    CalendarEventsController,
    AssetManagementController,
    DocumentWorkflowV2Controller,
    PosWarehouseIntegrationController,
  ],
  providers: [
    LabelRepository,
    PosPrinterConfigRepository,
    LabelService,
    LabelExtService,
    EmployeesCompatProfileService,
    EmployeesCompatProfileRawService,
    EmployeesCompatProfileOrmService,
    EmployeesCompatFinancialsService,
    EmployeesCompatService,
    EmployeesCompatSubService,
    EmployeesListExtendedService,
    UsersCompatService,
    BarcodeWarehouseCompatService,
    BarcodeWarehouseDebtService,
    CfoCompatService,
    CfoRiskService,
    EuroprintControlCompatService,
    EuroprintControlDirectorService,
    CrmExtendedCompatService,
    ResourcesCompatService,
    WarehouseCatalogService,
    WarehouseBarcodeOpsService,
    WarehouseLabelCompatService,
    SuccessionCompatService,
    MentorshipsCompatService,
    CandidatesCompatService,
    EmployeeKpiCompatService,
    DisciplineRecordsCompatService,
    HrMapCompatService,
    GoalsCompatService,
    EmployeeFilesCompatService,
    SaasService,
    OrdersRegistryService,
    TelegramAdminService,
    SettingsAdminService,
    ApprovalWorkflowService,
    CalendarEventsService,
    AssetManagementService,
    SaasRepo,
    SettingsAdminRepo,
    ApprovalWorkflowRepo,
    CalendarEventsRepo,
    AssetManagementRepo,
    DocumentWorkflowV2Service,
    PosWarehouseIntegrationService,
    PosWarehouseIntegrationQueriesService,
    PosWarehouseIntegrationMovementService,
  ],
})
export class CompatibilityModule {}
