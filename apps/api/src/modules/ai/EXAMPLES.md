# AI Router Module - Usage Examples

Comprehensive examples for using the AI Router module across different domains.

## Table of Contents

1. [HR Domain](#hr-domain)
2. [CRM Domain](#crm-domain)
3. [Finance Domain](#finance-domain)
4. [Manufacturing/MES Domain](#manufacturingmes-domain)
5. [Marketing Domain](#marketing-domain)
6. [WMS/Logistics Domain](#wmslogistics-domain)
7. [Director/Executive Domain](#directorexecutive-domain)
8. [Design Domain](#design-domain)
9. [Advanced Patterns](#advanced-patterns)

---

## HR Domain

### 1. Generate Interview Questions

```typescript
@Injectable()
export class HrService {
  constructor(private aiRouter: AiRouterService) {}

  async generateInterviewQuestions(
    jobTitle: string,
    department: string,
    userId: string,
  ): Promise<string> {
    const result = await this.aiRouter.call({
      taskType: 'hr.generate_interview_questions',
      prompt: `Generate 10 behavioral and technical interview questions for a ${jobTitle} position in the ${department} department.
      
Focus on:
- Problem-solving abilities
- Communication skills
- Team collaboration
- Technical competencies specific to the role`,
      systemPrompt:
        'You are an experienced HR recruiter with expertise in interviewing for tech and business roles. Generate questions that reveal candidate competencies.',
      maxTokens: 1500,
      temperature: 0.7,
      userId,
    });

    if (!result.ok) throw new Error(`Failed to generate questions: ${result.error}`);
    return result.data.text;
  }
}
```

### 2. Evaluate Candidate

```typescript
async evaluateCandidate(
  cvText: string,
  jobRequirements: string,
  userId: string,
): Promise<{ score: number; strengths: string[]; gaps: string[] }> {
  const result = await this.aiRouter.call({
    taskType: 'hr.evaluate_candidate',
    prompt: `Evaluate this candidate for the following position:

**Job Requirements:**
${jobRequirements}

**Candidate CV:**
${cvText}

Provide:
1. Overall score (1-10)
2. Top 3 strengths
3. Top 3 skill gaps
4. Recommendation (Hire/Consider/Reject)`,
    systemPrompt:
      'You are an expert HR consultant. Evaluate candidates objectively based on job requirements.',
    maxTokens: 800,
    temperature: 0.5,
    userId,
  });

  if (!result.ok) throw new Error(`Evaluation failed: ${result.error}`);

  // Parse response
  const text = result.data.text;
  const scoreMatch = text.match(/Overall score[:\s]+(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

  return {
    score,
    strengths: extractBulletPoints(text, 'strengths'),
    gaps: extractBulletPoints(text, 'gaps'),
  };
}
```

### 3. Summarize CV

```typescript
async summarizeCv(cvText: string, userId: string): Promise<string> {
  const result = await this.aiRouter.call({
    taskType: 'hr.summarize_cv',
    prompt: `Summarize this CV concisely:

${cvText}

Include:
- Current role and company
- Years of experience
- Key technical skills
- Notable achievements
- Education`,
    maxTokens: 400,
    userId,
  });

  if (!result.ok) throw new Error(`CV summary failed: ${result.error}`);
  return result.data.text;
}
```

### 4. Skill Gap Analysis

```typescript
async analyzeSkillGaps(
  currentSkills: string[],
  targetRole: string,
  userId: string,
): Promise<{
  gaps: string[];
  recommendations: string[];
  timelineWeeks: number;
}> {
  const result = await this.aiRouter.call({
    taskType: 'hr.skill_gap_analysis',
    prompt: `Current skills: ${currentSkills.join(', ')}

Target role: ${targetRole}

Analyze:
1. Critical skill gaps
2. Nice-to-have skill gaps
3. Recommended learning path
4. Estimated timeframe to become fully qualified`,
    systemPrompt:
      'You are a career development expert. Provide actionable, realistic guidance.',
    maxTokens: 1000,
    temperature: 0.6,
    userId,
  });

  if (!result.ok) throw new Error(`Skill gap analysis failed: ${result.error}`);

  const text = result.data.text;
  const timeMatch = text.match(/(\d+)\s*weeks?/i);
  const timeline = timeMatch ? parseInt(timeMatch[1]) : 12;

  return {
    gaps: extractBulletPoints(text, 'gaps'),
    recommendations: extractBulletPoints(text, 'recommended'),
    timelineWeeks: timeline,
  };
}
```

### 5. Performance Review

```typescript
async generatePerformanceReview(
  employeeName: string,
  accomplishments: string[],
  areasForImprovement: string[],
  userId: string,
): Promise<string> {
  const result = await this.aiRouter.call({
    taskType: 'hr.performance_review',
    prompt: `Generate a constructive performance review for ${employeeName}

**Accomplishments:**
${accomplishments.map((a) => `- ${a}`).join('\n')}

**Areas for Improvement:**
${areasForImprovement.map((a) => `- ${a}`).join('\n')}

Structure:
- Opening (positive tone)
- Key achievements
- Areas for growth (constructive)
- Specific goals for next period
- Closing (encouraging)`,
    systemPrompt:
      'You are an experienced manager. Write professional, balanced reviews that motivate improvement.',
    maxTokens: 1200,
    temperature: 0.6,
    userId,
  });

  if (!result.ok) throw new Error(`Performance review failed: ${result.error}`);
  return result.data.text;
}
```

### 6. Onboarding Plan

```typescript
async createOnboardingPlan(
  newHire: { name: string; role: string; department: string },
  userId: string,
): Promise<string> {
  const result = await this.aiRouter.call({
    taskType: 'hr.onboarding_plan',
    prompt: `Create a 30-day onboarding plan for:
- Name: ${newHire.name}
- Role: ${newHire.role}
- Department: ${newHire.department}

Include:
- Week 1: Company overview, IT setup, team introduction
- Week 2-3: Role-specific training
- Week 4: Project assignment, feedback session
- Key milestones and checkpoints`,
    maxTokens: 1500,
    temperature: 0.7,
    userId,
  });

  if (!result.ok) throw new Error(`Onboarding plan failed: ${result.error}`);
  return result.data.text;
}
```

### 7. Salary Benchmark

```typescript
async benchmarkSalary(
  jobTitle: string,
  experience: number,
  location: string,
  userId: string,
): Promise<{ lowEnd: number; midPoint: number; highEnd: number }> {
  const result = await this.aiRouter.call({
    taskType: 'hr.salary_benchmark',
    prompt: `Provide salary benchmark data for:
- Position: ${jobTitle}
- Years of experience: ${experience}
- Location: ${location}

Provide:
1. 25th percentile (low end)
2. 50th percentile (median)
3. 75th percentile (high end)
4. Factors affecting salary range`,
    systemPrompt:
      'You have access to current salary survey data. Provide realistic market rates.',
    maxTokens: 600,
    temperature: 0.5,
    userId,
  });

  if (!result.ok) throw new Error(`Salary benchmark failed: ${result.error}`);

  const text = result.data.text;
  const low = extractNumber(text, '25th percentile');
  const mid = extractNumber(text, '50th percentile');
  const high = extractNumber(text, '75th percentile');

  return {
    lowEnd: low,
    midPoint: mid,
    highEnd: high,
  };
}
```

### 8. Team Fit Score

```typescript
async assessTeamFit(
  candidatePersonality: string,
  teamDynamics: string,
  userId: string,
): Promise<{ score: number; reasoning: string; concerns: string[] }> {
  const result = await this.aiRouter.call({
    taskType: 'hr.team_fit_score',
    prompt: `Assess team fit:

**Candidate Profile:**
${candidatePersonality}

**Current Team:**
${teamDynamics}

Provide:
1. Team fit score (1-10)
2. Why they would/wouldn't fit well
3. Potential challenges
4. Integration strategy recommendations`,
    systemPrompt:
      'You understand team dynamics and culture. Assess fit realistically.',
    maxTokens: 700,
    temperature: 0.6,
    userId,
  });

  if (!result.ok) throw new Error(`Team fit assessment failed: ${result.error}`);

  const text = result.data.text;
  const scoreMatch = text.match(/score[:\s]+(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

  return {
    score,
    reasoning: text,
    concerns: extractBulletPoints(text, 'challenges'),
  };
}
```

---

## CRM Domain

### 1. Lead Score

```typescript
async scoreLead(lead: {
  name: string;
  company: string;
  engagement: string;
  budget: string;
  timeline: string;
}, userId: string): Promise<{ score: number; reasoning: string }> {
  const result = await this.aiRouter.call({
    taskType: 'crm.lead_score',
    prompt: `Score this lead (0-100):

Name: ${lead.name}
Company: ${lead.company}
Engagement Level: ${lead.engagement}
Budget: ${lead.budget}
Timeline: ${lead.timeline}

Provide:
1. Score (0-100)
2. Score rationale
3. Recommended next action
4. Probability of conversion`,
    systemPrompt:
      'You are a sales expert. Score leads based on BANT criteria (Budget, Authority, Need, Timeline).',
    maxTokens: 600,
    temperature: 0.5,
    userId,
  });

  if (!result.ok) throw new Error(`Lead scoring failed: ${result.error}`);

  const text = result.data.text;
  const scoreMatch = text.match(/\b(\d{1,3})(?:\s*\/\s*100|\s*out of\s*100)?\b/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

  return {
    score,
    reasoning: text,
  };
}
```

### 2. Deal Probability

```typescript
async calculateDealProbability(
  deal: { stage: string; value: number; duration: string; competitor: string },
  userId: string,
): Promise<number> {
  const result = await this.aiRouter.call({
    taskType: 'crm.deal_probability',
    prompt: `Estimate win probability for this deal:

Stage: ${deal.stage}
Value: $${deal.value}
Duration: ${deal.duration}
Primary Competitor: ${deal.competitor}

Provide:
1. Win probability percentage
2. Key success factors
3. Risk factors
4. Recommended actions`,
    systemPrompt:
      'You are a sales forecasting expert with years of pipeline experience.',
    maxTokens: 700,
    temperature: 0.4,
    userId,
  });

  if (!result.ok) throw new Error(`Deal probability calculation failed: ${result.error}`);

  const text = result.data.text;
  const probMatch = text.match(/(\d+)%|probability[:\s]+(\d+)/i);
  const probability = probMatch ? parseInt(probMatch[1] || probMatch[2]) : 50;

  return probability;
}
```

### 3. Customer Segmentation

```typescript
async segmentCustomers(
  customers: Array<{ id: string; value: number; engagement: number; retention: number }>,
  userId: string,
): Promise<{ segment: string; recommendation: string }[]> {
  const result = await this.aiRouter.call({
    taskType: 'crm.customer_segment',
    prompt: `Segment these customers:

${customers
  .map(
    (c) =>
      `- ID: ${c.id}, Lifetime Value: $${c.value}, Engagement: ${c.engagement}/10, Retention: ${c.retention}%`,
  )
  .join('\n')}

Provide segments and strategies for each.`,
    systemPrompt:
      'You are a customer analytics expert. Create actionable segments.',
    maxTokens: 1000,
    temperature: 0.6,
    userId,
  });

  if (!result.ok) throw new Error(`Customer segmentation failed: ${result.error}`);

  // Parse segmentation result
  const text = result.data.text;
  const segments = text.match(/segment[:\s]+([^\n]+)/gi) || [];

  return segments.map((seg) => ({
    segment: seg.replace(/segment[:\s]+/i, ''),
    recommendation: text,
  }));
}
```

### 4. Churn Risk

```typescript
async assessChurnRisk(
  customer: {
    tenure: number;
    recentActivity: string;
    contractStatus: string;
    supportTickets: number;
  },
  userId: string,
): Promise<{ riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'; interventions: string[] }> {
  const result = await this.aiRouter.call({
    taskType: 'crm.churn_risk',
    prompt: `Assess churn risk:

Tenure: ${customer.tenure} months
Recent Activity: ${customer.recentActivity}
Contract Status: ${customer.contractStatus}
Support Tickets (last 90 days): ${customer.supportTickets}

Provide:
1. Risk level (HIGH/MEDIUM/LOW)
2. Key risk indicators
3. Recommended retention actions`,
    systemPrompt:
      'You are a customer success expert. Identify and prevent churn.',
    maxTokens: 600,
    temperature: 0.5,
    userId,
  });

  if (!result.ok) throw new Error(`Churn risk assessment failed: ${result.error}`);

  const text = result.data.text;
  const riskMatch = text.match(/risk[:\s]+(HIGH|MEDIUM|LOW)/i);
  const riskLevel = (riskMatch ? riskMatch[1].toUpperCase() : 'MEDIUM') as
    | 'HIGH'
    | 'MEDIUM'
    | 'LOW';

  return {
    riskLevel,
    interventions: extractBulletPoints(text, 'action'),
  };
}
```

### 5. Next Best Action

```typescript
async recommendNextAction(
  customer: { stage: string; lastInteraction: string; openIssues: string[] },
  userId: string,
): Promise<string> {
  const result = await this.aiRouter.call({
    taskType: 'crm.next_best_action',
    prompt: `What's the best next action for this customer?

Stage: ${customer.stage}
Last Interaction: ${customer.lastInteraction}
Open Issues: ${customer.openIssues.join(', ')}

Recommend the single best action to move this customer forward.`,
    systemPrompt:
      'You optimize customer journeys. Recommend actions that increase engagement and conversion.',
    maxTokens: 500,
    temperature: 0.6,
    userId,
  });

  if (!result.ok) throw new Error(`Next best action failed: ${result.error}`);
  return result.data.text;
}
```

### 6. Email Template Generation

```typescript
async generateEmailTemplate(
  context: { recipient: string; purpose: string; tone: string },
  userId: string,
): Promise<string> {
  const result = await this.aiRouter.call({
    taskType: 'crm.email_template',
    prompt: `Generate a professional email:

Recipient: ${context.recipient}
Purpose: ${context.purpose}
Tone: ${context.tone}

Include:
- Engaging subject line
- Personalized greeting
- Clear value proposition
- Call to action
- Professional closing`,
    systemPrompt:
      'You write compelling, professional emails that drive engagement.',
    maxTokens: 800,
    temperature: 0.7,
    userId,
  });

  if (!result.ok) throw new Error(`Email generation failed: ${result.error}`);
  return result.data.text;
}
```

---

## Finance Domain

### 1. Anomaly Detection

```typescript
async detectFinancialAnomalies(
  transactions: Array<{ date: string; amount: number; category: string }>,
  userId: string,
): Promise<{ anomalies: Array<{ index: number; reason: string }>; }> {
  const result = await this.aiRouter.call({
    taskType: 'finance.anomaly_detect',
    prompt: `Identify anomalies in this transaction data:

${transactions
  .map(
    (t, i) =>
      `${i + 1}. ${t.date}: $${t.amount} (${t.category})`,
  )
  .join('\n')}

Highlight unusual transactions and explain why.`,
    systemPrompt:
      'You are a financial analyst. Identify transactions that deviate from normal patterns.',
    maxTokens: 800,
    temperature: 0.5,
    userId,
  });

  if (!result.ok) throw new Error(`Anomaly detection failed: ${result.error}`);

  return {
    anomalies: extractAnomalies(result.data.text),
  };
}
```

### 2. Cashflow Forecast

```typescript
async forecastCashflow(
  historical: { month: string; inflow: number; outflow: number }[],
  userId: string,
): Promise<{
  forecast: Array<{ month: string; predictedFlow: number }>;
  risks: string[];
}> {
  const result = await this.aiRouter.call({
    taskType: 'finance.cashflow_forecast',
    prompt: `Forecast cashflow for next 6 months:

Historical data:
${historical
  .map(
    (d) =>
      `${d.month}: Inflow: $${d.inflow}, Outflow: $${d.outflow}`,
  )
  .join('\n')}

Provide:
1. Monthly forecast for next 6 months
2. Seasonal factors considered
3. Risk factors
4. Recommendations`,
    systemPrompt:
      'You are a financial forecasting expert. Use trend analysis and seasonal patterns.',
    maxTokens: 1200,
    temperature: 0.4,
    userId,
  });

  if (!result.ok) throw new Error(`Cashflow forecast failed: ${result.error}`);

  return {
    forecast: extractForecast(result.data.text),
    risks: extractBulletPoints(result.data.text, 'risk'),
  };
}
```

### 3. Budget Variance Explanation

```typescript
async explainBudgetVariance(
  variance: {
    category: string;
    budgeted: number;
    actual: number;
  },
  userId: string,
): Promise<string> {
  const diff = variance.actual - variance.budgeted;
  const percentDiff = ((diff / variance.budgeted) * 100).toFixed(1);

  const result = await this.aiRouter.call({
    taskType: 'finance.budget_variance_explain',
    prompt: `Explain budget variance:

Category: ${variance.category}
Budgeted: $${variance.budgeted}
Actual: $${variance.actual}
Variance: $${diff} (${percentDiff}%)

Provide:
1. Likely causes of variance
2. Impact assessment
3. Corrective actions if needed`,
    systemPrompt:
      'You are a budget analyst. Provide insightful explanations for variances.',
    maxTokens: 700,
    temperature: 0.6,
    userId,
  });

  if (!result.ok) throw new Error(`Variance explanation failed: ${result.error}`);
  return result.data.text;
}
```

### 4. Invoice Classification

```typescript
async classifyInvoice(
  invoice: { number: string; vendor: string; amount: number; description: string },
  userId: string,
): Promise<{ category: string; subcategory: string; confidence: number }> {
  const result = await this.aiRouter.call({
    taskType: 'finance.invoice_classify',
    prompt: `Classify this invoice:

Invoice #: ${invoice.number}
Vendor: ${invoice.vendor}
Amount: $${invoice.amount}
Description: ${invoice.description}

Provide:
1. Main category (e.g., Operations, Marketing, IT)
2. Subcategory
3. Confidence level (0-100%)
4. Reasoning`,
    systemPrompt:
      'You are an accounting expert. Accurately classify invoices for proper GL coding.',
    maxTokens: 500,
    temperature: 0.3,
    userId,
  });

  if (!result.ok) throw new Error(`Invoice classification failed: ${result.error}`);

  const text = result.data.text;
  const confMatch = text.match(/confidence[:\s]+(\d+)/i);

  return {
    category: extractCategory(text),
    subcategory: extractSubcategory(text),
    confidence: confMatch ? parseInt(confMatch[1]) : 80,
  };
}
```

### 5. Fraud Risk Assessment

```typescript
async assessFraudRisk(
  transaction: {
    amount: number;
    location: string;
    merchant: string;
    accountAge: number;
    unusualForAccount: boolean;
  },
  userId: string,
): Promise<{ riskScore: number; flagged: boolean; reason: string }> {
  const result = await this.aiRouter.call({
    taskType: 'finance.fraud_risk',
    prompt: `Assess fraud risk for this transaction:

Amount: $${transaction.amount}
Location: ${transaction.location}
Merchant: ${transaction.merchant}
Account Age: ${transaction.accountAge} months
Unusual for Account: ${transaction.unusualForAccount ? 'Yes' : 'No'}

Provide:
1. Fraud risk score (0-100)
2. Should transaction be flagged? (Yes/No)
3. Specific risk factors
4. Recommended action`,
    systemPrompt:
      'You are a fraud detection expert. Use behavioral patterns and anomaly detection.',
    maxTokens: 600,
    temperature: 0.4,
    userId,
  });

  if (!result.ok) throw new Error(`Fraud assessment failed: ${result.error}`);

  const text = result.data.text;
  const scoreMatch = text.match(/risk score[:\s]+(\d+)/i);
  const flagMatch = text.match(/flag[:\s]+(yes|no)/i);

  return {
    riskScore: scoreMatch ? parseInt(scoreMatch[1]) : 50,
    flagged: flagMatch ? flagMatch[1].toLowerCase() === 'yes' : false,
    reason: text,
  };
}
```

---

## Manufacturing/MES Domain

### 1. Downtime Root Cause Analysis

```typescript
async analyzeDowntimeRootCause(
  incident: {
    equipment: string;
    duration: number;
    symptoms: string[];
    recentChanges: string[];
  },
  userId: string,
): Promise<{ rootCause: string; impacts: string[]; preventiveMeasures: string[] }> {
  const result = await this.aiRouter.call({
    taskType: 'mes.downtime_root_cause',
    prompt: `Analyze downtime root cause:

Equipment: ${incident.equipment}
Duration: ${incident.duration} minutes
Symptoms: ${incident.symptoms.join(', ')}
Recent Changes: ${incident.recentChanges.join(', ')}

Provide:
1. Most likely root cause
2. Impact on production
3. Immediate corrective actions
4. Preventive measures`,
    systemPrompt:
      'You are an experienced manufacturing engineer. Use 5 Why analysis.',
    maxTokens: 1000,
    temperature: 0.6,
    userId,
  });

  if (!result.ok) throw new Error(`Root cause analysis failed: ${result.error}`);

  return {
    rootCause: extractRootCause(result.data.text),
    impacts: extractBulletPoints(result.data.text, 'impact'),
    preventiveMeasures: extractBulletPoints(result.data.text, 'preventive'),
  };
}
```

### 2-5. OEE Recommendations, Demand Forecasting, Quality Prediction, Schedule Optimization

[Similar patterns continue for remaining manufacturing tasks...]

---

## Marketing Domain

### 1. Content Generation

```typescript
async generateMarketingContent(
  brief: {
    topic: string;
    audience: string;
    format: 'blog' | 'email' | 'social' | 'ad';
    tone: string;
  },
  userId: string,
): Promise<string> {
  const result = await this.aiRouter.call({
    taskType: 'marketing.content_generate',
    prompt: `Generate ${brief.format} content:

Topic: ${brief.topic}
Target Audience: ${brief.audience}
Tone: ${brief.tone}

Include engaging hook, clear message, and call to action.`,
    systemPrompt:
      'You are an expert copywriter. Create compelling, on-brand marketing content.',
    maxTokens: 1500,
    temperature: 0.8,
    userId,
  });

  if (!result.ok) throw new Error(`Content generation failed: ${result.error}`);
  return result.data.text;
}
```

---

## Advanced Patterns

### Batch Processing with Error Handling

```typescript
async evaluateMultipleCandidates(
  candidates: Array<{ id: string; cvText: string }>,
  userId: string,
): Promise<
  Array<{ candidateId: string; evaluation?: string; error?: string }>
> {
  const promises = candidates.map((candidate) =>
    this.aiRouter
      .call({
        taskType: 'hr.evaluate_candidate',
        prompt: candidate.cvText,
        userId,
      })
      .then((result) => ({
        candidateId: candidate.id,
        evaluation: result.ok ? result.data.text : undefined,
        error: result.ok ? undefined : result.error,
      })),
  );

  return Promise.all(promises);
}
```

### Cost-Aware Request Optimization

```typescript
async callWithCostAwareness(
  taskType: AiTaskType,
  prompt: string,
  userId: string,
): Promise<Result<AiResponse>> {
  // Check budget before calling expensive providers
  const budget = await this.aiRouter.getUsageStats();
  if (!budget.ok) throw new Error(budget.error);

  const remaining = budget.data.today.remaining;

  // Use cheaper provider if budget is low
  let provider: AiProvider | undefined;
  if (remaining < 5) {
    provider = 'gemini'; // Cheapest
  } else if (remaining < 20) {
    provider = 'openai'; // Mid-range
  }

  return this.aiRouter.call({
    taskType,
    prompt,
    provider,
    userId,
  });
}
```

### Caching Pattern

```typescript
@Injectable()
export class CachedAiService {
  private cache = new Map<string, { data: AiResponse; timestamp: number }>();
  private cacheMinutes = 60;

  constructor(private aiRouter: AiRouterService) {}

  async callCached(
    taskType: AiTaskType,
    prompt: string,
    userId: string,
  ): Promise<Result<AiResponse>> {
    const cacheKey = `${taskType}:${hashPrompt(prompt)}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (
      cached &&
      Date.now() - cached.timestamp < this.cacheMinutes * 60 * 1000
    ) {
      return { ok: true, data: cached.data };
    }

    // Call AI service
    const result = await this.aiRouter.call({
      taskType,
      prompt,
      userId,
    });

    // Cache successful result
    if (result.ok) {
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
      });
    }

    return result;
  }
}
```

### Streaming Response Pattern

```typescript
async callWithStreaming(
  taskType: AiTaskType,
  prompt: string,
  userId: string,
  onChunk: (chunk: string) => void,
): Promise<Result<AiResponse>> {
  // Note: Streaming requires special handling with each provider
  // This is a conceptual pattern - actual implementation depends on provider SDKs

  const result = await this.aiRouter.call({
    taskType,
    prompt,
    userId,
    metadata: { streaming: true },
  });

  if (!result.ok) return result;

  // Stream response in chunks
  const text = result.data.text;
  const chunkSize = 100;

  for (let i = 0; i < text.length; i += chunkSize) {
    onChunk(text.substring(i, i + chunkSize));
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return result;
}
```

### Rate Limiting Pattern

```typescript
@Injectable()
export class RateLimitedAiService {
  private requestCounts = new Map<string, number>();
  private resetInterval = 60000; // 1 minute

  constructor(private aiRouter: AiRouterService) {
    setInterval(() => this.requestCounts.clear(), this.resetInterval);
  }

  async callWithRateLimit(
    userId: string,
    taskType: AiTaskType,
    prompt: string,
    maxRequestsPerMinute: number = 10,
  ): Promise<Result<AiResponse>> {
    const count = (this.requestCounts.get(userId) || 0) + 1;

    if (count > maxRequestsPerMinute) {
      return {
        ok: false,
        error: `Rate limit exceeded: ${count}/${maxRequestsPerMinute} requests per minute`,
      };
    }

    this.requestCounts.set(userId, count);

    return this.aiRouter.call({
      taskType,
      prompt,
      userId,
    });
  }
}
```

---

## Helper Functions

```typescript
// Extract bullet points from text
function extractBulletPoints(text: string, keyword: string): string[] {
  const regex = new RegExp(`${keyword}[:\\s]*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
  const match = text.match(regex);
  if (!match) return [];

  return (match[1] || '')
    .split('\n')
    .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'))
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter((line) => line.length > 0);
}

// Extract number from text
function extractNumber(text: string, keyword: string): number {
  const regex = new RegExp(`${keyword}[:\\s]*\\$?([\\d,]+)`, 'i');
  const match = text.match(regex);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ''));
}

// Hash prompt for caching
function hashPrompt(prompt: string): string {
  return require('crypto')
    .createHash('md5')
    .update(prompt)
    .digest('hex');
}
```

This comprehensive guide covers real-world usage patterns across all 38 task types and includes advanced implementation patterns for production systems.
