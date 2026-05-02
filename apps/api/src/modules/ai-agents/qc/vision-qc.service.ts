import { Injectable, Logger } from '@nestjs/common';
import { AiRouterService } from '../../ai/application/services/ai-router.service';
import { isErr } from '@common/result';
import { AiDecisionLogService } from '../common/ai-decision-log.service';
import {
  AGENT_CODES, AI_GEMINI_MODEL,
  AI_VISION_PASS_THRESHOLD, AI_VISION_SCRAP_THRESHOLD, AI_AUTO_CONFIDENCE_THRESHOLD,
} from '../common/ai-agents.constants';

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

  async analyze(
    workOrderId:   string,
    imageUrl:      string,
    colorTargets:  { L: number; a: number; b: number }[],
  ): Promise<VisionQcResult> {
    const start          = Date.now();
    const canonicalInput = { workOrderId, imageUrl, colorTargets };
    const inputHash      = this.logSvc.hashInput(canonicalInput);

    const cached = await this.logSvc.findCachedDecision(AGENT_CODES.VISION_QC, inputHash).catch(() => null);
    if (cached) {
      const stored = cached.alternatives[0] as { deltaE: number; defects: string[]; verdict: QcVerdict } | undefined;
      if (stored) {
        const verdict        = stored.verdict;
        const autoExecuted   = verdict !== 'REWORK' && cached.confidence >= AI_AUTO_CONFIDENCE_THRESHOLD;
        return { workOrderId, verdict, deltaE: stored.deltaE, defects: stored.defects, confidence: cached.confidence, autoExecuted, requiresHuman: verdict === 'REWORK' || !autoExecuted };
      }
      const verdict        = (cached.action ?? 'REWORK') as QcVerdict;
      const autoExecuted   = verdict !== 'REWORK' && cached.confidence >= AI_AUTO_CONFIDENCE_THRESHOLD;
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
    let confidence = 0.75;
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
    const autoExecuted  = verdict !== 'REWORK' && confidence >= AI_AUTO_CONFIDENCE_THRESHOLD;
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
