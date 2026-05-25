/**
 * @module AiTrendSection
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, RefreshCw, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { AiTrendData } from "./types";
import { useTranslation } from '@/lib/i18n';

interface AiTrendSectionProps {
  activeTab: string;
}

export function AiTrendSection({ activeTab }: AiTrendSectionProps) {
  const { t } = useTranslation("common");
  const { data: aiTrend, refetch: refetchAi } = useQuery<AiTrendData>({
    queryKey: ["/api/qc/ai-trend"],
    enabled: activeTab === "ai",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t("aiSifatTahlili")}</h2>
            <p className="text-sm text-muted-foreground">{t("suniyIntellektYordamidaSifatTrendlari")}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchAi()} data-testid="button-refresh-ai">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("analizniYangilash")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" /> {t("aiXulosasi")}
            </CardTitle>
            <CardDescription>{t("oxirgi30KunlikMalumotlarAsosida")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {aiTrend?.summary || "Ma'lumotlar yetarli emas. Tahlil uchun ko'proq QC testlari va brak ma'lumotlari kerak."}
            </p>
            {aiTrend?.recommendations && aiTrend.recommendations.length > 0 && (
              <div className="pt-4 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                  <AlertCircle className="h-4 w-4" /> {t("tavsiyalar")}
                </h4>
                <ul className="space-y-1.5">
                  {(Array.isArray(aiTrend.recommendations) ? aiTrend.recommendations : []).map((rec, i) => (
                    <li key={`k-${i}`} className="text-sm flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("brakOzgarishi")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[var(--ep-red)]">
                  {aiTrend?.totalBraks || 0} <span className="text-sm font-normal text-muted-foreground">kg</span>
                </div>
                <Badge variant="outline" className="mb-1 text-[var(--ep-red)] border-red-200 bg-red-50">
                  <TrendingUp className="h-3 w-3 mr-1" /> +12.4%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{t("otganOygaNisbatan")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("sifatBarqarorligi")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[var(--ep-green)]">96.8%</div>
                <Badge variant="outline" className="mb-1 text-[var(--ep-green)] border-green-200 bg-green-50">
                  <TrendingUp className="h-3 w-3 mr-1" /> +0.5%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{t("standartgaMuvofiqlik")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Brak Sabablari (AI Segmentatsiya)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>{t("sabab")}</TableHead>
                <TableHead className="text-right">Ulush (%)</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {aiTrend?.byReason ? Object.entries(aiTrend.byReason).map(([reason, val], i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-sm">{reason}</TableCell>
                    <TableCell className="text-right font-medium">{val}%</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={2} className="text-center py-6 text-[13px] text-muted-foreground">{t("malumotlarYoq")}</TableCell></TableRow>
                )}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t("xavfDarajasiYuqoriBosqichlar")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>{t("ishlabChiqarishBosqichi")}</TableHead>
                <TableHead className="text-right">{t("xavfDarajasi")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {([
                  { stage: "Gofra agregati", risk: "O'rta", color: "text-[var(--ep-yellow)]" },
                  { stage: "Pechka (Sukshka)", risk: "Yuqori", color: "text-[var(--ep-red)]" },
                  { stage: "Kesish va bishish", risk: "Past", color: "text-[var(--ep-green)]" },
                  { stage: "Fleksoprint", risk: "O'rta", color: "text-[var(--ep-yellow)]" },
                ]).map((r, i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-sm">{r.stage}</TableCell>
                    <TableCell className={`text-right font-bold ${r.color}`}>{r.risk}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
