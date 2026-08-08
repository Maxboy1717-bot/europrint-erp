/**
 * @module create-material.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/result';
import { CreateMaterialCommand } from './create-material.command';
import { Material } from '../../domain/aggregates/material.aggregate';
import { IMmMaterialRepository, MM_MATERIAL_REPO } from '../../infrastructure/repositories/drizzle-material.repo';
import { validateMaterialCode } from '../../domain/constants/material-code.constants';

@Injectable()
@CommandHandler(CreateMaterialCommand)
export class CreateMaterialHandler implements ICommandHandler<CreateMaterialCommand> {
  private readonly logger = new Logger(CreateMaterialHandler.name);

  constructor(
    @Inject(MM_MATERIAL_REPO) private readonly materialRepository: IMmMaterialRepository,
  ) {}

  async execute(command: CreateMaterialCommand): Promise<Result<Material>> {
      // T18-C4 master-data: enforce canonical material code format
      // ([YO'NALISH]-[KAT]-[XUS]-[N]). Graceful — an empty code is allowed; a
      // non-empty code that violates the standard is rejected (VALIDATION → 400).
      const codeCheck = validateMaterialCode(command.materialCode);
      if (!codeCheck.ok) {
        this.logger.warn(`Rejected material code "${command.materialCode}": ${codeCheck.error.message}`);
        return Err(codeCheck.error);
      }

      const material = new Material(
        this.generateId(),
        command.materialCode,
        command.name,
        command.category,
        command.unitOfMeasure,
        command.minStock,
        command.maxStock,
        command.unitCost,
        0,
        true,
        _time.now(),
        _time.now(),
        0,
        command.createdBy,
      );

      const result = await this.materialRepository.save(material);

      if (!result.ok) {
        this.logger.error('Failed to save material: ' + result.error);
        return result;
      }

      this.logger.log('Material created: ' + command.materialCode);
      return result;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
