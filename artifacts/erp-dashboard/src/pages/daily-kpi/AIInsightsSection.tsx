import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Lightbulb, RefreshCw } from "lucide-react";
import type { AiFinanceInsight } from "./types";
import { getPriorityBadgeVariant, getPriorityLabel, getInsightTypeIcon } from "./types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface AIInsightsSectionProps {
  insights?: AiFinanceInsight[];
  isLoading: boolean;
}

export function AIInsightsSection({ insights, isLoading }: AIInsightsSectionProps) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <Card data-testid="card-ai-insights">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-500" />
          AI Tahlil va Tavsiyalar
        </CardTitle>
        <CardDescription>Sun'iy intellekt tomonidan tayyorlangan moliyaviy tahlillar</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">{([1, 2, 3]).map((i) => <Skeleton key={`k-${i}`} className="h-24 w-full" />)}</div>
        ) : insights && insights.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {(Array.isArray(insights) ? insights : []).map((insight) => {
                const IconComp = getInsightTypeIcon(insight.insightType);
                return (
                  <div key={insight.id} className="p-4 rounded-lg border bg-card hover-elevate" data-testid={`insight-card-${insight.id}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500"><IconComp className="h-4 w-4" /></div>
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{insight.segment} • {insight.insightDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityBadgeVariant(insight.priority)}>{getPriorityLabel(insight.priority)}</Badge>
                        {insight.actionRequired && !insight.actionTaken && <Badge variant="warning">Talab qilinadi</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    {insight.confidence && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Ishonchlilik</span>
                          <span className="font-medium">{insight.confidence.toFixed(0)}%</span>
                        </div>
                        <Progress value={insight.confidence} className="h-1.5" />
                      </div>
                    )}
                    {insight.recommendation && (
                      <div className="p-3 rounded-md bg-violet-500/5 border border-violet-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb className="h-3 w-3 text-violet-500" />
                          <span className="text-xs font-medium text-violet-500">Tavsiya</span>
                        </div>
                        <p className="text-sm">{insight.recommendation}</p>
                      </div>
                    )}
                    {insight.impact && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Ta'siri: </span>{insight.impact}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <Brain className="h-12 w-12 mb-4 opacity-40" />
            <p>Hozircha AI tahlillari mavjud emas</p>
            <p className="text-sm">Tizim ma'lumotlarni tahlil qilmoqda</p>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
