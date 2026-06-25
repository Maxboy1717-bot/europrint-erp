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
import { CardFolderController } from './card-folder.controller';
import { CardFolderService } from './card-folder.service';
import { CardFolderRepository } from './card-folder.repository';
// EP-ORG-041 (ORG-CASCADE, owner decision #13)
import { OrgCascadeListener } from './cascade/org-cascade.listener';
import { OrgCascadeRepository } from './cascade/org-cascade.repository';

@Module({
  controllers: [OrgStructureController, CardController, RazryadController, RazryadHistoryController, CardFolderController],
  providers: [OrgStructureService, OrgExportRepository, OrgExportService, PositionFolderRepository, PositionFolderService, NodePortretRepository, NodePortretService, OrgQueriesRepo, OrgMutationsRepo, OrgStructureRepository, CardService, CardRepository, RazryadService, RazryadRepository, RazryadHistoryService, RazryadHistoryRepository, CardFolderService, CardFolderRepository, OrgCascadeListener, OrgCascadeRepository],
  exports: [OrgStructureService, PositionFolderService, CardService, RazryadService, CardFolderService],
})
export class OrgStructureModule {}
