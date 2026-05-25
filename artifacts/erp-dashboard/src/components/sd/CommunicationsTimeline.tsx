/**
 * @module CommunicationsTimeline
 * @description Timeline list of communication interactions for CommunicationsTab.
 * Split from CommunicationsTab.tsx (Rule 16).
 */

import { Phone, Mail, Users, FileText, MessageSquare, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "./helpers";
import { useTranslation } from '@/lib/i18n';

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone, email: Mail, meeting: Users, note: FileText, chat: MessageSquare,
};
const TYPE_LABEL: Record<string, string> = {
  call: "Qo'ng'iroq", email: "Email", meeting: "Uchrashuv", note: "Izoh", chat: "Chat",
};
const TYPE_COLOR: Record<string, string> = {
  call:    "bg-sky-100 text-[var(--ep-blue)] dark:bg-sky-900/40 dark:text-sky-300",
  email:   "bg-violet-100 text-[var(--ep-purple)] dark:bg-violet-900/40 dark:text-violet-300",
  meeting: "bg-emerald-100 text-[var(--ep-green)] dark:bg-emerald-900/40 dark:text-emerald-300",
  note:    "bg-amber-100 text-[var(--ep-yellow)] dark:bg-amber-900/40 dark:text-amber-300",
  chat:    "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

interface TimelineItem {
  id: string | number;
  type: string;
  subject?: string;
  notes?: string;
  description?: string;
  direction?: 'in' | 'out';
  employeeName?: string;
  outcome?: string;
  next_action?: string;
  next_action_date?: string | null;
  interaction_date?: string | null;
  interactionDate?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

interface CommunicationsTimelineProps {
  items: TimelineItem[];
}

export function CommunicationsTimeline({ items }: CommunicationsTimelineProps) {
  const { t } = useTranslation("common");

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground text-sm">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
        {t("muloqotTarixiYoq")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = TYPE_ICON[item.type] || MessageSquare;
        const color = TYPE_COLOR[item.type] || TYPE_COLOR.note;
        return (
          <div key={item.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{String(item.subject || item.notes || "Muloqot")}</span>
                  <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[item.type] || item.type}</Badge>
                  {item.direction && (
                    <Badge variant="outline" className="text-[10px]">
                      {item.direction === "in" ? "Kiruvchi" : "Chiquvchi"}
                    </Badge>
                  )}
                </div>
                {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                {item.notes && item.notes !== item.subject
                  ? <p className="text-xs text-muted-foreground mt-1">{String(item.notes)}</p>
                  : null}
                {item.employeeName && item.employeeName.trim() && (
                  <p className="text-[11px] text-muted-foreground mt-1">Xodim: {item.employeeName}</p>
                )}
                {item.outcome && (
                  <p className="text-xs mt-1">
                    <span className="text-muted-foreground">{t("natija1")}</span>{item.outcome}
                  </p>
                )}
                {item.next_action && (
                  <p className="text-xs mt-1.5 text-[var(--ep-yellow)] dark:text-amber-400">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Keyingi: {item.next_action} — {fmtDate(item.next_action_date)}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {fmtDate((item.interaction_date || item.interactionDate || item.createdAt || item.created_at) as string | null | undefined)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
