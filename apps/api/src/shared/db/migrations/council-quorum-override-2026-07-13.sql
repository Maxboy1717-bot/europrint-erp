-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Modul 04 (Coordination) — kengash kvorumi endi HAR BIR kengash uchun CRUD orqali
-- sozlanadigan (owner qarori, 2026-07-13 chat). Avval COUNCIL_QUORUM_NUMERATOR/DENOMINATOR
-- (business.constants.ts, 2/3) BARCHA kengashlarga global qattiq-kodlangan edi.
-- councils.quorum_numerator/quorum_denominator — nullable: NULL qolsa
-- council-quorum.service.ts o'sha global konstantalarga qaytadi (additive, regressiya yo'q).
-- CRUD: mavjud PATCH /coordination/councils/:id (coordination.repository.ts updateCouncil).
--
-- council_votes — har bir a'zoning har bir qarorga (decision_ref) bergan alohida ovozi.
-- council-quorum.service.ts'ning evaluateDecision() ilgari faqat agregat
-- presentCount/votesFor/votesAgainst integer qabul qilardi (per-vote yozuv yo'q edi). Eski
-- aggregat-integer yo'l (POST /councils/:councilId/quorum/evaluate to'g'ridan
-- presentCount/votesFor/votesAgainst bilan) o'zgarmasdan ishlaydi (Q-46 — yagona chaqiruvchi
-- shu controller edi); yangi decisionRef yo'li council_votes yozuvlaridan tally hisoblaydi.
-- No FK constraints on council_id/voter_user_id — matches the existing council_members table's
-- own convention (council_members.council_id/user_id also carry no FK, verified live 2026-07-13).
ALTER TABLE IF EXISTS councils ADD COLUMN IF NOT EXISTS quorum_numerator INTEGER;
ALTER TABLE IF EXISTS councils ADD COLUMN IF NOT EXISTS quorum_denominator INTEGER;

CREATE TABLE IF NOT EXISTS council_votes (
  id            SERIAL PRIMARY KEY,
  council_id    INTEGER     NOT NULL,
  decision_ref  TEXT        NOT NULL,
  voter_user_id INTEGER     NOT NULL,
  vote          TEXT        NOT NULL,
  voted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_council_votes_decision_voter UNIQUE (council_id, decision_ref, voter_user_id),
  CONSTRAINT ck_council_votes_vote CHECK (vote IN ('for','against','abstain'))
);

CREATE INDEX IF NOT EXISTS idx_council_votes_decision ON council_votes (council_id, decision_ref);
CREATE INDEX IF NOT EXISTS idx_council_votes_voter ON council_votes (voter_user_id);
