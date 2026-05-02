import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Attendee {
  id: string;
  name: string;
  email?: string;
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location?: string;
  meetingType?: "online" | "offline" | "phone";
  attendees: Attendee[];
  status: "scheduled" | "completed" | "cancelled" | "pending";
  description?: string;
  meetingLink?: string;
}

interface MeetingCardProps {
  meeting: Meeting;
  onMarkCompleted?: (meetingId: number) => void;
  onMarkCancelled?: (meetingId: number) => void;
  onOpen?: (meetingId: number) => void;
}

const STATUS_CONFIG: Record<
  Meeting["status"],
  { label: string; variant: "info" | "success" | "error" | "warning" }
> = {
  scheduled: { label: "Запланирована", variant: "info" },
  completed: { label: "Состоялась", variant: "success" },
  cancelled: { label: "Отменена", variant: "error" },
  pending: { label: "Ожидает подтверждения", variant: "warning" },
};

const MEETING_TYPE_LABELS: Record<string, string> = {
  online: "Онлайн",
  offline: "Встреча",
  phone: "Телефон",
};


export function MeetingCard({
  meeting,
  onMarkCompleted,
  onMarkCancelled,
  onOpen,
}: MeetingCardProps) {
  const statusConfig = STATUS_CONFIG[meeting.status];
  const isPast = new Date(`${meeting.date}T${meeting.time}`) < new Date();
  const canChangeStatus =
    meeting.status === "scheduled" || meeting.status === "pending";

  return (
    <Card className="hover-elevate" data-testid={`meeting-card-${meeting.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "p-3 rounded-lg shrink-0",
              "bg-blue-500/10 text-blue-500"
            )}
          >
            <Calendar className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h4 className="font-semibold text-sm line-clamp-1">
                  {meeting.title}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={statusConfig.variant} data-testid="meeting-status-badge">
                    {statusConfig.label}
                  </Badge>
                  {meeting.meetingType && (
                    <Badge variant="secondary" className="text-xs">
                      {MEETING_TYPE_LABELS[meeting.meetingType] ||
                        meeting.meetingType}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDate(meeting.date)}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {meeting.time}
                  {meeting.endTime && ` - ${meeting.endTime}`}
                </span>
              </div>

              {meeting.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{meeting.location}</span>
                </div>
              )}

              {meeting.attendees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex items-center -space-x-2">
                    {(Array.isArray(meeting?.attendees) ? meeting.attendees : []).slice(0, 4).map((attendee) => (
                      <Avatar
                        key={attendee.id}
                        className="h-6 w-6 border-2 border-background"
                      >
                        <AvatarFallback className="text-[10px] bg-purple-500 text-white">
                          {attendee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {meeting.attendees.length > 4 && (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                        +{meeting.attendees.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground ml-1">
                    {meeting.attendees.length} участник(ов)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
              {canChangeStatus && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-500/40 hover:bg-green-500/10"
                    onClick={() => onMarkCompleted?.(meeting.id)}
                    data-testid="button-mark-completed"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Состоялась
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-500/40 hover:bg-red-500/10"
                    onClick={() => onMarkCancelled?.(meeting.id)}
                    data-testid="button-mark-cancelled"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Не состоялась
                  </Button>
                </>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpen?.(meeting.id)}
                data-testid="button-open-meeting"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Открыть
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
