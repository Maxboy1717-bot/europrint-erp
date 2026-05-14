/**
 * @module AiCrmPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { selectArray } from "@/lib/queryClient";
import { aiApi } from "@/lib/api/ai";
import {
  BrainCircuit, Target, TrendingUp, AlertTriangle, Mail,
  Zap, Users, Star, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Deal, Contact, AiScore } from "./AiCrmPageTypes";
import {
  ScoringTabContent,
  ProbabilityTabContent,
  ChurnTabContent,
} from "./AiCrmPageSections";
import {
  EmailTabContent,
  ActionsTabContent,
} from "./AiCrmPageSections2";

export default function AiCrmPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("scoring");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [emailContext, setEmailContext] = useState("");
  const [emailTone, setEmailTone] = useState("professional");
  const [aiResults, setAiResults] = useState<Record<string, AiScore>>({});

  const { data: deals = [], isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ["/api/crm/deals"],
    select: selectArray<Deal>,
    enabled: !!isAuthenticated,
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/crm/contacts"],
    select: selectArray<Contact>,
    enabled: !!isAuthenticated,
  });

  const scoreMutation = useMutation({
    mutationFn: (dealId: number) => aiApi.crmScoreLead(dealId),
    onSuccess: (data, dealId) => {
      setAiResults((prev) => ({ ...prev, [`score_${dealId}`]: data as AiScore }));
      toast({ title: "AI skori hisoblandi" });
    },
    onError: () => toast({ variant: "destructive", title: "Xatolik", description: "AI xizmatiga ulanib bo'lmadi" }),
  });

  const probabilityMutation = useMutation({
    mutationFn: (dealId: number) => aiApi.crmDealProbability(dealId),
    onSuccess: (data, dealId) => {
      setAiResults((prev) => ({ ...prev, [`prob_${dealId}`]: data as AiScore }));
      toast({ title: "Ehtimollik hisoblandi" });
    },
    onError: () => toast({ variant: "destructive", title: "Xatolik", description: "AI xizmatiga ulanib bo'lmadi" }),
  });

  const churnMutation = useMutation({
    mutationFn: (contactId: number) => aiApi.crmChurnRisk(contactId),
    onSuccess: (data, contactId) => {
      setAiResults((prev) => ({ ...prev, [`churn_${contactId}`]: data as AiScore }));
      toast({ title: "Churn xavfi baholandi" });
    },
    onError: () => toast({ variant: "destructive", title: "Xatolik", description: "AI xizmatiga ulanib bo'lmadi" }),
  });

  const emailMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => aiApi.crmEmailTemplate(data),
    onSuccess: (data) => {
      setAiResults((prev) => ({ ...prev, email_template: data as AiScore }));
      toast({ title: "Email shablon yaratildi" });
    },
    onError: () => toast({ variant: "destructive", title: "Xatolik", description: "AI xizmatiga ulanib bo'lmadi" }),
  });

  const nextActionMutation = useMutation({
    mutationFn: (dealId: number) => aiApi.crmNextBestAction(dealId),
    onSuccess: (data, dealId) => {
      setAiResults((prev) => ({ ...prev, [`action_${dealId}`]: data as AiScore }));
      toast({ title: "Keyingi harakat aniqlandi" });
    },
    onError: () => toast({ variant: "destructive", title: "Xatolik", description: "AI xizmatiga ulanib bo'lmadi" }),
  });

  const statCards = [
    { icon: Target,     label: "Jami bitimlar", value: deals.length,    color: "text-[var(--ep-blue)]" },
    { icon: Users,      label: "Kontaktlar",    value: contacts.length, color: "text-[var(--ep-green)]" },
    { icon: Star,       label: "Baholangan",    value: Object.keys(aiResults).filter(k => k.startsWith("score_")).length, color: "text-[var(--ep-yellow)]" },
    { icon: ShieldAlert,label: "Churn tahlili", value: Object.keys(aiResults).filter(k => k.startsWith("churn_")).length, color: "text-[var(--ep-red)]" },
  ];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BrainCircuit className="h-8 w-8 text-primary" />
        </div>
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">AI CRM</b></>}
        title="AI CRM"
        subtitle={t("suniyIntellektBilanCrmTahlili")}
      />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/40 p-1 rounded-xl">
          <TabsTrigger value="scoring" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Star className="h-4 w-4 mr-1.5" />{t("leadSkoring")}
          </TabsTrigger>
          <TabsTrigger value="probability" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4 mr-1.5" />{t("bitimEhtimoli")}
          </TabsTrigger>
          <TabsTrigger value="churn" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <AlertTriangle className="h-4 w-4 mr-1.5" />{t("churnXavfi")}
          </TabsTrigger>
          <TabsTrigger value="email" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Mail className="h-4 w-4 mr-1.5" />{t("emailShablon")}
          </TabsTrigger>
          <TabsTrigger value="actions" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Zap className="h-4 w-4 mr-1.5" />{t("keyingiHarakat")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-4">
          <ScoringTabContent
            deals={deals}
            dealsLoading={dealsLoading}
            aiResults={aiResults}
            scoringPending={scoreMutation.isPending}
            scoringVariable={scoreMutation.variables}
            onScore={(id) => scoreMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <ProbabilityTabContent
            deals={deals}
            dealsLoading={dealsLoading}
            aiResults={aiResults}
            probabilityPending={probabilityMutation.isPending}
            probabilityVariable={probabilityMutation.variables}
            onCalc={(id) => probabilityMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <ChurnTabContent
            contacts={contacts}
            contactsLoading={contactsLoading}
            aiResults={aiResults}
            churnPending={churnMutation.isPending}
            churnVariable={churnMutation.variables}
            onAnalyze={(id) => churnMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailTabContent
            deals={deals}
            emailContext={emailContext}
            onEmailContextChange={setEmailContext}
            emailTone={emailTone}
            onEmailToneChange={setEmailTone}
            onSelectDeal={setSelectedDeal}
            onGenerate={() => emailMutation.mutate({
              dealId: selectedDeal?.id,
              dealTitle: selectedDeal?.title,
              tone: emailTone,
              context: emailContext,
            })}
            isPending={emailMutation.isPending}
            emailResult={aiResults.email_template}
          />
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <ActionsTabContent
            deals={deals}
            dealsLoading={dealsLoading}
            aiResults={aiResults}
            actionPending={nextActionMutation.isPending}
            actionVariable={nextActionMutation.variables}
            onGetAction={(id) => nextActionMutation.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
