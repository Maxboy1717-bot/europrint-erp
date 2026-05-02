import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Grid3X3,
  Users,
  Plus,
  AlertTriangle,
  Heart,
  Activity,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/error-state";

interface RACIAssignment {
  role: "R" | "A" | "C" | "I";
  employeeName: string;
  position?: string;
}

interface RACITask {
  id: string;
  taskName: string;
  taskNameRu?: string;
  description?: string;
  category: string;
  isActive?: boolean;
  assignments?: RACIAssignment[];
}

interface BusinessStage {
  id: string;
  stageNumber: number;
  name: string;
  employeeMin?: number;
  employeeMax?: number;
  keyChallenges?: string[];
}

interface Crisis {
  id: string;
  name: string;
  type: string;
  symptoms?: string[];
  solutions?: string[];
}

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "R":
      return "default";
    case "A":
      return "destructive";
    case "C":
      return "secondary";
    case "I":
      return "outline";
    default:
      return "secondary";
  }
};

const roleLabel = (role: string) => {
  switch (role) {
    case "R":
      return "Responsible";
    case "A":
      return "Accountable";
    case "C":
      return "Consulted";
    case "I":
      return "Informed";
    default:
      return role;
  }
};

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

  const { data: tasks = [], isLoading: isLoadingTasks, isError, refetch} = useQuery<RACITask[]>({
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
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <ModulePage
        module="hr"
        title="RACI Matritsasi va Krizis Boshqaruvi"
        icon={<Grid3X3 className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-32" />}
      >
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-3">
          {([1, 2, 3, 4]).map((i) => (
            <Card key={`k-${i}`}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
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
          {tasks.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-tasks">
              <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                RACI vazifalari mavjud emas
              </p>
            </div>
          ) : (
            <div className="space-y-2" data-testid="raci-task-list">
              {(Array.isArray(tasks) ? tasks : []).map((task) => {
                const isExpanded = expandedTasks.has(task.id);
                return (
                  <Card key={task.id} data-testid={`card-task-${task.id}`}>
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover-elevate rounded-md"
                      onClick={() => toggleTask(task.id)}
                      data-testid={`task-toggle-${task.id}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-medium text-sm flex-1" data-testid={`text-task-name-${task.id}`}>
                        {task.taskName}
                      </span>
                      <Badge variant="secondary" data-testid={`badge-category-${task.id}`}>
                        {task.category}
                      </Badge>
                    </div>

                    {isExpanded && task.assignments && task.assignments.length > 0 && (
                      <CardContent className="pt-0 pb-4" data-testid={`task-assignments-${task.id}`}>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Rol</TableHead>
                              <TableHead>Xodim</TableHead>
                              <TableHead>Lavozim</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(Array.isArray(task.assignments) ? task.assignments : []).map((assignment, idx) => (
                              <TableRow key={idx} data-testid={`row-assignment-${task.id}-${idx}`}>
                                <TableCell>
                                  <Badge variant={roleBadgeVariant(assignment.role) as "default" | "secondary" | "destructive" | "outline"}>
                                    {assignment.role} - {roleLabel(assignment.role)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{assignment.employeeName}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {assignment.position || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    )}

                    {isExpanded && (!task.assignments || task.assignments.length === 0) && (
                      <CardContent className="pt-0 pb-4">
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Tayinlanmalar mavjud emas
                        </p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stages">
          {stages.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-stages">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Biznes bosqichlar mavjud emas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="stages-list">
              {(Array.isArray(stages) ? stages : []).map((stage) => (
                <Card key={stage.id} data-testid={`card-stage-${stage.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">
                        {stage.name}
                      </CardTitle>
                      <Badge variant="outline" data-testid={`badge-stage-number-${stage.id}`}>
                        #{stage.stageNumber}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(stage.employeeMin !== undefined || stage.employeeMax !== undefined) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span data-testid={`text-employee-range-${stage.id}`}>
                          {stage.employeeMin || 0} - {stage.employeeMax || "..."} xodim
                        </span>
                      </div>
                    )}

                    {stage.keyChallenges && stage.keyChallenges.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Asosiy muammolar:</p>
                        <ul className="space-y-1">
                          {(Array.isArray(stage.keyChallenges) ? stage.keyChallenges : []).map((challenge, idx) => (
                            <li
                              key={idx}
                              className="text-sm flex items-start gap-2"
                              data-testid={`text-challenge-${stage.id}-${idx}`}
                            >
                              <AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500 shrink-0" />
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="crises">
          {crises.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-crises">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Krizis turlari mavjud emas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="crises-list">
              {(Array.isArray(crises) ? crises : []).map((crisis) => (
                <Card key={crisis.id} data-testid={`card-crisis-${crisis.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        {crisis.name}
                      </CardTitle>
                      <Badge variant="destructive" data-testid={`badge-crisis-type-${crisis.id}`}>
                        {crisis.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {crisis.symptoms && crisis.symptoms.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Simptomlar:
                        </p>
                        <ul className="space-y-1">
                          {(Array.isArray(crisis.symptoms) ? crisis.symptoms : []).map((symptom, idx) => (
                            <li
                              key={idx}
                              className="text-sm flex items-start gap-2"
                              data-testid={`text-symptom-${crisis.id}-${idx}`}
                            >
                              <Heart className="h-3 w-3 mt-0.5 text-red-500 shrink-0" />
                              {symptom}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {crisis.solutions && crisis.solutions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Yechimlar:
                        </p>
                        <ul className="space-y-1">
                          {(Array.isArray(crisis.solutions) ? crisis.solutions : []).map((solution, idx) => (
                            <li
                              key={idx}
                              className="text-sm flex items-start gap-2"
                              data-testid={`text-solution-${crisis.id}-${idx}`}
                            >
                              <span className="text-green-500 shrink-0">+</span>
                              {solution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi vazifa qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vazifa nomi *</label>
              <Input
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Vazifa nomini kiriting"
                data-testid="input-task-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategoriya</label>
              <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                <SelectTrigger data-testid="select-task-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Ishlab chiqarish</SelectItem>
                  <SelectItem value="sales">Sotuv</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="finance">Moliya</SelectItem>
                  <SelectItem value="logistics">Logistika</SelectItem>
                  <SelectItem value="quality">Sifat nazorati</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending} data-testid="button-create-task">
              {createTaskMutation.isPending ? "..." : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
