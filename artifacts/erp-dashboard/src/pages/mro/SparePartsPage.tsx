import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package, AlertTriangle, DollarSign } from "lucide-react";

interface SparePart {
  id: number;
  partCode: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  warehouseLocation: string | null;
  isLow: boolean;
}

export default function SparePartsPage() {
  const { t } = useTranslation('mro' as 'admin');
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ items: SparePart[] }>({
    queryKey: ["/api/mro/spare-parts", search],
    queryFn: () => apiRequest("GET", `/api/mro/spare-parts${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });

  const items = selectArray<SparePart>(data, "items");
  const lowCount = items.filter((p) => p.isLow).length;
  const totalValue = items.reduce((s, p) => s + p.totalValue, 0);

  return (
    <DedicatedPageShell
      title={t('spareParts.title', "Ehtiyot Qismlar")}
      description={t('spareParts.description', "MRO inventar — ehtiyot qismlar zaxirasi va minimal daraja")}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label={t('spareParts.total', "Jami pozitsiyalar")} value={items.length} icon={<Package className="h-4 w-4" />} />
        <KpiCard label={t('spareParts.lowStock', "Kam zaxira")} value={lowCount} icon={<AlertTriangle className="h-4 w-4" />} variant={lowCount > 0 ? "warning" : "success"} />
        <KpiCard label={t('spareParts.totalValue', "Umumiy qiymat (UZS)")} value={totalValue.toLocaleString()} icon={<DollarSign className="h-4 w-4" />} variant="default" />
      </div>

      <Section title={t('spareParts.list', "Ehtiyot qismlar ro'yxati")}>
        <div className="mb-3 relative w-full md:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search', "Qidirish...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('spareParts.empty', "Ehtiyot qism yo'q")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">{t('spareParts.code', "Kod")}</th>
                  <th className="text-left p-2">{t('spareParts.name', "Nomi")}</th>
                  <th className="text-left p-2">{t('spareParts.category', "Kategoriya")}</th>
                  <th className="text-right p-2">{t('spareParts.qty', "Miqdor")}</th>
                  <th className="text-right p-2">{t('spareParts.min', "Min")}</th>
                  <th className="text-right p-2">{t('spareParts.value', "Qiymat")}</th>
                  <th className="text-left p-2">{t('spareParts.location', "Joylashuv")}</th>
                  <th className="text-center p-2">{t('spareParts.status', "Holat")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2"><Badge variant="outline" className="text-xs">{p.partCode}</Badge></td>
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-muted-foreground">{p.category}</td>
                    <td className="text-right p-2 font-medium">{p.quantity} {p.unit}</td>
                    <td className="text-right p-2 text-muted-foreground">{p.minStock}</td>
                    <td className="text-right p-2">{p.totalValue.toLocaleString()}</td>
                    <td className="p-2 text-muted-foreground">{p.warehouseLocation ?? '—'}</td>
                    <td className="text-center p-2">
                      {p.isLow ? (
                        <Badge variant="destructive">KAM</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-700">OK</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
