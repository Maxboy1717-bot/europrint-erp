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
import { crmSeesAllRows, crmResolveOwnerId } from '../../common/crm-row-scope';

export class DeleteDealCommand {
  constructor(
    public readonly id: string,
    /** audit 2026-08-06 T6 (IDOR item 4): caller identity for ownership scoping. */
    public readonly requester?: { id?: number | null; role?: string | null },
  ) {}
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

    // audit 2026-08-06 T6 (IDOR item 4): non-privileged callers may only delete deals
    // they own (same rule/404-shape as DealsService.findOne).
    if (command.requester && !crmSeesAllRows(command.requester.role)) {
      const ownerId = crmResolveOwnerId(existing.data as Record<string, unknown>);
      if (ownerId == null || ownerId !== (command.requester.id ?? -1)) {
        return Err(AppErr('NOT_FOUND', `Deal #${command.id} topilmadi`));
      }
    }

    const deleted = await this.repo.softDelete(command.id);
    if (!deleted.ok) return Err(AppErr('INTERNAL', deleted.error.message));

    return Ok({ message: "O'chirildi" });
  }
}
