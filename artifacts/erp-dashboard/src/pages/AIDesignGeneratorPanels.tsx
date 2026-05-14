/** @module AIDesignGeneratorPanels @description Reusable panel/section components for the AI Design Generator: StatusChain, AiCheckPanel, and ToolingTab. */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck, Wrench } from "lucide-react";
import {
  STATUS_CHAIN, STATUS_COLORS, STATUS_LABELS,
  AI_CHECK_LABELS, TOOLING_LABELS, TOOLING_STATUS_BADGE,
  AiCheckResult, ToolingRecord,
} from "./AIDesignGeneratorTypes";

import { EPLoader } from "@/components/ep";
// ─── Status zanjiri komponenti ────────────────────────────────────────────────
export function StatusChain({ current }: { current: string }) {
  const idx = STATUS_CHAIN.indexOf(current as typeof STATUS_CHAIN[number]);
  return (
    <div className="flex items-center gap-1 flex-wrap" data-testid="status-chain">
      {(Array.isArray(STATUS_CHAIN) ? STATUS_CHAIN : []).map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
            s === current
              ? STATUS_COLORS[s]
              : i < idx
              ? "bg-green-50 text-[var(--ep-green)] border-green-200"
              : "bg-gray-50 text-gray-400 border-gray-200"
          }`}>
            {i < idx && s !== current ? "✓ " : ""}{STATUS_LABELS[s] || s}
          </span>
          {i < STATUS_CHAIN.length - 1 && (
            <span className="text-gray-300 text-xs">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── AI Tekshiruv paneli ─────────────────────────────────────────────────────
export function AiCheckPanel({
  designId, checks, isVerifying, onVerify,
}: {
  designId: string;
  checks: AiCheckResult[];
  isVerifying: boolean;
  onVerify: (designId: string) => void;
}) {
  const allChecks = ["spelling_uz", "spelling_ru", "spelling_en", "bleed", "cmyk", "logo_quality", "overall"];
  const checkMap: Record<string, AiCheckResult> = {};
  for (const c of checks) checkMap[c.check_type] = c;

  return (
    <div className="space-y-3" data-testid="ai-check-panel">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--ep-blue)]" />
          AI Sifat Tekshiruvi
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onVerify(designId)}
          disabled={isVerifying}
          data-testid="button-ai-verify"
        >
          {isVerifying
            ? <EPLoader size={12} className="mr-1" />
            : <ShieldCheck className="h-3 w-3 mr-1" />}
          Tekshirish
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(Array.isArray(allChecks) ? allChecks : []).map((ct) => {
          const result = checkMap[ct];
          return (
            <div
              key={ct}
              className={`flex items-center justify-between p-2 rounded-md border text-xs ${
                !result ? "bg-gray-50 border-gray-200" :
                result.status === "passed" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
              data-testid={`check-${ct}`}
            >
              <span className="font-medium text-gray-700">{AI_CHECK_LABELS[ct]}</span>
              {!result ? (
                <span className="text-gray-400">—</span>
              ) : result.status === "passed" ? (
                <span className="flex items-center gap-1 text-[var(--ep-green)]">
                  <CheckCircle2 className="h-3 w-3" />{result.score?.toFixed(0)}%
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[var(--ep-red)]">
                  <XCircle className="h-3 w-3" />{result.score?.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {checks.length > 0 && (
        <div className="space-y-2">
          {(Array.isArray(checks) ? checks : [])
            .filter((c) => c.status === "failed" && (c.issues?.length ?? 0) > 0)
            .map((c) => (
              <div key={c.check_type} className="text-xs text-[var(--ep-red)] bg-red-50 rounded-md p-2 border border-red-200">
                <span className="font-medium">{AI_CHECK_LABELS[c.check_type]}:</span>
                <ul className="mt-1 list-disc ml-4 space-y-0.5">
                  {(c.issues || []).map((issue, i) => (
                    <li key={`k-${i}`}>{issue}</li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Tooling Tab komponenti ──────────────────────────────────────────────────
export function ToolingTab() {
  const { toast } = useToast();
  const [forecastId, setForecastId] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<Record<string, unknown> | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const { data: toolingList = [], isLoading } = useQuery<ToolingRecord[]>({
    queryKey: ["/api/design/tooling"],
  });

  const handleForecast = async (id: string) => {
    setForecastId(id);
    setForecastLoading(true);
    try {
      const result = await apiRequest("GET", `/api/design/tooling/${id}/wear-forecast`);
      setForecastData(result);
      toast({ title: "Eskirish prognozi hisoblandi!" });
    } catch {
      toast({ title: "Prognoz xatoligi", variant: "destructive" });
    } finally {
      setForecastLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <EPLoader size={24} tone="muted" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Bosma Asboblar va Qoliplar</h3>
          <p className="text-xs text-muted-foreground">10 tur — eskirish prognozi bilan</p>
        </div>
        <Badge variant="outline">{toolingList.length} ta asbob</Badge>
      </div>

      {toolingList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Hali asbob/qolip ro'yxati bo'sh</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(Array.isArray(toolingList) ? toolingList : []).map((tool) => {
            const wear = Number(tool.wear_percentage || 0);
            const isForecastShown = forecastId === tool.id && forecastData;
            return (
              <Card key={tool.id as string} data-testid={`card-tooling-${tool.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm">{tool.name as string}</div>
                      <div className="text-xs text-muted-foreground">{tool.tooling_number as string}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {TOOLING_LABELS[tool.tooling_type as string] || tool.tooling_type as string}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${TOOLING_STATUS_BADGE[tool.status as string] || "bg-gray-100 text-gray-600"}`}>
                        {tool.status as string}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Eskirish</span>
                      <span className={`font-medium ${wear >= 90 ? "text-[var(--ep-red)]" : wear >= 70 ? "text-[var(--ep-primary)]" : "text-[var(--ep-green)]"}`}>
                        {wear.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={wear}
                      className={`h-2 ${wear >= 90 ? "[&>div]:bg-red-500" : wear >= 70 ? "[&>div]:bg-orange-500" : "[&>div]:bg-green-500"}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Number(tool.total_usage_count || 0).toLocaleString()} ta</span>
                      <span>Maks: {Number(tool.max_usage_count || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {!!tool.location && (
                    <div className="text-xs text-muted-foreground">
                      Joylashuv: {String(tool.location)}
                    </div>
                  )}

                  {isForecastShown && forecastData && (
                    <div className="mt-2 p-3 bg-muted rounded-md space-y-2 border">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <AlertCircle className={`h-3 w-3 ${forecastData.riskLevel === "critical" ? "text-[var(--ep-red)]" : forecastData.riskLevel === "high" ? "text-[var(--ep-primary)]" : "text-[var(--ep-green)]"}`} />
                        Risk: {String(forecastData.riskLevel ?? "")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Taxminiy eskirish: {String(forecastData.forecastDate ?? "")} ({Number(forecastData.daysLeft ?? 0)} kun)
                      </div>
                      {!!forecastData.aiRecommendation && (
                        <div className="text-xs text-foreground">{String(forecastData.aiRecommendation)}</div>
                      )}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleForecast(tool.id as string)}
                    disabled={forecastLoading && forecastId === tool.id}
                    data-testid={`button-forecast-${tool.id}`}
                  >
                    {forecastLoading && forecastId === tool.id ? (
                      <><EPLoader size={12} className="mr-1" />Hisoblanmoqda...</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" />Eskirish Prognozi (AI)</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
