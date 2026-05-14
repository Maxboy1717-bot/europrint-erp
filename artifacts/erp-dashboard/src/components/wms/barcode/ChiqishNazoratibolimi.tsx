/**
 * @module ChiqishNazoratibolimi
 * @description React UI component.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { ExitLog } from "./types";
import { alertRangi, alertNomi, sanaTartiblash } from "./helpers";
import { useTranslation } from '@/lib/i18n';

export function ChiqishNazoratibolimi() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const { data: chiqishlar, isLoading } = useQuery<ExitLog[]>({
    queryKey: ["/api/barcode-warehouse/exit-logs"],
  });

  const notifyMutation = useMutation({
    mutationFn: async (logId: string | number) => {
      const res = await apiRequest("POST", `/api/barcode-warehouse/exit/${logId}/notify-security`);
      return res;
    },
    onSuccess: () => {
      toast({ title: "Xabar yuborildi", description: "Xavfsizlik xizmati ogohlantirildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/exit-logs"] });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-lg" />;

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Chiqish nazorati (AI Kamera)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {!chiqishlar || chiqishlar.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("chiqishQaydlariYoq")}</p>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(chiqishlar) ? chiqishlar : []).slice(0, 5).map((log: ExitLog) => (
              <div key={log.id} className="border rounded-md p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{log.personName || "Noma'lum shaxs"}</div>
                    <div className="text-[10px] text-muted-foreground">{sanaTartiblash(log.exitTime)}</div>
                  </div>
                  <Badge className={alertRangi(log.alertLevel || "NONE")}>
                    {alertNomi(log.alertLevel || "NONE")}
                  </Badge>
                </div>
                {!log.exitAllowed && !log.securityNotified && (
                  <Button
                    data-testid={`button-notify-security-${log.id}`}
                    size="sm"
                    variant="destructive"
                    className="w-full mt-2"
                    onClick={() => notifyMutation.mutate(log.id)}
                    disabled={notifyMutation.isPending}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {t("xavfsizlikniChaqirish")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
