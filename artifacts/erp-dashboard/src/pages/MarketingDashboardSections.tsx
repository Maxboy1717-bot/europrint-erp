/**
 * MarketingDashboardSections.tsx
 * KPI cards, charts and panel sections for MarketingDashboard.
 */
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Target, Users, DollarSign, TrendingUp, Inbox, Globe,
  ArrowRightLeft, Flame, PieChart, BarChart3, HelpCircle,
} from "lucide-react";
import type { Segment, HotLead, LeadSourceSummary, DashboardStats } from "./MarketingDashboardTypes";
import { CHANNEL_ICONS } from "./MarketingDashboardTypes";
import type { MarketingCampaign } from "@shared/schema";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── Stat cards row ───────────────────────────────────────────────────────────
interface StatCardsProps {
  stats: DashboardStats | undefined;
  inboxStats: { totalConversations: number; openConversations: number; unreadCount: number } | undefined;
  publishedPosts: number;
  blogPostsTotal: number;
  statsLoading: boolean;
  conversionRate: number;
  convertedLeads: number;
  totalLeads: number;
}
export function StatCardsSection({ stats, inboxStats, publishedPosts, blogPostsTotal, statsLoading, conversionRate, convertedLeads, totalLeads }: StatCardsProps) {
  const { t } = useTranslation("common");
  const statCards = [
    { title: "Faol Kampaniyalar", value: stats?.activeCampaigns || 0, icon: Target, color: "text-[var(--ep-primary)]" },
    { title: "Jami Lidlar", value: totalLeads, icon: Users, color: "text-[var(--ep-blue)]" },
    { title: "Yangi Lidlar (30 kun)", value: stats?.recentLeads || 0, icon: TrendingUp, color: "text-[var(--ep-green)]" },
    { title: "Social Inbox", value: inboxStats?.openConversations || 0, icon: Inbox, color: "text-[var(--ep-purple)]", subtitle: `${inboxStats?.unreadCount || 0} o'qilmagan` },
    { title: "Blog Maqolalar", value: publishedPosts, icon: Globe, color: "text-[var(--ep-green)]", subtitle: `${blogPostsTotal} jami` },
    { title: "Umumiy Byudjet", value: `${Number(stats?.totalBudget || 0).toLocaleString()} so'm`, icon: DollarSign, color: "text-[var(--ep-yellow)]" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {statCards.map((stat) => (
        <div key={stat.title} className="bg-card rounded-lg p-5"
          data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.title}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-4xl font-bold tracking-tight text-foreground">{stat.value}</p>
            <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
          </div>
          {"subtitle" in stat && stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
        </div>
      ))}

      <div className="bg-card rounded-lg p-5" data-testid="card-crm-conversion">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("crmKonversiya")}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-4xl font-bold tracking-tight text-foreground" data-testid="text-conversion-rate">
            {statsLoading ? "..." : `${conversionRate}%`}
          </p>
          <ArrowRightLeft className="h-8 w-8 text-[var(--ep-purple)] opacity-20" />
        </div>
        <p className="text-xs text-muted-foreground mt-1" data-testid="text-conversion-detail">
          {convertedLeads} ta lid CRM ga o'tkazildi, jami {totalLeads} ta lid
        </p>
      </div>
    </div>
  );
}

