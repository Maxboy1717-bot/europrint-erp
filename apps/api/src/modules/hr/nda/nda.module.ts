import { Module } from '@nestjs/common';
import { NdaController } from './nda.controller';
import { NdaRepository } from './nda.repository';
import { NdaAutoIssueListener } from './nda-auto-issue.listener';

@Module({
  controllers: [NdaController],
  providers: [NdaRepository, NdaAutoIssueListener],
  exports: [NdaRepository],
})
export class NdaModule {}
