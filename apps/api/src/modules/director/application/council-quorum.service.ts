/**
 * @module council-quorum.service
 * @description Kengash kvorumi va qaror natijasi (Batch 5 Item 8, egasi qarori — decisions/04-coordination.md
 *   BO'LIM 1). Kvorum = ovoz beruvchi a'zolarning kamida 2/3 qismi hozir bo'lsa. Kvorum yetmasa qaror
 *   "maslahat" (advisory, majburiy emas). Kvorum bo'lsa qaror oddiy ko'pchilik bilan; teng bo'lsa Rais hal qiladi.
 *   Rule 6: barcha matematik hisob shu servisda; controller faqat delegat qiladi.
 *
 *   Owner decision 2026-07-13 (chat): kvorum nisbati endi HAR BIR kengash uchun CRUD orqali
 *   sozlanadigan (councils.quorum_numerator/quorum_denominator — PATCH /coordination/councils/:id).
 *   NULL bo'lgan ustun(lar) — global COUNCIL_QUORUM_NUMERATOR/DENOMINATOR konstantalariga
 *   qaytadi (additive fallback, regressiya yo'q).
 */

import { Injectable } from '@nestjs/common';
import { Result, Ok, Err } from '@common/result';
import { safeCall } from '@common/result';
import {
  COUNCIL_QUORUM_NUMERATOR, COUNCIL_QUORUM_DENOMINATOR,
} from '@common/constants/business.constants';
import { CouncilMembersRepository } from '../infrastructure/repositories/council-members.repository';

export interface QuorumInfo {
  councilId: number;
  votingMembers: number;
  quorumFraction: string;       // "2/3" (per-council override, agar sozlangan bo'lsa)
  quorumRequired: number;       // ceil(numerator/denominator * votingMembers)
}

export type DecisionOutcome = 'advisory' | 'approved' | 'rejected' | 'chair_tiebreak';

export interface DecisionResult extends QuorumInfo {
  presentCount: number;
  votesFor: number;
  votesAgainst: number;
  quorumMet: boolean;
  outcome: DecisionOutcome;
}

interface QuorumFraction { numerator: number; denominator: number }

/** ceil(numerator/denominator * n) without float error. */
function quorumRequired(n: number, fraction: QuorumFraction): number {
  return Math.ceil((n * fraction.numerator) / fraction.denominator);
}

@Injectable()
export class CouncilQuorumService {
  constructor(private readonly membersRepo: CouncilMembersRepository) {}

  /**
   * Resolves the quorum numerator/denominator for a council: the council's own
   * councils.quorum_numerator/quorum_denominator override if both are set (and denominator > 0),
   * otherwise the global COUNCIL_QUORUM_NUMERATOR/DENOMINATOR constants.
   */
  private async resolveQuorumFraction(councilId: number): Promise<Result<QuorumFraction>> {
    const overrideR = await this.membersRepo.getQuorumOverride(councilId);
    if (!overrideR.ok) return Err(overrideR.error);
    const { numerator, denominator } = overrideR.data;
    if (numerator !== null && denominator !== null && denominator > 0) {
      return Ok({ numerator, denominator });
    }
    return Ok({ numerator: COUNCIL_QUORUM_NUMERATOR, denominator: COUNCIL_QUORUM_DENOMINATOR });
  }

  async getQuorum(councilId: number): Promise<Result<QuorumInfo>> {
    const countR = await this.membersRepo.countVotingMembers(councilId);
    if (!countR.ok) return Err(countR.error);
    const votingMembers = countR.data;
    const fractionR = await this.resolveQuorumFraction(councilId);
    if (!fractionR.ok) return Err(fractionR.error);
    const fraction = fractionR.data;
    return Ok({
      councilId,
      votingMembers,
      quorumFraction: `${fraction.numerator}/${fraction.denominator}`,
      quorumRequired: quorumRequired(votingMembers, fraction),
    });
  }

  /**
   * Evaluate a council decision against the (per-council or global default) quorum fraction +
   * simple-majority rule. presentCount clamps to [0, votingMembers]; votesFor+votesAgainst must
   * not exceed presentCount.
   */
  async evaluateDecision(
    councilId: number,
    input: { presentCount: number; votesFor: number; votesAgainst: number },
  ): Promise<Result<DecisionResult>> {
    return safeCall(async () => {
      const countR = await this.membersRepo.countVotingMembers(councilId);
      if (!countR.ok) throw new Error(countR.error.message);
      const votingMembers = countR.data;
      const fractionR = await this.resolveQuorumFraction(councilId);
      if (!fractionR.ok) throw new Error(fractionR.error.message);
      const fraction = fractionR.data;
      const required = quorumRequired(votingMembers, fraction);
      const present = Math.max(0, Math.min(input.presentCount, votingMembers));
      const votesFor = Math.max(0, input.votesFor);
      const votesAgainst = Math.max(0, input.votesAgainst);
      const quorumMet = votingMembers > 0 && present >= required;

      let outcome: DecisionOutcome;
      if (!quorumMet) {
        outcome = 'advisory';                       // kvorum yetmadi → maslahat (kuchsiz)
      } else if (votesFor > votesAgainst) {
        outcome = 'approved';                       // oddiy ko'pchilik
      } else if (votesFor < votesAgainst) {
        outcome = 'rejected';
      } else {
        outcome = 'chair_tiebreak';                 // teng → Rais hal qiladi
      }

      return {
        councilId, votingMembers,
        quorumFraction: `${fraction.numerator}/${fraction.denominator}`,
        quorumRequired: required,
        presentCount: present, votesFor, votesAgainst,
        quorumMet, outcome,
      };
    });
  }
}
