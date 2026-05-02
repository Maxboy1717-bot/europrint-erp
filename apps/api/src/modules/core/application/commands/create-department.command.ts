import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { Department } from '../../domain/aggregates/department.aggregate';
import { CreateDepartmentDto } from '../../presentation/dto/core.dto';

export class CreateDepartmentCommand {
  constructor(public readonly data: CreateDepartmentDto) {}
}

@CommandHandler(CreateDepartmentCommand)
export class CreateDepartmentHandler implements ICommandHandler<CreateDepartmentCommand> {
  private readonly logger = new Logger(CreateDepartmentHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(command: CreateDepartmentCommand): Promise<Result<Department>> {
    const { data } = command;

    const allDepts = await this.repo.findAllDepartments();
    if (!allDepts.ok) {
      return Err('Departamentlarni topishda xato');
    }

    const codeTaken = (allDepts?.data ?? []).some((d) => d.code === data.code);
    if (codeTaken) {
      return Err('Bu kod allaqachon ishlatilgan');
    }

    if (data.parentId) {
      const parentDept = await this.repo.findDepartmentById(data.parentId);
      if (!parentDept.ok) {
        return Err('Indeks departament topilmadi');
      }
    }

    const result = await this.repo.saveDepartment({
      name: data.name,
      code: data.code,
      headId: data.headId || null,
      parentId: data.parentId || null,
      description: data.description || null,
      isActive: true,
      createdAt: _time.now(),
      updatedAt: _time.now(),
    });

    if (result.ok) {
      this.logger.log(`Department created: ${result.data.id} (${result.data.code})`);
    }

    return result;
  }
}
