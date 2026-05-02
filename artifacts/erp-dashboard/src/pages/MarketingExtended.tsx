import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe, GitBranch, Scale, HeartPulse,
  TrendingUp, TrendingDown, ArrowUpRight, Star, Users, AlertTriangle, type LucideIcon
} from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

interface ChurnCustomer {
  id: number;
  name: string;
  phone: string | null;
  lastOrderDate: string | null;
  daysSinceOrder: number | null;
  churnScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  npsAvg: number | null;
  totalOrders: number;
}

interface ChurnData {
  total: number;
  customers: ChurnCustomer[];
  riskCounts: { critical: number; high: number; medium: number; low: number };
}

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

interface MarketingCampaign {
  id: number;
  name?: string;
  type?: string;
  budget?: number | string;
  spent?: number | string;
  status?: string;
}

interface NpsMonthly {
  month: string;
  score: number;
  responses: number;
  detractors: number;
  passives: number;
  promoters: number;
}

interface AbTest {
  id?: string;
  name: string;
  variant: string;
  conversion: number;
  visitors: number;
  status: string;
}

interface Competitor {
  id?: string;
  name: string;
  share?: number;
  price?: string;
  quality?: number;
  delivery?: string;
  weakness?: string;
  companyName?: string;
}

const routeTabMap: Record<string, string> = {
  "/marketing/analytics": "roi",
  "/marketing/seo": "seo",
  "/marketing/ab-testing": "ab",
  "/marketing/competitors": "comp",
  "/marketing/nps-churn": "nps",
};

const seoKeywords = [
  { keyword: "gofrokarton qadoq", pos: 3, vol: 1200, trend: "up" },
  { keyword: "karton quti narxi", pos: 7, vol: 850, trend: "up" },
  { keyword: "gofra korobka", pos: 12, vol: 620, trend: "down" },
  { keyword: "packaging uzbekistan", pos: 5, vol: 480, trend: "up" },
  { keyword: "euro print toshkent", pos: 1, vol: 320, trend: "up" },
  { keyword: "gofrolash xizmati", pos: 15, vol: 290, trend: "stable" },
];

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "roi": { title: "ROI / ROAS", icon: TrendingUp },
  "seo": { title: "SEO Tahlil", icon: Globe },
  "ab": { title: "A/B Test", icon: GitBranch },
  "comp": { title: "Raqobatchilar", icon: Scale },
  "nps": { title: "NPS / Churn", icon: HeartPulse },
};

