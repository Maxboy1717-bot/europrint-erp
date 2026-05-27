import { Module } from '@nestjs/common';
import { EnpsController } from './enps.controller';
import { EnpsRepository } from './enps.repository';

@Module({
  controllers: [EnpsController],
  providers: [EnpsRepository],
  exports: [EnpsRepository],
})
export class EnpsModule {}
