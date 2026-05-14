/**
 * @module RushOrderPage
 * @description React page component. Route-level UI.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, AlertTriangle, Calendar, ArrowUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RushOrder {
  orderId: number;
  orderNumber: string;
  customerName: string;
  requestedDate: string;
  standardLeadDays: number;
  rushLeadDays: number;
  rushSurchargePct: number;
  feasibilityScore: number;
  status: "pending_approval" | "approved" | "rejected";
}

const FEASIBILITY_HIGH = 70;
const FEASIBILITY_LOW = 40;

export default function RushOrderPage() {
  const { t } = useTranslation('ai');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ items: RushOrder[] }>({
    queryKey: ["/api/ai/rush-orders"],
    queryFn: () => apiRequest("GET", "/api/ai/rush-orders"),
  });

  const approveMutation = useMutation({
    mutationFn: (orderId: number) => apiRequest("POST", `/api/ai/rush-orders/${orderId}/approve`),
    onSuccess: () => {
      toast({ title: t('rushOrder.approved', "Rush order tasdiqlandi") });
      void qc.invalidateQueries({ queryKey: ["/api/ai/rush-orders"] });
    },
    onError: (err: Error) => {
      toast({ title: t('rushOrder.failed', "Xato"), description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (orderId: number) => apiRequest("POST", `/api/ai/rush-orders/${orderId}/reject`),
    onSuccess: () => {
      toast({ title: t('rushOrder.rejected', "Rush order rad etildi") });
      void qc.invalidateQueries({ queryKey: ["/api/ai/rush-orders"] });
    },
    onError: (err: Error) => {
      toast({ title: t('rushOrder.failed', "Xato"), description: err.message, variant: "destructive" });
    },
  });

  const items = selectArray<RushOrder>(data, "items");
  const pending = items.filter((r) => r.status === "pending_approval").length;
  const approved = items.filter((r) => r.status === "approved").length;
  const avgSurcharge = items.length > 0
    ? Math.round(items.reduce((s, r) => s + r.rushSurchargePct, 0) / items.length)
    : 0;

  return (
    <DedicatedPageShell
      title={t('rushOrder.title', "Rush Order Boshqaruvi")}
      description={t('rushOrder.description', "Tezkor buyurtmalar — AI feasibility scoring + qo'shimcha to'lov")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('rushOrder.total', "Jami")} value={items.length} icon={<Zap className="h-4 w-4" />} />
        <KpiCard label={t('rushOrder.pending', "Tasdiqni kutmoqda")} value={pending} icon={<AlertTriangle className="h-4 w-4" />} variant={pending > 0 ? "warning" : "default"} />
        <KpiCard label={t('rushOrder.approved', "Tasdiqlangan")} value={approved} icon={<Calendar className="h-4 w-4" />} variant="success" />
        <KpiCard label={t('rushOrder.avgSurcharge', "O'rtacha surcharge")} value={`${avgSurcharge}%`} icon={<ArrowUp className="h-4 w-4" />} variant="default" />
      </div>

      <Section title={t('rushOrder.list', "Rush buyurtmalar")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('rushOrder.empty', "Rush buyurtma yo'q")}</p>
        ) : (
          <div className="space-y-2">
            {items.map((r) => (
              <div key={r.orderId} className="border rounded-md p-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{r.orderNumber}</span>
                    <span className="text-sm text-muted-foreground">— {r.customerName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span>{t("talab")}<strong>{r.requestedDate}</strong></span>
                    <span>{t("standart1")}<strong>{r.standardLeadDays} kun</strong></span>
                    <span>{t("tezkor")}<strong>{r.rushLeadDays} kun</strong></span>
                    <span>{t("surcharge")}<strong>+{r.rushSurchargePct}%</strong></span>
                  </div>
                  <Badge variant="outline" className={
                    `mt-2 text-xs ${
                      r.feasibilityScore >= FEASIBILITY_HIGH ? "text-[var(--ep-green)]" :
                      r.feasibilityScore >= FEASIBILITY_LOW ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"
                    }`
                  }>
                    Feasibility: {r.feasibilityScore}/100
                  </Badge>
                </div>
                {r.status === "pending_approval" ? (
                  <div className="flex flex-col gap-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" disabled={approveMutation.isPending}>
                          {t('rushOrder.approve', "Tasdiqlash")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('rushOrder.confirmApprove', "Tasdiqlashni tasdiqlang")}</AlertDialogTitle>
                          <AlertDialogDescription>{t('rushOrder.confirmApproveDesc', "Rush buyurtma tasdiqlanadi va ishlab chiqarishga yuboriladi.")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('rushOrder.cancel', "Bekor qilish")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => approveMutation.mutate(r.orderId)}>
                            {t('rushOrder.approve', "Tasdiqlash")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={rejectMutation.isPending}>
                          {t('rushOrder.reject', "Rad etish")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('rushOrder.confirmReject', "Rad etishni tasdiqlang")}</AlertDialogTitle>
                          <AlertDialogDescription>{t('rushOrder.confirmRejectDesc', "Rush buyurtma rad etiladi.")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('rushOrder.cancel', "Bekor qilish")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => rejectMutation.mutate(r.orderId)}>
                            {t('rushOrder.reject', "Rad etish")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <Badge variant={r.status === "approved" ? "default" : "destructive"}>
                    {r.status === "approved" ? "✓" : "✗"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
