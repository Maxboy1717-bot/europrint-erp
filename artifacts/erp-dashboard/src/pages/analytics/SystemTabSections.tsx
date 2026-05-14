/**
 * @module SystemTabSections
 * @description Individual stat card sections for SystemTab.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  MentorshipsStats, MentorInfo, EventsStats, EventTypeItem,
  ApplicationsStats, SurveysStats,
} from "./SystemTabTypes";

// ─── Mentorships Card ─────────────────────────────────────────────────────────

interface MentorshipsCardProps {
  stats: MentorshipsStats | undefined;
  loading: boolean;
}

export function MentorshipsCard({ stats, loading }: MentorshipsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card data-testid="card-mentorships-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">{t("mentorlikDasturi")}</CardTitle>
        <CardDescription>{t("mentorVaMenteeStatistikasi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("jamiMentorliklar")}</span>
              <span className="text-xl font-bold" data-testid="text-total-mentorships">{stats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("aktiv1")}</span>
              <EPStatusPill tone="success" data-testid="badge-active-mentorships">{stats?.active || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("tugallangan")}</span>
              <EPStatusPill tone="neutral" data-testid="badge-completed-mentorships">{stats?.completed || 0}</EPStatusPill>
            </div>
            {stats?.topMentors && stats.topMentors.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">{t("topMentorlar")}</p>
                {stats.topMentors.slice(0, 3).map((mentor: MentorInfo, idx: number) => (
                  <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                    <span>{mentor.mentorName}</span>
                    <span>{mentor.menteeCount} ta o'quvchi</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Events Card ──────────────────────────────────────────────────────────────

interface EventsCardProps {
  stats: EventsStats | undefined;
  loading: boolean;
}

export function EventsCard({ stats, loading }: EventsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card data-testid="card-events-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">{t("tadbirlarVaElonlar")}</CardTitle>
        <CardDescription>{t("kalendarTadbirlariStatistikasi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("jamiTadbirlar")}</span>
              <span className="text-xl font-bold" data-testid="text-total-events">{stats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("rejalashtirilgan1")}</span>
              <EPStatusPill tone="success" data-testid="badge-scheduled-events">{stats?.scheduled || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("tugallangan")}</span>
              <EPStatusPill tone="neutral" data-testid="badge-completed-events">{stats?.completed || 0}</EPStatusPill>
            </div>
            {stats?.byType && stats.byType.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">{t("turBoyicha")}</p>
                {(Array.isArray(stats.byType) ? stats.byType : []).map((item: EventTypeItem, idx: number) => (
                  <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                    <span>{item.type}</span><span>{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Applications Card ────────────────────────────────────────────────────────

interface ApplicationsCardProps {
  stats: ApplicationsStats | undefined;
  loading: boolean;
}

export function ApplicationsCard({ stats, loading }: ApplicationsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card data-testid="card-applications-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">{t("arizalar")}</CardTitle>
        <CardDescription>{t("arizaTizimiStatistikasi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("jamiShablonlar")}</span>
              <span className="text-xl font-bold" data-testid="text-total-applications">{stats?.totalApplications || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("yuborilganArizalar")}</span>
              <span className="text-lg font-semibold" data-testid="text-total-responses">{stats?.totalResponses || 0}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <Badge variant="outline" className="w-full" data-testid="badge-pending-responses">{stats?.pendingResponses || 0}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{t("Kutilmoqda")}</p>
              </div>
              <div className="text-center">
                <EPStatusPill tone="success" className="w-full" data-testid="badge-approved-responses">{stats?.approvedResponses || 0}</EPStatusPill>
                <p className="text-xs text-muted-foreground mt-1">{t("approved")}</p>
              </div>
              <div className="text-center">
                <EPStatusPill tone="danger" className="w-full" data-testid="badge-rejected-responses">{stats?.rejectedResponses || 0}</EPStatusPill>
                <p className="text-xs text-muted-foreground mt-1">{t("rejected")}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Surveys Card ─────────────────────────────────────────────────────────────

interface SurveysCardProps {
  stats: SurveysStats | undefined;
  loading: boolean;
}

export function SurveysCard({ stats, loading }: SurveysCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card data-testid="card-surveys-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">{t("sorovnomalar")}</CardTitle>
        <CardDescription>{t("sorovnomaTizimiStatistikasi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("jamiSorovnomalar")}</span>
              <span className="text-xl font-bold" data-testid="text-total-surveys">{stats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("aktiv1")}</span>
              <EPStatusPill tone="success" data-testid="badge-active-surveys">{stats?.active || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("yopilgan1")}</span>
              <EPStatusPill tone="neutral" data-testid="badge-closed-surveys">{stats?.closed || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">{t("javoblar")}</span>
              <span className="text-lg font-semibold" data-testid="text-survey-responses">{stats?.totalResponses || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("javobDarajasi")}</span>
              <Badge variant="outline" data-testid="badge-response-rate">{stats?.responseRate || 0}%</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// BroadcastsCard, SkillsCard, EmployeeStatsCard, AiAnalysisCard are in SystemTabSectionsMore.tsx
export { BroadcastsCard, SkillsCard, EmployeeStatsCard, AiAnalysisCard } from "./SystemTabSectionsMore";

import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
