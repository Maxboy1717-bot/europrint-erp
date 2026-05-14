/**
 * @module QCDashboardHelpers
 * @description Small, reusable UI helper components for the QC Dashboard:
 * KpiCard and StreamCard.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── KpiCard ──────────────────────────────────────────────────────────────────

export interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}

export function KpiCard({ title, value, sub, icon: Icon, color, loading }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        {loading ? (
          <>
            <Skeleton className="h-4 w-20 mb-2 rounded-lg" />
            <Skeleton className="h-8 w-12 mb-1 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("w-4 h-4", color)} />
              <span className="text-xs font-medium text-muted-foreground">{title}</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── StreamCard ───────────────────────────────────────────────────────────────

export interface StreamCardProps {
  label: string;
  status: "ok" | "warning" | "active" | "needs_attention";
  children: React.ReactNode;
  icon: React.ElementType;
}

export function StreamCard({ label, status, children, icon: Icon }: StreamCardProps) {
  const statusBadge = {
    ok:              { label: "Normal",        cls: "bg-green-50 text-[var(--ep-green)]" },
    warning:         { label: "Diqqat",         cls: "bg-amber-50 text-[var(--ep-yellow)]" },
    active:          { label: "Faol",           cls: "bg-blue-50 text-[var(--ep-blue)]" },
    needs_attention: { label: "E'tibor kerak", cls: "bg-orange-50 text-[var(--ep-primary)]" },
  }[status];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span>{label}</span>
          <Badge className={cn("ml-auto text-xs", statusBadge.cls)}>{statusBadge.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
