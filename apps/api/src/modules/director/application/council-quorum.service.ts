/**
 * @module council-quorum.service
 * @description Kengash kvorumi va qaror natijasi (Batch 5 Item 8, egasi qarori — decisions/04-coordination.md
 *   BO'LIM 1). Kvorum = ovoz beruvchi a'zolarning kamida 2/3 qismi hozir bo'lsa. Kvorum yetmasa qaror
 *   "maslahat" (advisory, majburiy emas). Kvorum bo'lsa qaror oddiy ko'pchilik bilan; teng bo'lsa Rais hal qiladi.
 *   Rule 6: barcha matematik hisob shu servisda; controller faqat delegat qiladi.
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
  quorumFraction: string;       // "2/3"
  quorumRequired: number;       // ceil(2/3 * votingMembers)
}

export type DecisionOutcome = 'advisory' | 'approved' | 'rejected' | 'chair_tiebreak';

export interface DecisionResult extends QuorumInfo {
  presentCount: number;
  votesFor: number;
  votesAgainst: number;
  quorumMet: boolean;
  outcome: DecisionOutcome;
}

/** ceil(num/den * n) without float error. */
function quorumRequired(n: number): number {
  return Math.ceil((n * COUNCIL_QUORUM_NUMERATOR) / COUNCIL_QUORUM_DENOMINATOR);
}

@Injectable()
export class CouncilQuorumService {
  constructor(private readonly membersRepo: CouncilMembersRepository) {}

  async getQuorum(councilId: number): Promise<Result<QuorumInfo>> {
    const countR = await this.membersRepo.countVotingMembers(councilId);
    if (!countR.ok) return Err(countR.error);
    const votingMembers = countR.data;
    return Ok({
      councilId,
      votingMembers,
      quorumFraction: `${COUNCIL_QUORUM_NUMERATOR}/${COUNCIL_QUORUM_DENOMINATOR}`,
      quorumRequired: quorumRequired(votingMembers),
    });
  }

  /**
   * Evaluate a council decision against the 2/3 quorum + simple-majority rule.
   * presentCount clamps to [0, votingMembers]; votesFor+votesAgainst must not exceed presentCount.
   */
  async evaluateDecision(
    councilId: number,
    input: { presentCount: number; votesFor: number; votesAgainst: number },
  ): Promise<Result<DecisionResult>> {
    return safeCall(async () => {
      const countR = await this.membersRepo.countVotingMembers(councilId);
      if (!countR.ok) throw new Error(countR.error.message);
      const votingMembers = countR.data;
      const required = quorumRequired(votingMembers);
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
        quorumFraction: `${COUNCIL_QUORUM_NUMERATOR}/${COUNCIL_QUORUM_DENOMINATOR}`,
        quorumRequired: required,
        presentCount: present, votesFor, votesAgainst,
        quorumMet, outcome,
      };
    });
  }
}
