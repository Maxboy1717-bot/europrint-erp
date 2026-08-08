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

/**
 * Audit 2026-08-08: bu avval {userId,skillId,level} deb yozilgan edi — real BE
 * (hr-compat-a.repository.ts getEmployeeSkills, `employee_skills` jadvali) bunday
 * ustunlarni umuman qaytarmaydi. skill_catalog.id ga FK yo'q — skill_name erkin matn,
 * employee_name esa JOIN orqali allaqachon tayyor keladi.
 */
export interface EmployeeSkillRecord {
  id: string;
  employee_id: number;
  employee_name?: string;
  skill_name: string;
  proficiency_level: string;
  proficiency_score: number;
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

// Forma o'zi employee/skill'ni dropdown orqali tanlaydi (real ID/nom, xato-bardosh) —
// BE haqiqiy shakliga o'tkazish (employee_id/skill_name/proficiency_level/score)
// SkillsMatrix.tsx'dagi onEmployeeSkillSubmit'da bajariladi (BE skill_name'ni erkin
// matn sifatida saqlaydi, skill_catalog.id ga FK yo'q — tekshirilgan).
export const employeeSkillFormSchema = z.object({
  userId: z.string().min(1, "Xodim talab qilinadi"),
  skillId: z.string().min(1, "Ko'nikma talab qilinadi"),
  level: z.number().min(1).max(5),
  notes: z.string().optional(),
});

export type EmployeeSkillFormValues = z.infer<typeof employeeSkillFormSchema>;

// P1.14.2: FE uses 1-5 numeric levels; BE stores string enum values
export const LEVEL_MAP: Record<number, string> = {
  1: 'beginner',
  2: 'basic',
  3: 'intermediate',
  4: 'advanced',
  5: 'expert',
};

/** Convert numeric level (1-5) → DB string enum */
export const levelToString = (n: number): string => LEVEL_MAP[n] ?? 'beginner';

/** Convert DB string enum → numeric level (1-5) */
export const levelToNumber = (s: string): number =>
  Number(Object.entries(LEVEL_MAP).find(([, v]) => v === s)?.[0] ?? 1);

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
