import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { safeDiv } from '@common/math/math-utils';
import { AiRouterService } from '../../ai/application/services/ai-router.service';
import { isErr } from '@common/result';
import { AiDecisionLogService } from '../common/ai-decision-log.service';
import {
  AI_AUTO_CONFIDENCE_THRESHOLD,
  AGENT_CODES,
  AI_GEMINI_MODEL,
  NEW_TIER_DISCOUNT,
  REGULAR_TIER_DISCOUNT,
  VIP_TIER_DISCOUNT,
  PEAK_SEASON_MULT,
  NORMAL_SEASON_MULT,
  LOW_SEASON_MULT,
  PRICE_LOW_MARGIN,
  PRICE_MID_MARGIN,
  PRICE_HIGH_MARGIN,
  RISK_W1, RISK_W2, RISK_W3, RISK_W4,
  RISK_AUTO_THRESHOLD,
  HITL_PRICE_HARD_UZS,
  HITL_PRICE_SOFT_UZS,
  HITL_CREDIT_HARD,
  HITL_CREDIT_SOFT,
} from '../common/ai-agents.constants';

const PEAK_MONTHS   = [10, 11, 12, 1];
const LOW_MONTHS    = [6, 7, 8];
const MAX_CREDIT    = 0.95;

export interface PriceVariant {
  label:      'low' | 'medium' | 'high';
  price:      number;
  marginPct:  number;
}

export interface SalesCopilotResult {
  orderId:                string;
  variants:               PriceVariant[];
  recommended:            PriceVariant;
  confidence:             number;
  autoExecuted:           boolean;
  riskScore:              number;
  riskAuto:               boolean;
  explanation:            string;
  requiresDirectorApproval: boolean;
  hitlReason:             string | null;
}

interface CustomerProfile {
  tier:            'NEW' | 'REGULAR' | 'VIP';
  inn:             string | null;
  innValid:        boolean;
  overdueCount:    number;
  totalOrders:     number;
  completedOrders: number;
  outstandingDebt: number;
  creditLimit:     number;
}

@Injectable()
export class SalesCopilotService {
  private readonly logger = new Logger(SalesCopilotService.name);

  constructor(
    private readonly ai:      AiRouterService,
    private readonly logSvc:  AiDecisionLogService,
    private readonly events:  EventEmitter2,
  ) {}

  private seasonMultiplier(): number {
    const month = new Date().getMonth() + 1;
    if (PEAK_MONTHS.includes(month)) return PEAK_SEASON_MULT;
    if (LOW_MONTHS.includes(month))  return LOW_SEASON_MULT;
    return NORMAL_SEASON_MULT;
  }

  private tierDiscount(tier: string): number {
    if (tier === 'VIP')     return VIP_TIER_DISCOUNT;
    if (tier === 'REGULAR') return REGULAR_TIER_DISCOUNT;
    return NEW_TIER_DISCOUNT;
  }

  private buildVariants(baseCost: number, tier: string): PriceVariant[] {
    const disc   = this.tierDiscount(tier);
    const season = this.seasonMultiplier();
    const build  = (mult: number, label: PriceVariant['label']): PriceVariant => {
      const price     = baseCost * mult * (1 - disc) * season;
      const marginPct = safeDiv(price - baseCost, price) * 100;
      return { label, price: Math.round(price), marginPct: Math.round(marginPct * 10) / 10 };
    };
    return [
      build(PRICE_LOW_MARGIN,  'low'),
      build(PRICE_MID_MARGIN,  'medium'),
      build(PRICE_HIGH_MARGIN, 'high'),
    ];
  }

  private calcRisk(profile: CustomerProfile): number {
    const innScore      = profile.innValid ? 1.0 : 0.0;
    const payScore      = 1 - safeDiv(profile.overdueCount, profile.totalOrders);
    const orderScore    = Math.min(1.0, safeDiv(profile.completedOrders, 3));
    const creditScore   = 1 - Math.min(MAX_CREDIT, safeDiv(profile.outstandingDebt, profile.creditLimit));
    return RISK_W1 * innScore + RISK_W2 * payScore + RISK_W3 * orderScore + RISK_W4 * creditScore;
  }

