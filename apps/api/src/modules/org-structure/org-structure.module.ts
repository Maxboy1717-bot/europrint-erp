/**
 * @module org-structure.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { OrgStructureController } from './org-structure.controller';
import { OrgStructureService } from './org-structure.service';
import { OrgExportService } from './org-export.service';
import { OrgExportRepository } from './org-export.repository';
import { PositionFolderService } from './position-folder.service';
import { PositionFolderRepository } from './position-folder.repository';
import { NodePortretService } from './node-portret.service';
import { NodePortretRepository } from './node-portret.repository';
import { OrgStructureRepository, OrgQueriesRepo, OrgMutationsRepo } from './org-structure.repository';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { CardRepository } from './card.repository';
import { RazryadController } from './razryad.controller';
import { RazryadService } from './razryad.service';
import { RazryadRepository } from './razryad.repository';
import { RazryadHistoryController } from './razryad-history.controller';
import { RazryadHistoryService } from './razryad-history.service';
import { RazryadHistoryRepository } from './razryad-history.repository';
import { CkpController } from './ckp.controller';
import { CkpFactService } from './ckp-fact.service';
import { CkpFactRepository } from './ckp-fact.repository';
import { CardFolderController } from './card-folder.controller';
import { CardFolderService } from './card-folder.service';
import { CardFolderRepository } from './card-folder.repository';
// T10-03 — card_templates (lavozim-turi shablon + apply-template → yangi karta urug'lash)
import { CardTemplateController } from './card-template.controller';
import { CardTemplateService } from './card-template.service';
import { CardTemplateRepository } from './card-template.repository';
// T10-08 — error_catalog (XATO-KATALOG: tipik xatolar/nuqson-sabablari, defect-dropdown manbai)
import { ErrorCatalogController } from './error-catalog.controller';
import { ErrorCatalogService } from './error-catalog.service';
import { ErrorCatalogRepository } from './error-catalog.repository';
// EP-ORG-041 (ORG-CASCADE, owner decision #13)
import { OrgCascadeListener } from './cascade/org-cascade.listener';
import { OrgCascadeRepository } from './cascade/org-cascade.repository';
// A67 (To'lqin 4 — ЦКП): MES completed → daily ЦКП fact feed (@OnEvent, via EventBridge)
import { CkpMesFeedListener } from './ckp-mes-feed.listener';
// T18-C2 (ЦКП KASKAD-AGREGAT): CkpReportedEvent → ota-zanjir SUM/AVG roll-up (@OnEvent)
import { CkpCascadeListener } from './cascade/ckp-cascade.listener';

@Module({
  controllers: [OrgStructureController, CardController, RazryadController, RazryadHistoryController, CkpController, CardFolderController, CardTemplateController, ErrorCatalogController],
  providers: [OrgStructureService, OrgExportRepository, OrgExportService, PositionFolderRepository, PositionFolderService, NodePortretRepository, NodePortretService, OrgQueriesRepo, OrgMutationsRepo, OrgStructureRepository, CardService, CardRepository, RazryadService, RazryadRepository, RazryadHistoryService, RazryadHistoryRepository, CkpFactService, CkpFactRepository, CardFolderService, CardFolderRepository, OrgCascadeListener, OrgCascadeRepository, CkpMesFeedListener, CkpCascadeListener, CardTemplateService, CardTemplateRepository, ErrorCatalogService, ErrorCatalogRepository],
  exports: [OrgStructureService, PositionFolderService, CardService, RazryadService, CardFolderService, CardTemplateService, CkpFactService],
})
export class OrgStructureModule {}
