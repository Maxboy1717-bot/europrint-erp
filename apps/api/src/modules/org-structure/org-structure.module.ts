import { Module } from '@nestjs/common';
import { OrgStructureController } from './org-structure.controller';
import { OrgStructureService } from './org-structure.service';
import { OrgExportService } from './org-export.service';
import { OrgExportRepository } from './org-export.repository';
import { PositionFolderService } from './position-folder.service';
import { PositionFolderRepository } from './position-folder.repository';
import { OrgStructureRepository } from './org-structure.repository';

@Module({
  controllers: [OrgStructureController],
  providers: [OrgStructureService, OrgExportRepository, OrgExportService, PositionFolderRepository, PositionFolderService, OrgStructureRepository],
  exports: [OrgStructureService, PositionFolderService],
})
export class OrgStructureModule {}
