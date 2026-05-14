/**
 * @module prepress-assistant.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { safeDiv } from '@common/math/math-utils';
import { AiRouterService } from '../../ai/application/services/ai-router.service';
import { isErr } from '@common/result';
import { AiDecisionLogService } from '../common/ai-decision-log.service';
import {
  AGENT_CODES, AI_GEMINI_MODEL, AI_AUTO_CONFIDENCE_THRESHOLD,
  MIN_DPI, REQUIRED_BLEED_MM, MAX_TAC_OFFSET, MAX_TAC_FLEXO, COMPLETENESS_THRESHOLD,
} from '../common/ai-agents.constants';

const REQUIRED_FIELDS = [
  'print_tech', 'paper_type', 'paper_gsm', 'dimensions_mm',
  'colors_front', 'colors_back', 'finishing', 'qty_ordered',
  'delivery_deadline', 'special_requirements',
] as const;

export interface PreflightResult {
  pass:     boolean;
  warnings: string[];
  errors:   string[];
  dpi:         number | null;
  colorspace:  string | null;
  bleedMm:     number | null;
  tacPct:      number | null;
}

export interface TechCardResult {
  orderId:           string;
  completenessScore: number;
  missingFields:     string[];
  techCardJson:      Record<string, unknown>;
  preflight:         PreflightResult | null;
  confidence:        number;
  autoExecuted:      boolean;
}

@Injectable()
export class PrepressAssistantService {
  private readonly logger = new Logger(PrepressAssistantService.name);

  constructor(
    private readonly ai:     AiRouterService,
    private readonly logSvc: AiDecisionLogService,
  ) {}

  private calcCompleteness(surveyFields: Record<string, unknown>): { score: number; missing: string[] } {
    const missing = REQUIRED_FIELDS.filter(
      (f) => !surveyFields[f] || String(surveyFields[f]).trim() === '',
    );
    const filled  = REQUIRED_FIELDS.length - missing.length;
    return { score: safeDiv(filled, REQUIRED_FIELDS.length), missing };
  }

  private runPreflight(
    meta: { dpi?: number; colorspace?: string; bleedMm?: number; tacPct?: number },
    printTech?: string,
  ): PreflightResult {
    const errors:   string[] = [];
    const warnings: string[] = [];

    if (meta.dpi !== undefined && meta.dpi < MIN_DPI) {
      errors.push(`DPI yetarli emas: ${meta.dpi} (min ${MIN_DPI})`);
    }
    if (meta.colorspace && meta.colorspace.toUpperCase() !== 'CMYK') {
      errors.push(`RGB topildi — CMYK kerak (joriy: ${meta.colorspace})`);
    }
    if (meta.bleedMm !== undefined) {
      if (meta.bleedMm < REQUIRED_BLEED_MM) {
        warnings.push(`Bleed kam: ${meta.bleedMm}mm (tavsiya: ${REQUIRED_BLEED_MM}mm)`);
      }
      if (meta.bleedMm === 0) {
        errors.push('Kesish belgisi (crop marks) bleed zonasida bo\'lishi shart — bleed 0mm, crop marks joylashmagan');
      }
    }
    const tacLimit = printTech?.toUpperCase() === 'FLEXO' ? MAX_TAC_FLEXO : MAX_TAC_OFFSET;
    if (meta.tacPct !== undefined && meta.tacPct > tacLimit) {
      errors.push(`TAC ${printTech ?? 'OFFSET'} chegaradan oshdi: ${meta.tacPct}% (max ${tacLimit}%)`);
    }

    return {
      pass: errors.length === 0,
      errors, warnings,
      dpi: meta.dpi ?? null,
      colorspace: meta.colorspace ?? null,
      bleedMm: meta.bleedMm ?? null,
      tacPct: meta.tacPct ?? null,
    };
  }

  /**
   * Vision pre-flight: asks Gemini to predict the likely file-quality parameters
   * (DPI, colorspace, bleed, TAC) from the order spec when the caller has not
   * supplied physical file metadata.  This mirrors the AI-Vision pre-flight step
   * specified in the Sprint-5 task without requiring a file upload endpoint.
   */
  private async runVisionPreflight(
    surveyFields: Record<string, unknown>,
  ): Promise<{ dpi?: number; colorspace?: string; bleedMm?: number; tacPct?: number }> {
    const prompt = [
      'You are a senior prepress technician at a commercial print plant.',
      'Based on the print order specification below, predict the most likely',
      'file-quality parameters that the customer\'s artwork will have.',
      'Return ONLY valid JSON with keys: dpi (integer), colorspace ("CMYK"|"RGB"),',
      'bleedMm (number), tacPct (number 0-400).',
      'Order spec: ' + JSON.stringify(surveyFields),
    ].join(' ');

    const res = await this.ai.call({ prompt, provider: 'gemini', taskType: 'prepress.vision_preflight', userId: 0 });
    if (isErr(res)) {
      this.logger.warn({ msg: 'Gemini Vision preflight failed', err: res.error });
      return {};
    }
    const text = res.data.text ?? '';
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) {
      this.logger.warn({ msg: 'Gemini Vision preflight: no JSON in response', snippet: text.slice(0, 120) });
      return {};
    }
    try {
      return JSON.parse(match[0]) as { dpi?: number; colorspace?: string; bleedMm?: number; tacPct?: number };
    } catch (parseErr) {
      this.logger.warn({ msg: 'Gemini Vision preflight: JSON parse error', err: parseErr });
      return {};
    }
  }

  async generateTechCard(
    orderId:       string,
    surveyFields:  Record<string, unknown>,
    fileMeta?:     { dpi?: number; colorspace?: string; bleedMm?: number; tacPct?: number },
  ): Promise<TechCardResult> {
    const start          = Date.now();
    const canonicalInput = { orderId, surveyFields, fileMeta: fileMeta ?? null };
    const inputHash      = this.logSvc.hashInput(canonicalInput);

    const cached = await this.logSvc.findCachedDecision(AGENT_CODES.PREPRESS_ASSISTANT, inputHash)
      .catch((err: unknown) => {
        this.logger.warn({ msg: 'Cache lookup failed; computing fresh', agentCode: AGENT_CODES.PREPRESS_ASSISTANT, err });
        return null;
      });
    if (cached) {
      const stored = cached.alternatives[0] as { techCardJson: Record<string, unknown>; preflight: PreflightResult | null; completenessScore: number; missingFields: string[] } | undefined;
      if (stored) {
        return { orderId, completenessScore: stored.completenessScore, missingFields: stored.missingFields, techCardJson: stored.techCardJson, preflight: stored.preflight, confidence: cached.confidence, autoExecuted: cached.action === 'auto_approve' };
      }
    }

    const { score, missing } = this.calcCompleteness(surveyFields);
    const printTech = surveyFields['print_tech'] as string | undefined;

    const effectiveMeta = fileMeta ?? await this.runVisionPreflight(surveyFields);
    const preflight     = Object.keys(effectiveMeta).length > 0
      ? this.runPreflight(effectiveMeta, printTech)
      : null;

    const missingNote = score < COMPLETENESS_THRESHOLD
      ? `ESLATMA: Quyidagi maydonlar yetishmayapti: ${missing.join(', ')}.`
      : '';

    const prompt = `
EuroPrint texnik karta generatsiya.
Buyurtma ma'lumotlari: ${JSON.stringify(surveyFields)}
${missingNote}
Texnik karta JSON formatida (print_tech, paper, dimensions, colors, finishing, special_notes).
Faqat JSON qaytaring: {}
`.trim();

    const aiRes = await this.ai.call({ prompt, provider: 'gemini', taskType: 'mes.quality_prediction', userId: 0 });

    let techCardJson: Record<string, unknown> = { ...surveyFields };
    let confidence = 0.80;

    if (!isErr(aiRes) && aiRes.data.text) {
      const match = aiRes.data.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as Record<string, unknown>;
          techCardJson  = { ...surveyFields, ...parsed };
          if (typeof parsed['confidence'] === 'number') confidence = parsed['confidence'];
        } catch {
          this.logger.warn({ msg: 'AI response JSON parse failed, using defaults' });
        }
      }
    }

    const autoExecuted = score >= COMPLETENESS_THRESHOLD && confidence >= AI_AUTO_CONFIDENCE_THRESHOLD && (preflight?.pass ?? true);
    const latencyMs    = Date.now() - start;

    await this.logSvc.log({
      agentCode:    AGENT_CODES.PREPRESS_ASSISTANT,
      entityType:   'tech_card',
      entityId:     orderId,
      inputData:    canonicalInput,
      decision:     { action: autoExecuted ? 'auto_approve' : 'hitl', confidence, alternatives: [{ techCardJson, preflight, completenessScore: score, missingFields: missing }] },
      confidence,
      modelVersion: AI_GEMINI_MODEL,
      autoExecuted,
      latencyMs,
    });

    return { orderId, completenessScore: score, missingFields: missing, techCardJson, preflight, confidence, autoExecuted };
  }
}
