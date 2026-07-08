/**
 * @module vision-qc.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 *   ⭐ VISION-3340 #39 fix (2026-07-08): the AI auto-execute confidence gate was
 *   previously the hardcoded AI_AUTO_CONFIDENCE_THRESHOLD constant (0.85). QC
 *   auto-accept risk tolerance is an owner call, not a code constant, so it is now
 *   read at runtime from the canonical `settings` key/value table (key
 *   AI_VISION_QC_AUTO_CONFIDENCE) via the shared getConfigNumber() helper — same
 *   DB-first/constant-fallback pattern as EP_COST_RATIO/EP_VAT_RATE in
 *   delivery-completed.listener.ts's readCostRatio()/readVatRate(). If the setting
 *   is absent/out-of-range, AI_VISION_QC_AUTO_CONFIDENCE_DEFAULT (0.85 — the prior
 *   hardcoded value) is used, so behaviour is unchanged until the owner configures
 *   an override via `settings` (never fabricates a threshold).
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiRouterService } from '../../ai/application/services/ai-router.service';
import { isErr } from '@common/result';
import { AiDecisionLogService } from '../common/ai-decision-log.service';
import {
  AGENT_CODES, AI_GEMINI_MODEL,
  AI_VISION_PASS_THRESHOLD, AI_VISION_SCRAP_THRESHOLD,
} from '../common/ai-agents.constants';
import { CONFIDENCE_MEDIUM } from '../../../common/constants/business.constants';
import { getConfigNumber } from '@common/config/business-config.helper';

// Master-data setting key — canonical `settings` table (key/value). Owner changes the
// value via settings screen/seed; no code deploy needed to retune the auto-accept gate.
const AI_VISION_QC_AUTO_CONFIDENCE_KEY = 'AI_VISION_QC_AUTO_CONFIDENCE';

// Statutory/current default — identical to the former hardcoded AI_AUTO_CONFIDENCE_THRESHOLD
// (0.85). Used when `settings` has no row for AI_VISION_QC_AUTO_CONFIDENCE, or an invalid
// (out-of [0,1] range / non-numeric) one — never fabricated, just the previous known-good value.
const AI_VISION_QC_AUTO_CONFIDENCE_DEFAULT = 0.85;

export type QcVerdict = 'PASS' | 'REWORK' | 'SCRAP';

export interface VisionQcResult {
  workOrderId: string;
  verdict:     QcVerdict;
  deltaE:      number;
  defects:     string[];
  confidence:  number;
  autoExecuted: boolean;
  requiresHuman: boolean;
}

@Injectable()
export class AiVisionQcService {
  private readonly logger = new Logger(AiVisionQcService.name);

  constructor(
    private readonly ai:     AiRouterService,
    private readonly logSvc: AiDecisionLogService,
  ) {}

  private verdictFromDeltaE(deltaE: number): QcVerdict {
    if (deltaE <= AI_VISION_PASS_THRESHOLD)  return 'PASS';
    if (deltaE > AI_VISION_SCRAP_THRESHOLD)  return 'SCRAP';
    return 'REWORK';
  }

  /**
   * Read AI_VISION_QC_AUTO_CONFIDENCE from the canonical `settings` table via the
   * shared getConfigNumber() helper (same DB-first/constant-fallback pattern as
   * EP_COST_RATIO/EP_VAT_RATE in delivery-completed.listener.ts). Falls back to
   * AI_VISION_QC_AUTO_CONFIDENCE_DEFAULT (0.85) when the setting is absent or
   * out of the valid [0,1] confidence range — never fabricates a threshold.
   */
  private async readAutoConfidenceThreshold(): Promise<number> {
    const value = await getConfigNumber(
      AI_VISION_QC_AUTO_CONFIDENCE_KEY,
      AI_VISION_QC_AUTO_CONFIDENCE_DEFAULT,
    );
    if (!Number.isFinite(value) || value < 0 || value > 1) return AI_VISION_QC_AUTO_CONFIDENCE_DEFAULT;
    return value;
  }

  async analyze(
    workOrderId:   string,
    imageUrl:      string,
    colorTargets:  { L: number; a: number; b: number }[],
  ): Promise<VisionQcResult> {
    const start          = Date.now();
    const canonicalInput = { workOrderId, imageUrl, colorTargets };
    const inputHash      = this.logSvc.hashInput(canonicalInput);
    const autoConfidenceThreshold = await this.readAutoConfidenceThreshold();

    const cached = await this.logSvc.findCachedDecision(AGENT_CODES.VISION_QC, inputHash).catch(() => null);
    if (cached) {
      const stored = cached.alternatives[0] as { deltaE: number; defects: string[]; verdict: QcVerdict } | undefined;
      if (stored) {
        const verdict        = stored.verdict;
        const autoExecuted   = verdict !== 'REWORK' && cached.confidence >= autoConfidenceThreshold;
        return { workOrderId, verdict, deltaE: stored.deltaE, defects: stored.defects, confidence: cached.confidence, autoExecuted, requiresHuman: verdict === 'REWORK' || !autoExecuted };
      }
      const verdict        = (cached.action ?? 'REWORK') as QcVerdict;
      const autoExecuted   = verdict !== 'REWORK' && cached.confidence >= autoConfidenceThreshold;
      const deltaE         = verdict === 'PASS' ? AI_VISION_PASS_THRESHOLD - 0.5 : verdict === 'SCRAP' ? AI_VISION_SCRAP_THRESHOLD + 1.0 : (AI_VISION_PASS_THRESHOLD + AI_VISION_SCRAP_THRESHOLD) / 2;
      return { workOrderId, verdict, deltaE, defects: [], confidence: cached.confidence, autoExecuted, requiresHuman: verdict === 'REWORK' || !autoExecuted };
    }

    const prompt = `
EuroPrint QC rang tahlili.
Rasm: ${imageUrl}
Rang maqsadlari (L*a*b*): ${JSON.stringify(colorTargets)}
CIEDE2000 ΔE ni hisoblang va quyidagi JSON qaytaring:
{"deltaE": number, "confidence": number, "defects": ["defect1",...], "verdict": "PASS"|"REWORK"|"SCRAP"}
`.trim();

    const aiRes = await this.ai.call({ prompt, provider: 'gemini', taskType: 'mes.quality_prediction', userId: 0 });

    let deltaE    = 3.5;
    let confidence = CONFIDENCE_MEDIUM;
    let defects: string[] = [];

    if (!isErr(aiRes) && aiRes.data.text) {
      const match = aiRes.data.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as { deltaE?: number; confidence?: number; defects?: string[] };
          if (typeof parsed.deltaE     === 'number') deltaE     = parsed.deltaE;
          if (typeof parsed.confidence === 'number') confidence = parsed.confidence;
          if (Array.isArray(parsed.defects))         defects    = parsed.defects;
        } catch {
          this.logger.warn({ msg: 'AI vision response JSON parse failed, using defaults' });
        }
      }
    }

    const verdict       = this.verdictFromDeltaE(deltaE);
    const autoExecuted  = verdict !== 'REWORK' && confidence >= autoConfidenceThreshold;
    const requiresHuman = verdict === 'REWORK' || !autoExecuted;
    const latencyMs     = Date.now() - start;

    await this.logSvc.log({
      agentCode:    AGENT_CODES.VISION_QC,
      entityType:   'work_order',
      entityId:     workOrderId,
      inputData:    canonicalInput,
      decision:     { action: verdict, confidence, alternatives: [{ deltaE, defects, verdict }] },
      confidence,
      modelVersion: `${AI_GEMINI_MODEL}-vision`,
      autoExecuted,
      latencyMs,
      costUsd:      latencyMs * 0.000001,
    });

    this.logger.log({ msg: 'QC tahlil', workOrderId, verdict, deltaE, confidence });
    return { workOrderId, verdict, deltaE, defects, confidence, autoExecuted, requiresHuman };
  }
}
