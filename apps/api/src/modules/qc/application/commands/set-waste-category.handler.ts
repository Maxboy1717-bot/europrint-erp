/**
 * @module set-waste-category.handler
 * @description CQRS command handler. execute() sets qc_defects.waste_category to separate setup
 * (priladka) brak from production brak. Vision 09-qc#96. Returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Err, Ok, Result } from '@common/result';
import { SetWasteCategoryCommand } from './set-waste-category.command';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../infrastructure/repositories/drizzle-defect.repo';

@Injectable()
@CommandHandler(SetWasteCategoryCommand)
export class SetWasteCategoryHandler implements ICommandHandler<SetWasteCategoryCommand> {
  private readonly logger = new Logger(SetWasteCategoryHandler.name);

  constructor(
    @Inject(QC_DEFECT_REPO) private readonly qcRepository: IQcDefectRepository,
  ) {}

  async execute(command: SetWasteCategoryCommand): Promise<Result<{ id: number; wasteCategory: string }>> {
    const result = await this.qcRepository.setWasteCategory(command.defectId, command.wasteCategory);
    if (!result.ok) {
      this.logger.warn('Failed to set waste category');
      return Err(result.error);
    }
    this.logger.log('Defect waste category set (setup/production)');
    return Ok(result.data);
  }
}
