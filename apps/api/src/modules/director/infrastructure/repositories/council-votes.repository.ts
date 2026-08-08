/**
 * @module council-votes.repository
 * @description Kengash a'zolarining har-biri (per-member) ovoz yozuvlari (council_votes) —
 *   modul 04 Coordination, egasi qarori 2026-07-13 (chat): council-quorum.service.ts'ning
 *   evaluateDecision() ilgari faqat agregat presentCount/votesFor/votesAgainst integerlarini
 *   qabul qilardi — har bir a'zoning ovozi alohida saqlanmasdi. Bu jadval har bir a'zoning
 *   har bir qarorga (decision_ref — erkin matn: dokla/rasporyazhenie ID yoki boshqa
 *   qaror-havolasi) bergan ovozini saqlaydi; council-members.controller.ts shu yozuvlardan
 *   agregat tally hisoblab evaluateDecision()ga uzatadi. Eski aggregat-integer yo'l
 *   (POST /councils/:councilId/quorum/evaluate to'g'ridan presentCount/votesFor/votesAgainst
 *   bilan) o'zgarmasdan ishlayveradi (Q-46 — yagona chaqiruvchi shu controller edi).
 *
 * NOTE: council_members.repository.ts bilan bir xil konvensiya — council_id/voter_user_id
 *   ustida FK yo'q (council_members ham council_id/user_id ustida FK saqlamaydi, live
 *   tekshirilgan 2026-07-13).
 * @layer Repository (Director / Coordination)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export type CouncilVoteChoice = 'for' | 'against' | 'abstain';

export interface CouncilVoteRow {
  id: number;
  council_id: number;
  decision_ref: string;
  voter_user_id: number;
  vote: CouncilVoteChoice;
  voted_at: string;
}

export interface VoteTally {
  presentCount: number;
  votesFor: number;
  votesAgainst: number;
}

@Injectable()
export class CouncilVotesRepository {
  // Bir a'zo bir qarorga (council_id + decision_ref) faqat bitta ovoz beradi — qayta
  // yuborsa ovozi yangilanadi (upsert), council-members.repository.ts'ning add() bilan bir xil naqsh.
  async recordVote(
    councilId: number,
    decisionRef: string,
    voterUserId: number,
    vote: CouncilVoteChoice,
  ): Promise<Result<{ id: number }>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO council_votes (council_id, decision_ref, voter_user_id, vote)
        VALUES (${councilId}, ${decisionRef}, ${voterUserId}, ${vote})
        ON CONFLICT (council_id, decision_ref, voter_user_id)
        DO UPDATE SET vote = EXCLUDED.vote, voted_at = NOW()
        RETURNING id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Ovoz saqlanmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id });
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async listVotes(councilId: number, decisionRef: string): Promise<Result<CouncilVoteRow[]>> {
    try {
      const r = await runQuery<CouncilVoteRow>(sql`
        SELECT id, council_id, decision_ref, voter_user_id, vote, voted_at
        FROM council_votes
        WHERE council_id = ${councilId} AND decision_ref = ${decisionRef}
        ORDER BY voted_at
      `);
      return Ok(r.rows);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  // Har bir a'zoning ovozini presentCount/votesFor/votesAgainst agregatiga aylantiradi —
  // ovoz bergan (for/against/abstain, farqi yo'q) a'zo kvorumga sanaladigan "hozir" a'zo.
  async tallyVotes(councilId: number, decisionRef: string): Promise<Result<VoteTally>> {
    try {
      const r = await runQuery<{ present_count: number; votes_for: number; votes_against: number }>(sql`
        SELECT
          COUNT(*)::int AS present_count,
          COUNT(*) FILTER (WHERE vote = 'for')::int AS votes_for,
          COUNT(*) FILTER (WHERE vote = 'against')::int AS votes_against
        FROM council_votes
        WHERE council_id = ${councilId} AND decision_ref = ${decisionRef}
      `);
      const row = r.rows[0];
      return Ok({
        presentCount: Number(row?.present_count ?? 0),
        votesFor: Number(row?.votes_for ?? 0),
        votesAgainst: Number(row?.votes_against ?? 0),
      });
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }
}
