/**
 * @module WarehousesPage
 * @description Toza Omborlar sahifasi — config-driven (warehouse_types). Har tur kartochka;
 *   yangi tur qo'shilsa UI o'zi ko'rsatadi. Eski rasvo WarehouseHub12/WMS sahifalarni almashtiradi.
 *   EP/ui komponentlar + semantic token + tLabel.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Warehouse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { warehouseApi, type WarehouseType } from "@/lib/api/warehouse.api";

const CATEGORY_LABEL: Record<string, string> = {
  material: "Material",
  finished: "Tayyor mahsulot",
  production: "Ishlab chiqarish",
  waste: "Chiqindi",
  tools: "Asbob",
  department: "Bo'lim",
};

export default function WarehousesPage() {
  const { toast } = useToast();
  const [types, setTypes] = useState<WarehouseType[] | null>(null);

  useEffect(() => {
    warehouseApi
      .types()
      .then(setTypes)
      .catch((e) =>
        toast({ title: tLabel("common.warehouses.error", "Xato"), description: String((e as Error).message), variant: "destructive" }),
      );
  }, [toast]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Warehouse className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">{tLabel("common.warehouses.title", "Omborlar")}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types === null
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : types.map((t) => (
              <Card key={t.code}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{t.nameUz}</span>
                    <Badge variant="secondary">{t.warehouseCount}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{tLabel("common.warehouses.category", "Kategoriya")}: {CATEGORY_LABEL[t.category] ?? t.category}</p>
                  <p>{tLabel("common.warehouses.inOut", "Kirim/chiqim")}: {t.inboundFlow} → {t.outboundFlow}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.needsQuarantine && <Badge variant="outline">{tLabel("common.warehouses.quarantine", "Karantin")}</Badge>}
                    {t.needsQc && <Badge variant="outline">QC</Badge>}
                    <Badge variant="outline">{t.unitBasis}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {types && types.length === 0 && (
        <p className="text-sm text-muted-foreground">{tLabel("common.warehouses.empty", "Ombor turi yo'q")}</p>
      )}
    </div>
  );
}
