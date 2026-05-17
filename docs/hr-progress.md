# HR Module Remediation — Progress Tracker

Reference: `docs/HR_PRODUCTION_AGENT_PROMPT.md` (V6 audit, 2026-05-17)
Branch: `worktree-agent-a80abbe3525039c21` (off `chore/clean-faza-3`)
Started: 2026-05-17

> Note: this worktree branched from `chore/clean-faza-3` very early in the
> sprint and never inherited the `docs/` tree that the master plan
> assumes. This file is the worktree-local progress tracker; the parent
> branch's tracker is at `docs/hr-progress.md` of `chore/clean-faza-3`
> and was last updated through Phase 1 Task 1.1.

## Phase Status (this worktree)

| Phase | Status | Sub-tasks | Notes |
|------:|:------:|:----------|-------|
| 5 — Recruiter Kanban | partial | 2/6 + endpoint fix | T5.1, T5.2 done; T5.3–T5.6 deferred |

## Phase 5 — Recruiter Kanban

### Pre-work reality check

The master plan claims the existing kanban moves cards via
`PATCH /api/hr/recruitment/funnel/:id/move`, but in the live code:

- `RecruitingKanban.tsx` (before this change) used
  `PATCH /api/hr/recruitment/pipeline/:id/stage` with body
  `{ funnel_stage }` — neither the method nor the body shape is
  registered. There is a registered route at
  `POST /api/hr/recruitment/pipeline/:id/stage` (in
  `apps/api/src/modules/hr/recruitment/hr-vacancies.controller.ts:124`)
  whose Zod schema (`HrUpdatePipelineStageSchema`) expects `{ stage }`.
- The non-existent endpoint silently returned 404; the UI showed a
  generic "Xatolik" toast — explaining the long-standing complaint
  that the kanban "doesn't actually move cards in prod".
- A separate state-machine endpoint exists at
  `PATCH /api/hr/recruitment/funnel/:id/move` (in
  `recruitment.controller.ts:94`, schema in
  `dto/create-funnel.dto.ts MoveFunnelStageDto`), but it is not the
  one wired to the FE pipeline cache.

Decision: route the optimistic mutation through the registered
`POST /api/hr/recruitment/pipeline/:id/stage` endpoint with the correct
`{ stage }` body, and also fix the legacy advance/reject buttons in the
same way. This unblocks T5.1 without forcing a backend-route migration
inside the same sprint. A backlog item should be opened later to
consolidate onto the proper CQRS state-machine endpoint.

The `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` and
`socket.io-client` packages are already in
`artifacts/erp-dashboard/package.json` — no install needed.

### T5.1 — Drag-drop with @dnd-kit — DONE

Files added:
- `artifacts/erp-dashboard/src/hooks/use-kanban-dnd.ts` (155 LOC) —
  `useKanbanDragDrop` hook. Wraps a `useMutation` with the
  onMutate / onError / onSettled optimistic pattern (snapshot cache,
  apply optimistic update, rollback on failure, invalidate on settle).
  All `.map`/`.filter` calls are array-safe (Rule 2). API call uses
  `apiRequest('POST', url, body)` (Rule F3).
- `artifacts/erp-dashboard/src/components/recruiting/KanbanColumn.tsx`
  (93 LOC) — `useDroppable` + `SortableContext` wrapper for a single
  stage column. Highlights when a card is dragged over it.
- `artifacts/erp-dashboard/src/components/recruiting/DraggableCandidateCard.tsx`
  (66 LOC) — `useSortable` wrapper around the existing `CandidateCard`.
  Uses an explicit drag handle (top-right grip) so the in-card action
  buttons (advance / reject / AI etc.) still work without triggering a
  drag.
- `artifacts/erp-dashboard/src/components/recruiting/KanbanBoardGrid.tsx`
  (128 LOC) — the `DndContext` + columns layout. Extracted from the
  page so the page stays under 300 lines.
- `artifacts/erp-dashboard/src/components/recruiting/VacancyFilterPanel.tsx`
  (198 LOC) — extracted from the page to keep `RecruitingKanban.tsx`
  within the 300-line budget (Rule 13). Pure presentation; no behaviour
  change.

Files modified:
- `artifacts/erp-dashboard/src/pages/RecruitingKanban.tsx` — wired up the
  hook, the grid, and the panel. Fixed the broken
  PATCH→`/pipeline/:id/stage` mutation to POST with the correct
  `{ stage }` body. Final size: **279 lines**.

Tests:
- `artifacts/erp-dashboard/src/hooks/__tests__/use-kanban-dnd.test.tsx`
  (6 vitest cases) — sensors expose handlers, dragstart tracks active
  entry, no-op when dropping on own column, optimistic update visible
  before fetch, rollback on API rejection, ignores `over=null`.
