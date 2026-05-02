import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2, Clock, AlertCircle, AlertTriangle, MessageSquare,
  ClipboardList, Package, Key, ScrollText, FileSignature, BadgeCheck,
  Handshake, UserX, ShieldAlert,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OffboardingCase {
  id: number;
  employee_id: number;
  dismissal_type: string;
  last_working_day: string | null;
  status: string;
  exit_interview_done: boolean;
  exit_interview_notes: string | null;
  equipment_returned: boolean;
  settlement_done: boolean;
  nda_signed: boolean;
  blocks_settlement: boolean;
  completed_items: number;
  total_items: number;
  created_at: string;
  checklist: ChecklistItem[];
  exitInterview: ExitInterview | null;
}

interface ChecklistItem {
  id: number;
  item_key: string;
  label: string;
  done: boolean;
  done_at: string | null;
  notes: string | null;
  return_status: string;
  order_num: number;
}

interface ExitInterview {
  id: number;
  answers: Record<string, unknown> | null;
  blocks_settlement: boolean;
  created_at: string;
}

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

const RETURN_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:  { label: "Kutilmoqda",     color: "text-orange-500" },
  returned: { label: "Qaytarildi",     color: "text-green-600" },
  damaged:  { label: "Shikastlangan",  color: "text-yellow-600" },
  missing:  { label: "Yo'qolgan",      color: "text-red-600" },
  "n/a":    { label: "Talab yo'q",     color: "text-muted-foreground" },
};

const CHECKLIST_ICONS: Record<string, React.ReactNode> = {
  exit_interview:    <MessageSquare className="h-4 w-4" />,
  work_handover:     <Handshake className="h-4 w-4" />,
  equipment_returned:<Package className="h-4 w-4" />,
  id_card_returned:  <BadgeCheck className="h-4 w-4" />,
  erp_access_revoked:<Key className="h-4 w-4" />,
  nda_reviewed:      <ScrollText className="h-4 w-4" />,
  settlement_done:   <ClipboardList className="h-4 w-4" />,
  final_document:    <FileSignature className="h-4 w-4" />,
};

// ── Exit Interview Form ───────────────────────────────────────────────────────
interface Question {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

function ExitInterviewForm({ caseId, onDone }: { caseId: number; onDone: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/hr/offboarding/questions"],
    queryFn: () => fetch("/api/hr/offboarding/questions", { credentials: "include" }).then(r => r.json()),
  });

  const save = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/hr/offboarding/cases/${caseId}/exit-interview`, { answers }),
    onSuccess: (data: { blocksSettlement: boolean; missingAnswers: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", caseId] });
      if (data?.blocksSettlement) {
        toast({
          title: "Suhbat saqlandi — hisob-kitob blokda",
          description: "Barcha savollar to'ldirilmagan. Hisob-kitob bajarilishi uchun to'ldiring.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Chiqish suhbati saqlandi" });
      }
      onDone();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const questionList = Array.isArray(questions) ? questions : [];

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/20">
      <p className="text-sm font-semibold text-foreground">Chiqish suhbati — 4 savol</p>
      {(Array.isArray(questionList) ? questionList : []).map(q => (
        <div key={q.key} className="space-y-1.5">
          <Label className="text-sm">
            {q.label}
            {q.required && <span className="text-red-500 ml-1">*</span>}
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
                <SelectValue placeholder="Baho tanlang (1-5)" />
              </SelectTrigger>
              <SelectContent>
                {(["1", "2", "3", "4", "5"]).map(v => (
                  <SelectItem key={v} value={v}>{v} — {v === "1" ? "Juda yomon" : v === "5" ? "A'lo" : v === "3" ? "O'rtacha" : ""}</SelectItem>
                ))}
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
                <SelectItem value="no">Yo'q, tavsiya qilmayman</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="bg-[#ff5d2e] hover:bg-[#e5521a] text-white"
        >
          Saqlash
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Bekor</Button>
      </div>
    </div>
  );
}

// ── Main OffboardingTab component ─────────────────────────────────────────────
export function OffboardingTab({ employeeId }: { employeeId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const numericId = parseInt(employeeId);

  const { data: offboardingCase, isLoading, isError } = useQuery<OffboardingCase | null>({
    queryKey: ["/api/hr/offboarding/cases", numericId, "byEmployee"],
    queryFn: async () => {
      const res = await fetch(`/api/hr/offboarding/cases/employee/${numericId}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch");
      const base = await res.json() as OffboardingCase;

