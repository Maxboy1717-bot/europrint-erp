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
