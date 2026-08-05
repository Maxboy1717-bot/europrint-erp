/**
 * OwnerSummaryCard — item #101: T21-B1 owner daily digest (holat + 5 real
 * SD/CRM numbers) was fully built server-side but had zero FE consumer —
 * only reachable via a daily cron (in-process) or manual curl/Swagger.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Megaphone } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { OwnerSummary } from "./types";

export function OwnerSummaryCard() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const { data, isLoading } = useQuery<OwnerSummary>({
    queryKey: ["/api/director/owner-summary"],
    refetchInterval: 300_000,
  });

  const sendMutation = useMutation({
    mutationFn: () => apiRequest<OwnerSummary>("POST", "/api/director/owner-summary/send", {}),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/director/owner-summary"] });
      toast({
        title: result?.telegram?.sent
          ? t("ownerSummarySent")
          : t("ownerSummaryNotSent"),
      });
    },
    onError: () => toast({ title: t("xatolik"), variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <Card data-testid="card-owner-summary">
        <CardContent className="pt-4">
          <Skeleton className="h-32 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const n = data?.numbers;
  const holat = data?.holat;

  return (
    <Card data-testid="card-owner-summary">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          <CardTitle className="text-base font-semibold">{t("ownerSummaryTitle")}</CardTitle>
          {holat && (
            <Badge variant="secondary" className="text-[10px]">
              {holat.emoji} {holat.label} · {holat.score}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => sendMutation.mutate()}
          disabled={sendMutation.isPending}
          data-testid="button-send-owner-summary"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" /> {t("ownerSummarySendNow")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">{t("ownerSummaryNewCustomers")}</div>
            <div className="text-lg font-bold">{n?.newCustomers ?? 0}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("ownerSummaryLostCustomers")}</div>
            <div className="text-lg font-bold text-[var(--ep-red)]">{n?.lostCustomers ?? 0}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("ownerSummarySmallCustomers")}</div>
            <div className="text-lg font-bold">{n?.smallCustomers ?? 0}</div>
          </div>
        </div>
        <div className="text-sm">
          <span className="text-xs text-muted-foreground">{t("ownerSummarySalesTrend")}: </span>
          {n?.salesTrend.deltaPct == null ? (
            <span className="text-muted-foreground">{t("ownerSummaryNotEnoughData")}</span>
          ) : (
            <span className={n.salesTrend.deltaPct >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}>
              {n.salesTrend.deltaPct >= 0 ? "+" : ""}
              {n.salesTrend.deltaPct}%
            </span>
          )}
        </div>
        {n?.topRisk && (
          <div className="text-sm">
            <span className="text-xs text-muted-foreground">{t("ownerSummaryTopRisk")}: </span>
            {n.topRisk.customerName ?? `#${n.topRisk.customerId}`} — churn {n.topRisk.churnRiskPct ?? 0}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}
