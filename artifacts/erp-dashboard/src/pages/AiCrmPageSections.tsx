/**
 * @module AiCrmPageSections
 * @description Scoring, Probability, and Churn tab sections for AiCrmPage.
 * Email and Actions tabs live in AiCrmPageSections2.tsx.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, Target, TrendingUp, AlertTriangle, Users, Briefcase, RefreshCw, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Deal, Contact, AiScore } from "./AiCrmPageTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ── Helpers ───────────────────────────────────────────────────────────────────
export const getScoreColor = (score?: number) => {
  if (!score) return "text-muted-foreground";
  if (score >= 75) return "text-[var(--ep-green)]";
  if (score >= 50) return "text-[var(--ep-yellow)]";
  return "text-[var(--ep-red)]";
};

export const getChurnBadge = (risk?: string) => {
  if (!risk) return null;
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    low:    { variant: "default",     label: "Past xavf" },
    medium: { variant: "secondary",   label: "O'rtacha xavf" },
    high:   { variant: "destructive", label: "Yuqori xavf" },
  };
  const config = variants[risk.toLowerCase()] || { variant: "outline" as const, label: risk };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// ── ScoringTabContent ─────────────────────────────────────────────────────────
interface ScoringTabContentProps {
  deals: Deal[];
  dealsLoading: boolean;
  aiResults: Record<string, AiScore>;
  scoringPending: boolean;
  scoringVariable: number | undefined;
  onScore: (dealId: number) => void;
}

export function ScoringTabContent({ deals, dealsLoading, aiResults, scoringPending, scoringVariable, onScore }: ScoringTabContentProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />{t("aiLeadSkoring")}</CardTitle>
        <CardDescription>{t("harBirBitimUchunAi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {dealsLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
        ) : deals.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground"><Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>{t("bitimlarTopilmadi")}</p></div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const result = aiResults[`score_${deal.id}`];
              const isScoring = scoringPending && scoringVariable === deal.id;
              return (
                <div key={deal.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/60 hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{deal.title}</p>
                    {deal.stage && <p className="text-xs text-muted-foreground mt-0.5">{deal.stage}</p>}
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    {result?.score !== undefined && (
                      <div className="text-right">
                        <p className={cn("text-2xl font-bold", getScoreColor(result.score))}>{result.score}</p>
                        <p className="text-xs text-muted-foreground">ball</p>
                      </div>
                    )}
                    {result?.reasoning && <p className="text-xs text-muted-foreground max-w-[200px] truncate hidden md:block">{result.reasoning}</p>}
                    <Button size="sm" variant="outline" onClick={() => onScore(deal.id)} disabled={isScoring}>
                      {isScoring ? <EPLoader size={12} /> : <RefreshCw className="h-3 w-3 mr-1" />}
                      Baholash
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── ProbabilityTabContent ─────────────────────────────────────────────────────
interface ProbabilityTabContentProps {
  deals: Deal[];
  dealsLoading: boolean;
  aiResults: Record<string, AiScore>;
  probabilityPending: boolean;
  probabilityVariable: number | undefined;
  onCalc: (dealId: number) => void;
}

export function ProbabilityTabContent({ deals, dealsLoading, aiResults, probabilityPending, probabilityVariable, onCalc }: ProbabilityTabContentProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />{t("bitimYutishEhtimoli")}</CardTitle>
        <CardDescription>AI asosida har bir bitim uchun muvaffaqiyat ehtimoli</CardDescription>
      </CardHeader>
      <CardContent>
        {dealsLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
        ) : deals.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground"><TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>{t("bitimlarTopilmadi")}</p></div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const result = aiResults[`prob_${deal.id}`];
              const isCalc = probabilityPending && probabilityVariable === deal.id;
              const prob = result?.probability;
              return (
                <div key={deal.id} className="p-4 rounded-lg bg-muted/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      {deal.amount && <p className="text-xs text-muted-foreground">${deal.amount.toLocaleString()}</p>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onCalc(deal.id)} disabled={isCalc}>
                      {isCalc ? <EPLoader size={12} /> : <BrainCircuit className="h-3 w-3 mr-1" />}
                      Hisoblash
                    </Button>
                  </div>
                  {prob !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("muvaffaqiyatEhtimoli")}</span>
                        <span className={cn("font-semibold", getScoreColor(prob))}>{prob}%</span>
                      </div>
                      <Progress value={prob} className="h-2" />
                      {result?.recommendation && <p className="text-xs text-muted-foreground mt-1">{result.recommendation}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── ChurnTabContent ───────────────────────────────────────────────────────────
interface ChurnTabContentProps {
  contacts: Contact[];
  contactsLoading: boolean;
  aiResults: Record<string, AiScore>;
  churnPending: boolean;
  churnVariable: number | undefined;
  onAnalyze: (contactId: number) => void;
}

export function ChurnTabContent({ contacts, contactsLoading, aiResults, churnPending, churnVariable, onAnalyze }: ChurnTabContentProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" />{t("mijozChurnXavfi")}</CardTitle>
        <CardDescription>{t("aiBilanMijozlarKetishXavfini")}</CardDescription>
      </CardHeader>
      <CardContent>
        {contactsLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>{t("kontaktlarTopilmadi")}</p></div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => {
              const result = aiResults[`churn_${contact.id}`];
              const isAnalyzing = churnPending && churnVariable === contact.id;
              return (
                <div key={contact.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/60 hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{contact.name}</p>
                      {result?.risk && getChurnBadge(result.risk)}
                    </div>
                    {contact.company && <p className="text-xs text-muted-foreground mt-0.5">{contact.company}</p>}
                    {result?.reasoning && <p className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">{result.reasoning}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onAnalyze(contact.id)} disabled={isAnalyzing} className="ml-4 shrink-0">
                    {isAnalyzing ? <EPLoader size={12} /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                    Tahlil
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
