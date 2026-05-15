/**
 * @module QabulBolimi
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine } from "lucide-react";
import { MaterialCardItem, WarehouseItem } from "./types";

import { useTranslation } from '@/lib/i18n';
export function QabulBolimi() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    materialCardId: "",
    lotNumber: "",
    quantity: "",
    uom: "KG",
    vendorId: "",
    poNumber: "",
    unitCost: "",
    actualWeight: "",
    warehouseId: "",
  });

  const { data: materiallar } = useQuery<MaterialCardItem[]>({
    queryKey: ["/api/material-cards"],
  });

  const { data: omborlar } = useQuery<WarehouseItem[]>({
    queryKey: ["/api/warehouses"],
  });

  const qabulMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest<{ status?: string; message?: string; barcodeId?: string; printedLabels?: number }>("POST", "/api/barcode-warehouse/receive", data);
      return res;
    },
    onSuccess: (data) => {
      if (data.status === "WEIGHT_MISMATCH") {
        toast({
          title: "Og'irlik farqi",
          description: String(data.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Qabul muvaffaqiyatli",
          description: `Barcode: ${data.barcodeId}. ${data.printedLabels} ta yorliq chop etish navbatida.`,
        });
        setFormData({ materialCardId: "", lotNumber: "", quantity: "", uom: "KG", vendorId: "", poNumber: "", unitCost: "", actualWeight: "", warehouseId: "" });
        queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/barcodes"] });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message || "Qabul amalga oshmadi", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.materialCardId || !formData.quantity) {
      toast({ title: "Xatolik", description: "Material va miqdor kerak", variant: "destructive" });
      return;
    }
    qabulMutation.mutate({
      materialCardId: formData.materialCardId,
      lotNumber: formData.lotNumber || undefined,
      quantity: parseFloat(formData.quantity),
      uom: formData.uom,
      vendorId: formData.vendorId || undefined,
      poNumber: formData.poNumber || undefined,
      unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
      actualWeight: formData.actualWeight ? parseFloat(formData.actualWeight) : undefined,
      warehouseId: formData.warehouseId || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4" />
          {t("materialQabulQilish")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-3">
        <div>
          <Label className="text-xs">{t('material')}</Label>
          <Select value={formData.materialCardId} onValueChange={(v) => setFormData({ ...formData, materialCardId: v })}>
            <SelectTrigger data-testid="select-material" className="h-9">
              <SelectValue placeholder={t("materialTanlang")} />
            </SelectTrigger>
            <SelectContent>
              {materiallar?.map((m: MaterialCardItem) => (
                <SelectItem key={String(m.id)} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">{t("hujjatdagiMiqdor")}</Label>
            <Input data-testid="input-quantity" type="number" step="0.1" placeholder="0.0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Tarozi (haqiqiy og'irlik)</Label>
            <Input data-testid="input-actual-weight" type="number" step="0.1" placeholder={t("tarozi")} value={formData.actualWeight} onChange={(e) => setFormData({ ...formData, actualWeight: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">{t("olchovBirligi")}</Label>
            <Select value={formData.uom} onValueChange={(v) => setFormData({ ...formData, uom: v })}>
              <SelectTrigger data-testid="select-uom" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KG">KG</SelectItem>
                <SelectItem value="DONA">DONA</SelectItem>
                <SelectItem value="METR">METR</SelectItem>
                <SelectItem value="LITR">LITR</SelectItem>
                <SelectItem value="RULON">RULON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("lotRaqami")}</Label>
            <Input data-testid="input-lot" placeholder="LOT-..." value={formData.lotNumber} onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">{t("buyurtmaRaqami")}</Label>
            <Input data-testid="input-po" placeholder="PO-..." value={formData.poNumber} onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Narx (birlik)</Label>
            <Input data-testid="input-cost" type="number" step="0.01" placeholder="0.00" value={formData.unitCost} onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })} />
          </div>
        </div>
        <div>
          <Label className="text-xs">{t("ombor")}</Label>
          <Select value={formData.warehouseId} onValueChange={(v) => setFormData({ ...formData, warehouseId: v })}>
            <SelectTrigger data-testid="select-warehouse" className="h-9">
              <SelectValue placeholder={t("omborTanlang")} />
            </SelectTrigger>
            <SelectContent>
              {omborlar?.map((w: WarehouseItem) => (
                <SelectItem key={String(w.id)} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button data-testid="button-receive" className="w-full" onClick={handleSubmit} disabled={qabulMutation.isPending}>
          <ArrowDownToLine className="h-4 w-4 mr-1" />
          {qabulMutation.isPending ? "Qabul qilinmoqda..." : "Qabul qilish"}
        </Button>
      </CardContent>
    </Card>
  );
}
