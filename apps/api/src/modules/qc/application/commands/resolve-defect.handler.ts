import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ResolveDefectCommand } from './resolve-defect.command';
import { IQcDefectRepository } from '../../infrastructure/repositories/drizzle-defect.repo';

@Injectable()
@CommandHandler(ResolveDefectCommand)
export class ResolveDefectHandler implements ICommandHandler<ResolveDefectCommand> {
  private readonly logger = new Logger(ResolveDefectHandler.name);

  constructor(
    @Inject('IQcDefectRepository') private readonly qcRepository: IQcDefectRepository,
      ) {}

  async execute(command: ResolveDefectCommand): Promise<Result<string>> {
      const defectResult = await this.qcRepository.findDefectById(command.defectId);

      if (!defectResult.ok || !defectResult.data) {
        this.logger.error('Defect not found');
        return Err(AppErr('NOT_FOUND', 'Defect not found'));
      }

      const defect = defectResult.data;
      defect.resolve(command.userId, command.resolution);

      const updateResult = await this.qcRepository.updateDefect(defect);

      if (!updateResult.ok) {
        this.logger.error('Failed to update defect');
        return Err(updateResult.error);
      }

      this.logger.log('Defect resolved');
      return Ok(defect.id);
  }
}
