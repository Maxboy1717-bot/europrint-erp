import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";
import { PickingTask } from "./types";
import { statusRangi, statusNomi } from "./helpers";

export function PickingBolimi() {
  const { toast } = useToast();

  const { data: topshiriqlar, isLoading } = useQuery<PickingTask[]>({
    queryKey: ["/api/barcode-warehouse/picking-tasks"],
  });

  const pickMutation = useMutation({
    mutationFn: async (taskId: string | number) => {
      const res = await apiRequest("POST", `/api/barcode-warehouse/picking/${taskId}/complete`);
      return res;
    },
    onSuccess: () => {
      toast({ title: "Bajarildi", description: "Picking topshirig'i yakunlandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/picking-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/dashboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Picking topshiriqlari
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {!topshiriqlar || topshiriqlar.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Topshiriqlar yo'q</p>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(topshiriqlar) ? topshiriqlar : []).map((item: PickingTask) => (
              <div key={item.task.id} className="border rounded-md p-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-sm">{item.task.taskNumber}</span>
                    <div className="text-xs text-muted-foreground">
                      {item.materialName} | {item.task.pickedQty}/{item.task.requiredQty}
                    </div>
                  </div>
                  <Badge className={statusRangi(item.task.status || "")}>
                    {statusNomi(item.task.status || "")}
                  </Badge>
                </div>
                {item.task.status === "PENDING" && (
                  <Button
                    data-testid={`button-pick-complete-${item.task.id}`}
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => pickMutation.mutate(item.task.id)}
                    disabled={pickMutation.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Yakunlash
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
