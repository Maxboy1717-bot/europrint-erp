/**
 * @module PaperParametersPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle2, XCircle } from "lucide-react";

interface PaperParameter {
  id: number;
  parameterName: string;
  category: string;
  unit: string;
  minValue: number | null;
  maxValue: number | null;
  targetValue: number | null;
  toleranceMethod: "range" | "target_pm" | "min_only" | "max_only";
  testMethod: string | null;
  isActive: boolean;
}

const CATEGORIES_PAPER_QC = [
  'qogoz', 'karton', 'gofra', 'bosma', 'laminatsiya', 'kesish', 'yigish', 'yelimlash', 'qadoqlash',
];

export default function PaperParametersPage() {
  const { t } = useTranslation('qc');

  const { data, isLoading } = useQuery<{ items: PaperParameter[] }>({
    queryKey: ["/api/qc/parameters/paper"],
    queryFn: () => apiRequest("GET", "/api/qc/parameters/paper"),
  });

  const items = selectArray<PaperParameter>(data, "items");
  const active = items.filter((p) => p.isActive).length;
  const inactive = items.length - active;
  const byCategory = items.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <DedicatedPageShell
      title={t('paperParams.title', "Qog'oz Parametrlari")}
      description={t('paperParams.description', "9 ta kategoriya × 57+ parametr — sifat standartlari")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('paperParams.total', "Jami")} value={items.length} icon={<FileText className="h-4 w-4" />} />
        <KpiCard label={t('paperParams.active', "Faol")} value={active} icon={<CheckCircle2 className="h-4 w-4" />} variant="success" />
        <KpiCard label={t('paperParams.inactive', "Faol emas")} value={inactive} icon={<XCircle className="h-4 w-4" />} variant={inactive > 0 ? "warning" : "default"} />
        <KpiCard label={t('paperParams.categories', "Kategoriyalar")} value={Object.keys(byCategory).length} icon={<FileText className="h-4 w-4" />} />
      </div>

      <Section title={t('paperParams.byCategory', "Kategoriya bo'yicha")}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES_PAPER_QC.map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs">
              {cat}: {byCategory[cat] ?? 0}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title={t('paperParams.list', "Parametrlar ro'yxati")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('paperParams.empty', "Parametr yo'q")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">{t('paperParams.name', "Nomi")}</th>
                  <th className="text-left p-2">{t('paperParams.category', "Kategoriya")}</th>
                  <th className="text-right p-2">{t('paperParams.min', "Min")}</th>
                  <th className="text-right p-2">{t('paperParams.target', "Maqsad")}</th>
                  <th className="text-right p-2">{t('paperParams.max', "Max")}</th>
                  <th className="text-left p-2">{t('paperParams.unit', "Birlik")}</th>
                  <th className="text-left p-2">{t('paperParams.method', "Usul")}</th>
                  <th className="text-center p-2">{t('paperParams.status', "Holat")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2 font-medium">{p.parameterName}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">{p.category}</Badge>
                    </td>
                    <td className="text-right p-2">{p.minValue ?? '—'}</td>
                    <td className="text-right p-2 font-medium">{p.targetValue ?? '—'}</td>
                    <td className="text-right p-2">{p.maxValue ?? '—'}</td>
                    <td className="p-2 text-muted-foreground">{p.unit}</td>
                    <td className="p-2 text-xs text-muted-foreground">{p.testMethod ?? '—'}</td>
                    <td className="text-center p-2">
                      {p.isActive ? <CheckCircle2 className="inline h-4 w-4 text-[var(--ep-green)]" /> : <XCircle className="inline h-4 w-4 text-[var(--ep-red)]" />}
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
