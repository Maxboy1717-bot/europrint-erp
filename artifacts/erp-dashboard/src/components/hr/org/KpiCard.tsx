/**
 * @module KpiCard
 * @description React UI component.
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="flex-1 min-w-[150px]">
      <CardContent className="pt-2.5 pb-2.5 px-4 flex items-center gap-3">
        <div
          className="rounded-lg p-1.5 shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
