/**
 * @module HRAIDashboardTypes
 * @description Interfaces, types, and constants for HRAIDashboard.
 */

import {
  FileText,
  BookOpen,
  Briefcase,
  TrendingUp,
  DollarSign,
  Mail,
  UserPlus,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashboardData {
  totalAiTasks: number;
  completedInterviews: number;
  totalCost: number;
  recentTasks: RecentTask[];
}

export interface RecentTask {
  id: string;
  taskType: string;
  status: string;
  createdAt: string;
}

export interface ProviderConfig {
  providerName: string;
  isActive: boolean;
  monthlyBudget: number;
  monthlySpent: number;
  dailyRequestsUsed: number;
  dailyRequestLimit: number;
}

export interface BudgetItem {
  id: string;
  provider: string;
  monthlyBudget: number;
  monthlySpent: number;
  remaining: number;
  isActive: boolean;
  dailyRequestLimit: number | null;
  dailyRequestsUsed: number | null;
}

export interface TaskType {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const taskTypes: TaskType[] = [
  { key: "resume-parse", label: "Resume Parse", icon: FileText },
  { key: "quiz-generate", label: "Quiz Generate", icon: BookOpen },
  { key: "job-description", label: "Job Description", icon: Briefcase },
  { key: "performance-analysis", label: "Performance Analysis", icon: TrendingUp },
  { key: "salary-validation", label: "Salary Validation", icon: DollarSign },
  { key: "email-generate", label: "Email Generate", icon: Mail },
  { key: "onboarding-plan", label: "Onboarding Plan", icon: UserPlus },
  { key: "score-candidate", label: "Score Candidate", icon: Target },
];

export const providerColors: Record<string, string> = {
  gemini: "bg-blue-500",
  openai: "bg-green-500",
  claude: "bg-purple-500",
};

export const providerList = ["gemini", "openai", "claude"] as const;
export type ProviderKey = typeof providerList[number];
