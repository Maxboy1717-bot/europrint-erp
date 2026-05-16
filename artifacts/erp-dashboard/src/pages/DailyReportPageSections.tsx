/**
 * @module DailyReportPageSections
 * @description Header, stats, submit form and history sections for DailyReportPage.
 * Admin HR sections live in DailyReportPageDialogs.tsx.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Users, FileText } from "lucide-react";
import type { DailyReport, DailyReportStats, ReportFormState } from "./DailyReportPageTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ── StatsBar ──────────────────────────────────────────────────────────────────

interface StatsBarProps {
  stats: DailyReportStats | undefined;
}

export function StatsBar({ stats }: StatsBarProps) {
  const { t } = useTranslation("common");
  const items = [
    { label: "Bugun topshirildi", value: stats?.stats?.submitted_count || 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-900/20" },
    { label: "Sababsiz yo'qlik", value: stats?.stats?.auto_absent_count || 0, icon: XCircle, color: "text-red-400", bg: "bg-red-900/20" },
    { label: "Kutilmoqda", value: stats?.stats?.pending_count || 0, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-900/20" },
    { label: "Bo'limlar qatnashgan", value: stats?.stats?.departments_with_reports || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-900/20" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((s) => (
        <Card key={s.label} className={`border-border ${s.bg}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── SubmitForm ────────────────────────────────────────────────────────────────

interface SubmitFormProps {
  todayReport: DailyReport | undefined;
  form: ReportFormState;
  deadlinePassed: boolean;
  hour: number;
  isPending: boolean;
  empId: number;
  today: string;
  onChange: (key: keyof ReportFormState, value: string) => void;
  onSubmit: () => void;
}

export function SubmitForm({
  todayReport,
  form,
  deadlinePassed,
  hour,
  isPending,
  onChange,
  onSubmit,
}: SubmitFormProps) {
  const { t } = useTranslation("common");
  if (todayReport?.status === "submitted") {
    return (
      <Card className="bg-green-900/20 border-green-700/50 max-w-3xl">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-400">{t("bugungiHisobotTopshirildi")}</h3>
          <p className="text-muted-foreground mt-2">
            Yuborildi: {todayReport.submitted_at
              ? new Date(todayReport.submitted_at).toLocaleTimeString()
              : "—"}
          </p>
          <div className="mt-4 text-left bg-card p-4 rounded-lg space-y-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("bajarilganIshlar")}</div>
              <div className="text-foreground mt-1 text-sm">{todayReport.tasks_completed}</div>
            </div>
            {todayReport.metrics && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("korsatkichlar")}</div>
                <div className="text-foreground mt-1 text-sm">{todayReport.metrics}</div>
              </div>
            )}
            {todayReport.tomorrow_plan && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("ertangiReja")}</div>
                <div className="text-foreground mt-1 text-sm">{todayReport.tomorrow_plan}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border max-w-3xl">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          <span>{t("bugungiHisobot")}</span>
          {deadlinePassed ? (
            <EPStatusPill tone="danger">{t("muddatiOtdi")}</EPStatusPill>
          ) : (
            <EPStatusPill tone="success">{20 - hour} soat qoldi</EPStatusPill>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-muted-foreground">
            {t("k1BajarilganIshlar")}<span className="text-muted-foreground">{t("kamida30Belgi")}</span>
          </Label>
          <Textarea
            value={form.tasks_completed}
            onChange={e => onChange("tasks_completed", e.target.value)}
            placeholder={t("bugunQandayVazifalarBajarildiNima")}
            className="bg-input border-border mt-1 min-h-28"
            maxLength={2000}
          />
          <div className={`text-xs mt-1 ${form.tasks_completed.length < 30 ? "text-red-400" : "text-green-400"}`}>
            {form.tasks_completed.length}/2000 belgi (kamida 30 kerak)
          </div>
        </div>
        <div>
          <Label className="text-muted-foreground">
            2. Ko'rsatkichlar / Miqdorlar <span className="text-muted-foreground">{t("ixtiyoriy")}</span>
          </Label>
          <Textarea
            value={form.metrics}
            onChange={e => onChange("metrics", e.target.value)}
            placeholder={t("masalan150TaMahsulotTayyorlandi")}
            className="bg-input border-border mt-1 min-h-16"
          />
        </div>
        <div>
          <Label className="text-muted-foreground">
            {t("k3ErtangiReja")}<span className="text-muted-foreground">{t("ixtiyoriy2")}</span>
          </Label>
          <Textarea
            value={form.tomorrow_plan}
            onChange={e => onChange("tomorrow_plan", e.target.value)}
            placeholder={t("ertagaNimaQilmoqchisiz")}
            className="bg-input border-border mt-1 min-h-16"
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={form.tasks_completed.length < 30 || isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold"
        >
          {isPending ? "Yuborilmoqda..." : "Hisobotni yuborish (+5 ball)"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── HistoryList ───────────────────────────────────────────────────────────────

interface HistoryListProps {
  reports: DailyReport[];
  isLoading: boolean;
}

export function HistoryList({ reports, isLoading }: HistoryListProps) {
  const { t } = useTranslation("common");
  if (isLoading) {
    return <div className="text-center py-8 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>;
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>{t("haliHisobotYoqBirinchiHisobotingizni")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {reports.map((r) => (
        <Card key={r.id} className={`border transition-colors ${
          r.is_auto_absent ? "border-red-700/50 bg-red-900/10" :
          r.status === "submitted" ? "border-green-700/30 bg-card" :
          "border-border bg-card"
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-foreground">
                {new Date(r.report_date).toLocaleDateString("uz-UZ", {
                  weekday: "short", day: "numeric", month: "long",
                })}
              </div>
              {r.is_auto_absent ? (
                <EPStatusPill tone="danger">{t("sababsizYoqlik")}</EPStatusPill>
              ) : r.status === "submitted" ? (
                <EPStatusPill tone="success">{t("topshirildi")}</EPStatusPill>
              ) : (
                <EPStatusPill tone="warning">{t("Kutilmoqda")}</EPStatusPill>
              )}
            </div>
            {r.tasks_completed && (
              <p className="text-muted-foreground text-sm line-clamp-2">{r.tasks_completed}</p>
            )}
            {r.submitted_at && (
              <div className="text-xs text-muted-foreground mt-1">
                Yuborildi: {new Date(r.submitted_at).toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
