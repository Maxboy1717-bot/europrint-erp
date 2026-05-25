/**
 * @module AIInsightsPanel
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AiInsight } from "@shared/schema";
import { useTranslation } from '@/lib/i18n';

interface AIInsightsPanelProps {
  context: string;
  metrics: Record<string, unknown>;
}

export function AIInsightsPanel({ context, metrics }: AIInsightsPanelProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: insights = [], isLoading } = useQuery<AiInsight[]>({
    queryKey: ["/api/insights"],
  });

  const generateInsightMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/insights/generate', { context, metrics }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({ title: "AI tahlil yaratildi" });
      setIsGenerating(false);
    },
    onError: () => {
      toast({ title: "Xatolik", description: "AI tahlil yaratilmadi", variant: "destructive" });
      setIsGenerating(false);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest('PATCH', `/api/insights/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateInsightMutation.mutate();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-[var(--ep-red)] dark:text-red-400" />;
      case "warning":
        return <TrendingDown className="h-5 w-5 text-[var(--ep-primary)] dark:text-orange-400" />;
      case "info":
        return <Lightbulb className="h-5 w-5 text-[var(--ep-blue)] dark:text-blue-400" />;
      case "positive":
        return <TrendingUp className="h-5 w-5 text-[var(--ep-green)] dark:text-green-400" />;
      default:
        return <Brain className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical":
        return "Jiddiy";
      case "warning":
        return "Ogohlantirish";
      case "info":
        return "Ma'lumot";
      case "positive":
        return "Ijobiy";
      default:
        return severity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-[var(--ep-red)] dark:text-red-400 border-red-500/20";
      case "warning":
        return "bg-orange-500/10 text-[var(--ep-primary)] dark:text-orange-400 border-orange-500/20";
      case "info":
        return "bg-blue-500/10 text-[var(--ep-blue)] dark:text-blue-400 border-blue-500/20";
      case "positive":
        return "bg-green-500/10 text-[var(--ep-green)] dark:text-green-400 border-green-500/20";
      default:
        return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "performance":
        return "Natija";
      case "engagement":
        return "Faollik";
      case "completion":
        return "Tugatish";
      case "quality":
        return "Sifat";
      case "prediction":
        return "Bashorat";
      case "recommendation":
        return "Tavsiya";
      default:
        return category;
    }
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t("aiTahlilVaBashorat")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {([1, 2, 3]).map((i) => (
            <Skeleton key={`k-${i}`} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t("aiTahlilVaBashorat")}
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </CardTitle>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="sm"
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t("yaratilmoqda")}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t("yangiTahlil")}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {t("haliAiTahlillarMavjudEmas")}
            </p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              {t("birinchiTahlilniYaratish")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(Array.isArray(insights) ? insights : []).map((insight) => (
              <Card
                key={insight.id}
                className={`transition-all hover-elevate ${
                  !insight.isRead ? "ring-2 ring-primary/20" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getSeverityIcon(insight.severity)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                            {getSeverityLabel(insight.severity)}
                          </Badge>
                          <Badge variant="outline">
                            {getCategoryLabel(insight.category)}
                          </Badge>
                          {!insight.isRead && (
                            <Badge variant="default" className="text-xs">
                              {t("yangi")}
                            </Badge>
                          )}
                        </div>
                        {!insight.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsReadMutation.mutate(insight.id)}
                          >
                            {t("oqilgan")}
                          </Button>
                        )}
                      </div>

                      <p className="text-sm text-foreground/80">{insight.content}</p>

                      {insight.actionItems && Array.isArray(insight.actionItems) && insight.actionItems.length > 0 ? (
                        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">{t("tavsiyalar")}</span>
                          </div>
                          <ul className="space-y-1">
                            {(Array.isArray(insight.actionItems) ? insight.actionItems : []).map((item, idx) => (
                              <li key={idx} className="text-sm text-foreground/70 flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="text-xs text-muted-foreground">
                        {insight.createdAt ? new Date(insight.createdAt).toLocaleDateString("uz", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "—"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {insights.length > 0 && (
          <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            Jami {insights.length} ta AI tahlil • {(Array.isArray(insights) ? insights : []).filter(i => !i.isRead).length} ta o'qilmagan
          </div>
        )}
      </CardContent>
    </Card>
  );
}
