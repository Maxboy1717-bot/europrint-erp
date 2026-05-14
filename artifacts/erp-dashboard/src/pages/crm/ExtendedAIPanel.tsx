/**
 * @module ExtendedAIPanel
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MessageCircle, UserMinus, ListChecks, UserCog } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EntityType } from "./crm-types";
import type {
  ActivePanel,
  CallAnalysis,
  AutoTask,
  SupervisorData,
} from "./ExtendedAIPanelTypes";
import {
  VoicePanel,
  ChatPanel,
  ChurnPanel,
  AutoTasksPanel,
  SupervisorPanel,
} from "./ExtendedAIPanelSections";

interface ExtendedAIPanelProps {
  entityType: EntityType;
  entityId: number;
}

export function ExtendedAIPanel({ entityType, entityId }: ExtendedAIPanelProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>("voice");
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

  const [churnData, setChurnData] = useState<{
    summary: { highRisk: number; mediumRisk: number; lowRisk: number };
    atRiskCustomers: import("./ExtendedAIPanelTypes").ChurnData[];
  } | null>(null);

  const [suggestedTasks, setSuggestedTasks] = useState<AutoTask[]>([]);
  const [supervisorData, setSupervisorData] = useState<SupervisorData | null>(null);

  if (!entityId || entityId <= 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Kengaytirilgan AI uchun avval elementni tanlang
      </div>
    );
  }

  if (entityType !== "leads" && entityType !== "deals") {
    return (
      <div className="text-center py-8 text-[13px] text-muted-foreground">
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
        leadId: entityType === "leads" ? entityId : undefined,
      });
      setCallAnalysis(data.analysis);
      toast({ title: "Qo'ng'iroq tahlil qilindi" });
    } catch {
      toast({ title: "Tahlil xatolik", variant: "destructive" });
    } finally {
      setVoiceLoading(false);
    }
  };

  const getChatResponse = async () => {
    if (!chatMessage.trim()) return;
    setChatLoading(true);
    try {
      const data = await apiRequest<{ reply: string; intent: string; confidence: number }>(
        "POST", "/api/crm/ai/extended/chat/respond", { message: chatMessage }
      );
      setChatResponse({ reply: data.reply, intent: data.intent, confidence: data.confidence });
    } catch {
      toast({ title: "Chat xatolik", variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  const analyzeChurn = async () => {
    setChurnLoading(true);
    try {
      const data = await apiRequest<{
        summary: { highRisk: number; mediumRisk: number; lowRisk: number };
        atRiskCustomers: import("./ExtendedAIPanelTypes").ChurnData[];
      }>("GET", "/api/crm/ai/extended/churn/analyze");
      setChurnData(data);
    } catch {
      toast({ title: "Churn tahlil xatolik", variant: "destructive" });
    } finally {
      setChurnLoading(false);
    }
  };

  const suggestTasks = async () => {
    setTaskLoading(true);
    try {
      const data = await apiRequest<{ suggestedTasks: AutoTask[] }>(
        "POST", "/api/crm/ai/extended/auto-tasks/suggest", {
          entityType: entityType === "leads" ? "lead" : "deal",
          entityId,
        }
      );
      setSuggestedTasks(data.suggestedTasks || []);
    } catch {
      toast({ title: "Vazifa taklif xatolik", variant: "destructive" });
    } finally {
      setTaskLoading(false);
    }
  };

  const createTasks = async (tasksToCreate: AutoTask[]) => {
    setTaskLoading(true);
    try {
      const data = await apiRequest<{ created: number }>(
        "POST", "/api/crm/ai/extended/auto-tasks/create", {
          entityType: entityType === "leads" ? "lead" : "deal",
          entityId,
          tasks: tasksToCreate,
        }
      );
      toast({ title: `${data.created} ta vazifa yaratildi` });
      setSuggestedTasks([]);
    } catch {
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
    } catch {
      toast({ title: "Supervisor ma'lumotlarni olishda xatolik", variant: "destructive" });
    } finally {
      setSupervisorLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap">
        <Button variant={activePanel === "supervisor" ? "default" : "outline"} size="sm"
          onClick={() => setActivePanel("supervisor")} data-testid="btn-supervisor-ai">
          <UserCog className="h-4 w-4 mr-1" />Supervisor
        </Button>
        <Button variant={activePanel === "voice" ? "default" : "outline"} size="sm"
          onClick={() => setActivePanel("voice")} data-testid="btn-voice-ai">
          <Mic className="h-4 w-4 mr-1" />Ovoz
        </Button>
        <Button variant={activePanel === "chat" ? "default" : "outline"} size="sm"
          onClick={() => setActivePanel("chat")} data-testid="btn-chat-ai">
          <MessageCircle className="h-4 w-4 mr-1" />Chat
        </Button>
        <Button variant={activePanel === "churn" ? "default" : "outline"} size="sm"
          onClick={() => setActivePanel("churn")} data-testid="btn-churn-ai">
          <UserMinus className="h-4 w-4 mr-1" />Churn
        </Button>
        <Button variant={activePanel === "autotasks" ? "default" : "outline"} size="sm"
          onClick={() => setActivePanel("autotasks")} data-testid="btn-autotasks-ai">
          <ListChecks className="h-4 w-4 mr-1" />Vazifalar
        </Button>
      </div>

      {activePanel === "voice" && (
        <VoicePanel
          callTranscript={callTranscript}
          onTranscriptChange={setCallTranscript}
          onAnalyze={analyzeCall}
          loading={voiceLoading}
          callAnalysis={callAnalysis}
        />
      )}
      {activePanel === "chat" && (
        <ChatPanel
          chatMessage={chatMessage}
          onMessageChange={setChatMessage}
          onSend={getChatResponse}
          loading={chatLoading}
          chatResponse={chatResponse}
        />
      )}
      {activePanel === "churn" && (
        <ChurnPanel
          onAnalyze={analyzeChurn}
          loading={churnLoading}
          churnData={churnData}
        />
      )}
      {activePanel === "autotasks" && (
        <AutoTasksPanel
          onSuggest={suggestTasks}
          onCreateAll={createTasks}
          loading={taskLoading}
          suggestedTasks={suggestedTasks}
        />
      )}
      {activePanel === "supervisor" && (
        <SupervisorPanel
          onLoad={loadSupervisorDashboard}
          loading={supervisorLoading}
          supervisorData={supervisorData}
        />
      )}
    </div>
  );
}
