import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Clock,
  Sparkles,
  Loader2,
  AlertTriangle,
  Target,
  Zap,
  Save,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { EntityType } from "./crm-types";

interface AIAnalysis {
  score: number;
  priority: string;
  nextAction: string;
  strengths: string[];
  risks: string[];
  summary: string;
}

interface AIForecast {
  winProbability: number;
  expectedCloseDate: string;
  estimatedValue: number;
  recommendations: string[];
  risks: string[];
  confidence: string;
}

interface AISuggestion {
  suggestedAction: string;
  actionType: string;
  urgency: string;
  script: string;
  tips: string[];
}

interface LeadScoringV2 {
  score: number;
  probability: number;
  estimatedLTV: number;
  recommendedApproach: string;
  segment: string;
  readiness: string;
  priority: string;
  factors: {
    companySize: number;
    engagement: number;
    budget: number;
    timing: number;
  };
  summary: string;
}

interface NBAResult {
  action: string;
  actionType: string;
  deadline: string;
  priority: string;
  script: string;
  reason: string;
  expectedOutcome: string;
  tips: string[];
}

interface AutoFillData {
  companyTitle: string | null;
  industry: string | null;
  segment: string | null;
  budget: string | null;
  timeline: string | null;
  needs: string[];
  confidence: number;
}

interface ChurnRescue {
  riskLevel: string;
  riskScore: number;
  riskFactors: string[];
  rescueScenario: {
    actions: string[];
    timeline: string;
    successProbability: number;
    keyMessage: string;
  };
  retentionOffer: string | null;
}

