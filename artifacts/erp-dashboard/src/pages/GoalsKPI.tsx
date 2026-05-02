import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema, type Goal, type InsertGoal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, TrendingUp, Users, Activity, Edit, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useUndoDelete } from "@/components/undo-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";

const CATEGORIES = [
  { value: "learning", label: "O'quv (ta'lim olish)" },
  { value: "completion", label: "Tugatish (kurslarni yakunlash)" },
  { value: "engagement", label: "Faollik (ishtirok darajasi)" },
  { value: "performance", label: "Natija (ish samaradorligi)" },
  { value: "retention", label: "Saqlab qolish (xodimlarni ushlab turish)" },
];

const TARGET_TYPES = [
  { value: "global", label: "Umumiy" },
  { value: "department", label: "Bo'lim" },
  { value: "position", label: "Lavozim" },
  { value: "user", label: "Xodim" },
];

const PRIORITIES = [
  { value: "low", label: "Past", color: "bg-blue-500" },
  { value: "medium", label: "O'rta", color: "bg-yellow-500" },
  { value: "high", label: "Yuqori", color: "bg-orange-500" },
  { value: "critical", label: "Juda muhim", color: "bg-red-500" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Faol", color: "bg-green-500" },
  { value: "completed", label: "Bajarildi", color: "bg-blue-500" },
  { value: "failed", label: "Bajarilmadi", color: "bg-red-500" },
  { value: "cancelled", label: "Bekor qilindi", color: "bg-gray-500" },
];

export default function GoalsKPI() {
  const { toast } = useToast();
  const { showUndoToast } = useUndoDelete();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const { data: goals = [], isLoading, isError, refetch} = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: departments = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/departments"],
  });

  const { data: positions = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/positions"],
  });

  const { data: employeesResponse } = useQuery<{ data: Array<{ id: string; fullName: string }> }>({
    queryKey: ["/api/employees"],
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
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return res.json();
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
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return res.json();
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
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
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

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority)?.color || "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || "bg-gray-500";
  };

  const activeGoals = (Array.isArray(goals) ? goals : []).filter(g => g.status === "active");
  const completedGoals = (Array.isArray(goals) ? goals : []).filter(g => g.status === "completed");

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Maqsad va <span className="font-bold text-primary">KPI</span>
          </h1>
          <p className="text-on-surface-variant mt-2">O'quv maqsadlarini boshqarish va kuzatish</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-goal" onClick={() => { setEditingGoal(null); form.reset(); }}>
              <Plus className="h-5 w-5 mr-2" />
              Maqsad qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Maqsadni tahrirlash" : "Yangi maqsad"}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sarlavha</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-goal-title" placeholder="Maqsad sarlavhasi" />
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
                        <Textarea {...field} value={field.value || ""} placeholder="Maqsad haqida batafsil" rows={3} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategoriya</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-goal-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qo'llaniladi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-target-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(TARGET_TYPES) ? TARGET_TYPES : []).map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("targetType") !== "global" && (
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch("targetType") === "department" && "Bo'lim"}
                          {form.watch("targetType") === "position" && "Lavozim"}
                          {form.watch("targetType") === "user" && "Xodim"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-target-id">
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch("targetType") === "department" && (Array.isArray(departments) ? departments : []).map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                            {form.watch("targetType") === "position" && (Array.isArray(positions) ? positions : []).map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                            {form.watch("targetType") === "user" && (Array.isArray(employees) ? employees : []).map((e) => (
                              <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="metric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metrika</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="completion_rate, average_score, active_users" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maqsad qiymati (%)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boshlanish sanasi</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date" 
                            min={new Date().toISOString().split('T')[0]}
                            max="2099-12-31"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tugash sanasi</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date" 
                            min={form.watch('startDate') || new Date().toISOString().split('T')[0]}
                            max="2099-12-31"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Muhimlik</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(PRIORITIES) ? PRIORITIES : []).map(p => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
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
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(STATUS_OPTIONS) ? STATUS_OPTIONS : []).map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" data-testid="button-save-goal">
                    {editingGoal ? "Yangilash" : "Saqlash"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jami Maqsadlar</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{goals.length}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Faol</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{activeGoals.length}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Bajarilgan</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{completedGoals.length}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">O'rtacha Progress</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">
            {goals.length > 0 
              ? Math.round((Array.isArray(goals) ? goals : []).reduce((acc, g) => acc + getProgressPercentage(g.currentValue, g.targetValue), 0) / goals.length)
              : 0}%
          </p>
        </div>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <p className="text-muted-foreground col-span-2">Yuklanmoqda...</p>
        ) : goals.length === 0 ? (
          <p className="text-muted-foreground col-span-2">Hozircha maqsadlar yo'q</p>
        ) : (
          (Array.isArray(goals) ? goals : []).map(goal => {
            const progress = getProgressPercentage(goal.currentValue, goal.targetValue);
            
            return (
              <div key={goal.id} className="bg-surface-container-lowest rounded-xl p-6" data-testid={`card-goal-${goal.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-on-surface">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-on-surface-variant mt-1">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          aria-label="Tahrirlash"
                          onClick={() => handleEdit(goal)}
                          data-testid={`button-edit-goal-${goal.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Tahrirlash</TooltipContent>
                    </Tooltip>
                    <DeleteConfirmDialog
                      title="Maqsadni o'chirishni tasdiqlaysizmi?"
                      description="Maqsad va unga bog'liq barcha ma'lumotlar o'chiriladi."
                      onConfirm={() => handleDelete(goal.id)}
                      isPending={deleteMutation.isPending}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <Badge className={getStatusColor(goal.status)}>
                    {(STATUS_OPTIONS ?? []).find(s => s.value === goal.status)?.label}
                  </Badge>
                  <Badge className={getPriorityColor(goal.priority)}>
                    {(PRIORITIES ?? []).find(p => p.value === goal.priority)?.label}
                  </Badge>
                  <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {(CATEGORIES ?? []).find(c => c.value === goal.category)?.label}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2 text-on-surface">
                      <span>Progress</span>
                      <span className="font-semibold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", 
                          progress < 50 ? "bg-red-500" : (progress >= 50 && progress < 80) ? "bg-amber-500" : "bg-green-500"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                      <span>Hozirgi: {goal.currentValue}</span>
                      <span>Maqsad: {goal.targetValue}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-on-surface-variant">Metrika:</span>
                      <p className="font-medium text-on-surface">{goal.metric}</p>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Muddat:</span>
                      <p className="font-medium text-on-surface">{goal.startDate} - {goal.endDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
