/**
 * @module legacy.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KanbanModule } from '../kanban/kanban.module';
import { LmsModule } from '../lms/lms.module';
import { LegacyService } from './services/legacy.service';
import { LegacyIotService } from './services/legacy-iot.service';
import { GeneralLegacyAController } from './controllers/general-legacy-a.controller';
import { GeneralLegacyBController } from './controllers/general-legacy-b.controller';

@Module({
  imports: [AuthModule, KanbanModule, LmsModule],
  controllers: [GeneralLegacyAController, GeneralLegacyBController],
  providers: [LegacyService, LegacyIotService],
  exports: [LegacyService, LegacyIotService],
})
export class LegacyModule {}
