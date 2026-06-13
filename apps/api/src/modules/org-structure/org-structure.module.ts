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

@Module({
  controllers: [OrgStructureController, CardController],
  providers: [OrgStructureService, OrgExportRepository, OrgExportService, PositionFolderRepository, PositionFolderService, NodePortretRepository, NodePortretService, OrgQueriesRepo, OrgMutationsRepo, OrgStructureRepository, CardService, CardRepository],
  exports: [OrgStructureService, PositionFolderService, CardService],
})
export class OrgStructureModule {}
