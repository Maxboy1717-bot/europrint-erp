/**
 * @module AIAnalysisPanel
 * @description State, hooks, and orchestration for AI Analysis Panel.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Zap, Edit, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EntityType } from "./crm-types";
import type { LeadScoringV2, NBAResult, AutoFillData, ChurnRescue, AITab } from "./AIAnalysisPanelTypes";
import { ScoringV2Section, NBASection, AutoFillSection, ChurnRescueSection } from "./AIAnalysisPanelSections";

export function AIAnalysisPanel({ entityType, entityId }: { entityType: EntityType; entityId: number }) {
  const [scoringV2, setScoringV2] = useState<LeadScoringV2 | null>(null);
  const [nba, setNba] = useState<NBAResult | null>(null);
  const [autoFillData, setAutoFillData] = useState<AutoFillData | null>(null);
  const [churnRescue, setChurnRescue] = useState<ChurnRescue | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeAITab, setActiveAITab] = useState<AITab>("scoring");
  const { toast } = useToast();

  const runScoringV2 = async () => {
    if (!entityId || entityType !== "leads") return;
    setLoading("scoring");
    try {
      const data = await apiRequest<{ scoring: LeadScoringV2 }>("POST", `/api/crm/ai/leads/${entityId}/scoring-v2`, {});
      setScoringV2(data.scoring);
      toast({ title: "AI Scoring 2.0 tayyor" });
    } catch {
      toast({ title: "Scoring xatolik", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const runNBA = async () => {
    if (!entityId) return;
    setLoading("nba");
    try {
      const entityTypeParam = entityType === "leads" ? "lead" : "deal";
      const data = await apiRequest<{ nba: NBAResult }>("POST", `/api/crm/ai/nba/${entityTypeParam}/${entityId}`, {});
      setNba(data.nba);
      toast({ title: "NBA tahlil tayyor" });
    } catch {
      toast({ title: "NBA xatolik", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const createTaskFromNBA = async () => {
    if (!nba || !entityId) return;
    setLoading("createTask");
    try {
      await apiRequest("POST", "/api/crm/ai/nba/create-task", {
        entityType: entityType === "leads" ? "lead" : "deal",
        entityId,
        action: nba.action,
        actionType: nba.actionType,
        deadline: nba.deadline,
        priority: nba.priority,
      });
      toast({ title: "Vazifa yaratildi" });
    } catch {
      toast({ title: "Vazifa yaratish xatolik", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const runAutoFill = async () => {
    if (!entityId || entityType !== "leads") return;
    setLoading("autofill");
    try {
      const data = await apiRequest<{ autoFillData: AutoFillData }>("POST", `/api/crm/ai/autofill/${entityId}`, {});
      setAutoFillData(data.autoFillData);
      toast({ title: "Auto-fill tayyor" });
    } catch {
      toast({ title: "Auto-fill xatolik", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const applyAutoFill = async () => {
    if (!autoFillData || !entityId) return;
    setLoading("applyAutofill");
    try {
      await apiRequest("PATCH", `/api/crm/leads/${entityId}`, {
        ...(autoFillData.companyTitle ? { title: autoFillData.companyTitle } : {}),
        ...(autoFillData.industry ? { industry: autoFillData.industry } : {}),
        ...(autoFillData.segment ? { segment: autoFillData.segment } : {}),
      });
      toast({ title: "Maydonlar yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", entityId] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
    } catch {
      toast({ title: "Qo'llash xatolik", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const runChurnAnalysis = async () => {
    if (!entityId) return;
    setLoading("churn");
    try {
      const entityTypeParam = entityType === "leads" ? "lead" : "deal";
      const data = await apiRequest<{ churnRescue: ChurnRescue }>("POST", `/api/crm/ai/churn-rescue/${entityTypeParam}/${entityId}`, {});
      setChurnRescue(data.churnRescue);
      toast({ title: "Churn tahlil tayyor" });
    } catch {
      toast({ title: "Churn tahlil xatolik", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  if (entityType !== "leads" && entityType !== "deals") {
    return (
      <div className="text-center py-8 text-[13px] text-muted-foreground">
        AI tahlil faqat lidlar va bitimlar uchun mavjud
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap">
        <Button
          variant={activeAITab === "scoring" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveAITab("scoring")}
          data-testid="btn-ai-scoring-tab"
        >
          <Target className="h-4 w-4 mr-1" />
          Scoring 2.0
        </Button>
        <Button
          variant={activeAITab === "nba" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveAITab("nba")}
          data-testid="btn-ai-nba-tab"
        >
          <Zap className="h-4 w-4 mr-1" />
          NBA
        </Button>
        {entityType === "leads" && (
          <Button
            variant={activeAITab === "autofill" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveAITab("autofill")}
            data-testid="btn-ai-autofill-tab"
          >
            <Edit className="h-4 w-4 mr-1" />
            Auto-Fill
          </Button>
        )}
        <Button
          variant={activeAITab === "churn" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveAITab("churn")}
          data-testid="btn-ai-churn-tab"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Xavf
        </Button>
      </div>

      {/* Tab content */}
      {activeAITab === "scoring" && entityType === "leads" && (
        <ScoringV2Section scoringV2={scoringV2} loading={loading} onRun={runScoringV2} />
      )}

      {activeAITab === "scoring" && entityType === "deals" && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Scoring 2.0 faqat lidlar uchun mavjud. Bitimlar uchun "NBA" tabini ishlating.
        </div>
      )}

      {activeAITab === "nba" && (
        <NBASection nba={nba} loading={loading} onRun={runNBA} onCreateTask={createTaskFromNBA} />
      )}

      {activeAITab === "autofill" && entityType === "leads" && (
        <AutoFillSection autoFillData={autoFillData} loading={loading} onRun={runAutoFill} onApply={applyAutoFill} />
      )}

      {activeAITab === "churn" && (
        <ChurnRescueSection churnRescue={churnRescue} loading={loading} onRun={runChurnAnalysis} />
      )}
    </div>
  );
}
