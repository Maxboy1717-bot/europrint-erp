import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { UpdateMaterialCommand } from './update-material.command';
import { Material } from '../../domain/aggregates/material.aggregate';
import { IMmMaterialRepository } from '../../infrastructure/repositories/drizzle-material.repo';

@Injectable()
@CommandHandler(UpdateMaterialCommand)
export class UpdateMaterialHandler implements ICommandHandler<UpdateMaterialCommand> {
  private readonly logger = new Logger(UpdateMaterialHandler.name);

  constructor(
    @Inject('IMmMaterialRepository') private readonly materialRepository: IMmMaterialRepository,
      ) {}

  async execute(command: UpdateMaterialCommand): Promise<Result<Material>> {
      const existingResult = await this.materialRepository.findById(command.materialId);

      if (!existingResult.ok || !existingResult.data) {
        this.logger.error('Material not found');
        return Err(AppErr('NOT_FOUND', 'Material not found'));
      }

      const material = existingResult.data;

      const updated = new Material(
        material.id,
        material.materialCode,
        command.name ?? material.name,
        command.category ?? material.category,
        command.unitOfMeasure ?? material.unitOfMeasure,
        command.minStock ?? material.minStock,
        command.maxStock ?? material.maxStock,
        command.unitCost ?? material.unitCost,
        material.currentStock,
        command.isActive ?? material.isActive,
        material.createdAt,
        _time.now(),
      );

      const result = await this.materialRepository.update(updated);

      if (!result.ok) {
        this.logger.error('Failed to update material');
        return result;
      }

      this.logger.log('Material updated');
      return Ok(updated);
  }
}
