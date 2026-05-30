/**
 * @module EPSkeleton
 * @description Canonical EuroPrint skeleton loaders for the three most
 *   common loading shapes:
 *
 *     <EPSkeletonKpiRow>      — 4 KPI tiles (used while dashboard stats fetch)
 *     <EPSkeletonTable rows={n} cols={m}>
 *     <EPSkeletonCard lines={n}>
 *
 *   All use the same warm muted-bg pulse — no shimmer or animated gradient
 *   (those are reserved for hover sweeps on primary CTAs). The pulse is
 *   slowed to 1.5s (matches Linear's pace) and respects reduced-motion.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { EPCard } from "./EPCard";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function EPSkeletonBar({ className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("rounded-md", className)}
      style={{
        background: "hsl(var(--muted))",
        animation: "ep-pulse 1.5s var(--ease-in-out) infinite",
        animationDuration: "1.5s",
        ...style,
      }}
      {...props}
    />
  );
}

export function EPSkeletonKpiRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <EPCard key={i} padding={14}>
          <div className="flex items-start gap-3">
            <EPSkeletonBar className="h-[42px] w-[42px] rounded-full" />
            <div className="flex-1 space-y-2">
              <EPSkeletonBar className="h-2.5 w-20" />
              <EPSkeletonBar className="h-6 w-24" />
            </div>
          </div>
        </EPCard>
      ))}
    </div>
  );
}

export function EPSkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <EPCard padding={0}>
      <div className="px-[18px] py-3 border-b border-border flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <EPSkeletonBar key={i} className="h-2.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-[18px] py-3 border-b border-border last:border-b-0 flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <EPSkeletonBar key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </EPCard>
  );
}

export function EPSkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <EPCard>
      <EPSkeletonBar className="h-3 w-1/3 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <EPSkeletonBar key={i} className="h-2.5 mb-2 last:mb-0" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </EPCard>
  );
}
