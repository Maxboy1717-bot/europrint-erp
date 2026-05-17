/**
 * @module ShiftReportsTab
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw, Eye, Plus, ClipboardList,
} from "lucide-react";
import { formatNum, formatDate, SHIFT_STATUS } from "./helpers";
import { ShiftReport } from "./types";
import { CreateShiftModal } from "./CreateShiftModal";
import { ShiftDetailModal } from "./ShiftDetailModal";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

export function ShiftReportsTab() {
  const { t } = useTranslation("common");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery<{ reports: ShiftReport[] }>({
    queryKey: ["/api/production/shift-reports"],
    queryFn: async () => {
      return await apiRequest('GET', "/api/production/shift-reports");
    },
  });

  const reports = data?.reports || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          {t("smenaXisobotlari")}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> {t("refresh")}
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-open-create-shift">
            <Plus className="w-4 h-4 mr-1" /> {t("yangiSmena")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("raqam")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("bolim1")}</TableHead>
                <TableHead>{t("smena")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
                <TableHead className="text-right">{t("reja")}</TableHead>
                <TableHead className="text-right">{t("amalda")}</TableHead>
                <TableHead className="text-right">{t("sifat")}</TableHead>
                <TableHead className="text-right">OEE</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full rounded-lg" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                    {t("smenaXisobotlariYoq")}
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(reports) ? reports : []).map((r) => {
                  const st = SHIFT_STATUS[r.status] ?? ({ label: r.status, variant: "secondary" as const });
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setDetailId(r.id)} data-testid={`row-shift-${r.id}`}>
                      <TableCell className="pl-4 font-medium">{r.report_number}</TableCell>
                      <TableCell>{formatDate(r.shift_date)}</TableCell>
                      <TableCell>{r.department}</TableCell>
                      <TableCell>{r.shift_number}-smena</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">{formatNum(r.planned_qty)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNum(r.produced_qty)}</TableCell>
                      <TableCell className="text-right">{r.quality_rate ? `${Number(r.quality_rate).toFixed(1)}%` : "—"}</TableCell>
                      <TableCell className="text-right">{r.oee_percent ? `${Number(r.oee_percent).toFixed(1)}%` : "—"}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetailId(r.id); }} data-testid={`button-view-shift-${r.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      <CreateShiftModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => refetch()} />
      <ShiftDetailModal reportId={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
