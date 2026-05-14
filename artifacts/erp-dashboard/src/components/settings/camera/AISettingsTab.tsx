/**
 * @module AISettingsTab
 * @description React UI component.
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sliders, Shield, Factory, Users } from "lucide-react";

interface AISettingsTabProps {
  language: "uz" | "ru";
  safetyThreshold: number;
  setSafetyThreshold: (v: number) => void;
  qualityThreshold: number;
  setQualityThreshold: (v: number) => void;
  productivityThreshold: number;
  setProductivityThreshold: (v: number) => void;
  t: Record<string, string>;
}

export function AISettingsTab({
  language,
  safetyThreshold,
  setSafetyThreshold,
  qualityThreshold,
  setQualityThreshold,
  productivityThreshold,
  setProductivityThreshold,
  t
}: AISettingsTabProps) {
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <Sliders className="h-5 w-5 text-[var(--ep-blue)]" />
          {t.aiSettings}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {language === "uz" ? "AI tahlil sezgirligi va chegaralarini sozlash" : "Настройка чувствительности и порогов AI анализа"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-foreground font-bold">
              <Shield className="h-4 w-4 text-[var(--ep-primary)]" />
              {t.safetyThreshold}
            </Label>
            <span className="font-bold text-2xl text-primary">{safetyThreshold}%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.lowSensitivity}</span>
            <Slider
              value={[safetyThreshold]}
              onValueChange={(v) => setSafetyThreshold(v[0])}
              min={50}
              max={100}
              step={5}
              className="flex-1"
              data-testid="slider-safety"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.highSensitivity}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-foreground font-bold">
              <Factory className="h-4 w-4 text-[var(--ep-blue)]" />
              {t.qualityThreshold}
            </Label>
            <span className="font-bold text-2xl text-primary">{qualityThreshold}%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.lowSensitivity}</span>
            <Slider
              value={[qualityThreshold]}
              onValueChange={(v) => setQualityThreshold(v[0])}
              min={50}
              max={100}
              step={5}
              className="flex-1"
              data-testid="slider-quality"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.highSensitivity}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-foreground font-bold">
              <Users className="h-4 w-4 text-[var(--ep-green)]" />
              {t.productivityThreshold}
            </Label>
            <span className="font-bold text-2xl text-primary">{productivityThreshold}%</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.lowSensitivity}</span>
            <Slider
              value={[productivityThreshold]}
              onValueChange={(v) => setProductivityThreshold(v[0])}
              min={50}
              max={100}
              step={5}
              className="flex-1"
              data-testid="slider-productivity"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.highSensitivity}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
