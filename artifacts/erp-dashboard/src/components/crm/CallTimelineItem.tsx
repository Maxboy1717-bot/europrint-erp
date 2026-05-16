/**
 * @module CallTimelineItem
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  Phone,
  Calendar,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { tLabel } from '@/lib/i18n/tLabel';
interface Call {
  id: number;
  direction: "incoming" | "outgoing";
  status: "answered" | "missed" | "busy" | "voicemail";
  phone: string;
  duration: number;
  recording?: string;
  createdAt: string;
  contactName?: string;
}

interface CallTimelineItemProps {
  call: Call;
  onCall?: (phone: string) => void;
  onSchedule?: (phone: string) => void;
  onPlayRecording?: (recordingUrl: string) => void;
}

const STATUS_CONFIG: Record<
  Call["status"],
  { label: string; variant: "success" | "error" | "warning" | "secondary" }
> = {
  answered: { label: tLabel('common.CallTimelineItem.tsx.untitled', "Отвечен"), variant: "success" },
  missed: { label: tLabel('common.CallTimelineItem.tsx.untitled', "Пропущен"), variant: "error" },
  busy: { label: tLabel('common.CallTimelineItem.tsx.untitled', "Занято"), variant: "warning" },
  voicemail: { label: tLabel('common.CallTimelineItem.tsx.untitled', "Голосовая почта"), variant: "secondary" },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} сек`;
  return `${mins} мин ${secs} сек`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}


export function CallTimelineItem({
  call,
  onCall,
  onSchedule,
  onPlayRecording,
}: CallTimelineItemProps) {
  const isIncoming = call.direction === "incoming";
  const isMissed = call.status === "missed";
  const statusConfig = STATUS_CONFIG[call.status];

  const CallIcon = isMissed
    ? PhoneMissed
    : isIncoming
      ? PhoneIncoming
      : PhoneOutgoing;

  const iconColorClass = isMissed
    ? "text-[var(--ep-red)]"
    : isIncoming
      ? "text-[var(--ep-green)]"
      : "text-[var(--ep-blue)]";

  return (
    <Card
      className="hover-elevate"
      data-testid={`call-timeline-item-${call.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "p-2 rounded-full bg-muted shrink-0",
              iconColorClass
            )}
          >
            <CallIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {isIncoming ? "Входящий" : "Исходящий"} звонок
                </span>
                <Badge variant={statusConfig.variant} data-testid="call-status-badge">
                  {statusConfig.label}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(call.createdAt)}</span>
                <span className="mx-1">|</span>
                <Clock className="h-3 w-3" />
                <span>{formatTime(call.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={`tel:${call.phone}`}
                className="text-[var(--ep-blue)] hover:underline font-medium"
                data-testid="call-phone-link"
              >
                {call.phone}
              </a>
              {call.contactName && (
                <span className="text-sm text-muted-foreground">
                  ({call.contactName})
                </span>
              )}
              {call.duration > 0 && (
                <span className="text-sm text-muted-foreground">
                  {formatDuration(call.duration)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-2">
              {call.recording && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onPlayRecording?.(call.recording ?? '')}
                  data-testid="button-play-recording"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Прослушать
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onCall?.(call.phone)}
                data-testid="button-call-back"
              >
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Позвонить
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSchedule?.(call.phone)}
                data-testid="button-schedule-call"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Запланировать
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
