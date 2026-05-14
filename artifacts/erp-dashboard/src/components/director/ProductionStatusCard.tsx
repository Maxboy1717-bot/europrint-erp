/**
 * @module ProductionStatusCard
 * @description React UI component.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle, MachineCell } from "@/components/director/helpers";
import type { ProductionData } from "@/components/director/types";

interface ProductionStatusCardProps {
  prod: ProductionData | undefined;
  prodLoad: boolean;
  runningMachines: number;
  totalMachines: number;
}

export function ProductionStatusCard({ prod, prodLoad, runningMachines, totalMachines }: ProductionStatusCardProps) {
  return (
    <Card data-testid="card-production-status">
      <CardHeader className="pb-3">
        <SectionTitle icon={Factory} title="Ishlab Chiqarish" sub="Bugungi seans holati" accent="text-[var(--ep-primary)]" />
      </CardHeader>
      <CardContent>
        {prodLoad ? <Skeleton className="h-40 rounded-lg" /> : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {([
                { label: "OEE o'rt", val: prod?.oeeToday?.avg ? `${prod.oeeToday.avg}%` : "—", color: "text-[var(--ep-purple)]" },
                { label: "OEE min", val: prod?.oeeToday?.min ? `${prod.oeeToday.min}%` : "—", color: "text-[var(--ep-red)]" },
                { label: "OEE max", val: prod?.oeeToday?.max ? `${prod.oeeToday.max}%` : "—", color: "text-[var(--ep-green)]" },
              ]).map((item, i) => (
                <div key={`k-${i}`} className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                  <p className={cn("text-lg font-bold", item.color)}>{item.val}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Buyurtma Holati</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5">
                {Object.entries(prod?.orderBreakdown ?? {}).map(([status, cnt]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", {
                      "bg-emerald-500": status === "completed",
                      "bg-blue-500": status === "production",
                      "bg-amber-500": status === "pending",
                      "bg-red-500": status === "cancelled",
                      "bg-gray-400": !["completed","production","pending","cancelled"].includes(status),
                    })} />
                    <span className="text-xs text-muted-foreground capitalize">{status}</span>
                    <span className="text-xs font-semibold text-foreground ml-auto">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
            {prod?.sessionsToday && prod.sessionsToday.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Mashinalar: {runningMachines}/{totalMachines} ishlamoqda</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {(Array.isArray(prod?.sessionsToday) ? prod.sessionsToday : []).slice(0, 9).map(s => <MachineCell key={s.id} session={s} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
