/**
 * @module AIAnalysisPanelRiskSections
 * @description AutoFill and Churn-Rescue section components for AIAnalysisPanel.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Edit, Save } from "lucide-react";
import type { AutoFillData, ChurnRescue } from "./AIAnalysisPanelTypes";
import { getRiskColor } from "./AIAnalysisPanelTypes";
import { EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── AutoFill Section ───────────────────────────────────────────────────────

interface AutoFillSectionProps {
  autoFillData: AutoFillData | null;
  loading: string | null;
  onRun: () => void;
  onApply: () => void;
}

export function AutoFillSection({ autoFillData, loading, onRun, onApply }: AutoFillSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <Button onClick={onRun} disabled={!!loading} className="w-full" data-testid="btn-run-autofill">
        {loading === "autofill" ? (
          <><EPLoader className="mr-2" />{t("tahlilQilinmoqda")}</>
        ) : (
          <><Edit className="h-4 w-4 mr-2" />{t("aiBilanToldirish")}</>
        )}
      </Button>

      {autoFillData && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("topilganMalumotlar")}</span>
            <Badge variant="outline">{autoFillData.confidence}% ishonch</Badge>
          </div>

          <div className="space-y-2">
            {autoFillData.companyTitle && (
              <div className="flex items-center justify-between p-2 bg-background rounded">
                <span className="text-xs text-muted-foreground">{t("company")}</span>
                <span className="font-medium text-sm">{autoFillData.companyTitle}</span>
              </div>
            )}
            {autoFillData.industry && (
              <div className="flex items-center justify-between p-2 bg-background rounded">
                <span className="text-xs text-muted-foreground">{t("sanoat")}</span>
                <span className="font-medium text-sm">{autoFillData.industry}</span>
              </div>
            )}
            {autoFillData.segment && (
              <div className="flex items-center justify-between p-2 bg-background rounded">
                <span className="text-xs text-muted-foreground">{t("segment")}</span>
                <EPStatusPill tone="neutral">{autoFillData.segment}</EPStatusPill>
              </div>
            )}
            {autoFillData.budget && (
              <div className="flex items-center justify-between p-2 bg-background rounded">
                <span className="text-xs text-muted-foreground">{t("byudjet")}</span>
                <span className="font-medium text-sm">{autoFillData.budget}</span>
              </div>
            )}
            {autoFillData.timeline && (
              <div className="flex items-center justify-between p-2 bg-background rounded">
                <span className="text-xs text-muted-foreground">{t("muddat")}</span>
                <span className="font-medium text-sm">{autoFillData.timeline}</span>
              </div>
            )}
          </div>

          {autoFillData.needs && autoFillData.needs.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-1">{t("ehtiyojlar")}</div>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(autoFillData.needs) ? autoFillData.needs : []).map((n, i) => (
                  <Badge key={`k-${i}`} variant="secondary" className="text-xs">{n}</Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={onApply}
            disabled={loading === "applyAutofill"}
            className="w-full"
            data-testid="btn-apply-autofill"
          >
            {loading === "applyAutofill" ? (
              <><EPLoader className="mr-2" />{t("qollanmoqda")}</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />{t("maydonlarniYangilash")}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Churn Risk Section ─────────────────────────────────────────────────────

interface ChurnSectionProps {
  churnRescue: ChurnRescue | null;
  loading: string | null;
  onRun: () => void;
}

export function ChurnRescueSection({ churnRescue, loading, onRun }: ChurnSectionProps) {
  return (
    <div className="space-y-4">
      <Button onClick={onRun} disabled={!!loading} className="w-full" data-testid="btn-run-churn">
        {loading === "churn" ? (
          <><EPLoader className="mr-2" />{t("tahlilQilinmoqda")}</>
        ) : (
          <><AlertTriangle className="h-4 w-4 mr-2" />{t("churnXavfiTahlili")}</>
        )}
      </Button>

      {churnRescue && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{churnRescue.riskScore}%</div>
              <span className="text-sm text-muted-foreground">xavf balli</span>
            </div>
            <Badge className={getRiskColor(churnRescue.riskLevel)}>
              {churnRescue.riskLevel === "yuqori" ? "Xavfli" : churnRescue.riskLevel === "o'rta" ? "Kuzatuv" : "Xavfsiz"}
            </Badge>
          </div>

          {churnRescue.riskFactors && churnRescue.riskFactors.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-[var(--ep-red)]" />
                {t("xavfOmillari")}
              </div>
              <ul className="space-y-1">
                {(Array.isArray(churnRescue.riskFactors) ? churnRescue.riskFactors : []).map((f, i) => (
                  <li key={`k-${i}`} className="text-xs flex items-start gap-1">
                    <span className="text-[var(--ep-red)]">!</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-medium mb-2 flex items-center gap-1 text-[var(--ep-blue)] dark:text-blue-400">
              <Zap className="h-3 w-3" />
              {t("qutqarishStsenariysi")}
            </div>
            <div className="space-y-2">
              {(Array.isArray(churnRescue.rescueScenario.actions) ? churnRescue.rescueScenario.actions : []).map((a, i) => (
                <div key={`k-${i}`} className="text-xs flex items-start gap-2">
                  <Badge variant="outline" className="text-[10px] h-4 shrink-0">{i + 1}</Badge>
                  <span>{a}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Muddat: {churnRescue.rescueScenario.timeline}</span>
              <EPStatusPill tone="neutral">{churnRescue.rescueScenario.successProbability}% muvaffaqiyat</EPStatusPill>
            </div>
            {churnRescue.rescueScenario.keyMessage && (
              <div className="mt-2 p-2 bg-background rounded text-xs italic">
                "{churnRescue.rescueScenario.keyMessage}"
              </div>
            )}
          </div>

          {churnRescue.retentionOffer && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-xs font-medium text-[var(--ep-green)] dark:text-green-400">{t("taklifQilinadiganBonus")}</div>
              <div className="text-sm font-medium mt-1">{churnRescue.retentionOffer}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
