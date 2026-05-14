/**
 * MetricCard — Direktor dashboard'da KPI ko'rsatkichlari.
 * Spec: raqam + yorliq + delta (yuqori/past arrow) + rang.
 */
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, AlertTriangle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n';

export type MetricTone = 'blue' | 'green' | 'amber' | 'red' | 'slate';

export interface MetricCardProps {
  label:    string;
  value:    string | number;
  unit?:    string;             // "so'm", "%", "ta", ...
  delta?:   number;             // foiz farqi (avvalgi davrga nisbatan)
  tone?:    MetricTone;
  icon?:    React.ReactNode;
  warning?: boolean;
}

const TONE_BG: Record<MetricTone, string> = {
  blue:  'bg-blue-50 border-blue-200',
  green: 'bg-emerald-50 border-emerald-200',
  amber: 'bg-amber-50 border-amber-200',
  red:   'bg-red-50 border-red-200',
  slate: 'bg-slate-50 border-slate-200',
};
const TONE_TEXT: Record<MetricTone, string> = {
  blue:  'text-[var(--ep-blue)]',
  green: 'text-[var(--ep-green)]',
  amber: 'text-[var(--ep-yellow)]',
  red:   'text-[var(--ep-red)]',
  slate: 'text-slate-700',
};

export function MetricCard({ label, value, unit, delta, tone = 'blue', icon, warning }: MetricCardProps) {
  const { t } = useTranslation("common");
  const deltaIsPositive = (delta ?? 0) > 0;
  const deltaIsNegative = (delta ?? 0) < 0;

  return (
    <Card className={cn('p-4 border', TONE_BG[tone], 'hover:shadow-md transition-shadow')}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {warning ? (
          <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />
        ) : icon ? (
          <span className={cn('opacity-70', TONE_TEXT[tone])}>{icon}</span>
        ) : null}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn('text-2xl font-bold tabular-nums', TONE_TEXT[tone])}>
          {typeof value === 'number' ? value.toLocaleString('uz-UZ') : value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>

      {delta !== undefined && delta !== 0 && (
        <div className="flex items-center gap-1 mt-1.5 text-xs">
          {deltaIsPositive && <ArrowUp className="h-3 w-3 text-[var(--ep-green)]" />}
          {deltaIsNegative && <ArrowDown className="h-3 w-3 text-[var(--ep-red)]" />}
          {delta === 0 && <Minus className="h-3 w-3 text-slate-500" />}
          <span className={cn(
            'font-semibold',
            deltaIsPositive ? 'text-[var(--ep-green)]' : deltaIsNegative ? 'text-[var(--ep-red)]' : 'text-slate-600',
          )}>
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{t("otganDavrgaNisbatan")}</span>
        </div>
      )}
    </Card>
  );
}
