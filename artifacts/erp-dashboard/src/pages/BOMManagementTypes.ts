import { z } from "zod";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const bomFormSchema = z.object({
  bomNumber: z.string().optional(),
  productId: z.string().min(1, "Mahsulot tanlash majburiy"),
  version: z.string().default("1.0"),
  status: z.enum(["draft", "active", "obsolete"]).default("draft"),
  baseQuantity: z.number().min(0.01, "Miqdor 0 dan katta bo'lishi kerak"),
  unit: z.string().default("pcs"),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const itemFormSchema = z.object({
  componentId: z.string().min(1, "Komponent tanlash majburiy"),
  quantity: z.number().min(0.01, "Miqdor 0 dan katta bo'lishi kerak"),
  unit: z.string().default("pcs"),
  componentType: z.enum(["raw", "semifinished", "purchased"]).default("raw"),
  scrapPercentage: z.number().min(0).max(100).default(0),
  position: z.number().int().positive().default(10),
  itemNumber: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Type aliases ─────────────────────────────────────────────────────────────

export type BOMFormValues = z.infer<typeof bomFormSchema>;
export type ItemFormValues = z.infer<typeof itemFormSchema>;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  code: string;
  name: string;
  type: string;
}

export interface BOMHeader {
  id: string;
  bomNumber: string;
  productId: string;
  version: string;
  status: string;
  baseQuantity: number;
  unit: string;
  effectiveDate: string | null;
  expiryDate: string | null;
}

export interface BOMItem {
  id: string;
  bomId: string;
  componentId: string;
  quantity: number;
  unit: string;
  componentType: string;
  scrapPercentage: number;
  position: number;
  itemNumber: string;
  notes: string | null;
}

export interface ExplosionItem {
  level: number;
  componentName: string;
  componentCode: string;
  quantity: number;
  unit: string;
  componentType: string;
  notes?: string;
}

export interface ExplosionData {
  totalComponents?: number;
  explosion?: ExplosionItem[];
}
