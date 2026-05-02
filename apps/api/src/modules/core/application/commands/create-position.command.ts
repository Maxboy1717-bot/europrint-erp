import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { Position } from '../../domain/aggregates/position.aggregate';
import { CreatePositionDto } from '../../presentation/dto/core.dto';

export class CreatePositionCommand {
  constructor(public readonly data: CreatePositionDto) {}
}

@CommandHandler(CreatePositionCommand)
export class CreatePositionHandler implements ICommandHandler<CreatePositionCommand> {
  private readonly logger = new Logger(CreatePositionHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(command: CreatePositionCommand): Promise<Result<Position>> {
    const { data } = command;

    const allPos = await this.repo.findAllPositions();
    if (!allPos.ok) {
      return Err('Lavozilarni topishda xato');
    }

    const codeTaken = (allPos?.data ?? []).some((p) => p.code === data.code);
    if (codeTaken) {
      return Err('Bu kod allaqachon ishlatilgan');
    }

    const dept = await this.repo.findDepartmentById(data.departmentId);
    if (!dept.ok) {
      return Err('Departament topilmadi');
    }

    if (data.minSalary > data.maxSalary) {
      return Err('Minimal maoshi maksimaldan katta bo\'lishi mumkin emas');
    }

    const result = await this.repo.savePosition({
      title: data.title,
      code: data.code,
      departmentId: data.departmentId,
      level: data.level,
      minSalary: data.minSalary,
      maxSalary: data.maxSalary,
      isActive: true,
      createdAt: _time.now(),
      updatedAt: _time.now(),
    });

    if (result.ok) {
      this.logger.log(`Position created: ${result.data.id} (${result.data.code})`);
    }

    return result;
  }
}
