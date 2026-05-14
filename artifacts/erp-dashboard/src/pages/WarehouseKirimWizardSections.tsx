/**
 * WarehouseKirimWizardSections.tsx
 * Non-step UI sections: page header and step indicator.
 */
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { KirimConfig, Warehouse } from "./WarehouseKirimWizardTypes";
import { STEPS } from "./WarehouseKirimWizardTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Page header ──────────────────────────────────────────────────────────────
interface WizardHeaderProps {
  cfg: KirimConfig;
  activeWarehouse: Warehouse | null;
  onBack: () => void;
}
export function WizardHeader({ cfg, activeWarehouse, onBack }: WizardHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 rounded-lg ${cfg.badgeColor} flex items-center justify-center text-xl text-white`}>
        {cfg.icon}
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
          {activeWarehouse ? `${activeWarehouse.code}` : "YANGI KIRIM"}
        </div>
        <h1 className="text-xl font-bold">{cfg.title}</h1>
      </div>
      <Button onClick={onBack} variant="outline">{t("orqaga")}</Button>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
interface StepIndicatorProps {
  step: number;
}
export function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              step > s.n ? "bg-[var(--ep-green)] text-white" :
              step === s.n ? "bg-[var(--ep-blue)] text-white" :
              "bg-gray-200 text-gray-400"
            }`}>
              {step > s.n ? "✓" : s.n}
            </div>
            <div className={`text-xs font-medium ${step === s.n ? "text-[var(--ep-blue)]" : "text-gray-500"}`}>{s.label}</div>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-1 mx-2 ${step > s.n ? "bg-emerald-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Navigation buttons ───────────────────────────────────────────────────────
interface NavigationBarProps {
  step: number;
  saving: boolean;
  canNext: boolean;
  cfg: KirimConfig;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}
export function NavigationBar({ step, saving, canNext, cfg, onBack, onNext, onSubmit }: NavigationBarProps) {
  const { t } = useTranslation("common");
  if (step >= 5) return null;
  return (
    <div className="flex justify-between mt-6 pt-4 border-t">
      <Button onClick={onBack} disabled={step === 1} variant="outline">
        <ChevronLeft className="h-4 w-4 mr-1" /> {t("back")}
      </Button>
      {step < 4 ? (
        <Button onClick={onNext} disabled={!canNext}>
          {t("nextBtn")}<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={saving} className="bg-emerald-600 hover:bg-[var(--ep-green)]/90">
          {saving ? "⏳ Saqlanmoqda..." : cfg.submitLabel}
        </Button>
      )}
    </div>
  );
}
