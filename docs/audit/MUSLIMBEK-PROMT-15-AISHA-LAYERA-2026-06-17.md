# DIRECTIVE — #15 AISHA Layer-A (web): tool-execution loop + decouple + futuristic UI

> Advisor (Claude) → Executor (Muslimbek). Owner-approved 2026-06-17 ("Hammasi birga" = P0+P1+P2 one build).
> Grounded by a read-only map (workflow wl57x2tqy): Aisha's backend brain is REAL (Claude streaming, voice
> Whisper+ElevenLabs, wake-word, 26 real tools, SSE transport) and ANTHROPIC_API_KEY is set. The CORE gap:
> tools are defined + offered to Claude but NEVER executed. Vision: docs/audit/AISHA-JARVIS-VIZYON-2026-06-17.md.
> This is the LAST big build (Layer A = web; Layer B = Python desktop later).

---

## RULES BLOCK (read first)
- **Role:** EXECUTOR (🟢). Build P0→P1→P2; self-verify each; one combined report (or per-part if too big — but cover all 3).
- **Q-30/Q-45:** Never print/handle the ANTHROPIC_API_KEY value (it's set; just rely on it). No logs committed. `git add <exact-file>` only.
- **Q-35/DDL:** Aisha uses existing tables (kanban_cards, reminders, sales_orders, etc.) — expect NO new tables. If you think one is needed, STOP and show SQL to owner first. Don't touch payroll/GL/`gl_journal_entries`.
- **Q-39 (no regression):** The director dashboard MUST still work after you move Aisha's panels out of it. The 22-module sweep + golden-thread must stay green.
- **Style:** Result<T>, Array.isArray guards, Zod, files ≤900/funcs ≤150.
- **Q-40 (works≠correct):** Prove the tool-loop with a LIVE run where a tool actually executes and returns REAL data (not just "tool named").
- **Self-verify is the gate.**

---

## P0 ⭐ — TOOL-EXECUTION LOOP (the core gap: make the 26 real tools actually run)

**Problem (mapped):** `chat.controller.ts:88-91` explicitly defers tool execution; `ToolRegistry.getToolByName()`
exists but is never called in prod; Claude emits `tool_use` but `tool.execute()` never runs; `tool_result`
event type defined but never yielded. So Aisha names a tool but never runs it.

**Build a conversation orchestrator** (new service, e.g. `AishaConversationService.runTurn(...)`) that drives the
standard Anthropic tool-use loop. Both `chat.controller` (sync) and the SSE gateway (streaming) call it:

```
messages = [{ role: 'user', content: userMessage }]
for (iteration = 0; iteration < MAX_ITERS /* e.g. 8 */; iteration++) {
  stream = claude.streamWithTools({ messages, system: SYSTEM_PROMPT, tools: registry.getDefinitions() })
  collect text_delta → (stream to SSE as text_delta), collect tool_use blocks {id, name, input}
  if (no tool_use) break            // end_turn → final answer
  toolResults = []
  for (each tool_use tu) {
    toolR = registry.getToolByName(tu.name)
    if (!toolR.ok) → toolResults.push({ tool_use_id: tu.id, content: 'unknown tool', is_error: true }); continue
    const tool = toolR.data
    if (tool.stakeLevel === 'high')  // send_email / send_telegram_to_team / schedule_meeting
        → emit approval-required event (SSE) + PAUSE for human confirmation; DO NOT auto-execute.
          (reuse the existing pending-approval / voice-confirm mechanism — do not bypass it.)
    else
        const exec = await tool.execute(tu.input)   // REAL execution
        toolResults.push({ tool_use_id: tu.id, content: JSON.stringify(exec.ok ? exec.data : exec.error), is_error: !exec.ok })
        emit tool_use + tool_result events to SSE (TransparencyPanel shows provenance)
  }
  messages.push({ role:'assistant', content: [text + tool_use blocks] })
  messages.push({ role:'user', content: toolResults.map(→ tool_result block with tool_use_id) })
}
return { reply: accumulatedText, toolsUsed, toolResults, sessionId }
```

Implementation notes:
- The Anthropic `tool_result` must be a content block referencing the `tool_use_id`. Ensure `ClaudeAdapter`
  surfaces `tool_use` with **id + name + input** (extend the adapter's event mapping if it currently only
  exposes `name`). Yield the `tool_result` event type that's already defined in `i-claude-port.ts` but unused.
- HIGH-stake tools (send_email/send_telegram_to_team/schedule_meeting) MUST stay confirmation-gated — the loop
  pauses and waits for human approval; it must NOT auto-send. This is the 1-principle (AI proposes, human decides).
- Guard the loop (max iterations) so a tool-call cycle can't run forever.
- `what_if_simulation` is a known STUB (defers to AI Planning) — leave it honest, don't fake it.

**P0 acceptance (Q-40 live proof, API key IS set):**
- Ask Aisha a real READ question whose answer needs a tool (e.g. "bugungi moliya holati" → get_financial_summary,
  or an inventory/forecast question). Prove the tool ACTUALLY executed and REAL data appears in the reply
  (show the tool_result + the final answer). A read-only tool is the safe proof (no side effects).
- Prove a HIGH-stake tool (e.g. send_telegram_to_team) PAUSES for approval and does NOT auto-send.

---

## P1 — DECOUPLE FE from DirectorDashboard → own /aisha route + sidebar

**Mapped:** backend AishaModule is ALREADY independent (no change needed). FE is embedded in
`DirectorDashboard.tsx:232-236` as 3 self-contained overlays: `AishaChatPanel`, `AishaPanel` (wake-orb),
`TransparencyPanel`.

**Build:**
- Create a dedicated `/aisha` route + page (the futuristic surface — see P2) that hosts the 3 panels.
- Add an `aisha` sidebar entry (Qoida 20/22: add the route to the sidebar ONLY after the page file exists;
  use the canonical sidebar source `constants.ts`).
- REMOVE the 3 Aisha overlays from `DirectorDashboard.tsx` (so it's no longer coupled) — but verify the director
  dashboard still renders + works without them (Q-39 no regression).
- Keep the wake-word/voice working on the new page (the AishaPanel orb + voice hooks move with it).

**P1 acceptance:** /aisha route loads the panels; sidebar entry navigates to it; DirectorDashboard still works
(no Aisha references left dangling); FE tsc 0.

---

## P2 — FUTURISTIC IMMERSIVE UI (owner design-exception, Q-41)

Per the owner's vision + reference image (Higgsfield/Iron-Man style) in
docs/audit/AISHA-JARVIS-VIZYON-2026-06-17.md:
- Dark background + neon accents; a central **living orb / core** as the focal point.
- **Reactive animation:** distinct states — idle/listening vs speaking vs thinking/tool-running (different orb
  animation per state). Wire these to the real events (wake detected, STT active, Claude streaming, tool running).
- This is the ONE owner-approved design EXCEPTION (Q-41): Aisha may use a bespoke futuristic theme instead of the
  standard ListPage/FormPage templates + EP tokens. The REST of the ERP stays EP-token. Keep it componentized
  (an Aisha-specific theme/components folder) — clean code, not raw inline styles scattered everywhere.
- Show the TransparencyPanel provenance (which tool ran, what data) — the tool_result events from P0 feed it.

**P2 acceptance:** the /aisha page shows the immersive orb; orb animation changes with state (listening vs
speaking vs tool-running); owner reviews the visual result (screenshot/preview).

---

## SELF-VERIFY GATE (before reporting)
1. `tsc --noEmit` 0 (BE + FE); reviewers no new FAIL.
2. **P0 live proof:** authenticated /aisha/chat (or SSE) run where a read tool executes → real data in reply
   (capture it); a high-stake tool pauses for approval (not auto-sent).
3. **P1:** /aisha route + sidebar work; DirectorDashboard still renders without Aisha (no regression).
4. `node scripts/golden-thread-chain-proof.cjs` exit 0; health 200; login 401/422.
5. No DDL ran (or owner-approved + shown); payroll/GL/`gl_journal_entries` untouched; no logs committed.

## COMMIT + REPORT
- `git add <exact files>` only. Commit per part is fine (e.g. `feat(aisha): #15 P0 tool-execution loop`,
  `feat(aisha): #15 P1 decouple to /aisha route`, `feat(aisha): #15 P2 futuristic UI`).
- Report (cover all 3): what was built per P0/P1/P2, commit hashes, the P0 live tool-execution proof, the
  high-stake approval proof, P1 no-regression evidence, P2 screenshot/preview, harness + login. Then stop —
  advisor deep-verifies (tool-loop is high-value, will get a thorough review like FIN).
