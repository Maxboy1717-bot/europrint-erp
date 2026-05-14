/**
 * @module IshChiqarishBolimi
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpFromLine } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export function IshChiqarishBolimi() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [formData, setFormData] = useState({ barcodeId: "", quantity: "", operatorId: "", workOrderId: "" });

  const chiqishMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/barcode-warehouse/issue", data);
      return res;
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli", description: "Material ishga chiqarildi" });
      setFormData({ barcodeId: "", quantity: "", operatorId: "", workOrderId: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/dashboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.barcodeId || !formData.quantity) {
      toast({ title: "Xatolik", description: "Barcode va miqdor kerak", variant: "destructive" });
      return;
    }
    chiqishMutation.mutate({
      barcodeId: formData.barcodeId,
      quantity: parseFloat(formData.quantity),
      operatorId: formData.operatorId || undefined,
      workOrderId: formData.workOrderId || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowUpFromLine className="h-4 w-4" />
          {t("ishlabChiqarishgaBerish")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-3">
        <div>
          <Label className="text-xs">{t("barcode1")}</Label>
          <Input data-testid="input-issue-barcode" placeholder={t("barcodeSkanerlang")} value={formData.barcodeId} onChange={(e) => setFormData({ ...formData, barcodeId: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">{t("miqdor1")}</Label>
          <Input data-testid="input-issue-qty" type="number" step="0.1" placeholder="0.0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">{t("operatorId")}</Label>
            <Input data-testid="input-issue-operator" placeholder="ID" value={formData.operatorId} onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">{t("ishBuyurtmasi")}</Label>
            <Input data-testid="input-issue-wo" placeholder="WO-..." value={formData.workOrderId} onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })} />
          </div>
        </div>
        <Button data-testid="button-issue" className="w-full" onClick={handleSubmit} disabled={chiqishMutation.isPending}>
          <ArrowUpFromLine className="h-4 w-4 mr-1" />
          {chiqishMutation.isPending ? "Chiqarilmoqda..." : "Ishga berish"}
        </Button>
      </CardContent>
    </Card>
  );
}
