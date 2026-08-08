/**
 * @module org-structure/cascade/ckp-cascade.listener
 * @description T18-C2 (ЦКП KASKAD-AGREGAT EVENT) — when a daily ЦКП fact is
 *   committed for a card ({@link CkpReportedEvent}), roll the achievement UP the
 *   VERTICAL org chain: for every ancestor card (parent → otdeleniye → CEO/root),
 *   recompute that ancestor's daily ROLLUP aggregate from its subtree leaf facts
 *   ({@link CkpFactRepository.rollupParentDay}).
 *
 * VISION (egasi, EP-ORG-014..018): "ЦКП oqib chiqadi" — bola-karta (operator/ishchi)
 *   fakti yuqoriga oqadi; har ota-karta o'z subtree'sining o'rtacha/yig'indi
 *   bajarishini ko'rsatadi. Bu VERTIKAL harakat (manager_id-zanjir, not horizontal).
 *
 * WIRING: same EventEmitter2 mechanism as OrgCascadeListener + CkpMesFeedListener
 *   (global EventEmitterModule.forRoot()). The emit happens in CkpFactService.recordFact
 *   AFTER the leaf fact commits, so the roll-up reads an already-persisted fact.
 *
 * FABRIKATSIYA YO'Q (Q-40): the roll-up RE-READS live leaf facts; a parent with no
 *   subtree leaf fact for the day gets NOTHING written (rollupParentDay returns null).
 *   ROLLUP rows are excluded from the aggregate (no double-count).
 *
 * NEVER THROWS: a roll-up failure is logged and swallowed — the leaf fact is already
 *   committed and must not be rolled back by a cascade error.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Result, Ok, Err } from '@common/result';
import { CkpFactRepository } from '../ckp-fact.repository';
import { CkpReportedEvent } from './ckp-reported.event';
import { CKP_REPORTED_EVENT } from './ckp-cascade.constants';

export interface CkpCascadeOutcome {
  /** card whose leaf fact triggered the cascade. */
  cardId: number;
  /** the ЦКП day rolled up. */
  factDate: string;
  /** ancestor card ids walked (nearest parent → root). */
  ancestors: number[];
  /** ancestor cards that got a ROLLUP row written/updated this run. */
  rolledUp: number[];
  /** ancestor cards skipped (no subtree leaf fact for the day). */
  skipped: number[];
}

@Injectable()
export class CkpCascadeListener {
  private readonly logger = new Logger(CkpCascadeListener.name);

  constructor(private readonly repo: CkpFactRepository) {}

  /**
   * EventEmitter2 entrypoint. Wraps the pure handler so a cascade failure is
   * logged but never propagates (the leaf ЦКП fact is already committed).
   */
  @OnEvent(CKP_REPORTED_EVENT)
  async onCkpReported(event: CkpReportedEvent): Promise<void> {
    try {
      const result = await this.handle(event);
      if (result.ok) {
        const o = result.data;
        this.logger.log(
          `ЦКП-kaskad: karta #${o.cardId} (${o.factDate}) → ${o.rolledUp.length}/${o.ancestors.length} ` +
          `ota-karta agregatlandi [${o.rolledUp.join(',') || '—'}]`,
        );
      } else {
        this.logger.error(`ЦКП-kaskad xatolik: ${result.error.message}`);
      }
    } catch (error: unknown) {
      this.logger.error(
        `ЦКП-kaskad istisno (karta #${(event as { cardId?: unknown })?.cardId}): ` +
        (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /**
   * Pure cascade logic — walks the ancestor chain and rolls up each parent's daily
   * aggregate. Returns a Result so it is fully testable. A single parent roll-up
   * failure does NOT abort the rest of the chain (best-effort vertical roll-up).
   */
  async handle(event: CkpReportedEvent): Promise<Result<CkpCascadeOutcome>> {
    const cardId = Number(event?.cardId);
    const factDate = String(event?.factDate ?? '');
    if (!Number.isFinite(cardId) || cardId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(factDate)) {
      return Err({ code: 'VALIDATION', message: `ЦКП-kaskad: noto'g'ri event (card=${event?.cardId}, date=${event?.factDate})` });
    }

    const ancestorsR = await this.repo.ancestorChain(cardId);
    if (!ancestorsR.ok) return Err(ancestorsR.error);
    const ancestors = ancestorsR.data;

    const rolledUp: number[] = [];
    const skipped: number[] = [];

    // Bottom-up: roll up nearest parent first, then its parent, … to root. Each
    // parent re-aggregates its WHOLE subtree (so a deeper roll-up already reflects
    // the child written one step earlier).
    for (const parentId of ancestors) {
      const r = await this.repo.rollupParentDay(parentId, factDate);
      if (!r.ok) {
        this.logger.warn(`ЦКП-kaskad: ota #${parentId} agregatlanmadi (${factDate}): ${r.error.message}`);
        skipped.push(parentId);
        continue;
      }
      if (r.data) rolledUp.push(parentId);
      else skipped.push(parentId);
    }

    return Ok({ cardId, factDate, ancestors, rolledUp, skipped });
  }
}