      // Fetch full detail (with checklist + exit interview)
      const detailRes = await fetch(`/api/hr/offboarding/cases/${base.id}`, { credentials: "include" });
      if (!detailRes.ok) return base;
      return detailRes.json() as Promise<OffboardingCase>;
    },
  });

  const markItem = useMutation({
    mutationFn: ({ caseId, itemId, done, returnStatus }: { caseId: number; itemId: number; done?: boolean; returnStatus?: string }) =>
      apiRequest("PATCH", `/api/hr/offboarding/cases/${caseId}/checklist/${itemId}`, { done, returnStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", numericId, "byEmployee"] });
      toast({ title: "Yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const finalizeCase = useMutation({
    mutationFn: (caseId: number) =>
      apiRequest("POST", `/api/hr/offboarding/cases/${caseId}/finalize`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", numericId, "byEmployee"] });
      toast({ title: "Offboarding yakunlandi" });
    },
    onError: (err: Error) => {
      const msg = err?.message?.includes("EXIT_INTERVIEW_REQUIRED")
        ? "Avval chiqish suhbatini o'tkazing"
        : err?.message?.includes("EXIT_INTERVIEW_INCOMPLETE")
        ? "Suhbatning barcha savollari to'ldirilmagan"
        : "Xatolik yuz berdi";
      toast({ title: msg, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !offboardingCase) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <UserX className="h-14 w-14 opacity-10" />
        <p className="text-sm">Offboarding jarayoni topilmadi</p>
        <p className="text-xs text-muted-foreground/60">Bu xodim uchun hali offboarding boshlangmagan</p>
      </div>
    );
  }

  const oCase = offboardingCase;
  const pct = oCase.total_items > 0
    ? Math.round((oCase.completed_items / oCase.total_items) * 100)
    : 0;
  const checklist = oCase.checklist ?? [];
  const equipmentItems = (Array.isArray(checklist) ? checklist : []).filter(i =>
    ["equipment_returned", "id_card_returned"].includes(i.item_key)
  );

  return (
    <div className="space-y-5 p-4">
      {/* Case Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserX className="h-4 w-4 text-orange-600" />
            Offboarding Ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={STATUS_BADGE[oCase.status]?.variant ?? "secondary"} className="mt-0.5">
                {STATUS_BADGE[oCase.status]?.label ?? oCase.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ketish sababi</p>
              <p className="font-medium text-sm">{DISMISSAL_MAP[oCase.dismissal_type] ?? oCase.dismissal_type}</p>
            </div>
            {oCase.last_working_day && (
              <div>
                <p className="text-xs text-muted-foreground">Oxirgi ish kuni</p>
                <p className="font-medium text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {new Date(oCase.last_working_day).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Boshlangan</p>
              <p className="text-sm">{new Date(oCase.created_at).toLocaleDateString("uz-UZ")}</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Jarayon: {oCase.completed_items}/{oCase.total_items}</span>
              <span className={pct === 100 ? "text-green-600 font-medium" : ""}>{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>

          {/* Settlement block warning */}
          {oCase.blocks_settlement && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 p-3">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Hisob-kitob blokda</p>
                <p className="text-xs text-red-600/80 dark:text-red-400/70">
                  Chiqish suhbatining barcha savollari to'ldirilmagan. Moliya bo'limi to'lovni amalga oshira olmaydi.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exit Interview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Chiqish Suhbati
            </span>
            {!oCase.exit_interview_done && oCase.status === "active" && !showInterviewForm && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowInterviewForm(true)}>
                O'tkazish
              </Button>
            )}
            {oCase.exit_interview_done && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showInterviewForm ? (
            <ExitInterviewForm
              caseId={oCase.id}
              onDone={() => setShowInterviewForm(false)}
            />
          ) : oCase.exit_interview_done && oCase.exitInterview?.answers ? (
            <div className="space-y-3">
              {Object.entries(oCase.exitInterview.answers).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="font-medium">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : oCase.exit_interview_done ? (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Suhbat o'tkazildi</span>
              {oCase.exit_interview_notes && (
                <span className="text-muted-foreground ml-1">— {oCase.exit_interview_notes}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Suhbat hali o'tkazilmagan</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipment / Asset Return Status */}
      {equipmentItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              Mulk Qaytarish Holati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Array.isArray(equipmentItems) ? equipmentItems : []).map(item => {
              const rsInfo = RETURN_STATUS_MAP[item.return_status] ?? RETURN_STATUS_MAP.pending;
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    {item.done
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                    }
                    <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${rsInfo.color}`}>{rsInfo.label}</span>
                    {oCase.status === "active" && !item.done && (
                      <Select
                        value={item.return_status}
                        onValueChange={v =>
                          markItem.mutate({ caseId: oCase.id, itemId: item.id, returnStatus: v, done: v === "returned" })
                        }
                      >
                        <SelectTrigger className="h-6 text-xs w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="returned">Qaytarildi</SelectItem>
                          <SelectItem value="damaged">Shikastlangan</SelectItem>
                          <SelectItem value="missing">Yo'qolgan</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Full Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
            To'liq Chek-list ({oCase.completed_items}/{oCase.total_items})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {(Array.isArray(checklist) ? checklist : []).map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                item.done
                  ? "bg-green-50 dark:bg-green-900/10"
                  : "hover:bg-muted/30"
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
              {!item.done && oCase.status === "active" && item.item_key !== "exit_interview" && item.item_key !== "equipment_returned" && item.item_key !== "id_card_returned" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2 shrink-0"
                  onClick={() => markItem.mutate({ caseId: oCase.id, itemId: item.id, done: true })}
                  disabled={markItem.isPending}
                >
                  Bajarildi
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Finalize button — only when active and exit interview done */}
      {oCase.status === "active" && oCase.exit_interview_done && !oCase.blocks_settlement && (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={() => finalizeCase.mutate(oCase.id)}
          disabled={finalizeCase.isPending}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Offboardingni Finallashtirish
        </Button>
      )}

      {oCase.status === "active" && oCase.exit_interview_done && oCase.blocks_settlement && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/10 p-3 text-sm">
          <ShieldAlert className="h-4 w-4 text-orange-600 shrink-0" />
          <span className="text-orange-700 dark:text-orange-400">
            Finalashtirish bloklangan — suhbatni to'liq to'ldiring
          </span>
        </div>
      )}
    </div>
  );
}
