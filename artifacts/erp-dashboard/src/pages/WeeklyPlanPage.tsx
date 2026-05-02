import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getAuthHeaders } from "@/lib/queryClient";
import {
  ClipboardList, CheckCircle, Clock, Plus, Trash2,
  CalendarDays, Target, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyPlan {
  id: number;
  employeeId: number;
  weekStart: string;
  gsdTarget: string;
  top5Tasks: string[];
  successFactors?: string;
  resourcesNeeded?: string;
  status: "draft" | "submitted" | "approved";
  approvedBy?: number;
  approvedAt?: string;
  createdAt: string;
}

interface PlanResponse {
  plans: WeeklyPlan[];
  weekStart: string;
}

function getWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
  return `${fmt(d)} — ${fmt(end)}`;
}

function offsetWeek(weekStart: string, delta: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().split("T")[0];
}

function getMondayOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function statusBadge(status: WeeklyPlan["status"]) {
  if (status === "approved")
    return <Badge className="bg-emerald-100 text-emerald-700 border-0">Tasdiqlangan</Badge>;
  if (status === "submitted")
    return <Badge className="bg-blue-100 text-blue-700 border-0">Yuborilgan</Badge>;
  return <Badge variant="secondary">Qoralama</Badge>;
}

export default function WeeklyPlanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [week, setWeek] = useState(getMondayOfWeek);
  const [gsdTarget, setGsdTarget] = useState("");
  const [tasks, setTasks] = useState<string[]>(["", "", "", "", ""]);
  const [successFactors, setSuccessFactors] = useState("");
  const [resourcesNeeded, setResourcesNeeded] = useState("");
  const [editMode, setEditMode] = useState(false);

  const isManager = ["director", "super_admin", "department_head", "manager"].includes(user?.role ?? "");

  const { data, isLoading, refetch } = useQuery<PlanResponse>({
    queryKey: ["/api/weekly-plans", week, user?.id],
    queryFn: async () => {
      const empId = user?.id != null && !isNaN(Number(user?.id)) ? Number(user?.id) : null;
      const url = isManager
        ? `/api/weekly-plans?week=${week}`
        : empId != null
        ? `/api/weekly-plans?employee_id=${empId}&week=${week}`
        : `/api/weekly-plans?week=${week}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Yuklab bo'lmadi");
      return res.json();
    },
  });

  const myPlan = data?.plans?.find((p) => p.employeeId === (user?.id ?? 0));

  function loadPlanIntoForm(plan: WeeklyPlan) {
    setGsdTarget(plan.gsdTarget);
    const t = Array.isArray(plan.top5Tasks) ? plan.top5Tasks : [];
    setTasks([...t, ...Array(5).fill("")].slice(0, 5));
    setSuccessFactors(plan.successFactors ?? "");
    setResourcesNeeded(plan.resourcesNeeded ?? "");
    setEditMode(true);
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      const top5_tasks = (Array.isArray(tasks) ? tasks : []).filter((t) => t.trim().length > 0);
      if (!gsdTarget.trim()) throw new Error("GSD maqsad talab qilinadi");
      if (top5_tasks.length === 0) throw new Error("Kamida 1 ta vazifa kiriting");

      const res = await fetch("/api/weekly-plans", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: user?.id,
          week,
          gsd_target: gsdTarget.trim(),
          top5_tasks,
          success_factors: successFactors.trim() || null,
          resources_needed: resourcesNeeded.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Saqlashda xatolik");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.updated ? "Reja yangilandi" : "Reja yuborildi", description: `${getWeekLabel(week)} hafta` });
      qc.invalidateQueries({ queryKey: ["/api/weekly-plans"] });
      setEditMode(false);
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await fetch(`/api/weekly-plans/${planId}/approve`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Tasdiqlashda xatolik");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reja tasdiqlandi" });
      qc.invalidateQueries({ queryKey: ["/api/weekly-plans"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const plans = data?.plans ?? [];

  return (
    <div className="flex-1 overflow-auto bg-background p-5 space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Haftalik Reja
          </h1>
          <p className="text-sm text-muted-foreground mt-1">GSD maqsad + Top-5 vazifa topshirish va tasdiqlash tizimi</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Yangilash
        </Button>
      </div>

      {/* Week Navigator */}
      <Card>
        <CardContent className="py-3 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => setWeek((w) => offsetWeek(w, -1))}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Oldingi
          </Button>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{getWeekLabel(week)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Hafta boshlanishi: {week}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setWeek((w) => offsetWeek(w, 1))}>
            Keyingi <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Employee: Submit Form */}
      {!isManager && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Mening Rejam
              </CardTitle>
              {myPlan && !editMode && (
                <div className="flex items-center gap-2">
                  {statusBadge(myPlan.status)}
                  {myPlan.status !== "approved" && (
                    <Button variant="outline" size="sm" onClick={() => loadPlanIntoForm(myPlan)}>
                      Tahrirlash
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : myPlan && !editMode ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">GSD Maqsad</p>
                  <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{myPlan.gsdTarget}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top-5 Vazifalar</p>
                  <ol className="space-y-1.5">
                    {(myPlan.top5Tasks as string[]).map((task, i) => (
                      <li key={`k-${i}`} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-foreground">{task}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                {myPlan.successFactors && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Muvaffaqiyat Omillari</p>
                    <p className="text-sm text-foreground">{myPlan.successFactors}</p>
                  </div>
                )}
                {myPlan.resourcesNeeded && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kerak Resurslar</p>
                    <p className="text-sm text-foreground">{myPlan.resourcesNeeded}</p>
                  </div>
                )}
                {myPlan.status === "approved" && myPlan.approvedAt && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Tasdiqlangan: {new Date(myPlan.approvedAt).toLocaleDateString("uz-UZ")}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    GSD Maqsad <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    value={gsdTarget}
                    onChange={(e) => setGsdTarget(e.target.value)}
                    placeholder="Bu hafta erishmoqchi bo'lgan asosiy natija..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Top-5 Vazifalar <span className="text-destructive">*</span>
                  </label>
                  <div className="space-y-2">
                    {(Array.isArray(tasks) ? tasks : []).map((task, i) => (
                      <div key={`k-${i}`} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <Input
                          value={task}
                          onChange={(e) => {
                            const next = [...tasks];
                            next[i] = e.target.value;
                            setTasks(next);
                          }}
                          placeholder={`${i + 1}-vazifa`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Muvaffaqiyat Omillari</label>
                  <Textarea
                    value={successFactors}
                    onChange={(e) => setSuccessFactors(e.target.value)}
                    placeholder="Nima bo'lsa muvaffaqiyatga erishiladi?"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Kerak Resurslar</label>
                  <Textarea
                    value={resourcesNeeded}
                    onChange={(e) => setResourcesNeeded(e.target.value)}
                    placeholder="Maqsadga erishish uchun nima kerak?"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending}
                    className="flex-1"
                  >
                    {submitMutation.isPending ? "Saqlanmoqda..." : editMode ? "Yangilash" : "Topshirish"}
                  </Button>
                  {editMode && (
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Bekor
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!myPlan && !editMode && !isLoading && (
              <div className="text-center py-6">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  {getWeekLabel(week)} hafta uchun reja topshirilmagan
                </p>
                <Button onClick={() => setEditMode(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Reja yaratish
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manager: Approval View */}
      {isManager && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Xodimlar Rejalari — Tasdiqlash
              {plans.length > 0 && (
                <Badge variant="secondary" className="ml-2">{plans.length} ta</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {([0, 1, 2]).map((i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Bu hafta uchun hech qanday reja topshirilmagan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(Array.isArray(plans) ? plans : []).map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "border rounded-xl p-4 space-y-3",
                      plan.status === "approved"
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-border bg-muted/20"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          Xodim #{plan.employeeId}
                        </span>
                        {statusBadge(plan.status)}
                      </div>
                      {plan.status === "submitted" && (
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(plan.id)}
                          disabled={approveMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Tasdiqlash
                        </Button>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">GSD Maqsad</p>
                      <p className="text-sm text-foreground">{plan.gsdTarget}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">Top-5 Vazifalar</p>
                      <ol className="space-y-1">
                        {(plan.top5Tasks as string[]).map((task, i) => (
                          <li key={`k-${i}`} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {task}
                          </li>
                        ))}
                      </ol>
                    </div>
                    {plan.status === "approved" && plan.approvedAt && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Tasdiqlangan: {new Date(plan.approvedAt).toLocaleDateString("uz-UZ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
