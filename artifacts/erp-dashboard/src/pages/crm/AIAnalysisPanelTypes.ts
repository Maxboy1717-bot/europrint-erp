/**
 * @module AIAnalysisPanelTypes
 * @description Interfaces, types, and constants for AIAnalysisPanel.
 */

export interface AIAnalysis {
  score: number;
  priority: string;
  nextAction: string;
  strengths: string[];
  risks: string[];
  summary: string;
}

export interface AIForecast {
  winProbability: number;
  expectedCloseDate: string;
  estimatedValue: number;
  recommendations: string[];
  risks: string[];
  confidence: string;
}

export interface AISuggestion {
  suggestedAction: string;
  actionType: string;
  urgency: string;
  script: string;
  tips: string[];
}

export interface LeadScoringV2 {
  score: number;
  probability: number;
  estimatedLTV: number;
  recommendedApproach: string;
  segment: string;
  readiness: string;
  priority: string;
  factors: {
    companySize: number;
    engagement: number;
    budget: number;
    timing: number;
  };
  summary: string;
}

export interface NBAResult {
  action: string;
  actionType: string;
  deadline: string;
  priority: string;
  script: string;
  reason: string;
  expectedOutcome: string;
  tips: string[];
}

export interface AutoFillData {
  companyTitle: string | null;
  industry: string | null;
  segment: string | null;
  budget: string | null;
  timeline: string | null;
  needs: string[];
  confidence: number;
}

export interface ChurnRescue {
  riskLevel: string;
  riskScore: number;
  riskFactors: string[];
  rescueScenario: {
    actions: string[];
    timeline: string;
    successProbability: number;
    keyMessage: string;
  };
  retentionOffer: string | null;
}

export type AITab = "scoring" | "nba" | "autofill" | "churn";

export function getPriorityColor(priority: string): string {
  if (priority === "yuqori") return "bg-[var(--ep-red)] text-white";
  if (priority === "o'rta") return "bg-[var(--ep-yellow)] text-white";
  return "bg-[var(--ep-green)] text-white";
}

export function getRiskColor(risk: string): string {
  if (risk === "yuqori") return "bg-red-100 text-[var(--ep-red)] dark:bg-red-900/30 dark:text-red-400";
  if (risk === "o'rta") return "bg-yellow-100 text-[var(--ep-yellow)] dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-green-100 text-[var(--ep-green)] dark:bg-green-900/30 dark:text-green-400";
}

export function getFactorColor(value: number): string {
  if (value >= 70) return "bg-green-500";
  if (value >= 40) return "bg-yellow-500";
  return "bg-red-500";
}
