/**
 * @module ai.types
 * @description Type-only exports (interfaces, type aliases, enums). No runtime code.
 */

import { CLAUDE_DEFAULT_MODEL } from '@common/constants/app.constants';

export type AiProvider = 'openai' | 'gemini' | 'claude';

export type AiTaskType =
  // HR AI (8)
  | 'hr.generate_interview_questions'
  | 'hr.evaluate_candidate'
  | 'hr.summarize_cv'
  | 'hr.skill_gap_analysis'
  | 'hr.performance_review'
  | 'hr.onboarding_plan'
  | 'hr.salary_benchmark'
  | 'hr.team_fit_score'
  // CRM AI (6)
  | 'crm.lead_score'
  | 'crm.deal_probability'
  | 'crm.customer_segment'
  | 'crm.churn_risk'
  | 'crm.next_best_action'
  | 'crm.email_template'
  // MES/PP AI (5)
  | 'mes.downtime_root_cause'
  | 'mes.oee_recommendation'
  | 'mes.demand_forecast'
  | 'mes.quality_prediction'
  | 'mes.schedule_optimize'
  // Finance AI (5)
  | 'finance.anomaly_detect'
  | 'finance.cashflow_forecast'
  | 'finance.budget_variance_explain'
  | 'finance.invoice_classify'
  | 'finance.fraud_risk'
  // WMS/Logistics AI (4)
  | 'wms.reorder_point'
  | 'wms.stock_optimize'
  | 'logistics.route_optimize'
  | 'logistics.delivery_predict'
  // Marketing AI (4)
  | 'marketing.content_generate'
  | 'marketing.seo_optimize'
  | 'marketing.ad_copy'
  | 'marketing.sentiment_analyze'
  // Director AI (3)
  | 'director.kpi_explain'
  | 'director.risk_assess'
  | 'director.strategic_recommend'
  // Design AI (3)
  | 'design.color_suggest'
  | 'design.layout_critique'
  | 'design.brand_check'
  // Prepress AI (1)
  | 'prepress.vision_preflight'
  // Communication Center AI (2)
  | 'cc.interview_question'
  | 'cc.generate_document';

/**
 * Optional vision input (2.10-ai-ocr-rasm-fix): raw image bytes (base64) sent ALONGSIDE
 * `prompt` so providers analyze the actual picture instead of a file-path string. All three
 * providers support single-image vision calls (Claude image content-block, OpenAI
 * `image_url` data URI, Gemini `inlineData`) — `AiRouterService` maps this to each SDK's
 * native shape. Callers that omit `image` keep the pure-text behaviour unchanged.
 */
export interface AiImageInput {
  /** Base64-encoded image bytes (no `data:` prefix). */
  base64: string;
  /** e.g. 'image/jpeg' | 'image/png' | 'image/webp'. */
  mediaType: string;
}

export interface AiRequest {
  taskType: AiTaskType;
  prompt: string;
  systemPrompt?: string;
  provider?: AiProvider;
  maxTokens?: number;
  temperature?: number;
  userId?: string | number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  /** Optional vision input — see `AiImageInput`. */
  image?: AiImageInput;
}

export interface AiResponse {
  text: string;
  provider: AiProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
}

export const TASK_PROVIDER_MAP: Record<AiTaskType, AiProvider> = {
  'hr.generate_interview_questions': 'gemini',
  'hr.evaluate_candidate': 'openai',
  'hr.summarize_cv': 'gemini',
  'hr.skill_gap_analysis': 'openai',
  'hr.performance_review': 'openai',
  'hr.onboarding_plan': 'gemini',
  'hr.salary_benchmark': 'openai',
  'hr.team_fit_score': 'gemini',
  'crm.lead_score': 'gemini',
  'crm.deal_probability': 'openai',
  'crm.customer_segment': 'gemini',
  'crm.churn_risk': 'openai',
  'crm.next_best_action': 'openai',
  'crm.email_template': 'gemini',
  'mes.downtime_root_cause': 'openai',
  'mes.oee_recommendation': 'openai',
  'mes.demand_forecast': 'gemini',
  'mes.quality_prediction': 'openai',
  'mes.schedule_optimize': 'claude',
  'finance.anomaly_detect': 'openai',
  'finance.cashflow_forecast': 'openai',
  'finance.budget_variance_explain': 'claude',
  'finance.invoice_classify': 'gemini',
  'finance.fraud_risk': 'openai',
  'wms.reorder_point': 'gemini',
  'wms.stock_optimize': 'openai',
  'logistics.route_optimize': 'openai',
  'logistics.delivery_predict': 'gemini',
  'marketing.content_generate': 'gemini',
  'marketing.seo_optimize': 'gemini',
  'marketing.ad_copy': 'claude',
  'marketing.sentiment_analyze': 'gemini',
  'director.kpi_explain': 'claude',
  'director.risk_assess': 'claude',
  'director.strategic_recommend': 'claude',
  'design.color_suggest': 'gemini',
  'design.layout_critique': 'openai',
  'design.brand_check': 'openai',
  'prepress.vision_preflight': 'gemini',
  'cc.interview_question': 'claude',
  'cc.generate_document':  'claude',
};

export const PROVIDER_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
  claude: CLAUDE_DEFAULT_MODEL,
};

export const COST_PER_1K: Record<AiProvider, { input: number; output: number }> = {
  openai: { input: 0.000_15, output: 0.000_6 },
  gemini: { input: 0.000_075, output: 0.000_3 },
  claude: { input: 0.000_8, output: 0.004 },
};

export const PROVIDER_FALLBACK: AiProvider[] = ['gemini', 'openai', 'claude'];
export const DAILY_BUDGET_USD = 50;

export type { Result } from '@common/result';

export interface UsageStats {
  today: {
    spent: number;
    remaining: number;
    budget: number;
    requestCount: number;
  };
  byProvider: Record<AiProvider, { spent: number; requestCount: number }>;
  topTaskTypes: Array<{ taskType: AiTaskType; spent: number; count: number }>;
}
