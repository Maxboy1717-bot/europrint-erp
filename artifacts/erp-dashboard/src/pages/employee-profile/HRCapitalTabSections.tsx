/**
 * @module HRCapitalTabSections
 * @description Display section components for HRCapitalTab.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3, UserCheck, Target, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { HRCapitalProfile, HRCSession } from "./HRCapitalTabTypes";
import { useTranslation } from '@/lib/i18n';
import {
  VISOTSKIY_COLORS,
  ONBOARDING_LABELS,
  TEST_TYPE_LABELS,
  INDICATOR_KEYS,
  INDICATOR_COLORS,
} from "./HRCapitalTabTypes";

// ─── Centered bar for tool test indicators ─────────────────────────────────────

export function CenteredBar({ value, color }: { value: number; color: string }) {
  const { t } = useTranslation("common");
  const center = 50;
  const pct = Math.max(0, Math.min(100, ((value + 100) / 200) * 100));
  const isNeg = value < 0;
  const barLeft = isNeg ? pct : center;
  const barWidth = Math.abs(pct - center);
  return (
    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden flex-1">
      <div
        className="absolute top-0 h-full rounded-full transition-all"
        style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: color }}
      />
      <div className="absolute top-0 h-full w-px bg-foreground/25" style={{ left: "50%" }} />
    </div>
  );
}

// ─── Summary KPI Cards (top row) ──────────────────────────────────────────────

export function HRCapitalSummaryCards({ profile }: { profile: HRCapitalProfile | null | undefined }) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className={`border ${profile?.visotskiyCategory ? (VISOTSKIY_COLORS[profile.visotskiyCategory] || "") : ""}`}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("visotskiyKategoriyasi")}</p>
              {profile?.visotskiyCategory ? (
                <p className="text-xl font-bold mt-1">{profile.visotskiyCategory}</p>
              ) : (
                <p className="text-lg font-bold text-muted-foreground">—</p>
              )}
            </div>
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="from-purple-500/10 to-purple-600/10 border-purple-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("toolTestNatijasi")}</p>
              <p className="text-2xl font-bold text-[var(--ep-purple)]">{profile?.toolTestScore || "—"}</p>
              <p className="text-xs text-muted-foreground">A-J shkala</p>
            </div>
            <BarChart3 className="h-6 w-6 text-[var(--ep-purple)]" />
          </div>
        </CardContent>
      </Card>

      <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("onboardingHolati")}</p>
              {profile?.onboardingStatus ? (
                <Badge className={`mt-1 ${ONBOARDING_LABELS[profile.onboardingStatus]?.color}`}>
                  {ONBOARDING_LABELS[profile.onboardingStatus]?.label}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">—</p>
              )}
            </div>
            <UserCheck className="h-6 w-6 text-[var(--ep-green)]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Profile read-only view ────────────────────────────────────────────────────

export function HRCapitalProfileView({ profile }: { profile: HRCapitalProfile }) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("visotskiyKategoriyasi")}</p>
        {profile.visotskiyCategory ? (
          <Badge className={`mt-1 ${VISOTSKIY_COLORS[profile.visotskiyCategory] || ""}`}>
            {profile.visotskiyCategory}
          </Badge>
        ) : (
          <p className="font-medium mt-1">—</p>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{t("toolTestNatijasi")}</p>
        <p className="font-bold text-2xl mt-1 text-[var(--ep-purple)]">{profile.toolTestScore || "—"}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{t("psixologikProfil")}</p>
        <p className="font-medium mt-1">{profile.psychologicalProfile || "—"}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{t("recruitingKanali")}</p>
        <p className="font-medium mt-1">{profile.recruitingChannel || "—"}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{t("onboardingHolati")}</p>
        {profile.onboardingStatus ? (
          <Badge className={`mt-1 ${ONBOARDING_LABELS[profile.onboardingStatus]?.color || ""}`}>
            {ONBOARDING_LABELS[profile.onboardingStatus]?.label}
          </Badge>
        ) : (
          <p className="font-medium mt-1">—</p>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{t("offboardingHolati")}</p>
        <p className="font-medium mt-1">{profile.offboardingStatus || "—"}</p>
      </div>
      {profile.notes && (
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">{t("eslatmalar")}</p>
          <p className="font-medium mt-1">{profile.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Test History ──────────────────────────────────────────────────────────────

export function HRCapitalTestHistory({ employeeId }: { employeeId: string }) {
  const { t } = useTranslation("common");
  const { data } = useQuery<{ data: Record<string, unknown>[] }>({
    queryKey: ["/api/hr/hrc-tests/employee", employeeId, "results"],
    queryFn: async () => {
      const res = (await apiRequest('GET', `/api/hr/hrc-tests/employee/${employeeId}/results`)) as unknown as Response;
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: !!employeeId,
  });

  const sessions = (data?.data ?? []) as unknown as HRCSession[];
  if (sessions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[var(--ep-purple)]" />
          {t("hrCapitalTestTarixi")}
        </CardTitle>
        <CardDescription>{t("barchaTestNatijalari")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(Array.isArray(sessions) ? sessions : []).map((s) => (
            <div key={s.id} className="p-3 bg-muted/40 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="text-xs bg-primary/10 text-primary border-0">
                    {TEST_TYPE_LABELS[s.test_type] ?? s.test_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(s.created_at).toLocaleDateString("uz-UZ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.syndrome && (
                    <Badge className="text-[10px] bg-orange-100 text-[var(--ep-primary)] border-orange-300">{s.syndrome}</Badge>
                  )}
                  {s.iq_level && (
                    <Badge className="text-[10px] bg-blue-100 text-[var(--ep-blue)] border-0">{s.iq_level}</Badge>
                  )}
                  {s.score !== null && s.score !== undefined && (
                    <span className={`font-bold ${s.test_type === "tool_test" && s.score < 0 ? "text-[var(--ep-red)]" : "text-primary"}`}>
                      {s.test_type === "tool_test"
                        ? `${s.score > 0 ? "+" : ""}${s.score}`
                        : `${s.score}%`}
                    </span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${s.status === "completed" ? "bg-green-100 text-[var(--ep-green)]" : "bg-gray-100 text-gray-600"}`}>
                    {s.status === "completed" ? "Tugallandi" : s.status === "expired" ? "Muddati o'tdi" : s.status}
                  </span>
                </div>
              </div>
              {s.test_type === "tool_test" && s.status === "completed" && s.indicators && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-1 pt-1">
                  {(Array.isArray(INDICATOR_KEYS) ? INDICATOR_KEYS : []).map(k => {
                    const v = Number(s.indicators?.[k] ?? 0);
                    return (
                      <div key={k} className="flex items-center gap-1">
                        <span className="text-[9px] font-bold w-3 shrink-0" style={{ color: INDICATOR_COLORS[k] }}>{k}</span>
                        <CenteredBar value={v} color={INDICATOR_COLORS[k]} />
                        <span className={`text-[9px] w-6 text-right shrink-0 ${v < 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}`}>
                          {v > 0 ? "+" : ""}{v}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Visotskiy Info Card ───────────────────────────────────────────────────────

export function VisotskiyInfoCard() {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t("visotskiyMetodologiyasiHaqida")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["Flagman", "Performer", "Troublemaker"] as const).map((cat) => (
            <div key={cat} className={`rounded-md p-4 border ${VISOTSKIY_COLORS[cat]}`}>
              <p className="font-semibold">{cat}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {cat === "Flagman" && "Eng yaxshi xodimlar — kompaniya tayanchi"}
                {cat === "Performer" && "Ishonchli bajaruvchilar — asosiy kuch"}
                {cat === "Troublemaker" && "Muammoli xodimlar — maxsus e'tibor talab qiladi"}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
