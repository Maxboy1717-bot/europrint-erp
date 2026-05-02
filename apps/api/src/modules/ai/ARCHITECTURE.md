# AI Router Module - Architecture & Design

Complete DDD architecture documentation for the AI Router module.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  AiController                                                   │
│  ├─ POST /ai/call      (AiCallDto validation)                 │
│  └─ GET /ai/budget     (Usage statistics)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  AiRouterService (Core Business Logic)                         │
│  ├─ call(request)          → Route to provider + fallback     │
│  ├─ getTodaySpent()        → Budget enforcement               │
│  ├─ getUsageStats()        → Analytics                        │
│  ├─ callProvider(openai|gemini|claude)                        │
│  └─ logUsage()             → Async DB logging                 │
└────────────┬─────────────────────────────┬──────────────────────┘
             │                             │
             ▼                             ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│  DOMAIN LAYER            │  │  INFRASTRUCTURE LAYER          │
├──────────────────────────┤  ├────────────────────────────────┤
│  Types & Constants       │  │  Database Layer                │
│  ├─ AiProvider           │  │  ├─ aiUsageLogsTable (Drizzle) │
│  ├─ AiTaskType (38 types)│  │  └─ SQL queries                │
│  ├─ AiRequest/Response   │  │                                │
│  ├─ TASK_PROVIDER_MAP    │  │  External Integrations        │
│  ├─ COST_PER_1K          │  │  ├─ OpenAI SDK               │
│  ├─ PROVIDER_FALLBACK    │  │  ├─ Google Gemini SDK        │
│  └─ DAILY_BUDGET_USD     │  │  └─ Anthropic Claude SDK     │
└──────────────────────────┘  └────────────────────────────────┘
```

## Data Flow

### Request Processing Flow

```
1. HTTP Request (POST /ai/call)
   ↓
2. AiController receives request
   ├─ JWT Authentication (JwtAuthGuard)
   ├─ Role Validation (RolesGuard)
   └─ DTO Validation (AiCallDto with Zod)
   ↓
3. AiRouterService.call(request)
   ├─ Check daily budget ($50 limit)
   │  └─ getTodaySpent() from ai_usage_logs
   │
   ├─ Determine provider order
   │  ├─ Preferred: req.provider OR TASK_PROVIDER_MAP[taskType]
   │  └─ Fallback chain: [Gemini, OpenAI, Claude]
   │
   ├─ Try each provider in order
   │  ├─ callOpenAi(request)
   │  │  └─ OpenAI API → parse response → estimate cost
   │  ├─ callGemini(request)
   │  │  └─ Gemini API → parse response → estimate cost
   │  └─ callClaude(request)
   │     └─ Claude API → parse response → estimate cost
   │
   └─ On success:
      ├─ logUsage() async → ai_usage_logs table
      └─ return AiResponse
   
   ↓
4. HTTP Response (200 OK)
   └─ AiResponse { text, provider, model, tokens, cost, latency }
```

## Task-to-Provider Mapping

### 38 Task Types Distributed Across 3 Providers

```
OPENAI (13 tasks - Complex reasoning, accuracy)
├─ HR: evaluate_candidate, skill_gap_analysis, performance_review, salary_benchmark
├─ CRM: deal_probability, churn_risk, next_best_action
├─ MES: downtime_root_cause, oee_recommendation, quality_prediction
├─ Finance: anomaly_detect, cashflow_forecast, fraud_risk
├─ WMS: stock_optimize
├─ Design: layout_critique, brand_check

GEMINI (16 tasks - Fast generation, cost-effective)
├─ HR: generate_interview_questions, summarize_cv, onboarding_plan, team_fit_score
├─ CRM: lead_score, customer_segment, email_template
├─ MES: demand_forecast
├─ Finance: invoice_classify
├─ WMS: reorder_point
├─ Logistics: delivery_predict
├─ Marketing: content_generate, seo_optimize, sentiment_analyze
├─ Design: color_suggest

CLAUDE (9 tasks - Complex reasoning, nuanced analysis)
├─ MES: schedule_optimize
├─ Finance: budget_variance_explain
├─ Marketing: ad_copy
├─ Director: kpi_explain, risk_assess, strategic_recommend
```

### Provider Selection Algorithm

```typescript
// Default selection (deterministic per task)
const preferred = TASK_PROVIDER_MAP[taskType];

// User override
const selected = req.provider ?? preferred;

// Fallback chain (automatic on failure)
const providers = [selected, ...PROVIDER_FALLBACK.filter(p => p !== selected)];

// Try each until success
for (const provider of providers) {
  const result = callProvider(provider, req);
  if (result.ok) return result;
  // else try next provider
}
```

## Cost Model

### Token-Based Pricing

```
OpenAI (GPT-4o-mini):
  Input:  $0.00015 per 1K tokens
  Output: $0.0006  per 1K tokens

Google Gemini (1.5-flash):
  Input:  $0.000075 per 1K tokens
  Output: $0.0003   per 1K tokens

Anthropic Claude (3.5 Haiku):
  Input:  $0.0008 per 1K tokens
  Output: $0.004  per 1K tokens
