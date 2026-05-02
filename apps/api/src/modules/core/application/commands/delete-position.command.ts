import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';

export class DeletePositionCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeletePositionCommand)
export class DeletePositionHandler implements ICommandHandler<DeletePositionCommand> {
  private readonly logger = new Logger(DeletePositionHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(command: DeletePositionCommand): Promise<Result<void>> {
    const { id } = command;

    const existing = await this.repo.findPositionById(id);
    if (!existing.ok) {
      return Err('Lavoza topilmadi');
    }

    return await this.repo.deletePosition(id);
  }
}
