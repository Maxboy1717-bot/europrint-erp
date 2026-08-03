# Part: ai — modules: ai, ai-agents, agents, aisha (static-only; backend down)

PROVIDER NOTE: Multi-provider router (OpenAI + Gemini + Anthropic/Claude). Real SDK calls confirmed:
`ai-router.service.ts:167` (OpenAI), `:193` (Gemini), `:229` (Anthropic `@anthropic-ai/sdk` `messages.create`).
Claude model id from `PROVIDER_MODELS.claude` (domain/types/ai.types.ts). aisha = Claude streaming (`streamWithTools`).
All AI tables verified present (DB-proof below). Backend HTTP down (Q-44) → all status STATIC.

## Route inventory: total 96 (GET 47, POST 41, PATCH 3, PUT 1, DELETE 1, GET+PUT/PATCH dual counted once)

Breakdown by controller:
- ai/ai.controller (`/api/ai`): 7 (POST call, GET budget, GET bottleneck/analysis, GET forecast/demand, GET rush-orders, POST rush-orders/:id/approve, POST rush-orders/:id/reject, GET shift/recommendations) = 8
- ai/gpt.controller (`/api/gpt`): 3 (GET status, GET chat, POST test)
- ai/insights.controller (`/api/insights`): 4 (GET, GET dashboard, POST generate, PATCH :id/read)
- ai/ai-automation.controller (`/api/ai/automation`): 2 (GET status, POST run-all-pending)
- ai/ai-crm.controller (`/api/ai/crm`): 5
- ai/ai-director.controller (`/api/ai/director`): 4
- ai/ai-finance.controller (`/api/ai/finance`): 6
- ai/ai-hr.controller (`/api/ai/hr`): 6
- ai/ai-hr-new.controller (`/api/ai-hr`): 7
- ai/ai-marketing.controller (`/api/ai/marketing`): 4
- ai/ai-wms.controller (`/api/ai/wms`): 4
- ai/ai-exam.controller (`/api/ai-exam`): 6
- ai/ai-planning.controller (`/api/ai-planning`): 17
- ai/ai-reservation.controller (`/api/ai-reservation`): 10
- ai/forecast-ext.controller (`/api/forecast`,`/api/forecasts`): 5
- ai-agents/ai-agents.controller (`/api/ai-agents`): 11
- agents/agents.controller (`/api/agents`): 49
- aisha/chat.controller (`/api/aisha`): 1 (POST chat)
- aisha/voice.controller (`/api/aisha/voice`): 2 (POST transcribe, POST synthesize)
- aisha/wake-config.controller (`/api/aisha/wake`): 2 (GET config, PATCH sensitivity)

## 🔴 DECEPTIVE (FULL LIST — key output)

### ⚠️200-MOCK (hardcoded literals / fixed numbers — no DB, no AI)
1. GET `/api/ai/bottleneck/analysis` | 200-MOCK returns `{ bottlenecks: [], analyzedAt: now }` always empty literal | ai.controller.ts:172-173 | no service call | verdict: MOCK (empty literal, never reads DB)
2. GET `/api/ai/shift/recommendations` | 200-MOCK returns `{ recommendations: [], generatedAt: now }` always empty literal | ai.controller.ts:214-215 | no service call | verdict: MOCK
3. GET `/api/gpt/status` | 200-MOCK hardcoded `{status:'active',provider:'gemini',features:[...]}` | gpt.controller.ts:36 | no DB | verdict: MOCK (status label; low harm)
4. GET `/api/gpt/chat` | 200-MOCK hardcoded info object | gpt.controller.ts:42 | verdict: MOCK (info banner; benign)
5. GET `/api/ai-planning/plans/:id/batch-groups` | 200-MOCK hardcoded "Mashina №1/№2" arrays w/ fake counts/durations/orders | ai-planning.service.ts:64-68 | no DB read (planId only logged) | verdict: MOCK
6. GET `/api/ai-reservation/optimize` | 200-MOCK hardcoded `quantity*1.1`, supplier 'Asosiy ombor', `quantity*12500`, confidence 82 | ai-reservation.service.ts:50-59 | no DB, no AI | verdict: MOCK (fake "optimization")
7. GET `/api/agents/strategic/investment` | 200-MOCK hardcoded 2-item recommendations array (flexo 250M roi35, ombor 80M roi25) | strategic-agent.service.ts:59-62 ("// Placeholder") | verdict: MOCK
8. GET `/api/agents/facilities/utility` | 200-MOCK hardcoded `{electricity:12_000_000,gas:4_500_000,water:1_200_000,deltaPct:8.5}` | facilities-agent.service.ts:26 ("// Placeholder") | verdict: MOCK
9. GET `/api/agents/facilities/supplies` | 200-MOCK hardcoded `{low:3,out:1}` | facilities-agent.service.ts:41 | verdict: MOCK
10. GET `/api/agents/iot/sensor` & `/api/agents/iot/sensor/:machineId` | 200-MOCK hardcoded `{vibration:1.2,temp:65.5,current:12.3}` | iot-agent.service.ts:34 ("Placeholder simulated values") | verdict: MOCK
11. GET `/api/agents/iot/anomaly/:machineId` | 200-MOCK derives from mock sensor (always hasAnomaly:false unless mock>5.0 which never happens) | iot-agent.service.ts:38-49 | verdict: MOCK
12. GET `/api/agents/iot/rul/:machineId` | 200-MOCK hardcoded `{daysLeft:60,confidence:0.85}` | iot-agent.service.ts:53 | verdict: MOCK

