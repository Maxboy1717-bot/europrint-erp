# AI Router Module

Complete NestJS AI module with full DDD architecture. Routes AI requests across multiple providers (OpenAI GPT-4o-mini, Google Gemini 1.5-flash, Claude 3.5 Haiku) with automatic provider selection per task type and intelligent fallback mechanisms.

## Architecture

```
ai/
├── domain/                          # Domain layer (business logic)
│   ├── types/
│   │   └── ai.types.ts             # Types, constants, task mappings
│   └── index.ts
├── application/                     # Application layer (services)
│   ├── services/
│   │   └── ai-router.service.ts    # Core routing logic
│   └── index.ts
├── infrastructure/                  # Infrastructure layer (DB)
│   ├── db/
│   │   ├── ai-usage-logs.table.ts  # Drizzle ORM table definition
│   │   └── index.ts
│   └── index.ts
├── presentation/                    # Presentation layer (API)
│   ├── dto/
│   │   └── ai.dto.ts               # Request/response DTOs
│   ├── ai.controller.ts            # REST endpoints
│   ├── index.ts
│   └── README.md
├── ai.module.ts                    # Module definition
└── README.md                        # This file
```

## Key Features

### 38 AI Task Types

Organized by domain:
- **HR AI (8)**: generate_interview_questions, evaluate_candidate, summarize_cv, skill_gap_analysis, performance_review, onboarding_plan, salary_benchmark, team_fit_score
- **CRM AI (6)**: lead_score, deal_probability, customer_segment, churn_risk, next_best_action, email_template
- **MES/Production Planning (5)**: downtime_root_cause, oee_recommendation, demand_forecast, quality_prediction, schedule_optimize
- **Finance AI (5)**: anomaly_detect, cashflow_forecast, budget_variance_explain, invoice_classify, fraud_risk
- **WMS/Logistics (4)**: reorder_point, stock_optimize, route_optimize, delivery_predict
- **Marketing AI (4)**: content_generate, seo_optimize, ad_copy, sentiment_analyze
- **Director AI (3)**: kpi_explain, risk_assess, strategic_recommend
- **Design AI (3)**: color_suggest, layout_critique, brand_check

### Three AI Providers

1. **OpenAI GPT-4o-mini** - Fast, cost-effective, excellent reasoning
   - Cost: $0.15/1M input tokens, $0.60/1M output tokens
   - Default for: HR analysis, CRM scoring, Finance analysis

2. **Google Gemini 1.5-flash** - Multimodal, fastest, lowest cost
   - Cost: $0.075/1M input tokens, $0.30/1M output tokens
   - Default for: Generation tasks, WMS optimization

3. **Claude 3.5 Haiku** - Best quality, reasonable cost
   - Cost: $0.80/1M input tokens, $4.00/1M output tokens
   - Default for: Complex reasoning, creative tasks

### Provider Selection & Fallback

- **Automatic Selection**: Each task type has a default provider defined in `TASK_PROVIDER_MAP`
- **Optional Override**: Request can specify preferred provider
- **Intelligent Fallback**: If primary provider fails, automatically tries secondary then tertiary
- **Fallback Order**: [Gemini, OpenAI, Claude]

### Budget Management

- **Daily Budget**: $50/day limit
- **Real-time Tracking**: Costs calculated per request based on token usage
- **Prevention**: Requests rejected if daily spend >= $50
- **Monitoring**: `/ai/budget` endpoint shows spending by provider and task type

### Usage Logging

Every request logged to `ai_usage_logs` database table with:
- Provider, task type, model used
- Input/output token counts and total
- Estimated cost in USD
- User ID and session ID
- Request and response summaries (first 200 chars)
- Latency in milliseconds
- Status and timestamp

## Installation

### 1. Install Dependencies

```bash
npm install openai @google/generative-ai @anthropic-ai/sdk
npm install drizzle-orm pg
npm install zod @anatine/zod-nestjs
npm install @nestjs/config @nestjs/event-emitter
```

### 2. Environment Variables

```env
# AI Provider API Keys
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_db
```

### 3. Import in App Module

```typescript
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // ... other modules
    AiModule,
  ],
})
export class AppModule {}
```

### 4. Database Migration

```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  task_type VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd NUMERIC(10, 6) NOT NULL,
  user_id UUID,
  session_id UUID,
  request_summary TEXT,
  response_summary TEXT,
  latency_ms INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_usage_logs_user_id_idx ON ai_usage_logs(user_id);
CREATE INDEX ai_usage_logs_created_at_idx ON ai_usage_logs(created_at);
CREATE INDEX ai_usage_logs_provider_idx ON ai_usage_logs(provider);
CREATE INDEX ai_usage_logs_task_type_idx ON ai_usage_logs(task_type);
```

## API Endpoints

### POST /ai/call

Route AI request to appropriate provider with automatic fallback.

