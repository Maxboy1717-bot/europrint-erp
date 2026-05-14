/**
 * @module OperatorQarzlariBolimi
 * @description React UI component.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { User, CheckCircle2, RotateCcw } from "lucide-react";
import { OperatorDebt } from "./types";
import { statusRangi, statusNomi } from "./helpers";

export function OperatorQarzlariBolimi() {
  const { toast } = useToast();

  const { data: qarzlar, isLoading } = useQuery<OperatorDebt[]>({
    queryKey: ["/api/barcode-warehouse/operator-debts"],
  });

  const halQilishMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNote }: { id: string | number; status: string; resolutionNote?: string }) => {
      const res = await apiRequest("PATCH", `/api/barcode-warehouse/debts/${id}`, { status, resolutionNote });
      return res;
    },
    onSuccess: () => {
      toast({ title: "Bajarildi", description: "Qarz holati yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/operator-debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/dashboard"] });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-lg" />;

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Operator qoldiqlari/qarzlari
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {!qarzlar || qarzlar.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Qarzlar yo'q</p>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(qarzlar) ? qarzlar : []).map((item: OperatorDebt) => (
              <div key={item.balance.id} className="border rounded-md p-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-sm">{item.operatorName}</span>
                    <div className="text-xs text-[var(--ep-red)] font-bold">
                      Qarz: {item.balance.qtyDebt} (BC: {item.barcodeCode})
                    </div>
                  </div>
                  <Badge className={statusRangi(item.balance.status || "")}>
                    {statusNomi(item.balance.status || "")}
                  </Badge>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button
                    data-testid={`button-debt-resolve-${item.balance.id}`}
                    size="sm"
                    className="flex-1"
                    onClick={() => halQilishMutation.mutate({ id: item.balance.id, status: "RESOLVED", resolutionNote: "Qaytarildi/Tushuntirildi" })}
                    disabled={halQilishMutation.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Yopish
                  </Button>
                  <Button
                    data-testid={`button-debt-deduct-${item.balance.id}`}
                    size="sm"
                    variant="destructive"
                    onClick={() => halQilishMutation.mutate({ id: item.balance.id, status: "DEDUCTED", resolutionNote: "Oylikdan ushlab qolish" })}
                    disabled={halQilishMutation.isPending}
                    className="flex-1"
                  >
                    Ushlab qolish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
