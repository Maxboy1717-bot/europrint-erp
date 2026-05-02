import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary-container text-on-primary-container",
        secondary:
          "bg-surface-container text-on-surface-variant",
        destructive:
          "bg-red-100 text-red-800",
        outline:
          "border border-outline-variant/40 text-on-surface-variant",
        success:
          "bg-green-100 text-green-800",
        warning:
          "bg-amber-100 text-amber-800",
        info:
          "bg-primary-container text-on-primary-container",
        error:
          "bg-red-100 text-red-800",
        yangi:
          "bg-surface-container text-on-surface-variant",
        tasdiqlangan:
          "bg-primary-container text-on-primary-container",
        ishlab_chiqarishda:
          "bg-amber-100 text-amber-800",
        tayyor:
          "bg-green-100 text-green-800",
        jonatildi:
          "bg-primary-container text-on-primary-container",
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
