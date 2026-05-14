/**
 * @module ExtendedAIPanelTypes
 * @description Interfaces, types and pure helper functions for ExtendedAIPanel.
 */

export interface ExtendedAIPanelProps {
  entityType: import("./crm-types").EntityType;
  entityId: number;
}

export interface CallAnalysis {
  sentiment: string;
  keyPoints: string[];
  customerNeeds: string[];
  objections: string[];
  nextActions: string[];
  callQuality: number;
  summary: string;
}

export interface ChurnData {
  id: number;
  title: string;
  companyTitle: string | null;
  daysSinceActivity: number;
  churnRisk: string;
  churnProbability: number;
}

export interface AutoTask {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  taskType: string;
}

export interface SupervisorData {
  slaViolations: { id: number; title: string; hoursOverdue: number; type: string }[];
  inactiveDeals: { id: number; title: string; daysSinceActivity: number; stage: string }[];
  hygieneIssues: { id: number; title: string; missingFields: string[]; type: string }[];
  stats: { totalSLA: number; totalInactive: number; totalHygiene: number };
}

export type ActivePanel = "voice" | "chat" | "churn" | "autotasks" | "supervisor";

export function getSentimentColor(sentiment: string): string {
  if (sentiment === "ijobiy") return "text-[var(--ep-green)]";
  if (sentiment === "salbiy") return "text-[var(--ep-red)]";
  return "text-[var(--ep-yellow)]";
}

export function getPriorityColor(priority: string): string {
  if (priority === "yuqori") return "bg-red-500";
  if (priority === "o'rta") return "bg-yellow-500";
  return "bg-green-500";
}
