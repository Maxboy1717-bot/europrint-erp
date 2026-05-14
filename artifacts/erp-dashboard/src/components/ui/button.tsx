/**
 * @module button
 * @description React UI component.
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Aligned with EuroPrint Design System ("EP Linear Soft").
 * Tokens used: --ep-primary, --ep-primary-dark, --sh-primary, --r-lg (10px).
 * - Default radius: 10px (--r-lg) per DS button spec
 * - Default size: 36px height, 18px horizontal padding, 13px font (DS body)
 * - `default` variant carries brand shadow + shimmer; hover darkens to primary-dark
 * - All variants use semantic Tailwind tokens (bg-primary, bg-card, text-muted-foreground)
 *   which resolve to the design-system CSS variables.
 */
const buttonVariants = cva(
  // base — DS button: rounded-[10px] (--r-lg), 13px text, 600 weight, ease-out-quart transition
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[13px] font-semibold transition-all duration-200 [transition-timing-function:cubic-bezier(.25,1,.5,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[15px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary CTA — brand orange + brand-tinted shadow (--sh-primary)
        default:
          "bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(255,144,47,.32)] hover:bg-[var(--ep-primary-dark)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(255,144,47,.40)] active:translate-y-0",
        solid:
          "bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(255,144,47,.32)] hover:bg-[var(--ep-primary-dark)]",
        // Destructive — uses --ep-red via semantic token
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Secondary — white card with warm border, fades to blush tint on hover
        outline:
          "border border-border bg-card text-foreground hover:bg-[var(--bg-blush-soft,#FBF1ED)] hover:border-primary hover:text-primary",
        secondary:
          "bg-card border border-border text-foreground hover:bg-[var(--bg-blush-soft,#FBF1ED)] hover:border-primary hover:text-primary",
        // Dark — near-black slab for high-emphasis non-brand actions
        dark:
          "bg-[#15171A] text-white hover:bg-[#2A2D33]",
        // Ghost — transparent, blush hover
        ghost:
          "text-muted-foreground hover:bg-[var(--bg-blush-soft,#FBF1ED)] hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // DS spec: 10px 18px padding, 13px text → ~36px height
        default: "h-9 px-[18px] py-[10px]",
        sm: "h-8 rounded-[10px] px-3 text-[12px]",
        lg: "h-10 rounded-[10px] px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
// CI trigger after main update with lib/db build
