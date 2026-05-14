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
  return (
    <Card data-testid="card-mentorships-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">Mentorlik Dasturi</CardTitle>
        <CardDescription>Mentor va mentee statistikasi</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Jami mentorliklar:</span>
              <span className="text-xl font-bold" data-testid="text-total-mentorships">{stats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Aktiv:</span>
              <EPStatusPill tone="success" data-testid="badge-active-mentorships">{stats?.active || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tugallangan:</span>
              <EPStatusPill tone="neutral" data-testid="badge-completed-mentorships">{stats?.completed || 0}</EPStatusPill>
            </div>
            {stats?.topMentors && stats.topMentors.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Top Mentorlar:</p>
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
  return (
    <Card data-testid="card-events-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">Tadbirlar va E'lonlar</CardTitle>
        <CardDescription>Kalendar tadbirlari statistikasi</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Jami tadbirlar:</span>
              <span className="text-xl font-bold" data-testid="text-total-events">{stats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rejalashtirilgan:</span>
              <EPStatusPill tone="success" data-testid="badge-scheduled-events">{stats?.scheduled || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tugallangan:</span>
              <EPStatusPill tone="neutral" data-testid="badge-completed-events">{stats?.completed || 0}</EPStatusPill>
            </div>
            {stats?.byType && stats.byType.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Tur bo'yicha:</p>
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
  return (
    <Card data-testid="card-applications-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">Arizalar</CardTitle>
        <CardDescription>Ariza tizimi statistikasi</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Jami shablonlar:</span>
              <span className="text-xl font-bold" data-testid="text-total-applications">{stats?.totalApplications || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Yuborilgan arizalar:</span>
              <span className="text-lg font-semibold" data-testid="text-total-responses">{stats?.totalResponses || 0}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <Badge variant="outline" className="w-full" data-testid="badge-pending-responses">{stats?.pendingResponses || 0}</Badge>
                <p className="text-xs text-muted-foreground mt-1">Kutilmoqda</p>
              </div>
              <div className="text-center">
                <EPStatusPill tone="success" className="w-full" data-testid="badge-approved-responses">{stats?.approvedResponses || 0}</EPStatusPill>
                <p className="text-xs text-muted-foreground mt-1">Tasdiqlangan</p>
              </div>
              <div className="text-center">
                <EPStatusPill tone="danger" className="w-full" data-testid="badge-rejected-responses">{stats?.rejectedResponses || 0}</EPStatusPill>
                <p className="text-xs text-muted-foreground mt-1">Rad etilgan</p>
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
  return (
    <Card data-testid="card-surveys-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">So'rovnomalar</CardTitle>
        <CardDescription>So'rovnoma tizimi statistikasi</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Jami so'rovnomalar:</span>
              <span className="text-xl font-bold" data-testid="text-total-surveys">{stats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Aktiv:</span>
              <EPStatusPill tone="success" data-testid="badge-active-surveys">{stats?.active || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Yopilgan:</span>
              <EPStatusPill tone="neutral" data-testid="badge-closed-surveys">{stats?.closed || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Javoblar:</span>
              <span className="text-lg font-semibold" data-testid="text-survey-responses">{stats?.totalResponses || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Javob darajasi:</span>
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
