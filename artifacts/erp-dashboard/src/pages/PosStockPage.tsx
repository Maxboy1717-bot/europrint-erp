import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package, AlertTriangle } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");

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

  const items = selectArray<PosStockRow>(data, "items");
  const lowCount = items.filter((x) => x.isLow).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title={t('posStock.title', 'POS Zaxira')}
        description={t('posStock.description', 'Real-time ombor qoldiqlari (POS terminallari)')}
      />

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
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              {t('posStock.lowStock', 'Kam zaxira')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{lowCount}</p>
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
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}
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
                          <Badge variant="destructive">{t('posStock.low', 'KAM')}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-700">
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
