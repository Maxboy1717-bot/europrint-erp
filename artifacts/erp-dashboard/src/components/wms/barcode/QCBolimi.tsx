/**
 * @module QCBolimi
 * @description React UI component.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, CheckCircle2, XCircle } from "lucide-react";
import { QcBarcodeItem } from "./types";
import { useTranslation } from '@/lib/i18n';

export function QCBolimi() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const { data: qcMateriallar, isLoading } = useQuery<QcBarcodeItem[]>({
    queryKey: ["/api/barcode-warehouse/barcodes", { status: "QC_HOLD" }],
    queryFn: async () => {
      const res = await apiRequest('GET', "/api/barcode-warehouse/barcodes?status=QC_HOLD") as unknown as Response;
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const qcMutation = useMutation({
    mutationFn: async ({ id, passed, notes }: { id: string | number; passed: boolean; notes?: string }) => {
      const res = await apiRequest<{ status?: string; message?: string }>("PATCH", `/api/barcode-warehouse/qc/${id}`, { passed, notes });
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: data.status === "APPROVED" ? "QC tasdiqlandi" : "QC rad etildi",
        description: String(data.message),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/barcodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/dashboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-lg" />;

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Sifat nazorati (QC)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {!qcMateriallar || qcMateriallar.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("qcKutayotganMaterialYoq")}</p>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(qcMateriallar) ? qcMateriallar : []).map((item: QcBarcodeItem) => (
              <div key={item.barcode.id} className="border rounded-md p-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-medium text-sm">{item.materialName || item.barcode.barcodeId}</span>
                    <div className="text-xs text-muted-foreground">
                      {item.barcode.remainingQuantity} {item.barcode.uom} | Lot: {item.barcode.lotNumber || "—"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      data-testid={`button-qc-approve-${item.barcode.id}`}
                      size="sm"
                      onClick={() => qcMutation.mutate({ id: item.barcode.id, passed: true })}
                      disabled={qcMutation.isPending}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {t("verify")}
                    </Button>
                    <Button
                      data-testid={`button-qc-reject-${item.barcode.id}`}
                      size="sm"
                      variant="destructive"
                      onClick={() => qcMutation.mutate({ id: item.barcode.id, passed: false, notes: "QC tekshiruvdan o'tmadi" })}
                      disabled={qcMutation.isPending}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      {t("rad")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
