/**
 * @module MonthlyPlansPage
 * @description Director monthly plans: list + create + complete.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Calendar } from "lucide-react";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

interface MonthlyPlan {
  id: number;
  month: string;
  strategic_goal_id?: number | null;
  completion_pct?: number | null;
  created_at?: string;
}

export default function MonthlyPlansPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [month, setMonth] = useState("");
  const [goalId, setGoalId] = useState("");

  const { data, isLoading } = useQuery<{ data: MonthlyPlan[] }>({
    queryKey: ["/api/director/monthly-plans"],
  });
  const plans = Array.isArray(data?.data) ? data.data : [];

  const createMutation = useMutation({
    mutationFn: (payload: { month: string; strategic_goal_id?: number }) =>
      apiRequest("POST", "/api/director/monthly-plans", {
        month: payload.month,
        strategic_goal_id: payload.strategic_goal_id ?? null,
        objectives: [],
        weekly_tasks: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/director/monthly-plans"] });
      setIsDialogOpen(false);
      setMonth(""); setGoalId("");
      toast({ title: "Oylik reja qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/director/monthly-plans/${id}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/director/monthly-plans"] });
      toast({ title: "Bajarilish qayta hisoblandi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const handleCreate = () => {
    if (!month.trim() || !/^\d{4}-\d{2}$/.test(month.trim())) {
      toast({ title: "YYYY-MM formatda oy kiriting", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      month: month.trim(),
      strategic_goal_id: goalId ? Number(goalId) : undefined,
    });
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 space-y-6">
      <EPPageHeader
        icon={<Calendar className="h-5 w-5" />}
        title={t("oylikRejalar", "Oylik rejalar")}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-monthly-plan">
            <Plus className="h-4 w-4 mr-2" />
            {t("qoshish", "Qo'shish")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : plans.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("rejalTopilmadi", "Oylik rejalar topilmadi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("oy", "Oy")}</TableHead>
                    <TableHead>{t("strategikMaqsad", "Strategik maqsad")}</TableHead>
                    <TableHead>{t("bajarilish", "Bajarilish")}</TableHead>
                    <TableHead>{t("yaratilgan", "Yaratilgan")}</TableHead>
                    <TableHead>{t("amallar", "Amallar")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} data-testid={`row-plan-${plan.id}`}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{plan.month}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {plan.strategic_goal_id ? `#${plan.strategic_goal_id}` : "—"}
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <Progress value={Number(plan.completion_pct) || 0} className="h-2 flex-1" />
                          <span className="text-xs w-10 text-right">
                            {Number(plan.completion_pct || 0).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {plan.created_at
                          ? new Date(plan.created_at).toLocaleDateString("uz-UZ")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeMutation.mutate(plan.id)}
                          disabled={completeMutation.isPending}
                          data-testid={`button-complete-plan-${plan.id}`}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {t("qaytaHisob", "Qayta hisob")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {t("yangiOylikReja", "Yangi oylik reja")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("oy", "Oy")} (YYYY-MM) *</Label>
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="2026-07"
                data-testid="input-plan-month"
              />
            </div>
            <div>
              <Label>{t("strategikMaqsadId", "Strategik maqsad ID (ixtiyoriy)")}</Label>
              <Input
                type="number"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                placeholder="1"
                data-testid="input-plan-goal-id"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {t("Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
