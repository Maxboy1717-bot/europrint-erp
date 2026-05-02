# AI Module Integration Guide

Complete setup and integration instructions for the AI Router module.

## Quick Start

### 1. Install the Module

Copy the entire `ai/` directory into `/src/modules/`.

### 2. Install Dependencies

```bash
npm install openai @google/generative-ai @anthropic-ai/sdk
npm install drizzle-orm pg
npm install zod @anatine/zod-nestjs
```

### 3. Configure Environment

Create `.env` file:

```env
# AI Provider API Keys
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
GEMINI_API_KEY=AIzaSyDEVERSE_OF_YOUR_KEY
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db
```

### 4. Import Module

In `app.module.ts`:

```typescript
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    // ... other modules
    AiModule,
  ],
})
export class AppModule {}
```

### 5. Setup Database

Run migrations to create `ai_usage_logs` table:

```bash
npm run migrate
```

Or execute SQL directly:

```sql
CREATE TABLE IF NOT EXISTS ai_usage_logs (
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

CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX idx_ai_usage_logs_task_type ON ai_usage_logs(task_type);
```

## Directory Structure

```
src/
├── common/
│   └── services/
│       └── drizzle.service.ts         # Inject this into AiRouterService
├── auth/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts          # Used in AiController
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   └── types/
│       ├── role.ts                    # Enum with roles
│       └── authenticated-user.ts      # Interface for CurrentUser
└── modules/
    └── ai/                            # New AI Module
        ├── ai.module.ts
        ├── domain/
        ├── application/
        ├── infrastructure/
        ├── presentation/
        └── README.md
```

## Expected Interfaces

These interfaces should already exist in your project. The AI module expects them:

### DrizzleService

```typescript
// src/common/services/drizzle.service.ts
@Injectable()
export class DrizzleService {
  private db: NodePgDatabase;

  constructor(private configService: ConfigService) {
    this.initializeDb();
  }

  getDb(): NodePgDatabase {
    return this.db;
  }

  private initializeDb() {
    // Initialize Drizzle ORM connection
  }
}
```

### Auth Types

```typescript
// src/auth/types/authenticated-user.ts
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Role[];
  // ... other fields
}

// src/auth/types/role.ts
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
  HR_MANAGER = 'HR_MANAGER',
  SALES_MANAGER = 'SALES_MANAGER',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  PRODUCTION_MANAGER = 'PRODUCTION_MANAGER',
  // ... other roles
}
```

### Guards & Decorators

```typescript
// src/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // JWT validation logic
  }
}

// src/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Role validation logic
  }
}

// src/auth/decorators/roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// src/auth/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
```

## Module Dependencies

The AI module requires:

```typescript
@Module({
  imports: [
    ConfigModule,      // For API keys
    EventEmitterModule, // For potential event-driven features
  ],
  providers: [AiRouterService],
  controllers: [AiController],
  exports: [AiRouterService],
})
export class AiModule {}
```

All three modules should already be imported in `AppModule`:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    // ... other modules
    AiModule,
  ],
})
export class AppModule {}
```

## API Key Setup

### OpenAI

1. Create account at https://platform.openai.com
2. Go to API Keys: https://platform.openai.com/api-keys
3. Create new secret key
4. Add to `.env`: `OPENAI_API_KEY=sk-...`

Cost: $0.15 per 1M input tokens, $0.60 per 1M output tokens

### Google Gemini

1. Create account at https://makersuite.google.com
2. Create API key: https://makersuite.google.com/app/apikey
3. Add to `.env`: `GEMINI_API_KEY=AIza...`

Cost: $0.075 per 1M input tokens, $0.30 per 1M output tokens

### Anthropic Claude

1. Create account at https://console.anthropic.com
2. Create API key: https://console.anthropic.com/account/keys
3. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

Cost: $0.80 per 1M input tokens, $4.00 per 1M output tokens

## Testing the Integration

### 1. Start Application

```bash
npm start
```

### 2. Get JWT Token

Authenticate to get a valid JWT token for testing.

### 3. Test Endpoint

```bash
curl -X POST http://localhost:3000/ai/call \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "hr.evaluate_candidate",
    "prompt": "Evaluate this candidate based on leadership experience and technical skills."
  }'
```

Expected response:

```json
{
  "text": "Based on the evaluation criteria...",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "inputTokens": 45,
  "outputTokens": 230,
  "estimatedCostUsd": 0.00024,
  "latencyMs": 1240
}
```

### 4. Check Budget

```bash
curl http://localhost:3000/ai/budget \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:

```json
{
  "today": {
    "spent": 0.00024,
    "remaining": 49.99976,
    "budget": 50,
    "requestCount": 1
  },
  "byProvider": {
    "openai": { "spent": 0.00024, "requestCount": 1 },
    "gemini": { "spent": 0, "requestCount": 0 },
    "claude": { "spent": 0, "requestCount": 0 }
  },
  "topTaskTypes": [
    {
      "taskType": "hr.evaluate_candidate",
      "spent": 0.00024,
      "count": 1
    }
  ]
}
```

## Using in Other Services

### Import and Inject

```typescript
import { AiRouterService } from './modules/ai';

@Injectable()
export class HrService {
  constructor(private aiRouter: AiRouterService) {}

  async generateInterviewQuestions(jobDescription: string, userId: string) {
    const result = await this.aiRouter.call({
      taskType: 'hr.generate_interview_questions',
      prompt: `Generate 5 interview questions for this role:\n\n${jobDescription}`,
      userId,
    });

    if (!result.ok) {
      throw new Error(`AI failed: ${result.error}`);
    }

    return result.data.text;
  }
}
```

### Multiple Calls

