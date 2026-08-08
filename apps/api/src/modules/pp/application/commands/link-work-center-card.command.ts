/**
 * @module link-work-center-card.command
 * @description T12-04 (uzun-dum drain): ish markazini org-tuzilma KARTA-siga bog'lash
 *              command + handler. work_centers.org_department_id yozuv-yo'li.
 *              Qiymat (qaysi KARTA) egasi-DATA — bu faqat YOZUV-YO'LI (struktura), Q-40.
 *              FK: fk_work_centers_org_dept -> org_departments(id) ON DELETE SET NULL.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err, Ok } from '@common/result';
import { DrizzleWorkCenterRepository } from '../../infrastructure/repositories/drizzle-work-center.repo';
import { WORK_CENTER_REPO } from '../../domain/repositories/pp.repository';

export class LinkWorkCenterCardCommand {
  constructor(
    public readonly id: string,
    // org_departments.id (KARTA). null = bog'lanishni bekor qilish.
    public readonly orgDepartmentId: number | null,
  ) {}
}

@Injectable()
@CommandHandler(LinkWorkCenterCardCommand)
export class LinkWorkCenterCardHandler implements ICommandHandler<LinkWorkCenterCardCommand> {
  private readonly logger = new Logger(LinkWorkCenterCardHandler.name);

  constructor(
    @Inject(WORK_CENTER_REPO)
    private readonly workCenterRepo: DrizzleWorkCenterRepository,
  ) {}

  async execute(command: LinkWorkCenterCardCommand): Promise<Result<Record<string, unknown>>> {
    try {
      const existing = await this.workCenterRepo.findById(command.id);
      if (!existing.ok) {
        this.logger.warn(`Work center not found: ${command.id}`);
        return Err(existing.error);
      }
      const res = await this.workCenterRepo.updateOrgDepartment(command.id, command.orgDepartmentId);
      if (!res.ok) {
        this.logger.error(`Failed to link work center card: ${res.error}`);
        return Err(res.error);
      }
      this.logger.log(`Work center linked to KARTA: ${command.id} -> ${command.orgDepartmentId}`);
      return Ok(res.data);
    } catch (error: unknown) {
      this.logger.error(`Error linking work center card: ${(error as Error).message}`);
      return Err('Work center KARTA bog\'lashda xatolik');
    }
  }
}
