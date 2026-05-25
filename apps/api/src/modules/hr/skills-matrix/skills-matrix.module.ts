/**
 * @module skills-matrix.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SkillsMatrixService } from './skills-matrix.service';
import { SkillsMatrixRepository } from './skills-matrix.repository';
import { SkillsMatrixController } from './skills-matrix.controller';
import { SkillsMatrixCertificateEarnedListener } from './skills-matrix-certificate-earned.listener';

@Module({
  imports: [CqrsModule],
  controllers: [SkillsMatrixController],
  providers: [
    SkillsMatrixRepository,
    SkillsMatrixService,
    SkillsMatrixCertificateEarnedListener,
  ],
  exports: [SkillsMatrixService],
})
export class SkillsMatrixModule {}
