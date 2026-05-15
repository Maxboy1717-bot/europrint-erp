/**
 * @module ProbationJournalPanel.types
 * @description Types, status labels and pure helpers for ProbationJournalPanel.
 *   Split out so the component file stays under 300 lines.
 */

export interface JournalEntry {
  id: number;
  pipeline_entry_id: number;
  week_number: number;
  notes: string | null;
  mood_score: number | null;
  nastavnik_feedback: string | null;
  discipline_issues: string | null;
  tasks_status: string | null;
  created_at: string;
}

export interface ProbationFunnel {
  id: number;
  funnel_stage: string;
  probation_start_date: string | null;
  probation_end_date: string | null;
}

export interface ProbationJournalData {
  funnel: ProbationFunnel | null;
  entries: JournalEntry[];
}

export const TASKS_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ok: { label: "Bajarildi", color: "bg-green-500/15 text-green-400 border-green-500/40" },
  partial: { label: "Qisman", color: "bg-amber-500/15 text-amber-400 border-amber-500/40" },
  not_done: { label: "Bajarilmadi", color: "bg-red-500/15 text-red-400 border-red-500/40" },
};

export function moodEmoji(score: number | null): string {
  if (!score) return "–";
  return ["", "😞", "😐", "🙂", "😊", "🤩"][score] ?? "–";
}

export function calcDaysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff;
}

export function calcProgress(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}
