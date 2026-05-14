/**
 * @module AIInterviewPageTypes
 * @description Interfaces, types, Zod schemas, constants, and helper functions
 * for AIInterviewPage.
 */

import { z } from "zod";
import { JSX } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface InterviewTranscriptMessage {
  speaker: string;
  text: string;
  timestamp?: string;
}

export interface InterviewEvaluation {
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendation?: string;
}

export interface InterviewQuestion {
  question: string;
  answer?: string;
  score?: number;
  maxScore?: number;
}

export interface AIInterview {
  id: string;
  sessionId: string;
  candidateId: string;
  candidateName?: string;
  jobTitle?: string;
  status: "scheduled" | "in_progress" | "completed";
  provider?: string;
  language?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  transcript?: InterviewTranscriptMessage[];
  evaluation?: InterviewEvaluation;
  questions?: InterviewQuestion[];
  audioUrl?: string;
  videoUrl?: string;
}

export interface InterviewsResponse {
  interviews: AIInterview[];
  total: number;
  page: number;
  limit: number;
}

export interface InterviewQuestion2 {
  id: number;
  job_title?: string;
  question: string;
  question_uz?: string;
  question_ru?: string;
  question_en?: string;
  category?: string;
  difficulty?: string;
  max_score?: number;
}

// ── Zod Schema ────────────────────────────────────────────────────────────────

export const interviewSchema = z.object({
  candidateId: z.string().min(1, "Nomzod ID majburiy"),
  jobTitle: z.string().min(1, "Lavozim majburiy"),
  language: z.string().default("uz"),
  scheduledAt: z.string().min(1, "Sana va vaqt majburiy"),
});

export type InterviewFormData = z.infer<typeof interviewSchema>;

// ── Helper Functions ──────────────────────────────────────────────────────────

export function getStatusBadge(status: string): JSX.Element {
  switch (status) {
    case "scheduled":
      return <Badge variant="outline" className="bg-blue-50 text-[var(--ep-blue)] dark:bg-blue-950 dark:text-blue-300">{t("rejalashtirilgan")}</Badge>;
    case "in_progress":
      return <Badge variant="outline" className="bg-yellow-50 text-[var(--ep-yellow)] dark:bg-yellow-950 dark:text-yellow-300">{t("inProgress")}</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-50 text-[var(--ep-green)] dark:bg-green-950 dark:text-green-300">{t("completed")}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function getProviderBadge(provider?: string): JSX.Element | null {
  if (!provider) return null;
  switch (provider) {
    case "gemini":
      return <EPStatusPill tone="neutral">{t("gemini")}</EPStatusPill>;
    case "openai":
      return <EPStatusPill tone="neutral">{t("openai")}</EPStatusPill>;
    default:
      return <EPStatusPill tone="neutral">{provider}</EPStatusPill>;
  }
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} daqiqa ${secs} soniya`;
}

// ── Skeleton Component ────────────────────────────────────────────────────────

export function InterviewCardSkeleton() {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-2/3 rounded-lg" />
          <Skeleton className="h-9 w-full mt-2 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
