import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStrategicTaskSchema } from "@shared/schema";
import type { StrategicTask, StrategicCategory, InsertStrategicTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  FolderPlus,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

const STATUS_OPTIONS = [
  { value: "planned", label: "Rejalashtirilgan", labelRu: "Запланировано", color: "bg-slate-500/20 text-on-surface-variant dark:text-on-surface-variant" },
  { value: "in_progress", label: "Jarayonda", labelRu: "В процессе", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
  { value: "testing", label: "Sinovda", labelRu: "Тестирование", color: "bg-purple-500/20 text-purple-600 dark:text-purple-400" },
  { value: "completed", label: "Bajarildi", labelRu: "Завершено", color: "bg-green-500/20 text-green-600 dark:text-green-400" },
  { value: "on_hold", label: "Kutilmoqda", labelRu: "На паузе", color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
  { value: "cancelled", label: "Bekor qilingan", labelRu: "Отменено", color: "bg-red-500/20 text-red-600 dark:text-red-400" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Past", labelRu: "Низкий", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
  { value: "medium", label: "O'rta", labelRu: "Средний", color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
  { value: "high", label: "Yuqori", labelRu: "Высокий", color: "bg-orange-500/20 text-orange-600 dark:text-orange-400" },
  { value: "critical", label: "Kritik", labelRu: "Критический", color: "bg-red-500/20 text-red-600 dark:text-red-400" },
];

type TaskWithCategory = StrategicTask & {
  categoryName?: string | null;
  categoryCode?: string | null;
  categoryColor?: string | null;
};

type DashboardData = {
  totalTasks: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byPhase: Record<string, number>;
  completedCount: number;
  completionRate: number;
  overdueCount: number;
};

type CategoriesResponse = {
  count: number;
  categories: StrategicCategory[];
};

type TasksResponse = {
  count: number;
  tasks: TaskWithCategory[];
};

export default function StrategicTasksPanel() {
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

  const { data: dashboard, isLoading: dashLoading, isError, refetch} = useQuery<DashboardData>({
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
    mutationFn: async (data: InsertStrategicTask) => {
      return apiRequest("POST", "/api/strategic/tasks", data);
    },
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
    mutationFn: async (data: { name: string; code: string }) => {
      return apiRequest("POST", "/api/strategic/categories", data);
    },
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
    mutationFn: async () => {
      return apiRequest("POST", "/api/strategic/seed", {});
    },
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

  const onSubmitTask = (data: InsertStrategicTask) => {
    createTaskMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find((s) => s.value === status);
    return opt ? <Badge className={opt.color}>{opt.label}</Badge> : <Badge>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const opt = PRIORITY_OPTIONS.find((p) => p.value === priority);
    return opt ? <Badge className={opt.color}>{opt.label}</Badge> : <Badge>{priority}</Badge>;
  };

  const inProgressCount = (dashboard?.byStatus?.in_progress || 0) + (dashboard?.byStatus?.testing || 0);

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Strategik Rejalashtirish
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">
            Стратегическое планирование — 721 tashabbusdan {dashboard?.completedCount || 0} ta bajarildi
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-category">
                <FolderPlus className="h-4 w-4 mr-2" />
                Kategoriya qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi kategoriya</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nomi</label>
                  <Input
                    data-testid="input-category-name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Kategoriya nomi"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Kod</label>
                  <Input
                    data-testid="input-category-code"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    placeholder="kategoriya_kodi"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button
                    data-testid="button-save-category"
                    onClick={() => createCategoryMutation.mutate({ name: categoryName, code: categoryCode })}
                    disabled={!categoryName || !categoryCode || createCategoryMutation.isPending}
                  >
                    Saqlash
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-task" onClick={() => form.reset()}>
                <Plus className="h-4 w-4 mr-2" />
                Vazifa qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yangi strategik vazifa</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitTask)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taskNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vazifa raqami</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-task-number"
                              type="number"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategoriya</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-category">
                                <SelectValue placeholder="Tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Array.isArray(categories) ? categories : []).map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sarlavha (UZ)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-task-title" placeholder="Vazifa sarlavhasi" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="titleRu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sarlavha (RU)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-task-title-ru" placeholder="Название задачи" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tavsif</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} data-testid="input-task-description" placeholder="Batafsil tavsif" rows={3} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Muhimlik</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-priority">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Array.isArray(PRIORITY_OPTIONS) ? PRIORITY_OPTIONS : []).map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                  {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Holat</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Array.isArray(STATUS_OPTIONS) ? STATUS_OPTIONS : []).map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bosqich</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-task-phase" placeholder="Masalan: Q1, Q2" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetModule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maqsadli modul</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-task-module" placeholder="Masalan: HR, CRM" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Boshlanish sanasi</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} type="date" data-testid="input-task-start-date" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maqsad sanasi</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} type="date" data-testid="input-task-target-date" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxminiy soatlar</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="number"
                            data-testid="input-task-hours"
                            placeholder="0"
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isAutomatable"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              data-testid="checkbox-automatable"
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Avtomatlashtirilishi mumkin</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industryAdaptable"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              data-testid="checkbox-industry-adaptable"
                              checked={field.value ?? true}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Sanoatga moslashuvchan</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                      Bekor qilish
                    </Button>
                    <Button type="submit" data-testid="button-save-task" disabled={createTaskMutation.isPending}>
                      {createTaskMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {categories.length === 0 && !dashLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
            <Database className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Boshlang'ich ma'lumotlar topilmadi</h3>
              <p className="text-muted-foreground text-sm">
                Strategik kategoriyalarni yuklash uchun quyidagi tugmani bosing
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
            <CardTitle className="text-sm font-medium">Jami vazifalar</CardTitle>
            <Target className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-tasks">
                  {dashboard?.totalTasks || 0}
                </div>
                <Progress
                  value={dashboard?.completionRate || 0}
                  className="h-2 mt-2"
                  data-testid="progress-total"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard?.completionRate || 0}% bajarildi
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bajarilgan</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {dashLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600" data-testid="text-completed-tasks">
                {dashboard?.completedCount || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jarayonda</CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {dashLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-blue-600" data-testid="text-inprogress-tasks">
                {inProgressCount}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Muddati o'tgan</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            {dashLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600" data-testid="text-overdue-tasks">
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
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-status">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {(Array.isArray(STATUS_OPTIONS) ? STATUS_OPTIONS : []).map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-priority">
                <SelectValue placeholder="Muhimlik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {(Array.isArray(PRIORITY_OPTIONS) ? PRIORITY_OPTIONS : []).map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-category">
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {(Array.isArray(categories) ? categories : []).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {tasksLoading ? (
            <div className="p-6 space-y-3">
              {([1, 2, 3, 4, 5]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground" data-testid="text-no-tasks">
              Vazifalar topilmadi
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Sarlavha</TableHead>
                  <TableHead className="hidden md:table-cell">Kategoriya</TableHead>
                  <TableHead>Muhimlik</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="hidden lg:table-cell w-[120px]">Progress</TableHead>
                  <TableHead className="hidden lg:table-cell">Maqsad sanasi</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(tasks) ? tasks : []).map((task) => (
                  <>
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover-elevate"
                      data-testid={`row-task-${task.id}`}
                      onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    >
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {task.taskNumber}
                      </TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {task.categoryName && (
                          <Badge variant="outline" style={task.categoryColor ? { borderColor: task.categoryColor, color: task.categoryColor } : undefined}>
                            {task.categoryName}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Progress value={task.progressPercent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{task.progressPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {task.targetDate || "—"}
                      </TableCell>
                      <TableCell>
                        {expandedTaskId === task.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedTaskId === task.id && (
                      <TableRow key={`${task.id}-details`}>
                        <TableCell colSpan={8} className="bg-muted/30">
                          <div className="p-4 space-y-3">
                            {task.titleRu && (
                              <div>
                                <span className="text-xs text-muted-foreground">Название (RU):</span>
                                <p className="text-sm">{task.titleRu}</p>
                              </div>
                            )}
                            {task.description && (
                              <div>
                                <span className="text-xs text-muted-foreground">Tavsif:</span>
                                <p className="text-sm">{task.description}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {task.phase && (
                                <div>
                                  <span className="text-xs text-muted-foreground">Bosqich:</span>
                                  <p>{task.phase}</p>
                                </div>
                              )}
                              {task.targetModule && (
                                <div>
                                  <span className="text-xs text-muted-foreground">Modul:</span>
                                  <p>{task.targetModule}</p>
                                </div>
                              )}
                              {task.startDate && (
                                <div>
                                  <span className="text-xs text-muted-foreground">Boshlanish:</span>
                                  <p>{task.startDate}</p>
                                </div>
                              )}
                              {task.estimatedHours && (
                                <div>
                                  <span className="text-xs text-muted-foreground">Taxminiy soatlar:</span>
                                  <p>{task.estimatedHours} soat</p>
                                </div>
                              )}
                              <div>
                                <span className="text-xs text-muted-foreground">Avtomatlashtirish:</span>
                                <p>{task.isAutomatable ? "Ha" : "Yo'q"}</p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Sanoatga mos:</span>
                                <p>{task.industryAdaptable ? "Ha" : "Yo'q"}</p>
                              </div>
                            </div>
                            {task.notes && (
                              <div>
                                <span className="text-xs text-muted-foreground">Izohlar:</span>
                                <p className="text-sm">{task.notes}</p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
