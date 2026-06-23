/**
 * @module MarketingExtendedSections
 * @description Major section (tab content) components for the MarketingExtended page.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from '@/lib/i18n';
import {
  Globe, GitBranch, Scale, Plus,
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
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("jamiKampaniyalar")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{campaigns.length}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("jamiByudjet")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{(totalBudget / 1_000_000).toFixed(1)}M</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("sarflangan")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{(totalSpent / 1_000_000).toFixed(1)}M</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ROI</p>
          <p className={`text-4xl font-bold tracking-tight mt-1 ${roi >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>{roi.toFixed(1)}%</p>
        </div>
      </div>
      <div className="bg-card rounded-xl p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t("kampaniyalarSamaradorligi")}</h3>
        {campaigns.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t("kampaniyaMalumotlariYoq")}</p>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TH>{t("kampaniya")}</TH><TH>{t("tur")}</TH><TH right>{t("byudjet")}</TH><TH right>{t("sarflangan")}</TH><TH>{t("status28")}</TH>
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
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("top10KalitSozlar")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{keywords.filter(k => k.pos <= 10).length}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("ortachaPozitsiya")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{(keywords.reduce((s, k) => s + k.pos, 0) / keywords.length).toFixed(1)}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("jamiOylikQidiruv")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{keywords.reduce((s, k) => s + k.vol, 0).toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("kalitSozlarReytingi")}</h3>
        </div>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow><TH>{t("kalitSoz")}</TH><TH right>{t("position")}</TH><TH right>{t("oylikHajm")}</TH><TH>{t('trend3')}</TH></TableRow>
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
/** Variant conversion rate % = conversions / impressions, guarded (0 when no impressions). */
function convRate(conversions?: number, impressions?: number): number {
  if (!impressions || impressions <= 0) return 0;
  return Math.round(((conversions ?? 0) / impressions) * 1000) / 10;
}

export function AbSection({ abTests }: { abTests: AbTest[] }) {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");

  const createMutation = useMutation({
    mutationFn: (body: { name: string; variant_a: string; variant_b: string }) =>
      apiRequest("POST", "/api/marketing/ab-tests", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/ab-tests"] });
      setName(""); setVariantA(""); setVariantB("");
    },
    onError: () => { /* keep the entered values so the user can retry */ },
  });

  const rows = Array.isArray(abTests) ? abTests : [];
  const canSubmit = !!name.trim() && !!variantA.trim() && !!variantB.trim() && !createMutation.isPending;
  const submit = () => {
    if (!canSubmit) return;
    createMutation.mutate({ name: name.trim(), variant_a: variantA.trim(), variant_b: variantB.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("aBTestNatijalari")}</h3>
        </div>

        {/* Create A/B test — name + two variant labels */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Input placeholder={t("testNomi")} value={name} onChange={(e) => setName(e.target.value)} className="flex-1 min-w-[160px]" />
          <Input placeholder="Variant A" value={variantA} onChange={(e) => setVariantA(e.target.value)} className="w-32" />
          <Input placeholder="Variant B" value={variantB} onChange={(e) => setVariantB(e.target.value)} className="w-32" />
          <Button onClick={submit} disabled={!canSubmit}>
            <Plus className="h-4 w-4 mr-1" />{t("add")}
          </Button>
        </div>

        {rows.length === 0
          ? <p className="text-center text-muted-foreground py-8">{t("aBTestlarMavjudEmas")}</p>
          : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow><TH>{t("testNomi")}</TH><TH>Variant A</TH><TH right>A %</TH><TH>Variant B</TH><TH right>B %</TH><TH>{t("status28")}</TH></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.id ?? `k-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="py-3 px-6">{row.name}</TableCell>
                  <TableCell className="py-3 px-6"><Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{row.variant_a ?? "A"}</Badge></TableCell>
                  <TableCell className="text-right font-medium py-3 px-6">{convRate(row.conversions_a, row.impressions_a)}%</TableCell>
                  <TableCell className="py-3 px-6"><Badge variant="default" className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{row.variant_b ?? "B"}</Badge></TableCell>
                  <TableCell className="text-right font-medium py-3 px-6">{convRate(row.conversions_b, row.impressions_b)}%</TableCell>
                  <TableCell className="py-3 px-6">
                    <Badge variant={row.status === "running" ? "secondary" : "default"} className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">
                      {row.status === "running" ? "Davom etmoqda" : "Yakunlandi"}
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
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("bozorTahlili")}</h3>
        </div>
        {competitors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t("raqobatchiMalumotlariKiritilmagan")}</p>
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
                <TableRow><TH>{t("company")}</TH><TH>{t("price")}</TH><TH>{t("Sifat")}</TH><TH>{t("Yetkazish")}</TH><TH>{t("zaifTomon")}</TH></TableRow>
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
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");

  const createNps = useMutation({
    mutationFn: (body: { score: number; comment: string }) => apiRequest("POST", "/api/marketing/nps", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/nps/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/churn-risk"] });
      setScore(""); setComment("");
    },
    onError: () => { /* keep entered values so the user can retry */ },
  });
  const scoreNum = Number(score);
  const canSubmit = score.trim() !== "" && Number.isFinite(scoreNum) && scoreNum >= 0 && scoreNum <= 10 && !createNps.isPending;

  return (
    <div className="space-y-6">
      {/* Record an NPS response (score 0-10 + optional comment) — POST /api/marketing/nps;
          NOW() lands it in the current month so the trend cards above refresh on invalidate. */}
      <div className="bg-card rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Input type="number" min={0} max={10} placeholder="NPS (0-10)" value={score} onChange={(e) => setScore(e.target.value)} className="w-32" />
          <Input placeholder={t("izoh")} value={comment} onChange={(e) => setComment(e.target.value)} className="flex-1 min-w-[160px]" />
          <Button onClick={() => { if (canSubmit) createNps.mutate({ score: scoreNum, comment: comment.trim() }); }} disabled={!canSubmit}>
            <Plus className="h-4 w-4 mr-1" />{t("add")}
          </Button>
        </div>
      </div>
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
          {t("malumotYoqNpsSorovnomalarYaratilmagan")}
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
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("churnXavfiMijozlar")}</h3>
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
          <p className="text-sm text-[var(--ep-green)] font-medium py-4">{t("barchaMijozlarFaolChurnXavfi")}</p>
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
