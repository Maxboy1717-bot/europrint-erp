---
name: ai-integration
description: EuroPrint AI integratsiya — Claude API, OpenAI, prognoz, anomaliya, CFO bot, director AI, recruitment AI. Trigger so'zlar: "AI", "tahlil", "prognoz", "forecast", "agent", "CFO bot", "director AI", "anomaliya", "OpenAI", "Claude API".
---

# AI Integratsiya — Skill

## Modul hududi
- Backend: `apps/api/src/modules/ai/`, `apps/api/src/modules/agents/`, `apps/api/src/modules/ai-agents/`, `apps/api/src/modules/director/`
- Frontend: `AI*`, `AiAutomationPage.tsx`, `AgentsHub.tsx`, `DirectorPanel.tsx`, `AIFinancePage.tsx`
- Schema: `lib/db/src/schema/ai-*.ts`

## Asosiy modellar
- **Claude:** `claude-sonnet-4-20250514` (production), `claude-opus-4-20250514` (deep analysis)
- **OpenAI:** `gpt-4o` (fallback), `gpt-4o-mini` (lightweight)
- **Local:** Gemini via `@google/generative-ai` (sometimes used in agent pool)

## Qo'llanilgan joylar
1. **Production** — buyurtma muddatini prognoz (`production-agent.service.ts`)
2. **Inventory** — material tugash bashorat (`inventory-agent.service.ts`)
3. **HR** — xodim churn risk (`hr-performance-agent.service.ts`)
4. **Quality** — defect pattern (`quality-agent.service.ts` — planned)
5. **Recruitment** — CV tahlil (`hr-ai.service.ts` → `screenCandidate(candidateId)`)
6. **Camera** — anomaliya (motion pattern analysis)
7. **Finance** — Altman Z-Score, fraud detection (`cashflow-agent.service.ts`)
8. **Director** — KPI snapshot + xulosa (`director-agent.service.ts`)
9. **CFO Bot** — Telegram orqali (`cfo.service.ts`, `cc-bot.service.ts`)
10. **Marketing** — content generation (`marketing-agent.service.ts`)

## Prompt tamoyillari
1. **Kontekst to'liq:** har prompt'ga module + role + data context qo'shing.
2. **JSON format:** strukturali javob so'rang (`responseFormat: 'json'`).
3. **Confidence score:** AI har xulosaga 0-100 ishonchlilik bersin.
4. **Uzbek tilida:** lemma + display in uz/ru per user `language` field.
5. **Token limit:** har modulda alohida rate limit (`AI_DAILY_OPS_LIMIT`).

## Asosiy interface
```typescript
interface AiRouterCallService {
  execute(opts: {
    module: string;       // 'crm' | 'hr' | 'finance' | ...
    prompt: string;
    model?: 'claude' | 'gpt' | 'gemini';
    expectsJson?: boolean;
  }): Promise<Result<AiResponse>>;
}

interface AiResponse {
  content: string;
  confidence?: number;     // 0-100
  tokensUsed: { input: number; output: number };
  model: string;
}
```

## Audit & Cost Tracking
- `ai_usage_logs` jadvalga har chaqiruv yoziladi
- Token cost daily summary
- Per-module budget threshold (telegram alert agar oshib ketsa)

## Fallback strategy
- AI muvaffaqiyatsiz bo'lsa (rate limit / outage) → manual mode
- AI optional fields (e.g., `aiScore`, `aiNotes`) null bo'lib qoladi
- Cron retry: yarim soatda qayta sinaydi

## API endpointlar (asosiy)
- `POST /api/agents/director/ask` — chat with director-AI
- `POST /api/agents/inventory/rolls/scan` — rol skanlash + tahlil
- `POST /api/agents/marketing/content` — content generation
- `POST /api/agents/strategic/scenario` — scenario analysis
- `GET  /api/director/kpis` — KPI snapshot + AI xulosa
- `POST /api/ai/cfo-bot/analyze` — CFO bot tahlil

## Test fayllari
- `apps/api/test/marketing/kanban-ai.spec.ts` — AI data repository, CFO bot anomaly
- `apps/api/test/marketing/marketing-kanban-ai-exhaustive.spec.ts` — 132 tests

## Eslatma
- AI keylari `ConfigService.getOrThrow('ANTHROPIC_API_KEY')` orqali — process.env to'g'ridan EMAS.
- Sensitive data (parol, token, INN) AI prompt'iga **HECH QACHON** qo'yilmaydi (Rule 15).
- `AiDataRepository` — director-ai, crm-ai, hr-ai-ext servislari uchun yagona DB facade.
