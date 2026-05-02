import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  UserX, CheckCircle2, Clock, AlertCircle, FileText, ChevronDown, ChevronUp,
  MessageSquare, Plus, Search, ClipboardList, ShieldOff, Handshake,
  Package, Key, ScrollText, FileSignature, BadgeCheck,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────
interface OffboardingCase {
  id: number;
  employee_id: number;
  full_name: string;
  position: string;
  department: string;
  dismissal_type: string;
  last_working_day: string | null;
  status: string;
  exit_interview_done: boolean;
  equipment_returned: boolean;
  settlement_done: boolean;
  nda_signed: boolean;
  blocks_settlement: boolean;
  completed_items: number;
  total_items: number;
  created_at: string;
}

interface ChecklistItem {
  id: number;
  case_id: number;
  item_key: string;
  label: string;
  done: boolean;
  done_at: string | null;
  notes: string | null;
  order_num: number;
}

interface Stats {
  active: number | string;
  completed: number | string;
  cancelled: number | string;
  total: number | string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const DISMISSAL_MAP: Record<string, string> = {
  resignation:  "O'z xohishi bilan",
  termination:  "Xizmat yaroqsizligi",
  contract_end: "Shartnoma tugashi",
  retirement:   "Pensiya",
  relocation:   "Ko'chib ketish",
  other:        "Boshqa sabab",
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active:    { label: "Faol",          variant: "secondary" },
  completed: { label: "Yakunlandi",    variant: "default" },
  cancelled: { label: "Bekor qilindi", variant: "destructive" },
};

const CHECKLIST_ICONS: Record<string, React.ReactNode> = {
  exit_interview:    <MessageSquare className="h-3.5 w-3.5" />,
  work_handover:     <Handshake className="h-3.5 w-3.5" />,
  equipment_returned:<Package className="h-3.5 w-3.5" />,
  id_card_returned:  <BadgeCheck className="h-3.5 w-3.5" />,
  erp_access_revoked:<Key className="h-3.5 w-3.5" />,
  nda_reviewed:      <ScrollText className="h-3.5 w-3.5" />,
  settlement_done:   <ClipboardList className="h-3.5 w-3.5" />,
  final_document:    <FileSignature className="h-3.5 w-3.5" />,
};

// ── ChecklistPanel ────────────────────────────────────────────────────────────
// Structured exit interview questions (mirrors the backend EXIT_INTERVIEW_QUESTIONS)
const EXIT_QUESTIONS = [
  { key: "reason_for_leaving",  label: "Ketish sababingiz nima?",                  type: "text",   required: true },
  { key: "management_rating",   label: "Rahbariyatga baho bering (1-5):",          type: "rating", required: true },
  { key: "environment_rating",  label: "Ish muhitiga baho bering (1-5):",          type: "rating", required: true },
  { key: "would_recommend",     label: "Kompaniyani tavsiya qilasizmi?",           type: "choice", required: true },
] as const;

function ChecklistPanel({
  caseId, onClose,
}: {
  caseId: number;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showInterviewForm, setShowInterviewForm] = useState(false);

  const { data: caseDetail, isLoading } = useQuery<OffboardingCase & { checklist: ChecklistItem[] }>({
    queryKey: ["/api/hr/offboarding/cases", caseId],
    queryFn: () => fetch(`/api/hr/offboarding/cases/${caseId}`, { credentials: "include" }).then(r => r.json()),
  });

  const markItem = useMutation({
    mutationFn: ({ itemId, done, notes }: { itemId: number; done: boolean; notes?: string }) =>
      apiRequest("PATCH", `/api/hr/offboarding/cases/${caseId}/checklist/${itemId}`, { done, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases"] });
      toast({ title: "Yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const saveInterview = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/hr/offboarding/cases/${caseId}/exit-interview`, { answers }),
    onSuccess: (data: { answersComplete: boolean; blocksSettlement: boolean; missingAnswers: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases"] });
      setShowInterviewForm(false);
      if (data?.blocksSettlement) {
        toast({
          title: "Suhbat saqlandi — hisob-kitob blokda",
          description: `Javob berilmagan savollar: ${(Array.isArray(data.missingAnswers) ? data.missingAnswers : []).join(", ")}`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Chiqish suhbati saqlandi — barcha savollar javoblangan" });
      }
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // Uses the gated /finalize endpoint to enforce exit-interview completeness
  const completeCase = useMutation({
    mutationFn: () => apiRequest("POST", `/api/hr/offboarding/cases/${caseId}/finalize`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases"] });
      onClose();
      toast({ title: "Offboarding yakunlandi — xodim tizimdan chiqarildi" });
    },
    onError: (err: Error) => {
      const msg = err?.message?.includes("EXIT_INTERVIEW_INCOMPLETE")
        ? "Suhbatning barcha savollari to'ldirilmagan — hisob-kitob blokda"
        : err?.message?.includes("EXIT_INTERVIEW_REQUIRED")
        ? "Avval chiqish suhbatini o'tkazing"
        : "Finalashtirish muvaffaqiyatsiz";
      toast({ title: msg, variant: "destructive" });
    },
  });

  if (isLoading || !caseDetail) {
    return (
      <div className="space-y-3 py-4">
        {([1, 2, 3, 4, 5, 6, 7, 8]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}
      </div>
    );
  }

  const checklist = caseDetail.checklist ?? [];
  const pct = caseDetail.total_items > 0
    ? Math.round((caseDetail.completed_items / caseDetail.total_items) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{caseDetail.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {caseDetail.position}{caseDetail.department && ` · ${caseDetail.department}`}
            </p>
          </div>
          <Badge variant={STATUS_BADGE[caseDetail.status]?.variant ?? "secondary"}>
            {STATUS_BADGE[caseDetail.status]?.label ?? caseDetail.status}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Jarayon: {caseDetail.completed_items}/{caseDetail.total_items} bosqich</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        {caseDetail.last_working_day && (
          <p className="text-xs text-muted-foreground">
            Oxirgi ish kuni:{" "}
            <span className="text-foreground font-medium">
              {new Date(caseDetail.last_working_day).toLocaleDateString("uz-UZ")}
            </span>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Sabab: <span className="text-foreground">{DISMISSAL_MAP[caseDetail.dismissal_type] ?? caseDetail.dismissal_type}</span>
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {(Array.isArray(checklist) ? checklist : []).map(item => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
              item.done
                ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30"
                : "bg-background border-border/50 hover:bg-muted/30"
            }`}
          >
            <div className={`shrink-0 ${item.done ? "text-green-600" : "text-muted-foreground"}`}>
              {item.done
                ? <CheckCircle2 className="h-4 w-4" />
                : CHECKLIST_ICONS[item.item_key] ?? <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
              }
            </div>
            <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>
              {item.label}
            </span>
            {item.done && item.done_at && (
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(item.done_at).toLocaleDateString("uz-UZ")}
              </span>
            )}
            {!item.done && caseDetail.status === "active" && (
              <div className="flex items-center gap-1 shrink-0">
                {item.item_key === "exit_interview" && !caseDetail.exit_interview_done ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => setShowInterviewForm(true)}
                  >
                    Yozuv qo'shish
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => markItem.mutate({ itemId: item.id, done: true })}
                    disabled={markItem.isPending}
                  >
                    Bajarildi
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Exit interview — 4 structured questions */}
      {showInterviewForm && (
        <div className="rounded-lg border border-border/50 p-3 space-y-3 bg-muted/20">
          <p className="text-sm font-semibold">Chiqish suhbati — 4 ta savol</p>
          {(Array.isArray(EXIT_QUESTIONS) ? EXIT_QUESTIONS : []).map(q => (
            <div key={q.key} className="space-y-1">
              <Label className="text-xs">
                {q.label}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              {q.type === "text" && (
                <Textarea
                  placeholder="Javobingizni kiriting..."
                  className="text-sm min-h-[60px] resize-none"
                  value={answers[q.key] ?? ""}
                  onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))}
                />
              )}
              {q.type === "rating" && (
                <Select
                  value={answers[q.key] ?? ""}
                  onValueChange={v => setAnswers(a => ({ ...a, [q.key]: v }))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Baho (1-5)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Juda yomon</SelectItem>
                    <SelectItem value="2">2 — Yomon</SelectItem>
                    <SelectItem value="3">3 — O'rtacha</SelectItem>
                    <SelectItem value="4">4 — Yaxshi</SelectItem>
                    <SelectItem value="5">5 — A'lo</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {q.type === "choice" && (
                <Select
                  value={answers[q.key] ?? ""}
                  onValueChange={v => setAnswers(a => ({ ...a, [q.key]: v }))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Javobni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Ha, tavsiya qilaman</SelectItem>
                    <SelectItem value="maybe">Balki</SelectItem>
                    <SelectItem value="no">Yo'q</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="h-7 text-xs bg-[#ff5d2e] hover:bg-[#e5521a] text-white"
              onClick={() => saveInterview.mutate()}
              disabled={saveInterview.isPending}
            >
              Saqlash
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowInterviewForm(false)}>
              Bekor
            </Button>
          </div>
        </div>
      )}

      {/* Complete button */}
      {caseDetail.status === "active" && pct >= 100 && (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={() => completeCase.mutate()}
          disabled={completeCase.isPending}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Offboardingni yakunlash
        </Button>
      )}
    </div>
  );
}

// ── OffboardingCard ───────────────────────────────────────────────────────────
function OffboardingCard({
  item,
  onOpenChecklist,
}: {
  item: OffboardingCase;
  onOpenChecklist: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const pct = item.total_items > 0
    ? Math.round((item.completed_items / item.total_items) * 100)
    : 0;
  const isComplete = item.status === "completed";
  const isCancelled = item.status === "cancelled";

  const steps = [
    { key: "exit_interview_done", label: "Chiqish suhbati",         done: item.exit_interview_done },
    { key: "equipment_returned",  label: "Jihozlar qaytarildi",      done: item.equipment_returned },
    { key: "settlement_done",     label: "Hisob-kitob amalga oshirildi", done: item.settlement_done },
    { key: "nda_signed",          label: "NDA imzolandi",            done: item.nda_signed },
  ];

  return (
    <Card className={`transition-all ${isCancelled ? "opacity-50" : ""}`}>
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-2.5 shrink-0 mt-0.5 ${
            isComplete ? "bg-green-100 dark:bg-green-900/20"
              : isCancelled ? "bg-gray-100 dark:bg-gray-800/20"
              : "bg-orange-100 dark:bg-orange-900/20"
          }`}>
            {isComplete
              ? <CheckCircle2 className="h-4 w-4 text-green-600" />
              : isCancelled
              ? <AlertCircle className="h-4 w-4 text-gray-400" />
              : <UserX className="h-4 w-4 text-orange-600" />
            }
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{item.full_name || `Xodim #${item.employee_id}`}</p>
                <p className="text-xs text-muted-foreground">
                  {item.position || "Lavozim ko'rsatilmagan"}
                  {item.department && ` · ${item.department}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.last_working_day && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.last_working_day).toLocaleDateString("uz-UZ")}
                  </span>
                )}
                <Badge variant={STATUS_BADGE[item.status]?.variant ?? "secondary"} className="text-xs">
                  {STATUS_BADGE[item.status]?.label ?? item.status}
                </Badge>
              </div>
            </div>

            {/* Progress */}
            {!isCancelled && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Jarayon: {item.completed_items}/{item.total_items} bosqich</span>
                  <span className={pct === 100 ? "text-green-600 font-medium" : ""}>{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            )}

            {/* Reason */}
            <p className="text-xs text-muted-foreground">
              Sabab: <span className="text-foreground">{DISMISSAL_MAP[item.dismissal_type] ?? item.dismissal_type}</span>
            </p>

            {/* Expand / actions */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setExpanded(e => !e)}
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? "Yopish" : "Tafsilotlar"}
              </button>
              {item.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2 ml-auto"
                  onClick={() => onOpenChecklist(item.id)}
                >
                  <ClipboardList className="h-3 w-3 mr-1" />
                  Chek-list
                </Button>
              )}
            </div>

            {/* Expanded mini-checklist summary */}
            {expanded && (
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                {(Array.isArray(steps) ? steps : []).map(s => (
                  <div key={s.key} className="flex items-center gap-2 text-xs">
                    {s.done
                      ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                      : <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                    }
                    <span className={s.done ? "line-through text-muted-foreground" : ""}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Create Dialog ─────────────────────────────────────────────────────────────
function CreateCaseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employeeId: "",
    dismissalType: "resignation",
    lastWorkingDay: "",
  });

  // Employee list for selector
  const { data: employees = [] } = useQuery<{ id: number; full_name?: string; first_name?: string; last_name?: string }[]>({
    queryKey: ["/api/employees"],
    queryFn: () => fetch("/api/employees?limit=500", { credentials: "include" }).then(r => r.json()),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/hr/offboarding/cases", {
        employeeId: parseInt(form.employeeId),
        dismissalType: form.dismissalType,
        lastWorkingDay: form.lastWorkingDay || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases"] });
      toast({ title: "Offboarding jarayoni boshlandi" });
      onClose();
      setForm({ employeeId: "", dismissalType: "resignation", lastWorkingDay: "" });
    },
    onError: (err: Error) => {
      const msg = err?.message?.includes("already exists")
        ? "Bu xodim uchun faol offboarding jarayoni mavjud"
        : "Xatolik yuz berdi";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const empList = Array.isArray(employees) ? employees : [];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-orange-600" />
            Yangi Offboarding Jarayoni
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Xodim</Label>
            <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Xodimni tanlang..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {(Array.isArray(empList) ? empList : []).map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.full_name ?? `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() ?? `#${e.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Ketish sababi</Label>
            <Select value={form.dismissalType} onValueChange={v => setForm(f => ({ ...f, dismissalType: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DISMISSAL_MAP).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Oxirgi ish kuni</Label>
            <Input
              type="date"
              value={form.lastWorkingDay}
              onChange={e => setForm(f => ({ ...f, lastWorkingDay: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!form.employeeId || create.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Boshlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HROffboarding() {
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [checklistCaseId, setChecklistCaseId] = useState<number | null>(null);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/hr/offboarding/cases/stats"],
    queryFn: () => fetch("/api/hr/offboarding/cases/stats", { credentials: "include" }).then(r => r.json()),
  });

  const { data: cases = [], isLoading } = useQuery<OffboardingCase[]>({
    queryKey: ["/api/hr/offboarding/cases", statusFilter, search],
    queryFn: () =>
      fetch(
        `/api/hr/offboarding/cases?status=${statusFilter === "all" ? "" : statusFilter}&search=${encodeURIComponent(search)}`,
        { credentials: "include" }
      ).then(r => r.json()),
  });

  const safeStats = {
    active:    Number(stats?.active    ?? 0),
    completed: Number(stats?.completed ?? 0),
    cancelled: Number(stats?.cancelled ?? 0),
    total:     Number(stats?.total     ?? 0),
  };

  const casesList = Array.isArray(cases) ? cases : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldOff className="h-5 w-5 text-orange-600" />
          <h1 className="font-semibold text-base">HR — Offboarding</h1>
          <Badge variant="secondary">{safeStats.active} faol</Badge>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Yangi jarayon
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {([
            { label: "Jami",          value: safeStats.total,     color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/10",   icon: <FileText className="h-4 w-4 text-blue-600" /> },
            { label: "Faol",          value: safeStats.active,    color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/10",icon: <Clock className="h-4 w-4 text-orange-600" /> },
            { label: "Yakunlangan",   value: safeStats.completed, color: "text-green-600",  bg: "bg-green-50 dark:bg-green-900/10",  icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
            { label: "Bekor qilindi", value: safeStats.cancelled, color: "text-gray-500",   bg: "bg-gray-50 dark:bg-gray-800/20",    icon: <AlertCircle className="h-4 w-4 text-gray-400" /> },
          ]).map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <div className={`rounded-full p-2.5 ${s.bg}`}>{s.icon}</div>
                <div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Xodim yoki bo'lim qidiring..."
              className="h-8 text-sm pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {(["all", "active", "completed", "cancelled"]).map(s => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                className="h-8 text-xs px-3"
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "Barchasi" : s === "active" ? "Faol" : s === "completed" ? "Yakunlangan" : "Bekor"}
              </Button>
            ))}
          </div>
          {casesList.length > 0 && (
            <span className="text-xs text-muted-foreground ml-1">{casesList.length} ta</span>
          )}
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-24 w-full rounded-lg" />)}
          </div>
        ) : casesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <UserX className="h-14 w-14 opacity-10" />
            <p className="text-sm">
              {statusFilter === "active"
                ? "Faol offboarding jarayonlari yo'q"
                : "Mos jarayon topilmadi"}
            </p>
            {statusFilter === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Yangi jarayon boshlash
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(casesList) ? casesList : []).map(item => (
              <OffboardingCard
                key={item.id}
                item={item}
                onOpenChecklist={id => setChecklistCaseId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <CreateCaseDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Checklist dialog */}
      <Dialog
        open={checklistCaseId !== null}
        onOpenChange={v => !v && setChecklistCaseId(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-orange-600" />
              Offboarding Chek-listi
            </DialogTitle>
          </DialogHeader>
          {checklistCaseId !== null && (
            <ChecklistPanel
              caseId={checklistCaseId}
              onClose={() => setChecklistCaseId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
