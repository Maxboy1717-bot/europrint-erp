import { Module } from '@nestjs/common';
import { SapController } from './sap.controller';
import { SapService } from './sap.service';
import { SapRepository } from './sap.repository';

@Module({
  controllers: [SapController],
  providers: [SapRepository, SapService],
  exports: [SapService],
})
export class SapModule {}
