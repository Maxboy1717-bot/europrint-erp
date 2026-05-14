/**
 * @module SupplierQualityPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, Star, AlertTriangle } from "lucide-react";

interface SupplierQualityRow {
  vendorId: number;
  vendorName: string;
  totalReceipts: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  qualityScore: number;
  grade: "A" | "B" | "C" | "D";
  trendLast90Days: "up" | "down" | "flat";
}

const GRADE_CONFIG: Record<SupplierQualityRow["grade"], { label: string; color: string }> = {
  A: { label: "A'lo (81-100)",     color: "bg-[var(--ep-green)] text-white" },
  B: { label: "Yaxshi (61-80)",    color: "bg-[var(--ep-blue)] text-white" },
  C: { label: "Qoniqarli (41-60)", color: "bg-[var(--ep-yellow)] text-white" },
  D: { label: "Yomon (0-40)",      color: "bg-[var(--ep-red)] text-white" },
};

const PASS_RATE_THRESHOLD_GOOD = 95;

export default function SupplierQualityPage() {
  const { t } = useTranslation('qc');

  const { data, isLoading } = useQuery<{ items: SupplierQualityRow[] }>({
    queryKey: ["/api/qc/supplier-quality"],
    queryFn: () => apiRequest("GET", "/api/qc/supplier-quality"),
  });

  const items = selectArray<SupplierQualityRow>(data, "items");
  const aGrade = items.filter((s) => s.grade === "A").length;
  const dGrade = items.filter((s) => s.grade === "D").length;
  const avgPassRate = items.length > 0
    ? Math.round(items.reduce((s, v) => s + v.passRate, 0) / items.length)
    : 0;

  return (
    <DedicatedPageShell
      title={t('supplierQc.title', "Yetkazuvchi Sifati")}
      description={t('supplierQc.description', "Vendor reyting: Narx 30% + Sifat 30% + Vaqt 20% + Xizmat 20%")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('supplierQc.total', "Yetkazuvchilar")} value={items.length} icon={<Truck className="h-4 w-4" />} />
        <KpiCard label={t('supplierQc.gradeA', "A reyting")} value={aGrade} icon={<Star className="h-4 w-4" />} variant="success" />
        <KpiCard label={t('supplierQc.gradeD', "D reyting")} value={dGrade} icon={<AlertTriangle className="h-4 w-4" />} variant={dGrade > 0 ? "danger" : "default"} />
        <KpiCard label={t('supplierQc.avgPassRate', "O'rtacha PASS%")} value={`${avgPassRate}%`} icon={<Star className="h-4 w-4" />} variant={avgPassRate >= PASS_RATE_THRESHOLD_GOOD ? "success" : "warning"} />
      </div>

      <Section title={t('supplierQc.list', "Yetkazuvchilar reytingi")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('supplierQc.empty', "Ma'lumot yo'q")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">{t('supplierQc.vendor', "Yetkazuvchi")}</th>
                  <th className="text-right p-2">{t('supplierQc.receipts', "GR soni")}</th>
                  <th className="text-right p-2">{t('supplierQc.passed', "Pass")}</th>
                  <th className="text-right p-2">{t('supplierQc.failed', "Fail")}</th>
                  <th className="text-right p-2">{t('supplierQc.passRate', "Pass %")}</th>
                  <th className="text-right p-2">{t('supplierQc.score', "Ball")}</th>
                  <th className="text-center p-2">{t('supplierQc.grade', "Grade")}</th>
                  <th className="text-center p-2">{t('supplierQc.trend', "Trend")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((v) => {
                  const cfg = GRADE_CONFIG[v.grade];
                  return (
                    <tr key={v.vendorId} className="border-b">
                      <td className="p-2 font-medium">{v.vendorName}</td>
                      <td className="text-right p-2">{v.totalReceipts}</td>
                      <td className="text-right p-2 text-[var(--ep-green)]">{v.passedCount}</td>
                      <td className="text-right p-2 text-[var(--ep-red)]">{v.failedCount}</td>
                      <td className="text-right p-2 font-medium">{v.passRate}%</td>
                      <td className="text-right p-2 font-medium">{v.qualityScore}</td>
                      <td className="text-center p-2"><Badge className={cfg.color}>{v.grade}</Badge></td>
                      <td className="text-center p-2">
                        {v.trendLast90Days === "up" ? "↑" : v.trendLast90Days === "down" ? "↓" : "→"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
