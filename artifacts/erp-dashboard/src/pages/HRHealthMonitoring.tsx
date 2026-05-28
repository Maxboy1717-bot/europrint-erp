/**
 * @module HRHealthMonitoring
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Activity, Plus, Search, AlertTriangle, CheckCircle2, Calendar, Users, ClipboardList,
} from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import { EPStatusPill } from "@/components/ep";
import { type HealthCheckup } from "./HRHealthMonitoringTypes";
import { NewCheckupDialog } from "./HRHealthMonitoringDialogs";

const HEALTH_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  scheduled:   { label: "Rejalashtirilgan", variant: "secondary",   color: "text-[var(--ep-blue)]" },
  in_progress: { label: "Jarayonda",        variant: "secondary",   color: "text-[var(--ep-yellow)]" },
  completed:   { label: "Yakunlangan",      variant: "default",     color: "text-[var(--ep-green)]" },
  overdue:     { label: "Muddati o'tgan",   variant: "destructive", color: "text-[var(--ep-red)]" },
  cancelled:   { label: "Bekor qilingan",   variant: "outline",     color: "text-muted-foreground" },
};

const CHECKUP_TYPE_LABEL: Record<string, string> = {
  annual:         "Yillik",
  quarterly:      "Choraklik",
  special:        "Maxsus",
  pre_employment: "Ishga kirish",
};

export default function HRHealthMonitoring() {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);

  const { data: checkups = [], isLoading } = useQuery<HealthCheckup[]>({
    queryKey: ["/api/hr/health-checkups"],
  });

  const all = checkups as HealthCheckup[];

  const filtered = all
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => {
      const deptName = c.departmentName || c.department_name || "";
      const cType = c.checkupType || "";
      return !search ||
        deptName.toLowerCase().includes(search.toLowerCase()) ||
        cType.toLowerCase().includes(search.toLowerCase());
    });

  const totalExamined = (Array.isArray(all) ? all : []).reduce((s, c) => s + (c.examinedCount ?? c.examined_count ?? 0), 0);
  const totalEmployees = (Array.isArray(all) ? all : []).reduce((s, c) => s + (c.totalEmployees ?? c.total_employees ?? 0), 0);
  const coveragePct = totalEmployees > 0 ? Math.round((totalExamined / totalEmployees) * 100) : 0;
  const overdueCount = (Array.isArray(all) ? all : []).filter(c => c.status === "overdue").length;
  const completedCount = (Array.isArray(all) ? all : []).filter(c => c.status === "completed").length;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">{t("hrSogliqMonitoringi")}</h1>
          <EPStatusPill tone="neutral">{all.length} ko'rik</EPStatusPill>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />{t("yangiKorik")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2.5">
                <ClipboardList className="h-4 w-4 text-[var(--ep-blue)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-blue)]">{all.length}</div>
                <div className="text-xs text-muted-foreground">{t("jamiKoriklar")}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-green)]">{completedCount}</div>
                <div className="text-xs text-muted-foreground">{t("yakunlangan")}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2.5">
                <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-red)]">{overdueCount}</div>
                <div className="text-xs text-muted-foreground">{t("muddatiOtgan")}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{t("qamrov")}</span>
                <span className="text-sm font-bold text-[var(--ep-purple)]">{coveragePct}%</span>
              </div>
              <Progress value={coveragePct} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{totalExamined}/{totalEmployees} xodim</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("bolimYokiTurQidiring")}
              className="pl-8 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
              <SelectValue placeholder={t("status28")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("barchaHolatlar")}</SelectItem>
              <SelectItem value="scheduled">{t("rejalashtirilgan")}</SelectItem>
              <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
              <SelectItem value="completed">{t("yakunlangan")}</SelectItem>
              <SelectItem value="overdue">{t("muddatiOtgan")}</SelectItem>
              <SelectItem value="cancelled">{t("cancelledDesc")}</SelectItem>
            </SelectContent>
          </Select>
          {filtered.length !== all.length && (
            <span className="text-xs text-muted-foreground">{filtered.length} ta topildi</span>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>{t("bolim1")}</TableHead>
                  <TableHead>{t("tur")}</TableHead>
                  <TableHead>{t("korikSanasi1")}</TableHead>
                  <TableHead>{t("xodimlar")}</TableHead>
                  <TableHead>{t("korilganlar")}</TableHead>
                  <TableHead>{t("keyingiKorik")}</TableHead>
                  <TableHead>{t("status28")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-[13px] text-muted-foreground">
                      {t("Yuklanmoqda...")}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-[13px] text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        {all.length === 0 ? "Tibbiy ko'rik ma'lumotlari mavjud emas" : "Mos ko'rik topilmadi"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(filtered) ? filtered : []).map((c, i) => {
                    const deptName = c.departmentName || c.department_name;
                    const checkDate = c.checkupDate || c.last_checkup_date;
                    const nextDate = c.nextCheckupDate || c.next_checkup_date;
                    const empTotal = c.totalEmployees ?? c.total_employees ?? 0;
                    const empExamined = c.examinedCount ?? c.examined_count ?? 0;
                    const pct = empTotal > 0 ? Math.round((empExamined / empTotal) * 100) : 0;
                    const st = HEALTH_STATUS_MAP[c.status || "scheduled"] || HEALTH_STATUS_MAP.scheduled;
                    return (
                      <TableRow key={c.id} data-testid={`row-health-${i}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{deptName || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {CHECKUP_TYPE_LABEL[c.checkupType || ""] || c.checkupType || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {checkDate
                            ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{checkDate.slice(0, 10)}</span>
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {empTotal || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-14 shrink-0">
                              {empExamined} ({pct}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {nextDate ? nextDate.slice(0, 10) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </div>

      <NewCheckupDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
