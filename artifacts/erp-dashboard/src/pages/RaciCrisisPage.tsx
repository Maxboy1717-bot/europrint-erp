/**
 * @module RaciCrisisPage
 * @description React page component. Route-level UI.
 * State management, hooks, and orchestration only.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ModulePage } from "@/components/ui/module-page";
import { Shield, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  RaciTask,
  Crisis,
  TabType,
  TaskFormState,
  INITIAL_TASK_FORM,
  TASK_QUERY_KEY,
  CRISIS_QUERY_KEY,
} from "./RaciCrisisPageTypes";
import { LoadingSkeleton, TabBar, StatusFilterBar, TaskList, CrisisList } from "./RaciCrisisPageSections";
import { CreateTaskDialog } from "./RaciCrisisPageDialogs";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function RaciCrisisPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [tab, setTab]                     = useState<TabType>("tasks");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [showCreate, setShowCreate]       = useState(false);
  const [taskForm, setTaskForm]           = useState<TaskFormState>(INITIAL_TASK_FORM);

  const {
    data: tasksRaw,
    isLoading: loadingTasks,
    isError: isTasksError, error: errorTasks,
    refetch: refetchTasks,
  } = useQuery<RaciTask[] | { data?: RaciTask[] }>({
    queryKey: [...TASK_QUERY_KEY, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return await apiRequest("GET", `/api/raci-crisis/tasks?${params}`);
    },
    enabled: tab === "tasks",
  });

  const {
    data: crisesRaw,
    isLoading: loadingCrises,
    isError: isCrisesError, error: errorCrises,
    refetch: refetchCrises,
  } = useQuery<Crisis[] | { data?: Crisis[] }>({
    queryKey: CRISIS_QUERY_KEY,
    queryFn: async () => {
      return await apiRequest("GET", "/api/raci-crisis/crises");
    },
    enabled: tab === "crises",
  });

  const tasks: RaciTask[] = Array.isArray(tasksRaw)
    ? tasksRaw
    : (tasksRaw as { data?: RaciTask[] })?.data ?? [];

  const crises: Crisis[] = Array.isArray(crisesRaw)
    ? crisesRaw
    : (crisesRaw as { data?: Crisis[] })?.data ?? [];

  const createTaskMutation = useMutation({
    mutationFn: async (dto: TaskFormState) => {
      return await apiRequest("POST", "/api/raci-crisis/tasks", dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEY });
      toast({ title: "Vazifa yaratildi" });
      setShowCreate(false);
      setTaskForm(INITIAL_TASK_FORM);
    },
    onError: () =>
      toast({ title: "Xatolik", description: "Yaratishda muammo", variant: "destructive" }),
  });

  const isLoading = tab === "tasks" ? loadingTasks : loadingCrises;
  const isError   = tab === "tasks" ? isTasksError : isCrisesError;
  void errorTasks; void errorCrises;
  const refetch   = tab === "tasks" ? refetchTasks : refetchCrises;

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="security"
      title={t("raciInqirozlar")}
      icon={<Shield className="h-5 w-5" />}
      actions={
        tab === "tasks" ? (
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-task">
            <Plus className="h-4 w-4 mr-2" />
            {t("vazifaQoshish")}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <TabBar tab={tab} onTabChange={setTab} />

        {tab === "tasks" && (
          <StatusFilterBar statusFilter={statusFilter} onFilterChange={setStatusFilter} />
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : tab === "tasks" ? (
          <TaskList tasks={tasks} />
        ) : (
          <CrisisList crises={crises} />
        )}
      </div>

      <CreateTaskDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        form={taskForm}
        onFormChange={setTaskForm}
        onConfirm={() => { if (taskForm.title.trim()) createTaskMutation.mutate(taskForm); }}
        isPending={createTaskMutation.isPending}
      />
    </ModulePage>
  );
}
