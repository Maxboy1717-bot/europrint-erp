import { Module } from '@nestjs/common';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { OrgRepository } from './org.repository';

@Module({
  controllers: [OrgController],
  providers: [OrgService, OrgRepository],
  exports: [OrgService],
})
export class OrgModule {}
