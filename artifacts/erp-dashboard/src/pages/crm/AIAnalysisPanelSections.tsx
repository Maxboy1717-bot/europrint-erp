/**
 * @module AIAnalysisPanelSections
 * @description Scoring and NBA section components for AIAnalysisPanel.
 * AutoFill and Churn sections live in AIAnalysisPanelRiskSections.tsx.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadScoringV2, NBAResult } from "./AIAnalysisPanelTypes";
import { getPriorityColor, getFactorColor } from "./AIAnalysisPanelTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// Re-export risk sections for consumers that import from this file
export { AutoFillSection, ChurnRescueSection } from "./AIAnalysisPanelRiskSections";

// ─── Scoring 2.0 Section ────────────────────────────────────────────────────

interface ScoringV2SectionProps {
  scoringV2: LeadScoringV2 | null;
  loading: string | null;
  onRun: () => void;
}

export function ScoringV2Section({ scoringV2, loading, onRun }: ScoringV2SectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <Button onClick={onRun} disabled={!!loading} className="w-full" data-testid="btn-run-scoring-v2">
        {loading === "scoring" ? (
          <><EPLoader className="mr-2" />{t("baholanmoqda")}</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-2" />{t("leadScoring20")}</>
        )}
      </Button>

      {scoringV2 && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-4xl font-bold">{scoringV2.score}</div>
              <div className="text-xs text-muted-foreground">{t("umumiyBall")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--ep-blue)]">{scoringV2.probability}%</div>
              <div className="text-xs text-muted-foreground">{t("ehtimollik1")}</div>
            </div>
            <Badge className={getPriorityColor(scoringV2.priority)}>{scoringV2.priority}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background p-3 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">{t("taxminiyLtv")}</div>
              <div className="font-bold text-[var(--ep-green)]">{scoringV2.estimatedLTV?.toLocaleString()} UZS</div>
            </div>
            <div className="bg-background p-3 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">{t("segment")}</div>
              <Badge variant="outline">{scoringV2.segment}</Badge>
            </div>
          </div>

          <div className="bg-background p-3 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">{t("tavsiyaEtiladiganYondashuv")}</div>
            <div className="font-medium text-primary">{scoringV2.recommendedApproach}</div>
          </div>

          <div>
            <div className="text-xs font-medium mb-2">{t("baholashOmillari")}</div>
            <div className="space-y-2">
              {([
                { label: "Kompaniya hajmi", value: scoringV2.factors.companySize },
                { label: "Faollik", value: scoringV2.factors.engagement },
                { label: "Byudjet", value: scoringV2.factors.budget },
                { label: "Vaqt", value: scoringV2.factors.timing },
              ]).map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="text-xs w-24">{f.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className={cn("h-2 rounded-full", getFactorColor(f.value))} style={{ width: `${f.value}%` }} />
                  </div>
                  <span className="text-xs font-bold w-8">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{scoringV2.summary}</p>
        </div>
      )}
    </div>
  );
}

// ─── NBA Section ────────────────────────────────────────────────────────────

interface NBASectionProps {
  nba: NBAResult | null;
  loading: string | null;
  onRun: () => void;
  onCreateTask: () => void;
}

export function NBASection({ nba, loading, onRun, onCreateTask }: NBASectionProps) {
  return (
    <div className="space-y-4">
      <Button onClick={onRun} disabled={!!loading} className="w-full" data-testid="btn-run-nba">
        {loading === "nba" ? (
          <><EPLoader className="mr-2" />{t("tahlilQilinmoqda")}</>
        ) : (
          <><Zap className="h-4 w-4 mr-2" />{t("keyingiEngYaxshiQadam")}</>
        )}
      </Button>

      {nba && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{nba.actionType}</Badge>
            <Badge className={getPriorityColor(nba.priority)}>{nba.priority}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {nba.deadline}
            </div>
          </div>

          <div className="bg-primary/10 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">{t("keyingiQadam")}</div>
            <div className="font-medium">{nba.action}</div>
          </div>

          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{t("sabab1")}</span> {nba.reason}
          </div>

          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{t("kutilayotganNatija")}</span> {nba.expectedOutcome}
          </div>

          {nba.script && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">{t("skript")}</div>
              <div className="text-sm italic">{nba.script}</div>
            </div>
          )}

          {nba.tips && nba.tips.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium">{t("maslahatlar")}</div>
              {(Array.isArray(nba.tips) ? nba.tips : []).map((tip, i) => (
                <div key={`k-${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-[var(--ep-blue)]">•</span> {tip}
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={onCreateTask}
            disabled={loading === "createTask"}
            className="w-full"
            data-testid="btn-create-nba-task"
          >
            {loading === "createTask" ? (
              <><EPLoader className="mr-2" />{t("yaratilmoqda")}</>
            ) : (
              <><Plus className="h-4 w-4 mr-2" />{t("vazifaYaratish")}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
