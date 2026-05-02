import { z } from 'zod';

export const AiDirectorKpiExplainDtoSchema = z.object({
  kpiName: z.string().min(1).max(200),
  currentValue: z.union([z.number(), z.string()]),
  targetValue: z.union([z.number(), z.string()]),
  historicalValues: z.array(
    z.object({
      period: z.string().min(1),
      value: z.union([z.number(), z.string()]),
    }),
  ),
  context: z.string().min(1).max(2000),
});
export type AiDirectorKpiExplainDto = z.infer<typeof AiDirectorKpiExplainDtoSchema>;

export const AiDirectorRiskAssessDtoSchema = z.object({
  companyData: z.record(z.string(), z.unknown()),
});
export type AiDirectorRiskAssessDto = z.infer<typeof AiDirectorRiskAssessDtoSchema>;

export const AiDirectorStrategicDtoSchema = z.object({
  businessContext: z.record(z.string(), z.unknown()),
});
export type AiDirectorStrategicDto = z.infer<typeof AiDirectorStrategicDtoSchema>;
