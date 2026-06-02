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

@Module({
  controllers: [OrgStructureController],
  providers: [OrgStructureService, OrgExportRepository, OrgExportService, PositionFolderRepository, PositionFolderService, NodePortretRepository, NodePortretService, OrgQueriesRepo, OrgMutationsRepo, OrgStructureRepository],
  exports: [OrgStructureService, PositionFolderService],
})
export class OrgStructureModule {}
