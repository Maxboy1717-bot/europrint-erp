import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

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
  return (
    <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-surface-container-low/50 py-4 px-6">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          {t.penaltySettings}
        </CardTitle>
        <CardDescription className="text-on-surface-variant">
          {language === "uz" ? "Xavfsizlik buzilishlari uchun avtomatik jarima" : "Автоматические штрафы за нарушения безопасности"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-outline-variant">
          <Label htmlFor="auto-penalty" className="font-bold text-on-surface">{t.autoPenalty}</Label>
          <Switch
            id="auto-penalty"
            checked={autoPenalty}
            onCheckedChange={setAutoPenalty}
            data-testid="switch-auto-penalty"
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="penalty-amount" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t.penaltyAmount}</Label>
          <div className="relative">
            <Input
              id="penalty-amount"
              type="number"
              value={penaltyAmount}
              onChange={(e) => setPenaltyAmount(parseInt(e.target.value))}
              className="bg-surface border-outline-variant rounded-lg h-10 pl-4 pr-16 font-bold w-full md:w-64"
              disabled={!autoPenalty}
              data-testid="input-penalty-amount"
            />
            <div className="absolute left-40 md:left-52 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">SO'M</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
