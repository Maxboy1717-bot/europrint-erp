/**
 * @module sd-customers.schemas
 * @description Zod validation schemas for SdCustomers endpoints (Rule 16 split).
 */
import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  name: z.string().max(500).optional(),
  title: z.string().max(500).optional(),
  inn: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(2000).optional(),
}).passthrough();

export const AddContactSchema = z.object({
  full_name: z.string().max(200),
  phone: z.string().max(50).optional(),
  email: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  is_primary: z.boolean().optional(),
  influence_level: z.string().max(50).optional(),
  is_decision_maker: z.boolean().optional(),
  department: z.string().max(200).optional(),
  linkedin_url: z.string().max(500).optional(),
  role_note: z.string().max(2000).optional(),
  telegram: z.string().max(200).optional(),
}).passthrough();

export const UpdateContactBodySchema = z.object({
  full_name: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  influence_level: z.string().max(50).optional(),
  is_decision_maker: z.boolean().optional(),
  department: z.string().max(200).optional(),
  linkedin_url: z.string().max(500).optional(),
  role_note: z.string().max(2000).optional(),
  telegram: z.string().max(200).optional(),
}).passthrough();

export const AddCompetitorSchema = z.object({
  competitor_name: z.string().max(500).optional(),
  name: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

export const AddNpsSchema = z.object({
  score: z.number().min(0).max(10),
  comment: z.string().max(2000).optional(),
}).passthrough();

export const UpdateInternalNotesSchema = z.object({
  // Matches what the repo reads + the FE sends: relationship_quality, internal_notes
  // (-> notes column), share_of_wallet. (`notes` was a phantom — the repo reads
  // body.internal_notes; risk_level/internal_classification have no column.)
  relationship_quality: z.string().max(100).optional(),
  internal_notes: z.string().max(5000).optional(),
  share_of_wallet: z.number().nonnegative().optional(),
});

export const CreateComplaintSchema = z.object({
  subject: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  severity: z.string().max(50).optional(),
}).passthrough();

export const SD_WRITE_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'] as const;
