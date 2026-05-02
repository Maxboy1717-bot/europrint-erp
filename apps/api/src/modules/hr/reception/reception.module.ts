import { Module } from '@nestjs/common';
import { ReceptionService } from './reception.service';
import { ReceptionController } from './reception.controller';
import { ReceptionRepository } from './reception.repository';

@Module({
  controllers: [ReceptionController],
  providers: [ReceptionRepository, ReceptionService],
  exports: [ReceptionService],
})
export class ReceptionModule {}
