/**
 * @module update-position.command
 * @description Source module. See exports for details.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { Position } from '../../domain/aggregates/position.aggregate';
import { UpdatePositionDto } from '../../presentation/dto/core.dto';

export class UpdatePositionCommand {
  constructor(public readonly id: string,
    public readonly data: UpdatePositionDto) {}
}

@CommandHandler(UpdatePositionCommand)
export class UpdatePositionHandler implements ICommandHandler<UpdatePositionCommand> {
  private readonly logger = new Logger(UpdatePositionHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(command: UpdatePositionCommand): Promise<Result<Position>> {
    const { id, data } = command;

    const existing = await this.repo.findPositionById(id);
    if (!existing.ok) {
      return Err('Lavoza topilmadi');
    }

    if (data.code && data.code !== existing.data.code) {
      const allPos = await this.repo.findAllPositions();
      if (!allPos.ok) {
        return Err('Lavozilarni topishda xato');
      }

      const codeTaken = (Array.isArray(allPos?.data) ? allPos?.data : []).some((p) => p.code === data.code && p.id !== id);
      if (codeTaken) {
        return Err('Bu kod allaqachon ishlatilgan');
      }
    }

    if (data.departmentId) {
      const dept = await this.repo.findDepartmentById(data.departmentId);
      if (!dept.ok) {
        return Err('Departament topilmadi');
      }
    }

    if (data.minSalary !== undefined && data.maxSalary !== undefined) {
      if (data.minSalary > data.maxSalary) {
        return Err('Minimal maoshi maksimaldan katta bo\'lishi mumkin emas');
      }
    } else if (data.minSalary !== undefined && data.minSalary > existing.data.maxSalary) {
      return Err('Minimal maoshi maksimaldan katta bo\'lishi mumkin emas');
    } else if (data.maxSalary !== undefined && existing.data.minSalary > data.maxSalary) {
      return Err('Maksimal maoshi minimaldan kichik bo\'lishi mumkin emas');
    }

    const result = await this.repo.updatePosition(id, data);

    if (result.ok) {
      this.logger.log(`Position updated: ${id}`);
    }

    return result;
  }
}
