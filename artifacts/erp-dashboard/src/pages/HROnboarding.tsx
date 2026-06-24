/**
 * @module HROnboarding
 * @description Route-level page for the HR onboarding flow. Owns top-level
 * state + mutations and delegates rendering to:
 *   - HROnboardingSections: stats, tables, panels (pure presentation)
 *   - HROnboardingDialogs:  CreateOnboardingDialog
 *   - HROnboardingHelpers:  per-row helpers (EmployeeFolderItems)
 *
 * All types live in HROnboardingTypes.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Plus, ClipboardList, Play } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OnboardingRoadmapDialog } from "@/components/hr/OnboardingRoadmapDialog";
import { useTranslation } from "@/lib/i18n";

import type {
  ChecklistItem,
  Employee,
  OnboardingRoadmap,
  OnboardingForm,
  ViewRoadmapEntry,
} from "./HROnboardingTypes";
import {
  StatsGrid,
  NewEmployeesTable,
  PositionFolderSection,
  RoadmapsTable,
  ChecklistProgressTable,
} from "./HROnboardingSections";
import { CreateOnboardingDialog } from "./HROnboardingDialogs";

interface OnboardingPlan {
  id: number;
  name: string;
  name_ru?: string | null;
  position_id?: number | null;
  department_id?: number | null;
  probation_days?: number | null;
  created_at?: string | null;
}

export default function HROnboarding() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<OnboardingForm>({ userId: "", fullName: "", positionName: "", type: "" });
  const [viewRoadmapEntry, setViewRoadmapEntry] = useState<ViewRoadmapEntry | null>(null);

  // Onboarding plans (POST /api/hr/onboarding/plans)
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planProbationDays, setPlanProbationDays] = useState("");

  // Start onboarding (POST /api/hr/onboarding/start)
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [startEmployeeId, setStartEmployeeId] = useState("");
  const [startPlanId, setStartPlanId] = useState("");
  const [startMentorId, setStartMentorId] = useState("");
  const [startDate, setStartDate] = useState("");

  const { data: checklists = [], isLoading: checkLoading } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/hr/onboarding-checklists"],
  });

  const { data: plansRaw, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/hr/onboarding/plans"],
  });
  const plans: OnboardingPlan[] = (() => {
    const d = plansRaw as Record<string, unknown> | null;
    if (!d) return [];
    if (Array.isArray(d)) return d as OnboardingPlan[];
    if (Array.isArray((d as { items?: unknown[] }).items)) return (d as { items: OnboardingPlan[] }).items;
    if (Array.isArray((d as { data?: unknown[] }).data)) return (d as { data: OnboardingPlan[] }).data;
    return [];
  })();

  const startOnboarding = useMutation({
    mutationFn: (payload: { employeeId: number; planId: number; mentorId?: number; startDate: string }) =>
      apiRequest("POST", "/api/hr/onboarding/start", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/onboarding/plans"] });
      setShowStartDialog(false);
      setStartEmployeeId(""); setStartPlanId(""); setStartMentorId(""); setStartDate("");
      toast({ title: t("onboardingBoshlandi", "Xodim onboardingi boshlandi") });
    },
    onError: () => toast({ title: t("xatolikYuzBerdi", "Xatolik yuz berdi"), variant: "destructive" }),
  });

  const createPlan = useMutation({
    mutationFn: (payload: { name: string; probationDays?: number }) =>
      apiRequest("POST", "/api/hr/onboarding/plans", { ...payload, weeklyPlan: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/onboarding/plans"] });
      setShowPlanDialog(false);
      setPlanName(""); setPlanProbationDays("");
      toast({ title: t("onboardingRejaQoshildi", "Onboarding reja qo'shildi") });
    },
    onError: () => toast({ title: t("xatolikYuzBerdi", "Xatolik yuz berdi"), variant: "destructive" }),
  });

  const { data: roadmapsRaw } = useQuery({ queryKey: ["/api/hr/recruitment/roadmaps"] });
  // P1.17.1: BE returns { items, total }; also handle { data } for backward compat
  const roadmaps: OnboardingRoadmap[] = (() => {
    const d = roadmapsRaw as Record<string, unknown> | null;
    if (!d) return [];
    if (Array.isArray(d)) return d as OnboardingRoadmap[];
    if (Array.isArray(d['items'])) return d['items'] as OnboardingRoadmap[];
    if (Array.isArray(d['data']))  return d['data']  as OnboardingRoadmap[];
    return [];
  })();

  const { data: employeesRaw } = useQuery({ queryKey: ["/api/hr/employees"] });
  const employees: Employee[] = (() => {
    const d = employeesRaw as Record<string, unknown> | null;
    if (!d) return [];
    if (Array.isArray(d)) return d as Employee[];
    if (Array.isArray(d['items'])) return d['items'] as Employee[];
    if (Array.isArray(d['data']))  return d['data']  as Employee[];
    return [];
  })();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const newEmployees = (Array.isArray(employees) ? employees : []).filter((e) => {
    const d = e.hireDate || e.createdAt;
    return d ? new Date(d) >= ninetyDaysAgo : false;
  });
  const onboardingChecklists = (Array.isArray(checklists) ? checklists : []).filter((c) => c.type === "onboarding");

  const updateChecklist = useMutation({
    mutationFn: ({ id, completedItems }: { id: string; completedItems: number }) =>
      apiRequest("PATCH", `/api/hr/onboarding-checklists/${id}`, { completedItems }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/onboarding-checklists"] });
      toast({ title: "Checklist yangilandi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createChecklist = useMutation({
    mutationFn: (data: OnboardingForm) =>
      apiRequest("POST", "/api/hr/onboarding-checklists", { ...data, type: "onboarding" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/onboarding-checklists"] });
      toast({ title: "Onboarding boshlandi" });
      setShowDialog(false);
      setForm({ userId: "", fullName: "", positionName: "", type: "" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">{t("hrOnboarding")}</h1>
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)} data-testid="button-add-onboarding">
          <Plus className="h-3.5 w-3.5 mr-1.5" />{t("onboardingBoshlash")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <StatsGrid newEmployeesCount={newEmployees.length} checklistsCount={onboardingChecklists.length} />
        <NewEmployeesTable newEmployees={newEmployees} />
        <PositionFolderSection newEmployees={newEmployees} />
        <RoadmapsTable roadmaps={roadmaps} onView={setViewRoadmapEntry} />
        {onboardingChecklists.length > 0 && (
          <ChecklistProgressTable
            onboardingChecklists={onboardingChecklists}
            checkLoading={checkLoading}
            onIncrement={(args) => updateChecklist.mutate(args)}
            isIncrementing={updateChecklist.isPending}
          />
        )}

        {/* Onboarding plans section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[var(--ep-blue)]" />
              <h2 className="font-semibold text-sm">{t("onboardingRejalari", "Onboarding rejalari")}</h2>
              <span className="text-xs text-muted-foreground">({plans.length})</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowStartDialog(true)} data-testid="button-start-onboarding">
                <Play className="h-3.5 w-3.5 mr-1" />
                {t("onboardingBoshlash", "Boshlash")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowPlanDialog(true)} data-testid="button-add-plan">
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("rejaQoshish", "Reja qo'shish")}
              </Button>
            </div>
          </div>
          {plansLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("rejaYoq", "Rejalari topilmadi")}</p>
          ) : (
            <div className="space-y-1.5">
              {plans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-border/50 bg-card/60" data-testid={`row-plan-${plan.id}`}>
                  <div>
                    <span className="text-sm font-medium">{plan.name}</span>
                    {plan.probation_days ? (
                      <span className="ml-2 text-xs text-muted-foreground">{plan.probation_days} kun</span>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">#{plan.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateOnboardingDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        form={form}
        setForm={setForm}
        onSubmit={() => createChecklist.mutate(form)}
        isPending={createChecklist.isPending}
      />

      {/* Onboarding plans create dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {t("onboardingRejaYaratish", "Yangi onboarding reja")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("rejaNomi", "Reja nomi")} *</Label>
              <Input
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder={t("onboardingRejaPlaceholder", "Masalan: Yangi dasturchi uchun reja")}
                data-testid="input-plan-name"
              />
            </div>
            <div>
              <Label>{t("sinov muddati", "Sinov muddati (kun)")}</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={planProbationDays}
                onChange={e => setPlanProbationDays(e.target.value)}
                placeholder="90"
                data-testid="input-plan-probation-days"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPlanDialog(false)}>{t("cancel")}</Button>
              <Button
                onClick={() => {
                  if (!planName.trim()) return;
                  createPlan.mutate({
                    name: planName.trim(),
                    ...(planProbationDays ? { probationDays: Number(planProbationDays) } : {}),
                  });
                }}
                disabled={createPlan.isPending || !planName.trim()}
                data-testid="button-save-plan"
              >
                {t("Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start onboarding dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {t("xodimOnboardingiBoshlash", "Xodim onboardingini boshlash")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("xodim", "Xodim")} *</Label>
              <Select value={startEmployeeId} onValueChange={setStartEmployeeId}>
                <SelectTrigger data-testid="select-start-employee">
                  <SelectValue placeholder={t("xodimTanlang", "Xodim tanlang...")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.slice(0, 50).map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.fullName ?? `#${e.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("onboardingReja", "Onboarding reja")} *</Label>
              <Select value={startPlanId} onValueChange={setStartPlanId}>
                <SelectTrigger data-testid="select-start-plan">
                  <SelectValue placeholder={t("rejaTanlang", "Reja tanlang...")} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("nastavnik", "Nastavnik (ixtiyoriy)")}</Label>
              <Select value={startMentorId} onValueChange={setStartMentorId}>
                <SelectTrigger data-testid="select-start-mentor">
                  <SelectValue placeholder={t("nastavnikTanlang", "Nastavnik tanlang...")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.slice(0, 50).map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.fullName ?? `#${e.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("boshlanishSanasi", "Boshlanish sanasi")} *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStartDialog(false)}>{t("cancel")}</Button>
              <Button
                onClick={() => {
                  if (!startEmployeeId || !startPlanId || !startDate) return;
                  startOnboarding.mutate({
                    employeeId: Number(startEmployeeId),
                    planId: Number(startPlanId),
                    ...(startMentorId ? { mentorId: Number(startMentorId) } : {}),
                    startDate: new Date(startDate).toISOString(),
                  });
                }}
                disabled={startOnboarding.isPending || !startEmployeeId || !startPlanId || !startDate}
                data-testid="button-save-start-onboarding"
              >
                {t("boshlash", "Boshlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {viewRoadmapEntry && (
        <OnboardingRoadmapDialog
          open={!!viewRoadmapEntry}
          onClose={() => setViewRoadmapEntry(null)}
          pipelineEntryId={viewRoadmapEntry.id}
          candidateName={viewRoadmapEntry.name}
          vacancyTitle={viewRoadmapEntry.vacancyTitle}
        />
      )}
    </div>
  );
}
