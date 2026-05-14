/**
 * @module SiklHisobBolimi
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Hash } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export function SiklHisobBolimi() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [formData, setFormData] = useState({ barcodeId: "", materialCardId: "", countedQuantity: "", binId: "", warehouseId: "" });

  const hisobMutation = useMutation({
    mutationFn: async (data: { barcodeId?: string; materialCardId?: string; countedQuantity: number; binId?: string; warehouseId?: string }) => {
      const res = await apiRequest("POST", "/api/barcode-warehouse/cycle-count", data);
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: data.adjustmentAction === "AUTO_ADJUST" ? "Avtomatik tuzatildi" : "Natija saqlandi",
        description: String(data.message),
        variant: data.adjustmentAction === "RECOUNT" ? "destructive" : "default",
      });
      setFormData({ barcodeId: "", materialCardId: "", countedQuantity: "", binId: "", warehouseId: "" });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Sikl hisob (Blind Count)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        <p className="text-xs text-muted-foreground">
          {t("tizimMiqdorniKorsatmaydiSizFaqat")}
        </p>
        <div>
          <Label className="text-xs">Barcode (ixtiyoriy)</Label>
          <Input data-testid="input-cycle-barcode" placeholder={t("barcodeSkanerlang")} value={formData.barcodeId} onChange={(e) => setFormData({ ...formData, barcodeId: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">{t("hisoblanganMiqdor")}</Label>
          <Input data-testid="input-cycle-qty" type="number" step="0.1" placeholder={t("faqatHisoblanganMiqdorniKiriting")} value={formData.countedQuantity} onChange={(e) => setFormData({ ...formData, countedQuantity: e.target.value })} />
        </div>
        <Button data-testid="button-cycle-submit" className="w-full" onClick={() => hisobMutation.mutate({
          barcodeId: formData.barcodeId || undefined,
          materialCardId: formData.materialCardId || undefined,
          countedQuantity: parseFloat(formData.countedQuantity) || 0,
          binId: formData.binId || undefined,
          warehouseId: formData.warehouseId || undefined,
        })} disabled={hisobMutation.isPending || !formData.countedQuantity}>
          {hisobMutation.isPending ? "Tekshirilmoqda..." : "Natijani yuborish"}
        </Button>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Farq &lt;2% = Avtomatik tuzatish</div>
          <div>Farq 2-5% = Supervisor tasdig'i kerak</div>
          <div>Farq &gt;5% = Qayta sanash kerak!</div>
        </div>
      </CardContent>
    </Card>
  );
}
