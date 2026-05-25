/**
 * @module PosStockPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { EPPageHeader, EPStatusPill } from "@/components/ep";

interface PosStockRow {
  warehouseId: number;
  warehouseName: string;
  materialCardId: number;
  materialName: string;
  quantity: number;
  uom: string;
  minStock: number;
  isLow: boolean;
}

export default function PosStockPage() {
  const { t } = useTranslation('warehouse');
  const { toast } = useToast();
  const queryClientHook = useQueryClient();
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: "", adjustment: "", reason: "" });

  const { data, isLoading } = useQuery<{ items: PosStockRow[] }>({
    queryKey: ["/api/pos/stock", search, warehouseId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (warehouseId) params.set("warehouse_id", warehouseId);
      const qs = params.toString();
      return apiRequest("GET", `/api/pos/stock${qs ? `?${qs}` : ""}`);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/pos/stock/adjust", {
        productId: adjustForm.productId,
        adjustment: Number(adjustForm.adjustment),
        reason: adjustForm.reason,
      });
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ["/api/pos/stock"] });
      toast({ title: "Muvaffaqiyat", description: "Miqdor muvaffaqiyatli sozlandi" });
      setAdjustForm({ productId: "", adjustment: "", reason: "" });
      setAdjustOpen(false);
    },
    onError: () => {
      toast({ title: "Xato", description: "Amal bajarilmadi", variant: "destructive" });
    },
  });

  const items = selectArray<PosStockRow>(data, "items");
  const lowCount = items.filter((x) => x.isLow).length;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-start justify-between">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('posStock.title', 'POS Zaxira')}</b></>}
        title={t('posStock.title', 'POS Zaxira')}
        subtitle={t('posStock.description', 'Real-time ombor qoldiqlari (POS terminallari)')}
      />
        <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-adjust-stock">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {t("miqdorniSozlash")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("miqdorniSozlash")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="stock-productId">{t("mahsulotId")}</Label>
                <Input
                  id="stock-productId"
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, productId: e.target.value }))}
                  placeholder={t('product001')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stock-adjustment">{t("miqdorOzgarishi")}</Label>
                <Input
                  id="stock-adjustment"
                  type="number"
                  value={adjustForm.adjustment}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, adjustment: e.target.value }))}
                  placeholder={t("k10Yoki5")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stock-reason">{t("sabab")}</Label>
                <Input
                  id="stock-reason"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder={t("sabab2")}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => adjustMutation.mutate()}
                disabled={adjustMutation.isPending || !adjustForm.productId || !adjustForm.adjustment}
              >
                {adjustMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Package className="h-4 w-4" />
              {t('posStock.totalItems', 'Jami pozitsiyalar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
              {t('posStock.lowStock', 'Kam zaxira')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--ep-yellow)]">{lowCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('posStock.warehouseFilter', 'Ombor filtri')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="ID"
              type="number"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('posStock.list', 'Zaxira ro\'yxati')}</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search', 'Qidirish...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('posStock.empty', 'Zaxira topilmadi')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-2">{t('posStock.warehouse', 'Ombor')}</th>
                    <th className="text-left p-2">{t('posStock.material', 'Material')}</th>
                    <th className="text-right p-2">{t('posStock.quantity', 'Miqdor')}</th>
                    <th className="text-right p-2">{t('posStock.minStock', 'Min')}</th>
                    <th className="text-center p-2">{t('posStock.status', 'Holat')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={`${row.warehouseId}-${row.materialCardId}`} className="border-b">
                      <td className="p-2">{row.warehouseName}</td>
                      <td className="p-2">{row.materialName}</td>
                      <td className="text-right p-2 font-medium">
                        {row.quantity.toLocaleString()} {row.uom}
                      </td>
                      <td className="text-right p-2 text-muted-foreground">
                        {row.minStock.toLocaleString()}
                      </td>
                      <td className="text-center p-2">
                        {row.isLow ? (
                          <EPStatusPill tone="danger">{t('posStock.low', 'KAM')}</EPStatusPill>
                        ) : (
                          <Badge variant="outline" className="text-[var(--ep-green)]">
                            OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
