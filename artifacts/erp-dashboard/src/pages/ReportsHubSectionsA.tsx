/**
 * @module ReportsHubSectionsA
 * @description Helper components, StatsGrid, and CategoryGrid for ReportsHub.
 *   - CategoryIcon    — internal icon renderer
 *   - StatusBadge     — exported status badge
 *   - scheduleLabel   — exported schedule label helper
 *   - StatsGrid       — four KPI stat cards at the top
 *   - CategoryGrid    — clickable category tiles
 */

import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AiReportCategory } from "@shared/schema";
import { iconMap, type Translations } from "./ReportsHubTypes";

// ---------------------------------------------------------------------------
// Helper: render a category icon
// ---------------------------------------------------------------------------

function CategoryIcon({ iconName }: { iconName: string | null }) {
  const Icon = iconMap[iconName ?? ""] ?? FileText;
  return <Icon className="h-5 w-5" />;
}

// ---------------------------------------------------------------------------
// Helper: status badge
// ---------------------------------------------------------------------------

export function StatusBadge({ status, tr }: { status: string; tr: Translations }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    running: "secondary",
    failed: "destructive",
    pending: "outline",
  };
  const labels: Record<string, string> = {
    completed: tr.completed,
    running: tr.running,
    failed: tr.failed,
    pending: tr.pending,
  };
  return (
    <Badge variant={variants[status] ?? "outline"} data-testid={`badge-status-${status}`}>
      {labels[status] ?? status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Helper: schedule label
// ---------------------------------------------------------------------------

export function scheduleLabel(schedule: string | null, tr: Translations): string {
  const labels: Record<string, string> = {
    daily: tr.daily,
    weekly: tr.weekly,
    monthly: tr.monthly,
    realtime: tr.realtime,
  };
  return labels[schedule ?? "daily"] ?? (schedule ?? "");
}

// ---------------------------------------------------------------------------
// StatsGrid
// ---------------------------------------------------------------------------

interface StatsGridProps {
  totalReports: number;
  runsToday: number;
  insightsGenerated: number;
  activeSubscriptions: number;
  tr: Translations;
}

export function StatsGrid({
  totalReports,
  runsToday,
  insightsGenerated,
  activeSubscriptions,
  tr,
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card rounded-lg p-5" data-testid="card-stat-total-reports">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tr.totalReports}
        </p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-total-reports">
          {totalReports}
        </p>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-stat-runs-today">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tr.runsToday}
        </p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-runs-today">
          {runsToday}
        </p>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-stat-insights">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tr.insightsGenerated}
        </p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-insights-count">
          {insightsGenerated}
        </p>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-stat-subscriptions">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tr.activeSubscriptions}
        </p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-active-subs">
          {activeSubscriptions}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CategoryGrid
// ---------------------------------------------------------------------------

interface CategoryGridProps {
  categories: AiReportCategory[];
  lang: string;
  tr: Translations;
  onSelect: (id: number) => void;
}

export function CategoryGrid({ categories, lang, tr, onSelect }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-categories">
          {tr.noReports}. {tr.seedButton}.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="bg-card rounded-lg p-5 hover:bg-muted/40 cursor-pointer hover-elevate transition-all"
          onClick={() => onSelect(cat.id)}
          data-testid={`card-category-${cat.code}`}
        >
          <div className="flex items-start gap-3">
            <div
              className="rounded-md p-2"
              style={{ backgroundColor: `${cat.color}20` }}
            >
              <span style={{ color: cat.color ?? undefined }}>
                <CategoryIcon iconName={cat.icon} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" data-testid={`text-cat-name-${cat.code}`}>
                {lang === "ru" ? cat.nameRu : cat.name}
              </p>
              <p className="text-xs text-muted-foreground" data-testid={`text-cat-count-${cat.code}`}>
                {cat.reportCount ?? 0} {tr.reportCount}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
