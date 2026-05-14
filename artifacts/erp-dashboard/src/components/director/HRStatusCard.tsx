/**
 * @module HRStatusCard
 * @description React UI component.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/director/helpers";
import type { HRData } from "@/components/director/types";

interface HRStatusCardProps {
  hr: HRData | undefined;
  hrLoad: boolean;
}

export function HRStatusCard({ hr, hrLoad }: HRStatusCardProps) {
  return (
    <Card data-testid="card-hr-status">
      <CardHeader className="pb-3">
        <SectionTitle icon={Users} title="Xodimlar Holati" sub="Bugungi davomad" />
      </CardHeader>
      <CardContent>
        {hrLoad ? <Skeleton className="h-32 rounded-lg" /> : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                { label: "Jami xodim", val: hr?.employees?.total ?? 0, color: "text-foreground" },
                { label: "Ishda", val: hr?.attendance?.present ?? 0, color: "text-[var(--ep-green)]" },
                { label: "Kelmagan", val: hr?.attendance?.absent ?? 0, color: "text-[var(--ep-red)]" },
                { label: "Kech keldi", val: hr?.attendance?.late ?? 0, color: "text-[var(--ep-yellow)]" },
              ]).map((item, i) => (
                <div key={`k-${i}`} className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={cn("text-xl font-bold", item.color)}>{item.val}</p>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Davomad darajasi</span>
                <span className="font-semibold text-foreground">{hr?.attendance?.attendanceRate ?? 0}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${hr?.attendance?.attendanceRate ?? 0}%` }} />
              </div>
            </div>
            {(hr?.byDepartment?.length ?? 0) > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Bo'lim bo'yicha</p>
                {hr?.byDepartment?.slice(0, 4).map((dept, i) => (
                  <div key={`k-${i}`} className="flex justify-between text-xs py-1">
                    <span className="text-muted-foreground truncate">{dept.department}</span>
                    <span className="font-semibold text-foreground">{dept.count} nafar</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