- `artifacts/erp-dashboard/src/components/recruiting/__tests__/KanbanColumn.test.tsx`
  (6 vitest cases) — renders label/count, loading state, empty
  placeholder, suppression while loading, child rendering,
  `data-stage` attribute.

### T5.2 — Real-time WebSocket sync — DONE

Files added:
- `apps/api/src/modules/hr/recruitment/recruitment.gateway.ts` (115 LOC)
  — Nest WebSocket gateway on the `/recruitment` namespace. JWT auth
  via `client.handshake.auth.token`; rejects unauthenticated and
  non-HR roles. Listens for `candidate.stage-changed` (EventEmitter2)
  and re-broadcasts as `candidate:moved` to all connected sockets.
- `artifacts/erp-dashboard/src/hooks/use-kanban-realtime.ts` (66 LOC)
  — `useKanbanRealtime` hook. Opens a Socket.io connection to
  `/recruitment` using the stored access token; on `candidate:moved`
  it invalidates the `/api/hr/recruitment/pipeline` query so the
  Kanban refreshes for all viewers.

Files modified:
- `apps/api/src/modules/hr/recruitment/recruitment-funnel.service.ts`
  — injected `EventEmitter2`; added the
  `CANDIDATE_STAGE_CHANGED_EVENT` constant + `CandidateStageChangedPayload`
  interface; emit after a successful funnel update inside
  `moveFunnelStage`.
- `apps/api/src/modules/hr/hr.module.ts` — registered
  `RecruitmentGateway` as a provider.

Tests:
- `artifacts/erp-dashboard/src/hooks/__tests__/use-kanban-realtime.test.tsx`
  (6 vitest cases) — subscribes to the right event, invalidates the
  pipeline query on emit, forwards payload to callback, handles null
  payload, cleans up on unmount, no-op when there is no access token.
- `apps/api/test/hr/recruitment-funnel-stage-change.spec.ts`
  (6 jest cases) — event emitted on valid transition with correct
  payload, HIRED stamps `hiredAt`, REJECTED captures notes as
  rejection reason, **no emit** on invalid transition, **no emit**
  when REFERENCES_CHECK has no underlying records, **no emit** for
  inactive (closed) funnels.

### T5.3 / T5.4 / T5.5 / T5.6 — DEFERRED

Out of scope for this session. Hand-off notes:

- **T5.3 — AI interview integration on `TEST_SENT`**. The hook
  point is `RecruitmentFunnelService.moveFunnelStage`. Add an event
  handler (or extend the gateway emit) that, when `toStage ===
  'TEST_SENT'`, calls `aiInterviewService.schedule(candidateId)`.
  The service lives at
  `apps/api/src/modules/hr/ai-interview-v2/ai-interview-v2.service.ts`
  — confirm the public schedule method name first; if it doesn't
  exist, add it before wiring.
- **T5.4 — Offer letter PDF**. On `OFFER_SENT` (or via
  `RecruitmentService.createJobOffer` success), generate the PDF.
  `jspdf` is already a dependency on the frontend; backend would
  need `pdfmake` (not present) — adding it pulls in fontconfig data.
  Realistic plan: keep the PDF generation server-side via `pdfmake`
  in a new `OfferLetterPdfService`, emit `offer.letter-generated`
  event for downstream channels (email + telegram bot).
- **T5.5 — Auto-create employee on HIRED**. The hook is the same
  `moveFunnelStage` site (or a new event listener subscribing to
  `candidate.stage-changed` with `toStage === 'HIRED'`). The
  command handler should be a CQRS handler placed at
  `apps/api/src/modules/hr/application/commands/create-employee-from-candidate.handler.ts`,
  wrapped in a single Drizzle `db.transaction()` that inserts the
  employee row, creates the user account, queues the welcome email,
  and emits the onboarding workflow start event. Existing factories
  for the tests live at `apps/api/test/_fixtures/hr.factories.ts`.
- **T5.6 — Funnel conversion analytics**. Frontend-only sub-task;
  add a panel above the kanban that computes adjacent-stage drop-off
  percentages from the already-fetched pipeline data. No new
  endpoint needed.

### Commits

- T5.1: `3a3f4f59` — `feat(hr-kanban): drag-drop with @dnd-kit + optimistic mutation`
- T5.2: `392d4eec` — `feat(hr-kanban): real-time stage sync via candidate.stage-changed event`

### Caveats / parallel-commit risk

This worktree's branch was created before the parent `chore/clean-faza-3`
gained `docs/HR_PRODUCTION_AGENT_PROMPT.md` and the prior
`docs/hr-progress.md`. The Phase 0/1 work referenced in the parent
tracker (commits `a992be05`, `037dd98d`, …) is **not** on this
worktree's history — so if this work is later merged into
`chore/clean-faza-3` it will appear as a fresh `docs/hr-progress.md`
file, not a modification of the existing one. Recommend the integrator
reconcile the two trackers by hand.
