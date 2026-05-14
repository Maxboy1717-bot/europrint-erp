/**
 * @module RACIMatrixPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid3X3, Plus, AlertTriangle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { RACITask, BusinessStage, Crisis } from "./RACIMatrixPageTypes";
import { AddTaskDialog } from "./RACIMatrixPageDialogs";
import { RACITaskList, BusinessStagesList, CrisesList } from "./RACIMatrixPageSections";
import { EPErrorState } from "@/components/ep";

export default function RACIMatrixPage() {
  const { t } = useTranslation("hr");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("raci");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("production");

  const createTaskMutation = useMutation({
    mutationFn: (data: { taskName: string; category: string }) =>
      apiRequest("POST", "/api/raci-crisis/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raci-crisis/tasks"] });
      toast({ title: "Vazifa yaratildi" });
      setShowAddDialog(false);
      setNewTaskName("");
    },
    onError: () => {
      toast({ title: "Xatolik", variant: "destructive" });
    },
  });

  const { data: tasks = [], isLoading: isLoadingTasks, isError, refetch } = useQuery<RACITask[]>({
    queryKey: ["/api/raci-crisis/tasks"],
  });

  const { data: stages = [], isLoading: isLoadingStages } = useQuery<BusinessStage[]>({
    queryKey: ["/api/raci-crisis/stages"],
  });

  const { data: crises = [], isLoading: isLoadingCrises } = useQuery<Crisis[]>({
    queryKey: ["/api/raci-crisis/crises"],
  });

  const isLoading = isLoadingTasks || isLoadingStages || isLoadingCrises;

  const toggleTask = (id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddTask = () => {
    setShowAddDialog(true);
  };

  const handleCreateTask = () => {
    if (!newTaskName.trim()) {
      toast({ title: "Vazifa nomi kerak", variant: "destructive" });
      return;
    }
    createTaskMutation.mutate({ taskName: newTaskName, category: newTaskCategory });
  };

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <ModulePage
        module="hr"
        title="RACI Matritsasi va Krizis Boshqaruvi"
        icon={<Grid3X3 className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-32 rounded-lg" />}
      >
        <Skeleton className="h-10 w-64 mb-6 rounded-lg" />
        <div className="space-y-3">
          {([1, 2, 3, 4]).map((i) => (
            <Card key={`k-${i}`}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-full mb-2 rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage
      module="hr"
      title="RACI Matritsasi va Krizis Boshqaruvi"
      icon={<Grid3X3 className="h-5 w-5" />}
      actions={
        activeTab === "raci" ? (
          <Button data-testid="button-add-task" onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Vazifa qo'shish
          </Button>
        ) : undefined
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="raci" data-testid="tab-raci">
            <Grid3X3 className="h-4 w-4 mr-2" />
            RACI Matritsasi
          </TabsTrigger>
          <TabsTrigger value="stages" data-testid="tab-stages">
            <TrendingUp className="h-4 w-4 mr-2" />
            Biznes Bosqichlar
          </TabsTrigger>
          <TabsTrigger value="crises" data-testid="tab-crises">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Krizislar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="raci">
          <RACITaskList
            tasks={tasks}
            expandedTasks={expandedTasks}
            onToggleTask={toggleTask}
          />
        </TabsContent>

        <TabsContent value="stages">
          <BusinessStagesList stages={stages} />
        </TabsContent>

        <TabsContent value="crises">
          <CrisesList crises={crises} />
        </TabsContent>
      </Tabs>

      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        taskName={newTaskName}
        onTaskNameChange={setNewTaskName}
        taskCategory={newTaskCategory}
        onTaskCategoryChange={setNewTaskCategory}
        onConfirm={handleCreateTask}
        isPending={createTaskMutation.isPending}
      />
    </ModulePage>
  );
}
