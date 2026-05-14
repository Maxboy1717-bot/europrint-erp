/**
 * @module technology.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TechnologyController } from './technology.controller';
import { TechnologyService } from './technology.service';
import { TechnologyRepository } from './technology.repository';
import { TechnologySchemaService } from './technology-schema.service';
import { TechnologySchemaRepository } from './technology-schema.repository';

@Module({
  imports: [AuthModule],
  controllers: [TechnologyController],
  providers: [TechnologyService, TechnologyRepository, TechnologySchemaRepository, TechnologySchemaService],
})
export class TechnologyModule {}
