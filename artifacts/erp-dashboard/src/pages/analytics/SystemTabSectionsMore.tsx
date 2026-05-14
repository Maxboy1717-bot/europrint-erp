/**
 * @module SystemTabSectionsMore
 * @description Additional stat cards for SystemTab: Broadcasts, Skills, Employees, AI.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
;
import type {
  BroadcastsStats, SkillsStats, SkillCategoryItem, EmployeeAnalyticsStats, AiAnalysis,
} from "./SystemTabTypes";

// ─── Broadcasts Card ──────────────────────────────────────────────────────────

interface BroadcastsCardProps {
  stats: BroadcastsStats | undefined;
  loading: boolean;
}

export function BroadcastsCard({ stats, loading }: BroadcastsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card data-testid="card-broadcasts-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">{t("xabarlar")}</CardTitle>
        <CardDescription>{t("broadcastTizimiStatistikasi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("jamiXabarlar")}</span>
              <span className="text-xl font-bold" data-testid="text-total-broadcasts">{stats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("qabulQiluvchilar")}</span>
              <span className="text-lg font-semibold" data-testid="text-total-recipients">{stats?.totalRecipients || 0}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <div className="text-center">
                <EPStatusPill tone="success" className="w-full" data-testid="badge-total-success">{stats?.totalSuccess || 0}</EPStatusPill>
                <p className="text-xs text-muted-foreground mt-1">{t("muvaffaqiyatli1")}</p>
              </div>
              <div className="text-center">
                <EPStatusPill tone="danger" className="w-full" data-testid="badge-total-failed">{stats?.totalFailed || 0}</EPStatusPill>
                <p className="text-xs text-muted-foreground mt-1">{t("error")}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">{t("muvaffaqiyatDarajasi")}</span>
              <Badge variant="outline" data-testid="badge-success-rate">{stats?.successRate || 0}%</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skills Card ──────────────────────────────────────────────────────────────

interface SkillsCardProps {
  stats: SkillsStats | undefined;
  loading: boolean;
}

export function SkillsCard({ stats, loading }: SkillsCardProps) {
  return (
    <Card data-testid="card-skills-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">{t("konikmalar")}</CardTitle>
        <CardDescription>{t("konikmalarMatritsaStatistikasi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("jamiKonikmalar")}</span>
              <span className="text-xl font-bold" data-testid="text-total-skills">{stats?.totalSkills || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("xodimKonikmalari")}</span>
              <span className="text-lg font-semibold" data-testid="text-total-user-skills">{stats?.totalUserSkills || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("tasdiqlangan")}</span>
              <EPStatusPill tone="success" data-testid="badge-verified-skills">{stats?.verifiedSkills || 0}</EPStatusPill>
            </div>
            {stats?.byCategory && stats.byCategory.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">{t("kategoriyaBoyicha")}</p>
                {(Array.isArray(stats.byCategory) ? stats.byCategory : []).map((item: SkillCategoryItem, idx: number) => (
                  <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                    <span>{item.category}</span><span>{item.count}</span>
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

// ─── Employee Stats Card ──────────────────────────────────────────────────────

interface EmployeeStatsCardProps {
  stats: EmployeeAnalyticsStats | undefined;
  loading: boolean;
}

export function EmployeeStatsCard({ stats, loading }: EmployeeStatsCardProps) {
  return (
    <Card data-testid="card-employee-stats">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold">{t("xodimlarTahlili")}</CardTitle>
        <CardDescription>{t("xodimlarHarakatiVaStatistikasi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Yangi xodimlar (30 kun):</span>
              <EPStatusPill tone="success" data-testid="badge-new-employees">{stats?.newEmployees || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("ketganXodimlar")}</span>
              <EPStatusPill tone="danger" data-testid="badge-departed-employees">{stats?.departedEmployees || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("aktivXodimlar")}</span>
              <EPStatusPill tone="success" data-testid="badge-active-employees">{stats?.activeEmployees || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("qatnashmayotganlar")}</span>
              <EPStatusPill tone="neutral" data-testid="badge-non-participating-employees">{stats?.nonParticipatingEmployees || 0}</EPStatusPill>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">{t("oqiyotganXodimlar")}</span>
              <span className="text-lg font-semibold" data-testid="text-studying-employees">{stats?.studyingEmployees || 0}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AI Analysis Card ─────────────────────────────────────────────────────────

interface AiAnalysisCardProps {
  aiAnalysis: AiAnalysis | undefined;
  loading: boolean;
}

export function AiAnalysisCard({ aiAnalysis, loading }: AiAnalysisCardProps) {
  return (
    <Card data-testid="card-ai-analysis" className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 AI Tahlil
          {loading && <EPLoader className="w-4 h-4" />}
        </CardTitle>
        <CardDescription>
          Tizim holatining sun'iy intellekt tomonidan tahlili
          {aiAnalysis?.generatedAt && (
            <span className="ml-2 text-xs">
              • Yaratilgan: {new Date(aiAnalysis.generatedAt).toLocaleString('uz-UZ')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4 rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-5/6 rounded-lg" /><Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-2/3 rounded-lg" />
          </div>
        ) : aiAnalysis?.analysis ? (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-ai-analysis">
              {aiAnalysis.analysis}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            AI tahlil mavjud emas
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