export function AIAnalysisPanel({ entityType, entityId }: { entityType: EntityType; entityId: number }) {
  const [scoringV2, setScoringV2] = useState<LeadScoringV2 | null>(null);
  const [nba, setNba] = useState<NBAResult | null>(null);
  const [autoFillData, setAutoFillData] = useState<AutoFillData | null>(null);
  const [churnRescue, setChurnRescue] = useState<ChurnRescue | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeAITab, setActiveAITab] = useState<"scoring" | "nba" | "autofill" | "churn">("scoring");
  const { toast } = useToast();

  const runScoringV2 = async () => {
    if (!entityId || entityType !== "leads") return;
    setLoading("scoring");
    try {
      const data = await apiRequest<{ scoring: LeadScoringV2 }>("POST", `/api/crm/ai/leads/${entityId}/scoring-v2`);
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
      const data = await apiRequest<{ nba: NBAResult }>("POST", `/api/crm/ai/nba/${entityTypeParam}/${entityId}`);
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
      await apiRequest("POST", `/api/crm/ai/autofill/${entityId}/apply`, {
        companyTitle: autoFillData.companyTitle,
        industry: autoFillData.industry,
      });
      toast({ title: "Maydonlar yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", entityId] });
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
      const data = await apiRequest<{ churnRescue: ChurnRescue }>("POST", `/api/crm/ai/churn-rescue/${entityTypeParam}/${entityId}`);
      setChurnRescue(data.churnRescue);
      toast({ title: "Churn tahlil tayyor" });
    } catch {
      toast({ title: "Churn tahlil xatolik", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "yuqori") return "bg-red-500 text-white";
    if (priority === "o'rta") return "bg-yellow-500 text-white";
    return "bg-green-500 text-white";
  };

  const getRiskColor = (risk: string) => {
    if (risk === "yuqori") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (risk === "o'rta") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  };

  const getFactorColor = (value: number) => {
    if (value >= 70) return "bg-green-500";
    if (value >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (entityType !== "leads" && entityType !== "deals") {
    return (
      <div className="text-center py-8 text-muted-foreground">
        AI tahlil faqat lidlar va bitimlar uchun mavjud
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Scoring 2.0 Tab */}
      {activeAITab === "scoring" && entityType === "leads" && (
        <div className="space-y-4">
          <Button onClick={runScoringV2} disabled={!!loading} className="w-full" data-testid="btn-run-scoring-v2">
            {loading === "scoring" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Baholanmoqda...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Lead Scoring 2.0</>
            )}
          </Button>

          {scoringV2 && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-4xl font-bold">{scoringV2.score}</div>
                  <div className="text-xs text-muted-foreground">Umumiy ball</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{scoringV2.probability}%</div>
                  <div className="text-xs text-muted-foreground">Ehtimollik</div>
                </div>
                <Badge className={getPriorityColor(scoringV2.priority)}>{scoringV2.priority}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Taxminiy LTV</div>
                  <div className="font-bold text-green-600">
                    {scoringV2.estimatedLTV?.toLocaleString()} UZS
                  </div>
                </div>
                <div className="bg-background p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Segment</div>
                  <Badge variant="outline">{scoringV2.segment}</Badge>
                </div>
              </div>

              <div className="bg-background p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Tavsiya etiladigan yondashuv</div>
                <div className="font-medium text-primary">{scoringV2.recommendedApproach}</div>
              </div>

              <div>
                <div className="text-xs font-medium mb-2">Baholash omillari</div>
                <div className="space-y-2">
                  {([
                    { label: "Kompaniya hajmi", value: scoringV2.factors.companySize },
                    { label: "Faollik", value: scoringV2.factors.engagement },
                    { label: "Byudjet", value: scoringV2.factors.budget },
                    { label: "Vaqt", value: scoringV2.factors.timing },
                  ]).map(f => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-xs w-24">{f.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className={cn("h-2 rounded-full", getFactorColor(f.value))} style={{ width: `${f.value}%` }} />
                      </div>
                      <span className="text-xs font-bold w-8">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{scoringV2.summary}</p>
            </div>
          )}

          {entityType !== "leads" && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Scoring 2.0 faqat lidlar uchun mavjud
            </div>
          )}
        </div>
      )}

      {activeAITab === "scoring" && entityType === "deals" && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Scoring 2.0 faqat lidlar uchun mavjud. Bitimlar uchun "NBA" tabini ishlating.
        </div>
      )}

      {/* NBA Tab */}
      {activeAITab === "nba" && (
        <div className="space-y-4">
          <Button onClick={runNBA} disabled={!!loading} className="w-full" data-testid="btn-run-nba">
            {loading === "nba" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Tahlil qilinmoqda...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" />Keyingi eng yaxshi qadam</>
            )}
          </Button>

          {nba && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">{nba.actionType}</Badge>
                <Badge className={getPriorityColor(nba.priority)}>{nba.priority}</Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {nba.deadline}
                </div>
              </div>

              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Keyingi qadam</div>
                <div className="font-medium">{nba.action}</div>
              </div>

              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Sabab:</span> {nba.reason}
              </div>

              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Kutilayotgan natija:</span> {nba.expectedOutcome}
              </div>

              {nba.script && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Skript</div>
                  <div className="text-sm italic">{nba.script}</div>
                </div>
              )}

              {nba.tips && nba.tips.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium">Maslahatlar:</div>
                  {(Array.isArray(nba.tips) ? nba.tips : []).map((t, i) => (
                    <div key={`k-${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-blue-500">•</span> {t}
                    </div>
                  ))}
                </div>
              )}

              <Button 
                onClick={createTaskFromNBA} 
                disabled={loading === "createTask"} 
                className="w-full"
                data-testid="btn-create-nba-task"
              >
                {loading === "createTask" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Yaratilmoqda...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" />Vazifa yaratish</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Auto-Fill Tab */}
      {activeAITab === "autofill" && entityType === "leads" && (
        <div className="space-y-4">
          <Button onClick={runAutoFill} disabled={!!loading} className="w-full" data-testid="btn-run-autofill">
            {loading === "autofill" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Tahlil qilinmoqda...</>
            ) : (
              <><Edit className="h-4 w-4 mr-2" />AI bilan to'ldirish</>
            )}
          </Button>

          {autoFillData && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Topilgan ma'lumotlar</span>
                <Badge variant="outline">{autoFillData.confidence}% ishonch</Badge>
              </div>

              <div className="space-y-2">
                {autoFillData.companyTitle && (
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-xs text-muted-foreground">Kompaniya</span>
                    <span className="font-medium text-sm">{autoFillData.companyTitle}</span>
                  </div>
                )}
                {autoFillData.industry && (
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-xs text-muted-foreground">Sanoat</span>
                    <span className="font-medium text-sm">{autoFillData.industry}</span>
                  </div>
                )}
                {autoFillData.segment && (
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-xs text-muted-foreground">Segment</span>
                    <Badge variant="secondary">{autoFillData.segment}</Badge>
                  </div>
                )}
                {autoFillData.budget && (
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-xs text-muted-foreground">Byudjet</span>
                    <span className="font-medium text-sm">{autoFillData.budget}</span>
                  </div>
                )}
                {autoFillData.timeline && (
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-xs text-muted-foreground">Muddat</span>
                    <span className="font-medium text-sm">{autoFillData.timeline}</span>
                  </div>
                )}
              </div>

              {autoFillData.needs && autoFillData.needs.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1">Ehtiyojlar:</div>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(autoFillData.needs) ? autoFillData.needs : []).map((n, i) => (
                      <Badge key={`k-${i}`} variant="secondary" className="text-xs">{n}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={applyAutoFill} 
                disabled={loading === "applyAutofill"} 
                className="w-full"
                data-testid="btn-apply-autofill"
              >
                {loading === "applyAutofill" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Qo'llanmoqda...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Maydonlarni yangilash</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Churn Risk Tab */}
      {activeAITab === "churn" && (
        <div className="space-y-4">
          <Button onClick={runChurnAnalysis} disabled={!!loading} className="w-full" data-testid="btn-run-churn">
            {loading === "churn" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Tahlil qilinmoqda...</>
            ) : (
              <><AlertTriangle className="h-4 w-4 mr-2" />Churn xavfi tahlili</>
            )}
          </Button>

          {churnRescue && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{churnRescue.riskScore}%</div>
                  <span className="text-sm text-muted-foreground">xavf balli</span>
                </div>
                <Badge className={getRiskColor(churnRescue.riskLevel)}>
                  {churnRescue.riskLevel === "yuqori" ? "Xavfli" : churnRescue.riskLevel === "o'rta" ? "Kuzatuv" : "Xavfsiz"}
                </Badge>
              </div>

              {churnRescue.riskFactors && churnRescue.riskFactors.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    Xavf omillari
                  </div>
                  <ul className="space-y-1">
                    {(Array.isArray(churnRescue.riskFactors) ? churnRescue.riskFactors : []).map((f, i) => (
                      <li key={`k-${i}`} className="text-xs flex items-start gap-1">
                        <span className="text-red-500">!</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-medium mb-2 flex items-center gap-1 text-blue-700 dark:text-blue-400">
                  <Zap className="h-3 w-3" />
                  Qutqarish stsenariysi
                </div>
                <div className="space-y-2">
                  {(Array.isArray(churnRescue.rescueScenario.actions) ? churnRescue.rescueScenario.actions : []).map((a, i) => (
                    <div key={`k-${i}`} className="text-xs flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] h-4 shrink-0">{i + 1}</Badge>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Muddat: {churnRescue.rescueScenario.timeline}</span>
                  <Badge variant="secondary">{churnRescue.rescueScenario.successProbability}% muvaffaqiyat</Badge>
                </div>
                {churnRescue.rescueScenario.keyMessage && (
                  <div className="mt-2 p-2 bg-background rounded text-xs italic">
                    "{churnRescue.rescueScenario.keyMessage}"
                  </div>
                )}
              </div>

              {churnRescue.retentionOffer && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-xs font-medium text-green-700 dark:text-green-400">Taklif qilinadigan bonus:</div>
                  <div className="text-sm font-medium mt-1">{churnRescue.retentionOffer}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
