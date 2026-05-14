/**
 * @module PenaltySettingsTab
 * @description React UI component.
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface PenaltySettingsTabProps {
  language: "uz" | "ru";
  autoPenalty: boolean;
  setAutoPenalty: (v: boolean) => void;
  penaltyAmount: number;
  setPenaltyAmount: (v: number) => void;
  t: Record<string, string>;
}

export function PenaltySettingsTab({
  language,
  autoPenalty,
  setAutoPenalty,
  penaltyAmount,
  setPenaltyAmount,
  t
}: PenaltySettingsTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <AlertTriangle className="h-5 w-5 text-[var(--ep-red)]" />
          {t.penaltySettings}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {language === "uz" ? "Xavfsizlik buzilishlari uchun avtomatik jarima" : "Автоматические штрафы за нарушения безопасности"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
          <Label htmlFor="auto-penalty" className="font-bold text-foreground">{t.autoPenalty}</Label>
          <Switch
            id="auto-penalty"
            checked={autoPenalty}
            onCheckedChange={setAutoPenalty}
            data-testid="switch-auto-penalty"
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="penalty-amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.penaltyAmount}</Label>
          <div className="relative">
            <Input
              id="penalty-amount"
              type="number"
              value={penaltyAmount}
              onChange={(e) => setPenaltyAmount(parseInt(e.target.value))}
              className="bg-background border-border rounded-lg h-10 pl-4 pr-16 font-bold w-full md:w-64"
              disabled={!autoPenalty}
              data-testid="input-penalty-amount"
            />
            <div className="absolute left-40 md:left-52 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("som1")}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
