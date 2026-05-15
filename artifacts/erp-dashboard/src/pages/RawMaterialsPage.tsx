/**
 * @module RawMaterialsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface RawMaterial {
  id: string | number;
  name?: string;
  code?: string;
  unit?: string;
  category?: string;
  stock_qty?: number;
  stockQty?: number;
  min_stock?: number;
  minStock?: number;
  unit_cost?: number;
  unitCost?: number;
  supplier?: string;
  status?: string;
}

const fmtMoney = (v?: number) =>
  v !== undefined ? `${Number(v).toLocaleString("uz-UZ")} so'm` : "—";

export default function RawMaterialsPage() {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<
    RawMaterial[] | { data?: RawMaterial[]; total?: number; items?: RawMaterial[] }
  >({
    queryKey: ["/api/raw-materials", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("search", search);
      return await apiRequest("GET", `/api/raw-materials?${params}`);
    },
  });

  const materials: RawMaterial[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: RawMaterial[] })?.data
      ?? (rawData as { items?: RawMaterial[] })?.items
      ?? [];

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <ModulePage
      module="mm"
      title={t("xomAshyolar")}
      icon={<Layers className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("xomAshyoQidirish")}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            data-testid="input-search-raw-materials"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3, 4]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-56 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : materials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "Qidiruv natijasi topilmadi" : "Xom ashyolar yo'q"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {materials.map(m => {
              const stock    = m.stock_qty ?? m.stockQty ?? 0;
              const minStock = m.min_stock ?? m.minStock;
              const isLow    = minStock !== undefined && stock < minStock;
              return (
                <Card key={m.id} className="hover:shadow-md transition-shadow" data-testid={`card-raw-material-${m.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{m.name ?? "—"}</p>
                        {m.code && (
                          <span className="font-mono text-xs text-muted-foreground">{m.code}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                        <span>{t("qoldiq1")}<span className={isLow ? "text-destructive font-medium" : ""}>{stock} {m.unit ?? ""}</span></span>
                        {minStock !== undefined && (
                          <span>Min: {minStock} {m.unit ?? ""}</span>
                        )}
                        {(m.unit_cost ?? m.unitCost) !== undefined && (
                          <span>{fmtMoney(m.unit_cost ?? m.unitCost)}/{m.unit ?? "dona"}</span>
                        )}
                        {m.supplier && <span>Ta'minotchi: {m.supplier}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.category && (
                        <Badge variant="outline" className="text-xs">{m.category}</Badge>
                      )}
                      {isLow && (
                        <EPStatusPill tone="danger" className="text-xs">{t("kamQoldiq")}</EPStatusPill>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
