/**
 * @module DealDetailSheet.types
 * @description Types, schema and form values for DealDetailSheet.
 * Split from DealDetailSheet.tsx (Rule 16).
 */

import { z } from "zod";

export type Deal = {
  id: number;
  title: string;
  categoryId: number;
  stageId: string;
  opportunity: number;
  currencyId: string;
  probability: number;
  companyId: number | null;
  contactIds: number[];
  beginDate: string | null;
  closeDate: string | null;
  assignedById: string;
  comments: string | null;
  additionalInfo: string | null;
  dateCreate: string;
  dateModify: string;
};

export type Contact = {
  id: number;
  name: string;
  lastName: string;
};

export type Company = {
  id: number;
  title: string;
};

export interface DealDetailSheetProps {
  dealId: number | null;
  open: boolean;
  onClose: () => void;
}

export const dealFormSchema = z.object({
  title:          z.string().min(1, "Kelishuv nomi kerak"),
  opportunity:    z.number().min(0, "Summa 0 dan katta bo'lishi kerak"),
  probability:    z.number().min(0).max(100).optional(),
  companyId:      z.number().nullable().optional(),
  beginDate:      z.string().optional(),
  closeDate:      z.string().optional(),
  comments:       z.string().optional(),
  additionalInfo: z.string().optional(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;
