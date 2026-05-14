/**
 * @module badge
 * @description React UI component.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Aligned with EuroPrint Design System status pill spec:
 *   padding:      4px 11px
 *   font-size:    11.5px (we round to 12px in Tailwind step)
 *   font-weight:  600
 *   border-radius: 9999px (--r-pill, true pill)
 *   leading dot:  6px circle in currentColor (before pseudo)
 *
 * 8 canonical variants: success / warning / danger / info / primary / coral /
 * purple / neutral. Plus shadcn legacy (default/secondary/destructive/outline)
 * and Uzbek workflow states (yangi/tasdiqlangan/ishlab_chiqarishda/tayyor/jonatildi).
 *
 * Each variant uses soft background (10–18% opacity tint) + saturated text color
 * for the muted-industrial look mandated by DS section 3.1.
 */
const badgeVariants = cva(
  // DS pill base: 4px 11px padding, 11.5px / 600, true pill radius, leading dot
  "whitespace-nowrap inline-flex items-center gap-[5px] rounded-full px-[11px] py-[4px] text-[11.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/15 focus:ring-offset-1 before:content-[''] before:inline-block before:w-[6px] before:h-[6px] before:rounded-full before:bg-current",
  {
    variants: {
      variant: {
        // ── DS canonical 8 variants ────────────────────────────────────────
        default:
          "bg-[var(--ep-primary-soft)] text-[var(--ep-primary)]",
        primary:
          "bg-[var(--ep-primary-soft)] text-[var(--ep-primary)]",
        success:
          "bg-[rgba(46,138,90,.12)] text-[var(--ep-green)]",
        warning:
          "bg-[rgba(181,137,28,.14)] text-[var(--ep-yellow)]",
        danger:
          "bg-[rgba(192,67,47,.12)] text-[var(--ep-red)]",
        info:
          "bg-[rgba(53,99,172,.12)] text-[var(--ep-blue)]",
        coral:
          "bg-[rgba(233,69,96,.14)] text-[#E94560]",
        purple:
          "bg-[rgba(122,79,177,.12)] text-[var(--ep-purple)]",
        neutral:
          "bg-[#F0E6E1] text-muted-foreground before:bg-[var(--ep-muted)]",
        // ── shadcn legacy aliases ──────────────────────────────────────────
        secondary:
          "bg-[#F0E6E1] text-muted-foreground border border-border before:bg-[var(--ep-muted)]",
        destructive:
          "bg-[rgba(192,67,47,.12)] text-[var(--ep-red)]",
        outline:
          "bg-transparent border border-border text-foreground before:bg-current",
        error:
          "bg-[rgba(192,67,47,.12)] text-[var(--ep-red)]",
        // ── Uzbek workflow states (semantic mapping) ───────────────────────
        yangi:
          "bg-[#F0E6E1] text-muted-foreground before:bg-[var(--ep-muted)]",
        tasdiqlangan:
          "bg-[var(--ep-primary-soft)] text-[var(--ep-primary)]",
        ishlab_chiqarishda:
          "bg-[rgba(181,137,28,.14)] text-[var(--ep-yellow)]",
        tayyor:
          "bg-[rgba(46,138,90,.12)] text-[var(--ep-green)]",
        jonatildi:
          "bg-[rgba(53,99,172,.12)] text-[var(--ep-blue)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }
