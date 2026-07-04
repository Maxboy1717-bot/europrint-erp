# EuroPrint ERP — IoT Kiosk-Screen ("Sex-Ekrani") Phase

> **Status: QUEUED — DO NOT START.** Filed 2026-07-04, documentation only, zero code touched.
> Begins only after every currently-running and currently-queued workflow has fully completed,
> in this order: (1) VISION-3340 reconciliation phases (Phase-1 done, Phase-2 in progress —
> `docs/audit/COMPLETION-LOG-2026-07.md`), (2) Residual Fix Loop G1-G4/R1-R8
> (`docs/audit/RESIDUAL-FIX-LOOP-2026-07-04.md`, queued, not started), (3) this phase.
> Master-plan pointer: `docs/audit/MASTER-REJA-VIZYON-2026-07-02.md` §8.11.

## Scope

A wall-mounted kiosk screen per machine/section (not a handheld tablet, no camera), covering
the full production-worker interaction: login, order assignment, dual-scan material
consumption, parent-child paddon barcoding, defect/downtime reporting, mandatory PPE
checklist, two-signature shift handover, SOS, inline QC, pause/uptime tracking, and real
Uzbek+Russian bilingual UI.

## Confirmed vision (20 core requirements, verbatim)

1. Login via employee_code + password.
2. One shared kiosk screen per machine, re-login on shift change.
3. Order auto-assigned by the AI production plan, not picked manually.
4. Material consumption requires BOTH order QR and material barcode scan.
5. A full required-materials checklist is shown before scanning begins.
6. Parent-child barcode: one barcode per order, separate child barcodes per paddon/pallet
   (sex code, count, date), linked to the parent.
7. Crew size varies by machine (1 or multiple operators).
8. Defect reporting: detailed (5+ fields — cause, impact, responsible party, corrective
   action), no photo capture.
9. Downtime reason: dropdown list + free-text note, both required.
10. Shift handover: mandatory two-signature confirmation, stays "open" until the next worker
    confirms.
11. SOS alert routes to the Production Director.
12. Normally online; SOS and core functions degrade gracefully offline.
13. Mandatory pre-shift PPE/safety checklist gate before work can start.
14. Inline QC: operator self-check first, then random QC officer spot-check.
15. Pause button AND separate total machine-uptime tracking for OEE.
16. Sensor data (temperature/pressure/vibration) to be built now, shown on this same screen.
17. Bilingual UI: Uzbek + Russian.
18. Fixed kiosk install, one screen per machine/section.
19. Manager view: real-time escalation on repeated defects, AI-camera integration, live
    money-earned/lost, plan-vs-actual with tolerance band, automatic performance scoring,
    sourced from the Uskuna 360° profile, with AI-assigned worker photo+name shown on screen.
20. All session history/logs live in ERP MES reporting, not on the screen.

## Prerequisite blocker (must be fixed FIRST, before any of the 30 suggestions below)

**Kiosk/tablet auth mismatch.** The write routes (`production-sessions`, `defect`,
`downtime-events`, `tablet/handover`, `tablet/shift`, `tablet/sessions`) are currently guarded
by `@Roles(...IOT_READ)` under `JwtAuthGuard`, but the kiosk only sends `x-tablet-token` —
every write currently returns 401. Nothing else in this phase can be tested end-to-end until
this is fixed.

> **Citation correction (verified 2026-07-04 while filing this phase):** the task that queued
> this phase cited this blocker as "item R1 from `docs/audit/RESIDUAL-FIX-LOOP-2026-07-04.md`".
> That is incorrect — R1 in that document is a different, unrelated issue (`undo-toast.tsx`
> calling a deleted restore route). The real source for this auth-mismatch finding is
> `docs/audit/IOT-TABLET-PAGE-DEEP-DIVE-2026-07-04.md`, which lists it as prerequisite **"item
> 0"** (explicitly called out as separate from its own 30-suggestion list), confirmed still
> live via `apps/api/src/modules/iot/presentation/iot-main.controller.ts` +
> `iot-alerts.controller.ts` (`IOT_READ` role array + `@Roles(...IOT_READ)` on every route).
> Whoever picks up this phase should resolve/confirm-resolved against that document, not
> against Residual Fix Loop R1.

## 30 additional suggestions

Source: `docs/vision/IOT-SCREEN-30-SUGGESTIONS-2026-07-04.md` (verified present, brainstorm-only,
zero code written). Grouped and ordered for execution once this phase starts:

**Tier 1 — foundation (do these first, everything else depends on them):**
- T3 — Sensor gateway (MQTT/HTTP bridge) so `mes_telemetry` receives real device data instead
  of manual POSTs. HIGH effort, but unlocks AI2, AI3, D4, S3, M5.
- AI2 — Surface the existing `AiMesMonitorService` z-score anomaly output live on the kiosk
  screen. LOW effort, immediate visible value.
- W1 — Order↔material barcode cross-validation against the checklist. MEDIUM effort, core of
  the dual-scan vision.

**Tier 2 — high-value, no new hardware needed:**
- M1 — Section-level "andon" wall panel (all machines' live status + operator photo in one
  manager view).
- S2 — Certificate-expiry warning at login (LMS integration).
- W2 — Auto-generate child paddon barcode print jobs.
- D1 — Quantity sanity-check against BOM (±X% tolerance) before accepting a scan.
- AI1 — Flag when the logged-in operator differs from who the AI plan assigned.

**Tier 3 — workflow depth:**
- W3, W4, W5 (setup-time tracking, material-shortage state, mid-shift operator handoff)
- D2, D3, D5 (defect-vs-QC cross-check, barcode duplicate-guard, order status validation)
- M2, M3, M4 (shift-end top-3-problem summary, plan-lag heatmap, predictive maintenance
  countdown from Uskuna 360°)
- AI3, AI4, AI5 (downtime-cause suggestion, overage forecast, defect auto-classification)

**Tier 4 — safety, compliance, infrastructure (can run in parallel with Tier 2-3 once T3 is done):**
- S1, S3, S4, S5 (PPE audit trail, auto-stop on dangerous sensor readings, handover escalation
  timeout, SOS categorization/routing)
- T1, T2, T4, T5 (offline cache, kiosk heartbeat monitoring, shift-based auto-logout, kiosk
  self-health telemetry)
- M5 (manager approval of AI auto-stop decisions)

## Execution model once this phase starts

Sequential, plan-first — one item at a time: PLAN → owner confirmation → EXECUTE → verify →
commit → report → stop, exactly as used in the Residual Fix Loop (§8.10). Not a continuous
loop. Start with the auth-mismatch prerequisite, then Tier 1, then Tier 2, then Tiers 3-4 in
owner-directed order.
