/**
 * @module types
 * @description React page component. Route-level UI.
 */

import { z } from "zod";

import { tLabel } from '@/lib/i18n/tLabel';
export interface Skill {
  id: string;
  code: string;
  name: string;
  nameRu: string;
  category: string;
  description?: string;
  descriptionRu?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
}

export interface EmployeeSkillRecord {
  id: string;
  userId: string;
  skillId: string;
  level: number;
  notes?: string;
}

export const skillFormSchema = z.object({
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(1, "Nom (UZ) talab qilinadi"),
  nameRu: z.string().min(1, "Nom (RU) talab qilinadi"),
  category: z.string().min(1, "Kategoriya talab qilinadi"),
  description: z.string().optional(),
  descriptionRu: z.string().optional(),
});

export type SkillFormValues = z.infer<typeof skillFormSchema>;

export const employeeSkillFormSchema = z.object({
  userId: z.string().min(1, "Xodim talab qilinadi"),
  skillId: z.string().min(1, "Ko'nikma talab qilinadi"),
  level: z.number().min(1).max(5),
  notes: z.string().optional(),
});

export type EmployeeSkillFormValues = z.infer<typeof employeeSkillFormSchema>;

export function getLevelBadge(level: number) {
  const levels = [
    { label: tLabel('common..boshlangich', "Boshlang'ich"), variant: "secondary" as const },
    { label: "Oddiy", variant: "outline" as const },
    { label: tLabel('common..orta', "O'rta"), variant: "default" as const },
    { label: "Yuqori", variant: "default" as const },
    { label: "Mutaxassis", variant: "default" as const },
  ];
  return levels[level - 1] || levels[0];
}
