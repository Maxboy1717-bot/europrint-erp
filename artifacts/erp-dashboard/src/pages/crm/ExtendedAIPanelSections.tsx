/**
 * @module ExtendedAIPanelSections
 * @description Panel section components for ExtendedAIPanel.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, TrendingUp, Mic, MessageCircle, UserMinus, ListChecks, Play, Zap, Send, RefreshCw, Bell, Pause, UserCog, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallAnalysis, ChurnData, AutoTask, SupervisorData } from "./ExtendedAIPanelTypes";
import { getSentimentColor, getPriorityColor } from "./ExtendedAIPanelTypes";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill, EPLoader } from "@/components/ep";
// ── Voice ──────────────────────────────────────────────────────────────────

interface VoicePanelProps { callTranscript: string; onTranscriptChange: (v: string) => void; onAnalyze: () => void; loading: boolean; callAnalysis: CallAnalysis | null; }

export function VoicePanel({callTranscript, onTranscriptChange, onAnalyze, loading, callAnalysis }: VoicePanelProps) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h4 className="font-medium flex items-center gap-2"><Mic className="h-5 w-5 text-primary" />Qo'ng'iroq tahlili</h4>
      <textarea className="w-full min-h-[100px] p-3 border rounded-lg text-sm resize-none" placeholder="Qo'ng'iroq matnini yoki qaydlarini kiriting..."
        value={callTranscript} onChange={(e) => onTranscriptChange(e.target.value)} data-testid="input-call-transcript" />
      <Button onClick={onAnalyze} disabled={loading} className="w-full" data-testid="btn-analyze-call">
        {loading ? <EPLoader className="mr-2" /> : <Play className="h-4 w-4 mr-2" />}Tahlil qilish
      </Button>
      {callAnalysis && (
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <Badge className={getSentimentColor(callAnalysis.sentiment)}>{callAnalysis.sentiment}</Badge>
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Sifat:</span><span className="font-bold">{callAnalysis.callQuality}%</span></div>
          </div>
          <p className="text-sm">{callAnalysis.summary}</p>
          {callAnalysis.keyPoints.length > 0 && (
            <div><h5 className="text-xs font-medium mb-1">Muhim nuqtalar:</h5>
              <ul className="text-xs space-y-1">{(Array.isArray(callAnalysis.keyPoints) ? callAnalysis.keyPoints : []).map((p, i) => (
                <li key={`k-${i}`} className="flex items-start gap-1"><span className="text-primary">•</span> {p}</li>))}</ul>
            </div>
          )}
          {callAnalysis.nextActions.length > 0 && (
            <div><h5 className="text-xs font-medium mb-1">Keyingi harakatlar:</h5>
              <ul className="text-xs space-y-1">{(Array.isArray(callAnalysis.nextActions) ? callAnalysis.nextActions : []).map((a, i) => (
                <li key={`a-${i}`} className="flex items-start gap-1"><span className="text-[var(--ep-green)]">→</span> {a}</li>))}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Chat ───────────────────────────────────────────────────────────────────

interface ChatPanelProps { chatMessage: string; onMessageChange: (v: string) => void; onSend: () => void; loading: boolean; chatResponse: { reply: string; intent: string; confidence: number } | null; }

export function ChatPanel({ chatMessage, onMessageChange, onSend, loading, chatResponse }: ChatPanelProps) {
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h4 className="font-medium flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" />AI Chat yordamchi</h4>
      <div className="flex gap-2">
        <Input placeholder="Mijoz xabarini kiriting..." value={chatMessage} onChange={(e) => onMessageChange(e.target.value)} data-testid="input-chat-message" />
        <Button onClick={onSend} disabled={loading} size="icon" data-testid="btn-send-chat">
          {loading ? <EPLoader /> : <Send className="h-4 w-4" />}
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
  );
}

// ── Churn ──────────────────────────────────────────────────────────────────

interface ChurnPanelProps { onAnalyze: () => void; loading: boolean; churnData: { summary: { highRisk: number; mediumRisk: number; lowRisk: number }; atRiskCustomers: ChurnData[] } | null; }

export function ChurnPanel({ onAnalyze, loading, churnData }: ChurnPanelProps) {
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h4 className="font-medium flex items-center gap-2"><UserMinus className="h-4 w-4 text-primary" />Churn tahlili</h4>
      <Button onClick={onAnalyze} disabled={loading} className="w-full" data-testid="btn-analyze-churn">
        {loading ? <EPLoader className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}Tahlil qilish
      </Button>
      {churnData && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { val: churnData.summary.highRisk, label: "Yuqori xavf", bg: "bg-red-100 dark:bg-red-900/30", tc: "text-[var(--ep-red)]" },
              { val: churnData.summary.mediumRisk, label: "O'rta xavf", bg: "bg-yellow-100 dark:bg-yellow-900/30", tc: "text-[var(--ep-yellow)]" },
              { val: churnData.summary.lowRisk, label: "Past xavf", bg: "bg-green-100 dark:bg-green-900/30", tc: "text-[var(--ep-green)]" },
            ].map(({ val, label, bg, tc }) => (
              <div key={label} className={`text-center p-2 ${bg} rounded`}>
                <div className={`text-lg font-bold ${tc}`}>{val}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(Array.isArray(churnData.atRiskCustomers) ? churnData.atRiskCustomers : []).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-background rounded border">
                <div>
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.daysSinceActivity} kun faoliyatsiz</div>
                </div>
                <Badge className={cn("text-white", c.churnRisk === "yuqori" ? "bg-red-500" : c.churnRisk === "o'rta" ? "bg-yellow-500" : "bg-green-500")}>{c.churnProbability}%</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AutoTasks ──────────────────────────────────────────────────────────────

interface AutoTasksPanelProps { onSuggest: () => void; onCreateAll: (tasks: AutoTask[]) => void; loading: boolean; suggestedTasks: AutoTask[]; }

export function AutoTasksPanel({ onSuggest, onCreateAll, loading, suggestedTasks }: AutoTasksPanelProps) {
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h4 className="font-medium flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" />Avtomatik vazifalar</h4>
      <Button onClick={onSuggest} disabled={loading} className="w-full" data-testid="btn-suggest-tasks">
        {loading ? <EPLoader className="mr-2" /> : <Zap className="h-4 w-4 mr-2" />}Vazifa taklif qilish
      </Button>
      {suggestedTasks.length > 0 && (
        <div className="space-y-3">
          {(Array.isArray(suggestedTasks) ? suggestedTasks : []).map((task, i) => (
            <div key={`t-${i}`} className="p-3 bg-background rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{task.title}</span>
                <Badge className={cn("text-white text-xs", getPriorityColor(task.priority))}>{task.priority}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground"><Clock className="h-3 w-3 inline mr-1" />{task.dueDate}</span>
                <Badge variant="outline" className="text-[10px]">{task.taskType}</Badge>
              </div>
            </div>
          ))}
          <Button onClick={() => onCreateAll(suggestedTasks)} disabled={loading} className="w-full" data-testid="btn-create-all-tasks">
            <Plus className="h-4 w-4 mr-2" />Barchasini yaratish
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Supervisor ─────────────────────────────────────────────────────────────

type SvItem = { id: number; title: string; hoursOverdue?: number; daysSinceActivity?: number; stage?: string; missingFields?: string[] };

function SupervisorList({ items, color, icon, label, renderBadge }: {
  items: SvItem[]; color: string; icon: React.ReactNode; label: string; renderBadge: (item: SvItem) => React.ReactNode;
}) {
  if (!items.length) return null;
  return (
    <div>
      <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${color}`}>{icon}{label}</div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {(Array.isArray(items) ? items : []).map((item) => (
          <div key={item.id} className={`flex items-center justify-between p-2 bg-background rounded border border-current/20`}>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{item.title}</div>
              {item.stage && <div className="text-xs text-muted-foreground">{item.stage}</div>}
              {item.missingFields && <div className="text-xs text-muted-foreground">{item.missingFields.slice(0, 3).join(", ")}{item.missingFields.length > 3 && ` +${item.missingFields.length - 3}`}</div>}
            </div>
            {renderBadge(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SupervisorPanelProps { onLoad: () => void; loading: boolean; supervisorData: SupervisorData | null; }

export function SupervisorPanel({ onLoad, loading, supervisorData }: SupervisorPanelProps) {
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h4 className="font-medium flex items-center gap-2"><UserCog className="h-4 w-4 text-primary" />{"AI nazoratchi paneli"}</h4>
      <Button onClick={onLoad} disabled={loading} className="w-full" data-testid="btn-load-supervisor">
        {loading ? <EPLoader className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}Yangilash
      </Button>
      {supervisorData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { val: supervisorData.stats.totalSLA, label: "SLA buzildi", bg: "bg-red-100 dark:bg-red-900/30", tc: "text-[var(--ep-red)]" },
              { val: supervisorData.stats.totalInactive, label: "Faoliyatsiz", bg: "bg-yellow-100 dark:bg-yellow-900/30", tc: "text-[var(--ep-yellow)]" },
              { val: supervisorData.stats.totalHygiene, label: "Gigiyena", bg: "bg-orange-100 dark:bg-orange-900/30", tc: "text-[var(--ep-primary)]" },
            ].map(({ val, label, bg, tc }) => (
              <div key={label} className={`text-center p-2 rounded ${bg}`}><div className={`text-lg font-bold ${tc}`}>{val}</div><div className="text-xs text-muted-foreground">{label}</div></div>
            ))}
          </div>
          <SupervisorList items={supervisorData.slaViolations} color="text-[var(--ep-red)]" icon={<Clock className="h-3 w-3" />} label="SLA buzilishlar"
            renderBadge={(i) => <EPStatusPill tone="danger" className="text-[10px] shrink-0 ml-2">{i.hoursOverdue} soat</EPStatusPill>} />
          <SupervisorList items={supervisorData.inactiveDeals} color="text-[var(--ep-yellow)]" icon={<Pause className="h-3 w-3" />} label="Faoliyatsiz bitimlar (3+ kun)"
            renderBadge={(i) => <EPStatusPill tone="neutral" className="text-[10px] shrink-0 ml-2">{i.daysSinceActivity} kun</EPStatusPill>} />
          <SupervisorList items={supervisorData.hygieneIssues} color="text-[var(--ep-primary)]" icon={<Bell className="h-3 w-3" />} label="CRM gigiyena muammolari"
            renderBadge={(i) => <Badge variant="outline" className="text-[10px] text-[var(--ep-primary)] shrink-0 ml-2">{i.missingFields?.length} maydon</Badge>} />
          {!supervisorData.slaViolations.length && !supervisorData.inactiveDeals.length && !supervisorData.hygieneIssues.length && (
            <div className="text-center py-4 text-[var(--ep-green)]">
              <TrendingUp className="h-8 w-8 mx-auto mb-2" />
              <div className="text-sm font-medium">Barcha ko'rsatkichlar yaxshi!</div>
              <div className="text-xs text-muted-foreground">Muammo topilmadi</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