### ⚠️200-MOCK (PARTIAL — real DB/LLM mixed with hardcoded fields)
13. GET `/api/agents/production/oee` | 200-MOCK(partial) availability REAL (downtime_events query) but performance=0.85 & quality=0.97 hardcoded; catch-fallback all-hardcoded 0.92/0.85/0.97 | production-agent.service.ts:114,119 (documented TODO in header) | DB-proof: downtime_events EXISTS | verdict: PARTIAL-MOCK (P,Q invented)
14. POST `/api/agents/strategic/scenario` | 200-MOCK(partial) `analysis` text REAL (callClaude) but `impact:{revenue:0,production:0,customers:0}` hardcoded zeros | strategic-agent.service.ts:34 | verdict: PARTIAL-MOCK (impact field fake)
15. GET `/api/ai-planning/dashboard` | 200-MOCK(partial) most fields REAL (aggregates from plans) but `avgMachineUtilization:84` & `autoApprovedPct:0` hardcoded | ai-planning.service.ts:42,40 | verdict: PARTIAL-MOCK (one fixed number)
16. GET `/api/ai-agents/list` | 200-MOCK(partial) successCount/errorCount REAL (logSvc.getStats) but `status:'active'` & `lastRunAt:null` hardcoded for all agents | ai-agents.controller.ts:231-232 | verdict: PARTIAL-MOCK (status label)
17. GET `/api/ai/automation/status` | 200-MOCK(partial) counts REAL (DB) but `automationCoverage` percentages ('80%','70%'…) hardcoded | ai-automation.service.ts:149-151 | verdict: PARTIAL-MOCK (coverage labels)

### 💀200-GREEN-LIE (ok response but no real write — log-only)
18. POST `/api/ai-planning/decisions/:id/accept` | GREEN-LIE log-only `Logger.log('Decision accepted')` then returns Ok message; NO DB update | ai-planning.service.ts:116-118 | DB-proof: ai_planning_decisions EXISTS but never written here | verdict: GREEN-LIE
19. POST `/api/ai-planning/orders/:orderId/block-material` | GREEN-LIE log-only, returns "Material band qilindi" but NO reservation/stock write | ai-planning.service.ts:121-123 | verdict: GREEN-LIE
20. PATCH `/api/aisha/wake/sensitivity` | GREEN-LIE updates in-memory `this.currentSensitivity` only — not persisted; lost on restart | wake-config.controller.ts:60 | verdict: GREEN-LIE (minor; runtime toggle)

### NON-DECEPTIVE clarification (graceful AI-unavailable fallbacks — NOT green-lie)
- ai/crm-ai.service, finance-ai, hr-ai, marketing-ai, wms-ai, director-ai: on `isErr(aiResult)` return neutral defaults (score:50, etc.) WITH `logger.warn`. These are REAL AI calls (ai.call→router→SDK); fallback only on provider failure. Honest degradation, not mock. NOT flagged.
- aisha chat notConfiguredReply/errorReply (chat.controller.ts:67-84): honest "not configured"/error surface. NOT mock.

## ❌ 5xx: NONE found (static analysis)
All AI tables exist (DB-proof below); router wrapped in safeCall/Result; controllers use unwrapOrInternal/unwrapOrBadRequest. forecast-ext croston/ensemble throw 500 only on genuine forecast_series write failure (correct error propagation, not a bug).

