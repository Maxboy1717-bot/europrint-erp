import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ScanBarcode,
  ClipboardCheck,
  AlertTriangle,
  Boxes,
  FileWarning,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { statusRangi, statusNomi, harakatTuriNomi } from "./helpers";
import { RecentMovement } from "./types";

export function AsosiyTab() {
  const [skanKod, setSkanKod] = useState("");
  const { toast } = useToast();

  interface WMSDashboardData {
    barcodes: { available: number; qcHold: number; total: number };
    pickingTasks: { pending: number };
    operatorDebts: { count: number };
    exitControl: { todayTotal: number };
    printQueue: { pending: number };
    recentMovements?: RecentMovement[];
  }
  const { data: dashboard, isLoading, isError, refetch} = useQuery<WMSDashboardData>({
    queryKey: ["/api/barcode-warehouse/dashboard"],
  });

  const skanMutation = useMutation({
    mutationFn: async (barcodeId: string) => {
      const res = await apiRequest("GET", `/api/barcode-warehouse/barcodes/scan/${encodeURIComponent(barcodeId)}`);
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: "Barcode topildi",
        description: `${data.materialName || "Material"} — ${data.barcode?.remainingQuantity || 0} ${data.barcode?.uom || ""}`,
      });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Barcode topilmadi", variant: "destructive" });
    },
  });

  const handleSkan = () => {
    if (skanKod.trim()) {
      skanMutation.mutate(skanKod.trim());
    }
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {([1, 2, 3, 4]).map((i) => (
          <Skeleton key={`k-${i}`} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // Universal default — backend bo'sh `{}` qaytarsa ham crash bo'lmaydi
  const d = {
    barcodes:        { total: 0, available: 0, qcHold: 0, issued: 0, ...(dashboard?.barcodes ?? {}) },
    pickingTasks:    { pending: 0, ...(dashboard?.pickingTasks ?? {}) },
    operatorDebts:   { count: 0, totalDebt: 0, ...((dashboard as Record<string, unknown>)?.operatorDebts as Record<string, unknown> ?? {}) },
    exitControl:     { todayTotal: 0, todayBlocked: 0, ...((dashboard as Record<string, unknown>)?.exitControl as Record<string, unknown> ?? {}) },
    printQueue:      { pending: 0, ...((dashboard as Record<string, unknown>)?.printQueue as Record<string, unknown> ?? {}) },
    recentMovements: Array.isArray(dashboard?.recentMovements) ? dashboard.recentMovements : [],
  };

  return (
    <div className="space-y-3 p-3">
      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Input
              data-testid="input-barcode-scan"
              placeholder="Barcode skanerlang yoki kiriting..."
              value={skanKod}
              onChange={(e) => setSkanKod(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSkan()}
              className="flex-1"
            />
            <Button data-testid="button-scan" onClick={handleSkan} disabled={skanMutation.isPending}>
              <ScanBarcode className="h-4 w-4 mr-1" />
              Skan
            </Button>
          </div>
          {skanMutation.data && (
            <div className="mt-3 p-3 rounded-md border">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium">{skanMutation.data.materialName || "Material"}</span>
                <Badge className={statusRangi(skanMutation.data.barcode?.status)}>
                  {statusNomi(skanMutation.data.barcode?.status)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div><span className="text-muted-foreground">Barcode:</span> {skanMutation.data.barcode?.barcodeId}</div>
                <div><span className="text-muted-foreground">Miqdor:</span> {skanMutation.data.barcode?.remainingQuantity} {skanMutation.data.barcode?.uom}</div>
                <div><span className="text-muted-foreground">Lot:</span> {skanMutation.data.barcode?.lotNumber || "—"}</div>
                <div><span className="text-muted-foreground">Joylashuv:</span> {skanMutation.data.barcode?.currentLocation || "—"}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
              <Boxes className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Mavjud</div>
              <div className="text-lg font-bold" data-testid="text-available-count">{d.barcodes.available}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">QC kutilmoqda</div>
              <div className="text-lg font-bold" data-testid="text-qchold-count">{d.barcodes.qcHold}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Picking topshiriqlari</div>
              <div className="text-lg font-bold" data-testid="text-picking-count">{d.pickingTasks.pending}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-red-100 dark:bg-red-900">
              <FileWarning className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Operator qarzlari</div>
              <div className="text-lg font-bold" data-testid="text-debt-count">{d.operatorDebts.count}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-2 text-center">
            <div className="text-xs text-muted-foreground">Jami barcode</div>
            <div className="text-lg font-bold" data-testid="text-total-barcodes">{d.barcodes.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <div className="text-xs text-muted-foreground">Bugun chiqish</div>
            <div className="text-lg font-bold" data-testid="text-exit-today">{d.exitControl.todayTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <div className="text-xs text-muted-foreground">Chop navbati</div>
            <div className="text-lg font-bold" data-testid="text-print-queue">{d.printQueue.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Oxirgi harakatlar</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          {d.recentMovements && d.recentMovements.length > 0 ? (
            <div className="space-y-2">
              {d.recentMovements.slice(0, 8).map((m: RecentMovement, i: number) => (
                <div key={`k-${i}`} className="flex items-center justify-between gap-2 text-sm border-b pb-1 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {harakatTuriNomi(m.movement?.movementType || "")}
                    </Badge>
                    <span className="truncate text-muted-foreground">{m.barcodeCode || "—"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {m.movement?.quantity} {m.movement?.uom}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Harakatlar yo'q</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
