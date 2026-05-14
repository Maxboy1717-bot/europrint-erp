/**
 * DIZAYN-NEW: EmptyState + Skeleton Loading komponentlari
 * Vazifa 5: Ma'lumot yo'q holat + loading skeleton
 * Har sahifada qo'llaniladi
 */
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  FolderOpen,
  Users,
  FileText,
  AlertCircle,
  WifiOff,
  PackageOpen,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmptyVariant =
  | "default"
  | "search"
  | "employees"
  | "documents"
  | "error"
  | "offline"
  | "empty-box";

interface EmptyStateProps {
  variant?: EmptyVariant;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// ─── Variant presets ─────────────────────────────────────────────────────────

const VARIANT_MAP: Record<EmptyVariant, {
  icon: React.ElementType;
  title: string;
  description: string;
}> = {
  default:    { icon: FolderOpen,   title: "Ma'lumot topilmadi",       description: "Hali hech qanday yozuv qo'shilmagan." },
  search:     { icon: Search,       title: "Natija topilmadi",          description: "Boshqa kalit so'z bilan qidirib ko'ring." },
  employees:  { icon: Users,        title: "Xodimlar topilmadi",        description: "Hali hech qanday xodim qo'shilmagan yoki filtr natijasi bo'sh." },
  documents:  { icon: FileText,     title: "Hujjatlar yo'q",            description: "Yangi hujjat qo'shish uchun tugmani bosing." },
  error:      { icon: AlertCircle,  title: "Xatolik yuz berdi",         description: "Ma'lumotlarni yuklashda xatolik. Sahifani yangilang." },
  offline:    { icon: WifiOff,      title: "Tarmoq ulanishi yo'q",      description: "Internet ulanishingizni tekshirib, qayta urinib ko'ring." },
  "empty-box":{ icon: PackageOpen,  title: "Ro'yxat bo'sh",             description: "Birinchi yozuvni qo'shish uchun '+ Qo'shish' tugmasini bosing." },
};

const SIZE_MAP = {
  sm: { wrapper: "py-8", iconBox: "w-12 h-12",  icon: "w-5 h-5", title: "text-sm",  desc: "text-xs"  },
  md: { wrapper: "py-12", iconBox: "w-16 h-16", icon: "w-7 h-7", title: "text-base",desc: "text-sm"  },
  lg: { wrapper: "py-20", iconBox: "w-20 h-20", icon: "w-9 h-9", title: "text-lg",  desc: "text-sm"  },
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const preset = VARIANT_MAP[variant];
  const DefaultIcon = preset.icon;
  const sizes = SIZE_MAP[size];

  const isError = variant === "error" || variant === "offline";

  return (
    <div
      role="status"
      aria-label={title ?? preset.title}
      className={cn(
        "flex flex-col items-center justify-center text-center px-6",
        sizes.wrapper,
        className
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "flex items-center justify-center rounded-xl mb-4",
          sizes.iconBox,
          isError
            ? "bg-[hsl(var(--error))]/10"
            : "bg-muted"
        )}
        aria-hidden="true"
      >
        {icon ?? (
          <DefaultIcon
            className={cn(
              sizes.icon,
              isError ? "text-[hsl(var(--error))]" : "text-muted-foreground"
            )}
          />
        )}
      </div>

      {/* Text */}
      <h3 className={cn("font-semibold text-foreground mb-1", sizes.title)}>
        {title ?? preset.title}
      </h3>
      <p className={cn("text-muted-foreground max-w-xs", sizes.desc)}>
        {description ?? preset.description}
      </p>

      {/* Action */}
      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  hasCheckbox?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
  hasCheckbox = true,
  className,
}: TableSkeletonProps) {
  const colCount = cols + (hasCheckbox ? 1 : 0) + 1; // +1 for actions

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-[var(--shadow-md)] overflow-hidden",
        className
      )}
      role="status"
      aria-label="Ma'lumotlar yuklanmoqda"
      aria-busy="true"
    >
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Table */}
      <table className="w-full" aria-hidden="true">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {hasCheckbox && <th className="w-10 px-4 py-3"><Skeleton className="w-4 h-4 rounded rounded-lg" /></th>}
            {Array.from({ length: cols }).map((_, i) => (
              <th key={`k-${i}`} className="px-4 py-3">
                <Skeleton className="h-3.5 w-20 rounded rounded-lg" />
              </th>
            ))}
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border last:border-0">
              {hasCheckbox && <td className="px-4 py-3"><Skeleton className="w-4 h-4 rounded rounded-lg" /></td>}
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  {colIdx === 0 ? (
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-28 rounded rounded-lg" />
                    </div>
                  ) : (
                    <Skeleton className={cn("h-4 rounded", colIdx === cols - 1 ? "w-16" : "w-24")} />
                  )}
                </td>
              ))}
              <td className="px-4 py-3"><Skeleton className="w-6 h-6 rounded rounded-lg" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Card Skeleton ────────────────────────────────────────────────────────────

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 1, className }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={`k-${i}`}
          className={cn("border border-border rounded-xl shadow-[var(--shadow-md)]", className)}
          role="status"
          aria-label="Karta yuklanmoqda"
          aria-busy="true"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="w-16 h-5 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24 mb-1 rounded rounded-lg" />
            <Skeleton className="h-3 w-32 mb-4 rounded rounded-lg" />
            <Skeleton className="h-10 w-full rounded mb-3 rounded-lg" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20 rounded rounded-lg" />
                <Skeleton className="h-3 w-8 rounded rounded-lg" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

// ─── Stats Grid Skeleton ──────────────────────────────────────────────────────

export function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <CardSkeleton count={4} />
    </div>
  );
}

// ─── Page Skeleton ────────────────────────────────────────────────────────────

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="Sahifa yuklanmoqda">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded rounded-lg" />
        <Skeleton className="h-4 w-64 rounded rounded-lg" />
      </div>

      {/* Stats */}
      <StatsGridSkeleton />

      {/* Table */}
      <TableSkeleton rows={8} cols={4} />
    </div>
  );
}

export default EmptyState;
