/**
 * @module WeeklyPlanPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { type WeeklyPlan, type PlanResponse, getMondayOfWeek, getWeekLabel, MANAGER_ROLES } from "./WeeklyPlanPageTypes";
import { WeeklyPlanHeader, WeekNavigator, MyPlanSection, ManagerApprovalSection } from "./WeeklyPlanPageSections";

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

  const isManager = MANAGER_ROLES.includes(user?.role as typeof MANAGER_ROLES[number]);

  const { data, isLoading, refetch } = useQuery<PlanResponse>({
    queryKey: ["/api/weekly-plans", week, user?.id],
    queryFn: async () => {
      const empId = user?.id != null && !isNaN(Number(user?.id)) ? Number(user?.id) : null;
      const url = isManager
        ? `/api/weekly-plans?week=${week}`
        : empId != null
        ? `/api/weekly-plans?employee_id=${empId}&week=${week}`
        : `/api/weekly-plans?week=${week}`;
      return await apiRequest<PlanResponse>('GET', url);
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

      return await apiRequest<{ updated?: boolean }>('POST', "/api/weekly-plans", {
        employee_id: user?.id,
        week,
        gsd_target: gsdTarget.trim(),
        top5_tasks,
        success_factors: successFactors.trim() || undefined,
        resources_needed: resourcesNeeded.trim() || undefined,
      });
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
      return await apiRequest('PATCH', `/api/weekly-plans/${planId}/approve`);
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
      <WeeklyPlanHeader onRefresh={refetch} />

      <WeekNavigator week={week} onWeekChange={setWeek} />

      {!isManager && (
        <MyPlanSection
          myPlan={myPlan}
          editMode={editMode}
          isLoading={isLoading}
          week={week}
          gsdTarget={gsdTarget}
          tasks={tasks}
          successFactors={successFactors}
          resourcesNeeded={resourcesNeeded}
          isSubmitPending={submitMutation.isPending}
          onGsdTargetChange={setGsdTarget}
          onTaskChange={setTasks}
          onSuccessFactorsChange={setSuccessFactors}
          onResourcesNeededChange={setResourcesNeeded}
          onSubmit={() => submitMutation.mutate()}
          onEdit={loadPlanIntoForm}
          onCancelEdit={() => setEditMode(false)}
          onStartCreate={() => setEditMode(true)}
        />
      )}

      {isManager && (
        <ManagerApprovalSection
          plans={plans}
          isLoading={isLoading}
          onApprove={(id) => approveMutation.mutate(id)}
          isApprovePending={approveMutation.isPending}
        />
      )}
    </div>
  );
}
