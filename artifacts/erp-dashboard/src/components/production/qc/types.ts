/**
 * @module types
 * @description React UI component.
 */

import { type LucideIcon } from "lucide-react";

export interface AiTrendData {
  summary?: { totalTests: number; totalBraks: number; avgPassRate: number; trend: string };
  weeklyTrend?: Array<{ week: string; total: number; passed: number; failed: number; passRate: number }>;
  byReason?: Array<{ reason: string; count: number }>;
  byStage?: Array<{ stage: string; count: number }>;
  categoryStats?: Array<{ category: string; total: number; passed: number; passRate: number }>;
  aiInsights?: string[];
}

export interface QCLabTest {
  id: number | string;
  productName?: string;
  materialName?: string;
  testDate?: string;
  createdAt?: string;
  status?: string;
  result?: string;
  lotNumber?: string;
  grammatura?: number | string;
  qalinlik?: number | string;
  bosim?: number | string;
  namlik?: number | string;
  operator?: string;
  operatorName?: string;
}

export interface QCVendor {
  id: number | string;
  name?: string;
  supplierName?: string;
  materialType?: string;
  status?: string;
  qualityScore?: number;
  createdAt?: string;
  lastDelivery?: string;
  defectRate?: number;
}

export interface QCBrak {
  id: number | string;
  materialName?: string;
  operatorName?: string;
  reason?: string;
  stage?: string;
  quantity?: number | string;
  status?: string;
  createdAt?: string;
  resolvedAt?: string;
}

export interface QCReclamation {
  id: number | string;
  orderId?: number | string;
  issue?: string;
  title?: string;
  clientName?: string;
  severity?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  resolvedAt?: string;
}

export type TabMeta = Record<string, { title: string; icon: LucideIcon }>;
