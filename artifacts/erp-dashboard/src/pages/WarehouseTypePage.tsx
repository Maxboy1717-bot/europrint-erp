/**
 * @module WarehouseTypePage
 * @description Tur bo'yicha omborlar ro'yxati (/wms/warehouses/:type) — config-driven.
 *   WarehousesPage kartochkasiga bosilganda ochiladi. EP/ui + token + tLabel.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Warehouse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { warehouseApi, type WarehouseRow } from "@/lib/api/warehouse.api";

export default function WarehouseTypePage() {
  const params = useParams<{ type?: string }>();
  const type = params.type ?? "";
  const { toast } = useToast();
  const [rows, setRows] = useState<WarehouseRow[] | null>(null);

  useEffect(() => {
    if (!type) return;
    warehouseApi
      .warehouses(type)
      .then(setRows)
      .catch((e) =>
        toast({ title: tLabel("common.warehouses.error", "Xato"), description: String((e as Error).message), variant: "destructive" }),
      );
  }, [type, toast]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Warehouse className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">{type}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows === null
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          : rows.map((w) => (
              <Link key={w.id} href={`/wms/warehouse-stock/${w.id}`} className="block transition hover:shadow-md">
                <Card className="h-full cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{w.name}</span>
                      <Badge variant="secondary">{w.code}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {w.location || tLabel("common.warehouses.noLocation", "Joylashuv ko'rsatilmagan")}
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {rows && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">{tLabel("common.warehouses.noWarehouses", "Bu turda ombor yo'q")}</p>
      )}
    </div>
  );
}
