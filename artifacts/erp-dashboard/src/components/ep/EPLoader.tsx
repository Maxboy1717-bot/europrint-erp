/**
 * @module EPLoader
 * @description Canonical EuroPrint inline spinner — wraps `<Loader2>` with
 *   consistent sizing (h-4 w-4 default, customizable), primary tint, and the
 *   `ep-spin` animation token. Use this anywhere we'd otherwise scatter
 *   `<EPLoader className="h-N w-N" />` across pages.
 *
 *   For full-page loading splash, use `<EPSpinnerBlock>` (also exported here).
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EPLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lucide icon size in pixels. Default 16. */
  size?: number;
  /** Tone — affects colour. */
  tone?: "primary" | "muted" | "white";
}

export function EPLoader({ size = 16, tone = "primary", className, ...props }: EPLoaderProps) {
  const colorClass =
    tone === "white" ? "text-white" :
    tone === "muted" ? "text-muted-foreground" :
                       "text-primary";
  return (
    <Loader2
      className={cn(colorClass, "animate-spin", className)}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}

interface EPSpinnerBlockProps {
  /** Optional small caption below the spinner. */
  caption?: React.ReactNode;
  /** Center inside the available area (default) or full viewport. */
  fullScreen?: boolean;
  className?: string;
}

export function EPSpinnerBlock({ caption, fullScreen, className }: EPSpinnerBlockProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" : "py-12",
        className,
      )}
    >
      <EPLoader size={28} tone="primary" />
      {caption && <p className="text-[13px] text-muted-foreground">{caption}</p>}
    </div>
  );
}
