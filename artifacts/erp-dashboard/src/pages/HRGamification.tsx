/**
 * @module HRGamification
 * @description Gamification leaderboard page. Route: /hr/gamification
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Trophy, Medal, Users, Star, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

interface LeaderboardEntry {
  id: string | number;
  employee_id?: string | number;
  full_name: string;
  department?: string;
  score: number;
  level?: number;
  badges_count?: number;
  rank: number;
}

type Period = "monthly" | "quarterly" | "total";

const PERIOD_TABS: { value: Period; label: string }[] = [
  { value: "monthly",   label: "Oylik" },
  { value: "quarterly", label: "Kvartal" },
  { value: "total",     label: "Jami" },
];

const RANK_COLORS = ["bg-yellow-50 border-yellow-200", "bg-gray-50 border-gray-200", "bg-orange-50 border-orange-200"];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-orange-400" />;
  return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function HRGamification() {
  const { t } = useTranslation("common");
  const [period, setPeriod] = useState<Period>("monthly");

  const { data: rawData, isLoading, isError } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/hr/gamification/leaderboard", period],
    queryFn: () => apiRequest("GET", `/api/hr/gamification/leaderboard?period=${period}`),
  });

  const entries = Array.isArray(rawData) ? rawData : [];

  const totalParticipants = entries.length;
  const topScore = entries.length > 0 ? Math.max(...entries.map((e) => e.score)) : 0;
  const avgScore =
    entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length)
      : 0;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 px-1 pb-4 flex items-center gap-3">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h1 className="font-semibold text-base">Gamifikatsiya</h1>
        <span className="text-xs text-muted-foreground ml-1">Reyting jadvali</span>
      </div>

      <div className="flex-1 overflow-auto space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2.5">
                <Users className="h-4 w-4 text-[var(--ep-blue)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-blue)]">{totalParticipants}</div>
                <div className="text-xs text-muted-foreground">Ishtirokchilar</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2.5">
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{topScore.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Eng yuqori ball</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2.5">
                <Award className="h-4 w-4 text-[var(--ep-purple)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-purple)]">{avgScore.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">O&apos;rtacha ball</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Period tabs */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            {PERIOD_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Error state */}
        {isError && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Ma&apos;lumotlarni yuklashda xatolik yuz berdi.
            </CardContent>
          </Card>
        )}

        {/* Leaderboard table */}
        {!isError && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead className="w-14">O&apos;rin</TableHead>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Bo&apos;lim</TableHead>
                      <TableHead className="text-right">Ball</TableHead>
                      <TableHead className="text-center">Daraja</TableHead>
                      <TableHead className="text-center">Nishonlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton />
                    ) : entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>Reyting ma&apos;lumotlari mavjud emas</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (Array.isArray(entries) ? entries : []).map((entry) => {
                        const rankIdx = entry.rank - 1;
                        const isTop3 = entry.rank <= 3;
                        const rowColor = isTop3 ? `${RANK_COLORS[rankIdx]} border` : "";
                        return (
                          <TableRow
                            key={entry.id}
                            className={`hover:bg-muted/40 transition-colors ${rowColor}`}
                          >
                            <TableCell>
                              <div className="flex items-center justify-center w-7 h-7">
                                <RankIcon rank={entry.rank} />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-sm">{entry.full_name || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.department || "—"}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm">
                              {entry.score.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {entry.level != null ? (
                                <Badge variant="info" className="text-xs">
                                  Lv {entry.level}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {entry.badges_count ?? 0}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