  async evaluate(
    orderId:   string,
    baseCost:  number,
    profile:   CustomerProfile,
  ): Promise<SalesCopilotResult> {
    const start     = Date.now();
    const riskScore = this.calcRisk(profile);

    // --- Idempotency: short-circuit before AI if same input seen within 1h ---
    // Include orderId so the cache is scoped per order — same cost+tier for two different
    // orders must not produce a cache hit that skips fresh decisioning.
    const inputData = { orderId, baseCost, tier: profile.tier, riskScore };
    const inputHash = this.logSvc.hashInput(inputData);
    const cached    = await this.logSvc.findCachedDecision(AGENT_CODES.SALES_COPILOT, inputHash).catch((err: unknown) => {
      this.logger.warn({ msg: 'SalesCopilot cache lookup failed; computing fresh', orderId, err });
      return null;
    });
    if (cached) {
      this.logger.debug({ msg: 'SalesCopilot cache hit — skipping AI call', orderId, hash: inputHash.slice(0, 8) });
      const cachedChoice = cached.action.replace('price_', '') as PriceVariant['label'];
      const variants     = this.buildVariants(baseCost, profile.tier);
      const recommended  = variants.find((v) => v.label === cachedChoice) ?? variants[1];
      return {
        orderId,
        variants,
        recommended,
        confidence:               cached.confidence,
        autoExecuted:             false,
        riskScore,
        riskAuto:                 riskScore >= RISK_AUTO_THRESHOLD,
        explanation:              'Kesh qaror (1 soat idempotentlik oynasi)',
        requiresDirectorApproval: false,
        hitlReason:               null,
      };
    }

    const variants = this.buildVariants(baseCost, profile.tier);

    const prompt = `
EuroPrint narx tavsiyasi.
Mijoz: tier=${profile.tier}, risk=${riskScore.toFixed(2)}, INN_valid=${profile.innValid}
Narx variantlari:
${variants.map((v) => `  ${v.label}: ${v.price.toLocaleString()} UZS (margin ${v.marginPct}%)`).join('\n')}
Qaysi variantni tavsiya qilasiz? Faqat JSON: {"choice":"low"|"medium"|"high","confidence":0.xx,"reason":"..."}
`.trim();

    const aiRes = await this.ai.call({ prompt, provider: 'gemini', taskType: 'crm.next_best_action', userId: 0 });

    let choice: PriceVariant['label'] = 'medium';
    let confidence = 0.75;
    let explanation = 'O\'rtacha narx tavsiyasi';

    if (!isErr(aiRes) && aiRes.data.text) {
      const match = aiRes.data.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as { choice?: string; confidence?: number; reason?: string };
          if (parsed.choice === 'low' || parsed.choice === 'medium' || parsed.choice === 'high') {
            choice = parsed.choice;
          }
          if (typeof parsed.confidence === 'number') confidence = parsed.confidence;
          if (typeof parsed.reason === 'string')     explanation = parsed.reason;
        } catch {
          this.logger.warn({ msg: 'AI sales response JSON parse failed, using defaults' });
        }
      }
    }

    const recommended  = variants.find((v) => v.label === choice) ?? variants[1];
    const creditUtil   = profile.creditLimit > 0
      ? safeDiv(profile.outstandingDebt, profile.creditLimit)
      : 0;
    // Hard HITL: blocks auto-execution entirely
    const hitlRisk       = riskScore < RISK_AUTO_THRESHOLD;
    const hitlPriceHard  = recommended.price > HITL_PRICE_HARD_UZS;
    const hitlCreditHard = creditUtil > HITL_CREDIT_HARD;
    const autoExecuted   = confidence >= AI_AUTO_CONFIDENCE_THRESHOLD
      && !hitlRisk && !hitlPriceHard && !hitlCreditHard;

    // Soft HITL: auto-executes but requires Director approval notification
    const hitlPriceSoft  = !hitlPriceHard && recommended.price > HITL_PRICE_SOFT_UZS;
    const hitlCreditSoft = !hitlCreditHard && creditUtil > HITL_CREDIT_SOFT;
    const requiresDirectorApproval = autoExecuted && (hitlPriceSoft || hitlCreditSoft);
    const hitlReason: string | null = requiresDirectorApproval
      ? [
          hitlPriceSoft  ? `price ${recommended.price.toLocaleString()} UZS exceeds soft cap 50M` : '',
          hitlCreditSoft ? `credit utilisation ${(creditUtil * 100).toFixed(1)}% exceeds soft cap 10%` : '',
        ].filter(Boolean).join('; ')
      : null;

    const latencyMs = Date.now() - start;

    await this.logSvc.log({
      agentCode:    AGENT_CODES.SALES_COPILOT,
      entityType:   'order',
      entityId:     orderId,
      inputData,
      decision:     { action: `price_${choice}`, confidence, alternatives: variants },
      confidence,
      modelVersion: AI_GEMINI_MODEL,
      autoExecuted,
      latencyMs,
    });

    const result: SalesCopilotResult = {
      orderId,
      variants,
      recommended,
      confidence,
      autoExecuted,
      riskScore,
      riskAuto: riskScore >= RISK_AUTO_THRESHOLD,
      explanation,
      requiresDirectorApproval,
      hitlReason,
    };

    if (autoExecuted) {
      this.events.emit('sales.copilot.auto_price', {
        orderId,
        choice,
        price:       recommended.price,
        confidence,
        timestamp:   new Date(),
      });

      this.events.emit('sales.copilot.pdf_dispatch', {
        orderId,
        customerId:    profile.inn ?? orderId,
        recommendedPrice: recommended.price,
        marginPct:     recommended.marginPct,
        variants,
        confidence,
        timestamp:     new Date(),
      });
    }

    if (requiresDirectorApproval) {
      this.events.emit('sales.copilot.director_approval_required', {
        orderId,
        price:      recommended.price,
        creditUtil,
        hitlReason,
        confidence,
        timestamp:  new Date(),
      });
    }

    return result;
  }
}