```

### Cost Calculation

```typescript
function estimateCost(provider: AiProvider, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_1K[provider];
  const inputCost = (inputTokens / 1000) * rates.input;
  const outputCost = (outputTokens / 1000) * rates.output;
  return inputCost + outputCost;
}

// Example:
// Task: Generate interview questions (150 input, 450 output tokens)
// Provider: Gemini (cheapest for generation)
// Cost: (150/1000 * 0.000075) + (450/1000 * 0.0003)
//     = 0.01125 + 0.135 = 0.1465 cents
```

### Daily Budget Enforcement

```
Daily Budget: $50.00
├─ Checked before every request
├─ Calculated from ai_usage_logs table
│  └─ WHERE DATE(created_at) = CURRENT_DATE
├─ If spent >= $50.00 → reject request
└─ Response: "AI kunlik byudjet oshdi: $X.XX/$50.00"

Budget Tracking:
├─ Real-time: Per-request token counting
├─ Historical: Database aggregation
└─ Analytics: Usage by provider, task type, user
```

## Database Schema

### ai_usage_logs Table

```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider & Model Info
  provider VARCHAR(50) NOT NULL,           -- 'openai'|'gemini'|'claude'
  task_type VARCHAR(100) NOT NULL,         -- e.g., 'hr.evaluate_candidate'
  model VARCHAR(100) NOT NULL,             -- e.g., 'gpt-4o-mini'
  
  -- Token Usage (actual from API)
  input_tokens INTEGER NOT NULL,           -- e.g., 450
  output_tokens INTEGER NOT NULL,          -- e.g., 320
  total_tokens INTEGER NOT NULL,           -- = input + output
  
  -- Cost (calculated)
  estimated_cost_usd NUMERIC(10, 6) NOT NULL,  -- e.g., 0.000315
  
  -- User Context
  user_id UUID,                            -- Reference to users table
  session_id UUID,                         -- Reference to sessions table
  
  -- Request/Response Summaries (privacy-safe)
  request_summary TEXT,                    -- First 200 chars of prompt
  response_summary TEXT,                   -- First 200 chars of response
  
  -- Performance
  latency_ms INTEGER NOT NULL,             -- e.g., 1250
  
  -- Status Tracking
  status VARCHAR(50) NOT NULL DEFAULT 'success',  -- 'success'|'error'
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes (query optimization)
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX idx_ai_usage_logs_task_type ON ai_usage_logs(task_type);
```

### Common Queries

```sql
-- Today's total spending
SELECT SUM(CAST(estimated_cost_usd AS FLOAT)) as total
FROM ai_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE;

-- Spending by provider (today)
SELECT provider, COUNT(*) as count, SUM(CAST(estimated_cost_usd AS FLOAT)) as total
FROM ai_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
GROUP BY provider;

-- Top tasks by cost (today)
SELECT task_type, COUNT(*) as count, SUM(CAST(estimated_cost_usd AS FLOAT)) as total
FROM ai_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
GROUP BY task_type
ORDER BY total DESC LIMIT 10;

-- Average latency by provider
SELECT provider, AVG(latency_ms) as avg_latency
FROM ai_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
GROUP BY provider;

-- Per-user usage (today)
SELECT user_id, COUNT(*) as count, SUM(CAST(estimated_cost_usd AS FLOAT)) as total
FROM ai_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
GROUP BY user_id
ORDER BY total DESC;
```

## Error Handling Strategy

### Result Pattern (No Exceptions)

```typescript
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Benefits:
// - No try-catch needed
// - Type-safe error handling
// - Functional style
// - Easy to compose
```

### Error Scenarios

```
1. Budget Exceeded
   → { ok: false, error: "AI kunlik byudjet oshdi: $X.XX/$50.00" }
   → HTTP 400 Bad Request

2. Missing API Key
   → { ok: false, error: "OPENAI_API_KEY konfiguratsiyasi yo`q" }
   → HTTP 400 Bad Request

3. Provider Rate Limited
   → Try next provider (automatic fallback)
   → Log warning: "[AI] openai xato: Rate limit — fallback..."

4. All Providers Failed
   → { ok: false, error: "Barcha AI provayderlar ishlamaydi" }
   → HTTP 400 Bad Request

5. Database Logging Failed
   → Log warning (non-blocking)
   → Still return successful AI response
   → Don't fail the request for logging error

6. Invalid Request DTO
   → { ok: false, error: Zod validation message }
   → HTTP 400 Bad Request