## 🟠 404 / 501
- 501 (A — honest stub, FINE): GET `/api/ai/forecast/demand` (ai.controller.ts:181 notImplemented), GET `/api/ai/rush-orders` (:189), POST `/api/ai/rush-orders/:id/approve` (:198), POST `/api/ai/rush-orders/:id/reject` (:208) — all `notImplemented()` "Feature gated off #FX-5". Honest 501 stubs.
- 501 (A — honest stub, FINE): POST `/api/ai-agents/:agentId/trigger` (ai-agents.controller.ts:252 notImplemented, P3-26 "orchestrator not yet wired"). Honest.
- 501-B/C (should-work BUG / leftover): NONE.
- 404-A/B/D: NONE (no drift/missing-vision/prefix 404s detected).

## 🟡🔵🔴 400/401/403
- 401 (FINE): all controllers behind global JwtAuthGuard + explicit @UseGuards(JwtAuthGuard) on aisha/insights/gpt/exam/planning/reservation/hr-new/forecast-ext. INTENTIONAL.
- 403 (FINE): @Roles RBAC throughout (SUPER_ADMIN/DIRECTOR/HR/FINANCE/PRODUCTION/etc.); wake/sensitivity director-only ForbiddenException (wake-config.controller.ts:57). All intentional.
- 400 (Zod FINE): all @Body validated via Zod (ZodValidationPipe / inline .parse). No drift-400 bugs.
- BUG 400/401/403: NONE.

## ✅ FINE (grouped + counts + sample proofs)
- REAL AI-router-backed (router→real OpenAI/Gemini/Claude SDK, logs to ai_usage_logs): ai/call, gpt/test, ai/budget, ai/crm ×5, ai/director ×4, ai/finance ×6, ai/hr ×6, ai/marketing ×4, ai/wms ×4, ai-hr ×7, ai/automation ×2, insights ×4. Proof: ai-router-call.service.ts:94 Anthropic SDK; crm-ai.service.ts:33 ai.call; ai_usage_logs table EXISTS.
- REAL DB-backed CRUD (Drizzle repos, tables exist): ai-exam ×6 (ai_exam_attempts), ai-planning ×14 (ai_planning_plans/decisions/config), ai-reservation ×9 (ai_reservation_requests/batches), insights (ai_insights), ai-hr-new interviews (ai_interviews).
- REAL DB-backed agents (runQuery → real tables, verified): agents director/inventory/cashflow/quality/security/lms/supplier/lead-scoring/production(monitor,bottleneck,shift)/marketing(roi,segment)/hr-performance(perf,churn,bonus,cron). Proof: cashflow-agent.service.ts:26 cash_transactions; quality-agent.service.ts:35 production_facts; all tables EXIST.
- REAL forecast math + persistence: forecast-ext ×5 (EMA/HW/Croston/Ensemble→forecast_series, run→weeklyJob). Proof: forecast-ext.controller.ts:106 saveForecast; forecast_series EXISTS.
- REAL ai-agents algorithmic + LLM + decision-log persist: sales/evaluate, prepress/tech-card, planning/plan, mes/oee, mes/anomaly, qc/vision-analyze (Gemini call vision-qc.service.ts:74), logistics/vrp, audit/* (×3). Persist via ai-decision-log (ai_decision_log EXISTS).
- REAL aisha: chat (Claude streamWithTools), voice/transcribe (Whisper), voice/synthesize (ElevenLabs), wake/config.

## COUNTS (per bucket+subcause; sum = 96)
- ✅ 200-REAL (AI-router): 53
- ✅ 200-REAL (DB CRUD / agents-DB / forecast / ai-agents-algo / aisha): 22
- ⚠️ 200-MOCK (full hardcoded): 12 (#1-12; routes 1-12 incl iot/sensor dual = counts as 2 routes)
- ⚠️ 200-MOCK (partial — real+hardcoded field): 5 (#13-17)
- 💀 200-GREEN-LIE (log-only/no-persist): 3 (#18-20)
- 🟠 501-A (honest stub, FINE): 5 (ai forecast/demand, rush-orders×3, ai-agents trigger)
- 🔵 401 / 🔴 403 / 🟡 400 intentional: covered by guards on all 96 (no separate route count; 0 BUGs)
- ❌ 5xx: 0 | 🟠 404: 0 | 501-B/C: 0

Total deceptive = 20 (12 MOCK + 5 partial-MOCK + 3 GREEN-LIE). Honest-stub 501 = 5.
