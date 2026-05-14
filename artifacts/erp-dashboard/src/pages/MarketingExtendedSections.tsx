/**
 * @module MarketingExtendedSections
 * @description Major section (tab content) components for the MarketingExtended page.
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from '@/lib/i18n';
import {
  Globe, GitBranch, Scale,
  TrendingUp, TrendingDown, ArrowUpRight, Star, Users, AlertTriangle,
} from "lucide-react";
import {
  type MarketingCampaign,
  type NpsMonthly,
  type AbTest,
  type Competitor,
  type ChurnData,
  RISK_COLORS,
  seoKeywords,
} from "./MarketingExtendedTypes";

// Shared table header cell with consistent styling
function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <TableHead className={cn("bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6", right && "text-right")}>
      {children}
    </TableHead>
  );
}

// ---------------------------------------------------------------------------
// ROI / ROAS section
// ---------------------------------------------------------------------------

interface RoiSectionProps {
  campaigns: MarketingCampaign[];
  totalBudget: number;
  totalSpent: number;
  roi: number;
}

export function RoiSection({campaigns, totalBudget, totalSpent, roi }: RoiSectionProps) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jami kampaniyalar</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{campaigns.length}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jami byudjet</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{(totalBudget / 1_000_000).toFixed(1)}M</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sarflangan</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{(totalSpent / 1_000_000).toFixed(1)}M</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ROI</p>
          <p className={`text-4xl font-bold tracking-tight mt-1 ${roi >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>{roi.toFixed(1)}%</p>
        </div>
      </div>
      <div className="bg-card rounded-xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Kampaniyalar samaradorligi</h3>
        {campaigns.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Kampaniya ma'lumotlari yo'q</p>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TH>Kampaniya</TH><TH>Tur</TH><TH right>Byudjet</TH><TH right>Sarflangan</TH><TH>Holat</TH>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.slice(0, 10).map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium py-3 px-6">{c.name}</TableCell>
                  <TableCell className="py-3 px-6"><Badge variant="outline" className="border-border text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{c.type || "—"}</Badge></TableCell>
                  <TableCell className="text-right py-3 px-6">{(Number(c.budget || 0) / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="text-right py-3 px-6">{(Number(c.spent || 0) / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="py-3 px-6"><Badge variant={c.status === "active" ? "default" : "secondary"} className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEO section
// ---------------------------------------------------------------------------

export function SeoSection() {
  const { t } = useTranslation('common');
  const keywords = Array.isArray(seoKeywords) ? seoKeywords : [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TOP 10 kalit so'zlar</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{keywords.filter(k => k.pos <= 10).length}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">O'rtacha pozitsiya</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{(keywords.reduce((s, k) => s + k.pos, 0) / keywords.length).toFixed(1)}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jami oylik qidiruv</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{keywords.reduce((s, k) => s + k.vol, 0).toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kalit so'zlar reytingi</h3>
        </div>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow><TH>Kalit so'z</TH><TH right>Pozitsiya</TH><TH right>Oylik hajm</TH><TH>{t('trend3')}</TH></TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((k, i) => (
              <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium py-3 px-6">{k.keyword}</TableCell>
                <TableCell className="text-right py-3 px-6">
                  <Badge variant={k.pos <= 3 ? "default" : k.pos <= 10 ? "secondary" : "outline"} className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">#{k.pos}</Badge>
                </TableCell>
                <TableCell className="text-right py-3 px-6">{k.vol.toLocaleString()}</TableCell>
                <TableCell className="py-3 px-6">
                  {k.trend === "up" ? <TrendingUp className="w-4 h-4 text-[var(--ep-green)]" /> :
                   k.trend === "down" ? <TrendingDown className="w-4 h-4 text-[var(--ep-red)]" /> :
                   <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </div>
    </div>
  );
}
// --- A/B Testing section ---
export function AbSection({ abTests }: { abTests: AbTest[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">A/B Test natijalari</h3>
        </div>
        {abTests.length === 0
          ? <p className="text-center text-muted-foreground py-8">A/B testlar mavjud emas</p>
          : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow><TH>Test nomi</TH><TH>Variant</TH><TH right>Konversiya %</TH><TH right>Tashrif</TH><TH>Holat</TH></TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(abTests) ? abTests : []).map((t, i) => (
                <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="py-3 px-6">{t.name}</TableCell>
                  <TableCell className="py-3 px-6"><Badge variant={t.variant === "B" ? "default" : "outline"} className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">Variant {t.variant}</Badge></TableCell>
                  <TableCell className="text-right font-medium py-3 px-6">{t.conversion}%</TableCell>
                  <TableCell className="text-right py-3 px-6">{t.visitors.toLocaleString()}</TableCell>
                  <TableCell className="py-3 px-6">
                    <Badge variant={t.status === "running" ? "secondary" : "default"} className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">
                      {t.status === "running" ? "Davom etmoqda" : "Yakunlandi"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>
    </div>
  );
}
// --- Competitors section ---
export function CompSection({ competitors }: { competitors: Competitor[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bozor tahlili</h3>
        </div>
        {competitors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Raqobatchi ma'lumotlari kiritilmagan</p>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {competitors.map((c, i) => (
                <div key={`k-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${(c.companyName || c.name) === "Europrint" ? "text-primary" : "text-foreground"}`}>{c.companyName || c.name}</span>
                    <span className="text-sm text-muted-foreground">{c.share}%</span>
                  </div>
                  <div className="w-full bg-muted/60 rounded-full h-2">
                    <div className={`h-2 rounded-full ${(c.companyName || c.name) === "Europrint" ? "bg-primary" : "bg-outline-variant"}`} style={{ width: `${c.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow><TH>Kompaniya</TH><TH>Narx</TH><TH>Sifat</TH><TH>Yetkazish</TH><TH>Zaif tomon</TH></TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((c, i) => (
                  <TableRow key={`k-${i}`} className={`hover:bg-muted/40 transition-colors ${(c.companyName || c.name) === "Europrint" ? "bg-primary/5" : ""}`}>
                    <TableCell className="font-medium py-3 px-6">{c.companyName || c.name}</TableCell>
                    <TableCell className="py-3 px-6">{c.price || "—"}</TableCell>
                    <TableCell className="py-3 px-6">
                      <div className="flex gap-0.5">
                        {Array.from({ length: c.quality || 0 }).map((_, j) => <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-6">{c.delivery || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm py-3 px-6">{c.weakness || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </>
        )}
      </div>
    </div>
  );
}
// --- NPS / Churn section ---
interface NpsSectionProps { npsLoading: boolean; npsData: NpsMonthly[]; churnLoading: boolean; churnData: ChurnData | undefined; }

export function NpsSection({ npsLoading, npsData, churnLoading, churnData }: NpsSectionProps) {
  return (
    <div className="space-y-6">
      {npsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg p-5">
              <Skeleton className="h-4 w-20 mb-2 rounded-lg" /><Skeleton className="h-10 w-16 mb-2 rounded-lg" />
              <Skeleton className="h-4 w-32 mb-4 rounded-lg" />
              <div className="space-y-2"><Skeleton className="h-3 w-full rounded-lg" /><Skeleton className="h-3 w-full rounded-lg" /><Skeleton className="h-3 w-full rounded-lg" /></div>
            </div>
          ))}
        </div>
      ) : npsData.length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
          Ma'lumot yo'q. NPS so'rovnomalar yaratilmagan.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {npsData.map((n, i) => (
            <div key={`k-${i}`} className="bg-card rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{n.month}</p>
              <p className={`text-4xl font-bold tracking-tight ${n.score >= 70 ? "text-[var(--ep-green)]" : n.score >= 50 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>{n.score}</p>
              <p className="text-xs text-muted-foreground mb-3">NPS Ball ({n.responses} javob)</p>
              <div className="space-y-1.5 text-xs">
                {([["text-[var(--ep-green)]","Promoter",n.promoters],["text-[var(--ep-yellow)]","Passive",n.passives],["text-[var(--ep-red)]","Detractor",n.detractors]] as [string,string,number][]).map(([cls,lbl,val]) => (
                  <div key={lbl} className="flex justify-between"><span className={`${cls} font-medium`}>{lbl}</span><span className="text-foreground">{val}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[var(--ep-yellow)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Churn xavfi — Mijozlar</h3>
          {churnData?.riskCounts && (
            <div className="ml-auto flex gap-2">
              {churnData.riskCounts.critical > 0 && <Badge className="text-xs bg-red-100 text-[var(--ep-red)] no-default-hover-elevate">Kritik: {churnData.riskCounts.critical}</Badge>}
              {churnData.riskCounts.high > 0 && <Badge className="text-xs bg-orange-100 text-[var(--ep-primary)] no-default-hover-elevate">Yuqori: {churnData.riskCounts.high}</Badge>}
            </div>
          )}
        </div>
        {churnLoading ? (
          <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-14 rounded-lg"/>)}</div>
        ) : !churnData || !Array.isArray(churnData.customers) || churnData.customers.length === 0 ? (
          <p className="text-sm text-[var(--ep-green)] font-medium py-4">Barcha mijozlar faol — churn xavfi yo'q</p>
        ) : (
          <div className="space-y-2">
            {churnData.customers.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.daysSinceOrder ? `${c.daysSinceOrder} kun buyurtmasiz` : "Hech qachon buyurtma bermagan"}{c.npsAvg !== null ? ` · NPS: ${c.npsAvg}/10` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate", RISK_COLORS[c.riskLevel])}>{c.churnScore} xavf</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
