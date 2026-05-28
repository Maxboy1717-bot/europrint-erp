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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Plus } from "lucide-react";
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

export default function HROnboarding() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<OnboardingForm>({ userId: "", fullName: "", positionName: "", type: "" });
  const [viewRoadmapEntry, setViewRoadmapEntry] = useState<ViewRoadmapEntry | null>(null);

  const { data: checklists = [], isLoading: checkLoading } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/hr/onboarding-checklists"],
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
      </div>

      <CreateOnboardingDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        form={form}
        setForm={setForm}
        onSubmit={() => createChecklist.mutate(form)}
        isPending={createChecklist.isPending}
      />

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
