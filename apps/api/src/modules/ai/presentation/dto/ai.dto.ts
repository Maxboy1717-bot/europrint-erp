/**
 * @module ai.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { AiTaskType } from '../../domain/types/ai.types';

const MAX_PROMPT_LENGTH = 10_000;
const MAX_SYSTEM_PROMPT_LENGTH = 5_000;
const MAX_AI_OUTPUT_TOKENS = 4_096;
const MAX_TEMPERATURE = 2;

const taskTypeValues: [AiTaskType, ...AiTaskType[]] = [
  // HR AI (8)
  'hr.generate_interview_questions',
  'hr.evaluate_candidate',
  'hr.summarize_cv',
  'hr.skill_gap_analysis',
  'hr.performance_review',
  'hr.onboarding_plan',
  'hr.salary_benchmark',
  'hr.team_fit_score',
  // CRM AI (6)
  'crm.lead_score',
  'crm.deal_probability',
  'crm.customer_segment',
  'crm.churn_risk',
  'crm.next_best_action',
  'crm.email_template',
  // MES/PP AI (5)
  'mes.downtime_root_cause',
  'mes.oee_recommendation',
  'mes.demand_forecast',
  'mes.quality_prediction',
  'mes.schedule_optimize',
  // Finance AI (5)
  'finance.anomaly_detect',
  'finance.cashflow_forecast',
  'finance.budget_variance_explain',
  'finance.invoice_classify',
  'finance.fraud_risk',
  // WMS/Logistics AI (4)
  'wms.reorder_point',
  'wms.stock_optimize',
  'logistics.route_optimize',
  'logistics.delivery_predict',
  // Marketing AI (4)
  'marketing.content_generate',
  'marketing.seo_optimize',
  'marketing.ad_copy',
  'marketing.sentiment_analyze',
  // Director AI (3)
  'director.kpi_explain',
  'director.risk_assess',
  'director.strategic_recommend',
  // Design AI (3)
  'design.color_suggest',
  'design.layout_critique',
  'design.brand_check',
  // Prepress AI (1)
  'prepress.vision_preflight',
];

const AiCallDtoSchema = z.object({
  taskType: z.enum(taskTypeValues).describe('AI task type'),
  prompt: z
    .string()
    .min(1, 'Prompt bo`sh bo`lishi mumkin emas')
    .max(MAX_PROMPT_LENGTH, `Prompt ${MAX_PROMPT_LENGTH} ta belgidan oshmasligi kerak`)
    .describe('Task prompt'),
  systemPrompt: z
    .string()
    .max(MAX_SYSTEM_PROMPT_LENGTH, `System prompt ${MAX_SYSTEM_PROMPT_LENGTH} ta belgidan oshmasligi kerak`)
    .optional()
    .describe('Optional system prompt'),
  provider: z
    .enum(['openai', 'gemini', 'claude'])
    .optional()
    .describe('Preferred AI provider (optional, auto-selected if not specified)'),
  maxTokens: z
    .number()
    .int()
    .min(1, 'maxTokens kamida 1 bo`lishi kerak')
    .max(MAX_AI_OUTPUT_TOKENS, `maxTokens ${MAX_AI_OUTPUT_TOKENS} dan oshmasligi kerak`)
    .optional()
    .describe('Maximum output tokens'),
  temperature: z
    .number()
    .min(0, 'Temperature 0 dan kichik bo`lishi mumkin emas')
    .max(MAX_TEMPERATURE, `Temperature ${MAX_TEMPERATURE} dan oshmasligi kerak`)
    .optional()
    .describe('Sampling temperature'),
});

export class AiCallDto extends createZodDto(AiCallDtoSchema) {}

export const getAiCallDtoSchema = () => AiCallDtoSchema;
