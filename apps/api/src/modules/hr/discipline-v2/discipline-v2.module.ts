import { Module } from '@nestjs/common';
import { DisciplineV2Service } from './discipline-v2.service';
import { DisciplineV2Repository } from './discipline-v2.repository';
import { DisciplineV2AbsenceService } from './discipline-v2-absence.service';
import { DisciplineV2AbsenceRepository } from './discipline-v2-absence.repository';
import { DisciplineV2Controller } from './discipline-v2.controller';

@Module({
  controllers: [DisciplineV2Controller],
  providers: [DisciplineV2Repository, DisciplineV2Service, DisciplineV2AbsenceRepository, DisciplineV2AbsenceService],
  exports: [DisciplineV2Service, DisciplineV2AbsenceService],
})
export class DisciplineV2Module {}
