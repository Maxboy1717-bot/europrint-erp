/**
 * @module ProbationJournalPanel.entries
 * @description Entries list view for ProbationJournalPanel. Split out so
 *   the parent stays under 300 lines.
 */

import { BookOpen, AlertTriangle } from "lucide-react";
import type { JournalEntry } from "./ProbationJournalPanel.types";
import { TASKS_STATUS_LABELS, moodEmoji } from "./ProbationJournalPanel.types";

export function EntriesList({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {entries.map((entry) => {
        const statusInfo = TASKS_STATUS_LABELS[entry.tasks_status ?? "ok"] ?? TASKS_STATUS_LABELS.ok;
        return (
          <div
            key={entry.id}
            className="bg-muted/60 rounded-lg p-3 border border-border/30 text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{entry.week_number}-hafta</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{moodEmoji(entry.mood_score)}</span>
                <span className={`border rounded-full px-1.5 py-0.5 text-[10px] ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString("uz-UZ")}
                </span>
              </div>
            </div>
            {entry.notes && <p className="text-muted-foreground leading-relaxed">{entry.notes}</p>}
            {entry.nastavnik_feedback && (
              <div className="flex gap-1">
                <BookOpen className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-blue-300 italic">{entry.nastavnik_feedback}</span>
              </div>
            )}
            {entry.discipline_issues && (
              <div className="flex gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-amber-300">{entry.discipline_issues}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
