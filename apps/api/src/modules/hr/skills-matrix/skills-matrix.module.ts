import { Module } from '@nestjs/common';
import { SkillsMatrixService } from './skills-matrix.service';
import { SkillsMatrixRepository } from './skills-matrix.repository';
import { SkillsMatrixController } from './skills-matrix.controller';

@Module({
  controllers: [SkillsMatrixController],
  providers: [SkillsMatrixRepository, SkillsMatrixService],
  exports: [SkillsMatrixService],
})
export class SkillsMatrixModule {}
