/**
 * @module DisciplineTypes
 * @description Shared types, schema, and helpers for Discipline.
 */

import { z } from "zod";
import type { DisciplineRecord } from "@shared/schema";

export const disciplineFormSchema = z.object({
  userId: z.string().min(1, "Xodimni tanlang"),
  type:   z.string().min(1, "Turini tanlang"),
  amount: z.number().optional(),
  reason: z.string().min(1, "Sababni kiriting").max(1000, "Sabab 1000 belgidan oshmasligi kerak"),
});

export type DisciplineWithUser = DisciplineRecord & {
  userName?: string;
  givenByName?: string;
};

export type DialogType = "warning" | "penalty" | "reward" | "act";

export interface DisciplineFormState {
  isDialogOpen: boolean;
  dialogType: DialogType;
  selectedEmployee: string;
  amount: string;
  reason: string;
  warningType: string;
}

export const INITIAL_FORM_STATE: DisciplineFormState = {
  isDialogOpen:     false,
  dialogType:       "warning",
  selectedEmployee: "",
  amount:           "",
  reason:           "",
  warningType:      "oral",
};
