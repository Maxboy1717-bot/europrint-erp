import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, safeArray } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays, Clock, SmilePlus, BookOpen, AlertTriangle,
  CheckCircle2, Plus, BarChart3,
} from "lucide-react";

interface JournalEntry {
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

interface ProbationFunnel {
  id: number;
  funnel_stage: string;
  probation_start_date: string | null;
  probation_end_date: string | null;
}

interface ProbationJournalData {
  funnel: ProbationFunnel | null;
  entries: JournalEntry[];
}

const TASKS_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ok:          { label: "Bajarildi",      color: "bg-green-500/15 text-green-400 border-green-500/40" },
  partial:     { label: "Qisman",         color: "bg-amber-500/15 text-amber-400 border-amber-500/40" },
  not_done:    { label: "Bajarilmadi",    color: "bg-red-500/15 text-red-400 border-red-500/40" },
};

function moodEmoji(score: number | null): string {
  if (!score) return "–";
  return ["", "😞", "😐", "🙂", "😊", "🤩"][score] ?? "–";
}

function calcDaysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff;
}

function calcProgress(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    week_number: 1,
    notes: "",
    mood_score: "3",
    nastavnik_feedback: "",
    discipline_issues: "",
    tasks_status: "ok",
  });
  const [dateForm, setDateForm] = useState({
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

  const nextWeek = (entries.length > 0 ? Math.max(...(entries ?? []).map(e => e.week_number)) + 1 : 1);

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
      setForm({ week_number: nextWeek + 1, notes: "", mood_score: "3", nastavnik_feedback: "", discipline_issues: "", tasks_status: "ok" });
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
    setForm(f => ({ ...f, week_number: nextWeek }));
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
        Sinov davri ma'lumotlari yuklanmoqda…
      </div>
    );
  }

  const progressColor =
    progress >= 80 ? "bg-green-500" :
    progress >= 50 ? "bg-amber-500" :
    "bg-emerald-500";

  const disciplineCount = (Array.isArray(entries) ? entries : []).filter(e => e.discipline_issues).length;

  return (
    <div
      className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-4"
      data-testid="probation-journal-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm text-on-surface">Sinov Davri Kuzatuvi</span>
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
            Sanalarni o'zgartirish
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            onClick={handleOpenAdd}
            data-testid="button-add-probation-entry"
          >
            <Plus className="w-2.5 h-2.5 mr-1" />
            Haftalik yozuv
          </Button>
        </div>
      </div>

      {/* Dates + Progress */}
      {startDate && endDate ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Boshlangan: {new Date(startDate).toLocaleDateString("uz-UZ")}
            </span>
            <span>
              Tugaydi: {new Date(endDate).toLocaleDateString("uz-UZ")}
            </span>
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
              <span className={`font-semibold ${daysLeft <= 14 ? "text-red-400" : daysLeft <= 30 ? "text-amber-400" : "text-emerald-400"}`}>
                {daysLeft > 0 ? `${daysLeft} kun qoldi` : "Muddat tugagan"}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-2 text-center">
          Sinov davri sanalarini belgilang
        </div>
      )}

      {/* Stats row */}
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
          {entries.length > 0 && (() => {
            const avgMood = (Array.isArray(entries) ? entries : []).filter(e => e.mood_score).reduce((s, e) => s + (e.mood_score ?? 0), 0) / ((Array.isArray(entries) ? entries : []).filter(e => e.mood_score).length || 1);
            return (
              <div className="flex items-center gap-1 text-xs">
                <SmilePlus className="w-3 h-3 text-emerald-400" />
                <span className="text-muted-foreground">O'rtacha kayfiyat: {avgMood.toFixed(1)}</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Journal entries */}
      {entries.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(Array.isArray(entries) ? entries : []).map(entry => {
            const statusInfo = TASKS_STATUS_LABELS[entry.tasks_status ?? "ok"] ?? TASKS_STATUS_LABELS.ok;
            return (
              <div
                key={entry.id}
                className="bg-surface-container rounded-lg p-3 border border-border/30 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-on-surface">
                    {entry.week_number}-hafta
                  </span>
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
                {entry.notes && (
                  <p className="text-muted-foreground leading-relaxed">{entry.notes}</p>
                )}
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
      )}

      {entries.length === 0 && (
        <div className="text-center text-xs text-muted-foreground py-3 bg-muted/10 rounded-lg">
          Hali haftalik yozuv yo'q. Birinchi yozuvni qo'shing.
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Haftalik Yozuv — {candidateName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Hafta raqami *</Label>
                <Input
                  type="number"
                  min={1}
                  max={52}
                  value={form.week_number}
                  onChange={e => setForm(f => ({ ...f, week_number: Number(e.target.value) }))}
                  data-testid="input-probation-week"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Kayfiyat (1-5) *</Label>
                <Select value={form.mood_score} onValueChange={v => setForm(f => ({ ...f, mood_score: v }))}>
                  <SelectTrigger data-testid="select-probation-mood">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — 😞 Juda yomon</SelectItem>
                    <SelectItem value="2">2 — 😐 Yomon</SelectItem>
                    <SelectItem value="3">3 — 🙂 O'rtacha</SelectItem>
                    <SelectItem value="4">4 — 😊 Yaxshi</SelectItem>
                    <SelectItem value="5">5 — 🤩 A'lo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Vazifalar holati</Label>
              <Select value={form.tasks_status} onValueChange={v => setForm(f => ({ ...f, tasks_status: v }))}>
                <SelectTrigger data-testid="select-probation-tasks">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ok">Bajarildi</SelectItem>
                  <SelectItem value="partial">Qisman bajarildi</SelectItem>
                  <SelectItem value="not_done">Bajarilmadi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Umumiy izoh</Label>
              <Textarea
                placeholder="Bu hafta xodim qanday ishladi..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                data-testid="textarea-probation-notes"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">Nastavnik izohi</Label>
              <Textarea
                placeholder="Nastavnik / mentor izohi..."
                value={form.nastavnik_feedback}
                onChange={e => setForm(f => ({ ...f, nastavnik_feedback: e.target.value }))}
                rows={2}
                data-testid="textarea-probation-nastavnik"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">Intizom hodisalari (ixtiyoriy)</Label>
              <Textarea
                placeholder="Kechikish, sababsiz yo'qlik va boshqalar..."
                value={form.discipline_issues}
                onChange={e => setForm(f => ({ ...f, discipline_issues: e.target.value }))}
                rows={2}
                data-testid="textarea-probation-discipline"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Bekor</Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !form.week_number}
              className="gap-1"
              data-testid="button-save-probation-entry"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {addMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dates Dialog */}
      <Dialog open={editingDates} onOpenChange={setEditingDates}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              Sinov Davri Sanalarini Belgilash
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Boshlanish sanasi</Label>
              <Input
                type="date"
                value={dateForm.probation_start_date}
                onChange={e => setDateForm(f => ({ ...f, probation_start_date: e.target.value }))}
                data-testid="input-probation-start-date"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tugash sanasi</Label>
              <Input
                type="date"
                value={dateForm.probation_end_date}
                onChange={e => setDateForm(f => ({ ...f, probation_end_date: e.target.value }))}
                data-testid="input-probation-end-date"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Odatda sinov muddati {probationMonths} oy bo'ladi. Boshlanish sanasidan {probationMonths * 30} kun o'tgach tugash sanasini belgilang.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDates(false)}>Bekor</Button>
            <Button
              onClick={() => saveDatesMutation.mutate()}
              disabled={saveDatesMutation.isPending}
              data-testid="button-save-probation-dates"
            >
              {saveDatesMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProbationJournalPanel;
