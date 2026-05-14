/**
 * @module EPStatusPill
 * @description Canonical EuroPrint status chip — colored dot + soft tint
 *   background + colored text. Replaces ad-hoc Badge usage that pulls raw
 *   Tailwind color classes (`bg-green-500`, `bg-yellow-200`, etc.).
 *
 *   The tone names map to common ERP statuses:
 *
 *     success → Faol · Tugallandi · Tasdiqlangan
 *     warning → Kutilmoqda · Diqqat · Muddat tugayapti
 *     danger  → Bekor qilingan · Xato · Muddati o'tgan
 *     info    → Yangi · Tekshiruvda · Boshlanmagan
 *     brand   → Featured / VIP (orange)
 *     neutral → Default (no semantic meaning)
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export type EPStatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "brand"
  | "neutral";

interface EPStatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: EPStatusTone;
  /** Hide the leading 6px dot (occasionally useful inside dense tables). */
  hideDot?: boolean;
  /** Use larger 12px font + bigger padding (default is the dense 11px form). */
  size?: "sm" | "md";
}

const toneClass: Record<EPStatusTone, string> = {
  success: "ep-pill--success",
  warning: "ep-pill--warning",
  danger:  "ep-pill--danger",
  info:    "ep-pill--info",
  brand:   "ep-pill--brand",
  neutral: "",
};

const neutralStyle: React.CSSProperties = {
  background: "hsl(var(--muted))",
  color: "hsl(var(--muted-foreground))",
};

export function EPStatusPill({
  tone,
  hideDot,
  size = "sm",
  className,
  style,
  children,
  ...props
}: EPStatusPillProps) {
  return (
    <span
      className={cn(
        "ep-pill",
        toneClass[tone],
        size === "md" && "px-3 py-1 text-[12px]",
        hideDot && "[&::before]:hidden",
        className,
      )}
      style={{
        ...(tone === "neutral" ? neutralStyle : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
