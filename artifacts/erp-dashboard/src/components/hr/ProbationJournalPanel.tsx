/**
 * @module ProbationJournalPanel
 * @description Probation period kuzatuvi paneli. Dialog UIs + types live in
 *   sibling files so this component stays under 300 lines.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, safeArray } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  CalendarDays, Clock, SmilePlus, BookOpen, AlertTriangle, Plus,
} from "lucide-react";

import type {
  JournalEntry,
  ProbationJournalData,
} from "./ProbationJournalPanel.types";
import { calcDaysLeft, calcProgress } from "./ProbationJournalPanel.types";
import {
  AddEntryDialog,
  EditDatesDialog,
  type EntryForm,
  type DateForm,
} from "./ProbationJournalPanel.dialogs";
import { EntriesList } from "./ProbationJournalPanel.entries";

interface ProbationJournalPanelProps {
  pipelineEntryId: number;
  candidateName: string;
  probationMonths?: number;
}

export function ProbationJournalPanel({
  pipelineEntryId,
  candidateName,
  probationMonths = 3,
}: ProbationJournalPanelProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<EntryForm>({
    week_number: 1,
    notes: "",
    mood_score: "3",
    nastavnik_feedback: "",
    discipline_issues: "",
    tasks_status: "ok",
  });
  const [dateForm, setDateForm] = useState<DateForm>({
    probation_start_date: "",
    probation_end_date: "",
  });
  const [editingDates, setEditingDates] = useState(false);

  const queryKey = [`/api/hr/recruitment/pipeline/${pipelineEntryId}/probation-journal`];

  const { data, isLoading } = useQuery<{ data: ProbationJournalData }>({
    queryKey,
    staleTime: 30_000,
  });

  const funnel = data?.data?.funnel ?? null;
  const entries = safeArray<JournalEntry>(data?.data?.entries);
  const startDate = funnel?.probation_start_date ?? null;
  const endDate = funnel?.probation_end_date ?? null;
  const daysLeft = calcDaysLeft(endDate);
  const progress = calcProgress(startDate, endDate);

  const nextWeek =
    entries.length > 0 ? Math.max(...entries.map((e) => e.week_number)) + 1 : 1;

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/hr/recruitment/pipeline/${pipelineEntryId}/probation-journal`, {
        week_number: form.week_number,
        notes: form.notes || null,
        mood_score: form.mood_score ? Number(form.mood_score) : null,
        nastavnik_feedback: form.nastavnik_feedback || null,
        discipline_issues: form.discipline_issues || null,
        tasks_status: form.tasks_status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setAddOpen(false);
      setForm({
        week_number: nextWeek + 1,
        notes: "",
        mood_score: "3",
        nastavnik_feedback: "",
        discipline_issues: "",
        tasks_status: "ok",
      });
      toast({ title: "Haftalik yozuv qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const saveDatesMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/hr/recruitment/pipeline/${pipelineEntryId}/probation-dates`, {
        probation_start_date: dateForm.probation_start_date || null,
        probation_end_date: dateForm.probation_end_date || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingDates(false);
      toast({ title: "Sanalar saqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const handleOpenAdd = () => {
    setForm((f) => ({ ...f, week_number: nextWeek }));
    setAddOpen(true);
  };

  const handleOpenDates = () => {
    setDateForm({
      probation_start_date: startDate?.slice(0, 10) ?? "",
      probation_end_date: endDate?.slice(0, 10) ?? "",
    });
    setEditingDates(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-muted-foreground">
        {t("sinovDavriMalumotlariYuklanmoqda")}
      </div>
    );
  }

  const progressColor =
    progress >= 80 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-emerald-500";
  const disciplineCount = entries.filter((e) => e.discipline_issues).length;
  const moodAvg =
    entries.filter((e) => e.mood_score).length === 0
      ? 0
      : entries.filter((e) => e.mood_score).reduce((s, e) => s + (e.mood_score ?? 0), 0) /
        entries.filter((e) => e.mood_score).length;

  return (
    <div
      className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-4"
      data-testid="probation-journal-panel"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm text-foreground">{t("sinovDavriKuzatuvi")}</span>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40 border text-[10px]">
            {probationMonths} oy
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 border-slate-500/40 text-slate-400"
            onClick={handleOpenDates}
            data-testid="button-edit-probation-dates"
          >
            <CalendarDays className="w-2.5 h-2.5 mr-1" />
            {t("sanalarniOzgartirish")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 border-emerald-500/40 text-emerald-400 hover:bg-[var(--ep-green)]/90/10"
            onClick={handleOpenAdd}
            data-testid="button-add-probation-entry"
          >
            <Plus className="w-2.5 h-2.5 mr-1" />
            {t("haftalikYozuv")}
          </Button>
        </div>
      </div>

      {startDate && endDate ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Boshlangan: {new Date(startDate).toLocaleDateString("uz-UZ")}
            </span>
            <span>Tugaydi: {new Date(endDate).toLocaleDateString("uz-UZ")}</span>
          </div>
          <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{progress}% yakunlandi</span>
            {daysLeft !== null && (
              <span
                className={`font-semibold ${
                  daysLeft <= 14 ? "text-red-400" : daysLeft <= 30 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {daysLeft > 0 ? `${daysLeft} kun qoldi` : "Muddat tugagan"}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-2 text-center">
          {t("sinovDavriSanalariniBelgilang")}
        </div>
      )}

      {entries.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <BookOpen className="w-3 h-3 text-blue-400" />
            <span className="text-muted-foreground">{entries.length} haftalik yozuv</span>
          </div>
          {disciplineCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{disciplineCount} intizom hodisasi</span>
            </div>
          )}
          {moodAvg > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <SmilePlus className="w-3 h-3 text-emerald-400" />
              <span className="text-muted-foreground">O'rtacha kayfiyat: {moodAvg.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      <EntriesList entries={entries} />

      {entries.length === 0 && (
        <div className="text-center text-xs text-muted-foreground py-3 bg-muted/10 rounded-lg">
          {t("haliHaftalikYozuvYoqBirinchi")}
        </div>
      )}

      <AddEntryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        candidateName={candidateName}
        form={form}
        setForm={setForm}
        onSave={() => addMutation.mutate()}
        saving={addMutation.isPending}
      />

      <EditDatesDialog
        open={editingDates}
        onClose={() => setEditingDates(false)}
        probationMonths={probationMonths}
        form={dateForm}
        setForm={setDateForm}
        onSave={() => saveDatesMutation.mutate()}
        saving={saveDatesMutation.isPending}
      />
    </div>
  );
}

export default ProbationJournalPanel;
