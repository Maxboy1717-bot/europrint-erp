/**
 * @module badge
 * @description React UI component.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary",
        secondary:
          "bg-muted text-muted-foreground border border-border",
        destructive:
          "bg-destructive/10 text-destructive",
        outline:
          "border border-border text-foreground",
        success:
          "bg-success/10 text-success",
        warning:
          "bg-warning/15 text-warning",
        info:
          "bg-info/10 text-info",
        error:
          "bg-destructive/10 text-destructive",
        yangi:
          "bg-muted text-muted-foreground border border-border",
        tasdiqlangan:
          "bg-primary/10 text-primary",
        ishlab_chiqarishda:
          "bg-warning/15 text-warning",
        tayyor:
          "bg-success/10 text-success",
        jonatildi:
          "bg-info/10 text-info",
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
