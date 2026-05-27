import { Module } from '@nestjs/common';
import { PipController } from './pip.controller';
import { PipRepository } from './pip.repository';

@Module({
  controllers: [PipController],
  providers: [PipRepository],
  exports: [PipRepository],
})
export class PipModule {}
