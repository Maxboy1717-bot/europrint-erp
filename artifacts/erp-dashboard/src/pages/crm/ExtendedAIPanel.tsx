import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Clock,
  Loader2,
  TrendingUp,
  Mic,
  MessageCircle,
  UserMinus,
  ListChecks,
  Play,
  Zap,
  Send,
  RefreshCw,
  Bell,
  Pause,
  UserCog,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { EntityType } from "./crm-types";

interface ExtendedAIPanelProps {
  entityType: EntityType;
  entityId: number;
}

interface CallAnalysis {
  sentiment: string;
  keyPoints: string[];
  customerNeeds: string[];
  objections: string[];
  nextActions: string[];
  callQuality: number;
  summary: string;
}

interface ChurnData {
  id: number;
  title: string;
  companyTitle: string | null;
  daysSinceActivity: number;
  churnRisk: string;
  churnProbability: number;
}

interface AutoTask {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  taskType: string;
}

interface SupervisorData {
  slaViolations: { id: number; title: string; hoursOverdue: number; type: string }[];
  inactiveDeals: { id: number; title: string; daysSinceActivity: number; stage: string }[];
  hygieneIssues: { id: number; title: string; missingFields: string[]; type: string }[];
  stats: { totalSLA: number; totalInactive: number; totalHygiene: number };
}

