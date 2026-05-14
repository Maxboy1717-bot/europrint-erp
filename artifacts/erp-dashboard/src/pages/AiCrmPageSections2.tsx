/**
 * @module AiCrmPageSections2
 * @description Email and Next-Action tab sections for AiCrmPage.
 * Scoring, Probability, Churn tabs live in AiCrmPageSections.tsx.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, Mail, Zap, ChevronRight } from "lucide-react";
import type { Deal, AiScore } from "./AiCrmPageTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ── EmailTabContent ───────────────────────────────────────────────────────────
interface EmailTabContentProps {
  deals: Deal[];
  emailContext: string;
  onEmailContextChange: (v: string) => void;
  emailTone: string;
  onEmailToneChange: (v: string) => void;
  onSelectDeal: (deal: Deal | null) => void;
  onGenerate: () => void;
  isPending: boolean;
  emailResult: AiScore | undefined;
}

export function EmailTabContent({
  deals, emailContext, onEmailContextChange, emailTone, onEmailToneChange,
  onSelectDeal, onGenerate, isPending, emailResult,
}: EmailTabContentProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          {t("aiEmailShablonGeneratori")}
        </CardTitle>
        <CardDescription>{t("kontekstAsosidaProfessionalEmailShablonlar")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
          <Label>{t("bitimTanlash")}</Label>
            <Select onValueChange={(val) => onSelectDeal(deals.find(d => d.id === Number(val)) || null)}>
              <SelectTrigger><SelectValue placeholder={t("bitimTanlang")} /></SelectTrigger>
              <SelectContent>
                {deals.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label>{t("ton")}</Label>
            <Select value={emailTone} onValueChange={onEmailToneChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">{t("professional")}</SelectItem>
                <SelectItem value="friendly">{t("dostona")}</SelectItem>
                <SelectItem value="formal">{t("rasmiy")}</SelectItem>
                <SelectItem value="persuasive">{t("ishontiruvchi")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label>{t("qoshimchaKontekst")}</Label>
          <Textarea
            placeholder={t("emailMaqsadiQoshimchaMalumotlar")}
            value={emailContext}
            onChange={(e) => onEmailContextChange(e.target.value)}
            rows={3}
          />
        </div>
        <Button onClick={onGenerate} disabled={isPending}>
          {isPending ? <EPLoader className="mr-2" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
          Shablon yaratish
        </Button>
        {emailResult && (
          <div className="mt-4 p-4 rounded-lg bg-muted/60 space-y-3 border border-primary/20">
            {emailResult.subject && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("mavzu")}</p>
                <p className="font-medium mt-1">{emailResult.subject}</p>
              </div>
            )}
            {emailResult.template && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("matn")}</p>
                <pre className="mt-1 text-sm whitespace-pre-wrap font-sans">{emailResult.template}</pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── ActionsTabContent ─────────────────────────────────────────────────────────
interface ActionsTabContentProps {
  deals: Deal[];
  dealsLoading: boolean;
  aiResults: Record<string, AiScore>;
  actionPending: boolean;
  actionVariable: number | undefined;
  onGetAction: (dealId: number) => void;
}

export function ActionsTabContent({ deals, dealsLoading, aiResults, actionPending, actionVariable, onGetAction }: ActionsTabContentProps) {
  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />{t("keyingiEngYaxshiHarakat")}</CardTitle>
        <CardDescription>AI har bir bitim uchun optimal keyingi qadam tavsiya qiladi</CardDescription>
      </CardHeader>
      <CardContent>
        {dealsLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
        ) : deals.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground"><Zap className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>{t("bitimlarTopilmadi")}</p></div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const result = aiResults[`action_${deal.id}`];
              const isGetting = actionPending && actionVariable === deal.id;
              return (
                <div key={deal.id} className="p-4 rounded-lg bg-muted/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{deal.title}</p>
                    <Button size="sm" variant="outline" onClick={() => onGetAction(deal.id)} disabled={isGetting}>
                      {isGetting ? <EPLoader size={12} /> : <Zap className="h-3 w-3 mr-1" />}
                      Tavsiya olish
                    </Button>
                  </div>
                  {result?.nextAction && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-primary">{t("tavsiya")}</p>
                        <p className="text-sm mt-0.5">{result.nextAction}</p>
                        {result.reasoning && <p className="text-xs text-muted-foreground mt-1">{result.reasoning}</p>}
                      </div>
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
