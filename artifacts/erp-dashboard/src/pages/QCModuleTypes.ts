/** @module QCModuleTypes @description Interfaces, types, constants and Zod schemas for the QC Module page. No JSX. */

import { z } from "zod";
import {
  Thermometer, Activity, FileCheck, Beaker, Package, Eye,
  BookOpen, Brain, MessageSquareWarning, TriangleAlert, Star,
  TrendingDown, BarChart3,
} from "lucide-react";

// ─── Domain interfaces ────────────────────────────────────────────────────────

export interface QcParameter {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
  category: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  warningMinValue?: number;
  warningMaxValue?: number;
  isRequired: boolean;
  sortOrder: number;
}

export interface QcTestResult {
  parameterId: string;
  value: number;
  status: "passed" | "warning" | "failed";
  notes?: string;
}

export interface QcMaterialTest {
  id: string;
  orderId: string;
  materialCardId?: string;
  batchNumber?: string;
  testCategory: string;
  testResults: QcTestResult[];
  overallStatus: string;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  aiAnalysis?: Record<string, unknown> | null;
  aiConfidenceScore?: number;
  testDate: string;
}

export interface PapkaOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  status: string;
}

export interface MaterialCard {
  id: string;
  name: string;
  code: string;
  materialType?: string;
}

export interface GroupedParametersData {
  grouped: Record<string, QcParameter[]>;
  categoryLabels: Record<string, { uz: string; ru: string }>;
}

// ─── Zod schema ──────────────────────────────────────────────────────────────

export const testSchema = z.object({
  orderId: z.string().min(1, "Buyurtma tanlang"),
  materialCardId: z.string().optional(),
  batchNumber: z.string().optional(),
  testCategory: z.string().min(1, "Kategoriya tanlang"),
});

export type TestFormValues = z.infer<typeof testSchema>;

export type CreateTestPayload = TestFormValues & {
  testResults: Array<{ parameterId: string; value: number; status: "passed" | "warning" | "failed" }>;
};

// ─── Tab configuration ───────────────────────────────────────────────────────

export const CATEGORY_TABS = [
  { value: "physical",         label: "Fizik xususiyatlar",    labelRu: "Физические свойства",     icon: Thermometer },
  { value: "mechanical",       label: "Mexanik mustahkamlik",  labelRu: "Механическая прочность",  icon: Activity },
  { value: "printability",     label: "Chop etish sifati",     labelRu: "Качество печати",         icon: FileCheck },
  { value: "chemical",         label: "Kimyoviy ko'rsatkichlar", labelRu: "Химические показатели", icon: Beaker },
  { value: "environmental",    label: "Muhit chidamliligi",    labelRu: "Устойчивость к среде",    icon: Thermometer },
  { value: "logistics",        label: "Logistika testlari",    labelRu: "Логистические тесты",     icon: Package },
  { value: "visual",           label: "Vizual sifat",          labelRu: "Визуальное качество",     icon: Eye },
  { value: "standards",        label: "Normalar",              labelRu: "Стандарты",               icon: BookOpen },
  { value: "ai_analysis",      label: "AI Tahlili",            labelRu: "AI Анализ",               icon: Brain },
  { value: "reclamations",     label: "Reklamatsiyalar",       labelRu: "Рекламации",              icon: MessageSquareWarning },
  { value: "braks",            label: "Brak",                  labelRu: "Брак",                    icon: TriangleAlert },
  { value: "supplier_quality", label: "Supplier Sifati",       labelRu: "Качество поставщика",     icon: Star },
  { value: "certificate",      label: "Sertifikat",            labelRu: "Сертификат",              icon: FileCheck },
  { value: "ai_trend",         label: "AI Trendi",             labelRu: "AI Тренд",                icon: TrendingDown },
  { value: "spc",              label: "SPC Nazorat",           labelRu: "SPC Контроль",            icon: BarChart3 },
] as const;

const SPECIAL_TABS = new Set([
  "standards", "ai_analysis", "reclamations", "braks",
  "supplier_quality", "certificate", "ai_trend", "spc",
]);

export const PARAMETER_TABS = CATEGORY_TABS.filter(t => !SPECIAL_TABS.has(t.value));
