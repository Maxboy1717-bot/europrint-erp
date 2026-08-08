/**
 * @module DedicatedPageShell
 * @description React UI component.
 */

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EPPageHeader } from "@/components/ep";
import type { EPModuleColor } from "@/components/ep/EPCard";
import { useTranslation } from '@/lib/i18n';

interface DedicatedPageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Optional header icon (rendered in a module-tinted tile — §3.6 signature). */
  icon?: ReactNode;
  /** Module accent for the header icon tile (§3.6 wayfinding). */
  module?: EPModuleColor;
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
  icon,
  module,
}: DedicatedPageShellProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{title}</b></>}
        title={title}
        subtitle={description}
        actions={actions}
        icon={icon}
        module={module}
      />
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
  default: "text-[var(--ep-blue)]",
  warning: "text-[var(--ep-yellow)]",
  success: "text-[var(--ep-green)]",
  danger: "text-[var(--ep-red)]",
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