export default function MarketingExtended() {
  const [location] = useLocation();
  const defaultTab = routeTabMap[location] || "roi";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = routeTabMap[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["roi"];

  const { data: campaigns = [], refetch } = useQuery<MarketingCampaign[]>({ queryKey: ["/api/marketing/campaigns"] });

  const { data: npsData = [], isLoading: npsLoading } = useQuery<NpsMonthly[]>({
    queryKey: ["/api/marketing/nps/monthly"]
  });

  const { data: abTests = [] } = useQuery<AbTest[]>({
    queryKey: ["/api/marketing/ab-tests"]
  });

  const { data: competitors = [] } = useQuery<Competitor[]>({
    queryKey: ["/api/marketing/competitors"]
  });

  const { data: churnData, isLoading: churnLoading } = useQuery<ChurnData>({
    queryKey: ["/api/marketing/churn-risk"],
    enabled: activeTab === "nps",
  });

  const totalBudget = (Array.isArray(campaigns) ? campaigns : []).reduce((s: number, c: MarketingCampaign) => s + (Number(c.budget) || 0), 0);
  const totalSpent = (Array.isArray(campaigns) ? campaigns : []).reduce((s: number, c: MarketingCampaign) => s + (Number(c.spent) || 0), 0);
  const roi = totalBudget > 0 ? ((totalBudget - totalSpent) / totalSpent) * 100 : 0;

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Marketing <span className="font-bold text-primary">Kengaytirilgan</span>
        </h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      <div className="mb-6">
        <ModuleSectionHeader
          moduleName="Marketing"
          moduleColor="text-purple-600"
          sectionTitle={meta?.title || ""}
          icon={meta?.icon || (() => null)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        
        {/* ROI / ROAS */}
        <TabsContent value="roi" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jami kampaniyalar</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{campaigns.length}</p>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jami byudjet</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(totalBudget / 1_000_000).toFixed(1)}M</p>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Sarflangan</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(totalSpent / 1_000_000).toFixed(1)}M</p>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">ROI</p>
              <p className={`text-4xl font-bold tracking-tight mt-1 ${roi >= 0 ? "text-green-600" : "text-red-500"}`}>
                {roi.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-4">Kampaniyalar samaradorligi</h3>
            <div>
              {campaigns.length === 0 ? (
                <p className="text-center text-on-surface-variant py-8">Kampaniya ma'lumotlari yo'q</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kampaniya</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Tur</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Byudjet</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Sarflangan</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(campaigns) ? campaigns : []).slice(0, 10).map((c: MarketingCampaign) => (
                      <TableRow key={c.id} className="hover:bg-surface-container-low transition-colors">
                        <TableCell className="font-medium py-3 px-6">{c.name}</TableCell>
                        <TableCell className="py-3 px-6"><Badge variant="outline" className="border-outline-variant text-on-surface-variant rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{c.type || "—"}</Badge></TableCell>
                        <TableCell className="text-right py-3 px-6">{(Number(c.budget || 0) / 1000).toFixed(0)}K</TableCell>
                        <TableCell className="text-right py-3 px-6">{(Number(c.spent || 0) / 1000).toFixed(0)}K</TableCell>
                        <TableCell className="py-3 px-6"><Badge variant={c.status === "active" ? "default" : "secondary"} className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{c.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">TOP 10 kalit so'zlar</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(Array.isArray(seoKeywords) ? seoKeywords : []).filter(k => k.pos <= 10).length}</p>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">O'rtacha pozitsiya</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{((seoKeywords ?? []).reduce((s, k) => s + k.pos, 0) / seoKeywords.length).toFixed(1)}</p>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jami oylik qidiruv</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(seoKeywords ?? []).reduce((s, k) => s + k.vol, 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Kalit so'zlar reytingi</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kalit so'z</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Pozitsiya</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Oylik hajm</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(seoKeywords) ? seoKeywords : []).map((k, i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-surface-container-low transition-colors">
                    <TableCell className="font-medium py-3 px-6">{k.keyword}</TableCell>
                    <TableCell className="text-right py-3 px-6">
                      <Badge variant={k.pos <= 3 ? "default" : k.pos <= 10 ? "secondary" : "outline"} className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">#{k.pos}</Badge>
                    </TableCell>
                    <TableCell className="text-right py-3 px-6">{k.vol.toLocaleString()}</TableCell>
                    <TableCell className="py-3 px-6">
                      {k.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-500" /> :
                       k.trend === "down" ? <TrendingDown className="w-4 h-4 text-red-500" /> :
                       <ArrowUpRight className="w-4 h-4 text-on-surface-variant" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* A/B Testing */}
        <TabsContent value="ab" className="space-y-6 mt-0">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">A/B Test natijalari</h3>
            </div>
            {abTests.length === 0 ? (
              <p className="text-center text-on-surface-variant py-8">A/B testlar mavjud emas</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Test nomi</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Variant</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Konversiya %</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Tashrif</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(abTests) ? abTests : []).map((t, i) => (
                    <TableRow key={`k-${i}`} className="hover:bg-surface-container-low transition-colors">
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
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Raqobatchilar */}
        <TabsContent value="comp" className="space-y-6 mt-0">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Bozor tahlili</h3>
            </div>
            {competitors.length === 0 ? (
              <p className="text-center text-on-surface-variant py-8">Raqobatchi ma'lumotlari kiritilmagan</p>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {(Array.isArray(competitors) ? competitors : []).map((c, i) => (
                    <div key={`k-${i}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${(c.companyName || c.name) === "Europrint" ? "text-primary" : "text-on-surface"}`}>{c.companyName || c.name}</span>
                        <span className="text-sm text-on-surface-variant">{c.share}%</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-2">
                        <div className={`h-2 rounded-full ${(c.companyName || c.name) === "Europrint" ? "bg-primary" : "bg-outline-variant"}`} style={{ width: `${c.share}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kompaniya</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Narx</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sifat</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Yetkazish</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Zaif tomon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(competitors) ? competitors : []).map((c, i) => (
                      <TableRow key={`k-${i}`} className={`hover:bg-surface-container-low transition-colors ${(c.companyName || c.name) === "Europrint" ? "bg-primary/5" : ""}`}>
                        <TableCell className="font-medium py-3 px-6">{c.companyName || c.name}</TableCell>
                        <TableCell className="py-3 px-6">{c.price || "—"}</TableCell>
                        <TableCell className="py-3 px-6">
                          <div className="flex gap-0.5">
                            {Array.from({ length: c.quality || 0 }).map((_, j) => (
                              <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-6">{c.delivery || "—"}</TableCell>
                        <TableCell className="text-on-surface-variant text-sm py-3 px-6">{c.weakness || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </TabsContent>

        {/* NPS / Churn */}
        <TabsContent value="nps" className="space-y-6 mt-0">
          {npsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([1, 2, 3]).map((i) => (
                <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-16 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : npsData.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-lg p-8 text-center text-on-surface-variant">
              Ma'lumot yo'q. NPS so'rovnomalar yaratilmagan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Array.isArray(npsData) ? npsData : []).map((n, i) => (
                <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{n.month}</p>
                  <p className={`text-4xl font-bold tracking-tight ${n.score >= 70 ? "text-green-600" : n.score >= 50 ? "text-amber-500" : "text-red-500"}`}>
                    {n.score}
                  </p>
                  <p className="text-xs text-on-surface-variant mb-3">NPS Ball ({n.responses} javob)</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-green-600 font-medium">Promoter</span><span className="text-on-surface">{n.promoters}</span></div>
                    <div className="flex justify-between"><span className="text-amber-500 font-medium">Passive</span><span className="text-on-surface">{n.passives}</span></div>
                    <div className="flex justify-between"><span className="text-red-500 font-medium">Detractor</span><span className="text-on-surface">{n.detractors}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Churn xavfi — Mijozlar</h3>
              {churnData?.riskCounts && (
                <div className="ml-auto flex gap-2">
                  {churnData.riskCounts.critical > 0 && (
                    <Badge className="text-xs bg-red-100 text-red-700 no-default-hover-elevate">Kritik: {churnData.riskCounts.critical}</Badge>
                  )}
                  {churnData.riskCounts.high > 0 && (
                    <Badge className="text-xs bg-orange-100 text-orange-700 no-default-hover-elevate">Yuqori: {churnData.riskCounts.high}</Badge>
                  )}
                </div>
              )}
            </div>
            {churnLoading ? (
              <div className="space-y-2">
                {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-14" />)}
              </div>
            ) : !churnData || !Array.isArray(churnData.customers) || churnData.customers.length === 0 ? (
              <p className="text-sm text-green-600 font-medium py-4">Barcha mijozlar faol — churn xavfi yo'q</p>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(churnData?.customers) ? churnData.customers : []).slice(0, 8).map((c) => (
                  <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors">
                    <Users className="w-4 h-4 text-on-surface-variant shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{c.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {c.daysSinceOrder ? `${c.daysSinceOrder} kun buyurtmasiz` : "Hech qachon buyurtma bermagan"}
                        {c.npsAvg !== null ? ` · NPS: ${c.npsAvg}/10` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate", RISK_COLORS[c.riskLevel])}>
                        {c.churnScore} xavf
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
