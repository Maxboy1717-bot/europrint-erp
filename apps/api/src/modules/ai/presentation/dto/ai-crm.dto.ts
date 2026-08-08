/**
 * @module ai-crm.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

// Audit 2026-08-08 (Savdo-CRM production-readiness audit): AiCrmPage.tsx never sent
// `activityData`/`lastActivities` at all (churn-risk/next-best-action buttons take just
// an id — same call shape as the working score-lead/deal-probability tabs) — both fields
// are only ever JSON-dumped into an AI prompt as optional enrichment (crm-ai.service.ts
// buildChurnRiskPrompt / nextBestAction), never a hard business requirement, so making
// them optional-with-default doesn't change AI behaviour when absent, it just stops a
// missing-key Zod rejection that blocked every call (400 every time — Q-18).
export const AiCrmChurnRiskDtoSchema = z.object({
  activityData: z.record(z.string(), z.unknown()).default({}),
});
export type AiCrmChurnRiskDto = z.infer<typeof AiCrmChurnRiskDtoSchema>;

export const AiCrmEmailTemplateDtoSchema = z.object({
  purpose: z.enum(['FOLLOW_UP', 'PROPOSAL', 'RE_ENGAGE', 'THANK_YOU']),
  // `Deal` (AiCrmPageTypes.ts) has no linked-contact field yet — FE sends the deal
  // title as a best-effort stand-in for who the email addresses. Optional so a
  // missing value degrades to a generic salutation server-side, not a 400.
  contactName: z.string().max(100).optional(),
  context: z.string().min(1).max(2000),
});
export type AiCrmEmailTemplateDto = z.infer<typeof AiCrmEmailTemplateDtoSchema>;

export const AiCrmNextBestActionDtoSchema = z.object({
  lastActivities: z.array(z.string()).min(0).max(50).default([]),
});
export type AiCrmNextBestActionDto = z.infer<typeof AiCrmNextBestActionDtoSchema>;
