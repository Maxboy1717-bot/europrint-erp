import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

interface DedicatedPageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Placeholder sahifalardan dedicated sahifaga o'tkazishda
 * standart shell — ARCHITECTURE.md §40.4 talab.
 */
export function DedicatedPageShell({
  title,
  description,
  actions,
  children,
}: DedicatedPageShellProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  icon?: ReactNode;
  variant?: "default" | "warning" | "success" | "danger";
}

const VARIANT_COLORS: Record<NonNullable<KpiCardProps["variant"]>, string> = {
  default: "text-blue-600",
  warning: "text-yellow-600",
  success: "text-emerald-600",
  danger: "text-rose-600",
};

export function KpiCard({ label, value, trend, trendValue, icon, variant = "default" }: KpiCardProps) {
  const colorClass = VARIANT_COLORS[variant];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        {trendValue ? (
          <p className="text-xs text-muted-foreground mt-1">
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
