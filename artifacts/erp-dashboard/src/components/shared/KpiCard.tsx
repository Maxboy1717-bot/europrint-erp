/**
 * Canonical KpiCard component — Card + icon + label + value + optional sub-text.
 *
 * Usage:
 *   import { KpiCard } from '@/components/shared/KpiCard';
 *   <KpiCard icon={Package} label={tLabel("common.KpiCard.tsx.mavjud", "Mavjud")} value="142" sub="dona" color="text-green-500" />
 */

import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { tLabel } from '@/lib/i18n/tLabel';

export interface KpiCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md bg-muted ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
