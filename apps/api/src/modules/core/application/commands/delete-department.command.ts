/**
 * @module delete-department.command
 * @description Source module. See exports for details.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { db } from '@shared/db';

export class DeleteDepartmentCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteDepartmentCommand)
export class DeleteDepartmentHandler implements ICommandHandler<DeleteDepartmentCommand> {
  private readonly logger = new Logger(DeleteDepartmentHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(command: DeleteDepartmentCommand): Promise<Result<void>> {
    const { id } = command;

    const existing = await this.repo.findDepartmentById(id);
    if (!existing.ok) {
      return Err('Departament topilmadi');
    }

    return await this.repo.deleteDepartment(id);
  }
}
