/** @module HRMilestones — Route: /hr/milestones */
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ResponsiveContainer } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trophy, Calendar, CheckCircle2, Star, Filter } from "lucide-react";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

type MilestoneType = "anniversary" | "promotion" | "certification" | "achievement";

interface Milestone {
  id: string | number;
  employee_id: string | number;
  full_name: string;
  department: string;
  milestone_type: MilestoneType;
  milestone_date: string;
  description: string;
  is_completed: boolean;
  points_awarded?: number | null;
}

const TYPE_CONFIG: Record<MilestoneType, { labelKey: string; variant: string; colorClass: string }> = {
  anniversary:   { labelKey: "milestones.typeAnniversary",   variant: "info",    colorClass: "bg-blue-50 text-blue-700 border-blue-200" },
  promotion:     { labelKey: "milestones.typePromotion",     variant: "purple",  colorClass: "bg-purple-50 text-purple-700 border-purple-200" },
  certification: { labelKey: "milestones.typeCertification", variant: "success", colorClass: "bg-green-50 text-green-700 border-green-200" },
  achievement:   { labelKey: "milestones.typeAchievement",   variant: "warning", colorClass: "bg-yellow-50 text-yellow-700 border-yellow-200" },
};

const TYPE_FILTER_OPTIONS = [
  { value: "all",           labelKey: "common.all" },
  { value: "anniversary",   labelKey: "milestones.typeAnniversary" },
  { value: "promotion",     labelKey: "milestones.typePromotion" },
  { value: "certification", labelKey: "milestones.typeCertification" },
  { value: "achievement",   labelKey: "milestones.typeAchievement" },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function TypeBadge({ type, t }: { type: MilestoneType; t: (key: string) => string }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.achievement;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.colorClass}`}>
      {t(cfg.labelKey)}
    </span>
  );
}

function CompletedBadge({ done, t }: { done: boolean; t: (key: string) => string }) {
  return done ? (
    <Badge variant="success">{t("common.yes")}</Badge>
  ) : (
    <Badge variant="neutral">{t("common.no")}</Badge>
  );
}

interface StatsCardsProps {
  all: Milestone[];
  t: (key: string) => string;
}

function StatsCards({ all, t }: StatsCardsProps) {
  const safeAll = Array.isArray(all) ? all : [];

  const now = new Date();
  const thisMonth = safeAll.filter((m) => {
    if (!m.milestone_date) return false;
    const d = new Date(m.milestone_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalCompleted = safeAll.filter((m) => m.is_completed).length;
  const totalPoints = safeAll.reduce((acc, m) => acc + (m.points_awarded ?? 0), 0);

  const stats: Array<{ label: string; value: number; icon: React.ReactNode; bg: string }> = [
    { label: t("milestones.thisMonth"), value: thisMonth, icon: <Calendar className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
    { label: t("milestones.completed"), value: totalCompleted, icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: "bg-green-50" },
    { label: t("milestones.totalPoints"), value: totalPoints, icon: <Star className="w-5 h-5 text-yellow-500" />, bg: "bg-yellow-50" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface MilestoneTableProps {
  milestones: Milestone[];
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  typeFilter: string;
  onTypeFilter: (v: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function MilestoneTable({ milestones, isLoading, isError, error, onRetry, typeFilter, onTypeFilter, t }: MilestoneTableProps) {
  const safe = Array.isArray(milestones) ? milestones : [];
  const filtered = typeFilter === "all"
    ? safe
    : safe.filter((m) => m.milestone_type === typeFilter);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <EPErrorState variant="inline" error={error} onRetry={onRetry} />;
  }

  return (
    <>
      {/* Filter row */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Select value={typeFilter} onValueChange={onTypeFilter}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder={t("milestones.filterByType")} />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{t("common.countItems", { n: filtered.length })}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
          {t("milestones.notFound")}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t("employee")}</TableHead>
              <TableHead>{t("department")}</TableHead>
              <TableHead>{t("milestones.colType")}</TableHead>
              <TableHead>{t("milestones.colDate")}</TableHead>
              <TableHead className="max-w-[200px]">{t("milestones.colDescription")}</TableHead>
              <TableHead className="text-center">{t("milestones.colDone")}</TableHead>
              <TableHead className="text-center">{t("milestones.colPoints")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id} className="hover:bg-muted/30">
                <TableCell className="pl-4 font-medium text-sm">{m.full_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.department}</TableCell>
                <TableCell>
                  <TypeBadge type={m.milestone_type} t={t} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(m.milestone_date)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {m.description}
                </TableCell>
                <TableCell className="text-center">
                  <CompletedBadge done={m.is_completed} t={t} />
                </TableCell>
                <TableCell className="text-center text-sm font-medium">
                  {m.points_awarded != null ? (
                    <span className="text-yellow-600">{m.points_awarded}</span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

export default function HRMilestones() {
  const { t } = useTranslation("hr");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: allData, isLoading: isLoadingAll, isError: isErrorAll, error: errorAll, refetch: refetchAll } = useQuery<Milestone[]>({
    queryKey: ["/api/hr/milestones"],
  });

  const { data: upcomingData, isLoading: isLoadingUpcoming, isError: isErrorUpcoming, error: errorUpcoming, refetch: refetchUpcoming } = useQuery<Milestone[]>({
    queryKey: ["/api/hr/milestones/upcoming?days=30"],
  });

  const allMilestones = Array.isArray(allData) ? allData : [];
  const upcomingMilestones = Array.isArray(upcomingData) ? upcomingData : [];

  return (
    <ResponsiveContainer>
      {/* Header */}
      <PageHeader
        title={t("milestones.tracker")}
        description={t("milestones.trackerDesc")}
        icon={<Trophy className="w-6 h-6 text-primary" />}
      />

      {/* Stats */}
      <StatsCards all={allMilestones} t={t} />

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {t("milestones.tabUpcoming")}
            {!isLoadingUpcoming && (
              <span className="ml-1 bg-primary/15 text-primary text-[10px] font-bold px-1.5 rounded-full">
                {upcomingMilestones.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            {t("milestones.tabAll")}
            {!isLoadingAll && (
              <span className="ml-1 bg-muted text-muted-foreground text-[10px] font-bold px-1.5 rounded-full">
                {allMilestones.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {t("milestones.upcoming30Title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MilestoneTable
                milestones={upcomingMilestones}
                isLoading={isLoadingUpcoming}
                isError={isErrorUpcoming}
                error={errorUpcoming}
                onRetry={() => refetchUpcoming()}
                typeFilter={typeFilter}
                onTypeFilter={setTypeFilter}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                {t("milestones.allTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MilestoneTable
                milestones={allMilestones}
                isLoading={isLoadingAll}
                isError={isErrorAll}
                error={errorAll}
                onRetry={() => refetchAll()}
                typeFilter={typeFilter}
                onTypeFilter={setTypeFilter}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ResponsiveContainer>
  );
}
