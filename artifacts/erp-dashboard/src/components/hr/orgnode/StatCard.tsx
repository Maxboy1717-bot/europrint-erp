/**
 * @module StatCard
 * @description React UI component.
 */

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

export function StatCard({
  icon, label, value, color,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4 flex items-center gap-3">
        <div className="rounded-lg p-2 shrink-0" style={{ background: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
