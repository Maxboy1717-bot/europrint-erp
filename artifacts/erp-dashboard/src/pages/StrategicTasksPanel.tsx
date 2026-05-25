/**
 * @module StrategicTasksPanel
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStrategicTaskSchema } from "@shared/schema";
import type { InsertStrategicTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database,
} from "lucide-react";
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  type DashboardData,
  type CategoriesResponse,
  type TasksResponse,
} from "./StrategicTasksPanelTypes";
import { CategoryDialog, TaskDialog } from "./StrategicTasksPanelDialogs";
import { TasksTable } from "./StrategicTasksPanelTable";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function StrategicTasksPanel() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");

  const { data: dashboard, isLoading: dashLoading, isError, error, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/strategic/dashboard"],
  });

  const { data: categoriesData } = useQuery<CategoriesResponse>({
    queryKey: ["/api/strategic/categories"],
  });
  const categories = categoriesData?.categories || [];

  const queryParams = new URLSearchParams();
  if (statusFilter) queryParams.set("status", statusFilter);
  if (priorityFilter) queryParams.set("priority", priorityFilter);
  if (categoryFilter) queryParams.set("categoryId", categoryFilter);
  if (searchQuery) queryParams.set("search", searchQuery);
  const queryString = queryParams.toString();
  const tasksUrl = queryString ? `/api/strategic/tasks?${queryString}` : "/api/strategic/tasks";

  const { data: tasksData, isLoading: tasksLoading } = useQuery<TasksResponse>({
    queryKey: [tasksUrl],
  });
  const tasks = tasksData?.tasks || [];

  const form = useForm<InsertStrategicTask>({
    resolver: zodResolver(insertStrategicTaskSchema),
    defaultValues: {
      taskNumber: 1,
      title: "",
      titleRu: "",
      description: "",
      categoryId: undefined,
      priority: "medium",
      status: "planned",
      phase: "",
      targetModule: "",
      startDate: "",
      targetDate: "",
      estimatedHours: undefined,
      isAutomatable: false,
      industryAdaptable: true,
      progressPercent: 0,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertStrategicTask) =>
      apiRequest("POST", "/api/strategic/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategic/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/strategic/dashboard"] });
      toast({ title: "Vazifa yaratildi", description: "Yangi strategik vazifa muvaffaqiyatli qo'shildi" });
      setIsTaskDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Vazifa yaratilmadi", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) =>
      apiRequest("POST", "/api/strategic/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategic/categories"] });
      toast({ title: "Kategoriya yaratildi" });
      setIsCategoryDialogOpen(false);
      setCategoryName("");
      setCategoryCode("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Kategoriya yaratilmadi", variant: "destructive" });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/strategic/seed", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategic/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/strategic/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/strategic/dashboard"] });
      toast({ title: "Ma'lumotlar yuklandi", description: "Boshlang'ich kategoriyalar muvaffaqiyatli yaratildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Ma'lumotlar yuklanmadi", variant: "destructive" });
    },
  });

  const inProgressCount =
    (dashboard?.byStatus?.in_progress || 0) + (dashboard?.byStatus?.testing || 0);

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="ep-h1" data-testid="text-page-title">
            {t("strategikRejalashtirish")}
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">
            Стратегическое планирование — 721 tashabbusdan {dashboard?.completedCount || 0} ta bajarildi
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <CategoryDialog
            open={isCategoryDialogOpen}
            onOpenChange={setIsCategoryDialogOpen}
            categoryName={categoryName}
            categoryCode={categoryCode}
            onNameChange={setCategoryName}
            onCodeChange={setCategoryCode}
            onSave={() => createCategoryMutation.mutate({ name: categoryName, code: categoryCode })}
            isPending={createCategoryMutation.isPending}
          />
          <TaskDialog
            open={isTaskDialogOpen}
            onOpenChange={setIsTaskDialogOpen}
            form={form}
            categories={categories}
            onSubmit={(data) => createTaskMutation.mutate(data)}
            isPending={createTaskMutation.isPending}
          />
        </div>
      </div>

      {categories.length === 0 && !dashLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
            <Database className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">{t("boshlangichMalumotlarTopilmadi")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("strategikKategoriyalarniYuklashUchunQuyidagi")}
              </p>
            </div>
            <Button
              data-testid="button-seed-data"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              <Database className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? "Yuklanmoqda..." : "Boshlang'ich ma'lumotlarni yuklash"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("jamiVazifalar")}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-tasks">
                  {dashboard?.totalTasks || 0}
                </div>
                <Progress value={dashboard?.completionRate || 0} className="h-2 mt-2" data-testid="progress-total" />
                <p className="text-xs text-muted-foreground mt-1">{dashboard?.completionRate || 0}% bajarildi</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("bajarilgan")}</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-[var(--ep-green)]" />
          </CardHeader>
          <CardContent>
            {dashLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <div className="text-2xl font-bold text-[var(--ep-green)]" data-testid="text-completed-tasks">
                {dashboard?.completedCount || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("inProgress")}</CardTitle>
            <Clock className="h-5 w-5 text-[var(--ep-blue)]" />
          </CardHeader>
          <CardContent>
            {dashLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <div className="text-2xl font-bold text-[var(--ep-blue)]" data-testid="text-inprogress-tasks">
                {inProgressCount}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("muddatiOtgan")}</CardTitle>
            <AlertTriangle className="h-5 w-5 text-[var(--ep-red)]" />
          </CardHeader>
          <CardContent>
            {dashLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
              <div className="text-2xl font-bold text-[var(--ep-red)]" data-testid="text-overdue-tasks">
                {dashboard?.overdueCount || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                className="pl-9"
                placeholder={t("Qidirish...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
              <SelectTrigger className="w-full sm:w-[160px] h-9" data-testid="select-filter-status">
                <SelectValue placeholder={t("status28")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Barchasi")}</SelectItem>
                {(Array.isArray(STATUS_OPTIONS) ? STATUS_OPTIONS : []).map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val === "all" ? "" : val)}>
              <SelectTrigger className="w-full sm:w-[160px] h-9" data-testid="select-filter-priority">
                <SelectValue placeholder={t("priority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Barchasi")}</SelectItem>
                {(Array.isArray(PRIORITY_OPTIONS) ? PRIORITY_OPTIONS : []).map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val === "all" ? "" : val)}>
              <SelectTrigger className="w-full sm:w-[200px] h-9" data-testid="select-filter-category">
                <SelectValue placeholder={t("category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Barchasi")}</SelectItem>
                {(Array.isArray(categories) ? categories : []).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <TasksTable
            tasks={tasks}
            isLoading={tasksLoading}
            expandedTaskId={expandedTaskId}
            onToggleExpand={(id) => setExpandedTaskId(expandedTaskId === id ? null : id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
