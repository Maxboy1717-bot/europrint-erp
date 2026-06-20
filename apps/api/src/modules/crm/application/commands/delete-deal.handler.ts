/**
 * @module delete-deal.handler
 * @description CQRS handler — soft-deletes a CRM deal. Thin wrapper over
 * ICrmDealsRepository.softDelete so the controller can dispatch deletes
 * through the CommandBus (PA1-11 — one path per write).
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { CRM_DEALS_REPO, ICrmDealsRepository } from '../../deals/i-crm-deals.repo';

export class DeleteDealCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteDealCommand)
export class DeleteDealHandler implements ICommandHandler<DeleteDealCommand> {
  private readonly logger = new Logger(DeleteDealHandler.name);

  constructor(
    @Inject(CRM_DEALS_REPO) private readonly repo: ICrmDealsRepository,
  ) {}

  async execute(command: DeleteDealCommand): Promise<Result<{ message: string }>> {
    this.logger.log({ msg: 'Soft-deleting deal', id: command.id });

    const existing = await this.repo.findById(command.id);
    if (!existing.ok) return Err(AppErr('INTERNAL', existing.error.message));
    if (!existing.data) return Err(AppErr('NOT_FOUND', `Deal #${command.id} topilmadi`));

    const deleted = await this.repo.softDelete(command.id);
    if (!deleted.ok) return Err(AppErr('INTERNAL', deleted.error.message));

    return Ok({ message: "O'chirildi" });
  }
}
