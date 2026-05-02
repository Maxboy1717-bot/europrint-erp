import { Module } from '@nestjs/common';
import { EnpsService } from './enps.service';
import { EnpsController } from './enps.controller';
import { EnpsRepository } from './enps.repository';

@Module({
  controllers: [EnpsController],
  providers: [EnpsRepository, EnpsService],
  exports: [EnpsService],
})
export class EnpsModule {}