export function ExtendedAIPanel({ entityType, entityId }: ExtendedAIPanelProps) {
  const [activePanel, setActivePanel] = useState<"voice" | "chat" | "churn" | "autotasks" | "supervisor">("voice");
  const { toast } = useToast();

  const [voiceLoading, setVoiceLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [churnLoading, setChurnLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [supervisorLoading, setSupervisorLoading] = useState(false);

  const [callTranscript, setCallTranscript] = useState("");
  const [callAnalysis, setCallAnalysis] = useState<CallAnalysis | null>(null);

  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState<{ reply: string; intent: string; confidence: number } | null>(null);

  const [churnData, setChurnData] = useState<{ summary: { highRisk: number; mediumRisk: number; lowRisk: number }; atRiskCustomers: ChurnData[] } | null>(null);

  const [suggestedTasks, setSuggestedTasks] = useState<AutoTask[]>([]);

  const [supervisorData, setSupervisorData] = useState<SupervisorData | null>(null);

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === "ijobiy") return "text-green-500";
    if (sentiment === "salbiy") return "text-red-500";
    return "text-yellow-500";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "yuqori") return "bg-red-500";
    if (priority === "o'rta") return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!entityId || entityId <= 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Kengaytirilgan AI uchun avval elementni tanlang
      </div>
    );
  }

  if (entityType !== "leads" && entityType !== "deals") {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Kengaytirilgan AI faqat lidlar va bitimlar uchun mavjud
      </div>
    );
  }

  const analyzeCall = async () => {
    if (!callTranscript.trim()) {
      toast({ title: "Qo'ng'iroq matnini kiriting", variant: "destructive" });
      return;
    }
    setVoiceLoading(true);
    try {
      const data = await apiRequest<{ analysis: CallAnalysis }>("POST", "/api/crm/ai/extended/voice/analyze-call", { 
        transcript: callTranscript, 
        leadId: entityType === "leads" ? entityId : undefined 
      });
      setCallAnalysis(data.analysis);
      toast({ title: "Qo'ng'iroq tahlil qilindi" });
    } catch (err) {
      toast({ title: "Tahlil xatolik", variant: "destructive" });
    } finally {
      setVoiceLoading(false);
    }
  };

  const getChatResponse = async () => {
    if (!chatMessage.trim()) return;
    setChatLoading(true);
    try {
      const data = await apiRequest<{ reply: string; intent: string; confidence: number }>("POST", "/api/crm/ai/extended/chat/respond", { 
        message: chatMessage 
      });
      setChatResponse({ reply: data.reply, intent: data.intent, confidence: data.confidence });
    } catch (err) {
      toast({ title: "Chat xatolik", variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  const analyzeChurn = async () => {
    setChurnLoading(true);
    try {
      const data = await apiRequest<{ summary: { highRisk: number; mediumRisk: number; lowRisk: number }; atRiskCustomers: ChurnData[] }>("GET", "/api/crm/ai/extended/churn/analyze");
      setChurnData(data);
    } catch (err) {
      toast({ title: "Churn tahlil xatolik", variant: "destructive" });
    } finally {
      setChurnLoading(false);
    }
  };

  const suggestTasks = async () => {
    setTaskLoading(true);
    try {
      const data = await apiRequest<{ suggestedTasks: AutoTask[] }>("POST", "/api/crm/ai/extended/auto-tasks/suggest", { 
        entityType: entityType === "leads" ? "lead" : "deal", 
        entityId 
      });
      setSuggestedTasks(data.suggestedTasks || []);
    } catch (err) {
      toast({ title: "Vazifa taklif xatolik", variant: "destructive" });
    } finally {
      setTaskLoading(false);
    }
  };

  const createTasks = async (tasksToCreate: AutoTask[]) => {
    setTaskLoading(true);
    try {
      const data = await apiRequest<{ created: number }>("POST", "/api/crm/ai/extended/auto-tasks/create", { 
        entityType: entityType === "leads" ? "lead" : "deal", 
        entityId,
        tasks: tasksToCreate,
      });
      toast({ title: `${data.created} ta vazifa yaratildi` });
      setSuggestedTasks([]);
    } catch (err) {
      toast({ title: "Vazifa yaratish xatolik", variant: "destructive" });
    } finally {
      setTaskLoading(false);
    }
  };

  const loadSupervisorDashboard = async () => {
    setSupervisorLoading(true);
    try {
      const data = await apiRequest<SupervisorData>("GET", "/api/crm/ai/supervisor-dashboard");
      setSupervisorData(data);
    } catch (err) {
      toast({ title: "Supervisor ma'lumotlarni olishda xatolik", variant: "destructive" });
    } finally {
      setSupervisorLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap">
        <Button 
          variant={activePanel === "supervisor" ? "default" : "outline"}
          size="sm"
          onClick={() => setActivePanel("supervisor")}
          data-testid="btn-supervisor-ai"
        >
          <UserCog className="h-4 w-4 mr-1" />
          Supervisor
        </Button>
        <Button 
          variant={activePanel === "voice" ? "default" : "outline"}
          size="sm"
          onClick={() => setActivePanel("voice")}
          data-testid="btn-voice-ai"
        >
          <Mic className="h-4 w-4 mr-1" />
          Ovoz
        </Button>
        <Button 
          variant={activePanel === "chat" ? "default" : "outline"}
          size="sm"
          onClick={() => setActivePanel("chat")}
          data-testid="btn-chat-ai"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Chat
        </Button>
        <Button 
          variant={activePanel === "churn" ? "default" : "outline"}
          size="sm"
          onClick={() => setActivePanel("churn")}
          data-testid="btn-churn-ai"
        >
          <UserMinus className="h-4 w-4 mr-1" />
          Churn
        </Button>
        <Button 
          variant={activePanel === "autotasks" ? "default" : "outline"}
          size="sm"
          onClick={() => setActivePanel("autotasks")}
          data-testid="btn-autotasks-ai"
        >
          <ListChecks className="h-4 w-4 mr-1" />
          Vazifalar
        </Button>
      </div>

      {/* Voice AI Panel */}
      {activePanel === "voice" && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Qo'ng'iroq tahlili
          </h4>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-lg text-sm resize-none"
            placeholder="Qo'ng'iroq matnini yoki qaydlarini kiriting..."
            value={callTranscript}
            onChange={(e) => setCallTranscript(e.target.value)}
            data-testid="input-call-transcript"
          />
          <Button onClick={analyzeCall} disabled={voiceLoading} className="w-full" data-testid="btn-analyze-call">
            {voiceLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Tahlil qilish
          </Button>

          {callAnalysis && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Badge className={getSentimentColor(callAnalysis.sentiment)}>
                  {callAnalysis.sentiment}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sifat:</span>
                  <span className="font-bold">{callAnalysis.callQuality}%</span>
                </div>
              </div>
              <p className="text-sm">{callAnalysis.summary}</p>
              {callAnalysis.keyPoints.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium mb-1">Muhim nuqtalar:</h5>
                  <ul className="text-xs space-y-1">
                    {(Array.isArray(callAnalysis.keyPoints) ? callAnalysis.keyPoints : []).map((p, i) => (
                      <li key={`k-${i}`} className="flex items-start gap-1">
                        <span className="text-primary">•</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {callAnalysis.nextActions.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium mb-1">Keyingi harakatlar:</h5>
                  <ul className="text-xs space-y-1">
                    {(Array.isArray(callAnalysis.nextActions) ? callAnalysis.nextActions : []).map((a, i) => (
                      <li key={`k-${i}`} className="flex items-start gap-1">
                        <span className="text-green-500">→</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chat AI Panel */}
      {activePanel === "chat" && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            AI Chat yordamchi
          </h4>
          <div className="flex gap-2">
            <Input
              placeholder="Mijoz xabarini kiriting..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              data-testid="input-chat-message"
            />
            <Button onClick={getChatResponse} disabled={chatLoading} size="icon" data-testid="btn-send-chat">
              {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {chatResponse && (
            <div className="space-y-2 p-3 bg-background rounded-lg border">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{chatResponse.intent}</Badge>
                <span className="text-xs text-muted-foreground">{chatResponse.confidence}% ishonch</span>
              </div>
              <p className="text-sm">{chatResponse.reply}</p>
            </div>
          )}
        </div>
      )}

      {/* Churn Panel */}
      {activePanel === "churn" && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-primary" />
            Churn tahlili
          </h4>
          <Button onClick={analyzeChurn} disabled={churnLoading} className="w-full" data-testid="btn-analyze-churn">
            {churnLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Tahlil qilish
          </Button>

          {churnData && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
                  <div className="text-lg font-bold text-red-600">{churnData.summary.highRisk}</div>
                  <div className="text-xs text-muted-foreground">Yuqori xavf</div>
                </div>
                <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                  <div className="text-lg font-bold text-yellow-600">{churnData.summary.mediumRisk}</div>
                  <div className="text-xs text-muted-foreground">O'rta xavf</div>
                </div>
                <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
                  <div className="text-lg font-bold text-green-600">{churnData.summary.lowRisk}</div>
                  <div className="text-xs text-muted-foreground">Past xavf</div>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(Array.isArray(churnData.atRiskCustomers) ? churnData.atRiskCustomers : []).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div>
                      <div className="text-sm font-medium">{customer.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.daysSinceActivity} kun faoliyatsiz
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-white",
                      customer.churnRisk === "yuqori" ? "bg-red-500" :
                      customer.churnRisk === "o'rta" ? "bg-yellow-500" : "bg-green-500"
                    )}>
                      {customer.churnProbability}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto Tasks Panel */}
      {activePanel === "autotasks" && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Avtomatik vazifalar
          </h4>
          <Button onClick={suggestTasks} disabled={taskLoading} className="w-full" data-testid="btn-suggest-tasks">
            {taskLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Vazifa taklif qilish
          </Button>

          {suggestedTasks.length > 0 && (
            <div className="space-y-3">
              {(Array.isArray(suggestedTasks) ? suggestedTasks : []).map((task, i) => (
                <div key={`k-${i}`} className="p-3 bg-background rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{task.title}</span>
                    <Badge className={cn("text-white text-xs", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {task.dueDate}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{task.taskType}</Badge>
                  </div>
                </div>
              ))}
              <Button 
                onClick={() => createTasks(suggestedTasks)} 
                disabled={taskLoading}
                className="w-full"
                data-testid="btn-create-all-tasks"
              >
                <Plus className="h-4 w-4 mr-2" />
                Barchasini yaratish
              </Button>
            </div>
          )}
        </div>
      )}

      {/* AI Supervisor Dashboard Panel */}
      {activePanel === "supervisor" && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            AI Supervisor Dashboard
          </h4>
          <Button onClick={loadSupervisorDashboard} disabled={supervisorLoading} className="w-full" data-testid="btn-load-supervisor">
            {supervisorLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Yangilash
          </Button>

          {supervisorData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
                  <div className="text-lg font-bold text-red-600">{supervisorData.stats.totalSLA}</div>
                  <div className="text-xs text-muted-foreground">SLA buzildi</div>
                </div>
                <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                  <div className="text-lg font-bold text-yellow-600">{supervisorData.stats.totalInactive}</div>
                  <div className="text-xs text-muted-foreground">Faoliyatsiz</div>
                </div>
                <div className="text-center p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
                  <div className="text-lg font-bold text-orange-600">{supervisorData.stats.totalHygiene}</div>
                  <div className="text-xs text-muted-foreground">Gigiyena</div>
                </div>
              </div>

              {supervisorData.slaViolations.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2 flex items-center gap-1 text-red-600">
                    <Clock className="h-3 w-3" />
                    SLA buzilishlar
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(Array.isArray(supervisorData.slaViolations) ? supervisorData.slaViolations : []).map((item) => (
                      <div key={`sla-${item.id}`} className="flex items-center justify-between p-2 bg-background rounded border border-red-200 dark:border-red-800">
                        <div className="text-sm truncate flex-1">{item.title}</div>
                        <Badge variant="destructive" className="text-[10px] shrink-0 ml-2">
                          {item.hoursOverdue} soat
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {supervisorData.inactiveDeals.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2 flex items-center gap-1 text-yellow-600">
                    <Pause className="h-3 w-3" />
                    Faoliyatsiz bitimlar (3+ kun)
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(Array.isArray(supervisorData.inactiveDeals) ? supervisorData.inactiveDeals : []).map((item) => (
                      <div key={`inactive-${item.id}`} className="flex items-center justify-between p-2 bg-background rounded border border-yellow-200 dark:border-yellow-800">
                        <div>
                          <div className="text-sm truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.stage}</div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                          {item.daysSinceActivity} kun
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {supervisorData.hygieneIssues.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2 flex items-center gap-1 text-orange-600">
                    <Bell className="h-3 w-3" />
                    CRM gigiyena muammolari
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(Array.isArray(supervisorData.hygieneIssues) ? supervisorData.hygieneIssues : []).map((item) => (
                      <div key={`hygiene-${item.id}`} className="flex items-center justify-between p-2 bg-background rounded border border-orange-200 dark:border-orange-800">
                        <div>
                          <div className="text-sm truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.missingFields.slice(0, 3).join(", ")}
                            {item.missingFields.length > 3 && `... +${item.missingFields.length - 3}`}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-orange-500 shrink-0 ml-2">
                          {item.missingFields.length} maydon
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {supervisorData.slaViolations.length === 0 && 
               supervisorData.inactiveDeals.length === 0 && 
               supervisorData.hygieneIssues.length === 0 && (
                <div className="text-center py-4 text-green-600">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Barcha ko'rsatkichlar yaxshi!</div>
                  <div className="text-xs text-muted-foreground">Muammo topilmadi</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
