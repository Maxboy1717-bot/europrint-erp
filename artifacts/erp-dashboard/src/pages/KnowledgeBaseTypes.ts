/**
 * @module KnowledgeBaseTypes
 * @description Shared TypeScript interfaces, Zod schema, type aliases,
 *   category constants, and utility helpers for the KnowledgeBase feature.
 *   No JSX — safe to import from plain .ts files.
 */

import { z } from "zod";
import type { KnowledgeBase } from "@shared/schema";

import { tLabel } from '@/lib/i18n/tLabel';
// ---------------------------------------------------------------------------
// Zod schema & derived types
// ---------------------------------------------------------------------------

export const knowledgeBaseFormSchema = z.object({
  title: z.string().min(1, "Sarlavha (O'zbek) talab qilinadi"),
  titleRu: z.string().min(1, "Sarlavha (Rus) talab qilinadi"),
  content: z.string().min(1, "Ma'lumot (O'zbek) talab qilinadi"),
  contentRu: z.string().min(1, "Ma'lumot (Rus) talab qilinadi"),
  category: z.string().min(1, "Kategoriya talab qilinadi"),
  tags: z.string().optional(),
  order: z.number().default(0),
  isActive: z.string().default("true"),
});

export type KnowledgeBaseFormValues = z.infer<typeof knowledgeBaseFormSchema>;

export type KnowledgeBasePayload = Omit<KnowledgeBaseFormValues, "tags"> & {
  tags: string[];
};

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

export type CategoryOption = { value: string; label: string };

/** Build category list from translated labels.  Called once inside components. */
export function buildCategories(tCommon: (k: string) => string): CategoryOption[] {
  return [
    { value: "about_company", label: tCommon("company") },
    { value: "products",      label: tLabel('common.KnowledgeBase.mahsulotlar', "Mahsulotlar") },
    { value: "services",      label: tLabel('common.KnowledgeBase.xizmatlar', "Xizmatlar") },
    { value: "policies",      label: tLabel('common.KnowledgeBase.siyosatlar', "Siyosatlar") },
    { value: "procedures",    label: tLabel('common.KnowledgeBase.tartibQoidalar', "Tartib-qoidalar") },
    { value: "faq",           label: "FAQ" },
    { value: "history",       label: "Tarix" },
    { value: "team",          label: "Jamoa" },
    { value: "other",         label: "Boshqa" },
  ];
}

/** Returns the human-readable label for a category value. */
export function getCategoryLabel(
  categories: CategoryOption[],
  category: string,
): string {
  return (
    (Array.isArray(categories) ? categories : []).find(
      (c) => c.value === category,
    )?.label ?? category
  );
}

// Re-export the shared schema type so consumers only need one import.
export type { KnowledgeBase };
