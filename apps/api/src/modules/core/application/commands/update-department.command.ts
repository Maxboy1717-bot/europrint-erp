/**
 * @module update-department.command
 * @description Source module. See exports for details.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { Department } from '../../domain/aggregates/department.aggregate';
import { UpdateDepartmentDto } from '../../presentation/dto/core.dto';

export class UpdateDepartmentCommand {
  constructor(public readonly id: string,
    public readonly data: UpdateDepartmentDto) {}
}

@CommandHandler(UpdateDepartmentCommand)
export class UpdateDepartmentHandler implements ICommandHandler<UpdateDepartmentCommand> {
  private readonly logger = new Logger(UpdateDepartmentHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(command: UpdateDepartmentCommand): Promise<Result<Department>> {
    const { id, data } = command;

    const existing = await this.repo.findDepartmentById(id);
    if (!existing.ok) {
      return Err('Departament topilmadi');
    }

    if (data.code && data.code !== existing.data.code) {
      const allDepts = await this.repo.findAllDepartments();
      if (!allDepts.ok) {
        return Err('Departamentlarni topishda xato');
      }

      const codeTaken = (Array.isArray(allDepts?.data) ? allDepts?.data : []).some((d) => d.code === data.code && d.id !== id);
      if (codeTaken) {
        return Err('Bu kod allaqachon ishlatilgan');
      }
    }

    if (data.parentId && data.parentId !== existing.data.parentId) {
      const parentDept = await this.repo.findDepartmentById(data.parentId);
      if (!parentDept.ok) {
        return Err('Indeks departament topilmadi');
      }
    }

    const result = await this.repo.updateDepartment(id, data);

    if (result.ok) {
      this.logger.log(`Department updated: ${id}`);
    }

    return result;
  }
}
