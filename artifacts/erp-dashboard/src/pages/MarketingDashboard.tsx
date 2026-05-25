/**
 * @module MarketingDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketingCampaign } from "@shared/schema";

import type { Segment, HotLead, ChurnData, LeadSourceSummary, NpsStats, DashboardStats } from "./MarketingDashboardTypes";
import {
  StatCardsSection,
  CampaignLeadSection,
  BudgetSection,
  SegmentsHotLeadsSection,
  AiAssistantSection,
  NpsPanel,
  ChurnRiskPanel,
} from "./MarketingDashboardSections";
import { EPPageHeader, EPErrorState } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
export default function MarketingDashboard() {
  const { t } = useTranslation('common');
  const { data: segments = [] } = useQuery<Segment[]>({ queryKey: ["/api/marketing/segments"] });
  const { data: hotLeads = [] } = useQuery<HotLead[]>({ queryKey: ["/api/marketing/ai/hot-leads"] });
  const { data: leadSources } = useQuery<LeadSourceSummary>({ queryKey: ["/api/marketing/leads/sources/summary"] });

  const { data: stats, isLoading: statsLoading, isError, error, refetch } = useQuery<DashboardStats>({
    queryKey: ["/api/marketing/dashboard/stats"],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ["/api/marketing/campaigns"],
  });

  const { data: inboxStats } = useQuery<{ totalConversations: number; openConversations: number; unreadCount: number }>({
    queryKey: ["/api/marketing/inbox/stats"],
  });

  const { data: blogPosts = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/marketing/website/blog"],
  });

  const { data: npsStats } = useQuery<NpsStats>({
    queryKey: ["/api/marketing/nps/stats"],
  });

  const { data: churnData } = useQuery<ChurnData>({
    queryKey: ["/api/marketing/churn-risk"],
  });

  const activeCampaigns = (Array.isArray(campaigns) ? campaigns : []).filter((c) => c.status === "active");
  const publishedPosts = (Array.isArray(blogPosts) ? blogPosts : []).filter((p: { isPublished?: boolean }) => p.isPublished).length || 0;
  const conversionRate = stats?.conversionRate ?? 0;
  const convertedLeads = stats?.convertedLeads ?? 0;
  const totalLeads = stats?.totalLeads ?? 0;

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  if (statsLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="marketing-dashboard-loading">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('marketingDashboard')}</b></>}
        title={t('marketingDashboard')}
        subtitle={t("kampaniyalarLidlarVaKonversiyaAnalitikasi")}
      />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="marketing-dashboard">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">Marketing {t('dashboard8')}</b></>}
        title="Marketing {t('dashboard8')}"
      />

      <StatCardsSection
        stats={stats}
        inboxStats={inboxStats}
        publishedPosts={publishedPosts}
        blogPostsTotal={blogPosts?.length || 0}
        statsLoading={statsLoading}
        conversionRate={conversionRate}
        convertedLeads={convertedLeads}
        totalLeads={totalLeads}
      />

      <CampaignLeadSection
        activeCampaigns={activeCampaigns}
        campaignsLoading={campaignsLoading}
        leadSources={leadSources}
      />

      <BudgetSection stats={stats} />

      <SegmentsHotLeadsSection
        segments={Array.isArray(segments) ? segments : []}
        hotLeads={Array.isArray(hotLeads) ? hotLeads : []}
      />

      <AiAssistantSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NpsPanel npsStats={npsStats} />
        <ChurnRiskPanel churnData={churnData} />
      </div>
    </div>
  );
}
