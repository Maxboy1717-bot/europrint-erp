/**
 * @module SecurityExtendedSectionsA
 * @description PPEMonitoring and ZoneAccessSection components for SecurityExtended.
 */

import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import {
  type AttendanceRecord,
  type DailySummary,
  type PPEStats,
  type PPEViolationsResponse,
  PPE_ZONES,
} from "./SecurityExtendedTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── PPEMonitoring ────────────────────────────────────────────────────────

export function PPEMonitoring() {
  const { t } = useTranslation("common");
  const { data: statsData, isLoading: statsLoading } = useQuery<PPEStats>({
    queryKey: ["/api/security/ppe-stats"],
  });

  const { data: violationsData, isLoading: violationsLoading, refetch } =
    useQuery<PPEViolationsResponse>({
      queryKey: ["/api/security/ppe-violations"],
    });

  const violations = safeArray<Record<string, unknown>>(violationsData?.violations);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">PPE (Shaxsiy Himoya Vositalari) Nazorati</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-ppe">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Bugungi buzilish", v: statsLoading ? "..." : (statsData?.todayCount ?? 0), c: (statsData?.todayCount ?? 0) > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]" },
          { l: "Jami qayd etilgan", v: statsLoading ? "..." : (statsData?.total ?? 0), c: "text-[var(--ep-primary)]" },
          { l: "Oxirgi 7 kun", v: statsLoading ? "..." : (statsData?.last7Days ?? 0), c: "text-[var(--ep-yellow)]" },
          { l: "Eng ko'p buzilish", v: statsLoading ? "..." : statsData?.topViolationType?.type === "no_helmet" ? "Shlem" : statsData?.topViolationType?.type === "no_vest" ? "Yelek" : (statsData?.topViolationType?.type || "—"), c: "text-[var(--ep-blue)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("zonalarBoyichaPpeMuvofiqlik")}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PPE_ZONES.map((z, i) => (
              <div key={`k-${i}`} className="p-3 rounded-md bg-muted/50 space-y-2" data-testid={`row-ppe-${i}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{z.zone}</span>
                  {z.compliance !== null ? (
                    <Badge variant={z.compliance >= 95 ? "default" : z.compliance >= 80 ? "secondary" : "destructive"}>{z.compliance}%</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">{t("malumotYoq")}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(z.required) ? z.required : []).map(r => (
                    <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                  ))}
                </div>
                {z.compliance !== null && (
                  <div className="h-1.5 bg-muted rounded">
                    <div className={`h-1.5 rounded ${z.compliance >= 95 ? "bg-green-500" : z.compliance >= 80 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${z.compliance}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {violations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />{t("kameraTomonidanAniqlanganPpeBuzilishlari")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow><TableHead>{t("time")}</TableHead><TableHead>{t("camera")}</TableHead><TableHead>{t("xodim1")}</TableHead><TableHead>{t("muammo")}</TableHead><TableHead>{t("ishonch")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {violations.slice(0, 10).map((v: { id: number | string; timestamp?: string; cameraName?: string; cameraId?: string | number; employeeName?: string; label?: string; confidence?: number }) => (
                  <TableRow key={v.id} data-testid={`row-ppe-violation-${v.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs">{v.timestamp ? new Date(v.timestamp).toLocaleString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm">{v.cameraName || v.cameraId}</TableCell>
                    <TableCell className="text-sm">{v.employeeName || "—"}</TableCell>
                    <TableCell><EPStatusPill tone="danger" className="text-xs">{v.label}</EPStatusPill></TableCell>
                    <TableCell className="text-sm">{Math.round((v.confidence || 0) * 100)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}

      {violations.length === 0 && !violationsLoading && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-[var(--ep-green)]" />
            <p>{t("hozirchaKameraTomonidanPpeBuzilishi")}</p>
            <p className="text-xs mt-1">{t("kameraAiTomonidanBuzilishlarAniqlanganda")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── ZoneAccessSection ────────────────────────────────────────────────────

interface ZoneAccessSectionProps {
  dailySummary: DailySummary | undefined;
  attendanceRecords: AttendanceRecord[];
  presentToday: number;
  activeVisitorsCount: number;
}

export function ZoneAccessSection({ dailySummary, attendanceRecords, presentToday, activeVisitorsCount }: ZoneAccessSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">{t("kirishZonalariNazorati")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Bugun kirganlar", v: dailySummary?.totalEntries ?? attendanceRecords.length, c: "text-primary" },
          { l: "Hozir ichkarida", v: presentToday, c: "text-[var(--ep-green)]" },
          { l: "Mehmonlar", v: activeVisitorsCount, c: "text-[var(--ep-yellow)]" },
          { l: "Rad etilgan kirish", v: dailySummary?.denied ?? 0, c: "text-[var(--ep-red)]" },
        ]).map(s => (
          <div key={s.l} className="bg-card rounded-lg p-5 border border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.l}</p>
            <p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {([
          { zone: "Asosiy kirish",         level: "Hammaga",         entries: dailySummary?.mainEntries    ?? 152, status: "Faol", color: "text-[var(--ep-green)]" },
          { zone: "Ishlab chiqarish sexi",  level: "Ruxsatnomali",    entries: dailySummary?.prodEntries    ?? 45,  status: "Faol", color: "text-[var(--ep-green)]" },
          { zone: "Xom ashyo ombori",       level: "Ombor xodimlari", entries: dailySummary?.storageEntries ?? 12,  status: "Faol", color: "text-[var(--ep-green)]" },
          { zone: "Server xona",            level: "IT xodimlar",     entries: dailySummary?.serverEntries  ?? 3,   status: "Faol", color: "text-[var(--ep-green)]" },
          { zone: "Kimyo laboratoriya",     level: "QC mutaxassislar",entries: dailySummary?.labEntries     ?? 8,   status: "Faol", color: "text-[var(--ep-green)]" },
          { zone: "Menejerlar ofisi",       level: "Ruxsat ro'yxati", entries: dailySummary?.officeEntries  ?? 28,  status: "Faol", color: "text-[var(--ep-green)]" },
        ]).map((z, i) => (
          <Card key={`k-${i}`} data-testid={`card-zone-${i}`} className="bg-card border-border shadow-none">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-foreground">{z.zone}</div>
                <EPStatusPill tone="success">{z.status}</EPStatusPill>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ruxsat darajasi: {z.level}</span>
                <span className={`font-bold ${z.color}`}>{z.entries} ta</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
