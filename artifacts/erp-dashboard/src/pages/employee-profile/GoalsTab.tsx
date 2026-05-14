/**
 * @module GoalsTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Target, CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TranslationFn } from "./profile-types";
import { EPStatusPill } from "@/components/ep";

interface Goal {
  id: number;
  title: string;
  description: string | null;
  targetDate: string | null;
  targetValue: number | null;
  currentValue: number | null;
  progress: number;
  status: "draft" | "active" | "completed" | "cancelled";
  createdAt: string;
}

interface GoalsTabProps {
  userId: number;
  tCommon: TranslationFn;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Qoralama", variant: "outline" },
  active: { label: "Faol", variant: "default" },
  completed: { label: "Bajarildi", variant: "secondary" },
  cancelled: { label: "Bekor qilindi", variant: "destructive" },
};

const EMPTY_FORM = {
  title: "",
  description: "",
  target_date: "",
  target_value: "",
};

export function GoalsTab({ userId, tCommon }: GoalsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: [`/api/hr/employees/${userId}/goals`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/hr/employees/${userId}/goals`);
      if (res.status === 404 || res.status === 204) return [];
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : data.goals ?? [];
    },
    enabled: !!userId,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (payload: typeof EMPTY_FORM) =>
      apiRequest("POST", `/api/hr/employees/${userId}/goals`, {
        ...payload,
        target_value: payload.target_value ? parseFloat(payload.target_value) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hr/employees/${userId}/goals`] });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const list = goals ?? [];
  const totalGoals = list.length;
  const completedGoals = list.filter((g) => g.status === "completed").length;
  const inProgressGoals = list.filter((g) => g.status === "active").length;
  const overdueGoals = list.filter(
    (g) =>
      g.status === "active" &&
      g.targetDate &&
      new Date(g.targetDate) < new Date()
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jami maqsadlar</p>
                <p className="text-3xl font-bold text-[var(--ep-blue)]">{totalGoals}</p>
              </div>
              <Target className="h-8 w-8 text-[var(--ep-blue)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bajarilgan</p>
                <p className="text-3xl font-bold text-[var(--ep-green)]">{completedGoals}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-[var(--ep-green)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jarayonda</p>
                <p className="text-3xl font-bold text-[var(--ep-yellow)]">{inProgressGoals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[var(--ep-yellow)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Muddati o'tgan</p>
                <p className="text-3xl font-bold text-[var(--ep-red)]">{overdueGoals}</p>
              </div>
              <Calendar className="h-8 w-8 text-[var(--ep-red)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Maqsadlar va OKR
              </CardTitle>
              <CardDescription>Xodimning shaxsiy va professional maqsadlari</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              Maqsad qo'shish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Target className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Maqsadlar belgilanmagan</p>
              <p className="text-sm opacity-60 mt-1 mb-4">
                Xodim uchun birinchi maqsadni qo'shing
              </p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                Maqsad qo'shish
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {list.map((goal) => {
                const statusCfg = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.draft;
                const isOverdue =
                  goal.status === "active" &&
                  goal.targetDate &&
                  new Date(goal.targetDate) < new Date();
                const progressValue = Math.min(Math.max((goal as Record<string, unknown>).progress_pct as number ?? goal.progress ?? 0, 0), 100);

                return (
                  <div
                    key={goal.id}
                    className="border rounded-lg p-4 space-y-3"
                    data-testid={`goal-item-${goal.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{goal.title}</h4>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isOverdue && (
                          <EPStatusPill tone="danger" className="text-xs">
                            Muddati o'tgan
                          </EPStatusPill>
                        )}
                        <Badge variant={statusCfg.variant} className="text-xs">
                          {statusCfg.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Taraqqiyot</span>
                        <span className="font-medium">{progressValue}%</span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                    </div>

                    {goal.targetDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Maqsad sana: {new Date(goal.targetDate).toLocaleDateString("uz-UZ")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Yangi maqsad qo'shish
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="goal-title">Maqsad nomi *</Label>
              <Input
                id="goal-title"
                placeholder="Masalan: Mahsuldorlikni 20% oshirish"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-description">Tavsif</Label>
              <Textarea
                id="goal-description"
                placeholder="Maqsad haqida qo'shimcha ma'lumot..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="goal-target-date">Maqsad sana</Label>
                <Input
                  id="goal-target-date"
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-target-value">Maqsad qiymati</Label>
                <Input
                  id="goal-target-value"
                  type="number"
                  placeholder="Masalan: 100"
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setForm(EMPTY_FORM);
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={() => createGoalMutation.mutate(form)}
              disabled={!form.title.trim() || createGoalMutation.isPending}
            >
              {createGoalMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
