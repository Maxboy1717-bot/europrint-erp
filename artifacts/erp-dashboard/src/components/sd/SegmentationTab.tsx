import { SdSegmentationData } from "./sd-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { fmtNum } from "./helpers";

export function SegmentationTab({ segmentation }: { segmentation: SdSegmentationData }) {
  if (!segmentation) return <div className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yuklanmadi</div>;

  const { abcScore, abcCategory, scoreBreakdown, recommendations, categoryLabel } = segmentation;
  const catColorClass: Record<string, string> = {
    A: "text-green-600", B: "text-blue-600", C: "text-yellow-600", D: "text-red-600",
  };
  const catBorderClass: Record<string, string> = {
    A: "border-green-200 dark:border-green-800",
    B: "border-blue-200 dark:border-blue-800",
    C: "border-yellow-200 dark:border-yellow-800",
    D: "border-red-200 dark:border-red-800",
  };

  const radarData = [
    { subject: "Daromad", value: scoreBreakdown?.revenueScore || 0 },
    { subject: "Chastota", value: scoreBreakdown?.frequencyScore || 0 },
    { subject: "Faollik", value: scoreBreakdown?.recencyScore || 0 },
    { subject: "To'lov", value: scoreBreakdown?.paymentScore || 0 },
    { subject: "Vafodorlik", value: scoreBreakdown?.loyaltyScore || 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`border-2 ${catBorderClass[abcCategory] || catBorderClass.C}`}>
          <CardContent className="p-6 text-center">
            <div className={`text-6xl font-bold mb-2 ${catColorClass[abcCategory] || "text-yellow-600"}`}>
              {abcCategory || "C"}
            </div>
            <p className="text-lg font-semibold">{categoryLabel || "Oddiy mijoz"}</p>
            <p className="text-muted-foreground text-sm mt-1">Ball: {fmtNum(abcScore)} / 100</p>
            <Progress value={fmtNum(abcScore)} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ball radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Ball tafsiloti</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([
            { label: "Daromad (×0.35)", val: scoreBreakdown?.revenueScore || 0 },
            { label: "Chastota (×0.25)", val: scoreBreakdown?.frequencyScore || 0 },
            { label: "Faollik (×0.20)", val: scoreBreakdown?.recencyScore || 0 },
            { label: "To'lov (×0.15)", val: scoreBreakdown?.paymentScore || 0 },
            { label: "Vafodorlik (×0.05)", val: scoreBreakdown?.loyaltyScore || 0 },
          ]).map(item => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.val}</span>
              </div>
              <Progress value={item.val} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {(recommendations || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tavsiyalar</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(recommendations || []).map((r: string, i: number) => (
                <li key={`k-${i}`} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
