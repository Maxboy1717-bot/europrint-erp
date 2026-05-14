/**
 * @module card
 * @description React UI component.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Aligned with EuroPrint Design System ("EP Linear Soft") canonical card spec:
 *   border:        1px solid var(--ep-border) (#EBEAE6)
 *   border-radius: 10px (--r-lg)
 *   background:    var(--ep-surface) (#FFFFFF)
 *   shadow:        none by default (uses --sh-sm on hover when .hover-lift)
 *   header pad:    14px 18px
 *   body pad:      18px
 *   title:         14px / 600 (--fs-md / --fw-semibold)
 *
 * Add `className="hover-lift"` (or pass via prop) to enable the
 * translateY(-3px) + tinted-shadow hover. Default cards are static.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[10px] border border-border bg-card text-card-foreground transition-all duration-300 [transition-timing-function:cubic-bezier(.25,1,.5,1)]",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // DS: 14px 18px header padding, 1px bottom border separates from body
    className={cn("flex flex-col space-y-1 px-[18px] py-[14px] border-b border-border", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // DS card title: 14px / 600 (--fs-md / --fw-semibold), no negative tracking
    className={cn(
      "text-[14px] font-semibold leading-snug text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[12px] text-muted-foreground mt-0.5", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // DS: 18px body padding (top retains separation from header border)
  <div ref={ref} className={cn("p-[18px]", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center px-[18px] py-[14px] gap-2 border-t border-border", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
