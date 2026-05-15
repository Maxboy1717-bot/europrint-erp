/**
 * @module WeeklyPlansPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Plus, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface WeeklyPlan {
  id: string;
  title: string;
  description?: string;
  weekDate?: string;
  status?: string;
  employeeName?: string;
  tasksTotal?: number;
  tasksCompleted?: number;
  approvedBy?: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  approved:    { label: "Tasdiqlangan",  icon: <CheckCircle className="h-3 w-3" />, variant: "default" },
  pending:     { label: "Kutilmoqda",    icon: <Clock       className="h-3 w-3" />, variant: "secondary" },
  rejected:    { label: "Rad etilgan",   icon: <AlertCircle className="h-3 w-3" />, variant: "destructive" },
  draft:       { label: "Qoralama",      icon: <Clock       className="h-3 w-3" />, variant: "outline" },
};

export default function WeeklyPlansPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: plansData, isLoading, isError, refetch } = useQuery<{ data?: WeeklyPlan[]; plans?: WeeklyPlan[] } | WeeklyPlan[]>({
    queryKey: ["/api/weekly-plans"],
  });

  const plans: WeeklyPlan[] = Array.isArray(plansData)
    ? plansData
    : (plansData as { data?: WeeklyPlan[]; plans?: WeeklyPlan[] })?.data
      ?? (plansData as { plans?: WeeklyPlan[] })?.plans
      ?? [];

  const createMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      return await apiRequest("POST", "/api/weekly-plans", { title, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-plans"] });
      toast({ title: "Haftalik reja yaratildi" });
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Reja yaratishda xatolik", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/weekly-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-plans"] });
      toast({ title: "Reja o'chirildi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Rejani o'chirishda xatolik", variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="hr"
      title={t("haftalikRejalar")}
      icon={<CalendarDays className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-plan">
          <Plus className="h-4 w-4 mr-2" />
          {t("rejaYaratish")}
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {([1, 2, 3]).map(i => (
            <Card key={`k-${i}`}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t("haftalikRejalarMavjudEmas")}</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("birinchiRejaniYarating")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => {
            const sc = statusConfig[plan.status ?? "draft"] ?? statusConfig.draft;
            return (
              <Card key={plan.id} className="hover:shadow-md transition-shadow" data-testid={`card-plan-${plan.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{plan.title}</CardTitle>
                      {plan.weekDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Hafta: {new Date(plan.weekDate).toLocaleDateString("uz-UZ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={sc.variant} className="gap-1 text-xs">
                        {sc.icon}
                        {sc.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(plan.id)}
                        data-testid={`button-delete-plan-${plan.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {(plan.description || plan.tasksTotal !== undefined) && (
                  <CardContent className="pt-0 space-y-2">
                    {plan.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                    )}
                    {plan.tasksTotal !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>{plan.tasksCompleted ?? 0} / {plan.tasksTotal} vazifa</span>
                      </div>
                    )}
                    {plan.employeeName && (
                      <p className="text-xs text-muted-foreground">Xodim: {plan.employeeName}</p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiHaftalikReja")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-title">{t("sarlavha")}</Label>
              <Input
                id="plan-title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={t("rejaSarlavhasi")}
                data-testid="input-plan-title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-desc">{t("progress.description")}</Label>
              <Textarea
                id="plan-desc"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder={t("rejaTavsifi")}
                rows={3}
                data-testid="input-plan-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => {
                if (!newTitle.trim()) return;
                createMutation.mutate({ title: newTitle.trim(), description: newDesc.trim() });
              }}
              disabled={!newTitle.trim() || createMutation.isPending}
              data-testid="button-confirm-create-plan"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-plan">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ochirishniTasdiqlash")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("haqiqatanHamBuRejaniOchirmoqchimisiz")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Bekor")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
              data-testid="button-confirm-delete-plan"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePage>
  );
}
