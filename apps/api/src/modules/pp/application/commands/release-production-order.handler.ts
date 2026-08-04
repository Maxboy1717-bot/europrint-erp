/**
 * @module release-production-order.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Ok, Err, AppErr } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';
import { PpReleasedEvent } from '../../domain/events/pp-released.event';

export class ReleaseProductionOrderCommand {
  constructor(public poId: number) {}
}

@CommandHandler(ReleaseProductionOrderCommand)
export class ReleaseProductionOrderHandler
  implements ICommandHandler<ReleaseProductionOrderCommand>
{
  private readonly logger = new Logger(ReleaseProductionOrderHandler.name);
  constructor(
    @Inject(PP_REPO) private ppRepo: IPpRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: ReleaseProductionOrderCommand): Promise<Result<void>> {
    this.logger.log('Releasing production order');

    const poResult = await this.ppRepo.getPo(command.poId);
    if (!poResult.ok) {
      return Err(poResult.error);
    }

    const po = poResult.data;

    // EP-PP-091 / EP-PP-124 lab-gate (owner vision, docs/audit/vision-1000-answers/07-pp.md
    // Q304): a production order may only be released once the technology card for its
    // finished good carries a real LAB "Одобрена" stamp (technology_cards.lab_approved =
    // true). "Sifat rejadan ustun" (EP-PP-123) — hard block, no "continue with warning"
    // bypass; a missing/unapproved card blocks release just like an explicitly rejected one.
    // Previously this step was skipped entirely — setCheckpointValidated(true) was hardcoded
    // regardless of the tech card's real state (P0 gap; the controller's `reason` field is a
    // mandatory audit note, not a substitute for the quality gate itself).
    const labResult = await this.ppRepo.getLabApprovalStatus(command.poId);
    if (!labResult.ok) {
      return Err(labResult.error);
    }
    if (!labResult.data.labApproved) {
      this.logger.warn(`Release blocked: technology card not LAB-approved for PO #${command.poId}`);
      return Err(AppErr(
        'BUSINESS_RULE_VIOLATION',
        labResult.data.cardExists
          ? "Texnologik karta hali LAB tomonidan tasdiqlanmagan — ishlab chiqarish buyurtmasi ishga tushirilmaydi (EP-PP-091/124)"
          : "Ushbu mahsulot uchun tasdiqlangan texnologik karta topilmadi — LAB tasdig'isiz ishlab chiqarishga chiqarib bo'lmaydi (EP-PP-091/124)",
      ));
    }
    po.setCheckpointValidated(true);
    const releaseResult = po.release();
    if (!releaseResult.ok) {
      return Err(releaseResult.error);
    }

    // Trigger 8: PP released → MM/WMS material reservation
    const saveResult = await this.ppRepo.savePo(po);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    // Emit events for MES task creation
    // PA2-18 Wave 6: canonical class form; EventBridge re-emits to legacy @OnEvent listeners.
    this.eventBus.publish(new PpReleasedEvent(command.poId, po.getMaterialList()));

    this.logger.log('Production order released');
    return Ok(undefined);
  }
}
