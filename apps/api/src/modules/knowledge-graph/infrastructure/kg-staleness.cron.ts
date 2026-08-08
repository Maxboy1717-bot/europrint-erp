/**
 * @module kg-staleness.cron
 * @description AI-overlay "jimlik" uzilishi: `production_order --produced_in-->
 * production_session` edge N soatdan eski, lekin hali `--inspected_by-->
 * qc_inspection` edge yo'q (QC tekshiruvi kelmadi/kechikdi). Bu
 * `docs/GOLDEN_THREAD_TEKSHIRUV.md`ning hozir qo'lda curl bilan qilinadigan
 * tekshiruvini avtomatlashtiradi — real DB-signalga asoslanib, fabrikatsiya
 * emas. Chegara (soat) `alert_thresholds.kg.qc_silence_hours`dan o'qiladi
 * (default 24 soat), Admin CRUD orqali sozlanadi — chatda so'ralmagan,
 * kod ichida qattiq yozilmagan (owner qoidasi: threshold = doim CRUD).
 * `card-staleness.cron.ts` naqshiga o'xshab qurilgan.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { getAlertThreshold } from '../../../shared/config/alert-thresholds.reader';
import { KNOWLEDGE_GRAPH_REPO, type IKnowledgeGraphRepository } from '../domain/repositories/i-knowledge-graph.repository';

const KG_QC_SILENCE_ALERT_TYPE = 'kg.qc_silence_hours';
const KG_QC_SILENCE_DEFAULT_HOURS = 24; // fallback ONLY — real value lives in alert_thresholds

@Injectable()
export class KgStalenessCron {
  private readonly logger = new Logger(KgStalenessCron.name);

  constructor(@Inject(KNOWLEDGE_GRAPH_REPO) private readonly repo: IKnowledgeGraphRepository) {}

  /** 04:00 daily — after CardStalenessCron (03:00), ahead of morning digests. */
  @Cron('0 4 * * *')
  async checkSilentQc(): Promise<void> {
    const hours = await getAlertThreshold(KG_QC_SILENCE_ALERT_TYPE, KG_QC_SILENCE_DEFAULT_HOURS);
    const r = await this.repo.findSilentEdges({
      fromRelationType: 'produced_in',
      expectedRelationType: 'inspected_by',
      olderThanHours: hours,
    });
    if (!r.ok) {
      this.logger.error(`KgStalenessCron error: ${r.error.message}`);
      return;
    }

    let flagged = 0;
    for (const edge of r.data) {
      const mark = await this.repo.markEdgeBroken({
        sourceType: edge.sourceType,
        sourceId: edge.sourceId,
        targetType: edge.targetType,
        targetId: edge.targetId,
        relationType: edge.relationType,
        reason: `QC ${hours} soatdan beri kelmadi (jimlik uzilishi)`,
      });
      if (mark.ok) flagged += 1;
      else this.logger.warn(`KgStalenessCron: markEdgeBroken failed for edge ${edge.id}: ${mark.error.message}`);
    }

    if (flagged > 0) this.logger.log(`KgStalenessCron: ${flagged} silent QC edge(s) flagged`);
    else this.logger.log('KgStalenessCron: no silent edges');
  }
}
