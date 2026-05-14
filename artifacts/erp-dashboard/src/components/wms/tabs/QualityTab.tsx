/**
 * @module QualityTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Star, CheckCircle, Package, AlertTriangle } from "lucide-react";
import { fmtQty, fmtDate } from "@/components/wms/helpers";
import { KpiCard } from "@/components/wms/tabs/KpiCard";
import type { QualityData, MaterialBasic } from "@/components/wms/wms-types";
import { useTranslation } from '@/lib/i18n';

interface QualityTabProps {
  quality: QualityData | null | undefined;
  basic: MaterialBasic;
}

export function QualityTab({ quality, basic }: QualityTabProps) {
  const { t } = useTranslation("common");
  if (!quality) return <div className="text-muted-foreground text-sm py-8 text-center">{t("sifatMalumotlariYoq")}</div>;

  const ratingColor = quality.overallRating === "A" ? "text-[var(--ep-green)]" : quality.overallRating === "B" ? "text-[var(--ep-blue)]" : "text-[var(--ep-yellow)]";
  const acceptanceRate = quality.acceptanceRate ?? 100;
  const totalBatches = quality.totalBatches ?? 0;
  const quarantineBatches = quality.quarantineBatches ?? 0;
  const radarData = [
    { subject: "Qabul darajasi", value: Math.min(100, acceptanceRate) },
    { subject: "Karantinsiz", value: totalBatches > 0 ? Math.round(((totalBatches - quarantineBatches) / totalBatches) * 100) : 100 },
    { subject: "O'z vaqtida", value: 85 },
    { subject: "Standart", value: quality.overallRating === "A" ? 95 : quality.overallRating === "B" ? 75 : 55 },
    { subject: "Doimiylik", value: Math.max(60, acceptanceRate - 5) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Star} label={t("sifatReytingi")} value={quality.overallRating || "A"} color={ratingColor} />
        <KpiCard icon={CheckCircle} label={t("qabulDarajasi")} value={`${acceptanceRate}%`} color={acceptanceRate >= 90 ? "text-[var(--ep-green)]" : "text-[var(--ep-yellow)]"} />
        <KpiCard icon={Package} label={t("jamiPartiyalar")} value={String(totalBatches)} />
        <KpiCard icon={AlertTriangle} label={t("karantinda")} value={String(quarantineBatches)} color={quarantineBatches > 0 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-green)]"} />
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Sifat ko'rsatkichlari (Radar)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 4, right: 24, bottom: 4, left: 24 }}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Sifat" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Ball"]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {(quality.recentBatches || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t("songgiPartiyalar")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>{(["Partiya №", "Miqdor", "QC Holati", "Yaroqlilik", "Sana"]).map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(quality.recentBatches || []).map((b) => (
                    <tr key={b.id} className="border-b hover-elevate">
                      <td className="px-4 py-2 font-mono text-xs">{b.batchNumber}</td>
                      <td className="px-4 py-2">{fmtQty(b.remainingQuantity, basic.unitOfMeasure)}</td>
                      <td className="px-4 py-2">
                        <Badge className={
                          b.qcStatus === "approved" || b.qcStatus === "not_required" || b.qcStatus === "passed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : b.qcStatus === "quarantine"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }>{b.qcStatus === "not_required" ? "Talab yo'q" : b.qcStatus}</Badge>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{fmtDate(b.expiryDate)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{fmtDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
