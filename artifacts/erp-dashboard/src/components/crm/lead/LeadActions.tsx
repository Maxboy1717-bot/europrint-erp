/**
 * @module LeadActions
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { Lead, STAGE_CONFIG } from "./types";
import { useTranslation } from '@/lib/i18n';

interface LeadActionsProps {
  lead: Lead | null;
  isConverted: boolean;
  isLost: boolean;
  onConvert: () => void;
  onStageChange: (stageId: string) => void;
  isStagePending: boolean;
}

export function LeadActions({ lead, isConverted, isLost, onConvert, onStageChange, isStagePending }: LeadActionsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {!isConverted && !isLost && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white"
                onClick={onConvert}
                data-testid="button-convert-lead"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                {t("dealgaOtkazish")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-green-300 text-[var(--ep-green)]"
                onClick={() => onStageChange("WON")}
                data-testid="button-won-lead"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {t("yutildi")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-[var(--ep-red)]"
                onClick={() => onStageChange("LOST")}
                data-testid="button-lost-lead"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                {t("yoqotildi")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isConverted && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-[var(--ep-green)]">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">{t("buLidKonvertatsiyaQilingan")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isLost && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-[var(--ep-red)]">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">{t("buLidYoqotilgan")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            {t("bosqichniOzgartirish")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(STAGE_CONFIG).map(([stageId, config]) => (
              <Button
                key={stageId}
                variant={lead?.statusId === stageId ? "default" : "outline"}
                size="sm"
                className="justify-start text-xs"
                style={lead?.statusId === stageId ? { backgroundColor: config.color } : {}}
                onClick={() => onStageChange(stageId)}
                disabled={isStagePending}
                data-testid={`button-stage-${stageId.toLowerCase()}`}
              >
                {config.icon} {config.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
