/**
 * @module lead-scorer.service
 * @description Heuristic lead-quality scorer. Takes a lead's contact and firmographic
 *   data and returns a 0..100 score plus the breakdown of which factors contributed.
 *   Used by the CRM dashboard to triage incoming leads (hot/warm/cold) and decide
 *   who SDRs should call first.
 * @layer Domain Service (CRM — pure compute, no I/O, no DB)
 *
 * WHY HEURISTIC, NOT ML
 *   We deliberately avoid a learned model here because:
 *     1. Explainability — sales managers need to see exactly why a lead scored
 *        what it did ("budget >100M = +25 points"). A black-box model breaks
 *        coaching conversations with SDRs.
 *     2. Data volume — our lead corpus is small (hundreds, not millions). ML
 *        would overfit; the rules-based scorer encodes the sales playbook.
 *     3. Speed of iteration — when sales playbook changes, edit the constants
 *        here and ship. No retraining cycle.
 *
 * WHY POINT VALUES ARE NOT EXTRACTED TO CONSTANTS
 *   They COULD live in business.constants.ts, but the breakdown labels are
 *   tightly coupled to the point values for display purposes ("Yuqori byudjet
 *   (100M+) = 25 ball"). Keeping both inline at the call site means changes
 *   stay co-located. If the playbook gets large enough to be configurable per
 *   tenant, move it to a JSON config — at that point ML becomes plausible too.
 *
 * WHY `score` IS CLAMPED TO 0..100
 *   Sales managers expect a percentage-style scale. We let intermediate sums
 *   exceed 100 (so a "perfect" lead with negative-aged decay can still be
 *   "100") and only clamp at the end. The negative `-10` for old leads is the
 *   only term that can pull score below the natural sum.
 */

import { Injectable , Logger} from '@nestjs/common';
import { Ok, Result, AppError } from '@common/result';

export interface LeadScoreInput {
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  budget?: number | null;
  source?: string | null;
  interactionCount?: number;
  hasAddress?: boolean;
  hasWebsite?: boolean;
  employeeCount?: number | null;
  industry?: string | null;
  daysSinceCreated?: number;
}

export interface LeadScoreBreakdown {
  score: number;
  factors: Array<{ label: string; points: number }>;
  tier: 'hot' | 'warm' | 'cold';
  recommendation: string;
}

@Injectable()
export class LeadScorerService {
  private readonly logger = new Logger(LeadScorerService.name);

  /**
   * @description Score a lead and produce a breakdown explaining each
   *   contribution. Total runs through `Math.max(0, Math.min(100, ...))` so
   *   downstream consumers can treat it as a percentage without further
   *   sanitization.
   *
   *   Tier thresholds:
   *     hot   ≥ 70  →  contact immediately, high conversion likelihood
   *     warm  ≥ 40  →  track + enrich before reaching out
   *     cold  < 40  →  drop into nurture/drip campaign
   *
   *   Score breakdown table (when present in input):
   *     +10 email, +10 phone, +15 company name
   *     +25 / +15 / +5 budget tiers (>=100M / >=10M / else)
   *     +20 / +10 / +5 source (referral / direct / social)
   *     +15 / +8  interaction count (>=5 / >=2)
   *     +5  website mentioned
   *     +10 employeeCount >= 50 (mid-market or larger)
   *     +5  recently created (<= 7 days)
   *     -10 stale (>= 60 days)
   * @param input - all fields optional; missing fields simply skip their factor.
   * @returns Always Ok(...) — the scorer cannot fail on valid input shape.
   *   The Result wrapper is preserved for API-symmetry with sibling services.
   */
  calculateScore(input: LeadScoreInput): Result<LeadScoreBreakdown, AppError> {
    this.logger.log(`Lead ball hisoblanmoqda: ${input.email ?? input.company ?? "no-id"}`);
    const factors: Array<{ label: string; points: number }> = [];
    let score = 0;

    if (input.email) {
      factors.push({ label: 'Email mavjud', points: 10 });
      score += 10;
    }

    if (input.phone) {
      factors.push({ label: 'Telefon mavjud', points: 10 });
      score += 10;
    }

    if (input.company) {
      factors.push({ label: 'Kompaniya nomi', points: 15 });
      score += 15;
    }

    // WHY budget thresholds 10M / 100M UZS:
    //   Our packaging line has a minimum order value around 5M UZS. A "small
    //   budget" lead still pays for itself; the +5 reflects that. 10M is the
    //   reorder-threshold where customers tend to become repeat buyers. 100M+
    //   is a strategic account — worth a directors-level intro.
    if (input.budget) {
      if (input.budget >= 100_000_000) {
        factors.push({ label: 'Yuqori byudjet (100M+)', points: 25 });
        score += 25;
      } else if (input.budget >= 10_000_000) {
        factors.push({ label: 'O\'rta byudjet (10M+)', points: 15 });
        score += 15;
      } else {
        factors.push({ label: 'Kichik byudjet', points: 5 });
        score += 5;
      }
    }

    if (input.source === 'referral') {
      factors.push({ label: 'Tavsiya orqali keldi', points: 20 });
      score += 20;
    } else if (input.source === 'direct') {
      factors.push({ label: 'To\'g\'ridan-to\'g\'ri', points: 10 });
      score += 10;
    } else if (input.source === 'social') {
      factors.push({ label: 'Ijtimoiy tarmoq', points: 5 });
      score += 5;
    }

    const interactions = input.interactionCount ?? 0;
    if (interactions >= 5) {
      factors.push({ label: '5+ muloqot', points: 15 });
      score += 15;
    } else if (interactions >= 2) {
      factors.push({ label: '2+ muloqot', points: 8 });
      score += 8;
    }

    if (input.hasWebsite) {
      factors.push({ label: 'Vebsayt mavjud', points: 5 });
      score += 5;
    }

    if (input.employeeCount && input.employeeCount >= 50) {
      factors.push({ label: 'Katta kompaniya (50+)', points: 10 });
      score += 10;
    }

    // WHY 7-day boost and 60-day penalty:
    //   B2B packaging cycles average ~30-45 days from first contact to first
    //   order. <=7 days = fresh, top of attention. >=60 days without progress
    //   means we've been outpaced by a competitor or lost internal sponsor —
    //   we down-weight to reflect that the lead must be re-qualified, not
    //   just contacted.
    const days = input.daysSinceCreated ?? 0;
    if (days <= 7) {
      factors.push({ label: 'So\'nggi 1 hafta', points: 5 });
      score += 5;
    } else if (days >= 60) {
      factors.push({ label: '60+ kun (sovib ketgan)', points: -10 });
      score -= 10;
    }

    const finalScore = Math.max(0, Math.min(100, score));

    let tier: 'hot' | 'warm' | 'cold';
    let recommendation: string;
    if (finalScore >= 70) {
      tier = 'hot';
      recommendation = 'Zudlik bilan bog\'laning — yuqori konversiya imkoniyati';
    } else if (finalScore >= 40) {
      tier = 'warm';
      recommendation = 'Kuzatib boring — qo\'shimcha ma\'lumot to\'plang';
    } else {
      tier = 'cold';
      recommendation = 'Nurturing kampaniyasiga qo\'shing';
    }

    return Ok({ score: finalScore, factors, tier, recommendation });
  }
}