**Request:**
```json
{
  "taskType": "hr.evaluate_candidate",
  "prompt": "Evaluate this candidate based on their CV...",
  "systemPrompt": "You are an expert HR consultant...",
  "provider": "openai",
  "maxTokens": 1024,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "text": "Based on the CV analysis...",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "inputTokens": 450,
  "outputTokens": 320,
  "estimatedCostUsd": 0.000315,
  "latencyMs": 1250
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid input or budget exceeded
- `401 Unauthorized` - Missing/invalid JWT
- `403 Forbidden` - Insufficient role permissions

**Required Roles:**
- SUPER_ADMIN
- DIRECTOR
- HR_MANAGER
- SALES_MANAGER
- FINANCE_MANAGER
- PRODUCTION_MANAGER

### GET /ai/budget

Get daily budget status and usage statistics.

**Response:**
```json
{
  "today": {
    "spent": 12.50,
    "remaining": 37.50,
    "budget": 50,
    "requestCount": 24
  },
  "byProvider": {
    "openai": { "spent": 6.25, "requestCount": 10 },
    "gemini": { "spent": 4.00, "requestCount": 12 },
    "claude": { "spent": 2.25, "requestCount": 2 }
  },
  "topTaskTypes": [
    { "taskType": "hr.evaluate_candidate", "spent": 3.50, "count": 5 },
    { "taskType": "crm.lead_score", "spent": 2.25, "count": 8 }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Missing/invalid JWT
- `403 Forbidden` - Insufficient role permissions

**Required Roles:**
- SUPER_ADMIN
- DIRECTOR
- FINANCE_MANAGER

## Usage Examples

### Basic Usage

```typescript
import { AiRouterService } from './modules/ai';

@Injectable()
export class MyService {
  constructor(private aiRouter: AiRouterService) {}

  async evaluateCandidate(cvText: string) {
    const result = await this.aiRouter.call({
      taskType: 'hr.evaluate_candidate',
      prompt: `Evaluate this candidate:\n\n${cvText}`,
      systemPrompt: 'You are an expert HR consultant with 20 years experience.',
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    return result.data.text;
  }
}
```

### With Provider Override

```typescript
const result = await this.aiRouter.call({
  taskType: 'hr.evaluate_candidate',
  prompt: 'Evaluate this candidate...',
  provider: 'claude', // Override default provider
  maxTokens: 2000,
  temperature: 0.5,
});
```

### HTTP Client Example

```bash
# Request
curl -X POST http://localhost:3000/ai/call \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "crm.lead_score",
    "prompt": "Score this lead based on engagement..."
  }'

# Check budget
curl http://localhost:3000/ai/budget \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Cost Calculation

Costs are calculated per request using actual token usage:

```
inputCost = (inputTokens / 1000) * COST_PER_1K[provider].input
outputCost = (outputTokens / 1000) * COST_PER_1K[provider].output
totalCost = inputCost + outputCost
```

**Example:**
- Task: Generate HR interview questions
- Provider: Gemini (selected automatically)
- Tokens: 150 input, 450 output
- Cost: (150/1000 × 0.000075) + (450/1000 × 0.0003) = $0.0001575

## Error Handling

All operations use `Result<T>` pattern:

```typescript
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

Errors are handled gracefully:
- No exceptions thrown in service layer
- All errors logged with context
- Automatic fallback to secondary providers
- Database logging failures don't break requests
- Missing API keys return descriptive errors

## Logging

Service uses Pino Logger via NestJS Logger:

```typescript
this.logger.log(`[AI] hr.evaluate_candidate | openai | $0.000315 | 1250ms`);
this.logger.warn(`[AI] openai xato: Rate limit reached — fallback...`);
this.logger.error(`getTodaySpent failed: Database connection error`);
```

Log format: `[AI] taskType | provider | cost | latency`

## Testing

```typescript
describe('AiRouterService', () => {
  let service: AiRouterService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AiRouterService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const config = {
                OPENAI_API_KEY: 'test-key',
                GEMINI_API_KEY: 'test-key',
                ANTHROPIC_API_KEY: 'test-key',
              };
              return config[key];
            }),
          },
        },
        {
          provide: DrizzleService,
          useValue: { getDb: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AiRouterService);
  });

  it('should call primary provider', async () => {
    const result = await service.call({
      taskType: 'hr.evaluate_candidate',
      prompt: 'Test prompt',
    });

    expect(result.ok).toBe(true);
    expect(result.data.provider).toBeDefined();
  });

  it('should fallback on provider failure', async () => {
    // Mock OpenAI failure
    jest.spyOn(service as any, 'callOpenAi').mockResolvedValueOnce({
      ok: false,
      error: 'Rate limit',
    });

    const result = await service.call({
      taskType: 'hr.evaluate_candidate',
      prompt: 'Test',
      provider: 'openai',
    });

    expect(result.ok).toBe(true); // Should succeed with fallback
  });
});
```

## Performance Considerations

- **Token Caching**: Implement caching for repeated similar queries
- **Rate Limiting**: Configure per-provider rate limits
- **Batch Processing**: Group related tasks for efficiency
- **Async Logging**: Database logging is non-blocking
- **Provider Latency**: Typical latencies: Gemini ~800ms, OpenAI ~1200ms, Claude ~1500ms

## Security

- All endpoints require JWT authentication
- Role-based access control (RBAC)
- Budget enforced at service level
- API keys stored in environment variables (never in code)
- Request/response summaries truncated to 200 chars to prevent PII leakage
- Database logging is asynchronous and non-blocking

## Contributing

When adding new task types:
1. Add type to `AiTaskType` union
2. Add provider mapping to `TASK_PROVIDER_MAP`
3. Document in README under "38 AI Task Types"
4. Test with all three providers

## License

MIT
