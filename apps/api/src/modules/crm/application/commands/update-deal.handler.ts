/**
 * @module update-deal.handler
 * @description CQRS handler — partial update for a CRM deal. Wraps the
 * ICrmDealsRepository.update path so the controller can dispatch writes
 * through the CommandBus (PA1-11 — one path per write).
 *
 * NOTE: This deliberately mirrors the existing `DealsService.update` behaviour
 * (CRUD-row update) rather than going through the rich Deal aggregate, because
 * patchDeal/updateStage are free-form field patches that the aggregate does not
 * (yet) model. A richer command pipeline can replace this once the aggregate
 * covers all editable fields.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { CRM_DEALS_REPO, ICrmDealsRepository } from '../../deals/i-crm-deals.repo';
import { crmSeesAllRows, crmResolveOwnerId } from '../../common/crm-row-scope';

export class UpdateDealCommand {
  constructor(
    public readonly id: string,
    public readonly patch: Record<string, unknown>,
    /** audit 2026-08-06 T6 (IDOR item 4): caller identity for ownership scoping. */
    public readonly requester?: { id?: number | null; role?: string | null },
  ) {}
}

@CommandHandler(UpdateDealCommand)
export class UpdateDealHandler implements ICommandHandler<UpdateDealCommand> {
  private readonly logger = new Logger(UpdateDealHandler.name);

  constructor(
    @Inject(CRM_DEALS_REPO) private readonly repo: ICrmDealsRepository,
  ) {}

  async execute(command: UpdateDealCommand): Promise<Result<Record<string, unknown>>> {
    this.logger.log({ msg: 'Updating deal', id: command.id });

    const existing = await this.repo.findById(command.id);
    if (!existing.ok) return Err(AppErr('INTERNAL', existing.error.message));
    if (!existing.data) return Err(AppErr('NOT_FOUND', `Deal #${command.id} topilmadi`));

    // audit 2026-08-06 T6 (IDOR item 4): non-privileged callers may only update deals
    // they own (same rule/404-shape as DealsService.findOne — existence not leaked).
    if (command.requester && !crmSeesAllRows(command.requester.role)) {
      const ownerId = crmResolveOwnerId(existing.data as Record<string, unknown>);
      if (ownerId == null || ownerId !== (command.requester.id ?? -1)) {
        return Err(AppErr('NOT_FOUND', `Deal #${command.id} topilmadi`));
      }
    }

    const updated = await this.repo.update(command.id, command.patch);
    if (!updated.ok) return Err(AppErr('INTERNAL', updated.error.message));

    return Ok(updated.data);
  }
}
