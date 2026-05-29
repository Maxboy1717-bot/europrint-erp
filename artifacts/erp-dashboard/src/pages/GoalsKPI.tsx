/**
 * @module GoalsKPI
 * @description State, hooks, and orchestration for Goals & KPI page.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema, type Goal, type InsertGoal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useUndoDelete } from "@/components/undo-toast";
import { GoalDialog } from "./GoalsKPIDialogs";
import { GoalsSummaryCards, GoalsList } from "./GoalsKPISections";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function GoalsKPI() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { showUndoToast } = useUndoDelete();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const { data: goals = [], isLoading, isError, error, refetch } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: departments = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/org-departments"],
  });

  const { data: positions = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/org-functions"],
  });

  const { data: employeesResponse } = useQuery<{ data: Array<{ id: string; fullName: string }> }>({
    queryKey: ["/api/hr/employees"],
  });
  const employees = employeesResponse?.data || [];

  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "learning",
      targetType: "global",
      targetId: "",
      metric: "",
      targetValue: 100,
      startDate: "",
      endDate: "",
      status: "active",
      priority: "medium",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGoal) => {
      return await apiRequest('POST', "/api/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Maqsad yaratildi" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Maqsad yaratilmadi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertGoal> }) => {
      return await apiRequest('PATCH', `/api/goals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Maqsad yangilandi" });
      setIsDialogOpen(false);
      setEditingGoal(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/goals/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      const goal = (Array.isArray(goals) ? goals : []).find(g => g.id === id);
      showUndoToast("goals", id, goal?.title || id, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      });
    },
  });

  const onSubmit = (data: InsertGoal) => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    form.reset({
      title: goal.title,
      description: goal.description || "",
      category: goal.category as InsertGoal["category"],
      targetType: goal.targetType as InsertGoal["targetType"],
      targetId: goal.targetId || "",
      metric: goal.metric,
      targetValue: goal.targetValue,
      startDate: goal.startDate,
      endDate: goal.endDate,
      status: goal.status as InsertGoal["status"],
      priority: goal.priority as InsertGoal["priority"],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleResetForNew = () => {
    setEditingGoal(null);
    form.reset();
  };

  const activeGoals = (Array.isArray(goals) ? goals : []).filter(g => g.status === "active");
  const completedGoals = (Array.isArray(goals) ? goals : []).filter(g => g.status === "completed");

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("maqsadVaKpi")}</b></>}
        title={t("maqsadVaKpi")}
        subtitle={t("oquvMaqsadlariniBoshqarishVaKuzatish")}
      />
        </div>

        <GoalDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingGoal={editingGoal}
          form={form}
          onSubmit={onSubmit}
          departments={departments}
          positions={positions}
          employees={employees}
          onResetForNew={handleResetForNew}
        />
      </div>

      <GoalsSummaryCards
        goals={goals}
        activeCount={activeGoals.length}
        completedCount={completedGoals.length}
      />

      <GoalsList
        goals={goals}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeletePending={deleteMutation.isPending}
      />
    </div>
  );
}
