/**
 * @module AttemptsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface Attempt {
  id: string | number;
  test_id?: string | number;
  testId?: string | number;
  test_title?: string;
  testTitle?: string;
  employee_id?: string | number;
  employeeId?: string | number;
  employee_name?: string;
  employeeName?: string;
  status?: string;
  score?: number;
  max_score?: number;
  maxScore?: number;
  passed?: boolean;
  started_at?: string;
  startedAt?: string;
  finished_at?: string;
  finishedAt?: string;
  duration_seconds?: number;
  durationSeconds?: number;
  attempt_number?: number;
  attemptNumber?: number;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  in_progress: { label: "Jarayonda", variant: "secondary"   },
  completed:   { label: "Tugallandi", variant: "default"    },
  failed:      { label: "Muvaffaqiyatsiz", variant: "destructive" },
  passed:      { label: "O'tdi",      variant: "default"    },
  abandoned:   { label: "Tark etildi", variant: "outline"  },
};

export default function AttemptsPage() {
  const { t } = useTranslation("common");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: rawData, isLoading, isError, refetch } = useQuery<
    Attempt[] | { data?: Attempt[] }
  >({
    queryKey: ["/api/attempts/all", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      return await apiRequest("GET", `/api/attempts/all?${params}`);
    },
  });

  const attempts: Attempt[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: Attempt[] })?.data ?? [];

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="hr"
      title={t("testUrinishlari")}
      icon={<ClipboardList className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="flex gap-1.5 flex-wrap">
          {["all", "in_progress", "completed", "passed", "failed", "abandoned"].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter(s)}
              data-testid={`filter-${s}`}
            >
              {s === "all" ? "Barchasi" : (STATUS_MAP[s]?.label ?? s)}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-36 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : attempts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("testUrinishlariTopilmadi")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {attempts.map(a => {
              const status    = a.status ?? "in_progress";
              const sc        = STATUS_MAP[status] ?? STATUS_MAP.in_progress;
              const passed    = a.passed ?? status === "passed";
              const score     = a.score;
              const maxScore  = a.max_score ?? a.maxScore;
              const pct       = score !== undefined && maxScore ? Math.round((score / maxScore) * 100) : undefined;
              const title     = a.test_title ?? a.testTitle ?? `Test #${a.test_id ?? a.testId ?? ""}`;
              const empName   = a.employee_name ?? a.employeeName;
              const startedAt = a.started_at ?? a.startedAt;
              const attNo     = a.attempt_number ?? a.attemptNumber;
              const dur       = a.duration_seconds ?? a.durationSeconds;
              return (
                <Card key={a.id} className="hover:shadow-md transition-shadow" data-testid={`card-attempt-${a.id}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`h-9 w-9 rounded flex items-center justify-center shrink-0 ${passed ? "bg-green-100" : "bg-muted"}`}>
                      <Trophy className={`h-4 w-4 ${passed ? "text-[var(--ep-green)]" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{title}</p>
                        <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {empName && <span>👤 {empName}</span>}
                        {pct !== undefined && (
                          <span className={pct >= 70 ? "text-[var(--ep-green)] font-medium" : "text-destructive font-medium"}>
                            {score}/{maxScore} ({pct}%)
                          </span>
                        )}
                        {attNo !== undefined && <span>Urinish #{attNo}</span>}
                        {dur !== undefined && <span>⏱ {Math.floor(dur / 60)} daq</span>}
                        {startedAt && (
                          <span>{new Date(startedAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