// ─── Campaigns + Lead Sources ─────────────────────────────────────────────────
interface CampaignLeadSectionProps {
  activeCampaigns: MarketingCampaign[];
  campaignsLoading: boolean;
  leadSources: LeadSourceSummary | undefined;
}
export function CampaignLeadSection({ activeCampaigns, campaignsLoading, leadSources }: CampaignLeadSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div className="bg-card rounded-xl p-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-[var(--ep-primary)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("faolKampaniyalar")}</h3>
        </div>
        {campaignsLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 rounded-lg" />)}</div>
        ) : activeCampaigns.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("hozirchaFaolKampaniyalarYoq")}</p>
        ) : (
          <div className="divide-y divide-outline-variant">
            {(Array.isArray(activeCampaigns) ? activeCampaigns : []).slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between gap-2 py-3" data-testid={`campaign-item-${campaign.id}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">{campaign.platform}</p>
                </div>
                <EPStatusPill tone="neutral" className="bg-muted/60 text-foreground rounded-lg px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{campaign.type}</EPStatusPill>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl p-6 overflow-hidden" data-testid="card-lead-sources">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-[var(--ep-blue)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("leadManbaKanallari")}</h3>
          {leadSources?.topChannel && (
            <Badge className="text-xs bg-blue-100 text-[var(--ep-blue)] no-default-hover-elevate ml-auto">
              Top: {leadSources.channels?.find(c => c.key === leadSources.topChannel)?.label || leadSources.topChannel}
            </Badge>
          )}
        </div>
        {!leadSources ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 rounded-lg" />)}</div>
        ) : leadSources.total === 0 ? (
          <p className="text-sm text-muted-foreground">{t("haliKanalMalumotlariYoq")}</p>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(leadSources.channels) ? leadSources.channels : []).map((ch) => {
              const IconComp = CHANNEL_ICONS[ch.key] || HelpCircle;
              return (
                <div key={ch.key} data-testid={`source-channel-${ch.key}`}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <IconComp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{ch.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ch.count} lid</span>
                      <span className="text-[var(--ep-green)]">{ch.conversionRate}% konversiya</span>
                    </div>
                  </div>
                  <Progress value={ch.percent} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Budget section ───────────────────────────────────────────────────────────
interface BudgetSectionProps {
  stats: DashboardStats | undefined;
}
export function BudgetSection({ stats }: BudgetSectionProps) {
  return (
    <div className="bg-card rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-[var(--ep-yellow)]" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("byudjetXulosa")}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-muted/40 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("umumiyByudjet")}</p>
          <p className="text-xl font-bold text-foreground">{Number(stats?.totalBudget || 0).toLocaleString()} so'm</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/40 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("sarflangan")}</p>
          <p className="text-xl font-bold text-foreground">{Number(stats?.totalSpent || 0).toLocaleString()} so'm</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/40 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("qoldiq")}</p>
          <p className="text-xl font-bold text-foreground">{(Number(stats?.totalBudget || 0) - Number(stats?.totalSpent || 0)).toLocaleString()} so'm</p>
        </div>
      </div>
    </div>
  );
}

// ─── Segments + Hot Leads ─────────────────────────────────────────────────────
interface SegmentLeadProps { segments: Segment[]; hotLeads: HotLead[]; }
export function SegmentsHotLeadsSection({ segments, hotLeads }: SegmentLeadProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div className="bg-card rounded-xl p-6" data-testid="card-segments">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-5 w-5 text-[var(--ep-purple)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("mijozlarSegmentatsiyasi")}</h3>
        </div>
        <div className="space-y-3">
          {segments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("segmentMalumotlariYuklanmoqda")}</p>
          ) : (Array.isArray(segments) ? segments : []).map((seg, idx) => (
            <div key={seg.segment ?? `seg-${idx}`} className="flex items-center gap-3" data-testid={`segment-${seg.segment ?? idx}`}>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{seg.label}</span>
                  <span className="text-muted-foreground">{seg.count} ({seg.percent}%)</span>
                </div>
                <div className="bg-muted/60 rounded-full h-1.5">
                  <div className={`rounded-full h-1.5 transition-all ${seg.color === "green" ? "bg-green-500" : seg.color === "orange" ? "bg-orange-500" : seg.color === "red" ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.max(seg.percent, 2)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl p-6" data-testid="card-hot-leads">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-[var(--ep-red)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issiq Lidlar (AI Bashorat)</h3>
        </div>
        <div className="space-y-2">
          {hotLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("hozirchaIssiqLidlarYoq")}</p>
          ) : (Array.isArray(hotLeads) ? hotLeads : []).map(lead => (
            <div key={lead.id} className="flex items-center gap-3 p-3 bg-muted/60 rounded-lg" data-testid={`hot-lead-${lead.id}`}>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{lead.name}</p>
                {lead.company && <p className="text-xs text-muted-foreground truncate">{lead.company}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">{lead.reason}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge className="bg-orange-100 text-orange-800 text-xs no-default-hover-elevate">{lead.score} ball</Badge>
                <p className="text-xs text-[var(--ep-green)] font-medium mt-1">{lead.closeProbability}% ehtimol</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// AiAssistantSection, NpsPanel and ChurnRiskPanel live in MarketingDashboardPanels.tsx
export { AiAssistantSection, NpsPanel, ChurnRiskPanel } from "./MarketingDashboardPanels";
