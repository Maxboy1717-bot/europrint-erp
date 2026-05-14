# AI Agents module (`apps/api/src/modules/ai-agents/`)

> Autonomous LLM-driven decision-makers that watch one domain each and
> propose / execute corrective actions. Sit alongside the deterministic
> services (PP, WMS, QC, etc.) — but where those compute, the agents
> *decide and act*. Every agent decision is logged via
> `common/ai-decision-log.service.ts` for traceability + idempotency.

## Subfolder map

```
ai-agents/
├── common/
│   ├── ai-decision-log.service.ts     Idempotency cache + audit trail
│   ├── ai-alerts.service.ts           Telegram fan-out on agent actions
│   └── ai-agents.constants.ts         AGENT_CODES enum
├── prepress/                           Design-file preflight agent
├── planning/                           Production planner assistant
├── mes/                                MES monitor (downtime, emergency)
├── qc/                                 Vision QC assistant
├── logistics/                          Route optimisation agent
├── sales/                              Sales-Copilot (auto-pricing)
├── presentation/                       NestJS controllers
└── ai-agents.module.ts                 Wiring
```

## The 6 production agents

| Agent          | What it watches                          | What it does                                            |
|----------------|------------------------------------------|---------------------------------------------------------|
| Prepress       | Incoming design files                    | TAC check + registration tolerance → approve / reject  |
| Planner        | MRP shortages, capacity                  | Suggest reschedule / overtime                          |
| MES Monitor    | Live downtime + OEE                      | Emergency-stop Telegram broadcast on critical signals  |
| Vision QC      | Camera frames from final inspection       | Defect classify → flag for human                        |
| Logistics Router | Delivery list                          | Re-route on traffic / failed delivery                  |
| Sales Copilot  | Quote requests                            | Auto-price within bounds; HITL for borderline          |

## Decision flow (uniform across all agents)

```
1. Agent observes event (cron / event listener / API call)
2. Build input DTO with all needed context
3. inputHash = SHA-256(JSON(input))
4. Idempotency check: AiDecisionLogService.findCachedDecision()
   - hit within 1 hour → return cached action (NO LLM call)
   - miss → proceed
5. LLM call (Claude / OpenAI) with structured prompt
6. Parse decision: { action, confidence, alternatives[] }
7. Confidence ≥ AUTO_THRESHOLD AND no business-rule blocker:
     → auto-execute (atomic transaction)
     → autoExecuted = true on the log row
8. Else: HITL (Human-In-The-Loop) → wait for director/manager approval
9. Persist decision row in ai_decision_log
10. Fan-out alerts via ai-alerts.service (Telegram, dashboard, etc.)
```

## Auto-thresholds per agent

| Agent          | AUTO_THRESHOLD | HITL_REASON                                         |
|----------------|----------------|-----------------------------------------------------|
| Prepress       | 0.90           | Below = "show suggested fix but require designer OK" |
| Sales Copilot  | 0.85           | Below OR price > 50M UZS = director approval         |
| MES Monitor    | 0.95           | Below = alert but no auto-stop                       |
| Others         | 0.80 typical   | varies by agent (see source)                         |

High thresholds for risky actions (emergency stop, pricing) reflect the
cost of a wrong action vs. cost of a delayed action. Low-risk agents
(prepress suggestion) can be more permissive.

## Cost + latency budget

- Every LLM call has token budget tracked in `cost_usd` on the decision
  log row.
- p95 latency target < 2 s for synchronous agents (e.g. sales copilot);
  asynchronous (MRP planner) can take longer.
- Daily spend tracked on Director AI-Audit dashboard.

## Why idempotency matters here

Several agents are triggered by cron — if the cron fires twice (retry,
duplicate trigger), we MUST NOT make two LLM calls and two divergent
decisions. The 1-hour cache keyed by `(agentCode, inputHash, bucketHour)`
guarantees one decision per hour per logical input. The bucket-hour key
auto-invalidates on the hour boundary — no flush needed.

## Director AI-Audit panel

Every decision is queryable at `/director/ai-audit?agent=prepress`. The
panel shows:
- Recent decisions (auto vs HITL split)
- Override rate (humans disagreeing with agents — model drift signal)
- Average confidence + average latency
- Daily token spend per agent

High override rate (>10%) means the agent's model needs retuning or its
prompt rewriting.

## Conventions

- Every agent service implements a common interface (see
  `common/ai-agents.constants.ts` for the contract).
- AGENT_CODES is a closed enum — adding a new agent requires updating
  this enum + the dashboard filter.
- LLM responses MUST be JSON-parseable; we use structured output mode
  (Anthropic tool use / OpenAI JSON mode) — no regex-parsing prose.
- Cost is always logged in USD (Anthropic billing currency), even though
  the rest of the system is UZS. Director dashboard converts via daily FX.

## Where to read deeper

- Decision log architecture → top of `common/ai-decision-log.service.ts`
- Telegram alert fan-out → top of `common/ai-alerts.service.ts`
- Per-agent prompts + thresholds → each agent's own service file
- Sales Copilot pricing math → `sales/sales-copilot.service.ts`
