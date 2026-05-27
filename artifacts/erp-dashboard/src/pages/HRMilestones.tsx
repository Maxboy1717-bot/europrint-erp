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

const TYPE_CONFIG: Record<MilestoneType, { label: string; variant: string; colorClass: string }> = {
  anniversary:   { label: "Yillik",         variant: "info",    colorClass: "bg-blue-50 text-blue-700 border-blue-200" },
  promotion:     { label: "Lavozim oshishi", variant: "purple",  colorClass: "bg-purple-50 text-purple-700 border-purple-200" },
  certification: { label: "Sertifikat",      variant: "success", colorClass: "bg-green-50 text-green-700 border-green-200" },
  achievement:   { label: "Yutuq",           variant: "warning", colorClass: "bg-yellow-50 text-yellow-700 border-yellow-200" },
};

const TYPE_FILTER_OPTIONS = [
  { value: "all",           label: "Barchasi" },
  { value: "anniversary",   label: "Yillik" },
  { value: "promotion",     label: "Lavozim oshishi" },
  { value: "certification", label: "Sertifikat" },
  { value: "achievement",   label: "Yutuq" },
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

function TypeBadge({ type }: { type: MilestoneType }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.achievement;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.colorClass}`}>
      {cfg.label}
    </span>
  );
}

function CompletedBadge({ done }: { done: boolean }) {
  return done ? (
    <Badge variant="success">Ha</Badge>
  ) : (
    <Badge variant="neutral">Yo'q</Badge>
  );
}

interface StatsCardsProps {
  all: Milestone[];
}

function StatsCards({ all }: StatsCardsProps) {
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
    { label: "Bu oyda", value: thisMonth, icon: <Calendar className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
    { label: "Bajarilgan", value: totalCompleted, icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: "bg-green-50" },
    { label: "Jami ball", value: totalPoints, icon: <Star className="w-5 h-5 text-yellow-500" />, bg: "bg-yellow-50" },
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
  typeFilter: string;
  onTypeFilter: (v: string) => void;
}

function MilestoneTable({ milestones, isLoading, typeFilter, onTypeFilter }: MilestoneTableProps) {
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

  return (
    <>
      {/* Filter row */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Select value={typeFilter} onValueChange={onTypeFilter}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder="Tur bo'yicha filter" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} ta</span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Ma'lumot topilmadi
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Xodim</TableHead>
              <TableHead>Bo'lim</TableHead>
              <TableHead>Tur</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead className="max-w-[200px]">Tavsif</TableHead>
              <TableHead className="text-center">Bajarildi</TableHead>
              <TableHead className="text-center">Ball</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id} className="hover:bg-muted/30">
                <TableCell className="pl-4 font-medium text-sm">{m.full_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.department}</TableCell>
                <TableCell>
                  <TypeBadge type={m.milestone_type} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(m.milestone_date)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {m.description}
                </TableCell>
                <TableCell className="text-center">
                  <CompletedBadge done={m.is_completed} />
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
  const { t } = useTranslation("common");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: allData, isLoading: isLoadingAll } = useQuery<Milestone[]>({
    queryKey: ["/api/hr/milestones"],
  });

  const { data: upcomingData, isLoading: isLoadingUpcoming } = useQuery<Milestone[]>({
    queryKey: ["/api/hr/milestones/upcoming?days=30"],
  });

  const allMilestones = Array.isArray(allData) ? allData : [];
  const upcomingMilestones = Array.isArray(upcomingData) ? upcomingData : [];

  return (
    <ResponsiveContainer>
      {/* Header */}
      <PageHeader
        title="Milestone Tracker"
        description="Xodimlarning muhim yutuqlari va hodisalarini kuzatish"
        icon={<Trophy className="w-6 h-6 text-primary" />}
      />

      {/* Stats */}
      <StatsCards all={allMilestones} />

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Kelayotgan
            {!isLoadingUpcoming && (
              <span className="ml-1 bg-primary/15 text-primary text-[10px] font-bold px-1.5 rounded-full">
                {upcomingMilestones.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            Barchasi
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
                Kelgusi 30 kun ichidagi milestonelar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MilestoneTable
                milestones={upcomingMilestones}
                isLoading={isLoadingUpcoming}
                typeFilter={typeFilter}
                onTypeFilter={setTypeFilter}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                Barcha milestonelar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MilestoneTable
                milestones={allMilestones}
                isLoading={isLoadingAll}
                typeFilter={typeFilter}
                onTypeFilter={setTypeFilter}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ResponsiveContainer>
  );
}