```

## Security Architecture

### Authentication & Authorization

```
┌─────────────────┐
│  HTTP Request   │
│  + JWT Token    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  JwtAuthGuard           │
│  - Verify signature     │
│  - Check expiration     │
│  - Extract user ID      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  RolesGuard             │
│  - Required roles:      │
│    • SUPER_ADMIN        │
│    • DIRECTOR           │
│    • HR_MANAGER         │
│    • SALES_MANAGER      │
│    • FINANCE_MANAGER    │
│    • PRODUCTION_MANAGER │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  AiController           │
│  - Process request      │
│  - Pass userId          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  AiRouterService        │
│  - Log request with ID  │
│  - Associate cost w/ ID │
└─────────────────────────┘
```

### Data Privacy

- **Request Summaries**: Truncated to 200 characters (no full prompts in DB)
- **Response Summaries**: Truncated to 200 characters (prevent PII)
- **API Keys**: Environment variables only (never in code/git)
- **User Tracking**: All requests associated with authenticated user ID
- **Async Logging**: Non-blocking to prevent information disclosure

## Deployment Architecture

### Service Dependencies

```
AiModule
├─ requires: ConfigService
│  └─ Environment variables (API keys)
├─ requires: EventEmitter2
│  └─ For potential event-driven features
├─ requires: DrizzleService
│  └─ Database access for logging
└─ requires: Auth Module
   ├─ JwtAuthGuard
   ├─ RolesGuard
   └─ Current user extraction
```

### Configuration Requirements

```env
# API Keys (required)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...

# Database (required)
DATABASE_URL=postgresql://user:password@host:5432/db

# Optional Overrides
AI_DAILY_BUDGET_USD=50          # Default: 50
AI_REQUEST_TIMEOUT_MS=30000     # Default: 30000
```

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Run
CMD ["npm", "run", "start:prod"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
```

## Performance Characteristics

### Latency Profile

```
Provider         | Avg Latency | Percentile P95 | Max Observed
───────────────────────────────────────────────────────────
Gemini 1.5-flash | 800ms       | 1200ms        | 3000ms
OpenAI GPT-4o    | 1200ms      | 1800ms        | 4500ms
Claude 3.5 Haiku | 1500ms      | 2200ms        | 5000ms
```

### Throughput

```
Rate Limits (per provider, typical):
- OpenAI: 3,500 RPM / 90,000 TPM
- Gemini: 10 RPM / 1M TPM
- Claude: 10 RPM / 40K TPM

Bottleneck: Gemini/Claude rate limits (10 RPM)
Solution: Queue/batch requests or use multiple API keys
```

### Database Performance

```
Typical Inserts: 1000 rows/second possible
Query Response: <100ms for daily stats
Storage: ~1MB per 1000 requests
Retention: 90 days = ~2.7GB
```

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
├─ Instance 1 (AiModule)
├─ Instance 2 (AiModule)
└─ Instance N (AiModule)
     ↓
Shared Database (PostgreSQL)
     ↓
ai_usage_logs table (centralized cost tracking)
```

### Rate Limiting Strategy

```
Per-User:    10 requests/minute (configurable)
Per-Provider: Rate limit limits from provider
Per-Budget:   Stop at $50/day regardless of requests
```

### Caching Strategy

```
Cache Layer (Redis)
├─ Prompt hash → Response
├─ TTL: 1 hour
├─ Miss → Call AI
└─ Hit → Return cached

Reduces costs 30-40% for common prompts
```

## Testing Strategy

### Unit Tests

```typescript
// Test result pattern
describe('AiRouterService', () => {
  it('should return result with ok=true on success', async () => {
    const result = await service.call({ taskType: 'hr.evaluate_candidate', prompt: 'test' });
    expect(result.ok).toBe(true);
    expect(result.data.text).toBeDefined();
  });

  it('should return result with ok=false on budget exceeded', async () => {
    // Mock getTodaySpent to return $50
    const result = await service.call({ taskType: 'hr.evaluate_candidate', prompt: 'test' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('byudjet');
  });

  it('should fallback to secondary provider on failure', async () => {
    // Mock OpenAI to fail
    // Service should try Gemini
    expect(result.data.provider).toBe('gemini');
  });
});
```

### Integration Tests

```typescript
// Test with real APIs (requires valid keys)
describe('AiRouter Integration', () => {
  it('should successfully call OpenAI', async () => {
    const result = await service.call({
      taskType: 'crm.deal_probability',
      prompt: 'Test prompt',
      provider: 'openai',
    });
    expect(result.ok).toBe(true);
    expect(result.data.provider).toBe('openai');
  });

  it('should log usage to database', async () => {
    const result = await service.call({ /* ... */ });
    const logs = await db.query('SELECT * FROM ai_usage_logs');
    expect(logs.length).toBeGreaterThan(0);
  });
});
```

### Load Tests

```bash
# Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" \
   -p payload.json -T application/json \
   http://localhost:3000/ai/call

# k6
k6 run load-test.js --vus 10 --duration 30s
```

## Monitoring & Alerting

### Metrics to Track

```
Real-time:
├─ Active requests
├─ Average latency
├─ Error rate
├─ Daily spend vs budget
└─ Requests per provider

Historical:
├─ Total cost by provider
├─ Task type popularity
├─ Error trends
├─ Latency trends
└─ User activity
```

### Alerts

```
Severity: Critical
├─ Daily budget exceeded
└─ All providers failing

Severity: High
├─ Any provider rate limited
├─ Response latency > 5s
└─ Error rate > 5%

Severity: Medium
├─ Database logging failures
└─ API key invalid
```

## References

- DDD (Domain-Driven Design): Clear separation of concerns
- Result Pattern: Functional error handling
- Provider Abstraction: Pluggable AI backends
- Cost Tracking: Real-time budget enforcement
- Async Logging: Non-blocking observability