```typescript
async function evaluateCandidates(cvTexts: string[], userId: string) {
  const evaluations = await Promise.allSettled(
    cvTexts.map((cv) =>
      aiRouter.call({
        taskType: 'hr.evaluate_candidate',
        prompt: `Evaluate:\n\n${cv}`,
        userId,
      }),
    ),
  );

  return evaluations
    .filter((result) => result.status === 'fulfilled' && result.value.ok)
    .map((result) => result.value.data.text);
}
```

### With Error Handling

```typescript
async function scoreLeads(leads: Lead[], userId: string) {
  const results = [];

  for (const lead of leads) {
    const result = await aiRouter.call({
      taskType: 'crm.lead_score',
      prompt: `Score this lead: ${JSON.stringify(lead)}`,
      maxTokens: 500,
      userId,
    });

    if (!result.ok) {
      console.error(`Failed to score lead ${lead.id}: ${result.error}`);
      results.push({ leadId: lead.id, score: null, error: result.error });
    } else {
      results.push({
        leadId: lead.id,
        score: parseInt(result.data.text),
        provider: result.data.provider,
      });
    }
  }

  return results;
}
```

## Monitoring

### Check Logs

```bash
# Watch logs for AI requests
docker logs -f <container_id> | grep "\[AI\]"
```

Log format: `[AI] taskType | provider | cost | latency`

Example:
```
[AI] hr.evaluate_candidate | openai | $0.000315 | 1250ms
[AI] crm.lead_score | gemini | $0.000125 | 850ms
[AI] director.kpi_explain | claude | $0.002400 | 1500ms
```

### Database Queries

```sql
-- Today's spending by provider
SELECT provider, COUNT(*) as count, SUM(CAST(estimated_cost_usd AS FLOAT)) as total
FROM ai_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
GROUP BY provider;

-- Top task types
SELECT task_type, COUNT(*) as count, SUM(CAST(estimated_cost_usd AS FLOAT)) as total
FROM ai_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
GROUP BY task_type
ORDER BY total DESC
LIMIT 10;

-- Average latency by provider
SELECT provider, AVG(latency_ms) as avg_latency
FROM ai_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
GROUP BY provider;

-- Usage by user
SELECT user_id, COUNT(*) as count, SUM(CAST(estimated_cost_usd AS FLOAT)) as total
FROM ai_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
GROUP BY user_id
ORDER BY total DESC;
```

## Troubleshooting

### "OPENAI_API_KEY konfiguratsiyasi yo`q"

**Problem**: ConfigService not finding API key

**Solution**:
1. Check `.env` file exists in root
2. Verify key name matches: `OPENAI_API_KEY`
3. Restart application after changing `.env`

### "Barcha AI provayderlar ishlamaydi"

**Problem**: All providers failed

**Solution**:
1. Check API keys are valid
2. Check rate limits haven't been exceeded
3. Check network connectivity
4. Check provider status pages
5. Enable debug logging to see specific errors

### "AI kunlik byudjet oshdi"

**Problem**: Daily budget limit reached

**Solution**:
1. Check `/ai/budget` endpoint for spending breakdown
2. Identify high-cost task types
3. Consider switching to cheaper providers for non-critical tasks
4. Increase budget if needed by changing `DAILY_BUDGET_USD` constant

### High Latency

**Problem**: Requests taking longer than expected

**Solution**:
1. Claude is slowest (~1500ms) - use for complex reasoning only
2. Gemini is fastest (~800ms) - use for simple generation
3. Batch related requests to minimize overhead
4. Check database performance for logging

### Database Connection Error

**Problem**: "Malumot bazasi xatosi" on getTodaySpent

**Solution**:
1. Verify DATABASE_URL is correct
2. Check database is running
3. Check DrizzleService is initialized
4. Verify ai_usage_logs table exists

## Performance Optimization

### 1. Provider Tuning

Adjust `TASK_PROVIDER_MAP` based on your usage patterns:

```typescript
// Fast generation tasks → Gemini
'marketing.content_generate': 'gemini',

// Complex reasoning → Claude
'director.strategic_recommend': 'claude',

// Balanced tasks → OpenAI
'crm.deal_probability': 'openai',
```

### 2. Token Limits

Reduce unnecessary token usage:

```typescript
const result = await aiRouter.call({
  taskType: 'marketing.ad_copy',
  prompt: 'Generate 3 ad headlines...',
  maxTokens: 300, // Keep low for simple outputs
});
```

### 3. Temperature Tuning

Adjust for determinism:

```typescript
// Creative tasks → higher temperature
temperature: 0.9,

// Analytical tasks → lower temperature
temperature: 0.3,
```

### 4. Batch Processing

Process multiple items efficiently:

```typescript
const tasks = candidates.map((cv) => ({
  taskType: 'hr.summarize_cv' as const,
  prompt: cv.text,
  userId,
}));

const results = await Promise.all(
  tasks.map((task) => aiRouter.call(task)),
);
```

## Production Checklist

- [ ] All API keys configured in environment
- [ ] Database migrations applied
- [ ] DrizzleService properly initialized
- [ ] Auth guards and decorators in place
- [ ] Daily budget set appropriately for organization
- [ ] Logging configured and monitored
- [ ] Error handling in place for dependent services
- [ ] Rate limiting implemented if needed
- [ ] Database backups configured
- [ ] Cost alerts/monitoring set up
- [ ] User roles properly assigned
- [ ] API documentation reviewed
- [ ] Load testing completed
- [ ] Security audit completed

## Next Steps

1. **Caching**: Implement result caching for repeated queries
2. **Webhooks**: Add async processing with webhooks
3. **Streaming**: Implement streaming responses for large outputs
4. **Fine-tuning**: Create custom models based on domain-specific training
5. **Analytics**: Add detailed usage analytics dashboard
6. **Cost Optimization**: Implement intelligent provider selection based on cost vs quality
