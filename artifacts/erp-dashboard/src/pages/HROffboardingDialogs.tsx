/**
 * @module HROffboardingDialogs
 * @description Dialog and card components for the HR Offboarding page.
 * OffboardingCard renders a summary card; CreateCaseDialog is the modal form
 * used to start a new offboarding process.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  UserX, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, ClipboardList,
} from "lucide-react";
import { apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n';
import {
  type OffboardingCase,
  type Employee,
  STATUS_BADGE,
  DISMISSAL_MAP,
} from "./HROffboardingTypes";

// ── OffboardingCard ───────────────────────────────────────────────────────────

export function OffboardingCard({
  item,
  onOpenChecklist,
}: {
  item: OffboardingCase;
  onOpenChecklist: (id: number) => void;
}) {
  const { t } = useTranslation("common");
  const [expanded, setExpanded] = useState(false);

  const pct =
    item.total_items > 0
      ? Math.round((item.completed_items / item.total_items) * 100)
      : 0;
  const isComplete = item.status === "completed";
  const isCancelled = item.status === "cancelled";

  const steps = [
    { key: "exit_interview_done", label: "Chiqish suhbati",             done: item.exit_interview_done },
    { key: "equipment_returned",  label: "Jihozlar qaytarildi",          done: item.equipment_returned },
    { key: "settlement_done",     label: "Hisob-kitob amalga oshirildi", done: item.settlement_done },
    { key: "nda_signed",          label: "NDA imzolandi",                done: item.nda_signed },
  ];

  return (
    <Card className={`transition-all ${isCancelled ? "opacity-50" : ""}`}>
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-4">
          {/* Status icon */}
          <div
            className={`rounded-full p-2.5 shrink-0 mt-0.5 ${
              isComplete
                ? "bg-green-100 dark:bg-green-900/20"
                : isCancelled
                ? "bg-gray-100 dark:bg-gray-800/20"
                : "bg-orange-100 dark:bg-orange-900/20"
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />
            ) : isCancelled ? (
              <AlertCircle className="h-4 w-4 text-gray-400" />
            ) : (
              <UserX className="h-4 w-4 text-[var(--ep-primary)]" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Name / position row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">
                  {item.full_name || `Xodim #${item.employee_id}`}
                </p>
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
                <Badge
                  variant={STATUS_BADGE[item.status]?.variant ?? "secondary"}
                  className="text-xs"
                >
                  {STATUS_BADGE[item.status]?.label ?? item.status}
                </Badge>
              </div>
            </div>

            {!isCancelled && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Jarayon: {item.completed_items}/{item.total_items} bosqich</span>
                  <span className={pct === 100 ? "text-[var(--ep-green)] font-medium" : ""}>{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Sabab:{" "}
              <span className="text-foreground">
                {DISMISSAL_MAP[item.dismissal_type] ?? item.dismissal_type}
              </span>
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setExpanded(e => !e)}
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
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
                  {t("chekList1")}
                </Button>
              )}
            </div>

            {/* Expanded mini-checklist summary */}
            {expanded && (
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                {steps.map(s => (
                  <div key={s.key} className="flex items-center gap-2 text-xs">
                    {s.done ? (
                      <CheckCircle2 className="h-3 w-3 text-[var(--ep-green)] shrink-0" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                    )}
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

// ── CreateCaseDialog ──────────────────────────────────────────────────────────
export function CreateCaseDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employeeId: "",
    dismissalType: "resignation",
    lastWorkingDay: "",
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      let d: unknown;
      try { d = await apiRequest('GET', "/api/hr/employees?limit=500"); }
      catch { return []; }
      return Array.isArray(d)
        ? (d as Employee[])
        : ((d as { employees?: Employee[] })?.employees ?? []);
    },
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
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-[var(--ep-primary)]" />
            {t("yangiOffboardingJarayoni")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("xodim1")}</Label>
            <Select
              value={form.employeeId}
              onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("xodimniTanlang1")} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {empList.map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {(e.full_name ??
                      `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim()) ||
                      `#${e.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("ketishSababi")}</Label>
            <Select
              value={form.dismissalType}
              onValueChange={v => setForm(f => ({ ...f, dismissalType: v }))}
            >
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
            <Label>{t("oxirgiIshKuni")}</Label>
            <Input
              type="date"
              value={form.lastWorkingDay}
              onChange={e => setForm(f => ({ ...f, lastWorkingDay: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!form.employeeId || create.isPending}
            className="bg-[var(--ep-primary)] hover:bg-[var(--ep-primary)]/90 text-white"
          >
            {t("boshlash")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
