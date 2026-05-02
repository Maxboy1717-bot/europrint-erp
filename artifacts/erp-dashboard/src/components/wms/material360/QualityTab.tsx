import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Package, AlertTriangle } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { KpiCard } from "./KpiCard";
import { fmtQty, fmtDate, type QualityData } from "./types";

export function QualityTab({ quality, basic }: { quality: QualityData | null; basic: { unitOfMeasure: string } }) {
  if (!quality) return <div className="text-muted-foreground text-sm py-8 text-center">Sifat ma'lumotlari yo'q</div>;
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Star} label="Sifat reytingi" value={quality.overallRating || "A"} color={quality.overallRating === "A" ? "text-green-600" : quality.overallRating === "B" ? "text-blue-600" : "text-yellow-600"} />
        <KpiCard icon={CheckCircle} label="Qabul darajasi" value={`${acceptanceRate}%`} color={acceptanceRate >= 90 ? "text-green-600" : "text-yellow-600"} />
        <KpiCard icon={Package} label="Jami partiyalar" value={String(totalBatches)} />
        <KpiCard icon={AlertTriangle} label="Karantinda" value={String(quarantineBatches)} color={quarantineBatches > 0 ? "text-yellow-600" : "text-green-600"} />
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Sifat ko'rsatkichlari</CardTitle></CardHeader>
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
          <CardHeader className="pb-2"><CardTitle className="text-sm">So'nggi partiyalar</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>{(["Partiya №", "Miqdor", "QC", "Yaroqlilik", "Sana"]).map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody>
                {quality.recentBatches?.map(b => (
                  <tr key={b.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs">{b.batchNumber}</td>
                    <td className="px-4 py-2">{fmtQty(b.remainingQuantity, basic.unitOfMeasure)}</td>
                    <td className="px-4 py-2">
                      <Badge className={["approved","not_required","passed"].includes(b.qcStatus) ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : b.qcStatus === "quarantine" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                        {b.qcStatus === "not_required" ? "Talab yo'q" : b.qcStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{fmtDate(b.expiryDate)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{fmtDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
