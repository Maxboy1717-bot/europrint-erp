import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { Lead, STAGE_CONFIG } from "./types";

interface LeadActionsProps {
  lead: Lead | null;
  isConverted: boolean;
  isLost: boolean;
  onConvert: () => void;
  onStageChange: (stageId: string) => void;
  isStagePending: boolean;
}

export function LeadActions({ lead, isConverted, isLost, onConvert, onStageChange, isStagePending }: LeadActionsProps) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {!isConverted && !isLost && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={onConvert}
                data-testid="button-convert-lead"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Dealga o'tkazish
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700"
                onClick={() => onStageChange("WON")}
                data-testid="button-won-lead"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Yutildi
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600"
                onClick={() => onStageChange("LOST")}
                data-testid="button-lost-lead"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Yo'qotildi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isConverted && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Bu lid konvertatsiya qilingan!</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isLost && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Bu lid yo'qotilgan.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Bosqichni o'zgartirish
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
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
