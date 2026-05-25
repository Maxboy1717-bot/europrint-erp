/**
 * @module job-offer.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const JOB_OFFER_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'] as const;
export type JobOfferStatus = typeof JOB_OFFER_STATUSES[number];

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'ISO date string expected' });

export const CreateJobOfferSchema = z.object({
  vacancyId:          z.number().int().optional(),
  candidateId:        z.number().int(),
  funnelId:           z.number().int().optional(),
  position:           z.string().min(1),
  department:         z.string().optional(),
  startDate:          isoDate.optional(),
  probationMonths:    z.number().int().optional(),
  salaryProbation:    z.number().int().optional(),
  salaryAfter:        z.number().int().optional(),
  workSchedule:       z.string().optional(),
  additionalBenefits: z.string().optional(),
  offerExpiresAt:     isoDate.optional(),
});
export class CreateJobOfferDto extends createZodDto(CreateJobOfferSchema) {}

export const UpdateJobOfferStatusSchema = z.object({
  status:        z.enum(JOB_OFFER_STATUSES),
  declineReason: z.string().optional(),
});
export class UpdateJobOfferStatusDto extends createZodDto(UpdateJobOfferStatusSchema) {}
